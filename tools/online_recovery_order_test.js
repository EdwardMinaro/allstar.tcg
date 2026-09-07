const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const client=fs.readFileSync(path.join(root,'js/multiplayerClient.js'),'utf8');
const game=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
function extract(text,name,next){const start=text.search(new RegExp('(?:async )?function '+name+'\\('));const end=text.search(new RegExp('(?:async )?function '+next+'\\('));return text.slice(start,end);}
async function run(slot){
  let calls=0,stored;
  const side={side:'player',hand:[],grave:[{id:'selected',name:'Carte choisie',type:'Catcheur'},{id:'other',name:'Autre carte',type:'Objet'}]};
  const context=vm.createContext({console,setTimeout,Promise,structuredClone,
    multiplayer:{room:{roomCode:'TEST'},playerSlot:slot},
    multiplayerService:()=>({updateMatchState:async(code,playerSlot,state)=>{
      const order=++calls;
      await new Promise(resolve=>setTimeout(resolve,order===1?40:1));
      stored=structuredClone(state);
      return {roomCode:code,matchState:stored};
    }}),
    owner:side,log(){},showEffectFeedback(){},markOnlineDirty(){},render(){},
    displayCardType:type=>type,
    requestEffectChoice:choice=>{context.pick=choice.onChoose;}
  });
  vm.runInContext('let onlineMatchPublishQueue=Promise.resolve();\n'+extract(client,'publishOnlineMatchState','submitOnlineOpeningRpsChoice'),context);
  for(const [name,next] of [['chooseCardFromGrave','moveGraveCardToHand'],['moveGraveCardToHand','recoverCardFromGrave'],['recoverCardFromGrave','recoverNamedCardFromDeck']])vm.runInContext(extract(game,name,next),context);
  vm.runInContext('recoverCardFromGrave(owner,{name:"Extincteur"});',context);
  context.before=structuredClone(side);
  const first=vm.runInContext('publishOnlineMatchState(before)',context);
  context.pick('selected');
  assert.deepEqual(side.hand.map(c=>c.id),['selected']);
  assert.deepEqual(side.grave.map(c=>c.id),['other']);
  context.after=structuredClone(side);
  const second=vm.runInContext('publishOnlineMatchState(after)',context);
  await Promise.all([first,second]);
  assert.deepEqual(stored.hand.map(c=>c.id),['selected'],`${slot}: delayed pre-choice state overwrote recovered card`);
  assert.deepEqual(stored.grave.map(c=>c.id),['other']);
}
async function verifyFailureDoesNotBlockNextUpdate(){
  let calls=0;
  const context=vm.createContext({Promise,structuredClone,multiplayer:{room:{roomCode:'TEST'},playerSlot:'p1'},
    multiplayerService:()=>({updateMatchState:async(code,slot,state)=>{
      if(++calls===1)throw Error('Simulated network error');
      return {roomCode:code,matchState:state};
    }})});
  vm.runInContext('let onlineMatchPublishQueue=Promise.resolve();\n'+extract(client,'publishOnlineMatchState','submitOnlineOpeningRpsChoice'),context);
  const first=vm.runInContext('publishOnlineMatchState({hand:[]})',context);
  const second=vm.runInContext('publishOnlineMatchState({hand:[{id:"selected"}]})',context);
  await assert.rejects(first,/Simulated network error/);
  const room=await second;
  assert.equal(room.matchState.hand[0].id,'selected');
}
(async()=>{for(const slot of ['p1','p2'])await run(slot);await verifyFailureDoesNotBlockNextUpdate();console.log('Online recovery: both slots preserve recovery order; failed updates do not block the queue');})().catch(error=>{console.error(error);process.exitCode=1;});
