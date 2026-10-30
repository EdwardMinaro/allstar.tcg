(function(){
  async function firestoreTools(){
    const services = await window.AllstarFirebaseService.firebaseServices();
    const firestore = services.modules.firestore;
    return {
      db: services.firestore,
      doc: firestore.doc,
      getDoc: firestore.getDoc,
      getDocFromServer: firestore.getDocFromServer,
      runTransaction: firestore.runTransaction,
      setDoc: firestore.setDoc,
      serverTimestamp: firestore.serverTimestamp
    };
  }

  async function savePlayerData(){
    throw Object.assign(new Error("Écriture de progression sans contrôle interdite. Utilisez commitProgression."),{code:"allstar/unsafe-save"});
  }

  async function loadPlayerData(uid){
    const {db, doc, getDocFromServer} = await firestoreTools();
    const snap = await getDocFromServer(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  // Compare the actual progression as well as the revision: older PC builds
  // do not increment revisions, but their writes must still cause a conflict.
  function progressionToken(data){
    function stable(value){
      if(Array.isArray(value))return value.map(stable);
      if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
      return value;
    }
    return JSON.stringify(stable({playerState:data?.playerState||null,deckState:data?.deckState||null,collection:data?.collection||null,decks:data?.decks||null}));
  }

  function migrationProfileToken(data){
    const fields=["level","xp","totalXp","titles","careerXpWins","levelRewards","matchSettlements","onlineMatchSettlements","accountRecoveryReceipts"];
    return progressionToken({playerState:Object.fromEntries(fields.map(key=>[key,data?.[key]??null]))});
  }
  function protectionError(message){return Object.assign(new Error(message),{code:"allstar/save-protection"});}
  function validateProgression(data){
    const player=data?.playerState,decks=data?.deckState;
    const counts=player?.collection;
    if(!player||!counts||Array.isArray(counts)||typeof counts!=="object"||
      !Number.isSafeInteger(player.credits)||player.credits<0||
      !Number.isSafeInteger(player.careerUnlocked??0)||(player.careerUnlocked??0)<0||
      Object.values(counts).some(n=>!Number.isSafeInteger(n)||n<0)||
      !Array.isArray(decks?.decks)||decks.decks.some(deck=>!Array.isArray(deck?.cards)||deck.cards.some(key=>typeof key!=="string"))){
      throw protectionError("Sauvegarde incomplète ou invalide : la progression du compte a été conservée.");
    }
    if(data.collection&&progressionToken({collection:data.collection})!==progressionToken({collection:counts}))throw protectionError("Collection incohérente : sauvegarde interrompue.");
    if(data.decks&&progressionToken({deckState:data.decks})!==progressionToken({deckState:decks}))throw protectionError("Decks incohérents : sauvegarde interrompue.");
  }
  function regressionReason(before,after,knownCard=()=>true){
    if(!before)return "";
    if(Number(after?.careerUnlocked||0)<Number(before.careerUnlocked||0))return "La progression de carrière diminuerait.";
    if(Object.entries(before.collection||{}).some(([key,n])=>knownCard(key)&&Number(n)>Number(after?.collection?.[key]||0)))return "Des cartes possédées disparaîtraient.";
    return "";
  }
  function recoveryPoint(uid,data,revision){
    const player=data?.playerState;
    if(!player)return null;
    const copy=JSON.parse(JSON.stringify(player));
    // Profile documents from older releases can contain nested save documents.
    delete copy.profileProgress;
    const profile={};
    for(const key of ["level","xp","totalXp","elo","bestElo","wins","losses","rankedMatches","rankedLossStreak","rankProtection","currentStreak","bestStreak","bestRank","hallOfFame","title","titles","careerXpWins","levelRewards","matchSettlements","onlineMatchSettlements"]){
      if(data[key]!==undefined)profile[key]=data[key];
      else if(player.profileProgress?.[key]!==undefined)profile[key]=player.profileProgress[key];
    }
    copy.profileProgress=profile;
    return {accountUid:uid,revision,capturedAt:Date.now(),playerState:copy,deckState:JSON.parse(JSON.stringify(data.deckState||data.decks||{decks:[]}))};
  }
  function meaningful(point){
    if(!point)return "";
    const player={...point.playerState},decks={...point.deckState};
    delete player.savedAt;delete decks.savedAt;
    return progressionToken({playerState:player,deckState:decks});
  }
  function nextRecoveryHistory(uid,current,data){
    const existing=current?.cloudSaveHistory;
    if(existing&&(existing.schema!==1||existing.accountUid!==uid||!existing.baseline||!Array.isArray(existing.recent)||[existing.baseline,...existing.recent].some(point=>point.accountUid!==uid||!point.playerState)))throw protectionError("Historique de secours invalide : sauvegarde interrompue.");
    const previous=recoveryPoint(uid,current,Number(current?.cloudSaveRevision)||0);
    const next=recoveryPoint(uid,data,(Number(current?.cloudSaveRevision)||0)+1);
    const history=existing?JSON.parse(JSON.stringify(existing)):{schema:1,accountUid:uid,baseline:previous||next,recent:[]};
    if(previous&&meaningful(previous)!==meaningful(next)&&meaningful(previous)!==meaningful(history.baseline)&&meaningful(previous)!==meaningful(history.recent.at(-1)))history.recent.push(previous);
    while(history.recent.length>5)history.recent.shift();
    const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).length;
    while(bytes(history)>400000&&history.recent.length>1)history.recent.shift();
    if(bytes(history)>400000)throw protectionError("La copie de secours ne peut pas être conservée intégralement. Sauvegarde interrompue.");
    return history;
  }
  async function commitProgression(uid,data,expectedToken,expectedProfileToken=null){
    if(typeof expectedToken!=="string")throw protectionError("Chargement du compte requis avant toute sauvegarde.");
    validateProgression(data);
    const {db,doc,runTransaction,serverTimestamp}=await firestoreTools();
    return runTransaction(db,async transaction=>{
      const target=doc(db,"users",uid);
      const snapshot=await transaction.get(target);
      const current=snapshot.exists()?snapshot.data():null;
      if(progressionToken(current)!==expectedToken||(expectedProfileToken!==null&&migrationProfileToken(current)!==expectedProfileToken)){
        const error=new Error("La progression du compte a changé sur un autre appareil.");
        error.code="allstar/save-conflict";
        throw error;
      }
      // Collection and career only grow during ordinary play. Replacements
      // require the separately reviewed recovery flow and its profile token.
      const regression=regressionReason(current?.playerState,data.playerState);
      if(regression&&expectedProfileToken===null)throw protectionError(regression+" La sauvegarde du compte est conservée.");
      const history=nextRecoveryHistory(uid,current,data);
      const next={...data,cloudSaveHistory:history,cloudSaveRevision:(Number(current?.cloudSaveRevision)||0)+1,updatedAt:serverTimestamp()};
      if(new TextEncoder().encode(JSON.stringify({...current,...next})).length>750000)throw protectionError("La sauvegarde et ses copies de secours dépassent la taille autorisée. Aucune progression n’a été remplacée.");
      // update replaces the complete maps, including spent tickets/deleted decks.
      if(snapshot.exists())transaction.update(target,next);
      else transaction.set(target,next);
      return progressionToken(data);
    });
  }

  async function saveDecks(uid, decks){
    return savePlayerData(uid, {decks: decks || {}});
  }

  async function loadDecks(uid){
    return (await loadPlayerData(uid))?.decks || {};
  }

  async function saveCollection(uid, collection){
    return savePlayerData(uid, {collection: collection || {}});
  }

  async function loadCollection(uid){
    return (await loadPlayerData(uid))?.collection || {};
  }

  window.AllstarSaveService = {
    savePlayerData,
    loadPlayerData,
    progressionToken,
    commitProgression,
    migrationProfileToken,
    regressionReason,
    saveDecks,
    loadDecks,
    saveCollection,
    loadCollection
  };
})();
