import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeZip} from './zip-store.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):entry.isFile()?[path.join(folder,entry.name)]:[]);}
const removePrivateMetadata=html=>html.replace(/^.*<meta property="og:(?:url|image)"[^>]*>.*\n/gm,'');
const modules=['content.js','model.js','narration.js','audio-manifest.js','app.js'];
let js=modules.map(name=>fs.readFileSync(path.join(root,'dist',name),'utf8').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
js=js.replace(/^if\('serviceWorker' in navigator\).*$/gm,'');
let html=removePrivateMetadata(fs.readFileSync(path.join(root,'dist/index.html'),'utf8'));
html=html.replace(/^.*<link rel="manifest"[^>]*>.*\n/gm,'')
 .replace('<link rel="stylesheet" href="styles.css">',()=>'<style>'+fs.readFileSync(path.join(root,'dist/styles.css'),'utf8')+'</style>')
 .replace('<script type="module" src="app.js"></script>',()=>'<script>(()=>{\n'+js.replace(/<\/script/gi,'<\\/script')+'\n})();</script>');
const types={'.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg','.txt':'text/plain;charset=utf-8'};
for(const file of walk(path.join(root,'dist/assets'))){
 const relative=path.relative(path.join(root,'dist'),file).split(path.sep).join('/'),type=types[path.extname(file)];
 if(type&&html.includes(relative))html=html.replaceAll(relative,'data:'+type+';base64,'+fs.readFileSync(file).toString('base64'));
}
fs.writeFileSync(path.join(root,'PREVIA_LOCAL.html'),html);
const files=['dist','scripts','.github'].flatMap(folder=>walk(path.join(root,folder)));
for(const name of ['package.json','README.md','COMO_PUBLICAR_GITHUB.md','AVALIACAO_PROFESSORA.md','GERAR_VOZ_ELEVENLABS.md','GERAR_VOZ_WINDOWS.bat','DIAGNOSTICAR_CONEXAO_WINDOWS.bat','PREVIA_LOCAL.html','.gitignore'])files.push(path.join(root,name));
const entries=files.map(file=>({name:'Lumi_Previa_GitHub/'+path.relative(root,file).split(path.sep).join('/'),data:file===path.join(root,'dist/index.html')?Buffer.from(removePrivateMetadata(fs.readFileSync(file,'utf8'))):fs.readFileSync(file)}));
const complete=JSON.parse(fs.readFileSync(path.join(root,'dist/assets/audio/catalogo.json'),'utf8')).every(e=>fs.existsSync(path.join(root,'dist/assets/audio',e.file)));
fs.mkdirSync(path.join(root,'outputs'),{recursive:true});
const destination=path.join(root,'outputs',complete?'Lumi_Voz_Completa.zip':'Lumi_Gerador_Voz_ElevenLabs.zip');
writeZip(destination,entries);console.log(JSON.stringify({pacote:destination,voz_completa:complete,arquivos:entries.length}));
