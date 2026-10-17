import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pacedNarrationText} from './narration-settings.mjs';
import {generateNarration} from './elevenlabs-generate.mjs';
const mp3=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(1024,18)]);
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'lumi-pacing-'));fs.mkdirSync(path.join(root,'dist/assets/audio'),{recursive:true});fs.writeFileSync(path.join(root,'dist/assets/audio/catalogo.json'),JSON.stringify(Array.from({length:5},(_,i)=>({file:'audio-00'+(i+1)+'.mp3',text:'Olá! Vamos brincar '+i+'?'}))));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
const opts=root=>({root,voiceId:'LumiVoice123456',apiKey:'TEST_SECRET_NOT_REAL',log:()=>{},fetchImpl:async()=>new Response(mp3)});
test('pausas separam frases sem alterar sílabas ou introduzir marcação fornecida pelo texto',()=>{
 assert.equal(pacedNarrationText('bo'),'bo');assert.equal(pacedNarrationText('BOLA'),'bola');
 const speech=pacedNarrationText('Olá! Eu sou a Lumi. Vamos brincar? Uma coisa de cada vez. Mais uma.');
 assert.equal((speech.match(/<break/g)||[]).length,3);assert.ok(speech.includes('<break time="0.5s" />'));
 assert.ok(pacedNarrationText('<script>teste</script>').includes('&lt;script&gt;'));
});
test('amostra gera três arquivos e a execução completa reaproveita o lote verificado',async t=>{
 const root=fixture(t);let calls=0;const options={...opts(root),fetchImpl:async()=>{calls++;return new Response(mp3);}};
 const sample=await generateNarration({...options,limit:3});assert.equal(sample.generated,3);assert.equal(calls,3);
 const full=await generateNarration(options);assert.equal(full.generated,2);assert.equal(full.skipped,3);assert.equal(calls,5);
});
test('recibos antigos ou configuração de ritmo alterada exigem regeneração',async t=>{
 const root=fixture(t);await generateNarration(opts(root));const file=path.join(root,'.lumi-audio-generation.json'),receipt=JSON.parse(fs.readFileSync(file));
 delete receipt.outputs['audio-001.mp3'].requestHash;receipt.outputs['audio-002.mp3'].requestHash='ritmo-antigo';fs.writeFileSync(file,JSON.stringify(receipt));
 const result=await generateNarration(opts(root));assert.equal(result.generated,2);assert.equal(result.skipped,3);
});
test('catálogo preserva a fala da interface e fornece instruções de síntese sem nomes duplicados',()=>{
 const entries=JSON.parse(fs.readFileSync('dist/assets/audio/catalogo.json','utf8'));
 assert.equal(entries.length,158);assert.equal(new Set(entries.map(e=>e.file)).size,158);assert.equal(new Set(entries.map(e=>e.text)).size,158);
 assert.ok(entries.every(e=>!e.text.includes('<break')&&e.synthesisText===pacedNarrationText(e.text)));
 assert.equal(entries.find(e=>e.text==='Encontre a letra A.').file,'audio-001.mp3');
 assert.equal(entries.find(e=>e.text==='Vamos ajustar as sílabas? Você pode desfazer e ouvir a palavra.').file,'audio-041.mp3');
});
test('lote escolhido gera somente seus arquivos e a geração completa reaproveita os MP3 verificados',async t=>{
 const root=fixture(t),calls=[];const options={...opts(root),fetchImpl:async(_url,request)=>{calls.push(JSON.parse(request.body).text);return new Response(mp3);}};
 const selected=await generateNarration({...options,onlyFiles:['audio-002.mp3','audio-004.mp3']});assert.equal(selected.generated,2);assert.ok(!fs.existsSync(path.join(root,'dist/assets/audio/audio-001.mp3')));assert.ok(calls.every(text=>text.includes('1?')||text.includes('3?')));
 const full=await generateNarration(options);assert.equal(full.generated,3);assert.equal(full.skipped,2);
 await assert.rejects(()=>generateNarration({...options,onlyFiles:['audio-999.mp3']}),/não está no catálogo/);
});
