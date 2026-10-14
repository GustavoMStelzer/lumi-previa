import {ACTIVITIES,makeQuestions,answerIsCorrect} from './content.js';
import {STORAGE_KEY,createState,restoreState,recordSession,profileStats,nextActivity,addAssignment,sessionsCSV} from './model.js';
import {Narrator} from './narration.js';
import {RECORDED_NARRATION} from './audio-manifest.js';

const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const root=$('#app'),overlayRoot=$('#overlay-root');
let state=createState(),storageAvailable=true;
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=restoreState(JSON.parse(raw));}catch{storageAvailable=false;}
let view='adventure',filter='Todas',search='',game=null,lastCompletion=null,adultUntil=0,modalContext=null,returnFocus=null,toastTimer=null,pendingNavigation=null,previewPlaying=false;
const VOICE_PREVIEW='assets/audio/lumi-voz-preview.mp3';
const narrator=new Narrator({clips:RECORDED_NARRATION,makeAudio:source=>new Audio(source),isEnabled:()=>state.settings.sound,speakFallback:speakNative,stopFallback:()=>{if('speechSynthesis' in window)speechSynthesis.cancel();},onError:toast,onState:({playing,source})=>{previewPlaying=playing&&source===VOICE_PREVIEW;for(const button of document.querySelectorAll('[data-action="voice-preview"]')){button.innerHTML=icon(previewPlaying?'close':'sound')+(previewPlaying?'Parar a prévia':'Ouvir a voz da Lumi');button.setAttribute('aria-pressed',String(previewPlaying));}}});
const navigation=[['adventure','compass','Minha aventura'],['library','grid','Atividades'],['family','heart','Família'],['school','school','Escola']];
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
 hand:'<path d="M8 12V5a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-6a2 2 0 0 1 4 0v9c0 4-3 7-7 7h-1c-3 0-5-2-7-5l-3-4a2 2 0 0 1 3-3l3 2Z"/>'
};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.star}</svg>`;}
function picture(word){
 const pictures={
  BOLA:'<circle cx="50" cy="50" r="36" fill="#F0C55E"/><path d="M20 29q23 18 51 3M26 77q25-22 55-15M50 14q-22 36 4 71" stroke="#FCF5D6" stroke-width="10"/><path d="M22 28q25 17 49 5M28 77q25-22 50-15M50 14q-20 33 3 70" stroke="#80A1AF" stroke-width="5"/>',
  GATO:'<path d="M22 37 18 10 42 26m36 11 5-27-24 16" fill="#D9A979" stroke="#735B44" stroke-width="3"/><ellipse cx="50" cy="51" rx="34" ry="29" fill="#E6BA8D"/><ellipse cx="37" cy="46" rx="3" ry="5" fill="#594B3D"/><ellipse cx="63" cy="46" rx="3" ry="5" fill="#594B3D"/><path d="m46 57 4 4 4-4M50 61v7m-8-2q8 8 16 0M28 61 9 57m19 11L8 72m64-11 19-4m-19 11 20 4" stroke="#735B44" stroke-width="2.5" stroke-linecap="round"/>',
  PATO:'<ellipse cx="48" cy="64" rx="32" ry="20" fill="#F2CE6F"/><circle cx="64" cy="37" r="21" fill="#F5D986"/><path d="m80 37 17 6-17 6" fill="#E39B5F"/><circle cx="70" cy="31" r="3" fill="#5D5740"/><path d="M34 56q-13 17 15 18M24 71 12 56" stroke="#CEAB57" stroke-width="3" stroke-linecap="round"/>',
  MALA:'<rect x="15" y="29" width="70" height="52" rx="9" fill="#BC8F66" stroke="#735B44" stroke-width="3"/><path d="M36 29v-7q14-11 28 0v7M31 31v48m38-48v48" stroke="#735B44" stroke-width="5"/><rect x="44" y="50" width="12" height="10" rx="2" fill="#F9DC89"/>',
  SAPO:'<ellipse cx="50" cy="56" rx="36" ry="26" fill="#80AC80"/><circle cx="29" cy="30" r="16" fill="#80AC80"/><circle cx="71" cy="30" r="16" fill="#80AC80"/><circle cx="30" cy="29" r="10" fill="#FFFCE9"/><circle cx="70" cy="29" r="10" fill="#FFFCE9"/><circle cx="31" cy="28" r="4" fill="#3D5D47"/><circle cx="69" cy="28" r="4" fill="#3D5D47"/><path d="M33 57q17 20 34 0" stroke="#3D5D47" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="24" cy="56" rx="7" ry="4" fill="#DBAF95"/><ellipse cx="76" cy="56" rx="7" ry="4" fill="#DBAF95"/>',
  MACACO:'<circle cx="17" cy="46" r="14" fill="#97704D"/><circle cx="83" cy="46" r="14" fill="#97704D"/><circle cx="50" cy="47" r="34" fill="#97704D"/><ellipse cx="38" cy="43" rx="17" ry="19" fill="#EED3AC"/><ellipse cx="62" cy="43" rx="17" ry="19" fill="#EED3AC"/><ellipse cx="50" cy="64" rx="22" ry="16" fill="#EED3AC"/><circle cx="37" cy="41" r="4" fill="#574737"/><circle cx="63" cy="41" r="4" fill="#574737"/><path d="M41 65q9 10 18 0M45 55h10" stroke="#574737" stroke-width="3" stroke-linecap="round"/>',
  BOTA:'<path d="M31 14h39v46l17 9q12 17-9 17H22q-8-11 0-22l9-7Z" fill="#BC8F66" stroke="#735B44" stroke-width="3"/><path d="M30 30h40M20 79h66" stroke="#EFD4AC" stroke-width="7"/><path d="M34 50h12" stroke="#735B44" stroke-width="3"/>',
  PANELA:'<path d="M21 41h58v29q-29 28-58 0Z" fill="#9AB0B6" stroke="#536F78" stroke-width="3"/><path d="M22 48H7v13h15m57-13h14v13H79M15 38h70M46 25h9v12" stroke="#536F78" stroke-width="5" stroke-linecap="round"/><path d="M29 50v18" stroke="#E4F0EB" stroke-width="4" stroke-linecap="round"/>',
  SACOLA:'<path d="M22 35h56l8 51H14Z" fill="#D2B576" stroke="#8B754E" stroke-width="3"/><path d="M36 40V24q14-16 28 0v16" stroke="#8B754E" stroke-width="5" fill="none"/><path d="M42 57q8-10 16 0-2 16-8 16-6 0-8-16" fill="#719970"/>',
  SEMENTE:'<ellipse cx="50" cy="55" rx="18" ry="28" fill="#B98257" transform="rotate(30 50 55)"/><path d="M38 75q11-22 22-43" stroke="#DBB07E" stroke-width="3"/><path d="M54 32q-6-23 17-21 5 19-17 21" fill="#85A96E"/>',
  'ÁGUA':'<path d="M50 10 23 52c-15 29 12 46 27 46s42-17 27-46Z" fill="#8EBDC9"/><path d="M32 61q-6 18 10 23" stroke="#E2F3EC" stroke-width="5" stroke-linecap="round"/>',
  LEITE:'<path d="m30 13 31 0 11 16v61H24V29Z" fill="#E2EDEB" stroke="#6B8589" stroke-width="3"/><path d="M24 29h48M31 13v16m-7 22h48v24H24" stroke="#8BB5C0" stroke-width="3"/><path d="M51 51q-13 14-2 20 12 0 2-20" fill="#8BB5C0"/>',
  SUCO:'<path d="m21 26 10 64h38l10-64Z" fill="#EBBA65" stroke="#B78A4C" stroke-width="3"/><path d="m58 42 7-30h18" stroke="#7CA37B" stroke-width="5" fill="none"/><path d="M26 52h48" stroke="#F8DC92" stroke-width="6"/><circle cx="37" cy="68" r="6" fill="#F3D18A"/>',
  PLANTA:'<path d="M50 65V22" stroke="#639465" stroke-width="5"/><path d="M50 44q-30 7-29-22 24-4 29 22M50 34q29 3 28-22-24-4-28 22" fill="#83AB78"/><path d="m23 65 8 29h38l8-29Z" fill="#C8956B"/><path d="M21 65h58" stroke="#A67350" stroke-width="7" stroke-linecap="round"/>'
 };
 return `<svg class="word-picture" viewBox="0 0 100 100" aria-hidden="true">${pictures[word]||pictures.PLANTA}</svg>`;
}
function avatar(profile){return `<span class="avatar">${profile.avatar==='fox'?'<img src="assets/lumi.svg" alt="">':({cat:'🐱',frog:'🐸',owl:'🦉'}[profile.avatar]||'🦊')}</span>`;}
function active(){return state.profiles.find(p=>p.id===state.activeProfile)||state.profiles[0];}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;toast('Não foi possível salvar neste navegador. O progresso ficará disponível enquanto esta página estiver aberta.');}}
function toast(message){clearTimeout(toastTimer);const node=$('#toast');node.textContent=message;node.classList.add('show');toastTimer=setTimeout(()=>node.classList.remove('show'),5500);}
function speakNative(text){
 if(!state.settings.sound){toast('O áudio está desligado. Ative o som no botão do alto da página.');return false;}
 if(!('speechSynthesis' in window)){toast('A narração não está disponível neste aparelho. Um adulto pode ler as instruções.');return false;}
 try{speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='pt-BR';utterance.rate=.8;utterance.pitch=1.05;const voices=speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.toLowerCase()==='pt-br')||voices.find(v=>v.lang.toLowerCase().startsWith('pt'));if(voice)utterance.voice=voice;utterance.onerror=e=>{if(!['canceled','interrupted'].includes(e.error))toast('O aparelho não conseguiu narrar. Um adulto pode ler com você.');};speechSynthesis.speak(utterance);return true;}catch{toast('A narração não está disponível agora. Um adulto pode ler com você.');return false;}
}
function speak(text){return narrator.speak(text);}
function stopSpeech(){narrator.stop();}
function settingsClass(){document.body.classList.toggle('reduced-motion',state.settings.reducedMotion);document.body.classList.toggle('large-text',state.settings.largeText);}
function adultBanner(){return `<div class="adult-banner">${icon('info')}<div><strong>Ambiente de demonstração.</strong> Use apelidos fictícios. ${storageAvailable?'Os registros ficam somente neste navegador; a troca entre escola e casa é simulada.':'Este navegador não permite salvar os registros.'} O conteúdo pedagógico ainda precisa de revisão profissional antes do uso com crianças.</div></div>`;}
function layout(content){
 const p=active();
 return `<div class="shell"><aside class="sidebar"><button class="brand" data-action="nav" data-view="adventure" aria-label="Lumi, voltar à aventura"><img src="assets/lumi.svg" alt=""><div><div class="brand-name">lum<span>i</span><span style="color:#d9aa50">.</span></div><div class="brand-sub">Aventuras de leitura</div></div></button><div class="nav-label">UM MUNDO PARA DESCOBRIR</div><nav class="nav" aria-label="Navegação principal">${navigation.map(([id,i,label],n)=>`${n===2?'<div class="nav-separator"></div>':''}<button class="nav-item ${view===id?'active':''}" data-action="nav" data-view="${id}" ${view===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span></button>`).join('')}</nav><div class="sidebar-note"><img src="assets/lumi.svg" alt=""><strong>Cada descoberta conta.</strong><p>Aprender fica mais gostoso quando a gente brinca junto.</p></div><div class="sidebar-footer"><span>Versão inicial</span><button class="text-button" data-action="help">Sobre a Lumi</button></div></aside><main class="main" id="main" tabindex="-1"><header class="topbar"><div class="topbar-left"><span class="small-dot"></span><span>${['family','school'].includes(view)?'Espaço do adulto · demonstração':'Pequenas descobertas, todos os dias'}</span></div><div class="topbar-actions"><button class="icon-button" data-action="mute" aria-label="${state.settings.sound?'Desligar':'Ligar'} áudio" title="${state.settings.sound?'Áudio ligado':'Áudio desligado'}">${icon(state.settings.sound?'sound':'muted')}</button><button class="icon-button" data-action="settings" aria-label="Preferências de acessibilidade" title="Preferências">${icon('settings')}</button>${view==='play'?'':`<button class="profile-button" data-action="profiles" aria-label="Trocar perfil de demonstração">${avatar(p)}<span class="profile-name">${esc(p.name)}</span>${icon('chevron')}</button>`}</div></header><div class="page-content">${content}</div></main></div>`;
}
function activityCard(a,large=false){
 const completed=profileStats(state,state.activeProfile).completed.has(a.id);
 return `<button class="activity-card" data-action="play" data-id="${a.id}" aria-label="Jogar ${esc(a.name)}${completed?', já explorada':''}"><div class="activity-art ${a.color}">${icon(a.icon)}${completed?`<span class="completed-badge" title="Atividade explorada">${icon('check')}</span>`:''}</div><div class="activity-copy">${large?`<div class="eyebrow" style="font-size:9px;letter-spacing:1px;margin-bottom:8px">${a.tag}</div>`:''}<h3>${a.name}</h3><p>${a.description}</p><div class="activity-meta">${icon('clock')}<span>${a.duration}</span><span class="go">${icon('arrow')}</span></div></div></button>`;
}
function adventure(){
 const stats=profileStats(state,state.activeProfile),next=nextActivity(state,state.activeProfile);
 return `<div class="page-heading"><div><div class="eyebrow">OLÁ, EXPLORADOR!</div><h1>Vamos descobrir palavras?</h1><p>Escolha uma aventura. A Lumi vai com você.</p></div><div class="heading-sticker">${icon('star')}Uma descoberta de cada vez</div></div><section class="hero" aria-label="A aventura da Lumi"><div class="hero-copy"><span class="pill">${icon('leaf')}A floresta das descobertas</span><h2>Uma pequena aventura.<br>Uma grande descoberta.</h2><p>Há letras, palavras e histórias pelo caminho. Vamos explorar juntos?</p><button class="primary" data-action="play" data-id="${next.id}">${icon('compass')}${stats.total?'Continuar aventura':'Vamos brincar!'}${icon('arrow')}</button><button class="voice-preview" data-action="voice-preview" aria-pressed="${previewPlaying}">${icon(previewPlaying?'close':'sound')}${previewPlaying?'Parar a prévia':'Ouvir a voz da Lumi'}</button></div><div class="hero-art"><img src="assets/forest.svg" alt="Lumi, uma raposa de cachecol verde, lendo um livro na floresta"><span class="hero-label">Um mundo de palavras espera por você</span></div></section><div class="section-heading"><div><h2>Sua trilha de descobertas</h2><p>Comece pelas letras ou escolha o que quer explorar.</p></div><button class="quiet" data-action="nav" data-view="library">Ver atividades${icon('arrow')}</button></div><div class="adventure-layout"><section class="journey" aria-label="Atividades da trilha"><div class="journey-top"><h3>Uma aventura em seis paradas</h3><span>${stats.completed.size} de 6 exploradas</span></div><div class="journey-path" aria-hidden="true">${ACTIVITIES.map(a=>`<span class="journey-dot ${stats.completed.has(a.id)?'done':a.id===next.id?'current':''}"></span>`).join('')}</div><div class="activity-grid">${ACTIVITIES.map(a=>activityCard(a)).join('')}</div></section><aside class="side-stack"><section class="story-card"><div class="eyebrow">HISTÓRIA DA LUMI</div><h3>Uma sementinha.<br>Muitas descobertas.</h3><p>Leia, ouça e converse com alguém que você gosta.</p><div class="story-preview" aria-hidden="true"><img src="assets/lumi.svg" alt="">${picture('PLANTA')}</div><button class="secondary" data-action="play" data-id="story">${icon('book')}Abrir a história${icon('arrow')}</button></section><section class="offline-card"><div class="icon-circle">${icon('hand')}</div><h3>A aventura continua fora da tela</h3><p>Um papel, algumas letras e alguém para brincar junto.</p><button class="quiet" data-action="print">Atividade para imprimir${icon('arrow')}</button></section></aside></div><div class="session-note">${icon('heart')}Brinque acompanhado de um adulto. Depois, faça uma pausa e leve suas descobertas para fora da tela.</div>`;
}
function library(){
 const selected=ACTIVITIES.filter(a=>(filter==='Todas'||a.category===filter)&&`${a.name} ${a.description} ${a.skill}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
 return `<div class="page-heading"><div><div class="eyebrow">ESCOLHA SUA PRÓXIMA DESCOBERTA</div><h1>Pequenas atividades.<br>Grandes aventuras.</h1><p>Letras, palavras e uma história para explorar no seu ritmo.</p></div></div><div class="library-controls"><div class="tabs" role="group" aria-label="Filtrar atividades">${['Todas','Letras','Palavras','Histórias'].map(f=>`<button class="tab ${filter===f?'active':''}" aria-pressed="${filter===f}" data-action="filter" data-filter="${f}">${f}</button>`).join('')}</div><label class="search-input">${icon('search')}<input id="activity-search" type="search" placeholder="Buscar uma atividade" aria-label="Buscar uma atividade" value="${esc(search)}"></label></div><div class="library-grid" id="library-results">${selected.length?selected.map(a=>activityCard(a,true)).join(''):'<div class="empty-state" style="grid-column:1/-1"><h3>Nenhuma atividade encontrada</h3><p>Tente buscar por letras, palavras ou história.</p></div>'}</div><div class="session-note">${icon('info')}Os tempos indicados são estimativas. Não há corrida: cada descoberta acontece no seu ritmo.</div>`;
}
function statCard(label,value,caption,i){return `<section class="stat-card"><div class="stat-top"><span>${label}</span>${icon(i)}</div><div class="stat-value">${value}</div><div class="stat-caption">${caption}</div></section>`;}
function historyHTML(profileId){
 const sessions=profileStats(state,profileId).sessions.slice(-8).reverse();
 if(!sessions.length)return `<div class="empty-state">${icon('book')}<h3>A primeira descoberta começa aqui</h3><p>Depois de concluir uma atividade, seus registros aparecerão neste espaço.</p><button class="primary" data-action="play" data-id="letters">Explorar as letras${icon('arrow')}</button></div>`;
 return `<div class="history-list">${sessions.map(s=>{const a=ACTIVITIES.find(a=>a.id===s.activityId);return `<div class="history-row"><div class="history-icon ${a.color}">${icon(a.icon)}</div><div class="history-info"><strong>${a.name}</strong><span>${formatDate(s.createdAt)} · ${formatDuration(s.seconds)} · ${s.rounds.length} desafios</span></div><span class="badge">Explorada</span></div>`;}).join('')}</div>`;
}
function profileSelect(){return `<select class="small-select" id="adult-profile" aria-label="Selecionar perfil de demonstração">${state.profiles.map(p=>`<option value="${esc(p.id)}" ${p.id===state.activeProfile?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;}
function family(){
 const p=active(),stats=profileStats(state,p.id),next=nextActivity(state,p.id),pending=state.assignments.filter(a=>a.profileId===p.id&&a.status==='pending');
 return `${adultBanner()}<div class="page-heading adult-heading"><div><div class="eyebrow">APRENDER TAMBÉM É ESTAR JUNTO</div><h1>Um olhar sobre as descobertas.</h1><p>Acompanhe o que foi praticado por ${esc(p.name)}.</p></div><div class="button-row">${profileSelect()}<button class="secondary" data-action="export" data-profile="${esc(p.id)}">${icon('download')}Exportar</button></div></div><div class="stats-grid">${statCard('Atividades exploradas',`${stats.completed.size}<span style="font-size:15px;color:var(--muted)"> / 6</span>`,'Diversidade de atividades','compass')}${statCard('Sessões concluídas',stats.total,'Registros neste aparelho','book')}${statCard('Tempo nas atividades',Math.round(stats.seconds/60)+'<span style="font-size:14px"> min</span>','Somente tempo de jogo ativo','clock')}${statCard('Áudios solicitados',stats.helps,'Instruções e dicas ouvidas','sound')}</div><div class="adult-columns"><section class="panel"><div class="panel-heading"><div><h3>O que já foi explorado</h3><p>Atividades organizadas por objetivo.</p></div>${icon('sprout')}</div>${ACTIVITIES.map(a=>{const count=stats.sessions.filter(s=>s.activityId===a.id).length;return `<div class="skill-row"><div class="skill-row-top"><span>${a.skill}</span><span>${count?`${count} ${count===1?'sessão':'sessões'}`:'Ainda não explorada'}</span></div><div class="progress-bar" aria-label="${a.name}: ${count?'explorada':'não explorada'}"><span style="width:${count?100:0}%"></span></div></div>`;}).join('')}<div class="metric-note">Esses registros descrevem o uso da plataforma. Concluir um jogo ou acertar uma resposta não comprova domínio da leitura e não constitui avaliação ou diagnóstico.</div></section><section class="panel"><div class="panel-heading"><div><h3>Para brincar juntos</h3><p>${pending.length?'Há uma sugestão da escola para continuar em casa.':'Uma sugestão para a próxima atividade.'}</p></div>${icon('heart')}</div><div class="recommendation"><div class="eyebrow" style="margin-bottom:5px;font-size:9px">${pending.length?'SUGESTÃO DA ESCOLA':'PRÓXIMA DESCOBERTA'}</div><h4>${next.name}</h4><p>${next.description} Acompanhe a criança e observe como ela participa.</p><button class="quiet" data-action="play" data-id="${next.id}">Abrir atividade${icon('arrow')}</button></div><div class="family-tip"><strong>Uma ideia para fora da tela</strong>Escolham um objeto de casa e conversem sobre seu nome. Depois, escrevam a palavra juntos em um papel e procurem letras que vocês já conhecem.</div><div class="spacer"></div><button class="secondary" data-action="print">${icon('print')}Imprimir uma atividade</button></section></div><section class="panel history-panel"><div class="panel-heading"><h3>Últimas atividades</h3><span class="text-muted">Até oito registros recentes</span></div>${historyHTML(p.id)}</section>`;
}
function school(){
 const total=state.sessions.length,pending=state.assignments.filter(a=>a.status==='pending').length,participating=state.profiles.filter(p=>profileStats(state,p.id).total>0).length;
 return `${adultBanner()}<div class="page-heading adult-heading"><div><div class="eyebrow">CADA CRIANÇA TEM SEU CAMINHO</div><h1>Turma das descobertas.</h1><p>Uma turma de demonstração para testar acompanhamento e atividades.</p></div><div class="school-actions"><button class="secondary" data-action="teacher-review">${icon('book')}Avaliar a prévia</button><button class="secondary" data-action="add-profile">${icon('plus')}Adicionar perfil</button><button class="primary" data-action="assign">${icon('plus')}Sugerir atividade</button></div></div><div class="stats-grid">${statCard('Perfis da turma',state.profiles.length,'Somente perfis fictícios','users')}${statCard('Já participaram',participating,'Com uma sessão concluída','compass')}${statCard('Sessões concluídas',total,'Todas as atividades da turma','book')}${statCard('Sugestões pendentes',pending,'Para continuar em casa','sign')}</div><section class="panel"><div class="panel-heading"><div><h3>Acompanhamento da turma</h3><p>Selecione um perfil para ver seus registros.</p></div><button class="quiet" data-action="export">${icon('download')}Exportar turma</button></div><div class="school-table-wrap"><table class="school-table"><thead><tr><th>Perfil de demonstração</th><th>Atividades exploradas</th><th>Última atividade</th><th>Sugestões</th><th>Registros</th></tr></thead><tbody>${state.profiles.map(p=>{const stats=profileStats(state,p.id),last=stats.sessions.at(-1),pending=state.assignments.filter(a=>a.profileId===p.id&&a.status==='pending').length;return `<tr><td>${avatar(p)}<strong>${esc(p.name)}</strong></td><td><div class="mini-progress"><div class="progress-bar"><span style="width:${stats.completed.size/6*100}%"></span></div><span class="text-muted">${stats.completed.size} de 6 atividades</span></div></td><td>${last?ACTIVITIES.find(a=>a.id===last.activityId).name:'Ainda não participou'}</td><td><span class="status-chip ${!pending&&stats.total?'done':''}">${pending?`${pending} pendente${pending>1?'s':''}`:'Sem pendências'}</span></td><td><button class="text-button" data-action="view-profile" data-profile="${esc(p.id)}">Ver registros →</button></td></tr>`;}).join('')}</tbody></table></div></section><section class="panel history-panel"><div class="panel-heading"><div><h3>Escola e casa, no mesmo caminho</h3><p>Sugestões aparecem na área da família do perfil selecionado.</p></div>${icon('heart')}</div>${state.assignments.length?`<div class="assignment-list">${state.assignments.slice(-8).reverse().map(a=>{const activity=ACTIVITIES.find(x=>x.id===a.activityId),profile=state.profiles.find(p=>p.id===a.profileId);return `<div class="assignment-row"><div class="icon-circle">${icon(activity.icon)}</div><div><strong>${activity.name}</strong><p>${esc(profile.name)} · sugerida em ${formatDate(a.createdAt)}</p></div><span class="status-chip ${a.status==='done'?'done':''}">${a.status==='done'?'Concluída':'Pendente'}</span></div>`;}).join('')}</div>`:'<div class="empty-state"><h3>Que tal sugerir a primeira atividade?</h3><p>Escolha um perfil e uma atividade. Ela aparecerá como próxima sugestão na área da família.</p></div>'}<div class="teacher-notes"><strong>Para o piloto:</strong> a integração funciona entre as áreas deste mesmo navegador. Contas reais, sincronização entre aparelhos, permissões institucionais e conteúdo pedagógico validado são etapas seguintes.</div></section>`;
}
function render(){
 settingsClass();let html;
 switch(view){case 'library':html=library();break;case 'family':html=family();break;case 'school':html=school();break;case 'play':html=game?.completed?completion():gameHTML();break;default:html=adventure();}
 root.innerHTML=layout(html);
 document.title=`${view==='play'&&game?game.activity.name:view==='family'?'Família':view==='school'?'Escola':view==='library'?'Atividades':'Aventuras de leitura'} · Lumi`;
}
function navigate(target,{confirmed=false}={}){
 if(!navigation.some(([id])=>id===target))return;
 if(view==='play'&&game&&!game.completed&&!confirmed){pendingNavigation=()=>navigate(target,{confirmed:true});openModal('Voltar à aventura?',`<p class="modal-description">Esta atividade ainda está acontecendo. Você pode sair e recomeçar depois. O registro é salvo quando a atividade é concluída.</p><div class="button-row"><button class="primary" data-action="close-modal">Continuar brincando</button><button class="secondary" data-action="confirm-navigation">Sair da atividade</button></div>`);return;}
 if(['family','school'].includes(target)&&Date.now()>adultUntil){showGate(()=>navigate(target,{confirmed:true}));return;}
 closeModal();stopSpeech();view=target;game=null;render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});
}
function startActivity(id){
 const activity=ACTIVITIES.find(a=>a.id===id);if(!activity)return;
 closeModal();stopSpeech();view='play';game={activity,profileId:state.activeProfile,questions:makeQuestions(id),index:0,rounds:[],attempts:0,helps:0,seconds:0,sinceBreak:0,build:[],solved:false,lastWrong:null,feedback:'',completed:false};render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});if(state.settings.sound)speakInitial();
}
function speakInitial(){if(!game||game.completed)return;const q=game.questions[game.index];speak(q.type==='story'?q.text+' '+q.prompt:q.prompt);}
function gameHTML(){
 if(!game)return adventure();const q=game.questions[game.index],a=game.activity;
 const listenLabel=q.type==='read'?'Ouvir uma dica':q.type==='story'?'Ouvir a história':'Ouvir instrução';
 let stage='';
 if(q.type==='story')stage=`<div class="story-scene"><img src="assets/lumi.svg" alt="Lumi no jardim">${picture(q.scene==='seed'?'SEMENTE':q.scene==='water'?'ÁGUA':'PLANTA')}</div><p class="story-text">${esc(q.text)}</p><button class="audio-prompt" data-action="listen">${icon('sound')}${listenLabel}</button><div class="story-question">${q.prompt}</div>${optionsHTML(q,true)}`;
 else if(q.type==='build')stage=`<h1>Vamos construir uma palavra?</h1><div class="build-picture">${picture(q.target)}</div><button class="audio-prompt" data-action="listen">${icon('sound')}${listenLabel}</button><div class="build-slots" aria-label="Sílabas escolhidas: ${esc(game.build.join(' ')||'nenhuma')}">${Array.from({length:q.slots},(_,i)=>`<span class="build-slot ${game.build[i]?'filled':''}">${esc(game.build[i]||'—')}</span>`).join('')}</div><div class="syllable-options">${q.options.map((s,i)=>`<button class="syllable-button" data-action="syllable" data-index="${i}" aria-label="Adicionar sílaba ${esc(s)}" ${game.solved||game.build.includes(s)||game.build.length>=q.slots?'disabled':''}>${s}</button>`).join('')}</div><div class="build-actions"><button class="secondary" data-action="undo" ${!game.build.length||game.solved?'disabled':''}>${icon('back')}Desfazer</button><button class="primary" data-action="check-build" ${game.build.length!==q.slots||game.solved?'disabled':''}>Conferir${icon('check')}</button></div>`;
 else stage=`<h1>${q.type==='read'?'Qual figura combina?':q.type==='missing'?'Qual letra está faltando?':q.type==='sound'?'Quem tem o mesmo começo?':q.prompt}</h1>${q.type==='sound'?`<div class="reference-word">${picture(q.reference)}${q.reference}</div>`:''}${['read','missing'].includes(q.type)?`<div class="word-target">${q.type==='missing'?q.gap:q.target}</div>${q.type==='missing'?`<div class="build-picture" style="margin-bottom:14px">${picture(q.target)}</div>`:''}`:''}<div><button class="audio-prompt" data-action="listen">${icon('sound')}${listenLabel}</button></div>${optionsHTML(q)}`;
 const finalRound=game.index===game.questions.length-1;
 return `<div class="game-wrap"><div class="game-header"><button class="quiet" data-action="nav" data-view="adventure">${icon('back')}Voltar</button><div class="game-title">${icon(a.icon)}${a.name}</div><span class="text-muted">${game.index+1} / ${game.questions.length}</span></div><div class="game-progress" aria-label="Desafio ${game.index+1} de ${game.questions.length}">${game.questions.map((_,i)=>`<span class="${i<game.index?'done':i===game.index?'current':''}"></span>`).join('')}</div><section class="game-card ${q.type==='story'?'is-story':''}"><div class="game-eyebrow">${q.type==='story'?'LEITURA ACOMPANHADA · LEIA COM UM ADULTO':'UMA DESCOBERTA DE CADA VEZ'}</div>${stage}<div class="feedback ${game.lastWrong?'neutral':''}" role="status" aria-live="polite">${game.feedback?`<span class="feedback-message">${icon(game.solved?'check':'leaf')}${esc(game.feedback)}</span>`:'<span class="text-muted">Pode experimentar. A Lumi está aqui com você.</span>'}${game.solved?`<button class="primary" data-action="next">${finalRound?'Terminar aventura':'Próxima descoberta'}${icon('arrow')}</button>`:''}</div></section><div class="game-footer">${icon('heart')}Sem pressa. Você pode ouvir de novo e tentar outra vez.</div></div>`;
}
function optionsHTML(q,story=false){
 const isLetter=['letter','missing'].includes(q.type),showNames=['sound','story'].includes(q.type);
 return `<div class="answer-options ${story?'story-options':''}">${q.options.map((option,i)=>`<div><button class="answer-button ${isLetter?'letter':''} ${game.solved&&option===q.correct?'correct':game.lastWrong===option?'wrong':''}" data-action="answer" data-index="${i}" aria-label="Escolher ${esc(option)}" ${game.solved?'disabled':''}>${isLetter?option:`${picture(option)}${showNames?`<span>${option}</span>`:''}`}</button>${q.type==='sound'?`<button class="option-sound" data-action="listen-option" data-index="${i}" ${game.solved?'disabled':''} aria-label="Ouvir ${esc(option)}">${icon('sound')}Ouvir</button>`:''}</div>`).join('')}</div>`;
}
function submitAnswer(answer){
 if(!game||game.solved||game.completed)return;const q=game.questions[game.index];game.attempts++;
 if(answerIsCorrect(q,answer)){
  game.solved=true;game.lastWrong=null;game.feedback=q.type==='story'?'Isso! Você descobriu uma parte da história.':'Isso! Mais uma descoberta no caminho.';
  game.rounds.push({prompt:q.type==='story'?q.prompt:q.type==='read'?q.target:q.prompt,answer:Array.isArray(answer)?answer.join(' '):answer,attempts:game.attempts,helps:game.helps});
  if(state.settings.sound)speak(q.type==='read'?`Isso! A palavra é ${q.target}.`:'Isso! Vamos para a próxima descoberta.');
 }else{game.lastWrong=Array.isArray(answer)?'build':answer;game.feedback=q.type==='build'?'Vamos ajustar as sílabas? Você pode desfazer e ouvir a palavra.':'Vamos olhar de novo? Você pode ouvir a dica e tentar outra vez.';}
 render();if(game.solved)requestAnimationFrame(()=>$('[data-action="next"]')?.focus({preventScroll:true}));
}
function nextQuestion(){
 if(!game||!game.solved)return;stopSpeech();
 if(game.index===game.questions.length-1){finishActivity();return;}
 game.index++;game.solved=false;game.attempts=0;game.helps=0;game.build=[];game.feedback='';game.lastWrong=null;render();if(state.settings.sound)speakInitial();
}
function finishActivity(){
 state=recordSession(state,{profileId:game.profileId,activityId:game.activity.id,rounds:game.rounds,seconds:game.seconds});save();game.completed=true;lastCompletion={...game};render();window.scrollTo({top:0,behavior:'instant'});if(state.settings.sound)speak('Aventura concluída! Agora, que tal brincar um pouco fora da tela?');
}
function completion(){
 const c=lastCompletion||game;
 return `<section class="completion"><div class="completion-hero">${icon('star')}<img src="assets/lumi.svg" alt="Lumi sorrindo">${icon('sprout')}</div><div class="eyebrow">MAIS UMA DESCOBERTA NO CAMINHO</div><h1>Você e a Lumi foram longe!</h1><p>Você explorou <strong>${c.activity.name}</strong>. Cada tentativa fez parte da aventura.</p><div class="completion-summary"><div><strong>${c.rounds.length}</strong>desafios explorados</div><div><strong>${formatDuration(c.seconds)}</strong>tempo de brincadeira</div></div><div class="completion-offline"><strong>A próxima descoberta pode ser fora da tela.</strong>Escolha uma palavra da atividade e desenhe o que ela representa. Convide um adulto para escrever a palavra com você.</div><div class="completion-actions"><button class="primary" data-action="nav" data-view="adventure">Voltar à aventura${icon('arrow')}</button><button class="secondary" data-action="print">${icon('print')}Levar para o papel</button></div><div class="session-note" style="justify-content:center">${icon('check')}O registro da atividade aparece na área da família.</div></section>`;
}
function formatDuration(seconds){const n=Math.max(0,Math.round(seconds));return n<60?`${n}s`:`${Math.floor(n/60)}min${n%60?' '+n%60+'s':''}`;}
function formatDate(iso){const date=new Date(iso);return Number.isNaN(date.valueOf())?'Data indisponível':new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date);}
function openModal(title,body,context={}){
 stopSpeech();if(!overlayRoot.innerHTML)returnFocus=document.activeElement;modalContext=context;
 overlayRoot.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">${title}</h2><button class="modal-close" data-action="close-modal" aria-label="Fechar janela">${icon('close')}</button></div>${body}</section></div>`;
 requestAnimationFrame(()=>{const target=$('.modal [autofocus]')||$('.modal-close');target?.focus();});
}
function closeModal(){overlayRoot.innerHTML='';modalContext=null;if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;}
function showGate(callback){
 const a=7+Math.floor(Math.random()*6),b=4+Math.floor(Math.random()*6);
 openModal('Um instante para o adulto',`<div class="gate-visual"><img src="assets/lumi.svg" alt=""></div><p class="modal-description">Esta área é para quem acompanha a aventura. Peça a um adulto para continuar.</p><form id="gate-form"><div class="gate-question" aria-label="Quanto é ${a} mais ${b}?">${a} + ${b} = ?</div><div class="form-field"><label for="gate-answer">Resposta</label><input id="gate-answer" inputmode="numeric" type="text" pattern="[0-9]+" required autocomplete="off" autofocus></div><div id="form-error" class="form-error" role="alert"></div><button class="primary full" type="submit">Continuar${icon('arrow')}</button></form><p class="modal-footer-note">Este passo evita trocas acidentais de área. A demonstração não oferece autenticação de contas reais.</p>`,{gate:a+b,callback});
}
function requireAdult(callback){if(Date.now()>adultUntil)showGate(callback);else callback();}
function showProfiles(){
 openModal('Quem vai explorar?',`<p class="modal-description">Escolha um dos perfis fictícios para testar a aventura.</p><div class="profile-list">${state.profiles.map(p=>`<button class="profile-option ${p.id===state.activeProfile?'active':''}" data-action="select-profile" data-profile="${esc(p.id)}">${avatar(p)}${esc(p.name)}${p.id===state.activeProfile?icon('check'):icon('arrow')}</button>`).join('')}</div><p class="modal-footer-note">O progresso de cada perfil fica separado neste navegador.</p>`);
}
function showSettings(){
 openModal('Um jeito de brincar para você',`<p class="modal-description">Ajuste o áudio, o movimento e o tamanho do texto.</p>${[['sound','Áudio e narração','Instruções faladas pela voz disponível no aparelho.'],['reducedMotion','Menos movimento','Reduz transições e animações da interface.'],['largeText','Texto maior','Aumenta textos e elementos das atividades.']].map(([key,label,desc])=>`<div class="settings-row"><div><label id="label-${key}">${label}</label><p>${desc}</p></div><button class="toggle ${state.settings[key]?'on':''}" role="switch" aria-checked="${state.settings[key]}" aria-labelledby="label-${key}" data-action="setting" data-setting="${key}"></button></div>`).join('')}<div class="settings-row"><div><label for="session-minutes">Lembrete de pausa</label><p>Uma pausa depois de alguns minutos de atividade.</p></div><select id="session-minutes" class="small-select">${[5,10,15].map(n=>`<option value="${n}" ${state.settings.sessionMinutes===n?'selected':''}>${n} min</option>`).join('')}</select></div><div class="spacer"></div><button class="secondary" style="width:100%;margin-bottom:12px" data-action="voice-preview">${icon('sound')}Ouvir a voz da Lumi</button><button class="primary full" data-action="close-modal">Pronto${icon('check')}</button><p class="modal-footer-note">A prévia usa o áudio da Lumi enviado do ElevenLabs. Nas atividades, falas com MP3 correspondente usam gravações; as demais continuam com a voz do aparelho.</p>`);
}
function showAssignment(){
 openModal('Sugerir uma descoberta',`<p class="modal-description">A atividade aparecerá na área da família do perfil escolhido, neste mesmo navegador.</p><form id="assignment-form"><div class="form-field"><label for="assignment-profile">Perfil de demonstração</label><select id="assignment-profile">${state.profiles.map(p=>`<option value="${esc(p.id)}" ${p.id===state.activeProfile?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="form-field"><label for="assignment-activity">Atividade</label><select id="assignment-activity">${ACTIVITIES.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div><button class="primary full" type="submit">Sugerir atividade${icon('arrow')}</button></form>`);
}
function showAddProfile(){
 if(state.profiles.length>=30){toast('A demonstração permite até 30 perfis.');return;}
 openModal('Adicionar perfil de teste',`<p class="modal-description">Use apenas um apelido fictício. Esta versão não foi preparada para cadastrar dados reais de crianças.</p><form id="profile-form"><div class="form-field"><label for="profile-name">Apelido fictício</label><input id="profile-name" maxlength="30" minlength="2" placeholder="Explorador ${state.profiles.length+1}" required autofocus></div><div class="form-field"><label for="profile-avatar">Companheiro</label><select id="profile-avatar"><option value="fox">Raposa</option><option value="cat">Gato</option><option value="frog">Sapo</option><option value="owl">Coruja</option></select></div><div id="form-error" class="form-error" role="alert"></div><button class="primary full" type="submit">Adicionar perfil${icon('plus')}</button></form>`);
}
function showHelp(){
 openModal('Olá, somos a Lumi.',`<div class="help-content"><p>Uma primeira versão para explorar letras, palavras e histórias com acompanhamento de um adulto.</p><ul><li><strong>Minha aventura:</strong> cinco jogos e uma história interativa.</li><li><strong>Família:</strong> registros das atividades realizadas e sugestões para acompanhar.</li><li><strong>Escola:</strong> perfis fictícios e sugestões que aparecem na área da família.</li></ul><p>O progresso fica neste navegador. Não há contas reais, sincronização entre aparelhos nem cobrança. O conteúdo é uma demonstração e precisa de revisão por um alfabetizador antes de um piloto com crianças.</p><div class="print-help">Depois de um primeiro acesso com internet, o aplicativo tenta disponibilizar as atividades sem conexão. A narração depende do aparelho.</div><div class="button-row"><button class="secondary" data-action="teacher-review">${icon('book')}Avaliar a prévia</button><button class="secondary" data-action="plans">Conhecer a proposta de planos${icon('arrow')}</button><button class="secondary" data-action="audio-roadmap">${icon('download')}Roteiro das falas</button></div></div>`);
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
function showPlans(){openModal('Uma proposta para crescer juntos',`<p class="modal-description">Preços hipotéticos para validar com famílias e escolas. Não há contratação nem cobrança nesta demonstração.</p><div class="price-grid"><section class="price-card"><h3>Para a família</h3><div class="price-number">R$ 29,90<span> / mês</span></div><p>Proposta: uma criança, atividades e acompanhamento do responsável.</p></section><section class="price-card"><h3>Para a escola</h3><div class="price-number">R$ 399<span> / mês</span></div><p>Proposta: até 30 crianças, professores e acesso em casa incluído.</p></section></div><div class="spacer"></div><button class="primary full" data-action="close-modal">Continuar explorando${icon('arrow')}</button>`);}
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
  case 'voice-preview':if(previewPlaying)stopSpeech();else narrator.playFile(VOICE_PREVIEW);break;
  case 'audio-roadmap':requireAdult(()=>{closeModal();const link=document.createElement('a');link.href='assets/audio/roteiro-narracao.txt';link.download='Lumi_Roteiro_Narracao.txt';document.body.append(link);link.click();link.remove();});break;
  case 'teacher-review':requireAdult(showReview);break;
  case 'nav':navigate(button.dataset.view);break;
  case 'play':startActivity(button.dataset.id);break;
  case 'mute':state.settings.sound=!state.settings.sound;save();stopSpeech();render();toast(state.settings.sound?'Áudio ligado.':'Áudio desligado.');break;
  case 'settings':showSettings();break;
  case 'profiles':showProfiles();break;
  case 'select-profile':if(state.profiles.some(p=>p.id===button.dataset.profile)){state.activeProfile=button.dataset.profile;save();closeModal();render();}break;
  case 'filter':filter=button.dataset.filter;render();break;
  case 'answer':if(game&&!game.completed){const q=game.questions[game.index];submitAnswer(q.options[Number(button.dataset.index)]);}break;
  case 'syllable':if(game&&!game.solved){const q=game.questions[game.index],value=q.options[Number(button.dataset.index)];if(value&&game.build.length<q.slots&&!game.build.includes(value)){game.build.push(value);game.lastWrong=null;game.feedback='';render();}}break;
  case 'undo':if(game&&!game.solved){game.build.pop();game.feedback='';game.lastWrong=null;render();}break;
  case 'check-build':if(game&&game.build.length===game.questions[game.index].slots)submitAnswer([...game.build]);break;
  case 'next':nextQuestion();break;
  case 'listen':if(game&&!game.completed){const q=game.questions[game.index];const text=q.type==='story'?q.text+' '+q.prompt:q.type==='read'?`A palavra é ${q.target}.`:q.prompt;if(speak(text))game.helps++;}break;
  case 'listen-option':if(game&&!game.completed){const q=game.questions[game.index];if(speak(q.options[Number(button.dataset.index)]))game.helps++;}break;
  case 'close-modal':closeModal();break;
  case 'confirm-navigation':{const cb=pendingNavigation;pendingNavigation=null;closeModal();cb?.();break;}
  case 'setting':{const key=button.dataset.setting;if(!['sound','reducedMotion','largeText'].includes(key))break;state.settings[key]=!state.settings[key];save();settingsClass();button.classList.toggle('on',state.settings[key]);button.setAttribute('aria-checked',String(state.settings[key]));if(key==='sound'){stopSpeech();const mute=$('[data-action="mute"]');if(mute){mute.innerHTML=icon(state.settings.sound?'sound':'muted');mute.setAttribute('aria-label',state.settings.sound?'Desligar áudio':'Ligar áudio');}}break;}
  case 'assign':requireAdult(showAssignment);break;
  case 'add-profile':requireAdult(showAddProfile);break;
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
 if(!['gate-form','assignment-form','profile-form','review-form'].includes(event.target.id))return;event.preventDefault();
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
 if(event.target.id==='adult-profile'&&state.profiles.some(p=>p.id===event.target.value)){state.activeProfile=event.target.value;save();render();}
 if(event.target.id==='session-minutes'){state.settings.sessionMinutes=Number(event.target.value);save();}
});
document.addEventListener('input',event=>{
 if(event.target.id!=='activity-search')return;search=event.target.value;const selected=ACTIVITIES.filter(a=>(filter==='Todas'||a.category===filter)&&`${a.name} ${a.description} ${a.skill}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));$('#library-results').innerHTML=selected.length?selected.map(a=>activityCard(a,true)).join(''):'<div class="empty-state" style="grid-column:1/-1"><h3>Nenhuma atividade encontrada</h3><p>Tente buscar por letras, palavras ou história.</p></div>';
});
document.addEventListener('keydown',event=>{
 const modal=$('.modal');if(!modal)return;
 if(event.key==='Escape'){event.preventDefault();closeModal();return;}
 if(event.key==='Tab'){
  const items=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]')];if(!items.length)return;
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
