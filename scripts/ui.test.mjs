// Integração em uma DOM mínima simulada. Não substitui inspeção visual em browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as content from '../dist/content.js';
import * as model from '../dist/model.js';
import {boot,solveCurrent,missMemory} from './ui-harness.mjs';

function finishGame(api,h=null){
 const questions=[...api.getGame().questions];
 for(const question of questions){if(question.type==='memory')solveCurrent(h);else api.submitAnswer(question.correct);api.nextQuestion();}
 assert.ok(api.getGame().completed);
}
test('todas as experiências renderizam e só registram a sessão depois da conclusão',()=>{
 const h=boot(),{api,node,storage,click}=h;
 assert.ok(node('#app').innerHTML.includes('Pequenos momentos.'));
 for(const activity of content.ACTIVITIES){
  const count=api.getState().sessions.length;
  api.startActivity(activity.id);if(api.getGame().intro)click('start-sound-round');
  assert.ok(node('#app').innerHTML.includes(activity.name));
  if(api.getGame().questions[0].type==='memory')missMemory(h);else api.submitAnswer('resposta incorreta');
  assert.equal(api.getState().sessions.length,count);
  assert.equal(api.getGame().solved,false);
  finishGame(api,h);
  assert.equal(api.getState().sessions.length,count+1);
  const first=api.getState().sessions.at(-1).rounds[0];assert.equal(first.attempts,activity.id==='memory'?1+api.getGame().questions[0].pairs.length:2);
  assert.ok(node('#app').innerHTML.includes('Você e a Lumi foram longe!'));
 }
 const saved=JSON.parse(storage.get(model.STORAGE_KEY));assert.equal(saved.sessions.length,content.ACTIVITIES.length);
 assert.equal(model.profileStats(saved,'explorador-1').completed.size,content.ACTIVITIES.length);
});
test('o conteúdo permanece na revisão do adulto e a família acompanha a sessão concluída',()=>{
 const {api,node}=boot();api.unlockAdult();api.navigate('school');
 assert.ok(node('#app').innerHTML.includes('Conteúdo da prévia.'));
 assert.ok(node('#app').innerHTML.includes('data-action="create-activity"'));
 api.navigate('family');assert.ok(node('#app').innerHTML.includes('A primeira descoberta começa aqui.'));
 api.startActivity('read');finishGame(api);api.navigate('family');
 assert.ok(node('#app').innerHTML.includes('Caminho da leitura'));
 assert.ok(node('#app').innerHTML.includes('Participação ainda não informada'));
});
test('dados salvos incompatíveis e JSON corrompido preservam a inicialização da interface',()=>{
 const {api,node}=boot('{broken json');assert.equal(api.getState().sessions.length,0);
 assert.ok(node('#app').innerHTML.includes('Trilha de hoje'));
 const second=boot(JSON.stringify({version:1,profiles:[{id:'p',name:'Teste',avatar:'fox'}],sessions:[{profileId:'p',activityId:'letters',rounds:[null],seconds:12,createdAt:'2026-10-14T12:00:00Z'}]}));
 assert.equal(second.api.getState().sessions.length,0);assert.ok(second.node('#app').innerHTML.includes('Pequenos momentos.'));
});
