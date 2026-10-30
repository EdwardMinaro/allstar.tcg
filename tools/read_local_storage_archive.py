"""Read-only LevelDB SST/log recovery from ZIP bytes; never opens a database."""
import hashlib,json,struct,sys,zipfile
from pathlib import Path

def varint(b,p):
    n=0
    for shift in range(0,70,7):
        c=b[p];p+=1;n|=(c&127)<<shift
        if not c&128:return n,p
    raise ValueError('invalid varint')

CRC=[]
for n in range(256):
    for _ in range(8):n=(n>>1)^ (0x82f63b78 if n&1 else 0)
    CRC.append(n)
def masked_crc(data):
    n=0xffffffff
    for c in data:n=CRC[(n^c)&255]^(n>>8)
    n^=0xffffffff
    return (((n>>15)|(n<<17))+0xa282ead8)&0xffffffff

def snappy(b):
    expected,p=varint(b,0);out=bytearray()
    assert expected<64*1024*1024
    while p<len(b):
        tag=b[p];p+=1;kind=tag&3
        if kind==0:
            length=tag>>2
            if length<60:length+=1
            else:
                size=length-59;length=int.from_bytes(b[p:p+size],'little')+1;p+=size
            assert p+length<=len(b)
            out.extend(b[p:p+length]);p+=length
        else:
            if kind==1:
                length=4+((tag>>2)&7);offset=((tag&224)<<3)|b[p];p+=1
            else:
                length=1+(tag>>2);size=2 if kind==2 else 4
                offset=int.from_bytes(b[p:p+size],'little');p+=size
            assert 0<offset<=len(out)
            for _ in range(length):out.append(out[-offset])
        assert len(out)<=expected
    assert len(out)==expected
    return bytes(out)

def handle(b,p=0):
    off,p=varint(b,p);size,p=varint(b,p);return (off,size),p
def block(file,h):
    off,size=h;assert off+size+5<=len(file)
    raw=file[off:off+size];kind=file[off+size]
    crc=struct.unpack_from('<I',file,off+size+1)[0]
    assert masked_crc(raw+bytes([kind]))==crc, 'SST checksum mismatch'
    assert kind in (0,1),f'unsupported compression {kind}'
    return raw if kind==0 else snappy(raw)
def entries(b):
    restarts=struct.unpack_from('<I',b,len(b)-4)[0]
    end=len(b)-4-4*restarts;assert 0<=end<=len(b)-4
    p=0;previous=b''
    while p<end:
        shared,p=varint(b,p);fresh,p=varint(b,p);size,p=varint(b,p)
        assert shared<=len(previous) and p+fresh+size<=end
        key=previous[:shared]+b[p:p+fresh];p+=fresh
        value=b[p:p+size];p+=size
        yield key,value
        previous=key
    assert p==end
def table(file):
    assert len(file)>=48 and file[-8:]==bytes.fromhex('57fb808b247547db')
    footer=file[-48:];_,p=handle(footer);index,_=handle(footer,p)
    for _,value in entries(block(file,index)):
        h,_=handle(value)
        for key,value in entries(block(file,h)):
            assert len(key)>=8
            seqtype=int.from_bytes(key[-8:],'little')
            yield seqtype>>8,seqtype&255,key[:-8],value
def records(file):
    partial=None
    for base in range(0,len(file),32768):
        p=base;end=min(base+32768,len(file))
        while p+7<=end:
            crc,length,kind=struct.unpack_from('<IHB',file,p);p+=7
            if crc==length==kind==0:break
            assert p+length<=end,'truncated log record'
            data=file[p:p+length];p+=length
            assert masked_crc(bytes([kind])+data)==crc,'LOG checksum mismatch'
            if kind==1:yield data
            elif kind==2:partial=data
            elif kind==3:
                assert partial is not None;partial+=data
            elif kind==4:
                assert partial is not None;yield partial+data;partial=None
            else:raise ValueError(f'unknown log record {kind}')
    assert partial is None,'incomplete fragmented log record'
def batches(file):
    for batch in records(file):
        assert len(batch)>=12
        sequence,count=struct.unpack_from('<QI',batch,0);p=12
        for i in range(count):
            kind=batch[p];p+=1
            size,p=varint(batch,p);key=batch[p:p+size];p+=size
            assert kind in (0,1)
            value=b''
            if kind==1:
                size,p=varint(batch,p);value=batch[p:p+size];p+=size
            yield sequence+i,kind,key,value
        assert p==len(batch),'write batch length mismatch'

def string(raw):
    if not raw:return ''
    if raw[0]==1:return raw[1:].decode('latin-1')
    if raw[0]==0:return raw[1:].decode('utf-16-le')
    return raw.decode('utf-8',errors='replace')

def summary(obj):
    player=obj.get('playerState',obj)
    collection=player.get('collection',{})
    return dict(credits=player.get('credits'),career=player.get('careerUnlocked'),
      kinds=sum(v>0 for v in collection.values() if isinstance(v,(int,float))),
      copies=sum(v for v in collection.values() if isinstance(v,(int,float))),
      ultimes={k:v for k,v in collection.items() if 'ultime' in k and isinstance(v,(int,float)) and v>0},
      savedAt=player.get('savedAt'),level=player.get('profileProgress',{}).get('level'))

def main(src,dest):
    dest=Path(dest)
    if dest.exists() and any(dest.iterdir()):raise SystemExit('Use a new empty output directory; evidence is never overwritten.')
    dest.mkdir(parents=True,exist_ok=True)
    original=Path(src).read_bytes()
    (dest/'archive-original.zip').write_bytes(original)
    rows=[];files=[]
    with zipfile.ZipFile(src) as archive:
        for item in archive.infolist():
            if not item.filename.endswith(('.ldb','.log')):continue
            data=archive.read(item)
            parsed=list(table(data) if item.filename.endswith('.ldb') else batches(data))
            files.append(dict(file=item.filename,sha256=hashlib.sha256(data).hexdigest(),records=len(parsed)))
            for sequence,kind,key,value in parsed:
                if not key.startswith(b'_') or b'\x00' not in key:continue
                origin,rawkey=key[1:].split(b'\x00',1)
                name=string(rawkey)
                # Only game save/profile evidence, never credentials or auth state.
                if not name.startswith(('allstarsPlayer','allstarsDecks','allstarsPending','allstarsRecovery','allstarProfileCache','catchCardsDecks')):continue
                row=dict(file=item.filename,sequence=sequence,kind=kind,origin=origin.decode('utf-8',errors='replace'),key=name)
                if kind==1:
                    text=string(value)
                    row['text']=text
                    try:row['json']=json.loads(text)
                    except json.JSONDecodeError:row['json']=None
                rows.append(row)
    rows.sort(key=lambda r:r['sequence'])
    (dest/'records-private.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
    (dest/'verification.json').write_text(json.dumps(dict(archiveSha256=hashlib.sha256(original).hexdigest(),files=files),indent=2),encoding='utf-8')
    for i,row in enumerate(rows):
        obj=row.get('json')
        if isinstance(obj,dict):
            print(json.dumps(dict(index=i,seq=row['sequence'],key=row['key'].split(':')[0],file=row['file'],**summary(obj)),ensure_ascii=True))
    print(f'Parsed {len(rows)} save/profile records. All read block/log CRC32C checks passed.')
if __name__=='__main__':main(*sys.argv[1:])
