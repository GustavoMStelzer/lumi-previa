// Integração em uma DOM mínima simulada. Não substitui inspeção visual em browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import * as content from '../dist/content.js';
import * as model from '../dist/model.js';
import {Narrator} from '../dist/narration.js';
import {RECORDED_NARRATION} from '../dist/audio-manifest.js';

function boot(initialStorage=null){
 const nodes=new Map(),events={},storage=new Map(initialStorage?[[model.STORAGE_KEY,initialStorage]]:[]);
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}},focus(){},setAttribute(){},querySelectorAll(){return []}});return nodes.get(selector);};
 const document={hidden:false,title:'',activeElement:null,querySelector(selector){if(selector.startsWith('.modal')&&!node('#overlay-root').innerHTML)return null;return node(selector);},querySelectorAll(selector){return [node(selector)];},addEventListener(type,cb){events[type]=cb;},body:{classList:{toggle(){}},append(){}},createElement(){return {click(){},remove(){}}}};
 const synthesis={cancel(){},getVoices(){return [{lang:'pt-BR'}]},speak(){}};
 const context=vm.createContext({...content,...model,Narrator,RECORDED_NARRATION,document,Audio:class{constructor(source){this.source=source;}play(){return Promise.resolve();}pause(){}},
  window:{speechSynthesis:synthesis,scrollTo(){},addEventListener(){}},speechSynthesis:synthesis,
  SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  navigator:{},crypto:{randomUUID:()=> 'profile-test'},URL,Blob,
  requestAnimationFrame:fn=>fn(),setInterval(){},setTimeout(){return 1},clearTimeout(){},console});
 const code=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 vm.runInContext(code+'\nglobalThis.testApi={startActivity,submitAnswer,nextQuestion,navigate,getState:()=>state,getGame:()=>game,unlockAdult:()=>{adultUntil=Date.now()+300000;}};',context);
 return {api:context.testApi,nodes,node,events,storage,document};
}
function finishGame(api){
 const questions=[...api.getGame().questions];
 for(const question of questions){api.submitAnswer(question.correct);api.nextQuestion();}
 assert.ok(api.getGame().completed);
}
test('as seis experiências renderizam e só registram a sessão depois da conclusão',()=>{
 const {api,node,storage}=boot();
 assert.ok(node('#app').innerHTML.includes('Vamos descobrir palavras?'));
 for(const activity of content.ACTIVITIES){
  const count=api.getState().sessions.length;
  api.startActivity(activity.id);
  assert.ok(node('#app').innerHTML.includes(activity.name));
  api.submitAnswer('resposta incorreta');
  assert.equal(api.getState().sessions.length,count);
  assert.equal(api.getGame().solved,false);
  finishGame(api);
  assert.equal(api.getState().sessions.length,count+1);
  assert.equal(api.getState().sessions.at(-1).rounds[0].attempts,2);
  assert.ok(node('#app').innerHTML.includes('Você e a Lumi foram longe!'));
 }
 const saved=JSON.parse(storage.get(model.STORAGE_KEY));assert.equal(saved.sessions.length,6);
 assert.equal(model.profileStats(saved,'explorador-1').completed.size,6);
});
test('uma sugestão criada pelo formulário da escola aparece na família e conclui no jogo',()=>{
 const {api,node,events}=boot();api.unlockAdult();api.navigate('school');
 assert.ok(node('#app').innerHTML.includes('Turma das descobertas'));
 node('#assignment-profile').value='explorador-1';node('#assignment-activity').value='read';
 events.submit({target:{id:'assignment-form'},preventDefault(){}});
 assert.equal(api.getState().assignments[0].status,'pending');
 api.navigate('family');assert.ok(node('#app').innerHTML.includes('SUGESTÃO DA ESCOLA'));
 api.startActivity('read');finishGame(api);
 assert.equal(api.getState().assignments[0].status,'done');
 api.navigate('family');assert.ok(node('#app').innerHTML.includes('Caminho da leitura'));
});
test('dados salvos incompatíveis e JSON corrompido preservam a inicialização da interface',()=>{
 const {api,node}=boot('{broken json');assert.equal(api.getState().sessions.length,0);
 assert.ok(node('#app').innerHTML.includes('Jardim das letras'));
 const second=boot(JSON.stringify({version:1,profiles:[{id:'p',name:'Teste',avatar:'fox'}],sessions:[{profileId:'p',activityId:'letters',rounds:[null],seconds:12,createdAt:'2026-10-14T12:00:00Z'}]}));
 assert.equal(second.api.getState().sessions.length,0);assert.ok(second.node('#app').innerHTML.includes('Vamos descobrir palavras?'));
});
