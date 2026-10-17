// Lumi 0.7.0: trilha do dia, jardim, temas, resumo para WhatsApp e reconto gravado.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVITIES,THEMES,themeForDate,makeQuestions,EMOTIONS} from '../dist/content.js';
import {WORD_ART} from '../dist/illustrations.js';
import {RECORDED_NARRATION} from '../dist/audio-manifest.js';
import {OFFLINE_ACTIVITIES,SUGGESTED_AGES,FAMILY_VOICE} from '../dist/family-data.js';
import {createState,recordSession} from '../dist/model.js';
import {dailyTrail,gardenFor,familyShareText,recordFamilyObservation,dayKey} from '../dist/family-model.js';
import {recordingSupported,startVoiceRecording,saveVoiceClip} from '../dist/recorder.js';
import {boot,solveCurrent} from './ui-harness.mjs';
const round=[{prompt:'Teste',answer:'ok',attempts:1,helps:0}];
const at=(d,h=10)=>new Date(2026,9,d,h).toISOString();
const withAge=age=>{const s=createState();s.profiles[0].age=age;return s;};

test('as 137 gravações da 0.6.0 continuam com o mesmo texto e arquivo',()=>{
 const before=JSON.parse(fs.readFileSync('scripts/fixtures/audio-v060.json','utf8')),now=new Map(JSON.parse(fs.readFileSync('dist/assets/audio/catalogo.json','utf8')).map(e=>[e.text,e.file]));
 assert.equal(before.length,137);
 for(const e of before){assert.equal(now.get(e.text),e.file,e.text);assert.equal(RECORDED_NARRATION[e.text],'assets/audio/'+e.file);}
});
test('trilha do dia: uma história, um jogo e uma brincadeira fora da tela, adequados à idade',()=>{
 for(const age of [3,4,5]){const s=withAge(age);for(let d=1;d<=31;d++){const t=dailyTrail(s,'explorador-1',new Date(2026,9,d,9));
  assert.deepEqual(t.steps.map(x=>x.kind),['story','game','offline']);
  assert.equal(t.steps[0].activity.category,'Histórias');assert.notEqual(t.steps[1].activity.category,'Histórias');
  for(const st of t.steps.slice(0,2))assert.ok(SUGGESTED_AGES[st.activity.id].includes(age),st.activity.id);
  assert.ok(t.steps[2].activity.ages.includes(age));}}
});
test('concluir uma parada marca o passo sem trocar a trilha do mesmo dia; trilha completa acende estrela',()=>{
 let s=withAge(4);const day=new Date(2026,9,20,9),t=dailyTrail(s,'explorador-1',day);
 s=recordSession(s,{profileId:'explorador-1',activityId:t.steps[0].activity.id,rounds:round,seconds:30},at(20,10));
 const t2=dailyTrail(s,'explorador-1',new Date(2026,9,20,11));assert.deepEqual(t2.steps.map(x=>x.activity.id),t.steps.map(x=>x.activity.id));assert.equal(t2.done,1);assert.equal(t2.complete,false);
 s=recordSession(s,{profileId:'explorador-1',activityId:t.steps[1].activity.id,rounds:round,seconds:30},at(20,11));
 s=recordFamilyObservation(s,{id:'o-trail',profileId:'explorador-1',activityId:t.steps[2].activity.id,kind:'offline',participation:'with_support'},at(20,12));
 const t3=dailyTrail(s,'explorador-1',new Date(2026,9,20,13));assert.equal(t3.complete,true);
 const g=gardenFor(s,'explorador-1',new Date(2026,9,20,14));assert.equal(g.total,3);assert.equal(g.stars,1);assert.equal(g.today,3);
 assert.ok(g.plants.every(p=>typeof p.plant==='string'));
 const next=dailyTrail(s,'explorador-1',new Date(2026,9,21,9));assert.ok(next.steps.every(x=>!x.done));
 assert.ok(!next.steps.slice(0,2).some(x=>t.steps.slice(0,2).some(y=>y.activity.id===x.activity.id)),'atividades recentes não se repetem no dia seguinte');
});
test('perfis têm jardins separados e a trilha respeita o modo sem som e a seleção do adulto',()=>{
 let s=withAge(4);s=recordSession(s,{profileId:'explorador-2',activityId:'animals',rounds:round,seconds:5},at(5));
 assert.equal(gardenFor(s,'explorador-1').total,0);assert.equal(gardenFor(s,'explorador-2').total,1);
 s.profiles[0].supports.quietMode=true;for(let d=1;d<=31;d++)assert.ok(!dailyTrail(s,'explorador-1',new Date(2026,9,d)).steps.find(x=>x.kind==='offline').activity.usesSound);
 const only=withAge(4);only.enabledActivityIds=['sounds'];const t=dailyTrail(only,'explorador-1');assert.deepEqual(t.steps.map(x=>x.kind),['game','offline']);assert.equal(t.steps[0].activity.id,'sounds');
});
test('temas do mês: quatro temas que se revezam e só citam conteúdos existentes',()=>{
 assert.equal(THEMES.length,4);assert.equal(new Set(Array.from({length:12},(_,m)=>themeForDate(new Date(2026,m,10)).id)).size,4);
 for(const t of THEMES){for(const id of t.activities)assert.ok(ACTIVITIES.some(a=>a.id===id),id);for(const id of t.offline)assert.ok(OFFLINE_ACTIVITIES.some(a=>a.id===id),id);assert.ok(t.activities.some(id=>ACTIVITIES.find(a=>a.id===id).category==='Histórias'),t.id);}
});
test('novas histórias e emoções têm resposta no texto e ilustrações',()=>{
 for(const id of ['story-sad','story-bath','story-garden','emotions']){const a=ACTIVITIES.find(x=>x.id===id);if(a.storyArt)assert.ok(fs.existsSync('dist/'+a.storyArt));
  for(const q of makeQuestions(id,()=>.3)){assert.equal(q.options.filter(o=>o===q.correct).length,1);for(const o of q.options)assert.ok(WORD_ART[o],o);if(q.type==='story')assert.ok(q.text.toLocaleLowerCase('pt-BR').includes(q.correct.toLocaleLowerCase('pt-BR')),q.text);}}
 assert.equal(EMOTIONS.length,4);
});
test('resumo para WhatsApp descreve brincadeiras sem nota, comparação ou diagnóstico',()=>{
 let s=withAge(4);s.profiles[0].name='Bia';const now=new Date(2026,9,20,15);
 assert.match(familyShareText(s,'explorador-1',now),/Ainda não houve brincadeiras/);
 s=recordSession(s,{profileId:'explorador-1',activityId:'story-lake',rounds:round,seconds:30},at(19));s=recordSession(s,{profileId:'explorador-1',activityId:'story-lake',rounds:round,seconds:30},at(20));
 const text=familyShareText(s,'explorador-1',now);
 assert.match(text,/Bia/);assert.match(text,/2 brincadeiras na Lumi/);assert.match(text,/A mais repetida: Um passeio no lago/);assert.match(text,/Ideia para casa:/);assert.match(text,/não uma avaliação/);
 assert.ok(!/nota|nível|acertos|desempenho/i.test(text));assert.ok(text.length<700);
});
test('tela inicial mostra a trilha; jardim abre; conclusão mostra a planta nova; sem microfone não há botão de gravar',()=>{
 const state=withAge(4);const h=boot(JSON.stringify(state));const html=h.node('#app').innerHTML;
 assert.ok(html.includes('Trilha de hoje'));assert.ok(html.includes('Jardim da Lumi'));assert.ok(html.includes('Tema do mês'));
 const t=dailyTrail(h.api.getState(),'explorador-1');assert.ok(html.includes(`data-id="${t.steps[0].activity.id}"`));
 h.api.navigate('garden');assert.ok(h.node('#app').innerHTML.includes('O jardim de'));
 h.api.startActivity('story-sad');for(let i=0;i<4;i++){solveCurrent(h);h.click('next');}
 const done=h.node('#app').innerHTML;assert.ok(done.includes('Uma planta nova nasceu no jardim!'));assert.ok(!done.includes('data-action="record-retell"'));
 h.api.navigate('adventure');assert.ok(h.node('#app').innerHTML.includes('1/3')||h.node('#app').innerHTML.includes('0/3'));
});
test('gravação: só com microfone e armazenamento; trata permissão negada e devolve o áudio ao parar',async()=>{
 assert.equal(recordingSupported({}),false);
 const fakeWin=extra=>({navigator:{mediaDevices:{getUserMedia:extra.gum}},MediaRecorder:extra.MR,indexedDB:{},isSecureContext:true,Blob});
 assert.equal(recordingSupported(fakeWin({gum:()=>{},MR:function(){}})),true);
 await assert.rejects(saveVoiceClip({id:'x'},fakeWin({})),/inválida/);
 const denied=await new Promise(resolve=>startVoiceRecording({win:fakeWin({gum:()=>Promise.reject(Object.assign(new Error('no'),{name:'NotAllowedError'}))}),onError:resolve}));
 assert.match(denied.message,/microfone não foi liberado/);
 let stopped=0;const track={stop(){stopped++;}};
 class FakeRecorder{constructor(){this.state='inactive';this.mimeType='audio/webm';}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['som'],{type:'audio/webm'})});this.onstop();}static isTypeSupported(){return true;}}
 const result=await new Promise((resolve,reject)=>{const c=startVoiceRecording({win:fakeWin({gum:()=>Promise.resolve({getTracks:()=>[track]}),MR:FakeRecorder}),onDone:resolve,onError:reject});setTimeout(()=>c.stop(),20);});
 assert.ok(result.blob.size>0);assert.equal(stopped,1,'o microfone é desligado ao parar');
 assert.ok(FAMILY_VOICE.retell.includes('Lumi'));
});
test('dia local usado na trilha não depende do fuso do servidor',()=>{assert.equal(dayKey(new Date(2026,9,5,23,30)),'2026-10-05');});
