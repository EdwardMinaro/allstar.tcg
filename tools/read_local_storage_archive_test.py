"""Synthetic binary fixtures; no real player data and no live database."""
import contextlib,io,json,struct,tempfile,unittest,zipfile,hashlib
from pathlib import Path
import read_local_storage_archive as reader

def varint(n):
    out=bytearray()
    while n>=128:out.append((n&127)|128);n>>=7
    out.append(n);return bytes(out)
def literal(raw):
    n=len(raw)-1
    if n<60:tag=bytes([n<<2])
    else:
        size=(n.bit_length()+7)//8;tag=bytes([(59+size)<<2])+n.to_bytes(size,'little')
    return varint(len(raw))+tag+raw
def rawblock(pairs):
    result=b''
    for key,value in pairs:result+=varint(0)+varint(len(key))+varint(len(value))+key+value
    return result+struct.pack('<II',0,1)
def physical(raw,compressed=False):
    data=literal(raw) if compressed else raw;kind=bytes([int(compressed)])
    return data+kind+struct.pack('<I',reader.masked_crc(data+kind))
def table(pairs):
    data=physical(rawblock(pairs),True)
    meta=physical(rawblock([]))
    meta_handle=varint(len(data))+varint(len(meta)-5)
    index=physical(rawblock([(pairs[-1][0],varint(0)+varint(len(data)-5))]))
    index_handle=varint(len(data)+len(meta))+varint(len(index)-5)
    footer=(meta_handle+index_handle).ljust(40,b'\0')+bytes.fromhex('57fb808b247547db')
    return data+meta+index+footer
def log_record(kind,data):return struct.pack('<IHB',reader.masked_crc(bytes([kind])+data),len(data),kind)+data
def batch(sequence,key,value):return struct.pack('<QI',sequence,1)+b'\1'+varint(len(key))+key+varint(len(value))+value

class RecoveryReaderTest(unittest.TestCase):
    def test_crc_and_snappy_vectors(self):
        masked=reader.masked_crc(b'123456789');rotated=(masked-0xa282ead8)&0xffffffff
        self.assertEqual(((rotated>>17)|(rotated<<15))&0xffffffff,0xe3069283)
        self.assertEqual(reader.snappy(b'\x05\x10hello'),b'hello')
        self.assertEqual(reader.snappy(b'\x07\x08xab\x01\x02'),b'xababab')
        with self.assertRaises(AssertionError):reader.snappy(b'\x04\x01\x00')
    def test_shared_keys_and_compressed_table(self):
        block=b'\0\x05\x01alpha1'+b'\x05\x03\x01bet2'+struct.pack('<II',0,1)
        self.assertEqual(list(reader.entries(block)),[(b'alpha',b'1'),(b'alphabet',b'2')])
        key=b'_file://\0\1allstarsPlayerV1'+struct.pack('<Q',(11<<8)|1)
        value=b'\0'+json.dumps({'credits':50,'collection':{'card':1},'note':'été'},ensure_ascii=False).encode('utf-16-le')
        encoded=table([(key,value)])
        decoded=list(reader.table(encoded))
        self.assertEqual(decoded,[(11,1,key[:-8],value)])
        self.assertIn('été',reader.string(value))
        corrupt=bytearray(encoded);corrupt[2]^=1
        with self.assertRaises(AssertionError):list(reader.table(bytes(corrupt)))
    def test_fragmented_log_and_zip_evidence(self):
        key=b'_file://\0\1allstarsPlayerV1'
        value=b'\1'+json.dumps({'credits':75,'collection':{'card':2},'padding':'x'*40000}).encode()
        data=batch(15,key,value)
        split=32768-7
        log=log_record(2,data[:split])+log_record(4,data[split:])
        self.assertEqual(list(reader.batches(log)),[(15,1,key,value)])
        workspace_temp=Path(__file__).resolve().parents[1]/'.allstar-test-tmp'
        workspace_temp.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='leveldb-reader-',dir=workspace_temp) as temp:
            assert Path(temp).resolve().parent==workspace_temp.resolve()
            root=Path(temp);archive=root/'input.zip';out=root/'evidence'
            with zipfile.ZipFile(archive,'w') as z:z.writestr('Local Storage/leveldb/000001.log',log)
            before=hashlib.sha256(archive.read_bytes()).hexdigest()
            with contextlib.redirect_stdout(io.StringIO()):reader.main(archive,out)
            self.assertEqual(json.loads((out/'records-private.json').read_text())[0]['json']['credits'],75)
            self.assertEqual(before,hashlib.sha256(archive.read_bytes()).hexdigest())
            self.assertEqual(archive.read_bytes(),(out/'archive-original.zip').read_bytes())
            with self.assertRaises(SystemExit):reader.main(archive,out)
            damaged=bytearray(log);damaged[20]^=1
            with self.assertRaises(AssertionError):list(reader.batches(bytes(damaged)))

if __name__=='__main__':unittest.main()
