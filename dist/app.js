import {WORD_ART} from './illustrations.js';
import {ACTIVITIES,makeQuestions,answerIsCorrect,SOUND_DEMO,MEMORY_NAMES} from './content.js';
import {STORAGE_KEY,createState,restoreState,recordSession,profileStats,nextActivity,addAssignment,sessionsCSV,familyBackupJSON,parseFamilyBackup} from './model.js';
import {Narrator} from './narration.js';
import {RECORDED_NARRATION} from './audio-manifest.js';
import {TEMPLATES,VISUALS,WRONG_FEEDBACK,allActivities,activityById,availableActivities,setAvailableActivities,saveTeachingActivity,questionsForActivity,newTeachingDraft,blankQuestion,validateTeachingActivity,exportTeachingPack,parseTeachingPack,importTeachingPack} from './teaching.js';
import {activityManagerHTML,editorHTML,readEditorDraft} from './studio.js';
import {FAMILY_SUPPORTS,PARTICIPATION,OFFLINE_ACTIVITIES,FAMILY_VOICE,SUGGESTED_AGES} from './family-data.js';
import {updateFamilyProfile,normalizeFamilyProfile,recordFamilyObservation,familySummaryText,familyWeeklySummary} from './family-model.js';
import {recordingSupported,startVoiceRecording,saveVoiceClip,listVoiceClips,deleteVoiceClip,VOICE_LIMIT_SECONDS} from './recorder.js';
import {dailyTrail,gardenFor,familyShareText} from './family-model.js';
import {familyHomeHTML,familyDiscoveriesHTML,familyProfileHTML,familyProfileFormHTML,familyGardenHTML,gardenSVG} from './family-ui.js';

const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const root=$('#app'),overlayRoot=$('#overlay-root');
let state=createState(),storageAvailable=true;
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=restoreState(JSON.parse(raw));}catch{storageAvailable=false;}
let view='adventure',filter='Todas',search='',game=null,lastCompletion=null,adultUntil=0,modalContext=null,returnFocus=null,toastTimer=null,pendingNavigation=null,previewPlaying=false;
let teacherDraft=null,editorDirty=false,pendingTeachingPack=null;
let pendingFamilyBackup=null;
let nativeSpeechGeneration=0;
const VOICE_PREVIEW='assets/audio/lumi-voz-preview.mp3';
const narrator=new Narrator({clips:RECORDED_NARRATION,makeAudio:source=>new Audio(source),isEnabled:()=>audioEnabled(),speakFallback:speakNative,stopFallback:stopNativeSpeech,onError:toast,onState:({playing,source})=>{previewPlaying=playing&&source===VOICE_PREVIEW;for(const button of document.querySelectorAll('[data-action="voice-preview"]')){button.innerHTML=icon(previewPlaying?'close':'sound')+(previewPlaying?'Parar a prévia':'Ouvir a voz da Lumi');button.setAttribute('aria-pressed',String(previewPlaying));}}});
const navigation=[['adventure','compass','Hoje'],['library','grid','Brincar'],['family','sprout','Descobertas'],['profile','users','Perfil']];
const iconPaths={
 compass:'<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4Z"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 heart:'<path d="M20.5 4.5a5.3 5.3 0 0 0-7.5 0L12 5.6l-1-1.1a5.3 5.3 0 0 0-7.5 7.5L12 20l8.5-8a5.3 5.3 0 0 0 0-7.5Z"/>',
 school:'<path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-7h6v7M8 10h.01M16 10h.01"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
 chevron:'<path d="m8 10 4 4 4-4"/>',
 star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 sprout:'<path d="M12 21v-8M12 14C5 15 3 10 3 4c6 0 10 3 9 10ZM12 11c0-5 4-8 9-8 0 6-3 9-9 8Z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 blocks:'<rect x="3" y="12" width="8" height="8" rx="2"/><rect x="13" y="12" width="8" height="8" rx="2"/><rect x="8" y="2" width="8" height="8" rx="2"/>',
 sign:'<path d="M12 2v20M3 5h15l3 4-3 4H3Z"/>',
 puzzle:'<path d="M4 3h5a3 3 0 1 0 6 0h5v6a3 3 0 1 0 0 6v6h-6a3 3 0 1 0-6 0H3v-6a3 3 0 1 0 0-6V3Z"/>',
 book:'<path d="M12 5c-3-3-7-3-10-2v16c4-1 7-1 10 2 3-3 6-3 10-2V3c-4-1-7-1-10 2Zm0 0v16"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 sound:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 muted:'<path d="m11 4-6 5H2v6h3l6 5Zm5 5 5 6m0-6-5 6"/>',
 settings:'<path d="m10 3-.7 3-2.4 1.4-3-.9-2 3.5 2.3 2v2.8l-2.3 2 2 3.5 3-.9L9.3 22l.7-3h4l.7 3 2.4-1.4 3 .9 2-3.5-2.3-2v-2.8l2.3-2-2-3.5-3 .9L14.7 6 14 3Z"/><circle cx="12" cy="12.5" r="3"/>',
 print:'<path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6Z"/><path d="M17 12h.01"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/>',
 leaf:'<path d="M19 3c3 9 1 15-6 16-5 1-9-2-9-7 0-7 7-9 15-9ZM4 21 15 10"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 repeat:'<path d="M3 11a9 9 0 1 1 3 8M3 4v7h7"/>',
 paw:'<circle cx="6" cy="10" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="14" cy="5.5" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 4-6 7 0 2 2 3 3 2.5 1-.5 2-1 3-1s2 .5 3 1c1 .5 3-.5 3-2.5 0-3-3-7-6-7Z"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
 cards:'<rect x="3" y="5" width="11" height="15" rx="2"/><path d="M17 5.5l3 .8a2 2 0 0 1 1.4 2.4l-2.8 10.6"/>',
 scale:'<circle cx="7" cy="15" r="4"/><circle cx="17.5" cy="9.5" r="2.5"/>',
 dots:'<circle cx="7" cy="7" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><circle cx="12" cy="12" r="2"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
 stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
 trash:'<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 hand:'<path d="M8 12V5a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-6a2 2 0 0 1 4 0v9c0 4-3 7-7 7h-1c-3 0-5-2-7-5l-3-4a2 2 0 0 1 3-3l3 2Z"/>'
};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.star}</svg>`;}
function picture(word,visual=null){
 if(visual&&VISUALS.includes(visual)){if(!/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]+$/.test(visual))return `<span class="word-picture emoji-picture" role="img" aria-label="${esc(word)}">${visual}</span>`;word=visual;}

 return `<svg class="word-picture" viewBox="0 0 100 100" fill="none" aria-hidden="true">${WORD_ART[word]||WORD_ART.PLANTA}</svg>`;
}
function seeArt(spec){
 if(!spec)return '';
 if(spec.dots)return `<span class="dot-card" aria-hidden="true">${Array.from({length:spec.dots},()=>'<span class="dot"></span>').join('')}<span class="dot-number">${spec.dots}</span></span>`;
 const one=`<svg class="word-picture" viewBox="0 0 100 100" fill="none" aria-hidden="true">${WORD_ART[spec.key]||WORD_ART.PLANTA}</svg>`;
 if(spec.count)return `<span class="count-group count-${spec.count}" aria-hidden="true">${Array.from({length:spec.count},()=>one).join('')}</span>`;
 return `<span class="see-art ${spec.mode?'mode-'+spec.mode:''}" aria-hidden="true">${one}</span>`;
}
function optionLabel(q,option){return q.labels?.[option]||String(option).split('~')[0].toLocaleLowerCase('pt-BR');}
function avatar(profile){return `<span class="avatar">${profile.avatar==='fox'?'<img src="assets/lumi.svg" alt="">':({cat:'🐱',frog:'🐸',owl:'🦉'}[profile.avatar]||'🦊')}</span>`;}
function active(){return state.profiles.find(p=>p.id===state.activeProfile)||state.profiles[0];}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;toast('Não foi possível salvar neste navegador. O progresso ficará disponível enquanto esta página estiver aberta.');}}
function toast(message){clearTimeout(toastTimer);const node=$('#toast');node.textContent=message;node.classList.add('show');toastTimer=setTimeout(()=>node.classList.remove('show'),5500);}
function stopNativeSpeech(){
 nativeSpeechGeneration++;
 try{window.speechSynthesis?.cancel?.();}catch{}
}
function speakNative(text){
 if(!audioEnabled()){toast('O áudio está desligado. Ative o som no botão do alto da página.');return false;}
 if(!('speechSynthesis' in window)){toast('A narração não está disponível neste aparelho. Um adulto pode ler as instruções.');return false;}
 stopNativeSpeech();const generation=nativeSpeechGeneration;
 try{
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang='pt-BR';utterance.rate=.8;utterance.pitch=1.05;
  const voices=speechSynthesis.getVoices(),voice=voices.find(v=>v.lang.toLowerCase()==='pt-br')||voices.find(v=>v.lang.toLowerCase().startsWith('pt'));
  if(voice)utterance.voice=voice;
  utterance.onerror=event=>{if(generation===nativeSpeechGeneration&&!['canceled','interrupted'].includes(event.error))toast('O aparelho não conseguiu narrar. Um adulto pode ler com você.');};
  speechSynthesis.speak(utterance);return true;
 }catch{toast('A narração não está disponível agora. Um adulto pode ler com você.');return false;}
}

function speak(text){return narrator.speak(text);}
function stopSpeech(){narrator.stop();}
function audioEnabled(){return state.settings.sound&&!active().supports?.quietMode;}
function settingsClass(){const supports=active().supports||{};document.body.classList.toggle('reduced-motion',state.settings.reducedMotion||supports.reducedMotion);document.body.classList.toggle('large-text',state.settings.largeText);document.body.classList.toggle('large-targets',supports.largeTargets);document.body.classList.toggle('high-contrast',supports.highContrast);}
function adultBanner(){return `<div class="adult-banner">${icon('info')}<div><strong>Ambiente de demonstração.</strong> Use apelidos fictícios. ${storageAvailable?'Os registros ficam somente neste navegador; a troca entre escola e casa é simulada.':'Este navegador não permite salvar os registros.'} O conteúdo pedagógico ainda precisa de revisão profissional antes do uso com crianças.</div></div>`;}
function layout(content){
 const p=active();
 const audioButton=`<button class="icon-button" data-action="mute" aria-label="${audioEnabled()?'Desligar':'Ligar'} áudio" title="Áudio">${icon(audioEnabled()?'sound':'muted')}</button>`;
 const brand=`<button class="brand" data-action="nav" data-view="adventure" aria-label="Lumi, ir para Hoje"><img src="assets/lumi.svg" alt=""><div><div class="brand-name">lum<span>i</span><span style="color:#d9aa50">.</span></div><div class="brand-sub">Descobertas em família</div></div></button>`;
 if(view==='play')return `<div class="family-app is-playing"><header class="family-topbar">${brand}<div class="topbar-actions">${audioButton}<button class="icon-button" data-action="settings" aria-label="Preferências">${icon('settings')}</button></div></header><main id="main" class="family-main family-game-main" tabindex="-1">${content}</main></div>`;
 return `<div class="family-app"><header class="family-topbar">${brand}<div class="topbar-actions">${audioButton}<button class="profile-button" data-action="profiles" aria-label="Trocar perfil">${avatar(p)}<span class="profile-name">${esc(p.name)}</span>${icon('chevron')}</button></div></header><nav class="family-nav" aria-label="Navegação principal">${navigation.map(([id,i,label])=>`<button class="family-nav-item ${view===id||(id==='adventure'&&view==='garden')?'active':''}" data-action="nav" data-view="${id}" ${view===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span></button>`).join('')}</nav><main id="main" class="family-main" tabindex="-1">${content}</main><footer class="family-app-footer"><span>Lumi · prévia Família 0.7.0</span><button class="text-button" data-action="help">Sobre esta experiência</button></footer></div>`;
}
function activityCard(a,large=false){
 const completed=profileStats(state,state.activeProfile).completed.has(a.id),ages=a.age&&a.age!=='mixed'?[a.age]:(SUGGESTED_AGES[a.id]||[3,4,5]);
 return `<button class="activity-card" data-action="play" data-id="${a.id}" aria-label="Jogar ${esc(a.name)}${completed?', já explorada':''}"><div class="activity-art ${a.color}">${a.storyArt?`<img class="story-thumbnail" src="${esc(a.storyArt)}" alt="" loading="lazy">`:icon(a.icon)}${completed?`<span class="completed-badge" title="Atividade explorada">${icon('check')}</span>`:''}</div><div class="activity-copy">${large?`<div class="activity-tag">${esc(a.tag)}</div>`:''}<h3>${esc(a.name)}</h3><p>${esc(a.description)}</p><span class="activity-age">${ages.length>1?ages[0]+' a '+ages.at(-1):ages[0]} anos</span><div class="activity-meta">${icon('clock')}<span>${a.duration}</span><span class="go">${icon('arrow')}</span></div></div></button>`;
}
function adventure(){return familyHomeHTML(state,active(),{icon,activityCard});}
function library(){
 const selected=availableActivities(state).filter(a=>(filter==='Todas'||a.category===filter)&&`${a.name} ${a.description} ${a.skill}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
 return `<div class="page-heading"><div><h1>Qual será a descoberta de hoje?</h1><p>Escolha uma experiência para brincar com um adulto. A faixa etária é uma sugestão para começar.</p></div></div><div class="library-controls"><div class="tabs" role="group" aria-label="Filtrar atividades">${['Todas',...new Set(availableActivities(state).map(a=>a.category))].map(f=>`<button class="tab ${filter===f?'active':''}" aria-pressed="${filter===f}" data-action="filter" data-filter="${f}">${f}</button>`).join('')}</div><label class="search-input">${icon('search')}<input id="activity-search" type="search" placeholder="Buscar uma atividade" aria-label="Buscar uma atividade" value="${esc(search)}"></label></div><div id="library-results">${libraryResults(selected)}</div><div class="session-note">${icon('info')}Os tempos indicados são estimativas. Não há corrida: cada descoberta acontece no seu ritmo.</div>`;
}
// Atividades da idade do perfil aparecem primeiro; as que exigem letras ou leitura ficam em um grupo separado, com apoio do adulto.
function activityAges(a){return a.age&&a.age!=='mixed'?[Number(a.age)]:(SUGGESTED_AGES[a.id]||[3,4,5]);}
function libraryResults(selected){
 if(!selected.length)return '<div class="empty-state"><h3>Nenhuma atividade encontrada</h3><p>Tente buscar por bichos, histórias, cores ou números.</p></div>';
 const age=active().age;if(!age)return `<div class="library-grid">${selected.map(a=>activityCard(a,true)).join('')}</div>`;
 const fits=selected.filter(a=>activityAges(a).includes(age)),later=selected.filter(a=>!activityAges(a).includes(age));
 return `${fits.length?`<h2 class="library-group-title">Para ${age} anos</h2><div class="library-grid">${fits.map(a=>activityCard(a,true)).join('')}</div>`:''}${later.length?`<h2 class="library-group-title">Para quando a criança se interessar por letras e números</h2><p class="library-group-note">Estas propostas pedem reconhecer letras, ler ou contar mais. Brinque junto e pare quando deixar de ser divertido.</p><div class="library-grid is-later">${later.map(a=>activityCard(a,true)).join('')}</div>`:''}`;
}
function statCard(label,value,caption,i){return `<section class="stat-card"><div class="stat-top"><span>${label}</span>${icon(i)}</div><div class="stat-value">${value}</div><div class="stat-caption">${caption}</div></section>`;}
function historyHTML(profileId){
 const sessions=profileStats(state,profileId).sessions.slice(-8).reverse();
 if(!sessions.length)return `<div class="empty-state">${icon('book')}<h3>A primeira descoberta começa aqui</h3><p>Depois de concluir uma atividade, seus registros aparecerão neste espaço.</p><button class="primary" data-action="play" data-id="letters">Explorar as letras${icon('arrow')}</button></div>`;
 return `<div class="history-list">${sessions.map(s=>{const a=activityById(state,s.activityId,{includeDrafts:true});return `<div class="history-row"><div class="history-icon ${a.color}">${icon(a.icon)}</div><div class="history-info"><strong>${esc(s.activityName||a.name)}</strong><span>${formatDate(s.createdAt)} · ${formatDuration(s.seconds)} · ${s.rounds.length} desafios</span></div><span class="badge">Explorada</span></div>`;}).join('')}</div>`;
}
function profileSelect(){return `<select class="small-select" id="adult-profile" aria-label="Selecionar perfil de demonstração">${state.profiles.map(p=>`<option value="${esc(p.id)}" ${p.id===state.activeProfile?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;}
function family(){return familyDiscoveriesHTML(state,active(),icon,{voices:recordingSupported()});}
function shareFamilySummary(){
 const text=familyShareText(state,active().id);
 if(navigator.share){navigator.share({title:'Lumi: resumo da semana',text}).catch(()=>{});return;}
 const link=document.createElement('a');link.href='https://wa.me/?text='+encodeURIComponent(text);link.target='_blank';link.rel='noopener';document.body.append(link);link.click();link.remove();
}
function school(){return `<div class="page-heading"><div><div class="eyebrow">ÁREA DE REVISÃO DO CONTEÚDO</div><h1>Conteúdo da prévia.</h1><p>Selecione as experiências disponíveis ou prepare uma atividade a partir de um modelo.</p></div><button class="secondary" data-action="nav" data-view="profile">${icon('back')}Voltar ao perfil</button></div>${activityManagerHTML(state,icon)}`;}
function render(){
 settingsClass();let html;
 switch(view){case 'library':html=library();break;case 'family':html=family();break;case 'profile':html=familyProfileHTML(state,active(),icon);break;case 'school':html=school();break;case 'garden':html=familyGardenHTML(state,active(),icon);break;case 'editor':html=editorHTML(teacherDraft,icon);break;case 'play':html=game?.completed?completion():gameHTML();break;default:html=adventure();}
 root.innerHTML=layout(html);
 if(view==='family')hydrateVoices();
 document.title=`${view==='play'&&game?game.activity.name:view==='family'?'Descobertas':view==='profile'?'Perfil':view==='school'?'Conteúdo':view==='library'?'Atividades':view==='garden'?'Jardim':'Descobertas em família'} · Lumi`;
}
function navigate(target,{confirmed=false}={}){
 if(!navigation.some(([id])=>id===target)&&!['school','garden'].includes(target))return;
 if(view==='editor'&&editorDirty&&!confirmed){pendingNavigation=()=>navigate(target,{confirmed:true});openModal('Sair da edição?',`<p class="modal-description">Há alterações que ainda não foram salvas. Você pode continuar preparando a atividade.</p><div class="button-row"><button class="primary" data-action="close-modal">Continuar editando</button><button class="secondary" data-action="confirm-navigation">Sair sem salvar</button></div>`);return;}
 if(view==='play'&&game&&!game.completed&&!confirmed){pendingNavigation=()=>navigate(target,{confirmed:true});openModal('Voltar à aventura?',`<p class="modal-description">Esta atividade ainda está acontecendo. Você pode sair e recomeçar depois. O registro é salvo quando a atividade é concluída.</p><div class="button-row"><button class="primary" data-action="close-modal">Continuar brincando</button><button class="secondary" data-action="confirm-navigation">Sair da atividade</button></div>`);return;}
 if(['family','school','profile'].includes(target)&&Date.now()>adultUntil){showGate(()=>navigate(target,{confirmed:true}));return;}
 closeModal();stopSpeech();view=target;game=null;editorDirty=false;render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});
}
function startActivity(id,{preview=false,activity:override=null,returnView='school'}={}){
 const activity=override||activityById(state,id,{includeDrafts:preview});if(!activity||(!preview&&!availableActivities(state).some(a=>a.id===id))){toast('Essa atividade não está disponível na seleção atual.');return;}
 const source=override?{...state,customActivities:[...(state.customActivities||[]).filter(a=>a.id!==id),override]}:state;
 closeModal();stopSpeech();view='play';game={activity,preview,returnView,intro:id==='sounds'&&!preview,profileId:state.activeProfile,questions:questionsForActivity(source,id),index:0,rounds:[],attempts:0,helps:0,seconds:0,sinceBreak:0,build:[],buildIndices:[],flipped:[],matched:[],solved:false,lastWrong:null,feedback:'',completed:false};clearTimeout(memoryTimer);render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});if(audioEnabled())speakInitial();
}
function speakInitial(){if(!game||game.completed)return;if(game.intro){speak(SOUND_DEMO);return;}const q=game.questions[game.index];speak(q.type==='story'?q.text+' '+q.prompt:q.prompt);}
function gameHTML(){
 if(!game)return adventure();if(game.intro)return soundIntroHTML();const q=game.questions[game.index],a=game.activity;
 const listenLabel=q.type==='read'?'Ouvir uma dica':q.type==='story'?'Ouvir a história':'Ouvir instrução';
 let stage='';
 if(q.type==='story'){
  const visual=a.storyArt?`<img class="story-landscape" src="${esc(a.storyArt)}" alt="${esc(a.storyAlt||'Ilustração do cenário da história')}">`:q.visual!==undefined?(q.visual?picture(q.correct,q.visual):''):picture(q.scene==='seed'?'SEMENTE':q.scene==='water'?'ÁGUA':'PLANTA');
  stage=`<div class="story-scene ${a.storyArt?'story-panorama':''}">${a.storyArt?'':'<img src="assets/lumi.svg" alt="Lumi no jardim">'}${visual}</div><p class="story-text">${esc(q.text)}</p><button class="audio-prompt" data-action="listen">${icon('sound')}${listenLabel}</button><div class="story-question">${esc(q.prompt)}</div>${optionsHTML(q,true)}`;
 }else if(q.type==='build'){
  const illustration=q.visual!==undefined?(q.visual?picture(q.target,q.visual):''):picture(q.target);
  stage=`<h1>${esc(q.prompt)}</h1><div class="build-picture">${illustration}</div><button class="audio-prompt" data-action="listen">${icon('sound')}${listenLabel}</button><div class="build-slots" aria-label="Sílabas escolhidas: ${esc(game.build.join(' ')||'nenhuma')}">${Array.from({length:q.slots},(_,i)=>game.build[i]?`<button class="build-slot filled" data-action="remove-piece" data-index="${i}" aria-label="Retirar sílaba ${esc(game.build[i])}" ${game.solved?'disabled':''}>${esc(game.build[i])}</button>`:'<span class="build-slot">—</span>').join('')}</div><div class="syllable-options">${q.options.map((syllable,i)=>`<div class="syllable-card"><button class="syllable-button" data-action="syllable" data-index="${i}" aria-label="Adicionar sílaba ${esc(syllable)}" ${game.solved||game.buildIndices.includes(i)||game.build.length>=q.slots?'disabled':''}>${esc(syllable)}</button><button class="option-sound syllable-sound" data-action="listen-syllable" data-index="${i}" ${game.solved?'disabled':''} aria-label="Ouvir sílaba ${esc(syllable)}">${icon('sound')}Ouvir</button></div>`).join('')}</div><div class="build-actions"><button class="secondary" data-action="undo" ${!game.build.length||game.solved?'disabled':''}>${icon('back')}Desfazer</button></div><p class="build-instruction">Escolha as sílabas na ordem. Ao completar, a Lumi confere para você.</p>`;
 }else if(q.type==='see'){
  const reference=q.reference?`<div class="see-reference ${q.reference.count?'is-count':''}" role="img" aria-label="${esc(q.reference.count?q.reference.count+' figuras para contar':optionLabel(q,q.reference.key))}">${seeArt(q.reference)}</div>`:'';
  stage=`<h1>${esc(q.prompt)}</h1>${reference}<div><button class="audio-prompt" data-action="listen">${icon('sound')}${listenLabel}</button></div>${optionsHTML(q)}`;
 }else if(q.type==='memory'){
  const open=new Set([...(game.matched||[]),...(game.flipped||[])]);
  stage=`<h1>${esc(q.prompt)}</h1><div><button class="audio-prompt" data-action="listen">${icon('sound')}${listenLabel}</button></div><div class="memory-grid cards-${q.cards.length}">${q.cards.map((card,i)=>{const key=card.split('~')[0],shown=open.has(i),done=(game.matched||[]).includes(i);return `<button class="memory-card ${shown?'is-open':''} ${done?'is-matched':''}" data-action="flip" data-index="${i}" aria-label="Carta ${i+1}${shown?': '+esc(MEMORY_NAMES[key]||key.toLocaleLowerCase('pt-BR')):', virada para baixo'}" ${done||game.solved||game.flipped?.includes(i)?'aria-disabled="true"':''}><span class="memory-back" aria-hidden="true"><img src="assets/lumi.svg" alt=""></span><span class="memory-front" aria-hidden="true"><svg class="word-picture" viewBox="0 0 100 100" fill="none">${WORD_ART[key]}</svg></span></button>`;}).join('')}</div>`;
 }else{
  const title=q.type==='read'?'Qual figura combina?':q.type==='missing'?'Qual letra está faltando?':q.type==='sound'?(a.id==='rhymes'?'Quais palavras rimam?':'Qual nome começa com o mesmo som?'):q.prompt;
  stage=`<h1>${esc(title)}</h1>${q.type==='sound'?`<div class="reference-word">${picture(q.reference)}${esc(q.reference)}</div>`:''}${['read','missing'].includes(q.type)?`<div class="word-target">${esc(q.type==='missing'?q.gap:q.target)}</div>${q.type==='missing'?`<div class="build-picture">${picture(q.target)}</div>`:''}`:''}<div><button class="audio-prompt" data-action="listen">${icon('sound')}${listenLabel}</button></div>${optionsHTML(q)}`;
 }
 return `<div class="game-wrap ${game.solved?'has-dock':''}">${game.preview?'<div class="preview-banner">Teste da professora · esta sessão não gera registros.<button class="text-button" data-action="preview-back">Voltar à preparação</button></div>':''}<div class="game-header"><button class="quiet" data-action="nav" data-view="adventure">${icon('back')}Voltar</button><div class="game-title">${icon(a.icon)}${esc(a.name)}</div><span class="text-muted">${game.index+1} / ${game.questions.length}</span></div><div class="game-progress" aria-label="Desafio ${game.index+1} de ${game.questions.length}">${game.questions.map((_,i)=>`<span class="${i<game.index?'done':i===game.index?'current':''}"></span>`).join('')}</div><section class="game-card ${q.type==='story'?'is-story':''} ${game.solved?'celebrating':''}" tabindex="-1">${q.type==='story'?`<div class="game-hint">${icon('users')}Leiam juntos com um adulto.</div>`:''}${game.solved?`<div class="discovery-sparkles" aria-hidden="true">${Array.from({length:6},(_,i)=>`<span style="--sparkle:${i}">${icon(i%2?'star':'sprout')}</span>`).join('')}</div>`:''}${stage}<div class="feedback ${game.lastWrong?'neutral':''}" role="status" aria-live="polite">${game.feedback?`<span class="feedback-message">${icon(game.solved?'check':'leaf')}${esc(game.feedback)}</span>`:'<span class="text-muted">Pode experimentar. A Lumi está aqui com você.</span>'}</div></section><div class="game-footer">${icon('heart')}Sem pressa. Você pode ouvir de novo e tentar outra vez.</div>${game.solved?`<div class="continue-dock" role="region" aria-label="Próximo passo"><img class="continue-lumi" src="assets/lumi.svg" alt=""><div class="continue-copy"><strong>${game.index===game.questions.length-1?'Você conseguiu!':'Isso!'}</strong><span>Toque em Continuar.</span></div><button class="continue-button" data-action="next">${game.index===game.questions.length-1?'Concluir':'Continuar'}${icon('arrow')}</button></div>`:''}</div>`;
}
function soundIntroHTML(){
 return `<div class="game-wrap"><div class="game-header"><button class="quiet" data-action="nav" data-view="adventure">${icon('back')}Voltar</button><div class="game-title">${icon('search')}Detetive dos sons</div></div><section class="game-card sound-intro"><div class="game-eyebrow">UM EXEMPLO ANTES DE COMEÇAR</div><h1>Vamos escutar o comecinho?</h1><p>Bola e bota começam de um jeito parecido. Ouça os nomes com um adulto.</p><div class="sound-example"><div>${picture('BOLA')}<strong>BOLA</strong></div><span>${icon('sound')}</span><div>${picture('BOTA')}<strong>BOTA</strong></div></div><button class="secondary" data-action="sound-demo">${icon('sound')}Ouvir o exemplo</button><p class="sound-example-note">No jogo, ouça o nome apresentado e depois cada opção. Escolha a figura cujo nome começa com o mesmo som.</p><button class="primary" data-action="start-sound-round">Vamos experimentar${icon('arrow')}</button></section></div>`;
}
function optionsHTML(q,story=false){
 if(q.type==='see')return `<div class="answer-options see-options options-${q.options.length}">${q.options.map((option,i)=>`<div><button class="answer-button see-button ${game.solved&&option===q.correct?'correct':game.lastWrong===option?'wrong':''}" data-action="answer" data-index="${i}" aria-label="Escolher ${esc(optionLabel(q,option))}" ${game.solved?'disabled':''}>${seeArt(q.art?.[option])}</button>${q.say?`<button class="option-sound" data-action="listen-option" data-index="${i}" ${game.solved?'disabled':''} aria-label="Ouvir ${esc(q.say[option])}">${icon('sound')}Ouvir</button>`:''}</div>`).join('')}</div>`;
 const isLetter=['letter','missing'].includes(q.type),showNames=['sound','story','choice'].includes(q.type);
 return `<div class="answer-options ${story?'story-options':''}">${q.options.map((option,i)=>{
  const art=q.visuals?(q.visuals[option]?picture(option,q.visuals[option]):''):picture(option);
  return `<div><button class="answer-button ${isLetter?'letter':''} ${game.solved&&option===q.correct?'correct':game.lastWrong===option?'wrong':''}" data-action="answer" data-index="${i}" aria-label="Escolher ${esc(option)}" ${game.solved?'disabled':''}>${isLetter?esc(option):`${art}${showNames?`<span class="option-text">${esc(option)}</span>`:''}`}</button>${['sound','choice'].includes(q.type)?`<button class="option-sound" data-action="listen-option" data-index="${i}" ${game.solved?'disabled':''} aria-label="Ouvir ${esc(option)}">${icon('sound')}Ouvir</button>`:''}</div>`;
 }).join('')}</div>`;
}
function submitAnswer(answer){
 if(!game||game.intro||game.solved||game.completed)return;const q=game.questions[game.index];if(q.type==='memory'){if(answer!=='pairs'||(game.matched||[]).length!==q.cards.length)return;}else game.attempts++;
 if(answerIsCorrect(q,answer)){
  game.solved=true;game.lastWrong=null;game.feedback=q.type==='story'?'Isso! Você descobriu uma parte da história.':'Isso! Mais uma descoberta no caminho.';
  game.rounds.push({prompt:q.type==='story'?q.prompt:q.type==='read'?q.target:q.prompt,answer:Array.isArray(answer)?answer.join(' '):q.type==='memory'?'Todos os pares encontrados':q.type==='see'?optionLabel(q,answer):answer,attempts:game.attempts,helps:game.helps});
  if(audioEnabled())speak(q.type==='read'?`Isso! A palavra é ${q.target}.`:'Isso! Vamos para a próxima descoberta.');
 }else{game.lastWrong=Array.isArray(answer)?'build':answer;game.feedback=q.type==='build'?WRONG_FEEDBACK.build:WRONG_FEEDBACK.default;if(audioEnabled())speak(game.feedback);}
 render();
}
function nextQuestion(){
 if(!game||!game.solved||game.completed)return;stopSpeech();
 if(game.index===game.questions.length-1){finishActivity();return;}
 game.index++;game.solved=false;game.attempts=0;game.helps=0;game.build=[];game.buildIndices=[];game.flipped=[];game.matched=[];clearTimeout(memoryTimer);game.feedback='';game.lastWrong=null;render();requestAnimationFrame(()=>$('.game-card')?.focus({preventScroll:true}));if(audioEnabled())speakInitial();
}
let memoryTimer=null;
function flipCard(index){
 if(!game||game.completed||game.solved)return;const q=game.questions[game.index];if(q.type!=='memory'||!(index>=0&&index<q.cards.length))return;
 game.flipped=game.flipped||[];game.matched=game.matched||[];
 if(game.matched.includes(index)||game.flipped.includes(index)||game.flipped.length>=2)return;
 game.flipped.push(index);const key=q.cards[index].split('~')[0];
 if(game.flipped.length===2){
  game.attempts++;const [a,b]=game.flipped.map(i=>q.cards[i].split('~')[0]);
  if(a===b){game.matched.push(...game.flipped);game.flipped=[];
   if(game.matched.length===q.cards.length){submitAnswer('pairs');focusAfterAnswer(null);return;}
   game.feedback='Achou um par! Continue procurando.';game.lastWrong=null;
  }else{game.feedback='Não é par. Olhe de novo e tente outra carta.';game.lastWrong='memory';clearTimeout(memoryTimer);memoryTimer=setTimeout(()=>{if(game&&game.flipped?.length===2){game.flipped=[];render();focusSelector(`[data-action="flip"][data-index="${index}"]`);}},1600);}
 }else{game.feedback='';game.lastWrong=null;}
 if(audioEnabled()&&!game.solved)speak(key);
 render();focusSelector(`[data-action="flip"][data-index="${index}"]`);
}
function focusSelector(selector){if(!selector)return;try{requestAnimationFrame(()=>document.querySelector(selector)?.focus?.({preventScroll:true}));}catch{}}
// Após responder, o foco vai para Continuar (acerto) ou volta à opção tocada (nova tentativa).
function focusAfterAnswer(fallback){if(!game)return;focusSelector(game.solved?'[data-action="next"]':fallback);}
function finishActivity(){
 if(!game.preview){state=recordSession(state,{profileId:game.profileId,activityId:game.activity.id,rounds:game.rounds,seconds:game.seconds});save();game.savedSessionId=state.sessions.at(-1).id;}game.completed=true;lastCompletion={...game};render();window.scrollTo({top:0,behavior:'instant'});if(audioEnabled())speak('Aventura concluída! Agora, que tal brincar um pouco fora da tela?');
}
function completionGarden(c){
 const trail=dailyTrail(state,c.profileId||active().id),garden=gardenFor(state,c.profileId||active().id);
 return `<div class="completion-garden">${gardenSVG(garden,{compact:true})}<div><strong>Uma planta nova nasceu no jardim!</strong><span>${trail.complete?'Trilha de hoje completa: uma estrela brilhou no céu do jardim.':`Trilha de hoje: ${trail.done} de ${trail.steps.length} paradas.`}</span></div></div>`;
}
function completion(){
 const c=lastCompletion||game;
 if(c.preview)return `<section class="completion"><div class="completion-hero"><img src="assets/lumi.svg" alt="Lumi sorrindo">${icon('check')}</div><div class="eyebrow">TESTE DA PROFESSORA CONCLUÍDO</div><h1>Como ficou a sua atividade?</h1><p>Você experimentou <strong>${esc(c.activity.name)}</strong>. Este teste não entrou nos registros dos perfis.</p><div class="spacer"></div><button class="primary" data-action="preview-back">Voltar à preparação${icon('arrow')}</button></section>`;
 return `<section class="completion"><div class="completion-hero">${icon('star')}<img src="assets/lumi.svg" alt="Lumi sorrindo">${icon('sprout')}</div><div class="eyebrow">MAIS UMA DESCOBERTA NO CAMINHO</div><h1>Você e a Lumi foram longe!</h1><p>Você explorou <strong>${esc(c.activity.name)}</strong>. Cada tentativa fez parte da aventura.</p><div class="completion-summary"><div><strong>${c.rounds.length}</strong>desafios explorados</div><div><strong>${formatDuration(c.seconds)}</strong>tempo de brincadeira</div></div>${completionGarden(c)}${c.activity.category==='Histórias'&&recordingSupported()?`<div class="retell-callout"><div><strong>Conte para a Lumi!</strong><span>Grave a criança recontando a parte de que mais gostou. O áudio fica só neste aparelho.</span></div><button class="secondary" data-action="record-retell">${icon('mic')}Gravar o reconto</button></div>`:''}<div class="completion-actions"><button class="primary" data-action="nav" data-view="adventure">Voltar para Hoje${icon('arrow')}</button><button class="secondary" data-action="observe-session" data-session="${esc(c.savedSessionId)}">${icon('heart')}Responsável: contar como foi</button></div><div class="session-note" style="justify-content:center">${icon('check')}Esta experiência já aparece em Descobertas.</div></section>`;
}
function formatDuration(seconds){const n=Math.max(0,Math.round(seconds));return n<60?`${n}s`:`${Math.floor(n/60)}min${n%60?' '+n%60+'s':''}`;}
function formatDate(iso){const date=new Date(iso);return Number.isNaN(date.valueOf())?'Data indisponível':new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date);}
function openTeacherEditor(activity=null,template=null){
 requireAdult(()=>{
  closeModal();stopSpeech();game=null;view='editor';editorDirty=false;
  teacherDraft=activity?JSON.parse(JSON.stringify(activity)):template?newTeachingDraft(template,'teacher-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36))):null;
  render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});
 });
}
function captureTeacherDraft(){if(teacherDraft&&view==='editor')teacherDraft=readEditorDraft(document,teacherDraft);return teacherDraft;}
function saveTeacherDraft(publish=false){
 requireAdult(()=>{
  try{
   const raw=captureTeacherDraft();if(!raw)return;
   const candidate={...raw,published:publish||raw.published,updatedAt:new Date().toISOString()};
   state=saveTeachingActivity(state,candidate);save();teacherDraft=activityById(state,candidate.id,{includeDrafts:true});editorDirty=false;view='school';render();
   toast(storageAvailable?(candidate.published?'Atividade disponibilizada. Ela já pode ser escolhida na aventura.':'Rascunho salvo. Você pode editar e testar antes de disponibilizar.'):'Atividade disponível nesta sessão. Exporte o pacote para guardar uma cópia.');
  }catch(error){$('#editor-error').textContent=error.message;$('#editor-error').focus();}
 });
}
function previewTeacherActivity(id=null){
 requireAdult(()=>{
  try{
   const source=id?activityById(state,id,{includeDrafts:true}):validateTeachingActivity(captureTeacherDraft());
   if(!source)return;
   startActivity(source.id,{preview:true,activity:source,returnView:id?'school':'editor'});
  }catch(error){$('#editor-error').textContent=error.message;$('#editor-error').focus();}
 });
}
function leaveTeacherPreview(){
 if(!game?.preview)return;const destination=game.returnView;
 requireAdult(()=>{stopSpeech();closeModal();game=null;view=destination==='editor'?'editor':'school';render();$('#main').focus({preventScroll:true});});
}
function downloadText(filename,text,type='application/json;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function loadTeachingPack(file){
 if(!file)return;
 try{
  if(file.size>1024*1024)throw new Error('Use um pacote com até 1 MB.');
  const pack=parseTeachingPack(await file.text());pendingTeachingPack=pack;
  const replacing=pack.activities.filter(a=>state.customActivities.some(x=>x.id===a.id)).length;
  openModal('Importar atividades da professora',`<p class="modal-description">O pacote contém ${pack.activities.length} atividades. ${replacing?`${replacing} já existem neste aparelho e serão atualizadas.`:'As atividades serão adicionadas à prévia deste aparelho.'} Os perfis e registros existentes serão preservados.</p><ul class="import-preview">${pack.activities.map(a=>`<li>${esc(a.name)} · ${a.questions.length} desafios · ${a.published?'disponibilizada':'rascunho'}</li>`).join('')}</ul><div class="button-row"><button class="primary" data-action="confirm-teaching-import">Importar atividades${icon('check')}</button><button class="secondary" data-action="close-modal">Cancelar</button></div>`);
 }catch(error){toast(error.message);}
}
function openModal(title,body,context={}){
 stopSpeech();if(!overlayRoot.innerHTML)returnFocus=document.activeElement;modalContext=context;
 overlayRoot.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">${title}</h2><button class="modal-close" data-action="close-modal" aria-label="Fechar janela">${icon('close')}</button></div>${body}</section></div>`;
 requestAnimationFrame(()=>{const target=$('.modal [autofocus]')||$('.modal-close');target?.focus();});
}
function closeModal(){if(modalContext?.voice)stopVoiceSession();overlayRoot.innerHTML='';modalContext=null;if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;}
function showGate(callback){
 const a=7+Math.floor(Math.random()*6),b=4+Math.floor(Math.random()*6);
 openModal('Um instante para o adulto',`<div class="gate-visual"><img src="assets/lumi.svg" alt=""></div><p class="modal-description">Esta área é para quem acompanha a aventura. Peça a um adulto para continuar.</p><form id="gate-form"><div class="gate-question" aria-label="Quanto é ${a} mais ${b}?">${a} + ${b} = ?</div><div class="form-field"><label for="gate-answer">Resposta</label><input id="gate-answer" inputmode="numeric" type="text" pattern="[0-9]+" required autocomplete="off" autofocus></div><div id="form-error" class="form-error" role="alert"></div><button class="primary full" type="submit">Continuar${icon('arrow')}</button></form><p class="modal-footer-note">Este passo evita trocas acidentais de área. A demonstração não oferece autenticação de contas reais.</p>`,{gate:a+b,callback});
}
function requireAdult(callback){if(Date.now()>adultUntil)showGate(callback);else callback();}
function showProfiles(){
 openModal('Quem vai explorar?',`<p class="modal-description">Cada perfil tem suas preferências e seus registros.</p><div class="profile-list">${state.profiles.map(p=>`<button class="profile-option ${p.id===state.activeProfile?'active':''}" data-action="select-profile" data-profile="${esc(p.id)}">${avatar(p)}<span>${esc(p.name)}${p.age?` · ${p.age} anos`:''}</span>${p.id===state.activeProfile?icon('check'):icon('arrow')}</button>`).join('')}</div><button class="secondary full" data-action="new-family-profile">${icon('plus')}Adicionar perfil</button><p class="modal-footer-note">Os registros ficam separados neste navegador.</p>`);
}
function showFamilyProfileForm(profile=active()){
 requireAdult(()=>openModal(profile?'Ajustar o perfil':'Um novo explorador',familyProfileFormHTML(profile,icon),{familyProfileId:profile?.id||'profile-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36))}));
}
// ——— Reconto gravado (0.7) ———
let voiceSession=null,voiceUrls=[];
function stopVoiceSession(){if(voiceSession?.controller)voiceSession.controller.stop();if(voiceSession?.url)URL.revokeObjectURL(voiceSession.url);voiceSession=null;}
function showRetellRecorder(){
 const c=lastCompletion;if(!c||!recordingSupported())return;stopVoiceSession();
 voiceSession={profileId:c.profileId||active().id,activityId:c.activity.id,activityName:c.activity.name};
 openModal('Gravar o reconto',`<div class="retell-modal"><img src="assets/lumi.svg" alt=""><p class="modal-description">Peça para a criança contar a parte da história de que mais gostou. Vale contar do jeito dela, com poucas palavras ou mostrando com gestos.</p><p class="family-profile-note">A gravação fica só neste aparelho. Ninguém recebe o áudio, e você pode apagar quando quiser em Descobertas. Ela não entra na cópia dos registros.</p><div id="retell-stage">${retellIdleHTML()}</div></div>`,{voice:true});
 requestAnimationFrame(()=>{if(audioEnabled())speak(FAMILY_VOICE.retell);});
}
function retellIdleHTML(){return `<div class="button-row retell-actions"><button class="secondary" data-action="retell-prompt">${icon('sound')}Ouvir o pedido da Lumi</button><button class="record-button" data-action="start-recording">${icon('mic')}Começar a gravar</button></div>`;}
function setRetellStage(html){const node=$('#retell-stage');if(node)node.innerHTML=html;}
function startRetellRecording(){
 if(!voiceSession)return;stopSpeech();if(voiceSession.url){URL.revokeObjectURL(voiceSession.url);voiceSession.url=null;}
 setRetellStage(`<div class="recording-live" role="status"><span class="rec-dot" aria-hidden="true"></span><strong>Gravando…</strong><span id="rec-time">0 s de ${VOICE_LIMIT_SECONDS} s</span></div><button class="record-button is-stop" data-action="stop-recording">${icon('stop')}Parar</button>`);
 voiceSession.controller=startVoiceRecording({onTick:sec=>{const t=$('#rec-time');if(t)t.textContent=`${sec} s de ${VOICE_LIMIT_SECONDS} s`;},
  onDone:({blob,seconds})=>{if(!voiceSession)return;voiceSession.controller=null;voiceSession.blob=blob;voiceSession.seconds=seconds;voiceSession.url=URL.createObjectURL(blob);setRetellStage(`<audio controls src="${voiceSession.url}"></audio><div class="button-row retell-actions"><button class="primary" data-action="save-recording">${icon('check')}Guardar</button><button class="secondary" data-action="start-recording">${icon('repeat')}Gravar de novo</button><button class="quiet" data-action="close-modal">Descartar</button></div>`);$('[data-action="save-recording"]')?.focus();},
  onError:error=>{if(!voiceSession)return;voiceSession.controller=null;setRetellStage(`<p class="form-error" role="alert">${esc(error.message)}</p>${retellIdleHTML()}`);}});
}
function saveRetell(){
 const v=voiceSession;if(!v?.blob)return;
 saveVoiceClip({id:'voz-'+Date.now().toString(36),profileId:v.profileId,activityId:v.activityId,activityName:v.activityName,seconds:v.seconds,blob:v.blob}).then(()=>{closeModal();toast('Reconto guardado em Descobertas, só neste aparelho.');}).catch(()=>toast('Não foi possível guardar neste navegador. O armazenamento pode estar cheio ou bloqueado.'));
}
function hydrateVoices(){
 const panel=$('#voices-panel');if(!panel||!recordingSupported())return;
 for(const url of voiceUrls)URL.revokeObjectURL(url);voiceUrls=[];
 listVoiceClips(active().id).then(clips=>{
  const list=$('#voices-list');if(!list)return;
  list.innerHTML=clips.length?clips.map(c=>{const url=URL.createObjectURL(c.blob);voiceUrls.push(url);return `<li><div><strong>${esc(c.activityName||'Reconto')}</strong><small>${formatDate(c.createdAt)} · ${c.seconds} s</small></div><audio controls preload="none" src="${url}" aria-label="Reconto de ${esc(c.activityName||'história')}"></audio><button class="quiet" data-action="delete-voice" data-id="${esc(c.id)}" aria-label="Apagar reconto de ${esc(c.activityName||'história')}">${icon('trash')}Apagar</button></li>`;}).join(''):'<li class="text-muted">Ainda não há recontos gravados. Depois de uma história, toque em Gravar o reconto.</li>';
 }).catch(()=>{const list=$('#voices-list');if(list)list.innerHTML='<li class="text-muted">Este navegador não permite guardar áudios.</li>';});
}
function showOfflineActivity(id){
 const activity=OFFLINE_ACTIVITIES.find(a=>a.id===id);if(!activity)return;
 openModal(activity.name,`<div class="offline-detail"><div class="eyebrow">PARA BRINCAR COM UM ADULTO · FORA DA TELA</div><p>${esc(activity.description)}</p><h3>O que separar</h3><p>${esc(activity.materials)}</p><h3>Vamos experimentar?</h3><ol>${activity.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><p class="family-profile-note">Adapte o convite ao conforto da criança. Ela pode falar, apontar, usar seu recurso de comunicação ou participar com apoio.</p><div class="button-row"><button class="secondary" data-action="listen-offline" data-id="${activity.id}">${icon('sound')}Ouvir o convite</button><button class="primary" data-action="observe-offline" data-id="${activity.id}">Contar como foi${icon('arrow')}</button></div></div>`);
}
function showFamilyObservation({sessionId=null,offlineId=null}={}){
 const profileId=active().id;
 requireAdult(()=>{
  const session=state.sessions.find(s=>s.id===sessionId&&s.profileId===profileId),outside=OFFLINE_ACTIVITIES.find(a=>a.id===offlineId);
  if(!session&&!outside){toast('Escolha uma experiência deste perfil.');return;}
  const previous=session?(state.observations||[]).find(o=>o.sessionId===session.id):null;
  const activityId=session?.activityId||outside.id,name=session?.activityName||outside?.name||'Brincadeira';
  openModal('Como foi esse momento?',`<p class="modal-description"><strong>${esc(name)}</strong> · ${esc(active().name)}<br>Este é o seu relato sobre a participação, separado dos registros do jogo.</p><form id="family-observation-form"><div class="form-field"><label for="family-participation">O que você acompanhou?</label><select id="family-participation" required><option value="">Escolha...</option>${PARTICIPATION.map(([value,label])=>`<option value="${value}" ${previous?.participation===value?'selected':''}>${label}</option>`).join('')}</select></div><div class="form-field"><label for="family-observation-note">Algo para lembrar? <span class="text-muted">(opcional)</span></label><textarea id="family-observation-note" maxlength="400" rows="3" placeholder="Por exemplo: apontou para os animais e quis repetir a brincadeira.">${esc(previous?.note||'')}</textarea></div><div id="family-observation-error" class="form-error" role="alert"></div><button class="primary full" type="submit">Guardar este momento${icon('heart')}</button></form>`,{familyObservation:{id:previous?.id||'observation-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)),profileId,activityId,sessionId:session?.id||null,kind:session?'digital':'offline'}});
 });
}
async function loadFamilyBackup(file){
 if(!file)return;
 try{
  if(file.size>5*1024*1024)throw new Error('Escolha uma cópia com até 5 MB.');
  const restored=parseFamilyBackup(await file.text());pendingFamilyBackup=restored;
  openModal('Restaurar estes registros?',`<p class="modal-description">A cópia contém ${restored.profiles.length} perfis, ${restored.sessions.length} brincadeiras digitais e ${restored.observations.length} observações. Ao continuar, os registros deste navegador serão substituídos pelos da cópia.</p><p>Se quiser guardar os registros atuais, baixe uma cópia antes de continuar.</p><div class="button-row"><button class="secondary" data-action="backup-family">${icon('download')}Baixar registros atuais</button><button class="primary" data-action="confirm-family-restore">Restaurar esta cópia${icon('check')}</button></div>`);
 }catch(error){pendingFamilyBackup=null;toast(error.message);}
}
function printFamilySummary(){
 requireAdult(()=>{
  const text=familySummaryText(state,active().id),win=window.open('','_blank','width=800,height=900');if(!win){toast('Permita a janela de impressão e tente novamente.');return;}
  win.opener=null;win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Lumi — Descobertas em família</title><style>body{font:15px/1.7 Arial,sans-serif;color:#243f35;max-width:760px;margin:30px auto;padding:20px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}button{padding:14px;border:0;background:#247c63;color:white;border-radius:8px}@media print{button{display:none}@page{margin:18mm}}</style></head><body><pre>${esc(text)}</pre><button onclick="window.print()">Imprimir ou salvar em PDF</button></body></html>`);win.document.close();
 });
}
function showSettings(){
 openModal('Um jeito de brincar para você',`<p class="modal-description">Ajuste as preferências deste navegador. Os apoios específicos da criança ficam em Perfil.</p>${[['sound','Áudio e narração','Instruções faladas pela voz disponível no aparelho.'],['reducedMotion','Menos movimento','Reduz transições e animações da interface.'],['largeText','Texto maior','Aumenta textos e elementos das atividades.']].map(([key,label,desc])=>`<div class="settings-row"><div><label id="label-${key}">${label}</label><p>${desc}</p></div><button class="toggle ${state.settings[key]?'on':''}" role="switch" aria-checked="${state.settings[key]}" aria-labelledby="label-${key}" data-action="setting" data-setting="${key}"></button></div>`).join('')}<div class="settings-row"><div><label for="session-minutes">Lembrete de pausa</label><p>Uma pausa depois de alguns minutos de atividade.</p></div><select id="session-minutes" class="small-select">${[5,10,15].map(n=>`<option value="${n}" ${state.settings.sessionMinutes===n?'selected':''}>${n} min</option>`).join('')}</select></div><div class="spacer"></div><button class="secondary" style="width:100%;margin-bottom:12px" data-action="voice-preview">${icon('sound')}Ouvir a voz da Lumi</button><button class="primary full" data-action="close-modal">Pronto${icon('check')}</button><p class="modal-footer-note">A prévia usa o áudio da Lumi enviado do ElevenLabs. Nas atividades, falas com MP3 correspondente usam gravações; as demais continuam com a voz do aparelho.</p>`);
}
function showAssignment(){
 openModal('Sugerir uma descoberta',`<p class="modal-description">A atividade aparecerá na área da família do perfil escolhido, neste mesmo navegador.</p><form id="assignment-form"><div class="form-field"><label for="assignment-profile">Perfil de demonstração</label><select id="assignment-profile">${state.profiles.map(p=>`<option value="${esc(p.id)}" ${p.id===state.activeProfile?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="form-field"><label for="assignment-activity">Atividade</label><select id="assignment-activity">${availableActivities(state).map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div><button class="primary full" type="submit">Sugerir atividade${icon('arrow')}</button></form>`);
}
function showAddProfile(){
 if(state.profiles.length>=30){toast('A demonstração permite até 30 perfis.');return;}
 openModal('Adicionar perfil de teste',`<p class="modal-description">Use apenas um apelido fictício. Esta versão não foi preparada para cadastrar dados reais de crianças.</p><form id="profile-form"><div class="form-field"><label for="profile-name">Apelido fictício</label><input id="profile-name" maxlength="30" minlength="2" placeholder="Explorador ${state.profiles.length+1}" required autofocus></div><div class="form-field"><label for="profile-avatar">Companheiro</label><select id="profile-avatar"><option value="fox">Raposa</option><option value="cat">Gato</option><option value="frog">Sapo</option><option value="owl">Coruja</option></select></div><div id="form-error" class="form-error" role="alert"></div><button class="primary full" type="submit">Adicionar perfil${icon('plus')}</button></form>`);
}
function showHelp(){
 openModal('Olá, somos a Lumi.',`<div class="help-content"><p>Uma primeira versão para explorar letras, palavras e histórias com acompanhamento de um adulto.</p><ul><li><strong>Hoje e Brincar:</strong> sugestões por faixa etária, jogos e convites fora da tela.</li><li><strong>Descobertas:</strong> registros das brincadeiras e observações do responsável, sem notas ou comparações.</li><li><strong>Perfil:</strong> interesses, apoios de acesso e cópia dos registros.</li></ul><p>O progresso fica neste navegador. Não há contas reais, sincronização entre aparelhos nem cobrança. O conteúdo é uma demonstração e precisa de revisão pedagógica antes de um piloto com crianças.</p><div class="print-help">Depois de um primeiro acesso com internet, o aplicativo tenta disponibilizar as atividades sem conexão. A narração depende do aparelho.</div><div class="button-row"><button class="secondary" data-action="teacher-review">${icon('book')}Avaliar a prévia</button><button class="secondary" data-action="plans">Conhecer a proposta de planos${icon('arrow')}</button><button class="secondary" data-action="audio-roadmap">${icon('download')}Roteiro das falas</button></div></div>`);
}
const REVIEW_QUESTIONS=[
 'Para qual idade ou etapa escolar estas atividades parecem adequadas?',
 'As instruções estão claras? Alguma palavra, sílaba ou pronúncia precisa de ajuste?',
 'A quantidade de elementos e o ritmo da interface ajudam ou distraem?',
 'A sequência e a dificuldade dos jogos fazem sentido? O que deve mudar?',
 'A prévia da voz feminina combina com a proposta? Como está a clareza e o ritmo?',
 'Quais correções são necessárias antes de testar com crianças?'
];
function showReview(){
 openModal('Um olhar de professora',`<p class="modal-description">Esta prévia é para avaliação de um adulto. Teste os jogos e a voz, registre suas observações e baixe a avaliação para compartilhar com Gustavo.</p><form id="review-form">${REVIEW_QUESTIONS.map((question,i)=>`<div class="form-field"><label for="review-${i}">${i+1}. ${question}</label><textarea id="review-${i}" maxlength="2000" rows="3" placeholder="Sua observação..."></textarea></div>`).join('')}<button class="primary full" type="submit">${icon('download')}Baixar avaliação</button></form><p class="modal-footer-note">As observações são baixadas como arquivo de texto. Não são enviadas automaticamente. A voz do ElevenLabs está disponível na prévia; os jogos ainda usam a voz do aparelho quando não há um MP3 correspondente.</p>`);
}
function showPlans(){openModal('Uma proposta para crescer juntos',`<p class="modal-description">Proposta inicial para validar com famílias. Não há contratação nem cobrança nesta demonstração.</p><div class="price-grid"><section class="price-card"><h3>Para a família</h3><div class="price-number">R$ 29,90<span> / mês</span></div><p>Proposta: uma criança, atividades e acompanhamento do responsável.</p></section></div><div class="spacer"></div><button class="primary full" data-action="close-modal">Continuar explorando${icon('arrow')}</button>`);}
function exportCSV(profileId){
 const data=sessionsCSV(state,profileId||null),url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8;'}));
 const link=document.createElement('a');link.href=url;link.download='lumi-registros-demonstracao.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Registros de demonstração exportados em CSV.');
}
function printSheet(){
 requireAdult(()=>{
  const win=window.open('','_blank','width=800,height=900');if(!win){toast('Permita abrir a janela de impressão neste navegador e tente novamente.');return;}
  win.opener=null;const name=esc(active().name);
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Lumi — Uma descoberta no papel</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:15px Arial,sans-serif;color:#253f35;max-width:760px;margin:25px auto}h1{font-size:27px;margin-bottom:5px}p{line-height:1.6}.meta{border-bottom:2px solid #247c63;padding-bottom:18px;margin-bottom:25px}.exercise{margin:25px 0;page-break-inside:avoid}.row{display:flex;gap:35px;align-items:center;margin:20px 0}.word-picture{width:65px;height:65px}.letters{display:flex;gap:10px}.box{height:49px;width:49px;border:1px solid #829480;display:grid;place-items:center;font-size:23px}.drawing{height:160px;border:1px dashed #829480;border-radius:8px}.note{font-size:11px;color:#68756c;border-top:1px solid #cdd6c5;padding-top:14px;margin-top:23px}button{padding:12px 18px;background:#247c63;color:white;border:0;border-radius:8px;font-size:14px;margin-top:18px}@media print{button{display:none}body{margin:0}}</style></head><body><div class="meta"><h1>Lumi · Uma descoberta no papel</h1><p>Para brincar com um adulto · Perfil de teste: ${name}</p></div><div class="exercise"><h2>1. Encontre as letras da palavra BOLA.</h2><p>Leiam a palavra juntos. Depois, circulem as letras B, O, L e A.</p><div class="letters">${['M','B','A','S','O','P','L','T'].map(l=>`<span class="box">${l}</span>`).join('')}</div></div><div class="exercise"><h2>2. Monte as palavras.</h2><p>Recortem ou escrevam as sílabas e organizem juntos.</p><div class="row">${picture('BOLA')}<span class="box">BO</span><span class="box">LA</span><span>→ __________________</span></div><div class="row">${picture('GATO')}<span class="box">GA</span><span class="box">TO</span><span>→ __________________</span></div></div><div class="exercise"><h2>3. Uma palavra, um desenho.</h2><p>Escolha uma das palavras. Desenhe o que ela representa e converse sobre o desenho.</p><div class="drawing"></div><p>Minha palavra: _____________________________________</p></div><p class="note">Material de demonstração, sujeito a revisão pedagógica. Adapte a proposta ao ritmo e às necessidades da criança. A participação do adulto faz parte da atividade.</p><button onclick="window.print()">Imprimir ou salvar em PDF</button></body></html>`);win.document.close();closeModal();
 });
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');if(!button||button.disabled)return;const action=button.dataset.action;
 switch(action){
  case 'browse-stories':filter='Histórias';search='';navigate('library');break;
  case 'sound-demo':if(game?.intro)speak(SOUND_DEMO);break;
  case 'start-sound-round':if(game?.intro){game.intro=false;stopSpeech();render();if(audioEnabled())speakInitial();}break;
  case 'family-welcome':speak(FAMILY_VOICE.welcome);break;
  case 'edit-family-profile':showFamilyProfileForm();break;
  case 'new-family-profile':showFamilyProfileForm(null);break;
  case 'offline-activity':showOfflineActivity(button.dataset.id);break;
  case 'listen-offline':{const activity=OFFLINE_ACTIVITIES.find(a=>a.id===button.dataset.id);if(activity)speak(activity.narration);break;}
  case 'observe-offline':showFamilyObservation({offlineId:button.dataset.id});break;
  case 'observe-session':showFamilyObservation({sessionId:button.dataset.session});break;
  case 'export-family-summary':requireAdult(()=>downloadText('Lumi_Descobertas_7_Dias.txt',familySummaryText(state,active().id)));break;
  case 'print-family-summary':printFamilySummary();break;
  case 'backup-family':requireAdult(()=>downloadText('Lumi_Copia_Registros.json',familyBackupJSON(state)));break;
  case 'restore-family':requireAdult(()=>$('#family-backup-file').click());break;
  case 'confirm-family-restore':requireAdult(()=>{if(!pendingFamilyBackup)return;stopSpeech();state=pendingFamilyBackup;pendingFamilyBackup=null;game=null;view='profile';save();closeModal();render();toast('Cópia restaurada neste navegador.');});break;
  case 'voice-preview':if(previewPlaying)stopSpeech();else narrator.playFile(VOICE_PREVIEW);break;
  case 'audio-roadmap':requireAdult(()=>{closeModal();const link=document.createElement('a');link.href='assets/audio/roteiro-narracao.txt';link.download='Lumi_Roteiro_Narracao.txt';document.body.append(link);link.click();link.remove();});break;
  case 'teacher-review':requireAdult(showReview);break;
  case 'create-activity':openTeacherEditor(null,button.dataset.template||null);break;
  case 'choose-template':if(TEMPLATES.some(t=>t.id===button.dataset.template))openTeacherEditor(null,button.dataset.template);break;
  case 'edit-activity':openTeacherEditor(activityById(state,button.dataset.id,{includeDrafts:true}));break;
  case 'add-question':if(teacherDraft&&teacherDraft.questions.length<12){captureTeacherDraft();teacherDraft.questions.push(blankQuestion(teacherDraft.template));editorDirty=true;render();requestAnimationFrame(()=>$('#question-'+(teacherDraft.questions.length-1)+'-prompt')?.focus());}break;
  case 'remove-question':if(teacherDraft){if(teacherDraft.questions.length===1){toast('Mantenha pelo menos um desafio.');break;}captureTeacherDraft();teacherDraft.questions.splice(Number(button.dataset.index),1);editorDirty=true;render();}break;
  case 'save-teacher':saveTeacherDraft(false);break;
  case 'test-editor':previewTeacherActivity();break;
  case 'preview-teacher':previewTeacherActivity(button.dataset.id);break;
  case 'preview-back':leaveTeacherPreview();break;
  case 'editor-back':navigate('school');break;
  case 'export-activities':requireAdult(()=>{downloadText('Lumi_Atividades_Professora.json',exportTeachingPack(state));toast('Pacote exportado. Importe-o na Lumi do outro aparelho.');});break;
  case 'import-activities':requireAdult(()=>$('#teacher-pack-file').click());break;
  case 'confirm-teaching-import':{const pack=pendingTeachingPack;if(pack)requireAdult(()=>{try{state=importTeachingPack(state,pack);save();pendingTeachingPack=null;closeModal();view='school';render();toast('Atividades importadas. Confira a seleção disponível para brincar.');}catch(error){toast(error.message);}});break;}
  case 'nav':navigate(button.dataset.view);break;
  case 'play':startActivity(button.dataset.id);break;
  case 'mute':if(view==='editor')captureTeacherDraft();if(active().supports?.quietMode){toast('Este perfil está configurado para brincar sem som. Um adulto pode ajustar essa preferência em Perfil.');break;}state.settings.sound=!state.settings.sound;save();stopSpeech();render();toast(audioEnabled()?'Áudio ligado.':'Áudio desligado.');break;
  case 'settings':showSettings();break;
  case 'profiles':requireAdult(showProfiles);break;
  case 'select-profile':requireAdult(()=>{if(view==='editor')captureTeacherDraft();if(state.profiles.some(p=>p.id===button.dataset.profile)){stopSpeech();state.activeProfile=button.dataset.profile;save();closeModal();render();}});break;
  case 'filter':filter=button.dataset.filter;render();break;
  case 'answer':if(game&&!game.completed){const q=game.questions[game.index],index=Number(button.dataset.index);submitAnswer(q.options[index]);focusAfterAnswer(`[data-action="answer"][data-index="${index}"]`);}break;
  case 'syllable':if(game&&!game.solved&&!game.completed){const q=game.questions[game.index],index=Number(button.dataset.index),value=q.options[index];if(value&&game.build.length<q.slots&&!game.buildIndices.includes(index)){game.build.push(value);game.buildIndices.push(index);game.lastWrong=null;game.feedback='';if(game.build.length===q.slots){submitAnswer([...game.build]);focusAfterAnswer('[data-action="undo"]');}else render();}}break;
  case 'listen-syllable':if(game&&!game.solved&&!game.completed){const value=game.questions[game.index].options[Number(button.dataset.index)];if(value)speak(value.toLocaleLowerCase('pt-BR'));}break;
  case 'remove-piece':if(game&&!game.solved){const index=Number(button.dataset.index);game.build.splice(index,1);game.buildIndices.splice(index,1);game.feedback='';game.lastWrong=null;render();}break;
  case 'undo':if(game&&!game.solved){game.build.pop();game.buildIndices.pop();game.feedback='';game.lastWrong=null;render();}break;
  case 'check-build':if(game&&game.build.length===game.questions[game.index].slots)submitAnswer([...game.build]);break;
  case 'next':nextQuestion();break;
  case 'listen':if(game&&!game.completed){const q=game.questions[game.index];const text=q.type==='story'?q.text+' '+q.prompt:q.type==='read'?`A palavra é ${q.target}.`:q.prompt;if(speak(text))game.helps++;}break;
  case 'listen-option':if(game&&!game.completed){const q=game.questions[game.index],option=q.options[Number(button.dataset.index)];if(option!==undefined&&speak(q.say?.[option]??option))game.helps++;}break;
  case 'flip':flipCard(Number(button.dataset.index));break;
  case 'close-modal':closeModal();break;
  case 'record-retell':requireAdult(showRetellRecorder);break;
  case 'retell-prompt':speak(FAMILY_VOICE.retell);break;
  case 'start-recording':startRetellRecording();break;
  case 'stop-recording':voiceSession?.controller?.stop();break;
  case 'save-recording':saveRetell();break;
  case 'delete-voice':requireAdult(()=>{deleteVoiceClip(button.dataset.id).then(()=>{toast('Reconto apagado deste aparelho.');hydrateVoices();}).catch(()=>toast('Não foi possível apagar agora.'));});break;
  case 'share-summary':requireAdult(shareFamilySummary);break;
  case 'confirm-navigation':{const cb=pendingNavigation;pendingNavigation=null;closeModal();cb?.();break;}
  case 'setting':{const key=button.dataset.setting;if(!['sound','reducedMotion','largeText'].includes(key))break;state.settings[key]=!state.settings[key];save();settingsClass();button.classList.toggle('on',state.settings[key]);button.setAttribute('aria-checked',String(state.settings[key]));if(key==='sound'){stopSpeech();const mute=$('[data-action="mute"]');if(mute){mute.innerHTML=icon(state.settings.sound?'sound':'muted');mute.setAttribute('aria-label',state.settings.sound?'Desligar áudio':'Ligar áudio');}}break;}
  case 'assign':requireAdult(showAssignment);break;
  case 'add-profile':requireAdult(()=>showFamilyProfileForm(null));break;
  case 'view-profile':if(state.profiles.some(p=>p.id===button.dataset.profile)){state.activeProfile=button.dataset.profile;save();navigate('family');}break;
  case 'export':requireAdult(()=>exportCSV(button.dataset.profile));break;
  case 'print':printSheet();break;
  case 'help':showHelp();break;
  case 'plans':showPlans();break;
  case 'pause-done':if(game)game.sinceBreak=0;closeModal();break;
  default:break;
 }
});
document.addEventListener('submit',event=>{
 if(!['gate-form','assignment-form','profile-form','review-form','availability-form','teacher-editor-form','family-profile-form','family-observation-form'].includes(event.target.id))return;event.preventDefault();
 if(event.target.id==='family-profile-form'){
  const id=modalContext?.familyProfileId,name=$('#family-name').value,age=$('#family-age').value,avatar=$('#family-avatar').value,school=$('#family-school').value;
  const interests=[...document.querySelectorAll('input[name="family-interest"]:checked')].map(n=>n.value),selected=[...document.querySelectorAll('input[name="family-support"]:checked')].map(n=>n.value),supports=Object.fromEntries(FAMILY_SUPPORTS.map(([key])=>[key,selected.includes(key)]));
  requireAdult(()=>{try{state=updateFamilyProfile(state,{id,name,age,avatar,attendsSchool:school==='yes'?true:school==='no'?false:null,interests,supports});save();stopSpeech();closeModal();render();toast('Perfil salvo. As sugestões e os apoios já foram ajustados.');}catch(error){const target=$('#family-form-error');if(target)target.textContent=error.message;else toast(error.message);}});return;
 }
 if(event.target.id==='family-observation-form'){
  const details=modalContext?.familyObservation,participation=$('#family-participation').value,note=$('#family-observation-note').value;
  requireAdult(()=>{try{if(!details)throw new Error('Abra novamente a experiência para registrar.');state=recordFamilyObservation(state,{...details,participation,note});save();closeModal();render();toast('Seu relato foi guardado nas Descobertas deste perfil.');}catch(error){const target=$('#family-observation-error');if(target)target.textContent=error.message;else toast(error.message);}});return;
 }
 if(event.target.id==='teacher-editor-form'){saveTeacherDraft(true);return;}
 if(event.target.id==='availability-form'){
  const ids=[...document.querySelectorAll('#availability-form input:checked')].map(input=>input.value);
  requireAdult(()=>{try{state=setAvailableActivities(state,ids);save();render();toast('Seleção salva. As sugestões e a área Brincar já foram atualizadas.');}catch(error){$('#availability-error').textContent=error.message;}});return;
 }
 if(event.target.id==='review-form'){
  const sections=REVIEW_QUESTIONS.map((question,i)=>`${i+1}. ${question}\n${$('#review-'+i).value.trim()||'(Sem observação)'}`);
  const text='LUMI — AVALIAÇÃO DA PRÉVIA\nData: '+new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date())+'\n\n'+sections.join('\n\n')+'\n';
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='Lumi_Avaliacao_Professora.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Avaliação baixada. Você pode compartilhar o arquivo com Gustavo.');return;
 }
 if(event.target.id==='gate-form'){
  if(Number($('#gate-answer').value.trim())!==modalContext?.gate){$('#form-error').textContent='Confira a conta com um adulto e tente novamente.';$('#gate-answer').focus();return;}
  adultUntil=Date.now()+5*60*1000;const cb=modalContext.callback;closeModal();cb();
 }else if(event.target.id==='assignment-form'){
  const id=$('#assignment-profile').value,activityId=$('#assignment-activity').value;const before=state;state=addAssignment(state,id,activityId);save();closeModal();render();toast(state===before?'Essa atividade já está pendente para o perfil.':'Atividade sugerida. Ela já aparece na área da família.');
 }else{
  const name=$('#profile-name').value.trim();if(name.length<2||name.length>30){$('#form-error').textContent='Use um apelido fictício entre 2 e 30 caracteres.';return;}
  if(state.profiles.some(p=>p.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){$('#form-error').textContent='Já existe um perfil com esse apelido. Escolha outro.';return;}
  const id='profile-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)),avatar=$('#profile-avatar').value;state={...state,profiles:[...state.profiles,{id,name,avatar}]};save();closeModal();render();toast('Perfil de demonstração adicionado.');
 }
});
document.addEventListener('change',event=>{
 if(event.target.id==='teacher-pack-file'){const file=event.target.files?.[0];event.target.value='';requireAdult(()=>loadTeachingPack(file));}
 if(event.target.id==='family-backup-file'){const file=event.target.files?.[0];event.target.value='';requireAdult(()=>loadFamilyBackup(file));}
 if(view==='editor'&&event.target.closest?.('#teacher-editor-form'))editorDirty=true;
 if(event.target.id==='adult-profile'&&state.profiles.some(p=>p.id===event.target.value)){state.activeProfile=event.target.value;save();render();}
 if(event.target.id==='session-minutes'){state.settings.sessionMinutes=Number(event.target.value);save();}
});
document.addEventListener('input',event=>{
 if(view==='editor'&&event.target.closest?.('#teacher-editor-form')){editorDirty=true;return;}
 if(event.target.id!=='activity-search')return;search=event.target.value;const selected=availableActivities(state).filter(a=>(filter==='Todas'||a.category===filter)&&`${a.name} ${a.description} ${a.skill}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));$('#library-results').innerHTML=libraryResults(selected);
});
document.addEventListener('keydown',event=>{
 const modal=$('.modal');if(!modal)return;
 if(event.key==='Escape'){event.preventDefault();closeModal();return;}
 if(event.key==='Tab'){
  const items=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]')];if(!items.length)return;
  const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
setInterval(()=>{
 if(view!=='play'||!game||game.completed||document.hidden||overlayRoot.innerHTML)return;
 game.seconds++;game.sinceBreak++;
 if(game.sinceBreak>=state.settings.sessionMinutes*60)openModal('Hora de uma pequena pausa',`<div class="gate-visual"><img src="assets/lumi.svg" alt=""></div><p class="modal-description">Olhe ao redor, movimente o corpo e converse com um adulto. A aventura pode esperar um pouquinho.</p><button class="primary full" data-action="pause-done">Já fiz uma pausa${icon('leaf')}</button><div class="spacer"></div><button class="secondary" style="width:100%" data-action="nav" data-view="adventure">Voltar à aventura</button>`);
},1000);
window.addEventListener('pagehide',stopSpeech);
window.addEventListener('offline',()=>toast('Você está sem conexão. As atividades já carregadas continuam disponíveis.'));
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
