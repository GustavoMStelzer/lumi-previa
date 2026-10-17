import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ACTIVITIES,makeQuestions,answerIsCorrect} from '../dist/content.js';
import {createState,restoreState,recordSession,profileStats,nextActivity,addAssignment,sessionsCSV,csvCell} from '../dist/model.js';
const sampleRounds=[{prompt:'Teste',answer:'A',attempts:1,helps:0},{prompt:'Teste 2',answer:'B',attempts:2,helps:1}];

test('vinte e sete atividades com respostas válidas e distratores, sem alterar o conteúdo original',()=>{
 assert.equal(ACTIVITIES.length,27);
 for(const activity of ACTIVITIES){
  const questions=makeQuestions(activity.id,()=>.25);
  assert.equal(questions.length,activity.id==='story'?3:['rhymes','memory'].includes(activity.id)?2:4);
  for(const q of questions){
   if(q.type==='memory'){assert.equal(q.cards.length,q.pairs.length*2);for(const key of q.pairs)assert.equal(q.cards.filter(c=>c.split('~')[0]===key).length,2);continue;}
   assert.ok(answerIsCorrect(q,q.correct));
   if(Array.isArray(q.correct)){
    assert.equal(q.correct.join(''),q.target);
    assert.equal(q.slots,q.correct.length);
    for(const piece of q.correct)assert.ok(q.options.includes(piece));
    assert.equal(answerIsCorrect(q,[...q.correct].reverse()),false);
   }else{
    assert.equal(q.options.filter(x=>x===q.correct).length,1);
    const wrong=q.options.find(x=>x!==q.correct);
    assert.equal(answerIsCorrect(q,wrong),false);
    if(q.type==='missing')assert.equal(q.gap.replace('_',q.correct),q.target);
   }
  }
  assert.deepEqual(makeQuestions(activity.id,()=>.25),questions);
 }
});
test('uma atividade concluída soma um registro apenas no perfil correspondente',()=>{
 const original=createState();
 const saved=recordSession(original,{profileId:'explorador-1',activityId:'letters',rounds:sampleRounds,seconds:62},'2026-10-14T12:00:00.000Z');
 assert.equal(original.sessions.length,0);
 const one=profileStats(saved,'explorador-1'),two=profileStats(saved,'explorador-2');
 assert.equal(one.total,1);assert.equal(one.completed.size,1);assert.equal(one.firstTry,1);assert.equal(one.helps,1);assert.equal(one.seconds,62);
 assert.equal(two.total,0);assert.equal(two.completed.size,0);
});
test('repetir uma atividade não aumenta a diversidade de atividades exploradas',()=>{
 let state=createState();
 for(let i=0;i<2;i++)state=recordSession(state,{profileId:'explorador-1',activityId:'letters',rounds:sampleRounds,seconds:30},`2026-10-14T12:0${i}:00.000Z`);
 const stats=profileStats(state,'explorador-1');assert.equal(stats.total,2);assert.equal(stats.completed.size,1);assert.equal(stats.rounds,4);
 assert.equal(nextActivity(state,'explorador-1').id,'sounds');
});
test('a sugestão da escola orienta a próxima atividade e só conclui no perfil e atividade corretos',()=>{
 let state=createState();
 state=addAssignment(state,'explorador-1','read');
 state=addAssignment(state,'explorador-2','read');
 assert.equal(nextActivity(state,'explorador-1').id,'read');
 assert.strictEqual(addAssignment(state,'explorador-1','read'),state);
 state=recordSession(state,{profileId:'explorador-1',activityId:'letters',rounds:sampleRounds,seconds:10});
 assert.equal(state.assignments[0].status,'pending');
 state=recordSession(state,{profileId:'explorador-1',activityId:'read',rounds:sampleRounds,seconds:10});
 assert.equal(state.assignments[0].status,'done');assert.equal(state.assignments[1].status,'pending');
});
test('salvamento e restauração mantêm progresso, preferências e sugestões',()=>{
 let state=addAssignment(createState(),'explorador-1','build');
 state=recordSession(state,{profileId:'explorador-1',activityId:'letters',rounds:sampleRounds,seconds:48});
 state.settings.reducedMotion=true;state.settings.sound=false;state.activeProfile='explorador-2';
 const restored=restoreState(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored,state);
});
test('armazenamento incompatível ou perfis inválidos não quebram a inicialização',()=>{
 assert.deepEqual(restoreState(null),createState());
 assert.deepEqual(restoreState({version:2}),createState());
 assert.deepEqual(restoreState({version:1,profiles:[]}),createState());
 assert.deepEqual(restoreState({version:1,profiles:[null,{id:42}]}),createState());
 const state=createState();state.activeProfile='ausente';state.settings.sessionMinutes=999;
 state.sessions=[{profileId:'ausente',activityId:'letters',rounds:[],createdAt:'2026-10-14'}];
 const restored=restoreState(state);assert.equal(restored.activeProfile,'explorador-1');assert.equal(restored.sessions.length,0);assert.equal(restored.settings.sessionMinutes,10);
 state.sessions=[{profileId:'explorador-1',activityId:'letters',rounds:[null],seconds:20,createdAt:'2026-10-14T12:00:00Z'}];
 assert.equal(restoreState(state).sessions.length,0);
});
test('exportação CSV mantém acentos, separa os perfis e neutraliza fórmulas',()=>{
 let state=createState();state.profiles[0].name='=HYPERLINK("x")';
 state=recordSession(state,{profileId:'explorador-1',activityId:'letters',rounds:sampleRounds,seconds:12},'2026-10-14T12:00:00.000Z');
 state=recordSession(state,{profileId:'explorador-2',activityId:'read',rounds:sampleRounds,seconds:12},'2026-10-14T12:00:00.000Z');
 const csv=sessionsCSV(state,'explorador-1');assert.ok(csv.startsWith('\uFEFF'));assert.equal(csv.split('\r\n').length,2);
 assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('Jardim das letras'));assert.ok(!csv.includes('Explorador 2'));
 assert.equal(csvCell('texto;"x"'),'"texto;""x"""');assert.equal(csvCell(' +1'), '"\' +1"');
});
test('registros inválidos são rejeitados antes de modificar o estado',()=>{
 const state=createState();
 assert.throws(()=>recordSession(state,{profileId:'missing',activityId:'letters',rounds:sampleRounds,seconds:10}));
 assert.throws(()=>recordSession(state,{profileId:'explorador-1',activityId:'unknown',rounds:sampleRounds,seconds:10}));
 assert.throws(()=>recordSession(state,{profileId:'explorador-1',activityId:'letters',rounds:[],seconds:10}));
 assert.throws(()=>recordSession(state,{profileId:'explorador-1',activityId:'letters',rounds:[{attempts:0}],seconds:10}));
 assert.throws(()=>recordSession(state,{profileId:'explorador-1',activityId:'letters',rounds:sampleRounds,seconds:NaN}));
 assert.equal(state.sessions.length,0);
});
test('todos os arquivos publicados referenciados pelo HTML e service worker existem',()=>{
 const base=path.resolve('dist'),html=fs.readFileSync(path.join(base,'index.html'),'utf8'),sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
 const refs=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('http'));
 const assets=sw.match(/const ASSETS=\[([^\]]+)\]/)[1].match(/'([^']+)'/g).map(x=>x.slice(1,-1));
 for(const ref of [...refs,...assets])assert.ok(fs.existsSync(path.join(base,ref)),ref);
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.webmanifest'),'utf8'));assert.equal(manifest.lang,'pt-BR');
 assert.ok(fs.existsSync(path.join(base,manifest.icons[0].src)));
});
