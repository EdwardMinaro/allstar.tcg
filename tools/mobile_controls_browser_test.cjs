const fs=require('fs'),path=require('path');
const output=process.env.ALLSTAR_TEST_OUTPUT||path.resolve(__dirname,'../../../outputs/mobile-controls-qa');fs.mkdirSync(output,{recursive:true});
const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||"puppeteer-core");
const chrome=process.env.ALLSTAR_TEST_BROWSER;
if(!chrome)throw Error("Provide ALLSTAR_TEST_BROWSER and ALLSTAR_TEST_PUPPETEER for the available Chromium runtime.");
const testUrl=(process.env.ALLSTAR_TEST_URL||"http://127.0.0.1:8268").replace(/\/$/, "");
const assert=require('assert/strict');


(async()=>{const b=await puppeteer.launch({executablePath:chrome,headless:true,pipe:true,args:['--no-sandbox']});try{
const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true});await p.goto(testUrl+'/');const f=await(await p.$('iframe')).contentFrame();await f.waitForSelector('#mobileCardViewer');
assert.equal(await p.$('#toolbar'),null,'No permanent test toolbar');
if(await f.$('#mobileEntryPlay'))await f.$eval('#mobileEntryPlay',el=>el.click());
assert.equal(await p.$eval('#stage',el=>el.getBoundingClientRect().top),0,'Game uses the full available height');
const manifest=await p.evaluate(async()=>await(await fetch(document.querySelector('link[rel="manifest"]').href)).json());
assert.equal(manifest.display,'fullscreen');assert.equal(manifest.orientation,'landscape');
await f.evaluate(async()=>{await startGuestMode();audioManager.stopMusic()});await new Promise(r=>setTimeout(r,800));await f.evaluate(()=>{closeBooster();closeHalloweenAnnouncement();startTutorialMatch();setActiveScreen('game');});await new Promise(r=>setTimeout(r,1000));
await f.evaluate(()=>{G.currentTurn='ai';document.querySelectorAll('.overlay.active').forEach(el=>el.classList.remove('active'));setActiveScreen('game');window.musicActions={next:0,previous:0,pause:0};window.playNextTheme=()=>musicActions.next++;window.playPreviousTheme=()=>musicActions.previous++;window.toggleThemePause=()=>musicActions.pause++;});
const cdp=await p.createCDPSession();
async function outer(x,y){const frame=await p.$eval('iframe',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,scale:r.width/el.clientWidth}});return {x:frame.x+x*frame.scale,y:frame.y+y*frame.scale};}
async function rect(selector){return f.$eval(selector,el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});}
async function swipe(x,y,dx,dy=0){const a=await outer(x,y),z=await outer(x+dx,y+dy);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(z.x-a.x)*i/6,y:a.y+(z.y-a.y)*i/6}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
const ring=await rect('#game .ring');const x=ring.x+ring.width/2,y=ring.y+ring.height/2;
await swipe(x+80,y,-180);assert.equal(await f.evaluate(()=>musicActions.next),1,'Swipe left during opponent turn');
await swipe(x-80,y,180);assert.equal(await f.evaluate(()=>musicActions.previous),1);
const a=await outer(x,y);await p.touchscreen.tap(a.x,a.y);await p.touchscreen.tap(a.x,a.y);assert.equal(await f.evaluate(()=>musicActions.pause),1);
await swipe(x,y,0,90);assert.deepEqual(await f.evaluate(()=>musicActions),{next:1,previous:1,pause:1},'Vertical scroll is not a music command');
const card=await rect('#playerHand .game-card');await swipe(card.x+card.width/2,card.y+card.height/2,100);assert.deepEqual(await f.evaluate(()=>musicActions),{next:1,previous:1,pause:1},'Cards exclude music gestures');
const oldCSS=fs.readFileSync(path.join(__dirname,"fixtures/mobile-approved-v2.css"),"utf8");
const selectors=['.game-layout','.ring','.left-panel','.right-panel','.top-hand-area','.hand-area','.player-vestiaire-pile','.player-deck-pile','.enemy-piles','.round-box','.journal','#enemyHand .card-back'];
async function geometry(){return f.evaluate(selectors=>Object.fromEntries(selectors.map(s=>{const r=document.querySelector('#game '+s).getBoundingClientRect();return[s,{x:r.x,y:r.y,width:r.width,height:r.height}]})),selectors)}
const actual=await geometry(),newCard=await rect('#playerHand .game-card');
await f.evaluate(css=>{document.querySelector('link[href="css/mobile.css"]').disabled=true;const el=document.createElement('style');el.id='baselineMobile';el.textContent=css;document.head.append(el)},oldCSS);
const before=await geometry(),oldCard=await rect('#playerHand .game-card');for(const key of selectors)assert.deepEqual(actual[key],before[key],key+' unchanged');assert.ok(newCard.height>oldCard.height,'Only own cards larger');
await f.evaluate(()=>{document.getElementById('baselineMobile').remove();document.querySelector('link[href="css/mobile.css"]').disabled=false});
const hand=await rect('.hand-area');console.log({oldCard,newCard,hand,ring});assert.ok(newCard.y>=hand.y-1);assert.ok(newCard.y+newCard.height<=hand.y+hand.height+1,'Hand remains within its row');
await p.screenshot({path:output+'/mobile-larger-hand.png'});
assert.equal(await f.$$('.resolution-control').then(a=>a.length),0);assert.equal(await f.$$('.fullscreen-control').then(a=>a.length),0);assert.equal(await f.$$('#shortcutOptions [data-shortcut-action]').then(a=>a.length),0);
await f.evaluate(()=>{show('homeOptionsScreen');setHomeOptionsTab('shortcuts')});await new Promise(r=>setTimeout(r,450));await p.screenshot({path:output+'/mobile-touch-options.png'});
await f.evaluate(()=>setHomeOptionsTab('general'));
assert.equal(await f.$$('.mobile-landscape-button').then(a=>a.length),0,'Redundant landscape setting removed');
assert.equal(await f.$$('.desktop-save-export').then(a=>a.length),0,'PC export is not exposed on mobile');
const saveTab=await rect('#homeSaveOptionsTab'),saveTabPoint=await outer(saveTab.x+saveTab.width/2,saveTab.y+saveTab.height/2);
await p.touchscreen.tap(saveTabPoint.x,saveTabPoint.y);
assert.equal(await f.$eval('#homeSaveOptionsTab',el=>el.getAttribute('aria-selected')),'true');
assert.equal(await f.$eval('.home-general-options',el=>el.hidden),true);
await p.screenshot({path:output+'/mobile-save-options.png'});
await f.evaluate(()=>{window.transferOpened=0;window.openAccountTransfer=()=>transferOpened++;document.querySelector('#homeOptionsScreen .save-recovery-options button[onclick="openAccountTransfer()"]').click()});
assert.equal(await f.evaluate(()=>transferOpened),1,'PC recovery remains accessible in mobile options');
assert.equal(await f.$eval('#accountSaveStatus',el=>el.hidden),true,'Guest has no misleading cloud-save confirmation');

await f.evaluate(()=>{setActiveScreen('menu');closeHomeQuickPanel()});
const centered=await f.$eval('#menu .home-main-actions',el=>{const r=el.getBoundingClientRect();return Math.abs(r.x+r.width/2-innerWidth/2)<1});assert.equal(centered,true,'Enlarged home buttons remain centered');
const home=await f.evaluate(()=>[...document.querySelectorAll('#menu .home-main-actions button')].map(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height}}));assert.ok(home.every(r=>r.height>=84&&r.top>=0&&r.bottom<=768));
await p.screenshot({path:output+'/mobile-home-large.png'});
await f.evaluate(()=>toggleHomeQuickPanel());await p.screenshot({path:output+'/mobile-quick-large.png'});
await f.evaluate(()=>{closeHomeQuickPanel();setActiveScreen('homeOptionsScreen');setHomeOptionsTab('general')});await p.screenshot({path:output+'/mobile-options-large.png'});
await f.evaluate(()=>{setActiveScreen('game');toggleOptions()});await p.screenshot({path:output+'/mobile-game-options-large.png'});
await f.evaluate(()=>{hideOptions();G.player.hand=makeDeck(Array(8).fill(cardKey(CARD_DATA.find(c=>c.type==='Catcheur'&&c.rarity==='Standard'))));render()});
const handBox=await rect('#playerHand');assert.equal(await f.$eval('#playerHand',el=>el.scrollWidth>el.clientWidth),true);
await swipe(handBox.x+handBox.width-35,handBox.y+handBox.height/2,-220);assert.ok(await f.$eval('#playerHand',el=>el.scrollLeft)>0,'Long hand scrolls naturally');
assert.deepEqual(await f.evaluate(()=>musicActions),{next:1,previous:1,pause:1});
const desktop=await b.newPage();await desktop.goto(testUrl+'/game.html');assert.equal(await desktop.$$('.resolution-control').then(a=>a.length),2);assert.equal(await desktop.$$('#shortcutOptions [data-shortcut-action]').then(a=>a.length),4);
assert.equal(await desktop.$$eval('.desktop-save-export',buttons=>buttons.every(button=>button.hidden)),true,'Browser desktop does not expose native-only export');
await desktop.evaluateOnNewDocument(()=>{window.AllstarDesktop={isElectron:true,getAppVersion:async()=> 'test',exportSave:async()=>({canceled:true})}});
await desktop.reload();await desktop.waitForFunction(()=>[...document.querySelectorAll('.desktop-save-export')].every(button=>!button.hidden));
assert.equal(await desktop.$$('.desktop-save-export').then(a=>a.length),2,'Native desktop exposes export in home and match options');
await desktop.setViewport({width:1360,height:768});
await desktop.evaluate(()=>{setActiveScreen('homeOptionsScreen');setHomeOptionsTab('general')});
assert.equal(await desktop.$eval('#homeOptionsScreen .desktop-save-export',button=>button.getBoundingClientRect().width),0,'Backup tools are absent from General');
await desktop.click('#homeSaveOptionsTab');
assert.equal(await desktop.$eval('#homeOptionsScreen .desktop-save-export',button=>getComputedStyle(button).display!=='none'&&button.getBoundingClientRect().width>0),true);
await desktop.$eval('#homeOptionsScreen .desktop-save-export',button=>button.scrollIntoView({block:'center'}));
assert.equal(await desktop.$eval('#homeOptionsScreen .desktop-save-export',button=>{const r=button.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),true,'Export is reachable at 1360x768');
await desktop.screenshot({path:output+'/desktop-export-options.png'});
await desktop.evaluate(()=>{setActiveScreen('game');toggleOptions();setOptionsTab('saves')});
assert.equal(await desktop.$eval('#saveOptionsTab',el=>el.getAttribute('aria-selected')),'true');
assert.equal(await desktop.$eval('#saveRecoveryOptions',el=>el.hidden),false);
assert.equal(await desktop.$eval('#optionsMenu .audio-options',el=>getComputedStyle(el).display),'none');
await desktop.evaluate(()=>setOptionsTab('shortcuts'));
assert.equal(await desktop.$eval('#saveRecoveryOptions',el=>el.hidden),true);
await desktop.evaluate(()=>setOptionsTab('general'));
assert.notEqual(await desktop.$eval('#optionsMenu .audio-options',el=>getComputedStyle(el).display),'none');
console.log('Mobile import kept, redundant landscape setting removed, PC-only export visibility and exact assembly verified. Own hand:',oldCard.height,'->',newCard.height);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
