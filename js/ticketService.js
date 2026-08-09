(function(){
  const TICKET_INBOX = "allstar.tradingcardgame@gmail.com";
  const CATEGORIES = new Set(["Bug", "Effet de carte", "Ergonomie", "Suggestion", "Autre"]);

  function cleanText(value, maxLength){
    return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, maxLength);
  }

  async function submitTicket(payload={}){
    const user = window.AllstarFirebaseService?.currentUser?.();
    if(!user)throw new Error("Connecte-toi a ton compte ALLSTAR pour envoyer un ticket.");
    const category = CATEGORIES.has(payload.category) ? payload.category : "Autre";
    const subject = cleanText(payload.subject, 90);
    const description = cleanText(payload.description, 3000);
    if(subject.length < 3)throw new Error("Le titre doit contenir au moins 3 caracteres.");
    if(description.length < 10)throw new Error("Ajoute un peu plus de detail au ticket.");

    const services = await window.AllstarFirebaseService.firebaseServices();
    const {collection, addDoc, serverTimestamp} = services.modules.firestore;
    const profile = window.AllstarProfileService?.getCachedUserProfile?.(user.uid) || {};
    const pseudo = cleanText(profile.pseudo || user.displayName || user.email || "Joueur ALLSTAR", 24);
    const version = await window.AllstarDesktop?.getAppVersion?.().catch?.(()=>null);
    const context = [
      `Joueur : ${pseudo}`,
      `UID : ${user.uid}`,
      `Email : ${user.email || "non renseigne"}`,
      `Version : ${version || "navigateur"}`,
      `Plateforme : ${navigator.userAgent}`
    ].join("\n");
    const messageText = `[ALLSTAR][${category}] ${subject}\n\n${description}\n\n---\n${context}`;

    await addDoc(collection(services.firestore, "tickets"), {
      to: TICKET_INBOX,
      replyTo: user.email || undefined,
      message: {
        subject: `[ALLSTAR][${category}] ${subject}`,
        text: messageText
      },
      requesterUid: user.uid,
      requesterPseudo: pseudo,
      requesterEmail: user.email || "",
      gameVersion: version || "navigateur",
      ticket: {category, subject, description},
      createdAt: serverTimestamp(),
      source: "allstar-desktop"
    });
  }

  window.AllstarTicketService = {submitTicket};
})();
