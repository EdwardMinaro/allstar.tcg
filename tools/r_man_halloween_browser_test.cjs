const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||'puppeteer-core');
const base=(process.env.ALLSTAR_TEST_URL||'http://127.0.0.1:8268').replace(/\/$/,'');
const out=path.resolve(__dirname,'../../../outputs/r-man-halloween-qa');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.ALLSTAR_TEST_BROWSER,headless:true,pipe:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  for(const mobile of [false,true]){
   const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport(mobile?{width:844,height:390,isMobile:true,hasTouch:true}:{width:1360,height:768});
   await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base+'/')||r.url().startsWith('data:')?r.continue():r.abort());
   await page.goto(base+(mobile?'/':'/index.html'));
   const frame=mobile?await(await page.$('iframe')).contentFrame():page.mainFrame();await frame.waitForSelector('#playerHand');
   if(await frame.$('#mobileEntryPlay'))await frame.$eval('#mobileEntryPlay',el=>el.click());
   const result=await frame.evaluate(()=>{
    startTutorialMatch();document.querySelectorAll('.overlay.active').forEach(el=>el.classList.remove('active'));setActiveScreen('game');
    G.mode='test';G.round=1;G.currentTurn='player';G.resolving=false;G.over=false;G.tagging=null;
    const results=[];
    for(const key of ['standard_catcheurs_angelo_folena','legende_catcheurs_hades_halloween']){
     for(const side of [G.player,G.ai]){side.man=null;side.obj=null;side.played={};side.managersBlocked=false;side.objectsBlocked=false;side.wrestlerEffectsBlocked=false;side.grave=[];}
     G.player.cat=state({...cardByKey(key),id:'qa-player'});G.player.cat.owner=G.player;
     G.ai.cat=state({...cardByKey('standard_catcheurs_angelo_folena'),id:'qa-ai'});G.ai.cat.owner=G.ai;
     G.player.hand=[{...cardByKey('rare_managers_r_man_halloween'),id:'qa-bonus'}];
     playPlayer(0);results.push({mods:{...G.player.cat.mods},manager:G.player.man?.key});
    }
    playThemeForCard(cardByKey('rare_managers_r_man_halloween'));
    return results;
   });
   assert.deepEqual(result.map(r=>r.mods),[{Force:1,Vitesse:0,Technique:1,Charisme:0},{Force:1,Vitesse:1,Technique:1,Charisme:1}]);
   assert(result.every(r=>r.manager==='rare_managers_r_man_halloween'));
   await frame.waitForFunction(()=>audioManager.currentMusicId==='r_man'&&audioManager.music?.readyState>=2&&!audioManager.music.paused,{timeout:30000});
   const audio=await frame.evaluate(()=>({duration:audioManager.music.duration,src:audioManager.music.currentSrc}));
   assert(audio.duration>209&&audio.duration<211);assert(audio.src.endsWith('/r_man.mp3'));
   await frame.evaluate(()=>{
    audioManager.stopMusic();const gallery=document.createElement('div');gallery.id='r-man-art-proof';
    gallery.style.cssText='position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;gap:40px;background:#20202a';
    gallery.innerHTML='<style>#r-man-art-proof .game-card{width:280px!important;height:381px!important;transform:none!important}</style>'+['legende_managers_r_man','rare_managers_r_man_halloween','rare_objets_masque_halloween'].map(key=>`<div style="width:280px">${cardHTML(cardByKey(key))}</div>`).join('');document.body.append(gallery);
   });
   await frame.waitForFunction(()=>[...document.querySelectorAll('#r-man-art-proof img')].every(im=>im.complete&&im.naturalWidth>0));
   await page.screenshot({path:path.join(out,mobile?'r-man-mobile.png':'r-man-desktop.png')});
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('R-Man browser: PC and mobile, actual playPlayer handler, both effect branches, all three card images loaded, R-Man MP3 decoded and playing (~3:30), no page errors. Isolated fixtures; external traffic blocked.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
