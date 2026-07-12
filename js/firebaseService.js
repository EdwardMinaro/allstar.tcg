(function(){
  const state = {
    loadPromise: null,
    app: null,
    auth: null,
    firestore: null,
    database: null,
    modules: null,
    status: "idle",
    error: null
  };

  function configured(){
    const config = window.ALLSTAR_FIREBASE_CONFIG;
    return Boolean(config && config.apiKey && config.projectId && config.authDomain);
  }

  function sdkUrl(path){
    const version = window.ALLSTAR_FIREBASE_SDK_VERSION || "10.12.5";
    return `https://www.gstatic.com/firebasejs/${version}/${path}`;
  }

  async function loadFirebase(){
    if(state.loadPromise)return state.loadPromise;
    state.status = "loading";
    state.error = null;
    state.loadPromise = (async()=>{
      if(!configured())throw new Error("Firebase non configuré.");
      const [appModule, authModule, firestoreModule, databaseModule] = await Promise.all([
        import(sdkUrl("firebase-app.js")),
        import(sdkUrl("firebase-auth.js")),
        import(sdkUrl("firebase-firestore.js")),
        import(sdkUrl("firebase-database.js"))
      ]);
      const app = appModule.getApps().length
        ? appModule.getApps()[0]
        : appModule.initializeApp(window.ALLSTAR_FIREBASE_CONFIG);
      state.app = app;
      state.auth = authModule.getAuth(app);
      state.firestore = firestoreModule.getFirestore(app);
      state.database = databaseModule.getDatabase(app);
      state.modules = {
        app: appModule,
        auth: authModule,
        firestore: firestoreModule,
        database: databaseModule
      };
      state.status = "ready";
      console.info("[FIREBASE] Auth + Firestore prêts. Realtime initialisé sans écoute active.");
      return {
        app: state.app,
        auth: state.auth,
        firestore: state.firestore,
        database: state.database,
        modules: state.modules
      };
    })().catch(error=>{
      state.status = "error";
      state.error = error;
      state.loadPromise = null;
      console.warn("[FIREBASE] Indisponible, le mode solo local reste utilisable.", error);
      throw error;
    });
    return state.loadPromise;
  }

  async function firebaseServices(){
    return loadFirebase();
  }

  function firebaseStatus(){
    return {
      configured: configured(),
      status: state.status,
      error: state.error?.message || null,
      hasRealtimeInstance: Boolean(state.database),
      realtimeConnected: Boolean(window.AllstarConnectionManager?.isRealtimeConnected?.())
    };
  }

  function currentUser(){
    return state.auth?.currentUser || null;
  }

  window.AllstarFirebaseService = {
    configured,
    loadFirebase,
    firebaseServices,
    firebaseStatus,
    currentUser
  };
})();
