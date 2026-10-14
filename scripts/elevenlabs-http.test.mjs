import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {curlRequest,describeConnectionError,diagnoseConnection} from './elevenlabs-http.mjs';
import {generateNarration} from './elevenlabs-generate.mjs';

async function localServer(t,handler){
 const server=http.createServer(handler);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 return 'http://127.0.0.1:'+server.address().port;
}

test('cURL real preserva acentos, aspas e bytes do áudio; chave não aparece em argumentos',async t=>{
 const payload={text:'Encontre a letra A. A Lumi diz: "Olá!"\nPalavra é BOLA. \\ caminho',model_id:'eleven_multilingual_v2'};
 const binary=Buffer.concat([Buffer.from('ID3'),Buffer.from(Array.from({length:1024},(_,i)=>i%256)),Buffer.from('__LUMI_HTTP_STATUS__ dentro do áudio')]);
 let received;
 const url=await localServer(t,(req,res)=>{const chunks=[];req.on('data',b=>chunks.push(b));req.on('end',()=>{received={method:req.method,key:req.headers['xi-api-key'],body:JSON.parse(Buffer.concat(chunks).toString('utf8'))};res.writeHead(200,{'Content-Type':'audio/mpeg'});res.end(binary);});});
 const response=await curlRequest(url,{method:'POST',headers:{'xi-api-key':'ONLY_A_FAKE_TEST_SECRET','Content-Type':'application/json'},body:JSON.stringify(payload)},{spawnImpl:(command,args,options)=>{assert.deepEqual(args,['--disable','--config','-']);assert.ok(!args.join(' ').includes('ONLY_A_FAKE_TEST_SECRET'));assert.ok(!options.shell);return spawn(command,args,options);}});
 assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),binary);
 assert.deepEqual(received,{method:'POST',key:'ONLY_A_FAKE_TEST_SECRET',body:payload});
});

test('HTTP 403 do cURL não grava JSON como MP3 nem repete a geração',async t=>{
 let calls=0;
 const url=await localServer(t,(req,res)=>{calls++;req.resume();res.writeHead(403,{'Content-Type':'application/json'});res.end('{"detail":"ONLY_A_FAKE_TEST_SECRET"}');});
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lumi-curl-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const folder=path.join(root,'dist/assets/audio');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'catalogo.json'),JSON.stringify([{file:'audio-001.mp3',text:'Encontre a letra A.'}]));
 const logs=[];
 await assert.rejects(()=>generateNarration({root,voiceId:'TEST_VOICE_123',apiKey:'ONLY_A_FAKE_TEST_SECRET',log:line=>logs.push(line),fetchImpl:(_url,request)=>curlRequest(url,request)}),error=>error.message.includes('HTTP 403')&&!error.message.includes('ONLY_A_FAKE_TEST_SECRET'));
 assert.equal(calls,1);assert.ok(!fs.existsSync(path.join(folder,'audio-001.mp3')));assert.ok(!logs.join('\n').includes('ONLY_A_FAKE_TEST_SECRET'));
});

test('falhas de certificado e DNS exibem códigos úteis sem mostrar mensagens que contenham chave',async()=>{
 const spawnImpl=()=>{
  const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>{};
  queueMicrotask(()=>{child.stderr.end('ONLY_A_FAKE_TEST_SECRET');child.stdout.end();child.emit('close',60);});return child;
 };
 await assert.rejects(()=>curlRequest('https://api.elevenlabs.io/v1/models',{}, {spawnImpl}),error=>{const message=describeConnectionError(error);return message.includes('CURL_60')&&message.includes('certificado')&&!message.includes('ONLY_A_FAKE_TEST_SECRET');});
 const message=describeConnectionError({message:'ONLY_A_FAKE_TEST_SECRET',cause:{code:'ENOTFOUND',message:'ONLY_A_FAKE_TEST_SECRET'}});
 assert.ok(message.includes('ENOTFOUND'));assert.ok(!message.includes('ONLY_A_FAKE_TEST_SECRET'));
});

test('diagnóstico consulta somente modelos, sem chave e sem gerar voz',async()=>{
 const logs=[];let calls=0;
 await diagnoseConnection({log:line=>logs.push(line),requestImpl:async(url,request)=>{calls++;assert.equal(url,'https://api.elevenlabs.io/v1/models');assert.equal(request.method,'GET');assert.ok(!request.headers['xi-api-key']);assert.equal(request.body,undefined);return new Response('{}',{status:401});}});
 assert.equal(calls,1);assert.ok(logs.some(line=>line.includes('Conexão HTTPS confirmada')));
});

test('diagnóstico com HTTP 404 distingue resposta HTTPS de erro de transporte',async()=>{
 const logs=[];
 await diagnoseConnection({log:line=>logs.push(line),requestImpl:async()=>new Response('{}',{status:404})});
 assert.ok(logs.some(line=>line.includes('Uma resposta HTTPS foi recebida')));
 assert.ok(logs.some(line=>line.includes('não valida a voz nem a API key')));
 assert.ok(logs.some(line=>line.includes('GERAR_VOZ_WINDOWS.bat')));
});

test('ajuste de revogação do Windows fica restrito ao HTTPS da API ElevenLabs e preserva validação TLS',async()=>{
 const configs=[];
 const spawnImpl=(_command,args,options)=>{
  assert.deepEqual(args,['--disable','--config','-']);assert.ok(!options.shell);
  const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>{};
  let input='';child.stdin.on('data',chunk=>{input+=chunk.toString('utf8');});
  child.stdin.on('end',()=>{configs.push(input);queueMicrotask(()=>{child.stderr.end();child.stdout.end('OK__LUMI_HTTP_STATUS__200');child.emit('close',0);});});return child;
 };
 for(const [url,enabled] of [['https://api.elevenlabs.io/v1/models',true],['https://outro.example/v1/models',true],['http://api.elevenlabs.io/v1/models',true],['https://api.elevenlabs.io/v1/models',false]])await curlRequest(url,{}, {spawnImpl,revocationBestEffort:enabled});
 assert.equal(configs[0].split('\n').filter(line=>line==='ssl-revoke-best-effort').length,1);
 assert.ok(configs.slice(1).every(config=>!config.includes('ssl-revoke-best-effort')));
 assert.ok(configs.every(config=>!config.split('\n').some(line=>/^(?:insecure|ssl-no-revoke|proxy-insecure)$/.test(line))));
});
