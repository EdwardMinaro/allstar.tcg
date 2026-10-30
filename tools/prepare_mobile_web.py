from pathlib import Path
from PIL import Image
import shutil,subprocess,concurrent.futures,json,sys,os,hashlib
SRC=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:
    raise SystemExit('Usage: prepare_mobile_web.py ABSOLUTE_OUTPUT_DIRECTORY')
DIST=Path(sys.argv[1]).resolve()
FF=os.environ.get('ALLSTAR_FFMPEG') or shutil.which('ffmpeg')
if not FF:
    fallback=Path('C:/Users/Anthony1/Downloads/ALLSTAR_Moulinette_V4/ALLSTAR_Moulinette_V4/ffmpeg.exe')
    if fallback.is_file():FF=str(fallback)
if not FF:raise SystemExit('FFmpeg is required. Install it or set ALLSTAR_FFMPEG.')
DIST.mkdir(parents=True,exist_ok=True)
cache_file=DIST/'.mobile-asset-cache.json'
cache=json.loads(cache_file.read_text()) if cache_file.exists() else {}
next_cache={}
def reuse(file,dest):
    key=file.relative_to(SRC).as_posix()
    digest=hashlib.sha256(file.read_bytes()).hexdigest()
    next_cache[key]=digest
    return dest.exists() and cache.get(key)==digest
for folder in ['js','css','data']:
    shutil.copytree(SRC/folder,DIST/folder,dirs_exist_ok=True)
shutil.copy2(SRC/'index.html',DIST/'game.html')
shell=(SRC/'mobile.html').read_text(encoding='utf-8').replace('src="index.html?mobile=1"','src="game.html?mobile=1"')
shell=shell.replace('</head>','<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icons/icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes"></head>')
shell=shell.replace('</body>',"<script>if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});</script></body>")
(DIST/'index.html').write_text(shell,encoding='utf-8')
mapping={}
def image(file):
    rel=file.relative_to(SRC)
    dest=DIST/rel
    dest.parent.mkdir(parents=True,exist_ok=True)
    if file.suffix.lower() in ['.png','.jpg','.jpeg']:
        dest=dest.with_suffix('.webp')
        if not reuse(file,dest):
            with Image.open(file) as im:
                # Same composition/proportions; only web encoding changes.
                im.save(dest,'WEBP',quality=94,method=4)
        return rel.as_posix(),dest.relative_to(DIST).as_posix()
    shutil.copy2(file,dest)
    return None
images=[p for p in (SRC/'assets').rglob('*') if p.is_file() and 'audio' not in p.relative_to(SRC/'assets').parts]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for result in pool.map(image,images):
        if result:mapping[result[0]]=result[1]
audio=[p for p in (SRC/'assets/audio').rglob('*') if p.is_file() and p.suffix.lower() in ['.mp3','.wav','.ogg','.m4a']]
def sound(file):
    rel=file.relative_to(SRC);dest=(DIST/rel).with_suffix('.mp3');dest.parent.mkdir(parents=True,exist_ok=True)
    if not reuse(file,dest):
        subprocess.run([str(FF),'-v','error','-y','-i',str(file),'-map','0:a:0','-c:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(dest)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    return rel.as_posix(),dest.relative_to(DIST).as_posix()
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for old,new in pool.map(sound,audio):mapping[old]=new
for folder in ['js','css','data']:
    for file in (DIST/folder).rglob('*'):
        if file.is_file() and file.suffix in ['.js','.css','.json']:
            text=file.read_text(encoding='utf-8')
            for old,new in mapping.items():text=text.replace(old,new)
            file.write_text(text,encoding='utf-8')
for name in ['game.html','index.html']:
    file=DIST/name;text=file.read_text(encoding='utf-8')
    for old,new in mapping.items():text=text.replace(old,new)
    file.write_text(text,encoding='utf-8')
(DIST/'icons').mkdir(exist_ok=True)
with Image.open(SRC/'assets/branding/allstars_icon.ico') as icon:
    for size in [192,512]:icon.convert('RGBA').resize((size,size),Image.Resampling.LANCZOS).save(DIST/'icons'/f'icon-{size}.png')
manifest={'id':'./','name':'ALLSTAR Mobile','short_name':'ALLSTAR','lang':'fr','start_url':'./','scope':'./','display':'fullscreen','orientation':'landscape','background_color':'#08080d','theme_color':'#111116','icons':[{'src':f'icons/icon-{s}.png','sizes':f'{s}x{s}','type':'image/png','purpose':'any'} for s in [192,512]]}
(DIST/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf-8')
revision=hashlib.sha256()
for file in sorted(p for p in DIST.rglob('*') if p.is_file() and p.name not in ['sw.js','release.json','.mobile-asset-cache.json']):
    revision.update(file.relative_to(DIST).as_posix().encode())
    revision.update(file.read_bytes())
build_id=revision.hexdigest()[:20]
version=json.loads((SRC/'package.json').read_text(encoding='utf-8'))['version']
(DIST/'release.json').write_text(json.dumps({'version':version,'build':build_id,'commit':os.environ.get('GITHUB_SHA','local')}),encoding='utf-8')
cache_file.write_text(json.dumps(next_cache),encoding='utf-8')
(DIST/'sw.js').write_text("const CACHE='allstar-images-"+build_id+"';\n"+"""
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const key of await caches.keys())if((key.startsWith('allstar-images-')||key==='allstar-test-images-v1')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.includes('/assets/')||!/[.](webp|png|jpg)$/.test(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request);if(hit)return hit;const response=await fetch(event.request);if(response.ok&&response.type==='basic')await cache.put(event.request,response.clone());return response;}));
});""",encoding='utf-8')
files=[p for p in DIST.rglob('*') if p.is_file()]
print(json.dumps({'files':len(files),'bytes':sum(p.stat().st_size for p in files),'largest':max(p.stat().st_size for p in files)}))
