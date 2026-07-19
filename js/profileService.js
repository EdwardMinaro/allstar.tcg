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
      runTransaction: firestore.runTransaction,
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

  function collectLevelRewards(progress, rewards=[], titleRewards=[]){
    progress.levelRewards=progress.levelRewards&&typeof progress.levelRewards==="object"?progress.levelRewards:{};
    const unlocked=[];
    rewards.forEach(reward=>{
      const id=`level_${reward.level}`;
      if(progress.level<reward.level||progress.levelRewards[id])return;
      progress.levelRewards[id]=true;
      unlocked.push({...reward,kind:"reward"});
    });
    titleRewards.forEach(reward=>{
      const id=`title_${reward.level}`;
      if(progress.level<reward.level||progress.levelRewards[id])return;
      progress.levelRewards[id]=true;
      progress.titles=Array.from(new Set([...(progress.titles||["Rookie"]),reward.title]));
      unlocked.push({...reward,kind:"title",label:reward.title});
    });
    return unlocked;
  }

  async function settleMatchProgress(uid, match={}){
    if(!uid||!match.id)throw new Error("Resultat de match incomplet.");
    const {db,doc,runTransaction,serverTimestamp}=await firestoreTools();
    const ranking=window.AllstarRankingService;
    const result=await runTransaction(db,async transaction=>{
      const ref=doc(db,"users",uid);
      const snapshot=await transaction.get(ref);
      let progress=ranking.normalizeProgress(snapshot.exists()?snapshot.data():{...DEFAULT_PROFILE,uid});
      const settled={
        ...(progress.onlineMatchSettlements&&typeof progress.onlineMatchSettlements==="object"?progress.onlineMatchSettlements:{}),
        ...(progress.matchSettlements&&typeof progress.matchSettlements==="object"?progress.matchSettlements:{})
      };
      if(settled[match.id])return {profile:progress,applied:false,rewards:[],events:[],gain:0};

      const won=Boolean(match.won);
      const career=match.career&&typeof match.career==="object"?match.career:null;
      const firstCareerWin=Boolean(career&&won&&career.key&&!progress.careerXpWins?.[career.key]);
      const gain=firstCareerWin
        ? ([100,200,300,400][Math.max(0,Math.min(3,Number(career.season)||0))]||100)
        : (match.online ? (won?100:50) : (won?50:25));
      progress=ranking.addXp(progress,gain);
      progress[won?"wins":"losses"]+=1;
      progress.currentStreak=won?Math.max(1,progress.currentStreak+1):Math.min(-1,progress.currentStreak-1);
      progress.bestStreak=Math.max(progress.bestStreak,Math.max(0,progress.currentStreak));
      let careerTitleUnlocked=false;
      if(firstCareerWin)progress.careerXpWins={...(progress.careerXpWins||{}),[career.key]:true};
      if(career&&won&&career.isFinal){
        const hadTitle=(progress.titles||[]).includes("Vainqueur du mode carri\u00e8re");
        progress.titles=Array.from(new Set([...(progress.titles||["Rookie"]),"Vainqueur du mode carri\u00e8re"]));
        careerTitleUnlocked=!hadTitle;
      }
      let events=[];
      if(match.ranked){
        const update=await ranking.updateEloAfterMatch(progress,{
          won,
          opponentElo:Number(match.opponentElo||1000),
          now:Number(match.now)||Date.now()
        });
        progress=update.progress;
        events=update.events||[];
      }
      const rewards=collectLevelRewards(progress,match.levelRewards||[],match.titleRewards||[]);
      settled[match.id]=Number(match.now)||Date.now();
      progress.matchSettlements=Object.fromEntries(
        Object.entries(settled).sort(([,a],[,b])=>Number(b)-Number(a)).slice(0,100)
      );
      transaction.set(ref,{...progress,updatedAt:serverTimestamp()},{merge:true});
      return {profile:progress,applied:true,rewards,events,gain,careerTitleUnlocked};
    });
    cacheUserProfile(uid,result.profile);
    void syncLeaderboardProfile(uid,result.profile);
    return result;
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
    settleMatchProgress,
    listPublicProfiles,
    getCachedPublicProfiles,
    ensureUserProfile
  };
})();
