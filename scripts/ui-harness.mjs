// DOM, áudio e relógio simulados; não substituem inspeção em navegador.
import vm from 'node:vm';
import fs from 'node:fs';
import {WORD_ART} from '../dist/illustrations.js';
import * as content from '../dist/content.js';
import * as model from '../dist/model.js';
import {Narrator} from '../dist/narration.js';
import * as teaching from '../dist/teaching.js';
import * as studio from '../dist/studio.js';
import * as familyData from '../dist/family-data.js';
import * as familyModel from '../dist/family-model.js';
import * as familyUI from '../dist/family-ui.js';
import * as recorder from '../dist/recorder.js';
export function boot(initialStorage=null,sourceCode=null,options={}){
 let clock=Date.now(),nextTimer=0,nativeTimer=null;const timers=new Map(),collections=new Map(),spoken=[],audios=[],utterances=[];
 const schedule=(fn,delay=0)=>{const id=++nextTimer;timers.set(id,{fn,due:clock+delay});return id;};
 const cancel=id=>timers.delete(id);
 const ActualDate=Date;class TestDate extends ActualDate{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 const nodes=new Map(),events={},windowEvents={},storage=new Map(initialStorage?[[model.STORAGE_KEY,initialStorage]]:[]);
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}},focus(){},setAttribute(){},querySelectorAll(){return []}});return nodes.get(selector);};
 const document={hidden:false,title:'',activeElement:null,querySelector(selector){if(selector.startsWith('.modal')&&!node('#overlay-root').innerHTML)return null;return node(selector);},querySelectorAll(selector){return collections.get(selector)||[node(selector)];},addEventListener(type,cb){events[type]=cb;},body:{classList:{toggle(){}},append(){}},createElement(){return {click(){},remove(){}}}};
 const synthesis={cancel(){cancel(nativeTimer);nativeTimer=null;this.speaking=options.stickyGlobalSpeech===true;},getVoices(){return [{lang:'pt-BR'}]},speaking:options.stickyGlobalSpeech===true,speak(utterance){spoken.push(utterance.text);utterances.push(utterance);this.speaking=true;utterance.onstart?.();if(options.nativeAutoEnd!==false)nativeTimer=schedule(()=>{this.speaking=options.stickyGlobalSpeech===true;utterance.onend?.();},options.nativeDurationMs??0);}};
 class FakeAudio{
  constructor(source){this.source=source;this.paused=true;this.ended=false;this.currentTime=0;this.timer=null;audios.push(this);}
  play(){this.paused=false;this.ended=false;if(options.audioAutoEnd!==false){const duration=typeof options.audioDurationMs==='function'?options.audioDurationMs(this.source):options.audioDurationMs??1000;this.timer=schedule(()=>{this.ended=true;this.paused=true;if(options.dropEndedEvent!==true)this.onended?.();},duration);}return Promise.resolve();}
  pause(){this.paused=true;cancel(this.timer);this.timer=null;}
 }
 const context=vm.createContext({WORD_ART,...content,...model,...teaching,...studio,...familyData,...familyModel,...familyUI,...recorder,Date:TestDate,Narrator,RECORDED_NARRATION:options.clips||{},document,Audio:FakeAudio,
  window:{speechSynthesis:synthesis,scrollTo(){},addEventListener(type,cb){windowEvents[type]=cb;}},speechSynthesis:synthesis,
  SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  navigator:{},crypto:{randomUUID:()=> 'profile-test'},URL,Blob,
  requestAnimationFrame:fn=>fn(),setInterval(){},setTimeout:schedule,clearTimeout:cancel,console});
 const code=(sourceCode||fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
 vm.runInContext(code+'\nglobalThis.testApi={startActivity,submitAnswer,nextQuestion,navigate,openTeacherEditor,saveTeacherDraft,previewTeacherActivity,leaveTeacherPreview,loadTeachingPack,showFamilyProfileForm,showFamilyObservation,loadFamilyBackup,getDraft:()=>teacherDraft,getState:()=>state,getGame:()=>game,unlockAdult:()=>{adultUntil=Date.now()+300000;}};',context);
 const tick=milliseconds=>{const end=clock+milliseconds;let count=0;while(true){const entry=[...timers].filter(([,t])=>t.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];if(!entry)break;if(++count>2000)throw new Error('Timer loop');clock=entry[1].due;timers.delete(entry[0]);entry[1].fn();}clock=end;};
 const click=(action,dataset={})=>events.click({target:{closest(){return {dataset:{action,...dataset},disabled:false};}}});
 return {api:context.testApi,nodes,node,events,windowEvents,storage,document,spoken,audios,utterances,synthesis,tick,click,collection:(selector,items)=>collections.set(selector,items)};
}
// Resolve o desafio atual como uma criança faria: escolhe a resposta ou vira os pares da memória.
export function solveCurrent(h){
 const game=h.api.getGame(),q=game.questions[game.index];
 if(q.type!=='memory'){h.api.submitAnswer(q.correct);return;}
 for(const key of q.pairs){q.cards.forEach((card,i)=>{if(card.split('~')[0]===key)h.click('flip',{index:String(i)});});}
}
// Vira duas cartas diferentes (uma tentativa sem par) e espera elas voltarem.
export function missMemory(h){
 const game=h.api.getGame(),q=game.questions[game.index],first=0,second=q.cards.findIndex(card=>card.split('~')[0]!==q.cards[0].split('~')[0]);
 h.click('flip',{index:String(first)});h.click('flip',{index:String(second)});h.tick(2000);
}
