import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,restoreState,recordSession,familyBackupJSON,parseFamilyBackup} from '../dist/model.js';
import {normalizeFamilyProfile,updateFamilyProfile,recommendedActivities,recordFamilyObservation,familyWeeklySummary,familySummaryText,dailyTrail} from '../dist/family-model.js';
import {familyDiscoveriesHTML,familyProfileFormHTML} from '../dist/family-ui.js';
import {boot} from './ui-harness.mjs';
const date='2026-10-16T12:00:00.000Z',rounds=[{prompt:'Encontre o gato.',answer:'GATO',attempts:1,helps:0}];
function profile(state,age=3,supports={}){return updateFamilyProfile(state,{...state.profiles[0],age,name:'Meu explorador',interests:['Animais'],supports});}
function session(state,profileId='explorador-1',when=date){return recordSession(state,{profileId,activityId:'animals',rounds,seconds:12},when);}

test('perfil por idade e apoios é validado e preservado sem diagnóstico',()=>{
 const state=profile(createState(),4,{largeTargets:true,quietMode:true,unknown:true});
 assert.equal(state.profiles[0].age,4);assert.equal(state.profiles[0].supports.largeTargets,true);assert.ok(!('unknown' in state.profiles[0].supports));
 assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state))),state);
 assert.throws(()=>updateFamilyProfile(state,{...state.profiles[0],age:8}),/3 e 5/);
 assert.throws(()=>updateFamilyProfile(state,{...state.profiles[0],name:'Explorador 2'}),/Já existe/);
 assert.equal(normalizeFamilyProfile().age,null);
});
test('sugestões consideram faixa etária, interesse e atividades disponíveis',()=>{
 let state=profile(createState());
 const suggested=recommendedActivities(state,'explorador-1').map(a=>a.id);assert.equal(suggested[0],'animals');assert.ok(suggested.includes('story-butterfly'));assert.ok(suggested.includes('colors'));assert.ok(!suggested.includes('build'));assert.ok(!suggested.includes('read'));
 state=profile(state,5);assert.equal(recommendedActivities(state,'explorador-1')[0].id,'animals');
 state.enabledActivityIds=['letters'];assert.deepEqual(recommendedActivities(state,'explorador-1').map(a=>a.id),['letters']);
});
test('resumo inclui somente os últimos sete dias do perfil e exclui datas futuras',()=>{
 let state=profile(createState());
 state=session(state,'explorador-1','2026-10-08T11:00:00Z');state=session(state);state=session(state,'explorador-1','2026-10-17T12:00:00Z');state=session(state,'explorador-2');
 const s=familyWeeklySummary(state,'explorador-1',date);assert.equal(s.sessions.length,1);assert.equal(s.rounds,1);assert.equal(s.firstTry,1);assert.equal(s.offline.length,0);assert.equal(s.total,1);
 assert.ok(s.supportText.includes('ainda não foi informada'));assert.ok(s.firstTryText.includes('respostas foram registradas'));
});
test('observação atualiza uma sessão sem duplicar e rejeita outro perfil ou atividade',()=>{
 let state=session(profile(createState())),id=state.sessions[0].id;
 state=recordFamilyObservation(state,{profileId:'explorador-1',activityId:'animals',sessionId:id,participation:'with_support',note:'Apontou.'},date);
 state=recordFamilyObservation(state,{profileId:'explorador-1',activityId:'animals',sessionId:id,participation:'without_support',note:'Corrigi meu relato.'},date);
 assert.equal(state.observations.length,1);assert.equal(state.sessions.length,1);assert.equal(state.observations[0].participation,'without_support');
 assert.throws(()=>recordFamilyObservation(state,{profileId:'explorador-2',activityId:'animals',sessionId:id,participation:'with_support'}),/não pertence/);
 assert.throws(()=>recordFamilyObservation(state,{profileId:'explorador-1',activityId:'letters',sessionId:id,participation:'with_support'}),/não pertence/);
 const bad={...state,observations:[{...state.observations[0],profileId:'explorador-2'}]};assert.equal(restoreState(bad).observations.length,0);
});
test('brincadeira fora da tela e relato do adulto não criam resultados digitais',()=>{
 let state=profile(createState());state=recordFamilyObservation(state,{id:'off1',profileId:'explorador-1',activityId:'outside-objects',kind:'offline',participation:'with_support',note:'Conversamos juntos.'},date);
 const summary=familyWeeklySummary(state,'explorador-1',date);assert.equal(summary.sessions.length,0);assert.equal(summary.offline.length,1);assert.equal(summary.areas[0].offline,1);assert.equal(summary.total,1);
 assert.ok(summary.supportText.includes('responsável registrou'));assert.ok(familySummaryText(state,'explorador-1',date).includes('INFORMADO PELO RESPONSÁVEL'));
});
test('resumo e formulários escapam textos digitados pela família',()=>{
 let state=profile(createState());state.profiles[0].name='<script>alert(1)</script>';
 state=recordFamilyObservation(state,{id:'off1',profileId:'explorador-1',activityId:'outside-objects',kind:'offline',participation:'with_support',note:'<img src=x onerror=alert(2)>'});
 const html=familyDiscoveriesHTML(state,state.profiles[0],()=>'<svg></svg>');
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));
 assert.ok(!familyProfileFormHTML(state.profiles[0],()=>'<svg></svg>').includes('<script>'));
});
test('cópia preserva perfis, preferências, sessões e observações; arquivo alheio é rejeitado',()=>{
 let state=session(profile(createState(),5,{largeTargets:true}));state=recordFamilyObservation(state,{id:'off1',profileId:'explorador-1',activityId:'outside-objects',kind:'offline',participation:'paused'},date);
 assert.deepEqual(parseFamilyBackup(familyBackupJSON(state)),state);
 const text=familySummaryText(state,'explorador-1',date);assert.ok(text.includes('Amigos do jardim'));assert.ok(text.includes('Resposta registrada: GATO · tentativas: 1'));
 assert.throws(()=>parseFamilyBackup('{bad'),/JSON válido/);assert.throws(()=>parseFamilyBackup(JSON.stringify(state)),/exportada pela Lumi/);
 assert.throws(()=>parseFamilyBackup('x'.repeat(5*1024*1024+1)),/5 MB/);
});
test('todos os perfis usam Continuar e preferências antigas de avanço são descartadas',()=>{
 const state=session(profile(createState(),3,{largeTargets:true}));state.profiles[0].supports.manualAdvance=false;state.profiles[0].supports.gentlePace=true;
 const h=boot(JSON.stringify(state));h.api.startActivity('animals');h.api.submitAnswer(h.api.getGame().questions[0].correct);
 assert.ok(h.node('#app').innerHTML.includes('data-action="next"'));h.tick(30000);assert.equal(h.api.getGame().index,0);h.click('next');assert.equal(h.api.getGame().index,1);
 const restored=h.api.getState();assert.equal(restored.sessions.length,1);assert.equal(restored.profiles[0].supports.largeTargets,true);assert.ok(!('manualAdvance' in restored.profiles[0].supports));assert.ok(!('gentlePace' in restored.profiles[0].supports));
 const form=familyProfileFormHTML(restored.profiles[0],()=>'<svg></svg>');assert.ok(!form.includes('manualAdvance'));assert.ok(!form.includes('gentlePace'));assert.ok(!form.includes('automático'));
});
test('modo sem som impede a narração e conserva os retornos visuais',()=>{
 const h=boot(JSON.stringify(profile(createState(),3,{quietMode:true})));h.api.startActivity('animals');h.api.submitAnswer('errado');assert.equal(h.spoken.length,0);assert.equal(h.audios.length,0);assert.ok(h.node('#app').innerHTML.includes('tentar outra vez'));
 h.click('mute');assert.equal(h.api.getState().profiles[0].supports.quietMode,true);
});
test('formulário salva idade, interesses e apoios e abre o perfil apropriado',()=>{
 const h=boot();h.api.unlockAdult();h.click('edit-family-profile');h.node('#family-name').value='Aventureiro';h.node('#family-age').value='4';h.node('#family-school').value='no';h.node('#family-avatar').value='owl';
 h.collection('input[name="family-interest"]:checked',[{value:'Animais'}]);h.collection('input[name="family-support"]:checked',[{value:'largeTargets'},{value:'highContrast'}]);
 h.events.submit({target:{id:'family-profile-form'},preventDefault(){}});
 const p=h.api.getState().profiles[0];assert.equal(p.name,'Aventureiro');assert.equal(p.age,4);assert.equal(p.attendsSchool,false);assert.equal(p.supports.highContrast,true);assert.ok(h.node('#app').innerHTML.includes('Aventureiro'));
});
test('relato fora da tela pelo formulário aparece no histórico e não nas sessões',()=>{
 const h=boot();h.api.unlockAdult();h.click('offline-activity',{id:'outside-objects'});h.click('observe-offline',{id:'outside-objects'});h.node('#family-participation').value='with_support';h.node('#family-observation-note').value='Conversamos sobre uma bola.';
 h.events.submit({target:{id:'family-observation-form'},preventDefault(){}});h.api.navigate('family');assert.equal(h.api.getState().observations.length,1);assert.equal(h.api.getState().sessions.length,0);assert.ok(h.node('#app').innerHTML.includes('Conversamos sobre uma bola.'));
});
test('restauração apresenta a cópia antes de substituir os registros do navegador',async()=>{
 const h=boot();h.api.unlockAdult();const source=profile(createState(),5);await h.api.loadFamilyBackup({size:1000,text:async()=>familyBackupJSON(source)});
 assert.equal(h.api.getState().profiles[0].age,null);assert.ok(h.node('#overlay-root').innerHTML.includes('substituídos'));
 h.click('confirm-family-restore');assert.equal(h.api.getState().profiles[0].age,5);assert.ok(h.node('#app').innerHTML.includes('Um perfil, muitas possibilidades.'));
});
test('migração da seleção padrão acrescenta novas atividades e preserva seleção restrita',()=>{
 const old=createState();delete old.contentVersion;old.enabledActivityIds=['letters','sounds','build','read','missing','story'];
 assert.deepEqual(restoreState(old).enabledActivityIds,createState().enabledActivityIds);
 old.enabledActivityIds=['story'];assert.deepEqual(restoreState(old).enabledActivityIds,['story']);
});
test('convites fora da tela percorrem as opções compatíveis com a faixa etária',()=>{
 let state=profile(createState(),4);state=recordFamilyObservation(state,{id:'off1',profileId:'explorador-1',activityId:'outside-story',kind:'offline',participation:'with_support'});
 const h=boot(JSON.stringify(state));const off=dailyTrail(state,'explorador-1').steps.find(s=>s.kind==='offline').activity;assert.ok(off.ages.includes(4));assert.ok(h.node('#app').innerHTML.includes(`data-id="${off.id}"`));
 const quiet=profile(createState(),4);quiet.profiles[0].supports.quietMode=true;for(let d=1;d<=28;d++){const step=dailyTrail(quiet,'explorador-1',new Date(2026,9,d,10)).steps.find(s=>s.kind==='offline');assert.ok(!step.activity.usesSound,'modo sem som não sugere brincadeira com som');}
});
