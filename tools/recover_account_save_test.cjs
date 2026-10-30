const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const tool=require('./recover_account_save.cjs');
const key='standard_catcheurs_angelo_folena';
const player={credits:50,collection:{[key]:3},careerUnlocked:24,profileProgress:{uid:'owner-A',level:23,playerState:{collection:{nested:999}}}};
const decks={decks:[{id:'old',cards:[key]}]};
const rows=[{key:'allstarsDecks',kind:1,origin:'file://',sequence:1,json:decks},
 {key:'allstarsPlayerV1',kind:1,origin:'file://',sequence:2,json:player},
 {key:'allstarsPlayerV1:account:owner-B',kind:1,origin:'file://',sequence:3,json:{...player,profileProgress:{uid:'owner-B',level:20}}},
 {key:'allstarsRecovery:owner-A:4',kind:1,sequence:4,json:{format:'allstar-local-recovery-v1',accountUid:'owner-A',payload:JSON.stringify({playerRaw:JSON.stringify(player),decksRaw:JSON.stringify(decks),runtime:{playerState:{...player,credits:75},deckState:decks}})}},
 {key:'allstarsPending:owner-A:5',kind:1,sequence:5,json:{playerState:player,deckState:decks}}];
const found=tool.candidates(rows);
assert.equal(found.length,5);
assert.equal(found[0].accountUid,'owner-A');assert.equal(found[1].accountUid,'owner-B');
assert.equal(found[3].playerState.credits,75);
assert.equal(tool.summary(found[0]).cardCopies,3);
assert.equal(JSON.stringify(tool.summary(found[0])).includes('owner-A'),false,'Console summaries redact identity');
assert.throws(()=>tool.candidates([{key:'allstarsPlayerV1:account:owner-B',kind:1,json:player}]),/Conflicting/);
const original=JSON.stringify(found[0]);
const bundle=tool.build(found[0]);
assert.equal(bundle.playerState.credits,50,'No automatic compensation');
assert.equal(bundle.playerState.profileProgress.playerState,undefined,'Recursive save documents are removed');
assert.equal(JSON.stringify(found[0]),original,'Source candidate is immutable');
assert.throws(()=>tool.build(found[0],{reference:{accountUid:'owner-B'}}),/another account/);
assert.throws(()=>tool.build(found[0],{compensation:5000}),/explicit/);
const compensated=tool.build(found[0],{compensation:5000,reason:'Explicit test authorization',grantId:'test-compensation'});
assert.equal(compensated.playerState.credits,5050);
assert.equal(compensated.playerState.limitedRewards['test-compensation'].credits,5000);
const retired=structuredClone(found[0]);retired.playerState.collection.legende_managers_yann_le_kersaudec=1;
assert.throws(()=>tool.build(retired),/nothing removed automatically/);
const archived=tool.build(retired,{archiveRetired:true});
assert.equal(archived.recovery.retiredCards.legende_managers_yann_le_kersaudec,1);
assert.equal(archived.playerState.collection.legende_managers_yann_le_kersaudec,undefined);
const badDeck=structuredClone(found[0]);badDeck.deckState.decks[0].cards=Array(4).fill(key);
assert.throws(()=>tool.build(badDeck),/unowned/);
const point={accountUid:'owner-A',playerState:player,deckState:decks,revision:4};
const history=tool.candidates({cloudSaveHistory:{schema:1,accountUid:'owner-A',baseline:point,recent:[{...point,revision:5}]}});
assert.equal(history.length,2);assert.equal(history[1].source.revision,5);
assert.throws(()=>tool.candidates({uid:'wrong-owner',cloudSaveHistory:{schema:1,accountUid:'owner-A'}}),/identity/);
const pcCopies=tool.candidates({uid:'owner-A',pcSaveBackup:{accountUid:'owner-A',playerState:player,deckState:decks},pendingPcTransfer:{bundle:{accountUid:'owner-A',playerState:player,deckState:decks}}});
assert.equal(pcCopies.length,2);assert.equal(pcCopies[1].source.copy,'pending-PC-link');
assert.throws(()=>tool.candidates({uid:'owner-B',pcSaveBackup:{accountUid:'owner-A',playerState:player}}),/identity/);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'allstar-recovery-tool-'));
try{
 const input=path.join(temp,'records.json'),out=path.join(temp,'candidates'),save=path.join(temp,'save.json');
 fs.writeFileSync(input,JSON.stringify(rows));
 const before=fs.readFileSync(input,'utf8');
 const originalLog=console.log;console.log=()=>{};
 try{tool.main(['inspect',input,out]);tool.main(['build',path.join(out,'candidate-0001.json'),save]);}finally{console.log=originalLog}
 assert.equal(fs.readFileSync(input,'utf8'),before);
 assert.equal(JSON.parse(fs.readFileSync(save)).playerState.credits,50);
 assert.throws(()=>tool.main(['inspect',input,out]),/never overwritten/);
 assert.throws(()=>tool.main(['build',path.join(out,'candidate-0001.json'),save]),/EEXIST/);
 assert.equal(tool.hash(bundle),tool.hash(JSON.parse(JSON.stringify(bundle,null,2))),'Canonical fingerprint ignores whitespace');
}finally{
 // Only our own verified temporary test directory is removed.
 const resolved=path.resolve(temp),parent=path.resolve(os.tmpdir());
 assert.equal(path.dirname(resolved),parent);assert.ok(path.basename(resolved).startsWith('allstar-recovery-tool-'));
 fs.rmSync(resolved,{recursive:true});
}
console.log('Recovery tool: account separation, cloud/local/pending candidates, explicit compensation, retired-card archive, deck checks, fingerprints and immutable evidence verified.');
