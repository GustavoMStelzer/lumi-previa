// Gravação da voz da criança (reconto). O áudio fica somente neste aparelho (IndexedDB):
// não é enviado a nenhum servidor e não entra na cópia em JSON dos registros.
const VOICE_DB='lumi-vozes',VOICE_STORE='gravacoes',VOICE_MAX_SECONDS=40;

export function recordingSupported(win=globalThis){
 try{return !!(win.navigator?.mediaDevices?.getUserMedia&&win.MediaRecorder&&win.indexedDB&&win.isSecureContext!==false);}catch{return false;}
}
function openVoiceDB(win=globalThis){
 return new Promise((resolve,reject)=>{
  const request=win.indexedDB.open(VOICE_DB,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(VOICE_STORE)){const store=db.createObjectStore(VOICE_STORE,{keyPath:'id'});store.createIndex('profileId','profileId');}};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
function voiceTx(mode,run,win){
 return openVoiceDB(win).then(db=>new Promise((resolve,reject)=>{const tx=db.transaction(VOICE_STORE,mode),store=tx.objectStore(VOICE_STORE);let result;Promise.resolve(run(store,value=>{result=value;})).catch(reject);tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};}));
}
export function saveVoiceClip(clip,win=globalThis){
 if(!clip||typeof clip.id!=='string'||!clip.profileId||!clip.blob)return Promise.reject(new Error('Gravação inválida.'));
 return voiceTx('readwrite',store=>{store.put({id:clip.id,profileId:clip.profileId,activityId:clip.activityId||'',activityName:String(clip.activityName||'').slice(0,80),createdAt:clip.createdAt||new Date().toISOString(),seconds:Math.round(clip.seconds||0),mime:clip.blob.type||'audio/webm',blob:clip.blob});},win);
}
export function listVoiceClips(profileId,win=globalThis){
 return voiceTx('readonly',(store,done)=>{const out=[];const req=store.index('profileId').openCursor(win.IDBKeyRange.only(profileId));req.onsuccess=()=>{const cursor=req.result;if(cursor){out.push(cursor.value);cursor.continue();}else done(out.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)));};},win);
}
export function deleteVoiceClip(id,win=globalThis){return voiceTx('readwrite',store=>{store.delete(id);},win);}

// Controla uma gravação: pede o microfone, para sozinha no tempo máximo e devolve o áudio.
export function startVoiceRecording({onTick=()=>{},onDone=()=>{},onError=()=>{},maxSeconds=VOICE_MAX_SECONDS,win=globalThis}={}){
 let recorder=null,stream=null,timer=null,seconds=0,stopped=false;const chunks=[];
 const cleanup=()=>{clearInterval(timer);timer=null;try{stream?.getTracks().forEach(t=>t.stop());}catch{}};
 const controller={stop(){if(stopped)return;stopped=true;try{if(recorder&&recorder.state!=='inactive')recorder.stop();else{cleanup();}}catch{cleanup();}},get seconds(){return seconds;}};
 win.navigator.mediaDevices.getUserMedia({audio:true}).then(media=>{
  stream=media;if(stopped){cleanup();return;}
  const type=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>win.MediaRecorder.isTypeSupported?.(t))||'';
  recorder=new win.MediaRecorder(stream,type?{mimeType:type}:undefined);
  recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>{cleanup();const blob=new win.Blob(chunks,{type:recorder.mimeType||type||'audio/webm'});if(blob.size)onDone({blob,seconds});else onError(new Error('Nenhum som foi gravado. Tente falar mais perto do aparelho.'));};
  recorder.start();timer=setInterval(()=>{seconds++;onTick(seconds);if(seconds>=maxSeconds)controller.stop();},1000);
 }).catch(error=>{cleanup();onError(error?.name==='NotAllowedError'?new Error('O microfone não foi liberado. Um adulto pode permitir o acesso nas configurações do navegador.'):new Error('Não foi possível usar o microfone neste aparelho.'));});
 return controller;
}
export const VOICE_LIMIT_SECONDS=VOICE_MAX_SECONDS;
