// Installation belongs to the top-level PWA, not its game iframe.
(() => {
  let pendingPrompt = null;
  let installationConfirmed = false;
  const display = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)');
  const notify = () => window.dispatchEvent(new Event('allstar-install-change'));
  window.AllstarInstall = {
    get installed() { return installationConfirmed || (display.matches && !document.fullscreenElement) || navigator.standalone === true; },
    get available() { return Boolean(pendingPrompt); },
    async request() {
      if (!pendingPrompt) return 'unavailable';
      const prompt = pendingPrompt;
      pendingPrompt = null;
      notify();
      try {
        // Keep this call in the player's click, before any await.
        await prompt.prompt();
        return (await prompt.userChoice).outcome;
      } catch { return 'unavailable'; }
    }
  };
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingPrompt = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installationConfirmed = true;
    pendingPrompt = null;
    notify();
  });
  display.addEventListener('change', notify);
})();
