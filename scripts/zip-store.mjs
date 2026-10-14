import fs from 'node:fs';

const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=bytes=>{let crc=0xffffffff;for(const b of bytes)crc=table[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;};

export function writeZip(destination,entries){
 if(entries.length>65535)throw new Error('Pacote excede o limite de arquivos.');
 const local=[],central=[];let offset=0;
 for(const {name,data:input} of entries){
  if(!name||name.startsWith('/')||name.includes('..')||name.includes('\\'))throw new Error('Nome inválido no ZIP.');
  const bytes=Buffer.from(input),filename=Buffer.from(name,'utf8');
  if(bytes.length>0xffffffff||offset+bytes.length>0xffffffff)throw new Error('Pacote excede o limite de tamanho.');
  const crc=crc32(bytes),header=Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(33,12);
  header.writeUInt32LE(crc,14);header.writeUInt32LE(bytes.length,18);header.writeUInt32LE(bytes.length,22);header.writeUInt16LE(filename.length,26);
  local.push(header,filename,bytes);
  const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);
  directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(33,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(bytes.length,20);directory.writeUInt32LE(bytes.length,24);
  directory.writeUInt16LE(filename.length,28);directory.writeUInt32LE(offset,42);central.push(directory,filename);
  offset+=header.length+filename.length+bytes.length;
 }
 const directoryBytes=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);
 end.writeUInt32LE(directoryBytes.length,12);end.writeUInt32LE(offset,16);
 fs.writeFileSync(destination,Buffer.concat([...local,directoryBytes,end]));
}
