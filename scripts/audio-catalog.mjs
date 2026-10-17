import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ACTIVITIES,makeQuestions,SOUND_DEMO} from '../dist/content.js';
import {normalizeNarrationText} from '../dist/narration.js';
import {csvCell} from '../dist/model.js';
import crypto from 'node:crypto';
import {WRONG_FEEDBACK} from '../dist/teaching.js';
import {FAMILY_VOICE,OFFLINE_ACTIVITIES} from '../dist/family-data.js';
import {pacedNarrationText,NARRATION_VOICE_SETTINGS} from './narration-settings.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=path.join(root,'dist/assets/audio');fs.mkdirSync(folder,{recursive:true});
const lines=new Map();
function add(text,context){
 const normalized=normalizeNarrationText(text);
 if(!lines.has(normalized))lines.set(normalized,{text:normalized,context});
}
for(const activity of ACTIVITIES){
 for(const question of makeQuestions(activity.id,()=>.5)){
  add(question.type==='story'?question.text+' '+question.prompt:question.prompt,activity.name+' · instrução');
  if(question.type==='read'){
   add('A palavra é '+question.target+'.',activity.name+' · dica');
   add('Isso! A palavra é '+question.target+'.',activity.name+' · retorno');
  }
  if(['sound','choice'].includes(question.type))for(const word of question.options)add(word,activity.name+' · opção');
  if(question.type==='see'&&question.say)for(const word of Object.values(question.say))add(word,activity.name+' · ouvir a quantidade');
  if(question.type==='memory')for(const key of question.pairs)add(key,activity.name+' · nome da carta');
 }
}
add('Isso! Vamos para a próxima descoberta.','Retorno positivo');
add('Aventura concluída! Agora, que tal brincar um pouco fora da tela?','Encerramento');
// Textos que continuam em uso mantêm o arquivo. Instruções alteradas recebem novos nomes; arquivos antigos não são reutilizados para outro texto.
add(WRONG_FEEDBACK.default,'Orientação após uma tentativa');
add(WRONG_FEEDBACK.build,'Orientação para ajustar as sílabas');
for(const question of makeQuestions('build',()=>.5))for(const syllable of question.options)add(syllable.toLocaleLowerCase('pt-BR'),'Sílabas · ouvir sem selecionar');
add(SOUND_DEMO,'Detetive dos sons · exemplo sem registro');
add(FAMILY_VOICE.welcome,'Boas-vindas em família');
add(FAMILY_VOICE.retell,'Pedido para gravar o reconto');
for(const activity of OFFLINE_ACTIVITIES)add(activity.narration,activity.name+' · convite fora da tela');
let previous=[];
try{previous=JSON.parse(fs.readFileSync(path.join(folder,'catalogo.json'),'utf8'));}catch{}
const priorFiles=new Map(previous.filter(e=>typeof e.text==='string'&&/^audio-\d{3}\.mp3$/.test(e.file)).map(e=>[normalizeNarrationText(e.text),e.file]));
let nextNumber=Math.max(0,...[...priorFiles.values()].map(file=>Number(file.match(/\d+/)[0])));
const entries=[...lines.values()].map(entry=>({...entry,synthesisText:pacedNarrationText(entry.text),file:priorFiles.get(entry.text)||'audio-'+String(++nextNumber).padStart(3,'0')+'.mp3'}));
const csv='\uFEFF'+[['Arquivo','Texto visível','Fala com pausas (Multilingual v2)','Contexto'],...entries.map(e=>[e.file,e.text,e.synthesisText,e.context])].map(row=>row.map(csvCell).join(';')).join('\r\n');
fs.writeFileSync(path.join(folder,'roteiro-narracao.csv'),csv);
fs.writeFileSync(path.join(folder,'roteiro-narracao.txt'),'LUMI — ROTEIRO DAS FALAS\n\nUse a mesma voz brasileira em todos os arquivos. Multilingual v2; velocidade 0,88; pausas curtas com SSML <break>.\nGere cada fala separadamente e salve com o nome indicado.\nRevisar a pronúncia e o conteúdo antes de um piloto com crianças.\nO MP3 enviado é uma prévia independente; seu conteúdo não foi recortado ou associado automaticamente a instruções.\n\n'+entries.map(e=>e.file+' | '+e.context+'\nTexto: '+e.text+'\nEnviar ao ElevenLabs: '+e.synthesisText).join('\n\n')+'\n');
fs.writeFileSync(path.join(folder,'catalogo.json'),JSON.stringify(entries,null,2)+'\n');
const clips=Object.fromEntries(entries.filter(e=>fs.existsSync(path.join(folder,e.file))&&fs.statSync(path.join(folder,e.file)).size>0).map(e=>[e.text,'assets/audio/'+e.file]));
fs.writeFileSync(path.join(root,'dist/audio-manifest.js'),'// Gerado por scripts/audio-catalog.mjs; contém apenas arquivos existentes.\nexport const RECORDED_NARRATION='+JSON.stringify(clips,null,2)+';\n');
const audioFiles=Object.values(clips).map(file=>'./'+file);
const revision=crypto.createHash('sha256').update(JSON.stringify(clips));
for(const file of Object.values(clips))revision.update(fs.readFileSync(path.join(root,'dist',file)));
fs.writeFileSync(path.join(root,'dist/audio-cache.js'),'// Gerado por scripts/audio-catalog.mjs.\nself.LUMI_AUDIO_REVISION='+JSON.stringify(revision.digest('hex').slice(0,12))+';\nself.LUMI_AUDIO_FILES='+JSON.stringify(audioFiles,null,2)+';\n');
console.log(JSON.stringify({falas:entries.length,caracteres:entries.reduce((n,e)=>n+e.text.length,0),audios_disponiveis:Object.keys(clips).length}));
