import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {boot} from './ui-harness.mjs';

test('pacote completo contém código, gerador, workflow e prévia funcional sem credenciais',()=>{
 const run=spawnSync(process.execPath,['scripts/export-preview.mjs'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const report=JSON.parse(run.stdout),buffer=fs.readFileSync(report.pacote),files=new Map();let offset=0;
 while(buffer.readUInt32LE(offset)===0x04034b50){const size=buffer.readUInt32LE(offset+18),nameLength=buffer.readUInt16LE(offset+26),extraLength=buffer.readUInt16LE(offset+28),start=offset+30+nameLength+extraLength;files.set(buffer.subarray(offset+30,offset+30+nameLength).toString(),buffer.subarray(start,start+size));offset=start+size;}
 for(const name of ['dist/app.js','dist/illustrations.js','dist/assets/stories/borboleta.svg','dist/assets/stories/piquenique.svg','dist/assets/stories/chuva.svg','dist/assets/stories/bola.svg','dist/assets/stories/aniversario.svg','dist/assets/stories/noite.svg','dist/assets/stories/lago.svg','dist/premium.css','dist/recorder.js','dist/assets/stories/triste.svg','NOVIDADES_0.7.0.md','TESTAR_LUMI_v0.6.md','NOVIDADES_0.6.0.md','BNCC_MAPEAMENTO.md','dist/family.css','dist/family-model.js','scripts/elevenlabs-generate.mjs','scripts/narration-settings.mjs','scripts/elevenlabs-http.mjs','scripts/zip-store.mjs','TESTAR_VOZ_WINDOWS.bat','TESTAR_HISTORIA_WINDOWS.bat','GERAR_VOZ_WINDOWS.bat','.github/workflows/pages.yml','TESTAR_LUMI_v0.5.md','AVANCO_MANUAL_0.5.2.md','PREVIA_LOCAL.html'])if(/^(dist|scripts|\.github)\//.test(name)||name==='PREVIA_LOCAL.html'||fs.existsSync(name))assert.ok(files.has('Lumi_Familia_v0.7.0/'+name),name);
 assert.ok([...files.keys()].every(name=>!name.includes('/.git/')&&!name.includes('/.env')&&!name.includes('/.openai/')&&!name.includes('Copia_Registros')));
 assert.ok(!files.has('Lumi_Familia_v0.7.0/dist/advance.js'));
 const receipt=files.get('Lumi_Familia_v0.7.0/.lumi-audio-generation.json');
 if(receipt){const data=JSON.parse(receipt);assert.deepEqual(Object.keys(data).sort(),['outputs','signature']);assert.match(data.signature,/^[a-f0-9]{64}$/);for(const [file,hashes] of Object.entries(data.outputs)){assert.match(file,/^audio-\d{3}\.mp3$/);assert.deepEqual(Object.keys(hashes).sort(),['audioHash','requestHash','textHash']);assert.ok(Object.values(hashes).every(value=>/^[a-f0-9]{64}$/.test(value)));}}
 const html=files.get('Lumi_Familia_v0.7.0/PREVIA_LOCAL.html').toString();assert.ok(!html.includes('type="module"'));assert.ok(!html.includes('og:url'));assert.ok(html.includes('data:image/svg+xml;base64,'));
 const script=html.match(/<script>([\s\S]+)<\/script>/)[1];new vm.Script(script);
 const code=script.replace(/^\(\(\)=>\{\n/,'').replace(/\n\}\)\(\);$/,'');const h=boot(null,code,{audioDurationMs:3239,stickyGlobalSpeech:true});assert.ok(h.node('#app').innerHTML.includes('Pequenos momentos.'));h.api.startActivity('animals');h.api.submitAnswer(h.api.getGame().questions[0].correct);h.tick(30000);assert.equal(h.api.getGame().index,0);assert.ok(h.node('#app').innerHTML.includes('data-action="next"'));h.click('next');assert.equal(h.api.getGame().index,1);
 const distHTML=files.get('Lumi_Familia_v0.7.0/dist/index.html').toString();assert.ok(distHTML.includes('family.css'));assert.ok(distHTML.includes('premium.css'));assert.ok(html.includes('continue-dock'));assert.ok(!distHTML.includes('og:url'));
});
