// Operator tool: inspect copies, select a specific snapshot, build a candidate.
// No account login, network, database writes, automatic merge or import approval.
const fs=require('fs'),path=require('path'),crypto=require('node:crypto');
const clone=value=>JSON.parse(JSON.stringify(value));
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
function writeNew(file,data){
  fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(data,null,2),{encoding:'utf8',flag:'wx'});
}
function candidates(input){
  const found=[];
  function add(player,decks,uid,source){
    if(!player||!player.collection||!Number.isSafeInteger(player.credits)||!uid||typeof uid!=='string')return;
    if(player.profileProgress?.uid&&player.profileProgress.uid!==uid)throw Error('Conflicting player identity; manual investigation required.');
    found.push({format:'allstar-recovery-candidate-v1',accountUid:uid,source,playerState:clone(player),deckState:clone(decks||{decks:[]})});
  }
  function history(value,uid,source){
    const h=value?.cloudSaveHistory;
    if(!h)return;
    if(h.schema!==1||h.accountUid!==uid)throw Error('Invalid recovery history identity.');
    for(const [name,point] of [['baseline',h.baseline],...(h.recent||[]).map((point,i)=>['recent-'+i,point])]){
      if(point?.accountUid!==uid)throw Error('History point belongs to another account.');
      add(point.playerState,point.deckState,uid,{...source,history:name,revision:point.revision,capturedAt:point.capturedAt});
    }
  }
  if(!Array.isArray(input)){
    if(input?.format==='allstar-local-recovery-v1')input=[{key:'allstarsRecovery',json:input}];
    else {const uid=input?.uid||input?.cloudSaveHistory?.accountUid;history(input,uid,{kind:'cloud-document'});return found;}
  }
  const rows=[...input].sort((a,b)=>(a.sequence||0)-(b.sequence||0));
  for(const row of rows){
    const obj=row.json,key=row.key||'';
    if(!obj||row.kind===0)continue;
    const source={kind:'local-storage',key,origin:row.origin,file:row.file,sequence:row.sequence};
    if(key.startsWith('allstarsPlayerV1')){
      const uid=key.includes(':account:')?key.split(':account:')[1]:obj.profileProgress?.uid;
      const deckKey=uid&&key.includes(':account:')?'allstarsDecks:account:'+uid:'allstarsDecks';
      const deckRow=rows.filter(r=>r.key===deckKey&&r.kind===1&&r.origin===row.origin&&r.sequence<=row.sequence).at(-1);
      add(obj,deckRow?.json,uid,{...source,deckSequence:deckRow?.sequence,deckBinding:key.includes(':account:')?'account-key':'origin-and-sequence-only'});
    }else if(key.startsWith('allstarsPending:')){
      add(obj.playerState,obj.deckState,key.split(':')[1],source);
    }else if(obj.format==='allstar-local-recovery-v1'){
      const payload=JSON.parse(obj.payload);
      if(payload.playerRaw)add(JSON.parse(payload.playerRaw),payload.decksRaw?JSON.parse(payload.decksRaw):null,obj.accountUid,{...source,reason:obj.reason,copy:'stored'});
      if(payload.runtime?.playerState)add(payload.runtime.playerState,payload.runtime.deckState,obj.accountUid,{...source,reason:obj.reason,copy:'pending-runtime'});
    }else if(key.startsWith('allstarProfileCacheV2:')){
      const uid=key.slice('allstarProfileCacheV2:'.length),profile=obj.profile;
      if(profile?.uid&&profile.uid!==uid)throw Error('Cached profile identity mismatch.');
      add(profile?.playerState,profile?.deckState||profile?.decks,uid,{...source,copy:'cached-cloud'});
      add(profile?.mobileMigrationBackup?.playerState,profile?.mobileMigrationBackup?.deckState,uid,{...source,copy:'pre-transfer-backup'});
      history(profile,uid,source);
    }
  }
  return found;
}
function summary(candidate){
  const player=candidate.playerState,collection=Object.entries(player.collection).filter(([,n])=>Number(n)>0);
  return {account:crypto.createHash('sha256').update(candidate.accountUid).digest('hex').slice(0,12),source:candidate.source,
    savedAt:player.savedAt,credits:player.credits,career:player.careerUnlocked,level:player.profileProgress?.level,
    cardKinds:collection.length,cardCopies:collection.reduce((sum,[,n])=>sum+Number(n),0),
    ultimes:collection.filter(([key])=>key.startsWith('ultime_')).map(([key,count])=>({key,count})),decks:candidate.deckState.decks?.length||0};
}
function gameTools(){
  const root=path.resolve(__dirname,'..'),window={};
  Function('window',fs.readFileSync(path.join(root,'js/rankingService.js'),'utf8'))(window);
  const document={addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return[]}};
  return {...Function('window','document',fs.readFileSync(path.join(root,'js/game.js'),'utf8')+';return {validateAccountTransfer,cardByKey};')(window,document),normalize:window.AllstarRankingService.normalizeProgress};
}
function build(candidate,options={}){
  if(candidate.format!=='allstar-recovery-candidate-v1'||!candidate.accountUid)throw Error('Select an identified candidate first.');
  if(options.reference&&options.reference.accountUid!==candidate.accountUid)throw Error('Reference export belongs to another account.');
  const compensation=options.compensation||0;
  if(!Number.isSafeInteger(compensation)||compensation<0||compensation>0&&(!options.reason||!options.grantId))throw Error('Compensation requires an explicit amount, reason and grant-id; default is zero.');
  const game=gameTools(),player=clone(candidate.playerState),decks=clone(candidate.deckState),retiredCards={};
  for(const [key,n] of Object.entries(player.collection))if(!game.cardByKey(key)){
    if(key!=='legende_managers_yann_le_kersaudec'||!options.archiveRetired)throw Error('Unknown/retired card '+key+'; nothing removed automatically.');
    retiredCards[key]=n;delete player.collection[key];
  }
  for(const deck of decks.decks||[]){
    const used={};for(const key of deck.cards||[]){
      if(!game.cardByKey(key))throw Error('Deck has an unknown/retired card: '+key);
      used[key]=(used[key]||0)+1;
      if(used[key]>Number(player.collection[key]||0))throw Error('Deck contains unowned copies: '+key);
    }
  }
  const originalCredits=player.credits;
  player.profileProgress=game.normalize(player.profileProgress||{});
  player.credits+=compensation;
  if(compensation){
    if(player.limitedRewards?.[options.grantId])throw Error('This compensation marker already exists.');
    player.limitedRewards={...player.limitedRewards,[options.grantId]:{credits:compensation,reason:options.reason,grantedAt:Date.now()}};
  }
  const bundle={format:'allstar-account-transfer-v1',accountUid:candidate.accountUid,createdAt:Date.now(),playerState:player,deckState:decks,
    recovery:{source:candidate.source,sourceSavedAt:player.savedAt,originalCredits,compensationCredits:compensation,retiredCards}};
  game.validateAccountTransfer(bundle,candidate.accountUid);
  if(Buffer.byteLength(JSON.stringify(bundle,null,2),'utf8')>2000000)throw Error('Output exceeds import size limit.');
  return bundle;
}
function main(args){
  const [action,input,output,...flags]=args;
  if(action==='inspect'&&input&&output){
    if(fs.existsSync(output))throw Error('Use a new output directory; evidence is never overwritten.');
    const all=candidates(read(input));
    fs.mkdirSync(output,{recursive:true});
    const report=all.map((candidate,i)=>{const name='candidate-'+String(i+1).padStart(4,'0')+'.json';writeNew(path.join(output,name),candidate);return {file:name,...summary(candidate)}});
    writeNew(path.join(output,'report-private.json'),report);
    // Full storage keys can contain account IDs; console uses only summary IDs.
    console.log(JSON.stringify(report.map(({source,...entry})=>({...entry,sequence:source.sequence,kind:source.copy||source.kind})),null,2));
  }else if(action==='build'&&input&&output){
    const value=flag=>{const index=flags.indexOf(flag);return index<0?undefined:flags[index+1]};
    const bundle=build(read(input),{reference:value('--reference')?read(value('--reference')):null,
      compensation:Number(value('--compensation')||0),reason:value('--reason'),grantId:value('--grant-id'),archiveRetired:flags.includes('--archive-retired')});
    writeNew(output,bundle);
    console.log(JSON.stringify({file:output,canonicalSha256:hash(bundle),credits:bundle.playerState.credits,
      cardCopies:Object.values(bundle.playerState.collection).reduce((sum,n)=>sum+n,0),appliedToAccount:false,importApproved:false},null,2));
  }else throw Error('Usage: inspect RECORDS_OR_HISTORY_JSON NEW_OUTPUT_DIR | build CANDIDATE_JSON NEW_SAVE_JSON [--reference EXPORT_JSON] [--archive-retired] [--compensation N --reason TEXT --grant-id ID]');
}
if(require.main===module){try{main(process.argv.slice(2))}catch(error){console.error(error.message);process.exitCode=1}}
module.exports={candidates,summary,build,hash,main};
