const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||'puppeteer-core');
const base=(process.env.ALLSTAR_TEST_URL||'http://127.0.0.1:8268').replace(/\/$/,'');
const out=process.env.ALLSTAR_TEST_OUTPUT||path.resolve(__dirname,'../../../outputs/halloween-dice-qa');fs.mkdirSync(out,{recursive:true});
const serviceWindow={};Function('window',fs.readFileSync(path.join(__dirname,'../js/roomService.js'),'utf8'))(serviceWindow);
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.ALLSTAR_TEST_BROWSER,headless:true,pipe:true,args:['--no-sandbox']});
 try{
  for(const resolverSlot of ['p1','p2']){
   const receiverSlot=resolverSlot==='p1'?'p2':'p1',contexts=[],clients=[];
   let room={roomCode:'FIXTURE',status:'playing',players:{p1:{id:'fixture1'},p2:{id:'fixture2'}}},queue=Promise.resolve(),pendingSeen=false,receiverPublishes=0;
   const adapter={updateRoom(_code,updater){const op=queue.then(async()=>{room=structuredClone(updater(structuredClone(room)));for(const client of clients)await client.frame.evaluate(({room,slot})=>applyOnlineRoomSnapshot(room,slot),{room,slot:client.slot});return structuredClone(room)});queue=op.catch(()=>{});return op}};
   const service=new serviceWindow.RoomService(adapter);
   for(const [slot,mobile] of [[resolverSlot,false],[receiverSlot,true]]){
    const context=await browser.createBrowserContext();contexts.push(context);const page=await context.newPage();
    page.on('pageerror',error=>console.error('PAGE',slot,error.message));
    await page.setViewport(mobile?{width:844,height:390,isMobile:true,hasTouch:true}:{width:1360,height:768});
    await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base+'/')||r.url().startsWith('data:')?r.continue():r.abort());
    await page.exposeFunction('__publishDice',async snapshot=>{if(slot===receiverSlot&&pendingSeen)receiverPublishes++;if(snapshot.wheelRerollEvent?.kind==='die-stat')pendingSeen=true;return service.updateMatchState('FIXTURE',slot,snapshot)});
    await page.exposeFunction('__submitDice',(id,stat)=>service.submitWheelRerollChoice('FIXTURE',slot,id,stat));
    await page.goto(base+(mobile?'/':'/index.html'));let frame=mobile?await(await page.$('iframe')).contentFrame():page.mainFrame();
    await frame.waitForSelector('#playerHand');
    if(await frame.$('#mobileEntryPlay'))await frame.$eval('#mobileEntryPlay',el=>el.click());
    await frame.evaluate(async()=>{openBooster=()=>{};showHalloweenAnnouncement=()=>{};await startGuestMode();closeBooster();closeHalloweenAnnouncement();startTutorialMatch();audioManager.stopMusic()});
    await frame.evaluate(({slot,resolverSlot})=>{
      document.querySelectorAll('.overlay.active').forEach(el=>el.classList.remove('active'));setActiveScreen('game');
      G.mode='online';G.round=1;G.resolving=true;G.over=false;G.currentTurn=null;G.turnsTaken=2;G.stat=null;G.matchPhase='roulette';G.wheelRerollEvent=null;
      G.matchOptions={onlineMatchId:'fixture-match',onlinePlayerSlot:slot,onlineRoom:{roomCode:'FIXTURE',playerSlot:slot,opponentSlot:slot==='p1'?'p2':'p1'}};
      for(const side of [G.player,G.ai]){side.hand=[];side.deck=[];side.grave=[];side.obj=null;side.man=null;side.wrestlerEffectsBlocked=false;side.objectsBlocked=false;}
      const ownsUltima=slot!==resolverSlot;
      for(const [side,ultima] of [[G.player,ownsUltima],[G.ai,!ownsUltima]]){
        side.cat=state({...cardByKey(ultima?'ultime_catcheurs_ultima_sombra_halloween':'standard_catcheurs_angelo_folena'),id:ultima?'fixture-ultima':'fixture-normal'});side.cat.owner=side;
        if(ultima){side.obj={...cardByKey('rare_objets_masque_halloween'),id:'fixture-mask'};side.objTurnsRemaining=1;}
      }
      window.__duelCount=0;duel=()=>{window.__duelCount++};
      window.publishOnlineMatchState=snapshot=>window.parent.__publishDice(snapshot);
      window.submitOnlineWheelRerollChoice=(id,stat)=>window.parent.__submitDice(id,stat);
      onlineDirty=false;onlineLastAppliedVersion=0;render();
    },{slot,resolverSlot});
    clients.push({page,frame,slot,mobile});
   }
   const source=clients[0],receiver=clients[1];
   await source.frame.evaluate(()=>{Math.random=()=>.51;showWheel(()=>duel())});
   await receiver.frame.waitForFunction(()=>document.getElementById('effectChoiceOverlay').classList.contains('active'));
   assert.match(await receiver.frame.$eval('#effectChoiceText',el=>el.textContent),/Dé : 5/,'Natural 4 + mask enables the remote choice');
   assert.equal(await source.frame.evaluate(()=>window.__duelCount),0,'Resolver waits for the remote human');
   await receiver.page.screenshot({path:path.join(out,`remote-stat-choice-${receiverSlot}.png`)});
   const handle=await receiver.frame.$('.effect-choice-actions button:nth-child(4)');
   const rect=await handle.evaluate(el=>el.getBoundingClientRect().toJSON());
   const outer=await receiver.page.$eval('iframe',el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,scale:r.width/el.clientWidth}});
   await receiver.page.touchscreen.tap(outer.x+(rect.x+rect.width/2)*outer.scale,outer.y+(rect.y+rect.height/2)*outer.scale);
   try{await source.frame.waitForFunction(()=>window.__duelCount===1,{timeout:12000})}catch(error){
    console.error('ROOM',JSON.stringify(room.matchState));
    for(const client of clients){console.error('CLIENT',client.slot,await client.frame.evaluate(()=>({duels:window.__duelCount,phase:G.matchPhase,stat:G.stat,event:G.wheelRerollEvent,choice:activeOnlineChoice,version:onlineLastAppliedVersion,choiceOpen:document.getElementById('effectChoiceOverlay').classList.contains('active')})));await client.page.screenshot({path:path.join(out,`failure-${client.slot}.png`)})}
    throw error;
   }
   assert.equal(room.matchState.wheelRerollEvent.choice,'Charisme');
   assert.equal(await source.frame.evaluate(()=>G.stat),'Charisme');
   assert.equal(await receiver.frame.evaluate(()=>G.stat),'Charisme');
   assert.equal(await source.frame.evaluate(()=>G.ai.cat.effectDie.base),4);
   assert.equal(await receiver.frame.evaluate(()=>G.player.cat.effectDie.result),5);
   assert.equal(receiverPublishes,0,'Remote selector never overwrites a complete duel snapshot');
   if(resolverSlot==='p1'){
    await source.frame.evaluate(()=>{
      closeWheelOverlayVisual();document.querySelectorAll('.overlay.active').forEach(el=>el.classList.remove('active'));
      const gallery=document.createElement('div');gallery.id='dice-art-proof';gallery.style.cssText='position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;gap:40px;background:#20202a';
      gallery.innerHTML='<style>#dice-art-proof .game-card{width:300px!important;height:408px!important;transform:none!important}</style>'+['ultime_catcheurs_ultima_sombra_halloween','rare_objets_masque_halloween'].map(key=>`<div style="width:300px">${cardHTML(cardByKey(key))}</div>`).join('');document.body.append(gallery);
    });
    await source.frame.waitForFunction(()=>[...document.querySelectorAll('#dice-art-proof img')].every(im=>im.complete&&im.naturalWidth>0));
    await source.page.screenshot({path:path.join(out,'approved-art-in-game.png')});
   }
   for(const context of contexts)await context.close();
  }
  console.log('Browser dice: real mobile touch and four-stat dialog, natural 4+mask, two RoomService clients with either resolver slot, one duel and identical selected statistic; approved card renders loaded. Firebase simulated, external traffic blocked.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
