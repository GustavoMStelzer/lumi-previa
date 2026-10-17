import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeZip} from './zip-store.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):entry.isFile()?[path.join(folder,entry.name)]:[]);}
const removePrivateMetadata=html=>html.replace(/^.*<meta property="og:(?:url|image)"[^>]*>.*\n/gm,'');
const modules=['illustrations.js','content.js','teaching.js','family-data.js','family-model.js','model.js','family-ui.js','studio.js','narration.js','audio-manifest.js','recorder.js','app.js'];
let js=modules.map(name=>fs.readFileSync(path.join(root,'dist',name),'utf8').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
js=js.replace(/^if\('serviceWorker' in navigator\).*$/gm,'');
let html=removePrivateMetadata(fs.readFileSync(path.join(root,'dist/index.html'),'utf8'));
html=html.replace(/^.*<link rel="manifest"[^>]*>.*\n/gm,'')
 .replace('<link rel="stylesheet" href="premium.css">',()=>'<style>'+fs.readFileSync(path.join(root,'dist/premium.css'),'utf8')+'</style>')
 .replace('<link rel="stylesheet" href="styles.css">',()=>'<style>'+fs.readFileSync(path.join(root,'dist/styles.css'),'utf8')+'</style>')
 .replace('<link rel="stylesheet" href="teacher.css">',()=>'<style>'+fs.readFileSync(path.join(root,'dist/teacher.css'),'utf8')+'</style>')
 .replace('<link rel="stylesheet" href="family.css">',()=>'<style>'+fs.readFileSync(path.join(root,'dist/family.css'),'utf8')+'</style>')
 .replace('<script type="module" src="app.js"></script>',()=>'<script>(()=>{\n'+js.replace(/<\/script/gi,'<\\/script')+'\n})();</script>');
const types={'.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg','.txt':'text/plain;charset=utf-8'};
for(const file of walk(path.join(root,'dist/assets'))){
 const relative=path.relative(path.join(root,'dist'),file).split(path.sep).join('/'),type=types[path.extname(file)];
 if(type&&html.includes(relative))html=html.replaceAll(relative,'data:'+type+';base64,'+fs.readFileSync(file).toString('base64'));
}
fs.writeFileSync(path.join(root,'PREVIA_LOCAL.html'),html);
const files=['dist','scripts','.github'].flatMap(folder=>walk(path.join(root,folder)));
for(const name of ['package.json','README.md','AVANCO_MANUAL_0.5.2.md','COMO_PUBLICAR_GITHUB.md','AVALIACAO_PROFESSORA.md','ATUALIZAR_LUMI.md','TESTAR_LUMI_v0.5.md','TESTAR_LUMI_v0.6.md','TESTAR_LUMI_v0.7.md','NOVIDADES_0.6.0.md','NOVIDADES_0.7.0.md','BNCC_MAPEAMENTO.md','WORKFLOW_PUBLICACAO.txt','Lumi_Exemplos_Professora.json','GERAR_VOZ_ELEVENLABS.md','GERAR_VOZ_WINDOWS.bat','DIAGNOSTICAR_CONEXAO_WINDOWS.bat','TESTAR_VOZ_WINDOWS.bat','TESTAR_HISTORIA_WINDOWS.bat','PREVIA_LOCAL.html','.gitignore'])if(fs.existsSync(path.join(root,name)))files.push(path.join(root,name));
const entries=files.map(file=>({name:'Lumi_Familia_v0.7.0/'+path.relative(root,file).split(path.sep).join('/'),data:[path.join(root,'dist/index.html'),path.join(root,'dist/404.html')].includes(file)?Buffer.from(removePrivateMetadata(fs.readFileSync(file,'utf8'))):fs.readFileSync(file)}));
const complete=JSON.parse(fs.readFileSync(path.join(root,'dist/assets/audio/catalogo.json'),'utf8')).every(e=>fs.existsSync(path.join(root,'dist/assets/audio',e.file)));
// O recibo contém somente hashes; permite retomar a mesma voz sem gerar os MP3 novamente.
const receiptFile=path.join(root,'.lumi-audio-generation.json');
if(complete&&fs.existsSync(receiptFile)){
 try{
  const raw=JSON.parse(fs.readFileSync(receiptFile,'utf8')),digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
  if(digest(raw.signature)&&raw.outputs&&typeof raw.outputs==='object'){
   const outputs=Object.fromEntries(Object.entries(raw.outputs).filter(([file,value])=>/^audio-\d{3}\.mp3$/.test(file)&&value&&digest(value.textHash)&&digest(value.requestHash)&&digest(value.audioHash)).map(([file,value])=>[file,{textHash:value.textHash,requestHash:value.requestHash,audioHash:value.audioHash}]));
   if(Object.keys(outputs).length)entries.push({name:'Lumi_Familia_v0.7.0/.lumi-audio-generation.json',data:JSON.stringify({signature:raw.signature,outputs},null,2)+'\n'});
  }
 }catch{}
}
fs.mkdirSync(path.join(root,'outputs'),{recursive:true});
const destination=path.join(root,'outputs',complete?'Lumi_Familia_v0.7.0_Com_Voz.zip':'Lumi_Familia_v0.7.0_Completo.zip');
writeZip(destination,entries);console.log(JSON.stringify({pacote:destination,voz_completa:complete,arquivos:entries.length}));
