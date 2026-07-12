(function(){
  let realtimeConnected = false;

  async function connectRealtime(){
    const services = await window.AllstarFirebaseService.firebaseServices();
    realtimeConnected = true;
    console.info("[FIREBASE] Realtime activé pour une fonctionnalité en ligne.");
    return services.database;
  }

  function disconnectRealtime(){
    realtimeConnected = false;
    console.info("[FIREBASE] Realtime marqué comme inactif côté jeu.");
  }

  function isRealtimeConnected(){
    return realtimeConnected;
  }

  window.AllstarConnectionManager = {
    connectRealtime,
    disconnectRealtime,
    isRealtimeConnected
  };
})();
