import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVITIES,EXTRA_STORIES,makeQuestions,SOUND_DEMO} from '../dist/content.js';
import {WORD_ART} from '../dist/illustrations.js';
import {createState,restoreState,recordSession} from '../dist/model.js';
import {recommendedActivities,familyWeeklySummary} from '../dist/family-model.js';
import {boot} from './ui-harness.mjs';
const newStories=['story-butterfly','story-picnic','story-rain','story-ball','story-party','story-night','story-lake','story-sad','story-bath','story-garden'];

test('quatro histórias novas têm trechos em ordem, respostas apoiadas no texto e imagens para as escolhas',()=>{
 for(const id of newStories){
  const activity=ACTIVITIES.find(a=>a.id===id),questions=makeQuestions(id,()=>.5);
  assert.equal(questions.length,4);assert.ok(fs.existsSync('dist/'+activity.storyArt));
  assert.deepEqual(questions.map(q=>q.text),EXTRA_STORIES[id].map(q=>q.text));
  for(const q of questions){assert.equal(q.type,'story');assert.equal(q.options.length,3);assert.ok(q.text.toLocaleLowerCase('pt-BR').includes(q.correct.toLocaleLowerCase('pt-BR')));for(const option of q.options)assert.ok(WORD_ART[option],option);}
 }
 assert.equal(ACTIVITIES.filter(a=>a.category==='Histórias').length,11);
});
test('cenas das histórias mostram o mesmo cenário em cada parte e conclusão salva uma sessão',()=>{
 for(const id of newStories){
  const h=boot();h.api.startActivity(id);const illustration=h.api.getGame().activity.storyArt;
  for(let i=0;i<4;i++){assert.ok(h.node('#app').innerHTML.includes('class="story-landscape"'));assert.ok(h.node('#app').innerHTML.includes(`src="${illustration}"`));h.api.submitAnswer(h.api.getGame().questions[i].correct);h.click('next');}
  assert.equal(h.api.getState().sessions.length,1);assert.equal(h.api.getState().sessions[0].rounds.length,4);assert.equal(h.api.getGame().completed,true);h.tick(5000);assert.equal(h.api.getState().sessions.length,1);
 }
});
test('exemplo do Detetive não registra respostas e a pergunta distingue sons de letras',()=>{
 const h=boot();h.api.startActivity('sounds');assert.equal(h.api.getGame().intro,true);assert.equal(h.spoken.at(-1),SOUND_DEMO);assert.ok(h.node('#app').innerHTML.includes('Vamos escutar o comecinho?'));
 h.api.submitAnswer(h.api.getGame().questions[0].correct);h.click('sound-demo');h.tick(4000);assert.equal(h.api.getGame().rounds.length,0);assert.equal(h.api.getGame().attempts,0);assert.equal(h.api.getState().sessions.length,0);
 h.click('start-sound-round');assert.equal(h.api.getGame().intro,false);assert.equal(h.spoken.at(-1),'Ouça: mala. Qual nome começa com o mesmo som de mala?');assert.ok(h.node('#app').innerHTML.includes('Qual nome começa com o mesmo som?'));
 const q=h.api.getGame().questions[0];h.click('listen-option',{index:'0'});assert.equal(h.api.getGame().rounds.length,0);h.api.submitAnswer(q.correct);h.click('next');assert.equal(h.api.getGame().index,1);assert.equal(h.api.getGame().rounds.length,1);
});
test('cores e formas usam escolhas por imagem, sem composição de sílabas, e aparecem na área correspondente',()=>{
 let state=createState();for(const id of ['colors','shapes']){
  const h=boot();h.api.startActivity(id);const questions=h.api.getGame().questions;assert.equal(questions.length,4);
  for(const q of questions){assert.equal(q.type,'choice');assert.ok(!('slots' in q));assert.ok(!h.node('#app').innerHTML.includes('data-action="syllable"'));for(const word of q.options)assert.ok(WORD_ART[word]);h.api.submitAnswer(q.correct);h.click('next');}
  assert.equal(h.api.getState().sessions.length,1);
  state=recordSession(state,{profileId:'explorador-1',activityId:id,rounds:[{prompt:'Teste de brincadeira',answer:'Resposta',attempts:1,helps:0}],seconds:10});
 }
 assert.equal(familyWeeklySummary(state,'explorador-1').areas.find(a=>a.id==='exploring').digital,2);
});
test('histórias são recomendadas para 3 a 5 anos e o atalho abre somente a seleção disponível',()=>{
 for(const age of [3,4,5]){const state=createState();state.profiles[0].age=age;state.profiles[0].interests=['Histórias'];const list=recommendedActivities(state,'explorador-1');assert.equal(list[0].category,'Histórias');for(const id of newStories)assert.ok(list.some(a=>a.id===id));}
 const h=boot();h.click('browse-stories');assert.ok(h.node('#app').innerHTML.includes('data-id="story-butterfly"'));assert.ok(!h.node('#app').innerHTML.includes('data-id="colors"'));assert.ok(!h.node('#app').innerHTML.includes('data-id="build"'));
 const restricted=createState();restricted.enabledActivityIds=['story-rain'];const only=boot(JSON.stringify(restricted));only.click('browse-stories');assert.ok(only.node('#app').innerHTML.includes('data-id="story-rain"'));assert.ok(!only.node('#app').innerHTML.includes('data-id="story-butterfly"'));
});
test('atualizar a seleção padrão da 0.4 inclui novos conteúdos e mantém sessões anteriores',()=>{
 let old=createState();old.contentVersion=4;old.enabledActivityIds=['letters','sounds','build','read','missing','story','animals','rhymes'];old=recordSession(old,{profileId:'explorador-1',activityId:'story',rounds:[{prompt:'O que nasceu?',answer:'PLANTA',attempts:1,helps:0}],seconds:15});
 const restored=restoreState(old);assert.equal(restored.contentVersion,7);assert.equal(restored.enabledActivityIds.length,27);assert.equal(restored.sessions[0].activityId,'story');
 old.enabledActivityIds=['letters','story'];assert.deepEqual(restoreState(old).enabledActivityIds,['letters','story']);
});
test('catálogo reaproveita as 55 falas inalteradas e reserva os arquivos das quatro perguntas antigas',()=>{
 const prior=JSON.parse(fs.readFileSync('scripts/fixtures/audio-v04.json')),current=JSON.parse(fs.readFileSync('dist/assets/audio/catalogo.json')),reserved=new Set(prior.map(e=>e.file)),byText=new Map(current.map(e=>[e.text,e.file]));let retained=0,removed=0;
 for(const entry of prior){if(byText.has(entry.text)){retained++;assert.equal(byText.get(entry.text),entry.file);}else{removed++;assert.ok(entry.text.startsWith('Qual palavra começa como '));}}
 assert.equal(retained,55);assert.equal(removed,4);
 for(const entry of current)if(!prior.some(p=>p.text===entry.text))assert.ok(!reserved.has(entry.file));
 assert.ok(current.some(e=>e.text===SOUND_DEMO));for(const id of newStories)for(const q of makeQuestions(id))assert.ok(byText.has((q.text+' '+q.prompt).replace(/\s+/g,' ').trim()));
});
