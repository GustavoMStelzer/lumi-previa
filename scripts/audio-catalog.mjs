import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ACTIVITIES,makeQuestions} from '../dist/content.js';
import {normalizeNarrationText} from '../dist/narration.js';
import {csvCell} from '../dist/model.js';
import crypto from 'node:crypto';

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
  if(question.type==='sound')for(const word of question.options)add(word,activity.name+' · opção');
 }
}
add('Isso! Vamos para a próxima descoberta.','Retorno positivo');
add('Aventura concluída! Agora, que tal brincar um pouco fora da tela?','Encerramento');
const entries=[...lines.values()].map((entry,index)=>({...entry,file:'audio-'+String(index+1).padStart(3,'0')+'.mp3'}));
const csv='\uFEFF'+[['Arquivo','Texto exato','Contexto'],...entries.map(e=>[e.file,e.text,e.context])].map(row=>row.map(csvCell).join(';')).join('\r\n');
fs.writeFileSync(path.join(folder,'roteiro-narracao.csv'),csv);
fs.writeFileSync(path.join(folder,'roteiro-narracao.txt'),'LUMI — ROTEIRO DAS FALAS\n\nUse a mesma voz feminina brasileira em todos os arquivos.\nGere cada fala separadamente e salve com o nome indicado.\nRevisar a pronúncia e o conteúdo antes de um piloto com crianças.\nO MP3 enviado é uma prévia independente; seu conteúdo não foi recortado ou associado automaticamente a instruções.\n\n'+entries.map(e=>e.file+' | '+e.context+'\n'+e.text).join('\n\n')+'\n');
fs.writeFileSync(path.join(folder,'catalogo.json'),JSON.stringify(entries,null,2)+'\n');
const clips=Object.fromEntries(entries.filter(e=>fs.existsSync(path.join(folder,e.file))&&fs.statSync(path.join(folder,e.file)).size>0).map(e=>[e.text,'assets/audio/'+e.file]));
fs.writeFileSync(path.join(root,'dist/audio-manifest.js'),'// Gerado por scripts/audio-catalog.mjs; contém apenas arquivos existentes.\nexport const RECORDED_NARRATION='+JSON.stringify(clips,null,2)+';\n');
const audioFiles=Object.values(clips).map(file=>'./'+file);
const revision=crypto.createHash('sha256').update(JSON.stringify(clips));
for(const file of Object.values(clips))revision.update(fs.readFileSync(path.join(root,'dist',file)));
fs.writeFileSync(path.join(root,'dist/audio-cache.js'),'// Gerado por scripts/audio-catalog.mjs.\nself.LUMI_AUDIO_REVISION='+JSON.stringify(revision.digest('hex').slice(0,12))+';\nself.LUMI_AUDIO_FILES='+JSON.stringify(audioFiles,null,2)+';\n');
console.log(JSON.stringify({falas:entries.length,caracteres:entries.reduce((n,e)=>n+e.text.length,0),audios_disponiveis:Object.keys(clips).length}));
