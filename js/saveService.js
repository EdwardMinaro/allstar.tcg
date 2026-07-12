(function(){
  async function firestoreTools(){
    const services = await window.AllstarFirebaseService.firebaseServices();
    const firestore = services.modules.firestore;
    return {
      db: services.firestore,
      doc: firestore.doc,
      getDoc: firestore.getDoc,
      setDoc: firestore.setDoc,
      serverTimestamp: firestore.serverTimestamp
    };
  }

  async function savePlayerData(uid, data){
    const {db, doc, setDoc, serverTimestamp} = await firestoreTools();
    await setDoc(doc(db, "users", uid), {...data, updatedAt: serverTimestamp()}, {merge: true});
  }

  async function loadPlayerData(uid){
    const {db, doc, getDoc} = await firestoreTools();
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
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
    saveDecks,
    loadDecks,
    saveCollection,
    loadCollection
  };
})();
