(function(){
  if(new URLSearchParams(location.search).get("mobile")!=="1")return;
  document.documentElement.classList.add("mobile-touch");
  document.addEventListener("pointerup",()=>{
    if(document.getElementById('mobileEntryScreen'))return;
    try{void window.parent.requestAllstarLandscape?.()}catch{}
  },{once:true});
  let suppressGestureClickUntil=0;
  // Replace PC-only settings in this opt-in document, leaving desktop markup intact.
  document.querySelectorAll("#homeShortcutsOptionsTab,#shortcutsOptionsTab").forEach(tab=>tab.textContent="Gestes tactiles");
  document.querySelectorAll(".shortcut-options-home,#shortcutOptions").forEach(section=>{
    section.innerHTML='<div class="mobile-gesture-title">Gestes tactiles</div><p>Sur le fond de l’écran, en dehors des cartes et des boutons :</p><div class="mobile-gesture-row"><span>Musique suivante</span><strong>← Balayer à gauche</strong></div><div class="mobile-gesture-row"><span>Musique précédente</span><strong>Balayer à droite →</strong></div><div class="mobile-gesture-row"><span>Pause / reprise de la musique</span><strong>Double toucher</strong></div>';
  });
  document.querySelectorAll(".display-options").forEach(section=>{
    const sessionActions=section.querySelector(".profile-actions");
    section.replaceChildren();
    if(sessionActions)section.append(sessionActions);
    else section.remove();
  });
  const generalOptions=document.querySelector('#homeOptionsScreen .display-options');
  if(generalOptions){
    const transfer=document.createElement('button');
    transfer.type='button';transfer.className='mobile-option-button mobile-transfer-button';
    transfer.textContent='Récupérer une ancienne sauvegarde PC';
    transfer.onclick=()=>window.openAccountTransfer?.();
    const block=document.createElement('div');block.className='mobile-save-options';
    const title=document.createElement('strong');title.textContent='Sauvegarde PC';
    block.append(title,transfer);generalOptions.prepend(block);
  }
  let gesture=null,lastTap=null;
  function excluded(target){
    return !target?.closest||Boolean(target.closest('button,a,input,select,textarea,label,summary,[role="button"],[contenteditable="true"],.game-card,.hand,.log,.inventory-card,.deck-thumb'));
  }
  function point(event){
    // Touch coordinates are in the virtual desktop viewport. Normalize to
    // visible pixels so thresholds are consistent across phones and ratios.
    const scale=window.frameElement?window.frameElement.getBoundingClientRect().width/window.innerWidth:1;
    return {x:event.clientX*scale,y:event.clientY*scale};
  }
  document.addEventListener("touchstart",event=>{
    suppressGestureClickUntil=0;
    if(event.touches.length!==1||excluded(event.target)){gesture=null;lastTap=null;return;}
    const touch=event.changedTouches[0];
    gesture={...point(touch),id:touch.identifier,time:performance.now()};
  },{passive:true});
  document.addEventListener("touchmove",event=>{
    if(!gesture)return;
    const touch=[...event.touches].find(t=>t.identifier===gesture.id);
    if(!touch)return;
    const end=point(touch),dx=end.x-gesture.x,dy=end.y-gesture.y;
    // Claim horizontal gestures on backgrounds only. Keep vertical scrolling
    // and gestures starting on controls/cards entirely with the browser.
    if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.7)event.preventDefault();
  },{passive:false});
  document.addEventListener("touchcancel",()=>{gesture=null;lastTap=null},{passive:true});
  document.addEventListener("touchend",event=>{
    if(!gesture)return;
    const touch=[...event.changedTouches].find(t=>t.identifier===gesture.id);
    if(!touch)return;
    const start=gesture;gesture=null;
    const end=point(touch),dx=end.x-start.x,dy=end.y-start.y,now=performance.now();
    if(now-start.time>900){lastTap=null;return;}
    if(Math.abs(dx)>=45&&Math.abs(dx)>Math.abs(dy)*1.7){
      event.preventDefault();suppressGestureClickUntil=now+450;lastTap=null;
      if(dx<0)window.playNextTheme();else window.playPreviousTheme();
    }else if(Math.hypot(dx,dy)<=12&&now-start.time<400){
      if(lastTap&&now-lastTap.time<=320&&Math.hypot(end.x-lastTap.x,end.y-lastTap.y)<=28){
        event.preventDefault();suppressGestureClickUntil=now+450;lastTap=null;window.toggleThemePause();
      }else lastTap={...end,time:now};
    }else lastTap=null;
  },{passive:false});
  let selected=null;
  const overlay=document.createElement("div");
  overlay.id="mobileCardViewer";
  overlay.setAttribute("role","dialog");
  overlay.setAttribute("aria-label","Consulter la carte");
  overlay.innerHTML='<div class="mobile-card-content"></div><div class="mobile-card-actions"><button id="mobilePlayCard">Jouer</button><button id="mobileCloseCard">Fermer</button></div>';
  document.body.append(overlay);
  function close(){overlay.classList.remove("active");selected=null;}
  document.getElementById("mobileCloseCard").onclick=close;
  document.getElementById("mobilePlayCard").onclick=()=>{
    const id=selected;
    close();
    // Resolve the current hand by identity, even if the board rendered again
    // while the preview was open. Never dispatch another intercepted DOM click.
    if(id)window.confirmMobileHandCard(id);
  };
  document.addEventListener("click",event=>{
    if(performance.now()<suppressGestureClickUntil){event.preventDefault();event.stopImmediatePropagation();return;}
    const card=event.target.closest("#playerHand .game-card,#game .zone .game-card,.pile-viewer-card .game-card,.collection-card .game-card");
    if(!card||overlay.classList.contains("active"))return;
    event.preventDefault();event.stopImmediatePropagation();
    selected=card.dataset.cardId||null;
    const clone=card.cloneNode(true);
    clone.removeAttribute("id");clone.removeAttribute("onclick");clone.removeAttribute("onmouseenter");
    overlay.querySelector(".mobile-card-content").replaceChildren(clone);
    document.getElementById("mobilePlayCard").hidden=!card.closest("#playerHand");
    document.getElementById("mobilePlayCard").textContent=(card.getAttribute("onclick")||"").startsWith("discardPlayerCard")?"Défausser":"Jouer";
    overlay.classList.add("active");
  },true);
})();
