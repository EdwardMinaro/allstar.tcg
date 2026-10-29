const fs=require("fs");
const path=require("path");
const {spawnSync}=require("child_process");
const [input,ffmpeg,ffprobe]=process.argv.slice(2);
if(!input||!ffmpeg||!ffprobe)throw Error("Usage: node tools/split_halloween_audio.js INPUT FFMPEG FFPROBE");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js/audio.js"),"utf8");
const tracks=JSON.parse(source.match(/const HALLOWEEN_TRACKS = (\[[\s\S]*?\n\]);/)[1]);
function run(exe,args){const result=spawnSync(exe,args,{encoding:"utf8",windowsHide:true});if(result.status!==0)throw Error(result.stderr||String(result.error));return result.stdout;}
function duration(file){return Number(run(ffprobe,["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",file]).trim());}
const total=duration(input);
const cutoff=Number(source.match(/const HALLOWEEN_AUDIO_END = (\d+);/)[1]);
const output=path.join(root,"assets/audio/music/halloween");
fs.mkdirSync(output,{recursive:true});
for(let index=0;index<tracks.length;index++){
  const [start,title]=tracks[index];
  const end=tracks[index+1]?.[0]??cutoff;
  if(end<=start||end>total+.1)throw Error(`Invalid timestamps for ${title}`);
  const file=path.join(output,`halloween_${String(index+1).padStart(2,"0")}.mp3`);
  // Copy original MP3 frames, preserving quality without another lossy encode.
  run(ffmpeg,["-hide_banner","-loglevel","error","-y","-ss",String(start),"-i",input,"-t",String(end-start),"-map","0:a:0","-c:a","copy","-map_metadata","-1","-metadata",`title=${title}`,"-metadata","album=ALLSTAR Halloween","-metadata",`track=${index+1}/${tracks.length}`,file]);
  const actual=duration(file);
  if(Math.abs(actual-(end-start))>.15)throw Error(`Unexpected duration: ${title}: ${actual}`);
  console.log(`${index+1}. ${title}: ${actual.toFixed(3)}s`);
}
console.log(`${tracks.length} tracks copied and duration-checked through ${cutoff}s of ${total.toFixed(3)}s original`);
