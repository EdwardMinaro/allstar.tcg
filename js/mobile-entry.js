(() => {
  if (new URLSearchParams(location.search).get('mobile') !== '1') return;
  const host = window.parent;
  const installer = host.AllstarInstall;
  if (installer?.installed) return;

  // Reuse the validated connection stage, including its seasonal decoration.
  const entry = document.createElement('section');
  entry.id = 'mobileEntryScreen';
  entry.setAttribute('aria-label', 'Bienvenue dans ALLSTAR');
  const stage = document.querySelector('#saveScreen .home-stage').cloneNode(true);
  const panel = stage.querySelector('.account-panel');
  const logo = panel.querySelector('.save-logo-img');
  panel.replaceChildren(logo);
  panel.insertAdjacentHTML('beforeend', `
    <div id="mobileEntryChoices" class="save-actions account-actions">
      <button type="button" class="home-action primary" id="mobileEntryPlay">Jouer</button>
      <button type="button" class="home-action" id="mobileEntryInstall">Installer</button>
      <p id="mobileInstagramNotice" class="mobile-install-notice" hidden>Tu es dans Instagram. Pour installer ALLSTAR, ouvre le lien dans un navigateur externe. Touche « Installer » pour voir comment faire.</p>
    </div>
    <div id="mobileInstallGuide" hidden>
      <h1>Installer ALLSTAR</h1>
      <div id="mobileInstallSteps"></div>
      <p class="mobile-install-external">Lien ouvert depuis Instagram, Gmail ou une messagerie ? Utilise « Ouvrir dans le navigateur » dans son menu si cette option est proposée. Sinon, copie le lien et colle-le dans Chrome sur Android ou Safari sur iPhone.</p>
      <div class="mobile-install-actions">
        <button type="button" class="home-action" id="mobileInstallCopy">Copier le lien</button>
        <button type="button" class="home-action guest" id="mobileInstallBack">Retour</button>
      </div>
      <p id="mobileInstallStatus" role="status" aria-live="polite"></p>
    </div>`);
  entry.append(stage);
  document.body.append(entry);
  const backgrounds = [...document.body.children].filter(el => el !== entry && !['SCRIPT', 'LINK'].includes(el.tagName));
  const previousInert = backgrounds.map(el => el.inert);
  backgrounds.forEach(el => el.inert = true);
  const choices = panel.querySelector('#mobileEntryChoices');
  const guide = panel.querySelector('#mobileInstallGuide');
  const installButton = panel.querySelector('#mobileEntryInstall');
  const status = panel.querySelector('#mobileInstallStatus');
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(navigator.userAgent);
  const instagram = /Instagram/i.test(navigator.userAgent);
  panel.querySelector('#mobileInstagramNotice').hidden = !instagram;
  if (instagram) panel.querySelector('.mobile-install-external').hidden = true;
  panel.querySelector('#mobileInstallSteps').innerHTML = instagram
    ? `<p>Le lien est ouvert dans <strong>Instagram</strong>. Pour installer ALLSTAR :</p><ol><li>Ouvre le <strong>menu ⋯ ou ⋮ d’Instagram</strong>, puis choisis <strong>Ouvrir dans le navigateur</strong> si l’option est proposée.</li><li>Sinon, touche <strong>Copier le lien</strong> ci-dessous et colle-le dans <strong>${ios ? 'Safari' : 'Chrome'}</strong>.</li><li>Une fois dans ce navigateur, touche à nouveau <strong>Installer</strong> sur l’accueil d’ALLSTAR.</li></ol>`
    : ios
    ? '<ol><li>Ouvre ce lien dans <strong>Safari</strong>.</li><li>Ouvre <strong>Partager</strong> (parfois dans le menu …), puis <strong>Sur l’écran d’accueil</strong>.</li><li>Si proposé, active <strong>Ouvrir comme app web</strong>, puis touche <strong>Ajouter</strong>.</li></ol>'
    : android
      ? '<ol><li>Ouvre le <strong>menu du navigateur</strong> (⋮ ou ☰).</li><li>Choisis <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>, selon le navigateur, puis confirme.</li><li>Retrouve <strong>ALLSTAR</strong> parmi tes applications ou sur l’écran d’accueil.</li></ol>'
      : '<ol><li>Ouvre le <strong>menu du navigateur</strong>.</li><li>Choisis <strong>Installer ALLSTAR</strong> si cette option est proposée.</li></ol><p>Sur téléphone : Android → menu du navigateur ; iPhone → Safari → Partager → Sur l’écran d’accueil.</p>';
  function showGuide(message = '') {
    choices.hidden = true;
    guide.hidden = false;
    status.textContent = message;
    panel.querySelector('#mobileInstallBack').focus({ preventScroll: true });
  }
  function update() {
    installButton.textContent = installer?.installed ? 'Installé ✓' : 'Installer';
    installButton.disabled = Boolean(installer?.installed);
    if (installer?.installed && !guide.hidden) status.textContent = 'ALLSTAR est installé ! Tu peux l’ouvrir depuis son icône.';
  }
  host.addEventListener('allstar-install-change', update);
  panel.querySelector('#mobileEntryPlay').onclick = () => {
    try { void host.requestAllstarLandscape?.(); } catch {}
    host.removeEventListener('allstar-install-change', update);
    backgrounds.forEach((el, index) => el.inert = previousInert[index]);
    entry.remove();
    document.querySelector('.screen.active button')?.focus({ preventScroll: true });
  };
  installButton.onclick = async () => {
    if (instagram || !installer?.available) { showGuide(); return; }
    const outcome = await installer.request();
    if (!entry.isConnected) return;
    showGuide(outcome === 'accepted'
      ? 'Installation demandée. Une fois terminée, ouvre ALLSTAR depuis son icône.'
      : outcome === 'dismissed' ? 'Tu peux continuer à jouer et installer ALLSTAR plus tard.' : 'Tu peux installer ALLSTAR depuis le menu du navigateur.');
    update();
  };
  panel.querySelector('#mobileInstallBack').onclick = () => {
    guide.hidden = true; choices.hidden = false;
    panel.querySelector('#mobileEntryPlay').focus({ preventScroll: true });
  };
  panel.querySelector('#mobileInstallCopy').onclick = async () => {
    const url = 'https://allstar-mobile-65102.web.app/';
    try {
      await host.navigator.clipboard.writeText(url);
      status.textContent = instagram ? `Lien copié ! Ouvre ${ios ? 'Safari' : 'Chrome'} et colle-le dans la barre d’adresse.` : 'Lien copié ! Colle-le dans ton navigateur.';
    } catch { status.textContent = `Lien à copier : ${url}`; }
  };
  update();
})();
