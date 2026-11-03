const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const api=Function('document','window','setTimeout',source+`
log=()=>{};showEffectFeedback=()=>{};markOnlineDirty=()=>{};render=()=>{};playSound=()=>{};
return {CARD_DATA,HALLOWEEN_EVENT,cardByKey,state,playCard,applyEffect,invertOpponentSupports,pickHalloweenExclusives,generateHalloweenBooster,restoreOnlineSide,rarityPool,set(v){G=v}};
`)({addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return[]}},{},()=>{});
const key='rare_managers_r_man_halloween',bonus=api.cardByKey(key);
assert(bonus);assert.equal(bonus.type,'Manager');assert.equal(bonus.rarity,'Rare');assert.equal(bonus.exclusiveEvent,'halloween_2026');assert.deepEqual(bonus.stats,{});
const side=name=>({side:name,label:name,cat:null,man:null,obj:null,hand:[],grave:[],deck:[],played:{},oncePerMatch:{}});
function setup(wrestler){const p=side('player'),a=side('ai');api.set({round:1,mode:'test',player:p,ai:a,effectMarks:{}});p.cat=api.state({...api.cardByKey(wrestler),id:'p'});p.cat.owner=p;a.cat=api.state({...api.cardByKey('standard_catcheurs_angelo_folena'),id:'a'});a.cat.owner=a;p.hand=[{...bonus,id:'fixture-bonus'}];return {p,a}}
for(const [wrestler,expected]of [['standard_catcheurs_angelo_folena',{Force:1,Vitesse:0,Technique:1,Charisme:0}],['legende_catcheurs_hades_halloween',{Force:1,Vitesse:1,Technique:1,Charisme:1}],['rare_catcheurs_kev_lagadec',{Force:2,Vitesse:0,Technique:2,Charisme:0}]]){
 const {p,a}=setup(wrestler);api.playCard(p,a,p.hand[0],0);assert.deepEqual(p.cat.mods,expected);
 api.invertOpponentSupports(a);assert.deepEqual(p.cat.mods,Object.fromEntries(Object.entries(expected).map(([k,n])=>[k,-n||0])));
 api.invertOpponentSupports(a);assert.deepEqual(p.cat.mods,expected);
 const remote=api.restoreOnlineSide(JSON.parse(JSON.stringify(p,(k,v)=>k==='owner'?undefined:v)),'ai');assert.deepEqual(remote.cat.mods,expected);
}
for(const wrestler of api.CARD_DATA.filter(c=>c.type==='Catcheur'&&c.exclusiveEvent==='halloween_2026')){const {p,a}=setup(wrestler.key);api.playCard(p,a,p.hand[0],0);assert.deepEqual(p.cat.mods,{Force:1,Vitesse:1,Technique:1,Charisme:1},wrestler.key)}
{const {p,a}=setup('standard_catcheurs_angelo_folena');p.managersBlocked=true;api.playCard(p,a,p.hand[0],0);assert.deepEqual(p.cat.mods,{Force:0,Vitesse:0,Technique:0,Charisme:0});assert.equal(p.man,null)}
// Exact marginal rates, with several orderings of the circular intervals.
const entries=api.HALLOWEEN_EVENT.exclusives;
assert.equal(entries.length,7);assert.equal(entries.find(e=>e.key===key).chance,.20);
for(let rotation=0;rotation<entries.length;rotation++){
 const order=[...entries.slice(rotation),...entries.slice(0,rotation)],counts=Object.fromEntries(entries.map(e=>[e.key,0]));let doubles=0;
 for(let i=0;i<10000;i++){const cards=api.pickHalloweenExclusives((i+.5)/10000,order);assert(cards.length>=1&&cards.length<=2);if(cards.length===2)doubles++;for(const c of cards)counts[c.key]++}
 for(const e of entries)assert.equal(counts[e.key],e.chance*10000,e.key);assert.equal(doubles,100);
}
assert.equal(api.generateHalloweenBooster(.005).length,5);assert.equal(api.generateHalloweenBooster(.005).filter(c=>c.exclusiveEvent).length,2);
assert.equal(api.rarityPool('Rare').some(c=>c.key===key),false,'Exclusive must not leak into ordinary packs');
const audioSource=fs.readFileSync(path.join(root,'js/audio.js'),'utf8');const audio=Function(audioSource.slice(0,audioSource.indexOf('const HALLOWEEN_AUDIO_SEASON'))+';return AUDIO_LIBRARY;')();
for(const card of api.CARD_DATA.filter(c=>c.name==='R-MAN'))assert.equal(card.musicId,'r_man');
assert.equal(audio.music.r_man.wrestler,'R-MAN');assert(fs.statSync(path.join(root,audio.music.r_man.src)).size>100000);
const image=fs.readFileSync(path.join(root,bonus.renderArt));assert.equal(image.readUInt32BE(16),1102);assert.equal(image.readUInt32BE(20),1498);
console.log('R-Man Halloween: Rare Bonus, normal +1F/+1T, Halloween replacement +1all, all Halloween wrestlers, Kev doubling, cancellation, inversion and online snapshot; exact per-pack 20/10/1% across seven orderings, 1% double-exclusive, 5-card packs, standard image geometry and all R-Man music links verified.');
