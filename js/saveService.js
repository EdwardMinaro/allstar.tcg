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

  async function savePlayerData(uid, data){
    const {db, doc, setDoc, serverTimestamp} = await firestoreTools();
    await setDoc(doc(db, "users", uid), {...data, updatedAt: serverTimestamp()}, {merge: true});
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
    const fields=["level","xp","totalXp","titles","careerXpWins","levelRewards","matchSettlements","onlineMatchSettlements"];
    return progressionToken({playerState:Object.fromEntries(fields.map(key=>[key,data?.[key]??null]))});
  }
  async function commitProgression(uid,data,expectedToken,expectedProfileToken=null){
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
      const next={...data,cloudSaveRevision:(Number(current?.cloudSaveRevision)||0)+1,updatedAt:serverTimestamp()};
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
    saveDecks,
    loadDecks,
    saveCollection,
    loadCollection
  };
})();
