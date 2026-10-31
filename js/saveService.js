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
    const fields=["level","xp","totalXp","titles","careerXpWins","levelRewards","matchSettlements","onlineMatchSettlements","accountRecoveryReceipts","saveLinkVerified","pendingPcTransfer","campaignRewards"];
    return progressionToken({playerState:Object.fromEntries(fields.map(key=>[key,data?.[key]??null]))});
  }
  function protectionError(message){return Object.assign(new Error(message),{code:"allstar/save-protection"});}
  function isAccountLinkComplete(data){
    return data?.saveLinkVerified?.schema===1&&["new-mobile-account","new-account-confirmed","player-confirmed","pc-import","reviewed-recovery"].includes(data.saveLinkVerified.source);
  }
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
  function nextRecoveryHistory(uid,current,data,verifiedReplacement=false){
    const existing=current?.cloudSaveHistory;
    if(existing&&(existing.schema!==1||existing.accountUid!==uid||!existing.baseline||!Array.isArray(existing.recent)||[existing.baseline,...existing.recent,...(existing.verifiedSource?[existing.verifiedSource]:[])].some(point=>point.accountUid!==uid||!point.playerState)))throw protectionError("Historique de secours invalide : sauvegarde interrompue.");
    const previous=recoveryPoint(uid,current,Number(current?.cloudSaveRevision)||0);
    const next=recoveryPoint(uid,data,(Number(current?.cloudSaveRevision)||0)+1);
    const history=existing?JSON.parse(JSON.stringify(existing)):{schema:1,accountUid:uid,baseline:previous||next,recent:[]};
    if(verifiedReplacement&&!history.verifiedSource&&next)history.verifiedSource=next;
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
      const history=nextRecoveryHistory(uid,current,data,expectedProfileToken!==null);
      const next={...data,cloudSaveHistory:history,cloudSaveRevision:(Number(current?.cloudSaveRevision)||0)+1,updatedAt:serverTimestamp()};
      if(current?.pendingPcTransfer&&expectedProfileToken===null&&meaningful(recoveryPoint(uid,current,0))!==meaningful(recoveryPoint(uid,data,0)))next.pendingPcTransfer=null;
      if(new TextEncoder().encode(JSON.stringify({...current,...next})).length>750000)throw protectionError("La sauvegarde et ses copies de secours dépassent la taille autorisée. Aucune progression n’a été remplacée.");
      // update replaces the complete maps, including spent tickets/deleted decks.
      if(snapshot.exists())transaction.update(target,next);
      else transaction.set(target,next);
      return progressionToken(data);
    });
  }

  async function registerPcSaveExport(uid,bundle,hash,expectedToken,expectedProfileToken){
    if(bundle?.accountUid!==uid||bundle?.playerState?.profileProgress?.uid&&bundle.playerState.profileProgress.uid!==uid||!/^[a-f0-9]{64}$/.test(hash||""))throw protectionError("Export PC non vérifié.");
    validateProgression({playerState:bundle.playerState,deckState:bundle.deckState});
    const {db,doc,runTransaction,serverTimestamp}=await firestoreTools();
    return runTransaction(db,async transaction=>{
      const target=doc(db,"users",uid),snapshot=await transaction.get(target);
      const current=snapshot.exists()?snapshot.data():null;
      if(current?.uid&&current.uid!==uid)throw protectionError("L’identité de cette sauvegarde doit être vérifiée avant la liaison.");
      if(progressionToken(current)!==expectedToken||migrationProfileToken(current)!==expectedProfileToken)throw Object.assign(new Error("Le compte a changé pendant l’export. Recommencez la vérification."),{code:"allstar/save-conflict"});
      if(isAccountLinkComplete(current))throw protectionError("La liaison est déjà validée pour ce compte. Utilisez la synchronisation normale ; contactez l’équipe ALLSTAR pour une récupération exceptionnelle.");
      const source={accountUid:uid,createdAt:Date.now(),playerState:bundle.playerState,deckState:bundle.deckState,recovery:bundle.recovery||null};
      const metadata={pendingPcTransfer:{hash,bundle,createdAt:Date.now()},pcSaveBackup:current?.pcSaveBackup||source,updatedAt:serverTimestamp()};
      if(new TextEncoder().encode(JSON.stringify({...current,...metadata})).length>750000)throw protectionError("La copie PC ne peut pas être conservée intégralement. Export non autorisé à l’import.");
      // Metadata only: this never replaces the account's active progression.
      if(snapshot.exists())transaction.update(target,metadata);else transaction.set(target,{uid,...metadata});
      return true;
    });
  }

  async function verifyCurrentSaveSource(uid,expectedToken,expectedProfileToken){
    const {db,doc,runTransaction,serverTimestamp}=await firestoreTools();
    return runTransaction(db,async transaction=>{
      const target=doc(db,"users",uid),snapshot=await transaction.get(target);
      const current=snapshot.exists()?snapshot.data():null;
      if(current?.uid&&current.uid!==uid||current?.playerState?.profileProgress?.uid&&current.playerState.profileProgress.uid!==uid)throw protectionError("L’identité de cette sauvegarde doit être vérifiée avant la liaison.");
      if(progressionToken(current)!==expectedToken||migrationProfileToken(current)!==expectedProfileToken)throw Object.assign(new Error("La progression du compte a changé. Vérifiez à nouveau le récapitulatif."),{code:"allstar/save-conflict"});
      const fresh=!current?.playerState&&Number(current?.level||1)<=1&&!Number(current?.totalXp)&&!Number(current?.rankedMatches)&&!Object.values(current?.collection||{}).some(n=>Number(n)>0);
      if(!fresh)validateProgression({playerState:current?.playerState,deckState:current?.deckState});
      const metadata={saveLinkVerified:{schema:1,source:fresh?"new-account-confirmed":"player-confirmed",verifiedAt:Date.now()},pendingPcTransfer:null,updatedAt:serverTimestamp()};
      if(!fresh)metadata.cloudSaveHistory=nextRecoveryHistory(uid,current,current,true);
      if(new TextEncoder().encode(JSON.stringify({...current,...metadata})).length>750000)throw protectionError("La progression et sa copie de référence ne peuvent pas être conservées intégralement. Liaison suspendue.");
      if(snapshot.exists())transaction.update(target,metadata);else transaction.set(target,{uid,...metadata});
    });
  }

  const MOBILE_LAUNCH_GIFT=Object.freeze({id:"mobile_launch_2026_11",credits:5000,start:Date.parse("2026-11-01T20:00:00+01:00"),end:Date.parse("2026-12-01T00:00:00+01:00")});

  // A receipt and its inventory/wallet changes are one atomic account write.
  // Replaying an interrupted presentation never grants the reward again.
  async function claimMobileLaunchGift(uid,ultimateKeys,expectedToken){
    if(!uid||typeof expectedToken!=="string")throw protectionError("Chargement du compte requis pour le cadeau.");
    const keys=[...new Set(ultimateKeys)].filter(key=>typeof key==="string"&&key.startsWith("ultime_"));
    if(!keys.length)throw protectionError("Catalogue des cartes Ultimes indisponible.");
    const {db,doc,runTransaction,serverTimestamp}=await firestoreTools();
    return runTransaction(db,async transaction=>{
      const target=doc(db,"users",uid),snapshot=await transaction.get(target);
      const current=snapshot.exists()?snapshot.data():null;
      if(current?.uid&&current.uid!==uid)throw protectionError("Compte du cadeau non vérifié.");
      const receipt=current?.campaignRewards?.[MOBILE_LAUNCH_GIFT.id];
      if(receipt)return {receipt,data:current};
      const now=Date.now();
      if(now<MOBILE_LAUNCH_GIFT.start||now>=MOBILE_LAUNCH_GIFT.end)return null;
      if(progressionToken(current)!==expectedToken)throw Object.assign(new Error("La progression a changé avant le cadeau. Reconnectez-vous pour la recharger."),{code:"allstar/save-conflict"});
      validateProgression(current);
      // A prepared PC source must be recovered first. Do not invalidate it by
      // granting a reward into the potentially incomplete canonical save.
      if(current.pendingPcTransfer)return null;
      const player=JSON.parse(JSON.stringify(current.playerState));
      const unowned=keys.filter(key=>!Number(player.collection[key]));
      const pool=unowned.length?unowned:keys;
      const cardKey=pool[Math.floor(Math.random()*pool.length)];
      player.credits+=MOBILE_LAUNCH_GIFT.credits;
      if(!Number.isSafeInteger(player.credits))throw protectionError("Solde du compte invalide.");
      player.collection[cardKey]=(player.collection[cardKey]||0)+1;
      player.savedAt=now;
      const awarded={cardKey,credits:MOBILE_LAUNCH_GIFT.credits,grantedAt:now,newCard:unowned.length>0};
      const data={playerState:player,deckState:current.deckState,collection:player.collection,decks:current.deckState};
      const next={...data,campaignRewards:{...current.campaignRewards,[MOBILE_LAUNCH_GIFT.id]:awarded},cloudSaveRevision:(Number(current.cloudSaveRevision)||0)+1,cloudSaveHistory:nextRecoveryHistory(uid,current,data),updatedAt:serverTimestamp()};
      if(new TextEncoder().encode(JSON.stringify({...current,...next})).length>750000)throw protectionError("Le cadeau ne peut pas être sauvegardé avec ses copies de secours. Réessayez après vérification du compte.");
      transaction.update(target,next);
      return {receipt:awarded,data:{...current,...next}};
    });
  }

  async function acknowledgeMobileLaunchGift(uid,cardKey){
    const {db,doc,runTransaction,serverTimestamp}=await firestoreTools();
    return runTransaction(db,async transaction=>{
      const target=doc(db,"users",uid),snapshot=await transaction.get(target);
      const current=snapshot.exists()?snapshot.data():null;
      const receipt=current?.campaignRewards?.[MOBILE_LAUNCH_GIFT.id];
      if(!receipt||receipt.cardKey!==cardKey)throw protectionError("Reçu du cadeau introuvable.");
      if(receipt.presentedAt)return;
      transaction.update(target,{campaignRewards:{...current.campaignRewards,[MOBILE_LAUNCH_GIFT.id]:{...receipt,presentedAt:Date.now()}},updatedAt:serverTimestamp()});
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
    registerPcSaveExport,
    verifyCurrentSaveSource,
    isAccountLinkComplete,
    MOBILE_LAUNCH_GIFT,
    claimMobileLaunchGift,
    acknowledgeMobileLaunchGift,
    saveDecks,
    loadDecks,
    saveCollection,
    loadCollection
  };
})();
