const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.resolve(__dirname,'..'),port=Number(process.env.ALLSTAR_PREVIEW_PORT)||8267;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let url;try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return;}
  if(url==='/')url='/mobile.html';
  if(!['GET','HEAD'].includes(req.method)||!/^\/(?:index\.html|mobile\.html|(?:assets|css|js|data)\/[^\0]+)$/.test(url)){res.writeHead(404).end();return;}
  const file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep)||url.split('/').some(part=>part.startsWith('.'))){res.writeHead(404).end();return;}
  fs.stat(file,(error,stat)=>{
    if(error||!stat.isFile()){res.writeHead(404).end();return;}
    const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    let start=0,end=stat.size-1,status=200;
    if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!match){res.writeHead(416).end();return;}start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;if(start>end){res.writeHead(416).end();return;}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  });
}).listen(port,'0.0.0.0',()=>{
  console.log(`PC: http://127.0.0.1:${port}/index.html`);
  for(const entries of Object.values(os.networkInterfaces()))for(const item of entries||[])if(item.family==='IPv4'&&!item.internal)console.log(`Téléphone, même Wi-Fi: http://${item.address}:${port}/mobile.html`);
});
