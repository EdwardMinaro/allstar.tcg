const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||"puppeteer-core");
const chrome=process.env.ALLSTAR_TEST_BROWSER;
if(!chrome)throw Error("Provide ALLSTAR_TEST_BROWSER and ALLSTAR_TEST_PUPPETEER.");
const testUrl=process.env.ALLSTAR_TEST_URL||"http://127.0.0.1:8268/";
const assert=require('assert/strict');


(async()=>{const b=await puppeteer.launch({executablePath:chrome,headless:true,pipe:true,args:['--no-sandbox']});try{
const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true});await p.goto(testUrl);const f=await(await p.$('iframe')).contentFrame();await f.waitForSelector('#mobileCardViewer');await f.evaluate(()=>{audioManager.setPlaylistEnabled('halloween',true);audioManager.setPlaylistEnabled('wrestlers',false)});
const cdp=await p.createCDPSession();
async function point(x,y){const rect=await p.$eval('iframe',el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,scale:r.width/el.clientWidth}});return{x:rect.x+x*rect.scale,y:rect.y+y*rect.scale}}
const width=await f.evaluate(()=>innerWidth);const y=300;const tap=await point(width-130,y);await p.touchscreen.tap(tap.x,tap.y);await f.waitForFunction(()=>audioManager.music&&!audioManager.music.paused&&audioManager.music.readyState>=2,{timeout:10000});
async function swipe(direction){const before=await f.evaluate(()=>audioManager.currentMusicId);const start=await point(direction==='next'?width-130:width-350,y);const end=await point(direction==='next'?width-350:width-130,y);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/6,y:start.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await f.waitForFunction(id=>audioManager.currentMusicId!==id,{timeout:5000},before);await f.waitForFunction(()=>audioManager.music&&!audioManager.music.paused&&audioManager.music.readyState>=2,{timeout:10000});return f.evaluate(()=>audioManager.currentMusicId)}
const cycle=[await f.evaluate(()=>audioManager.currentMusicId)];for(let i=0;i<9;i++)cycle.push(await swipe('next'));assert.equal(new Set(cycle).size,10);assert.ok(cycle.includes('halloween_01'));
const history=[cycle.at(-1)];for(let i=0;i<3;i++)history.push(await swipe('next'));for(let i=2;i>=0;i--)assert.equal(await swipe('previous'),history[i]);for(let i=1;i<history.length;i++)assert.equal(await swipe('next'),history[i]);
await p.touchscreen.tap(tap.x,tap.y);await p.touchscreen.tap(tap.x,tap.y);await f.waitForFunction(()=>audioManager.musicPausedByUser);assert.equal(await f.evaluate(()=>audioManager.music.paused),true);
await p.touchscreen.tap(tap.x,tap.y);await p.touchscreen.tap(tap.x,tap.y);await f.waitForFunction(()=>!audioManager.music.paused);
assert.equal(await f.evaluate(()=>Boolean(audioManager.music.error)),false);console.log('Real MP3 playback + trusted touch: 10 unique Halloween tracks, forward past Graveyard, exact back/forward history and double-tap pause/resume OK.');
await f.evaluate(()=>audioManager.stopMusic());
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});