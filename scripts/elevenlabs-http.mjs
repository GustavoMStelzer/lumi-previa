import path from 'node:path';
import {spawn} from 'node:child_process';

const STATUS_MARKER='__LUMI_HTTP_STATUS__';
const networkMessages={
 CURL_5:'O endereço do proxy não pôde ser resolvido. Confira a configuração de proxy deste computador.',
 CURL_6:'O DNS não encontrou api.elevenlabs.io. Confira a conexão e o DNS do computador.',
 CURL_7:'Não foi possível conectar ao servidor ou proxy. Confira o acesso HTTPS da rede.',
 CURL_28:'O tempo de conexão ou download foi excedido.',
 CURL_35:'A negociação HTTPS falhou. Confira o certificado e as configurações de rede.',
 CURL_52:'O servidor encerrou a conexão sem enviar uma resposta.',
 CURL_56:'A conexão foi interrompida durante o recebimento da resposta.',
 CURL_60:'O certificado HTTPS não foi validado pelo Windows. Confira os certificados, a data do computador e eventual inspeção HTTPS da rede.',
 CURL_77:'O cURL não conseguiu carregar os certificados de confiança.',
 CURL_NOT_FOUND:'O cURL do Windows não foi encontrado. Abra o diagnóstico para conferir a instalação.',
 RESPONSE_INVALID:'A resposta recebida não contém um status HTTP válido.',
 RESPONSE_TOO_LARGE:'A resposta excedeu o tamanho esperado para uma fala.',
 ENOTFOUND:'O DNS não encontrou api.elevenlabs.io.',
 EAI_AGAIN:'O DNS não respondeu a tempo.',
 ECONNREFUSED:'A conexão HTTPS foi recusada.',
 ECONNRESET:'A conexão HTTPS foi interrompida.',
 ETIMEDOUT:'O tempo de conexão foi excedido.',
 UND_ERR_CONNECT_TIMEOUT:'O tempo de conexão foi excedido.',
 UND_ERR_SOCKET:'A conexão foi interrompida.',
 CERT_HAS_EXPIRED:'O certificado HTTPS está expirado.',
 DEPTH_ZERO_SELF_SIGNED_CERT:'O certificado HTTPS não é confiável para este computador.',
 SELF_SIGNED_CERT_IN_CHAIN:'A cadeia de certificados HTTPS não pôde ser validada.',
 UNABLE_TO_VERIFY_LEAF_SIGNATURE:'A cadeia de certificados HTTPS não pôde ser validada.',
 ERR_INVALID_CHAR:'A chave contém caracteres inválidos. Copie somente a API key, sem aspas ou rótulos.',
 NETWORK_ERROR:'Não foi possível concluir a requisição HTTPS.'
};
function codedError(code){const error=new Error(networkMessages[code]||networkMessages.NETWORK_ERROR);error.code=code;return error;}
export function describeConnectionError(error){
 const queue=[error];let code='NETWORK_ERROR';
 for(let index=0;index<queue.length&&index<20;index++){
  const current=queue[index];if(!current||typeof current!=='object')continue;
  if(Object.hasOwn(networkMessages,current.code)){code=current.code;break;}
  if(current.name==='TimeoutError'){code='CURL_28';break;}
  if(current.cause)queue.push(current.cause);if(Array.isArray(current.errors))queue.push(...current.errors);
 }
 return `Falha de conexão [${code}]. ${networkMessages[code]} Os arquivos já concluídos foram preservados. Execute DIAGNOSTICAR_CONEXAO_WINDOWS.bat e confira o resultado.`;
}
const quote=value=>'"'+String(value).replaceAll('\\','\\\\').replaceAll('"','\\"').replaceAll('\r','\\r').replaceAll('\n','\\n').replaceAll('\t','\\t')+'"';

export function curlRequest(url,request={}, {spawnImpl=spawn,executable,revocationBestEffort=process.platform==='win32'}={}){
 const systemRoot=process.env.SystemRoot||process.env.WINDIR;
 const command=executable||(process.platform==='win32'&&systemRoot?path.join(systemRoot,'System32','curl.exe'):process.platform==='win32'?'curl.exe':'curl');
 const config=['url = '+quote(url),'request = '+quote(request.method||'GET'),'silent','connect-timeout = 25','max-time = 120','write-out = '+quote(STATUS_MARKER+'%{http_code}')];
 const target=new URL(url);
 // Schannel: permite listas de revogação ausentes/offline somente nesta API.
 // Mantém a validação da cadeia, do domínio e de revogações conhecidas.
 if(revocationBestEffort&&target.protocol==='https:'&&target.hostname==='api.elevenlabs.io')config.push('ssl-revoke-best-effort');
 for(const [name,value] of Object.entries(request.headers||{})){
  if(!/^[A-Za-z0-9-]+$/.test(name)||/[\r\n]/.test(value))throw codedError('ERR_INVALID_CHAR');
  config.push('header = '+quote(name+': '+value));
 }
 if(request.body!==undefined)config.push('data-binary = '+quote(request.body));
 return new Promise((resolve,reject)=>{
  // A chave e o texto entram apenas por stdin; não vão para argumentos, shell ou arquivo.
  const child=spawnImpl(command,['--disable','--config','-'],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  let chunks=[],size=0,settled=false;
  const cleanup=()=>request.signal?.removeEventListener('abort',abort);
  const fail=code=>{if(settled)return;settled=true;cleanup();chunks=[];reject(codedError(code));};
  const abort=()=>{fail('CURL_28');child.kill();};
  child.on('error',()=>fail('CURL_NOT_FOUND'));
  child.stdin.on('error',()=>{});
  child.stderr.resume();
  child.stdout.on('data',chunk=>{if(settled)return;size+=chunk.length;if(size>8*1024*1024){fail('RESPONSE_TOO_LARGE');child.kill();return;}chunks.push(chunk);});
  child.on('close',code=>{
   if(settled)return;
   if(code!==0){fail(Object.hasOwn(networkMessages,'CURL_'+code)?'CURL_'+code:'NETWORK_ERROR');return;}
   const bytes=Buffer.concat(chunks),marker=bytes.lastIndexOf(STATUS_MARKER);
   const statusText=marker<0?'':bytes.subarray(marker+STATUS_MARKER.length).toString('ascii');
   const status=Number(statusText);
   if(!/^\d{3}$/.test(statusText)||status<200||status>599){fail('RESPONSE_INVALID');return;}
   settled=true;cleanup();resolve(new Response([204,205,304].includes(status)?null:bytes.subarray(0,marker),{status}));
  });
  if(request.signal?.aborted){abort();return;}
  request.signal?.addEventListener('abort',abort,{once:true});
  child.stdin.end(config.join('\n')+'\n','utf8');
 });
}

export function requestSpeech(url,request){return process.platform==='win32'?curlRequest(url,request):fetch(url,request);}
export async function diagnoseConnection({requestImpl=requestSpeech,log=console.log}={}){
 log('Teste HTTPS do ElevenLabs. Não pede chave e não gera áudio.');
 let response;
 try{response=await requestImpl('https://api.elevenlabs.io/v1/models',{method:'GET',headers:{Accept:'application/json'},signal:AbortSignal.timeout(30000)});}
 catch(error){throw new Error(describeConnectionError(error));}
 log(`O servidor respondeu HTTP ${response.status}.`);
 if(response.status===401){log('Conexão HTTPS confirmada. HTTP 401 é esperado neste teste sem chave.');return;}
 if(response.ok){log('Conexão HTTPS confirmada. Se a geração falhar, confira o código informado pelo gerador.');return;}
 log('Uma resposta HTTPS foi recebida. Este teste verifica somente a conexão; não valida a voz nem a API key.');
 if(response.status===404)log('A rota de modelos retornou 404. Execute GERAR_VOZ_WINDOWS.bat para testar a rota de geração com sua voz e chave.');
 else log('Compartilhe o código HTTP se precisar analisar a resposta do serviço.');
}
