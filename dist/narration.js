export function normalizeNarrationText(text){return String(text).normalize('NFC').trim().replace(/\s+/g,' ');}

// Áudios gravados são reproduzidos na velocidade original. A síntese do aparelho
// é usada apenas para textos que ainda não possuem um arquivo correspondente.
export class Narrator {
 constructor({clips={},makeAudio,isEnabled=()=>true,speakFallback,stopFallback,onError=()=>{},onState=()=>{}}){
  this.clips=clips;this.makeAudio=makeAudio;this.isEnabled=isEnabled;this.speakFallback=speakFallback;this.stopFallback=stopFallback;this.onError=onError;this.onState=onState;this.audio=null;this.source=null;this.generation=0;
 }
 stop(){
  this.generation++;this.stopFallback?.();
  if(this.audio){this.audio.onended=null;this.audio.onerror=null;this.audio.pause();try{this.audio.currentTime=0;}catch{}this.audio=null;}
  this.source=null;this.onState({playing:false,source:null});
 }
 speak(text){
  if(!this.isEnabled()){this.onError('O áudio está desligado. Ative o som no alto da página.');return false;}
  const source=this.clips[normalizeNarrationText(text)];
  if(source)return this.playFile(source,text);
  this.stop();return this.speakFallback(text);
 }
 playFile(source,fallbackText=null){
  this.stop();
  if(!this.isEnabled()){this.onError('O áudio está desligado. Ative o som no alto da página.');return false;}
  const generation=this.generation;let failed=false;
  const fail=()=>{
   if(generation!==this.generation||failed)return;failed=true;
   if(this.audio){this.audio.onended=null;this.audio.onerror=null;this.audio.pause();}
   this.audio=null;this.source=null;this.onState({playing:false,source:null});
   if(fallbackText&&this.isEnabled())this.speakFallback(fallbackText);
   else this.onError('Não foi possível reproduzir a prévia. Tente novamente com o áudio ligado.');
  };
  try{
   const audio=this.makeAudio(source);this.audio=audio;this.source=source;audio.preload='auto';audio.playbackRate=1;
   audio.onended=()=>{if(generation!==this.generation)return;this.audio=null;this.source=null;this.onState({playing:false,source:null});};
   audio.onerror=fail;this.onState({playing:true,source});
   const result=audio.play();if(result?.catch)result.catch(fail);return true;
  }catch{fail();return false;}
 }
}
