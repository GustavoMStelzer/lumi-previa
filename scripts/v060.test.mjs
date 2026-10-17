// Lumi 0.6.0: preservação das gravações, novos jogos e acessibilidade do avanço manual.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVITIES,makeQuestions,LOOK_AND_PLAY,ANIMAL_SOUNDS,MEMORY_ROUNDS} from '../dist/content.js';
import {WORD_ART} from '../dist/illustrations.js';
import {RECORDED_NARRATION} from '../dist/audio-manifest.js';
import {SUGGESTED_AGES,ACTIVITY_DOMAINS,OFFLINE_ACTIVITIES,FAMILY_DOMAINS} from '../dist/family-data.js';
import {createState,restoreState} from '../dist/model.js';
import {boot,solveCurrent,missMemory} from './ui-harness.mjs';

test('as 94 gravações da 0.5.2 mantêm texto, nome do arquivo e MP3',()=>{
 const before=JSON.parse(fs.readFileSync('scripts/fixtures/audio-v052.json','utf8')),now=new Map(JSON.parse(fs.readFileSync('dist/assets/audio/catalogo.json','utf8')).map(e=>[e.text,e.file]));
 assert.equal(before.length,94);
 for(const entry of before){assert.equal(now.get(entry.text),entry.file,entry.text);assert.equal(RECORDED_NARRATION[entry.text],'assets/audio/'+entry.file);assert.ok(fs.statSync('dist/assets/audio/'+entry.file).size>1000);}
});
test('novas atividades têm idade, área, ilustrações existentes e uma única resposta correta',()=>{
 const ids=['animal-sounds','odd-one','shadows','memory','sizes','count','story-party','story-night','story-lake'];
 for(const id of ids){
  assert.ok(ACTIVITIES.some(a=>a.id===id),id);assert.ok(SUGGESTED_AGES[id],id);assert.ok(FAMILY_DOMAINS.some(d=>d.id===ACTIVITY_DOMAINS[id]),id);
  for(const q of makeQuestions(id,()=>.4)){
   if(q.type==='memory'){for(const k of q.pairs)assert.ok(WORD_ART[k]);continue;}
   assert.equal(q.options.filter(o=>o===q.correct).length,1,id);
   if(q.type==='see')for(const o of q.options){const spec=q.art[o];assert.ok(spec&&(spec.dots||WORD_ART[spec.key]),id+':'+o);}
   else for(const o of q.options)assert.ok(WORD_ART[o],id+':'+o);
  }
 }
 for(const q of LOOK_AND_PLAY.count){assert.equal(q.reference.count,Number(q.correct.slice(1)));}
 for(const q of LOOK_AND_PLAY['odd-one']){const keys=q.options.map(o=>q.art[o].key);assert.equal(keys.filter(k=>k===q.art[q.correct].key).length,1);}
 for(const q of LOOK_AND_PLAY.shadows){assert.equal(q.art[q.correct].key,q.reference.key);assert.ok(q.options.every(o=>q.art[o].mode==='shadow'));}
 assert.equal(ANIMAL_SOUNDS.length,4);assert.equal(MEMORY_ROUNDS.length,2);
 for(const a of OFFLINE_ACTIVITIES)assert.ok(FAMILY_DOMAINS.some(d=>d.id===a.domain),a.id);
});
test('acerto mostra Continuar fixo com orientação e o fim do áudio não avança',()=>{
 for(const id of ['odd-one','count','animal-sounds','story-lake']){
  const h=boot();h.api.startActivity(id);solveCurrent(h);const html=h.node('#app').innerHTML;
  assert.ok(html.includes('class="continue-dock"'),id);assert.ok(html.includes('Toque em Continuar.'),id);assert.equal((html.match(/data-action="next"/g)||[]).length,1);
  h.tick(30000);assert.equal(h.api.getGame().index,0);h.click('next');assert.equal(h.api.getGame().index,1);assert.ok(!h.node('#app').innerHTML.includes('continue-dock'));
 }
});
test('memória: pares viram, cartas diferentes voltam sozinhas e só os pares completos liberam Continuar',()=>{
 const h=boot();h.api.startActivity('memory');missMemory(h);const g=h.api.getGame();
 assert.equal(g.flipped.length,0);assert.equal(g.solved,false);assert.equal(g.attempts,1);
 h.click('flip',{index:'0'});h.click('flip',{index:'0'});assert.equal(h.api.getGame().flipped.length,1,'a mesma carta não conta duas vezes');
 const cards=h.api.getGame().questions[0].cards,partner=cards.findIndex((c,i)=>i>0&&c.split('~')[0]===cards[0].split('~')[0]);h.click('flip',{index:String(partner)});assert.equal(h.api.getGame().matched.length,2);
 solveCurrent(h);assert.equal(h.api.getGame().solved,true);assert.ok(h.node('#app').innerHTML.includes('continue-dock'));
 h.click('next');solveCurrent(h);h.click('next');assert.equal(h.api.getGame().completed,true);assert.equal(h.api.getState().sessions.at(-1).rounds.length,2);
 assert.equal(h.api.getState().sessions.at(-1).rounds[0].answer,'Todos os pares encontrados');
});
test('ouvir as quantidades fala o número sem escolher a resposta',()=>{
 const h=boot();h.api.startActivity('count');const q=h.api.getGame().questions[0];h.click('listen-option',{index:'0'});
 assert.equal(h.spoken.at(-1),q.say[q.options[0]]);assert.equal(h.api.getGame().attempts,0);assert.equal(h.api.getGame().solved,false);
});
test('quem usava a seleção completa da 0.5 recebe os novos jogos; seleção restrita é preservada',()=>{
 const old=createState();old.contentVersion=5;old.enabledActivityIds=ACTIVITIES.slice(0,14).map(a=>a.id);
 assert.equal(restoreState(old).enabledActivityIds.length,27);
 old.enabledActivityIds=['letters','story-ball'];assert.deepEqual(restoreState(old).enabledActivityIds,['letters','story-ball']);
 const v6=createState();v6.enabledActivityIds=['letters','sounds','build','read','missing','story','animals','rhymes'];assert.deepEqual(restoreState(v6).enabledActivityIds,v6.enabledActivityIds,'seleção feita na 0.6 não é ampliada');
});
test('letra escondida não oferece outra letra que forme palavra conhecida',()=>{
 for(const q of makeQuestions('missing',()=>.5)){const other=q.options.filter(o=>o!==q.correct).map(o=>q.gap.replace('_',o));for(const w of other)assert.ok(!['BALA','BELA','SALA','GAMO','FALA','VALA','GALA'].includes(w),w);}
});
