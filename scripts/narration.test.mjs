import test from 'node:test';
import assert from 'node:assert/strict';
import {Narrator,normalizeNarrationText} from '../dist/narration.js';

function harness(clips={}){
 const audios=[],fallbacks=[],errors=[],states=[];let enabled=true;
 const narrator=new Narrator({clips,makeAudio:source=>{const audio={source,currentTime:0,pauseCount:0,play(){return Promise.resolve();},pause(){this.pauseCount++;}};audios.push(audio);return audio;},isEnabled:()=>enabled,speakFallback:text=>{fallbacks.push(text);return true;},stopFallback(){},onError:message=>errors.push(message),onState:state=>states.push(state)});
 return {narrator,audios,fallbacks,errors,states,setEnabled:value=>enabled=value};
}
test('áudio gravado correspondente substitui a síntese e mantém velocidade original',()=>{
 const h=harness({'Olá, Lumi.':'assets/audio/audio-001.mp3'});
 assert.equal(h.narrator.speak('  Olá,\nLumi.  '),true);
 assert.equal(h.audios[0].source,'assets/audio/audio-001.mp3');assert.equal(h.audios[0].playbackRate,1);assert.equal(h.fallbacks.length,0);
 h.audios[0].onended();assert.equal(h.states.at(-1).playing,false);
});
test('uma nova fala interrompe a prévia sem sobrepor duas fontes de áudio',()=>{
 const h=harness();h.narrator.playFile('preview.mp3');const previous=h.audios[0];h.narrator.speak('Encontre a letra A.');
 assert.equal(previous.pauseCount,1);assert.equal(previous.currentTime,0);assert.equal(h.fallbacks.at(-1),'Encontre a letra A.');assert.equal(h.narrator.audio,null);
});
test('áudio desligado impede a reprodução e pedidos antigos não retomam a fala',()=>{
 const h=harness({'Texto':'clip.mp3'});h.setEnabled(false);assert.equal(h.narrator.speak('Texto'),false);assert.equal(h.audios.length,0);
 h.setEnabled(true);h.narrator.speak('Texto');const oldError=h.audios[0].onerror;h.narrator.stop();oldError();assert.equal(h.fallbacks.length,0);
});
test('falha em um arquivo usa a voz do aparelho uma única vez',()=>{
 const h=harness({'Texto':'clip.mp3'});h.narrator.speak('Texto');const fail=h.audios[0].onerror;fail();fail();assert.deepEqual(h.fallbacks,['Texto']);
});
test('prévia sem texto correspondente informa falha sem inventar uma narração',()=>{
 const h=harness();h.narrator.playFile('preview.mp3');h.audios[0].onerror();assert.equal(h.fallbacks.length,0);assert.equal(h.errors.length,1);
 assert.equal(normalizeNarrationText('a\n b'),'a b');
});
