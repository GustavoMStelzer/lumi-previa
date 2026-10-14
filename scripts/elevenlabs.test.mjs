import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateNarration,describeApiError} from './elevenlabs-generate.mjs';

const mp3=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(1024,18)]);
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lumi-elevenlabs-'));
 fs.mkdirSync(path.join(root,'dist/assets/audio'),{recursive:true});
 fs.writeFileSync(path.join(root,'dist/assets/audio/catalogo.json'),JSON.stringify([{file:'audio-001.mp3',text:'Encontre a letra A.'},{file:'audio-002.mp3',text:'A palavra é BOLA.'}]));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;
}
const options=root=>({root,voiceId:'LumiVoice123456',apiKey:'TEST_SECRET_NOT_REAL',log:()=>{}});

test('geração usa a mesma voz e textos exatos; retomada não consome chamadas e chave não é gravada',async t=>{
 const root=fixture(t),calls=[];
 const fetchImpl=async(url,request)=>{calls.push({url,request});return new Response(mp3,{headers:{'Content-Type':'audio/mpeg'}});};
 const first=await generateNarration({...options(root),fetchImpl});
 assert.equal(first.generated,2);assert.equal(calls.length,2);
 assert.ok(calls.every(c=>c.url==='https://api.elevenlabs.io/v1/text-to-speech/LumiVoice123456?output_format=mp3_44100_128'));
 assert.deepEqual(calls.map(c=>JSON.parse(c.request.body).text),['Encontre a letra A.','A palavra é BOLA.']);
 assert.ok(calls.every(c=>JSON.parse(c.request.body).model_id==='eleven_multilingual_v2'));
 const second=await generateNarration({...options(root),fetchImpl});
 assert.equal(second.skipped,2);assert.equal(calls.length,2);
 const receipt=fs.readFileSync(path.join(root,'.lumi-audio-generation.json'),'utf8');
 assert.ok(!receipt.includes('TEST_SECRET_NOT_REAL'));
 fs.writeFileSync(path.join(root,'dist/assets/audio/audio-002.mp3'),'arquivo danificado');
 const third=await generateNarration({...options(root),fetchImpl});
 assert.equal(third.generated,1);assert.equal(third.skipped,1);assert.equal(calls.length,3);
});

test('erro de permissão interrompe sem repetir; áudios concluídos sobrevivem à retomada',async t=>{
 const root=fixture(t);let calls=0;
 await assert.rejects(()=>generateNarration({...options(root),fetchImpl:async()=>{calls++;return calls===1?new Response(mp3):new Response('TEST_SECRET_NOT_REAL',{status:403});}}),error=>error.message.includes('HTTP 403')&&!error.message.includes('TEST_SECRET_NOT_REAL'));
 assert.equal(calls,2);assert.ok(fs.existsSync(path.join(root,'dist/assets/audio/audio-001.mp3')));assert.ok(!fs.existsSync(path.join(root,'dist/assets/audio/audio-002.mp3')));
 let resumed=0;const result=await generateNarration({...options(root),fetchImpl:async()=>{resumed++;return new Response(mp3);}});
 assert.equal(resumed,1);assert.equal(result.skipped,1);
});

test('resposta sem MP3 e catálogo com caminho externo nunca são salvos como áudios',async t=>{
 const root=fixture(t);
 await assert.rejects(()=>generateNarration({...options(root),fetchImpl:async()=>new Response(JSON.stringify({error:'resposta incorreta'}))}),/MP3 válido/);
 assert.ok(!fs.existsSync(path.join(root,'dist/assets/audio/audio-001.mp3')));
 fs.writeFileSync(path.join(root,'dist/assets/audio/catalogo.json'),JSON.stringify([{file:'../../../fora.mp3',text:'Texto'}]));
 await assert.rejects(()=>generateNarration({...options(root),fetchImpl:async()=>{assert.fail('Não deve chamar a API');}}),/roteiro de áudio/);
});

test('HTTP 400 mostra o código e a mensagem do serviço, remove a chave e não repete pedidos',async t=>{
 const root=fixture(t);let calls=0;
 const detail={type:'validation_error',code:'invalid_parameters',param:'model_id',message:'O modelo não foi aceito. Chave TEST_SECRET_NOT_REAL.'};
 await assert.rejects(()=>generateNarration({...options(root),fetchImpl:async()=>{calls++;return new Response(JSON.stringify({detail}),{status:400});}}),error=>error.message.includes('Código: invalid_parameters')&&error.message.includes('Parâmetro: model_id')&&error.message.includes('O modelo não foi aceito')&&error.message.includes('[chave oculta]')&&!error.message.includes('TEST_SECRET_NOT_REAL'));
 assert.equal(calls,1);assert.ok(!fs.existsSync(path.join(root,'dist/assets/audio/audio-001.mp3')));
});

test('erros legados e de validação preservam o diagnóstico sem expor valores de entrada',()=>{
 const legacy=describeApiError(400,JSON.stringify({detail:{status:'voice_not_found',message:'Voice not found.'}}),'TEST_SECRET_NOT_REAL');
 assert.ok(legacy.includes('Código: voice_not_found'));assert.ok(legacy.includes('Voice not found.'));
 const validation=describeApiError(422,JSON.stringify({detail:[{loc:['body','text'],msg:'Field required',input:'TEST_SECRET_NOT_REAL'}]}),'TEST_SECRET_NOT_REAL');
 assert.ok(validation.includes('Field required'));assert.ok(!validation.includes('TEST_SECRET_NOT_REAL'));
 const html=describeApiError(400,'<html><title>Invalid request</title><body>TEST_SECRET_NOT_REAL</body></html>','TEST_SECRET_NOT_REAL');
 assert.ok(html.includes('Resposta HTML: Invalid request'));assert.ok(!html.includes('TEST_SECRET_NOT_REAL'));
});

test('chave codificada e controles de terminal são removidos antes de apresentar detalhes',()=>{
 const key='FAKE_KEY_WITH_SPECIAL!@#123456';
 const message='Token '+key+' '+encodeURIComponent(key)+' '+Buffer.from(key).toString('base64')+'\u001b[31m erro';
 const result=describeApiError(400,JSON.stringify({detail:{code:'invalid_api_key',message}}),key);
 assert.ok(!result.includes(key));assert.ok(!result.includes(encodeURIComponent(key)));assert.ok(!result.includes(Buffer.from(key).toString('base64')));assert.ok(!result.includes('\u001b'));
});
