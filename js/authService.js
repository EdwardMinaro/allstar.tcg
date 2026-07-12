(function(){
  async function authTools(){
    const services = await window.AllstarFirebaseService.firebaseServices();
    const auth = services.modules.auth;
    return {
      auth: services.auth,
      createUserWithEmailAndPassword: auth.createUserWithEmailAndPassword,
      signInWithEmailAndPassword: auth.signInWithEmailAndPassword,
      sendPasswordResetEmail: auth.sendPasswordResetEmail,
      signOut: auth.signOut,
      onAuthStateChanged: auth.onAuthStateChanged,
      updateProfile: auth.updateProfile
    };
  }

  async function registerUser(email, password, pseudo){
    try{
      const tools = await authTools();
      const credential = await tools.createUserWithEmailAndPassword(
        tools.auth,
        String(email || "").trim(),
        password
      );
      if(pseudo){
        await tools.updateProfile(credential.user, {displayName: String(pseudo).trim().slice(0, 24)});
      }
      let profile = null;
      let profileError = null;
      try{
        profile = await window.AllstarProfileService.createUserProfile(
          credential.user.uid,
          credential.user.email,
          pseudo
        );
      }catch(error){
        profileError = error;
        console.warn("[PROFILE] Compte créé, profil cloud non enregistré.", error);
      }
      return {user: credential.user, profile, profileError};
    }catch(error){
      console.warn("[AUTH] Inscription impossible.", error);
      throw error;
    }
  }

  async function loginUser(email, password){
    try{
      const tools = await authTools();
      const credential = await tools.signInWithEmailAndPassword(
        tools.auth,
        String(email || "").trim(),
        password
      );
      let profile = null;
      let profileError = null;
      try{
        profile = await window.AllstarProfileService.ensureUserProfile(credential.user);
      }catch(error){
        profileError = error;
        console.warn("[PROFILE] Connexion réussie, profil cloud indisponible.", error);
      }
      return {user: credential.user, profile, profileError};
    }catch(error){
      console.warn("[AUTH] Connexion impossible.", error);
      throw error;
    }
  }

  async function logoutUser(){
    const tools = await authTools();
    await tools.signOut(tools.auth);
  }

  async function getCurrentUser(){
    const tools = await authTools();
    return tools.auth.currentUser || null;
  }

  async function resetPassword(email){
    const tools = await authTools();
    await tools.sendPasswordResetEmail(tools.auth, String(email || "").trim());
  }

  async function onAuthChanged(callback){
    const tools = await authTools();
    return tools.onAuthStateChanged(tools.auth, async user=>{
      let profile = null;
      let profileError = null;
      if(user){
        try{
          profile = await window.AllstarProfileService.ensureUserProfile(user);
        }catch(error){
          profileError = error;
          console.warn("[PROFILE] Profil cloud indisponible.", error);
        }
      }
      callback(user, profile, profileError);
    });
  }

  window.AllstarAuthService = {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    resetPassword,
    onAuthChanged
  };
})();
