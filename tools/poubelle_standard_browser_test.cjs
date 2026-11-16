const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||'puppeteer-core');
const base=process.env.ALLSTAR_TEST_URL||'http://127.0.0.1:8268',out=path.resolve(__dirname,'../../../outputs/poubelle-standard-2026-11-16');
const serviceWindow={};Function('window',fs.readFileSync(path.join(__dirname,'../js/roomService.js'),'utf8'))(serviceWindow);
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.ALLSTAR_TEST_BROWSER,headless:true,pipe:true,args:['--no-sandbox']});
 try{
  for(const resolverSlot of['p1','p2']){
   const receiverSlot=resolverSlot==='p1'?'p2':'p1',clients=[],contexts=[];let queue=Promise.resolve(),pendingSeen=false,receiverPublishes=0;
   let room={roomCode:'FIXTURE',status:'playing',players:{p1:{id:'one'},p2:{id:'two'}}};
   const service=new serviceWindow.RoomService({updateRoom(_code,updater){const op=queue.then(async()=>{room=structuredClone(updater(structuredClone(room)));for(const client of clients)await client.frame.evaluate(({room,slot})=>applyOnlineRoomSnapshot(room,slot),{room,slot:client.slot});return structuredClone(room)});queue=op.catch(()=>{});return op}});
   for(const [slot,mobile] of[[resolverSlot,false],[receiverSlot,true]]){
    const context=await browser.createBrowserContext();contexts.push(context);const page=await context.newPage();
    page.on('pageerror',e=>console.error('PAGE',slot,e.message));
    await page.setViewport(mobile?{width:844,height:390,isMobile:true,hasTouch:true}:{width:1360,height:768});
    await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base+'/')||r.url().startsWith('data:')?r.continue():r.abort());
    await page.exposeFunction('__publishDiscard',snapshot=>{if(slot===receiverSlot&&pendingSeen)receiverPublishes++;if(snapshot.wheelRerollEvent?.kind==='hand-discard')pendingSeen=true;return service.updateMatchState('FIXTURE',slot,snapshot)});
    await page.exposeFunction('__submitDiscard',(id,card)=>service.submitWheelRerollChoice('FIXTURE',slot,id,card));
    await page.goto(base+(mobile?'/mobile.html':'/index.html'));const frame=mobile?await(await page.$('iframe')).contentFrame():page.mainFrame();
    await frame.waitForSelector('#playerHand');if(await frame.$('#mobileEntryPlay'))await frame.$eval('#mobileEntryPlay',el=>el.click());
    await frame.evaluate(async()=>{openBooster=()=>{};showHalloweenAnnouncement=()=>{};await startGuestMode();closeBooster();closeHalloweenAnnouncement();startTutorialMatch();audioManager.stopMusic()});
    await frame.evaluate(({slot,resolverSlot})=>{
     document.querySelectorAll('.overlay.active').forEach(el=>el.classList.remove('active'));setActiveScreen('game');
     G.mode='online';G.round=1;G.over=false;G.resolving=false;G.currentTurn=slot===resolverSlot?'player':'ai';G.turnsTaken=0;G.matchPhase=G.currentTurn;G.wheelRerollEvent=null;G.stat=null;G.discarding=null;G.tagging=null;
     G.matchOptions={onlineMatchId:'fixture',onlinePlayerSlot:slot,onlineRoom:{roomCode:'FIXTURE',playerSlot:slot,opponentSlot:slot==='p1'?'p2':'p1'}};
     for(const side of[G.player,G.ai]){
      const sideSlot=side.side==='player'?slot:(slot==='p1'?'p2':'p1');
      side.deck=[];side.grave=[];side.obj=null;side.man=null;side.objectsBlocked=false;side.played={};
      side.cat=state({...cardByKey('standard_catcheurs_g_king'),id:`${sideSlot}-wrestler`});side.cat.owner=side;
      if(sideSlot===resolverSlot&&resolverSlot==='p2')side.cat.card.ability='doubleEquippedSupportUpToRare';
      side.hand=(sideSlot===resolverSlot?['rare_objets_poubelle']:['standard_objets_livre','standard_objets_chaise','standard_catcheurs_g_king']).map((key,i)=>({...cardByKey(key),id:`${sideSlot}-hand${i}`}));
     }
     window.publishOnlineMatchState=s=>window.parent.__publishDiscard(s);window.submitOnlineWheelRerollChoice=(id,card)=>window.parent.__submitDiscard(id,card);onlineDirty=false;onlineLastAppliedVersion=0;render();
    },{slot,resolverSlot});clients.push({page,frame,slot});
   }
   const source=clients[0],receiver=clients[1];await source.frame.evaluate(()=>playPlayer(0));
   await receiver.frame.waitForFunction(()=>document.getElementById('effectChoiceOverlay').classList.contains('active'));
   assert.equal(await source.frame.evaluate(()=>G.ai.hand.length),3);
   await source.frame.evaluate(()=>{resolveRound();passTurn();});assert.equal(await source.frame.evaluate(()=>G.currentTurn),'player','pending choice blocks advancing the turn');
   await receiver.page.screenshot({path:path.join(out,`discard-mobile-${resolverSlot}.png`)});
   const handle=await receiver.frame.$('.effect-card-choice:nth-child(2)');const rect=await handle.evaluate(el=>el.getBoundingClientRect().toJSON());
   const outer=await receiver.page.$eval('iframe',el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,scale:r.width/el.clientWidth}});
   await receiver.page.touchscreen.tap(outer.x+(rect.x+rect.width/2)*outer.scale,outer.y+(rect.y+rect.height/2)*outer.scale);
   const discarded=resolverSlot==='p2'?2:1;
   if(discarded===2){
    await receiver.frame.waitForFunction(()=>G.player.grave.length===1&&document.getElementById('effectChoiceOverlay').classList.contains('active'));
    await receiver.frame.$eval('.effect-card-choice',el=>el.click());
   }
   await source.frame.waitForFunction(n=>G.ai.grave.length===n&&!pendingChosenHandDiscard(),{},discarded);await receiver.frame.waitForFunction(n=>G.player.grave.length===n&&!pendingChosenHandDiscard(),{},discarded);
   assert.equal(await source.frame.evaluate(()=>G.ai.grave[0].key),'standard_objets_chaise');assert.equal(await receiver.frame.evaluate(()=>G.player.hand.length),3-discarded);assert.equal(receiverPublishes,0,'selector submits an ID, never an entire stale match');
   assert.equal(await source.frame.evaluate(()=>G.currentTurn),'player');
   await source.frame.evaluate(()=>showChallengeResult('Défi réussi !','Récompense gagnée',true));assert.equal(await source.frame.$eval('#pinReplayButton',el=>getComputedStyle(el).display),'none');
   await source.page.screenshot({path:path.join(out,'challenge-victory.png')});
   await source.frame.evaluate(()=>showChallengeResult('Défi perdu !','Réessayez',false));assert.equal(await source.frame.$eval('#pinReplayButton',el=>!el.hidden&&!el.disabled&&getComputedStyle(el).display!=='none'),true);
   for(const context of contexts)await context.close();
  }
  console.log('Browser: real mobile touch chooses the targeted card; two RoomService clients, both resolver slots, identical hands/graves, no stale selector publication, active turn preserved; weekly victory hides Replay and defeat restores it. Firebase mocked; external traffic blocked.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
