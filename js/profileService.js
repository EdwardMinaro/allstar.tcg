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
    levelRewards: {},
    collection: {},
    decks: {},
    settings: {}
  };
  const PROFILE_CACHE_PREFIX = "allstarProfileCacheV2:";
  const LEADERBOARD_CACHE_KEY = "allstarLeaderboardCacheV2";
  const profileRequests = new Map();
  const leaderboardState = {request:null, profiles:[]};
  const leaderboardSyncState = new Map();

  function readCache(key){
    try{return JSON.parse(localStorage.getItem(key)||"null");}catch{return null;}
  }

  function writeCache(key, value){
    try{localStorage.setItem(key,JSON.stringify(value));}catch{}
  }

  function networkDeadline(promise, message, timeout=8000){
    let timer=null;
    return Promise.race([
      promise,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),timeout);})
    ]).finally(()=>clearTimeout(timer));
  }

  function getCachedUserProfile(uid){
    if(!uid)return null;
    return readCache(`${PROFILE_CACHE_PREFIX}${uid}`)?.profile||null;
  }

  function cacheUserProfile(uid, profile){
    if(uid&&profile)writeCache(`${PROFILE_CACHE_PREFIX}${uid}`,{savedAt:Date.now(),profile});
    return profile;
  }

  function getCachedPublicProfiles(){
    const cached=readCache(LEADERBOARD_CACHE_KEY);
    return Array.isArray(cached?.profiles) ? cached.profiles : [];
  }

  function cachePublicProfiles(profiles){
    const safe=Array.isArray(profiles)?profiles:[];
    leaderboardState.profiles=safe;
    writeCache(LEADERBOARD_CACHE_KEY,{savedAt:Date.now(),profiles:safe});
    return safe;
  }

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
      collection: firestore.collection,
      getDoc: firestore.getDoc,
      getDocs: firestore.getDocs,
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
    cacheUserProfile(uid, profile);
    void syncLeaderboardProfile(uid, profile);
    return profile;
  }

  async function getUserProfile(uid){
    if(!uid)return null;
    const {db, doc, getDoc} = await firestoreTools();
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? cacheUserProfile(uid, snap.data()) : null;
  }

  async function updateUserProfile(uid, data){
    if(!uid)throw new Error("Profil introuvable.");
    const {db, doc, updateDoc, serverTimestamp} = await firestoreTools();
    await updateDoc(doc(db, "users", uid), {
      ...data,
      updatedAt: serverTimestamp()
    });
    const profile=await getUserProfile(uid);
    cacheUserProfile(uid, profile);
    void syncLeaderboardProfile(uid, profile);
    return profile;
  }

  function publicLeaderboardProfile(uid, profile={}){
    return {
      uid,
      pseudo: cleanPseudo(profile.pseudo, profile.email),
      elo: Number(profile.elo) || 1000,
      wins: Number(profile.wins) || 0,
      losses: Number(profile.losses) || 0,
      rankedMatches: Number(profile.rankedMatches) || 0,
      currentRankId: profile.currentRankId || "",
      rankProtection: Number(profile.rankProtection) || 0,
      bestRank: profile.bestRank || "Try-outs",
      hallOfFame: Boolean(profile.hallOfFame),
      title: profile.title || "Rookie"
    };
  }

  async function syncLeaderboardProfile(uid, profile){
    if(!uid||!profile)return;
    const publicProfile=publicLeaderboardProfile(uid, profile);
    const fingerprint=JSON.stringify(publicProfile);
    const previous=leaderboardSyncState.get(uid);
    if(previous?.fingerprint===fingerprint)return previous.promise||Promise.resolve();
    const task=(async()=>{
      const {db, doc, setDoc, serverTimestamp} = await firestoreTools();
      await setDoc(doc(db, "leaderboard", uid), {
        ...publicProfile,
        updatedAt: serverTimestamp()
      }, {merge: true});
    })().catch(error=>{
      leaderboardSyncState.delete(uid);
      console.warn("[LEADERBOARD] Synchronisation du profil indisponible.", error);
    });
    leaderboardSyncState.set(uid,{fingerprint,promise:task});
    return task;
  }

  async function listPublicProfiles(){
    if(leaderboardState.request)return leaderboardState.request;
    leaderboardState.request=(async()=>{
      const {db, collection, getDocs} = await firestoreTools();
      const snapshot = await networkDeadline(
        getDocs(collection(db, "leaderboard")),
        "Le classement met trop de temps a repondre."
      );
      return cachePublicProfiles(snapshot.docs.map(entry=>({uid:entry.id,...entry.data()})));
    })().finally(()=>{leaderboardState.request=null;});
    return leaderboardState.request;
  }

  async function loadUserProfile(user, fallbackPseudo){
    if(!user)return null;
    const cached=getCachedUserProfile(user.uid);
    try{
      const existing = await getUserProfile(user.uid);
      if(existing){
        const genericPseudo=!existing.pseudo||existing.pseudo==="Joueur ALLSTAR";
        const pseudo=genericPseudo
          ? cleanPseudo(fallbackPseudo||user.displayName, user.email)
          : cleanPseudo(existing.pseudo, user.email);
        const email=existing.email||user.email||"";
        const profile=cacheUserProfile(user.uid,{...existing,pseudo,email});
        if(pseudo!==existing.pseudo||email!==existing.email){
          firestoreTools().then(({db,doc,setDoc,serverTimestamp})=>setDoc(doc(db,"users",user.uid),{
            pseudo,
            email,
            updatedAt:serverTimestamp()
          },{merge:true})).catch(error=>console.warn("[PROFILE] Mise a jour du pseudo indisponible.",error));
        }
        void syncLeaderboardProfile(user.uid, profile);
        return profile;
      }
      return createUserProfile(user.uid, user.email, fallbackPseudo || user.displayName);
    }catch(error){
      if(cached)return cached;
      throw error;
    }
  }

  function ensureUserProfile(user, fallbackPseudo){
    if(!user)return Promise.resolve(null);
    if(profileRequests.has(user.uid))return profileRequests.get(user.uid);
    const request=loadUserProfile(user,fallbackPseudo).finally(()=>profileRequests.delete(user.uid));
    profileRequests.set(user.uid,request);
    return request;
  }

  window.AllstarProfileService = {
    createUserProfile,
    getUserProfile,
    getCachedUserProfile,
    updateUserProfile,
    listPublicProfiles,
    getCachedPublicProfiles,
    ensureUserProfile
  };
})();
