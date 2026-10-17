import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVITIES,answerIsCorrect} from '../dist/content.js';
import {createState,restoreState,recordSession,nextActivity,addAssignment,sessionsCSV} from '../dist/model.js';
import {newTeachingDraft,validateTeachingActivity,saveTeachingActivity,setAvailableActivities,availableActivities,questionsForActivity,exportTeachingPack,parseTeachingPack,importTeachingPack} from '../dist/teaching.js';
import {editorHTML} from '../dist/studio.js';
import {boot} from './ui-harness.mjs';

const choice=()=>({...newTeachingDraft('choice','teacher-choice'),name:'Amigos do jardim',skill:'Reconhecer animais',published:true,updatedAt:'2026-10-14T12:00:00.000Z',questions:[{prompt:'Qual é o gato?',options:['GATO','PATO','SAPO'],correct:'GATO',visuals:{GATO:'GATO',PATO:'PATO',SAPO:'SAPO'}}]});
const banana=()=>({...newTeachingDraft('build','teacher-banana'),name:'Vamos montar banana',skill:'Explorar sílabas',published:true,questions:[{prompt:'Monte a palavra BANANA.',target:'BANANA',correct:['BA','NA','NA'],options:['BA','NA','NA','MA'],visual:'🍌'}]});
const rounds=[{prompt:'Qual é o gato?',answer:'GATO',attempts:1,helps:0}];

test('conteúdo próprio funciona nos três modelos e sílabas repetidas formam a palavra',()=>{
 let state=saveTeachingActivity(createState(),choice());state=saveTeachingActivity(state,banana());
 const story={...newTeachingDraft('story','teacher-story'),name:'Uma história no quintal',skill:'Conversar sobre histórias',published:true,questions:[{text:'A Lumi encontrou um gato no jardim.',prompt:'Quem a Lumi encontrou?',options:['GATO','PATO'],correct:'GATO',visual:'GATO'}]};
 state=saveTeachingActivity(state,story);
 assert.equal(availableActivities(state).length,30);
 for(const id of ['teacher-choice','teacher-banana','teacher-story'])for(const q of questionsForActivity(state,id,()=>.3))assert.ok(answerIsCorrect(q,q.correct));
 const q=questionsForActivity(state,'teacher-banana')[0];assert.equal(q.options.filter(x=>x==='NA').length,2);assert.equal(q.correct.join(''),'BANANA');
});
test('uma seleção restrita vale para biblioteca, sugestões e próxima atividade sem apagar resultados',()=>{
 let state=recordSession(createState(),{profileId:'explorador-1',activityId:'letters',rounds,seconds:12});
 state=addAssignment(state,'explorador-1','read');state=setAvailableActivities(state,['build']);
 assert.deepEqual(availableActivities(state).map(a=>a.id),['build']);assert.equal(nextActivity(state,'explorador-1').id,'build');assert.equal(state.sessions.length,1);
 assert.throws(()=>setAvailableActivities(state,[]),/pelo menos uma/);assert.throws(()=>addAssignment(state,'explorador-1','read'),/inválidos/);
 state.profiles[0].age=5;const h=boot(JSON.stringify(state));assert.ok(h.node('#app').innerHTML.includes('Oficina de palavras'));assert.ok(!h.node('#app').innerHTML.includes('data-id="letters"'));h.api.startActivity('letters');assert.equal(h.api.getGame(),null);
});
test('rascunhos não aparecem para a criança; publicação e restauração preservam atividades e progresso',()=>{
 let state=saveTeachingActivity(createState(),{...choice(),published:false});assert.equal(availableActivities(state).length,27);
 state=saveTeachingActivity(state,{...state.customActivities[0],published:true});state=recordSession(state,{profileId:'explorador-1',activityId:'teacher-choice',rounds,seconds:10});
 assert.equal(availableActivities(state).length,28);assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state))),state);assert.ok(sessionsCSV(state).includes('Amigos do jardim'));
 const before=state.sessions[0].activityName;state=saveTeachingActivity(state,{...state.customActivities[0],name:'Novo nome do jogo'});assert.equal(state.sessions[0].activityName,before);assert.ok(sessionsCSV(state).includes(before));
});
test('importação não duplica identificadores nem exporta perfis e respostas',()=>{
 let source=saveTeachingActivity(createState(),choice());source=setAvailableActivities(source,['teacher-choice']);
 const serialized=exportTeachingPack(source);assert.ok(!serialized.includes('explorador-1'));assert.ok(!serialized.includes('sessions'));
 const pack=parseTeachingPack(serialized);let target=importTeachingPack(createState(),pack);target=importTeachingPack(target,pack);assert.equal(target.customActivities.length,1);
 assert.ok(availableActivities(target).some(a=>a.id==='teacher-choice'));assert.equal(target.profiles.length,3);assert.equal(target.sessions.length,0);
});
test('conteúdo inválido é rejeitado antes de publicar e pacotes inválidos não são aceitos parcialmente',()=>{
 assert.throws(()=>validateTeachingActivity({...choice(),questions:[{...choice().questions[0],correct:'BOLA'}]}),/resposta correta/);
 assert.throws(()=>validateTeachingActivity({...banana(),questions:[{...banana().questions[0],target:'BALA'}]}),/formar a palavra/);
 assert.throws(()=>validateTeachingActivity({...banana(),questions:[{...banana().questions[0],options:['BA','NA','MA']}]}),/todas as sílabas/);
 assert.throws(()=>parseTeachingPack('{bad'),/válido/);assert.throws(()=>parseTeachingPack(JSON.stringify({format:'lumi-teacher-pack',version:1,activities:[choice(),{...choice(),id:'letters'}]})),/identificador/);
 const old=createState();assert.throws(()=>importTeachingPack(old,{activities:[choice(),{...choice(),id:'invalid'}],enabledActivityIds:[]}),/identificador/);assert.equal(old.customActivities.length,0);
});
test('textos digitados pela professora são escapados na edição, nas atividades e nos painéis',()=>{
 const activity={...choice(),name:'<img src=x onerror=alert(1)>',skill:'<script>alert(2)</script>',questions:[{...choice().questions[0],prompt:'<script>alert(3)</script>'}]};
 const state=saveTeachingActivity(createState(),activity),h=boot(JSON.stringify(state));h.api.navigate('library');
 assert.ok(h.node('#app').innerHTML.includes('&lt;img'));assert.ok(!h.node('#app').innerHTML.includes('<img src=x'));
 h.api.startActivity(activity.id);assert.ok(h.node('#app').innerHTML.includes('&lt;script&gt;'));assert.ok(!h.node('#app').innerHTML.includes('<script>alert'));
 const html=editorHTML(state.customActivities[0],()=>'<svg></svg>');assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('<script>alert'));
 h.api.unlockAdult();h.api.navigate('family',{confirmed:true});assert.ok(!h.node('#app').innerHTML.includes('<script>alert'));
});
test('o acerto celebra, bloqueia resposta repetida e aguarda Continuar; a conclusão salva só uma sessão',()=>{
 const h=boot();h.api.startActivity('letters');const first=h.api.getGame().questions[0];h.api.submitAnswer(first.correct);h.api.submitAnswer(first.correct);
 assert.equal(h.api.getGame().rounds.length,1);assert.ok(h.node('#app').innerHTML.includes('celebrating'));assert.ok(h.node('#app').innerHTML.includes('data-action="next"'));
 h.tick(30000);assert.equal(h.api.getGame().index,0);h.click('next');assert.equal(h.api.getGame().index,1);
 while(!h.api.getGame().completed){h.api.submitAnswer(h.api.getGame().questions[h.api.getGame().index].correct);h.click('next');}
 assert.equal(h.api.getState().sessions.length,1);h.tick(20000);assert.equal(h.api.getState().sessions.length,1);
});
test('erro é narrado, mantém o desafio e permite corrigir sem penalizar a reprodução de sílabas',()=>{
 const h=boot();h.api.startActivity('letters');const q=h.api.getGame().questions[0];h.api.submitAnswer(q.options.find(x=>x!==q.correct));
 assert.ok(h.spoken.at(-1).includes('tentar outra vez'));h.tick(5000);assert.equal(h.api.getGame().index,0);assert.equal(h.api.getGame().solved,false);
 h.api.startActivity('build');h.click('listen-syllable',{index:'0'});assert.equal(h.api.getGame().build.length,0);assert.equal(h.api.getGame().attempts,0);assert.equal(h.api.getGame().helps,0);
 const build=h.api.getGame().questions[0];for(const part of build.correct)h.click('syllable',{index:String(build.options.indexOf(part))});assert.equal(h.api.getGame().solved,true);h.click('next');assert.equal(h.api.getGame().index,1);
});
test('o jogo aceita sílabas repetidas e confere ao preencher os espaços, sem botão adicional',()=>{
 const state=saveTeachingActivity(createState(),banana()),h=boot(JSON.stringify(state));h.api.startActivity('teacher-banana');const q=h.api.getGame().questions[0];
 const used=new Set();for(const piece of q.correct){const index=q.options.findIndex((part,i)=>part===piece&&!used.has(i));used.add(index);h.click('syllable',{index:String(index)});}
 assert.equal(h.api.getGame().solved,true);assert.ok(!h.node('#app').innerHTML.includes('data-action="check-build"'));h.click('next');assert.equal(h.api.getState().sessions.length,1);
});
test('fechar janela ou voltar à aba mantém a pergunta; sair não salva uma sessão incompleta',()=>{
 const h=boot();h.api.startActivity('letters');h.api.submitAnswer(h.api.getGame().questions[0].correct);h.document.hidden=true;h.tick(3000);assert.equal(h.api.getGame().index,0);
 h.document.hidden=false;h.node('#overlay-root').innerHTML='<div>Janela</div>';h.tick(2000);assert.equal(h.api.getGame().index,0);h.node('#overlay-root').innerHTML='';h.tick(10000);assert.equal(h.api.getGame().index,0);h.click('next');assert.equal(h.api.getGame().index,1);
 h.api.submitAnswer(h.api.getGame().questions[1].correct);h.api.navigate('adventure',{confirmed:true});h.tick(10000);assert.equal(h.api.getGame(),null);assert.equal(h.api.getState().sessions.length,0);
});
test('testar uma atividade própria não conclui sugestões nem grava progresso de criança',()=>{
 let state=saveTeachingActivity(createState(),choice());state=addAssignment(state,'explorador-1','teacher-choice');const h=boot(JSON.stringify(state));h.api.unlockAdult();h.api.previewTeacherActivity('teacher-choice');h.api.submitAnswer('GATO');h.click('next');
 assert.equal(h.api.getGame().completed,true);assert.equal(h.api.getState().sessions.length,0);assert.equal(h.api.getState().assignments[0].status,'pending');assert.ok(h.node('#app').innerHTML.includes('TESTE DA PROFESSORA CONCLUÍDO'));
 h.api.leaveTeacherPreview();assert.equal(h.api.getGame(),null);assert.ok(h.node('#app').innerHTML.includes('Atividades da professora'));
});
test('os nomes das falas anteriores são preservados e o catálogo inclui a família',()=>{
 const entries=JSON.parse(fs.readFileSync('dist/assets/audio/catalogo.json','utf8'));
 assert.equal(entries.length,158);assert.equal(entries.find(e=>e.text==='Encontre a letra A.').file,'audio-001.mp3');
 assert.equal(entries.find(e=>e.text==='Aventura concluída! Agora, que tal brincar um pouco fora da tela?').file,'audio-039.mp3');
 assert.equal(entries.filter(e=>Number(e.file.match(/\d+/)[0])>39).length,123);
 assert.equal(new Set(entries.map(e=>e.file)).size,158);
});

function fillEditor(h,template='choice'){
 h.collection('[data-question-editor]',[{dataset:{optionCount:'3'}}]);
 for(const [id,value] of Object.entries({'teacher-title':'A atividade da professora','teacher-skill':'Explorar os animais','teacher-age':'4','teacher-description':'Vamos descobrir juntos!','question-0-prompt':'Qual é o gato?','question-0-option-0':'GATO','question-0-option-1':'PATO','question-0-option-2':'SAPO','question-0-correct':'0','question-0-visual-0':'GATO','question-0-visual-1':'PATO','question-0-visual-2':'SAPO'}))h.node('#'+id).value=value;
 if(template==='build')for(const [id,value] of Object.entries({'question-0-prompt':'Monte a palavra BANANA.','question-0-target':'BANANA','question-0-pieces':'BA, NA, NA','question-0-extra':'MA','question-0-visual':'🍌'}))h.node('#'+id).value=value;
 if(template==='story'){h.node('#question-0-story').value='A Lumi encontrou um gato no jardim.';h.node('#question-0-visual').value='GATO';}
}
test('formulário da professora publica os três modelos e os jogos podem ser concluídos',()=>{
 for(const template of ['choice','build','story']){
  const h=boot();h.api.unlockAdult();h.api.openTeacherEditor(null,template);fillEditor(h,template);h.events.submit({target:{id:'teacher-editor-form'},preventDefault(){}});
  assert.equal(h.api.getState().customActivities.length,1);const a=h.api.getState().customActivities[0];assert.equal(a.published,true);assert.equal(a.age,'4');
  h.api.startActivity(a.id);h.api.submitAnswer(h.api.getGame().questions[0].correct);h.click('next');assert.equal(h.api.getState().sessions.length,1);
 }
});
test('seleção salva pelo formulário da escola altera a aventura imediatamente',()=>{
 const state=createState();state.profiles[0].age=4;const h=boot(JSON.stringify(state));h.api.unlockAdult();h.api.navigate('school');h.collection('#availability-form input:checked',[{value:'sounds'}]);h.events.submit({target:{id:'availability-form'},preventDefault(){}});
 h.api.navigate('adventure');assert.deepEqual([...h.api.getState().enabledActivityIds],['sounds']);assert.ok(h.node('#app').innerHTML.includes('Detetive dos sons'));assert.ok(!h.node('#app').innerHTML.includes('data-id="story"'));
});
test('formulário incompleto exibe orientação e o botão de áudio preserva a edição em andamento',()=>{
 const h=boot();h.api.unlockAdult();h.api.openTeacherEditor(null,'choice');fillEditor(h);h.node('#question-0-correct').value='';h.api.saveTeacherDraft(true);
 assert.equal(h.api.getState().customActivities.length,0);assert.ok(h.node('#editor-error').textContent.includes('resposta correta'));
 h.node('#question-0-correct').value='0';h.click('mute');assert.equal(h.api.getDraft().name,'A atividade da professora');assert.equal(h.api.getDraft().questions[0].correct,'GATO');
});
