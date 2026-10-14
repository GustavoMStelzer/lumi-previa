import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import {Writable} from 'node:stream';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {requestSpeech,describeConnectionError,diagnoseConnection} from './elevenlabs-http.mjs';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const atomicWrite=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.tmp';fs.writeFileSync(temp,data);fs.renameSync(temp,file);};

export function readCatalog(root){
 const entries=JSON.parse(fs.readFileSync(path.join(root,'dist/assets/audio/catalogo.json'),'utf8'));
 if(!Array.isArray(entries)||!entries.length||entries.some(e=>!/^audio-\d{3}\.mp3$/.test(e.file)||typeof e.text!=='string'||!e.text.trim())||new Set(entries.map(e=>e.file)).size!==entries.length)throw new Error('O roteiro de áudio está inválido. Use o pacote original.');
 return entries;
}

export function describeApiError(status,raw,apiKey=''){
 const secrets=apiKey?[apiKey,JSON.stringify(apiKey).slice(1,-1),encodeURIComponent(apiKey),Buffer.from(apiKey).toString('base64')]:[];
 const clean=value=>{
  let text=typeof value==='string'?value:'';
  for(const secret of new Set(secrets))if(secret)text=text.replaceAll(secret,'[chave oculta]');
  return text.replace(/sk_[A-Za-z0-9_-]{8,}/g,'[chave oculta]').replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim().slice(0,400);
 };
 let data;try{data=JSON.parse(raw);}catch{}
 const detail=data?.detail??data?.error??data;
 let code='',message='',parameter='';
 if(typeof detail==='string')message=clean(detail);
 else if(Array.isArray(detail))message=detail.slice(0,2).map(item=>clean(item?.msg)).filter(Boolean).join(' · ');
 else if(detail&&typeof detail==='object'){
  code=clean(detail.code||detail.status||detail.type).slice(0,100);
  message=clean(detail.message||detail.msg);parameter=clean(detail.param).slice(0,100);
 }
 if(!message&&!data){
  const title=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(raw||'');
  if(title)message='Resposta HTML: '+clean(title[1]);
  else if(raw&&!/[<>]/.test(raw))message=clean(raw);
 }
 const reasons={400:'A solicitação foi rejeitada.',401:'A autorização foi recusada; confira a chave.',402:'Confira os créditos e os limites da chave.',403:'Acesso negado; confira as permissões de Text to Speech e da voz.',404:'Um recurso da solicitação não foi encontrado.',429:'Limite de créditos ou requisições atingido.',422:'Os parâmetros da solicitação não foram aceitos.'};
 const lines=[`ElevenLabs respondeu HTTP ${status}. ${reasons[status]||'Confira o detalhe retornado pelo servidor.'}`];
 if(code)lines.push('Código: '+code);
 if(parameter)lines.push('Parâmetro: '+parameter);
 lines.push('Detalhe: '+(message||'O servidor não enviou uma mensagem de erro utilizável.'));
 lines.push('A geração parou. Os áudios já concluídos foram preservados.');
 return lines.join('\n');
}

export async function generateNarration({root=projectRoot,voiceId,apiKey,fetchImpl=requestSpeech,log=console.log}){
 if(!/^[A-Za-z0-9_-]{6,128}$/.test(voiceId||''))throw new Error('Copie o Voice ID da voz Lumi em My Voices → três pontos → Copy voice ID.');
 if(typeof apiKey!=='string'||!apiKey.trim()||/[^\x21-\x7e]/.test(apiKey))throw new Error('A chave está vazia ou contém caracteres inválidos. Copie somente a API key, sem espaços ou rótulos.');
 const entries=readCatalog(root),folder=path.join(root,'dist/assets/audio');
 const receiptPath=path.join(root,'.lumi-audio-generation.json');
 const signature=hash(JSON.stringify({voiceId,modelId:'eleven_multilingual_v2',outputFormat:'mp3_44100_128'}));
 let receipt={signature,outputs:{}};
 if(fs.existsSync(receiptPath)){
  receipt=JSON.parse(fs.readFileSync(receiptPath,'utf8'));
  if(receipt.signature!==signature)throw new Error('Este pacote já foi usado com outra voz. Para trocar de voz, extraia uma cópia nova do ZIP.');
 }
 let generated=0,skipped=0;
 for(let index=0;index<entries.length;index++){
  const entry=entries[index],file=path.join(folder,entry.file),textHash=hash(entry.text),saved=receipt.outputs[entry.file];
  if(saved?.textHash===textHash&&fs.existsSync(file)&&hash(fs.readFileSync(file))===saved.audioHash){skipped++;log(`[${index+1}/${entries.length}] Já pronto: ${entry.file}`);continue;}
  log(`[${index+1}/${entries.length}] Gerando: ${entry.text}`);
  let response;
  try{
   response=await fetchImpl('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(voiceId)+'?output_format=mp3_44100_128',{
    method:'POST',headers:{'xi-api-key':apiKey,'Content-Type':'application/json',Accept:'audio/mpeg'},
    body:JSON.stringify({text:entry.text,model_id:'eleven_multilingual_v2'}),signal:AbortSignal.timeout(120000)
   });
  }catch(error){throw new Error(describeConnectionError(error));}
  if(!response.ok){
   let raw='';try{raw=await response.text();}catch{}
   throw new Error(describeApiError(response.status,raw,apiKey));
  }
  let audio;
  try{audio=Buffer.from(await response.arrayBuffer());}catch{throw new Error('O download do áudio foi interrompido. Execute novamente para continuar.');}
  const isMp3=audio.subarray(0,3).toString()==='ID3'||(audio[0]===255&&(audio[1]&224)===224);
  if(audio.length<512||!isMp3)throw new Error('O ElevenLabs não retornou um MP3 válido. A geração parou sem substituir este arquivo.');
  atomicWrite(file,audio);
  receipt.outputs[entry.file]={textHash,audioHash:hash(audio)};
  atomicWrite(receiptPath,JSON.stringify(receipt,null,2)+'\n');
  generated++;
 }
 return {generated,skipped,total:entries.length,characters:entries.reduce((n,e)=>n+e.text.length,0)};
}

async function ask(question,{secret=false}={}){
 if(!process.stdin.isTTY)throw new Error('Abra o gerador em um terminal. A chave é digitada de forma oculta, sem arquivo de configuração.');
 const hidden=new Writable({write(_chunk,_encoding,done){done();}});
 if(secret)hidden.isTTY=true;
 const terminal=readline.createInterface({input:process.stdin,output:secret?hidden:process.stdout,terminal:true,historySize:0});
 if(secret)process.stdout.write(question);
 try{return (await new Promise((resolve,reject)=>{terminal.once('SIGINT',()=>reject(new Error('Geração cancelada.')));terminal.question(secret?'':question,resolve);})).trim();}
 finally{terminal.close();if(secret){process.stdout.write('\n');hidden.end();}}
}

async function main(){
 const entries=readCatalog(projectRoot);
 console.log(`Lumi — gerador v4 — ${entries.length} falas, ${entries.reduce((n,e)=>n+e.text.length,0)} caracteres.`);
 if(process.argv.includes('--check')){console.log('Roteiro válido. Nenhuma chamada ao ElevenLabs foi feita.');return;}
 if(process.argv.includes('--diagnose')){await diagnoseConnection();return;}
 console.log('Conexão: '+(process.platform==='win32'?'cURL do Windows, com verificação HTTPS.':'HTTPS do Node.js, com verificação de certificado.'));
 console.log('A geração usa os créditos da sua assinatura. A chave não será salva nem incluída na prévia.');
 const voiceId=await ask('Voice ID da voz Lumi: ');
 let apiKey=await ask('API key do ElevenLabs (entrada oculta): ',{secret:true});
 let result;
 try{result=await generateNarration({voiceId,apiKey});}finally{apiKey='';}
 for(const script of ['audio-catalog.mjs','export-preview.mjs']){
  const run=spawnSync(process.execPath,[path.join(projectRoot,'scripts',script)],{cwd:projectRoot,stdio:'inherit'});
  if(run.status!==0)throw new Error('Os MP3 foram salvos, mas o pacote não foi finalizado. Execute novamente.');
 }
 console.log(`Pronto: ${result.total} falas disponíveis. ${result.generated} geradas agora; ${result.skipped} reaproveitadas.`);
 console.log('Abra PREVIA_LOCAL.html para conferir. Envie outputs/Lumi_Voz_Completa.zip para atualizar a prévia aqui.');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error('\n'+error.message);process.exitCode=1;});
