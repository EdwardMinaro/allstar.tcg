const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const handlers=new Map(),writes=[];let dialogResult={canceled:false,filePath:'chosen-backup.json'},dialogCount=0,writeError=false;
const main={webContents:{mainFrame:{}}};
const electron={
 app:{whenReady:()=>({then(){}}),on(){},getPath:()=>'/downloads'},
 ipcMain:{handle:(name,fn)=>handlers.set(name,fn)},
 dialog:{showSaveDialog:async(parent,options)=>{assert.equal(parent,main);assert.deepEqual(options.filters[0].extensions,['json']);dialogCount++;return dialogResult}}
};
const fileSystem={promises:{writeFile:async(file,data,encoding)=>{if(writeError)throw Error('Disk unavailable');writes.push({file,data,encoding})}}};
const source=fs.readFileSync(path.join(__dirname,'../electron-main.js'),'utf8');
const setMain=Function('require','__dirname',source+';return value=>{mainWindow=value};')(name=>name==='electron'?electron:name==='fs'?fileSystem:require(name),path.resolve(__dirname,'..'));
setMain(main);
const exportSave=handlers.get('allstar:export-save');
const event={sender:main.webContents,senderFrame:main.webContents.mainFrame};
const content=JSON.stringify({format:'allstar-account-transfer-v1',accountUid:'test-user',playerState:{credits:10,collection:{card:1}},deckState:{decks:[]}});
(async()=>{
 assert.deepEqual(await exportSave(event,content),{canceled:false});
 assert.equal(writes.length,1);assert.equal(writes[0].file,'chosen-backup.json');assert.deepEqual(JSON.parse(writes[0].data),JSON.parse(content));
 dialogResult={canceled:true};assert.deepEqual(await exportSave(event,content),{canceled:true});assert.equal(writes.length,1,'Cancel writes nothing');
 const before=dialogCount;
 await assert.rejects(exportSave({...event,senderFrame:{}},content),/autorisé/);
 await assert.rejects(exportSave(event,'{}'),/invalide/);
 await assert.rejects(exportSave(event,'x'.repeat(2000001)),/volumineux/);
 assert.equal(dialogCount,before,'Invalid sender and input never open a save dialog');
 dialogResult={canceled:false,filePath:'chosen-backup.json'};writeError=true;
 await assert.rejects(exportSave(event,content),/Disk unavailable/);assert.equal(writes.length,1);
 console.log('Desktop native export: chosen file, cancellation, sender/input limits and write failure verified (Electron/files mocked).');
})().catch(error=>{console.error(error);process.exitCode=1});
