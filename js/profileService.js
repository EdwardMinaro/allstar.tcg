(function(){
  const DEFAULT_PROFILE = {
    level: 1,
    xp: 0,
    totalXp: 0,
    elo: 1000,
    wins: 0,
    losses: 0,
    rankedMatches: 0,
    rankProtection: 0,
    currentStreak: 0,
    bestStreak: 0,
    bestRank: "Try-outs",
    hallOfFame: false,
    title: "Rookie",
    titles: ["Rookie"],
    careerXpWins: {},
    collection: {},
    decks: {},
    settings: {}
  };

  function cleanPseudo(pseudo, email){
    const value = String(pseudo || "").trim();
    if(value)return value.slice(0, 24);
    return String(email || "Joueur ALLSTAR").split("@")[0].slice(0, 24);
  }

  async function firestoreTools(){
    const services = await window.AllstarFirebaseService.firebaseServices();
    const firestore = services.modules.firestore;
    return {
      db: services.firestore,
      doc: firestore.doc,
      getDoc: firestore.getDoc,
      setDoc: firestore.setDoc,
      updateDoc: firestore.updateDoc,
      serverTimestamp: firestore.serverTimestamp
    };
  }

  async function createUserProfile(uid, email, pseudo){
    const {db, doc, setDoc, serverTimestamp} = await firestoreTools();
    const now = serverTimestamp();
    const profile = {
      ...DEFAULT_PROFILE,
      uid,
      email: email || "",
      pseudo: cleanPseudo(pseudo, email),
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(db, "users", uid), profile, {merge: true});
    return profile;
  }

  async function getUserProfile(uid){
    if(!uid)return null;
    const {db, doc, getDoc} = await firestoreTools();
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  async function updateUserProfile(uid, data){
    if(!uid)throw new Error("Profil introuvable.");
    const {db, doc, updateDoc, serverTimestamp} = await firestoreTools();
    await updateDoc(doc(db, "users", uid), {
      ...data,
      updatedAt: serverTimestamp()
    });
    return getUserProfile(uid);
  }

  async function ensureUserProfile(user, fallbackPseudo){
    if(!user)return null;
    const existing = await getUserProfile(user.uid);
    if(existing)return existing;
    return createUserProfile(user.uid, user.email, fallbackPseudo || user.displayName);
  }

  window.AllstarProfileService = {
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    ensureUserProfile
  };
})();
