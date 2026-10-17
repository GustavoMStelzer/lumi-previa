import test from 'node:test';
import assert from 'node:assert/strict';
import {boot,solveCurrent} from './ui-harness.mjs';
import {RECORDED_NARRATION} from '../dist/audio-manifest.js';
import {ACTIVITIES} from '../dist/content.js';
import {createState} from '../dist/model.js';
import fs from 'node:fs';
const success='Isso! Vamos para a próxima descoberta.';
const feedback=RECORDED_NARRATION[success];
const actualOptions={clips:RECORDED_NARRATION,audioDurationMs:source=>source===feedback?3239:800};
function solveFirst(h,id='letters'){h.api.startActivity(id);h.api.submitAnswer(h.api.getGame().questions[0].correct);}
function staysOnAnswer(h){h.tick(30000);assert.equal(h.api.getGame().index,0);assert.equal(h.api.getGame().solved,true);assert.equal(h.api.getGame().rounds.length,1);assert.ok(h.node('#app').innerHTML.includes('data-action="next"'));}

test('MP3 enviado permanece disponível e seu término não avança a pergunta',()=>{
 assert.ok(feedback);const file=fs.readFileSync('dist/'+feedback);assert.ok(file.subarray(0,3).toString()==='ID3'||file[0]===255);
 const h=boot(null,null,actualOptions);solveFirst(h);staysOnAnswer(h);h.click('next');assert.equal(h.api.getGame().index,1);
});
test('Continuar interrompe o retorno em reprodução e avança uma única pergunta',()=>{
 const h=boot(null,null,actualOptions);solveFirst(h);const audio=h.audios.at(-1);assert.equal(audio.paused,false);
 h.click('next');h.click('next');assert.equal(audio.paused,true);assert.equal(h.api.getGame().index,1);assert.equal(h.api.getGame().solved,false);assert.equal(h.api.getGame().rounds.length,1);
 h.tick(30000);assert.equal(h.api.getGame().index,1);
});
test('indicador global de voz travado não altera o avanço manual',()=>{
 const h=boot(null,null,{...actualOptions,stickyGlobalSpeech:true});solveFirst(h);staysOnAnswer(h);assert.equal(h.synthesis.speaking,true);h.click('next');assert.equal(h.api.getGame().index,1);
});
test('MP3 sem evento de término continua esperando Continuar',()=>{
 const h=boot(null,null,{...actualOptions,dropEndedEvent:true});solveFirst(h);staysOnAnswer(h);h.click('next');assert.equal(h.api.getGame().index,1);
});
test('áudio travado não troca a pergunta e permite continuar pelo botão',()=>{
 const h=boot(null,null,{...actualOptions,audioAutoEnd:false});solveFirst(h);staysOnAnswer(h);h.click('next');assert.equal(h.api.getGame().index,1);
});
test('voz nativa conserva o desafio após terminar e também permite continuar durante a fala',()=>{
 for(const nativeAutoEnd of [true,false]){const h=boot(null,null,{nativeDurationMs:3000,nativeAutoEnd});solveFirst(h);staysOnAnswer(h);h.click('next');assert.equal(h.api.getGame().index,1);}
});
test('a última pergunta só conclui após Continuar e salva exatamente uma sessão',()=>{
 const h=boot(null,null,actualOptions);h.api.startActivity('story-butterfly');
 for(let i=0;i<4;i++){h.api.submitAnswer(h.api.getGame().questions[i].correct);h.api.submitAnswer(h.api.getGame().questions[i].correct);h.tick(30000);assert.equal(h.api.getGame().index,i);assert.equal(h.api.getGame().completed,false);assert.equal(h.api.getState().sessions.length,0);h.click('next');}
 assert.equal(h.api.getGame().completed,true);assert.equal(h.api.getState().sessions.length,1);h.click('next');h.tick(30000);assert.equal(h.api.getState().sessions.length,1);assert.equal(h.api.getState().sessions[0].rounds.length,4);
});
test('voltar à aba, fechar janela e pageshow não avançam uma resposta',()=>{
 const h=boot(null,null,actualOptions);solveFirst(h);h.node('#overlay-root').innerHTML='<div class="modal">Pausa</div>';h.tick(8000);h.node('#overlay-root').innerHTML='';h.document.hidden=true;h.tick(8000);h.document.hidden=false;
 h.events.visibilitychange?.();h.windowEvents.pageshow?.();staysOnAnswer(h);h.click('next');assert.equal(h.api.getGame().index,1);
});
test('modo sem som também aguarda Continuar e sair não cria registro parcial',()=>{
 const state=createState();state.settings.sound=false;const h=boot(JSON.stringify(state),null,actualOptions);solveFirst(h);staysOnAnswer(h);assert.equal(h.audios.length,0);assert.equal(h.spoken.length,0);
 h.click('next');assert.equal(h.api.getGame().index,1);h.api.submitAnswer(h.api.getGame().questions[1].correct);h.api.navigate('adventure',{confirmed:true});h.tick(30000);assert.equal(h.api.getGame(),null);assert.equal(h.api.getState().sessions.length,0);
});
test('erro no MP3 usa a fala nativa sem disparar a próxima pergunta',()=>{
 const h=boot(null,null,{...actualOptions,audioAutoEnd:false,nativeDurationMs:2800});solveFirst(h);h.audios.at(-1).onerror();assert.equal(h.spoken.at(-1),success);staysOnAnswer(h);h.click('next');assert.equal(h.api.getGame().index,1);
});
test('resposta incorreta não mostra Continuar e não permite pular o desafio',()=>{
 const h=boot();h.api.startActivity('letters');h.api.submitAnswer('errado');h.tick(30000);h.click('next');assert.equal(h.api.getGame().index,0);assert.equal(h.api.getGame().solved,false);assert.equal(h.api.getGame().rounds.length,0);assert.ok(!h.node('#app').innerHTML.includes('data-action="next"'));assert.ok(h.spoken.at(-1).includes('tentar outra vez'));
});
test('todas as atividades mantêm o desafio após o acerto e aceitam Continuar',()=>{
 for(const activity of ACTIVITIES){const h=boot(null,null,actualOptions);h.api.startActivity(activity.id);if(h.api.getGame().intro)h.click('start-sound-round');solveCurrent(h);staysOnAnswer(h);h.click('next');assert.equal(h.api.getGame().index,1,activity.id);}
});
