// Multilingual v2 aceita SSML <break>. O texto visível continua sem marcações.
export const NARRATION_MODEL='eleven_multilingual_v2';
export const NARRATION_FORMAT='mp3_44100_128';
export const NARRATION_VOICE_SETTINGS=Object.freeze({stability:0.5,similarity_boost:0.75,style:0,use_speaker_boost:true,speed:0.88});
export const PACING_REVISION='familia-04-pausas-1';
export function pacedNarrationText(text){
 const plain=String(text).normalize('NFC').trim().replace(/\s+/g,' ');
 let pauses=0;
 const pause=seconds=>pauses++<3?` <break time="${seconds}s" /> `:' ';
 const sentences=plain.split(/(?<=[.!?])\s+/u);
 return sentences.map((sentence,index)=>{
  let spoken=sentence.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  // Isola o alvo da instrução e evita ler palavras inteiras como siglas.
  spoken=spoken.replace(/\b(letra|sílaba|palavra é|som de) ([A-ZÁÉÍÓÚÂÊÔÃÕÇ]+)(?=[.!? ,]|$)/u,(_all,prefix,target)=>prefix+pause('0.35')+target);
  spoken=spoken.replace(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}/gu,word=>word.toLocaleLowerCase('pt-BR'));
  return (index?pause('0.5'):'')+spoken;
 }).join('');
}
export function narrationRequest(entry){
 return {text:pacedNarrationText(entry.text),model_id:NARRATION_MODEL,voice_settings:{...NARRATION_VOICE_SETTINGS}};
}
