import {availableActivities,activityById} from './teaching.js';
import {FAMILY_INTERESTS,FAMILY_SUPPORTS,PARTICIPATION,OFFLINE_ACTIVITIES,ACTIVITY_DOMAINS,FAMILY_DOMAINS,SUGGESTED_AGES} from './family-data.js';
import {themeForDate} from './content.js';

export function normalizeFamilyProfile(raw={}){
 const supports=Object.fromEntries(FAMILY_SUPPORTS.map(([key])=>[key,raw?.supports?.[key]===true]));
 return {...raw,age:[3,4,5].includes(Number(raw.age))?Number(raw.age):null,attendsSchool:typeof raw.attendsSchool==='boolean'?raw.attendsSchool:null,interests:Array.isArray(raw.interests)?[...new Set(raw.interests.filter(x=>FAMILY_INTERESTS.includes(x)))]:[],supports};
}
export function updateFamilyProfile(state,raw){
 const name=typeof raw?.name==='string'?raw.name.trim():'';
 if(name.length<2||name.length>30)throw new Error('Use um apelido com 2 a 30 caracteres.');
 if(![3,4,5].includes(Number(raw.age)))throw new Error('Escolha uma faixa etária entre 3 e 5 anos para esta prévia.');
 if(state.profiles.some(p=>p.id!==raw.id&&p.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')))throw new Error('Já existe um perfil com esse apelido.');
 const existing=state.profiles.find(p=>p.id===raw.id);
 if(!existing&&state.profiles.length>=30)throw new Error('Esta prévia permite até 30 perfis.');
 if(typeof raw.id!=='string'||!raw.id||raw.id.length>100)throw new Error('Perfil inválido.');
 const profile=normalizeFamilyProfile({id:raw.id,name,age:Number(raw.age),avatar:['fox','cat','frog','owl'].includes(raw.avatar)?raw.avatar:'fox',attendsSchool:raw.attendsSchool,interests:raw.interests,supports:raw.supports});
 return {...state,activeProfile:profile.id,profiles:existing?state.profiles.map(p=>p.id===profile.id?profile:p):[...state.profiles,profile]};
}
export function recommendedActivities(state,profileId){
 const profile=state.profiles.find(p=>p.id===profileId),age=profile?.age||3;
 const eligible=availableActivities(state).filter(a=>{
  const ages=a.age&&a.age!=='mixed'?[Number(a.age)]:(SUGGESTED_AGES[a.id]||[3,4,5]);
  return ages.includes(age);
 });
 const lastIds=state.sessions.filter(s=>s.profileId===profileId).slice(-2).map(s=>s.activityId);
 const interests=profile?.interests||[];
 const score=a=>(lastIds.includes(a.id)?-2:0)+(interests.includes('Histórias')&&a.category==='Histórias'?3:0)+(interests.includes('Cores e formas')&&['colors','shapes'].includes(a.id)?3:0)+(interests.includes('Animais')&&a.id==='animals'?3:0)+(interests.includes('Música')&&a.id==='rhymes'?2:0)+(interests.includes('Palavras')&&['sounds','rhymes'].includes(a.id)?2:0)+(interests.includes('Cores e formas')&&['odd-one','shadows','memory'].includes(a.id)?2:0)+(interests.includes('Animais')&&a.id==='animal-sounds'?3:0)+(interests.includes('Números')&&['count','sizes'].includes(a.id)?3:0)+(interests.includes('Música')&&a.id==='animal-sounds'?1:0);
 return [...eligible].sort((a,b)=>score(b)-score(a));
}
export function restoreFamilyObservations(raw,profiles,sessions){
 if(!Array.isArray(raw))return [];
 const profileIds=new Set(profiles.map(p=>p.id)),kinds=new Set(PARTICIPATION.map(([id])=>id));
 const seen=new Set();
 return raw.filter(o=>o&&typeof o.id==='string'&&o.id&&!seen.has(o.id)&&seen.add(o.id)&&profileIds.has(o.profileId)&&kinds.has(o.participation)&&['digital','offline','general'].includes(o.kind)&&typeof o.activityId==='string'&&(o.kind!=='offline'||OFFLINE_ACTIVITIES.some(a=>a.id===o.activityId))&&(o.sessionId==null||sessions.some(s=>s.id===o.sessionId&&s.profileId===o.profileId&&s.activityId===o.activityId))&&Number.isFinite(Date.parse(o.createdAt))).slice(-500).map(o=>({id:o.id,profileId:o.profileId,activityId:o.activityId,sessionId:o.sessionId||null,kind:o.kind,participation:o.participation,createdAt:o.createdAt,note:typeof o.note==='string'?o.note.slice(0,400):''}));
}
export function recordFamilyObservation(state,{id,profileId,activityId,sessionId=null,kind='digital',participation,note=''},now=new Date().toISOString()){
 if(!state.profiles.some(p=>p.id===profileId)||!PARTICIPATION.some(([key])=>key===participation)||!Number.isFinite(Date.parse(now)))throw new Error('Confira o perfil e a participação informada.');
 if(!['digital','offline','general'].includes(kind))throw new Error('Tipo de registro inválido.');
 if(kind==='offline'&&!OFFLINE_ACTIVITIES.some(a=>a.id===activityId))throw new Error('Brincadeira não encontrada.');
 if(kind!=='offline'&&!activityById(state,activityId,{includeDrafts:true}))throw new Error('Atividade não encontrada.');
 if(sessionId&&!state.sessions.some(s=>s.id===sessionId&&s.profileId===profileId&&s.activityId===activityId))throw new Error('Este registro não pertence ao perfil e à atividade selecionados.');
 const list=state.observations||[],previous=list.find(o=>sessionId?o.sessionId===sessionId:o.id===id);
 const observation={id:previous?.id||id||'observation-'+now+'-'+list.length,profileId,activityId,sessionId,kind,participation,note:String(note).trim().slice(0,400),createdAt:previous?.createdAt||now};
 return {...state,observations:[...list.filter(o=>o.id!==observation.id),observation].slice(-500)};
}
export function familyWeeklySummary(state,profileId,now=new Date()){
 const until=new Date(now).valueOf(),from=until-7*24*60*60*1000;
 const inPeriod=value=>{const time=Date.parse(value);return time>=from&&time<=until;};
 const sessions=state.sessions.filter(s=>s.profileId===profileId&&inPeriod(s.createdAt));
 const observations=(state.observations||[]).filter(o=>o.profileId===profileId&&inPeriod(o.createdAt));
 const offline=observations.filter(o=>o.kind==='offline'),rounds=sessions.flatMap(s=>s.rounds),firstTry=rounds.filter(r=>r.attempts===1).length;
 const areas=FAMILY_DOMAINS.map(domain=>({...domain,digital:sessions.filter(s=>(ACTIVITY_DOMAINS[s.activityId]||'writing')===domain.id).length,offline:offline.filter(o=>OFFLINE_ACTIVITIES.find(a=>a.id===o.activityId)?.domain===domain.id).length}));
 const firstTryText=rounds.length?`Em ${rounds.length} desafios concluídos na Lumi, ${firstTry} respostas foram registradas na primeira tentativa.`:'Ainda não há desafios concluídos neste período.';
 const supportCount=observations.filter(o=>o.participation==='with_support').length;
 const observedCount=observations.filter(o=>o.participation!=='not_observed').length;
 const supportText=observedCount?`O responsável registrou a participação em ${observedCount} experiências; em ${supportCount}, informou uso de apoio.`:'A participação com ou sem apoio ainda não foi informada pelo responsável.';
 return {from,until,sessions,observations,offline,rounds:rounds.length,firstTry,areas,firstTryText,supportText,total:sessions.length+offline.length,hasData:sessions.length+observations.length>0};
}
export function familySummaryText(state,profileId,now=new Date()){
 const p=state.profiles.find(p=>p.id===profileId);if(!p)throw new Error('Perfil não encontrado.');
 const s=familyWeeklySummary(state,profileId,now),date=iso=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'}).format(new Date(iso));
 const names=Object.fromEntries(PARTICIPATION);
 const digitalDetails=s.sessions.map(session=>`${date(session.createdAt)} — ${session.activityName||activityById(state,session.activityId,{includeDrafts:true})?.name||'Brincadeira na Lumi'}\n${session.rounds.map((round,i)=>`  ${i+1}. ${round.prompt}\n     Resposta registrada: ${round.answer} · tentativas: ${round.attempts}`).join('\n')}`).join('\n\n');
 return `LUMI — DESCOBERTAS EM FAMÍLIA\nPerfil: ${p.name}\nPeríodo: ${date(s.from)} a ${date(s.until)}\n\nREGISTROS DA LUMI\n${s.sessions.length} brincadeiras digitais concluídas.\n${s.firstTryText}\n\n${digitalDetails}\n\nINFORMADO PELO RESPONSÁVEL\n${s.offline.length} brincadeiras fora da tela registradas.\n${s.supportText}\n${s.observations.map(o=>`${date(o.createdAt)} — ${names[o.participation]}${o.note?' — '+o.note:''}`).join('\n')}\n\nEXPERIÊNCIAS POR ÁREA\n${s.areas.map(a=>`${a.label}: ${a.digital} digitais; ${a.offline} fora da tela`).join('\n')}\n\nEste retrato descreve atividades realizadas e relatos da família. Os resultados dos jogos não representam uma avaliação do desenvolvimento global, diagnóstico ou comparação com outras crianças.\n`;
}

// ——— Trilha do dia e jardim (0.7) ———
// Tudo é calculado a partir das sessões e relatos já guardados: não há dado novo para migrar.
export function dayKey(value){const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function seedFrom(text){let h=2166136261;for(const ch of text){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function startOfDay(value){const d=new Date(value);d.setHours(0,0,0,0);return d.valueOf();}
function activityAgesFor(a){return a.age&&a.age!=='mixed'?[Number(a.age)]:(SUGGESTED_AGES[a.id]||[3,4,5]);}
function pick(list,preferred,recent,seed){
 const pools=[list.filter(x=>preferred.has(x.id)&&!recent.has(x.id)),list.filter(x=>!recent.has(x.id)),list.filter(x=>preferred.has(x.id)),list];
 const pool=pools.find(p=>p.length)||[];return pool.length?pool[seed%pool.length]:null;
}
export function offlineForProfile(p){return OFFLINE_ACTIVITIES.filter(a=>a.ages.includes(p?.age||3)&&(!p?.supports?.quietMode||!a.usesSound));}
export function dailyTrail(state,profileId,date=new Date()){
 const profile=state.profiles.find(p=>p.id===profileId);if(!profile)return null;
 const age=profile.age||3,theme=themeForDate(date),today=startOfDay(date),key=dayKey(date),seed=seedFrom(profileId+'|'+key);
 const eligible=availableActivities(state).filter(a=>activityAgesFor(a).includes(age));
 // Só os três dias anteriores contam como "recente": concluir algo hoje não troca a trilha de hoje.
 const recentFrom=today-3*86400000,before=t=>{const v=Date.parse(t);return v>=recentFrom&&v<today;};
 const recent=new Set([...state.sessions.filter(s=>s.profileId===profileId&&before(s.createdAt)).map(s=>s.activityId),...(state.observations||[]).filter(o=>o.profileId===profileId&&o.kind==='offline'&&before(o.createdAt)).map(o=>o.activityId)]);
 const themed=new Set([...theme.activities,...theme.offline]);
 const story=pick(eligible.filter(a=>a.category==='Histórias'),themed,recent,seed);
 const game=pick(eligible.filter(a=>a.category!=='Histórias'),themed,recent,seed>>>3);
 const offline=pick(offlineForProfile(profile),themed,recent,seed>>>5);
 const doneToday=(kind,id)=>kind==='offline'?(state.observations||[]).some(o=>o.profileId===profileId&&o.kind==='offline'&&o.activityId===id&&dayKey(o.createdAt)===key):state.sessions.some(s=>s.profileId===profileId&&s.activityId===id&&dayKey(s.createdAt)===key);
 const steps=[story&&{kind:'story',label:'Ouvir uma história',activity:story},game&&{kind:'game',label:'Brincar na Lumi',activity:game},offline&&{kind:'offline',label:'Brincar fora da tela',activity:offline}].filter(Boolean).map(step=>({...step,done:doneToday(step.kind,step.activity.id)}));
 return {key,theme,steps,done:steps.filter(s=>s.done).length,complete:steps.length>0&&steps.every(s=>s.done)};
}
// Cada atividade concluída vira uma planta; cada dia com a trilha completa acende uma estrela.
export const GARDEN_PLANTS={stories:'flor',oral:'girassol',sounds:'tulipa',writing:'trevo',exploring:'cogumelo',numbers:'morango',body:'arbusto',feelings:'coracao'};
export function gardenFor(state,profileId,now=new Date()){
 const items=[...state.sessions.filter(s=>s.profileId===profileId).map(s=>({at:s.createdAt,domain:ACTIVITY_DOMAINS[s.activityId]||'writing',name:s.activityName||s.activityId})),
  ...(state.observations||[]).filter(o=>o.profileId===profileId&&o.kind==='offline').map(o=>{const a=OFFLINE_ACTIVITIES.find(x=>x.id===o.activityId);return {at:o.createdAt,domain:a?.domain||'body',name:a?.name||'Fora da tela'};})]
  .filter(x=>Number.isFinite(Date.parse(x.at))).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).map(x=>({...x,plant:GARDEN_PLANTS[x.domain]||'flor'}));
 const days=[...new Set(items.map(x=>dayKey(x.at)))].filter(k=>Date.parse(k+'T12:00:00')>=startOfDay(now)-60*86400000);
 const stars=days.filter(k=>dailyTrail(state,profileId,new Date(k+'T12:00:00'))?.complete).length;
 const today=dayKey(now);
 return {plants:items,total:items.length,stars,today:items.filter(x=>dayKey(x.at)===today).length};
}

// Resumo curto para enviar por WhatsApp: descreve brincadeiras, sem notas nem comparação.
export function familyShareText(state,profileId,now=new Date()){
 const p=state.profiles.find(x=>x.id===profileId);if(!p)throw new Error('Perfil não encontrado.');
 const s=familyWeeklySummary(state,profileId,now),garden=gardenFor(state,profileId,now);
 const counts=new Map();for(const session of s.sessions){const name=session.activityName||activityById(state,session.activityId,{includeDrafts:true})?.name||'Brincadeira';counts.set(name,(counts.get(name)||0)+1);}
 const favorite=[...counts].sort((a,b)=>b[1]-a[1])[0];
 const areas=s.areas.filter(a=>a.digital+a.offline).map(a=>`${a.label} (${a.digital+a.offline})`);
 const done=new Set(s.offline.map(o=>o.activityId)),idea=offlineForProfile(p).find(a=>!done.has(a.id))||offlineForProfile(p)[0];
 const lines=[`🌱 Lumi: a semana de ${p.name}`,
  s.total?`${s.sessions.length} ${s.sessions.length===1?'brincadeira':'brincadeiras'} na Lumi e ${s.offline.length} fora da tela nos últimos 7 dias.`:'Ainda não houve brincadeiras nesta semana. Que tal começar hoje?',
  favorite?(favorite[1]>1?`A mais repetida: ${favorite[0]}.`:`Brincamos de: ${[...counts.keys()].slice(0,3).join(', ')}.`):'',
  areas.length?`Por onde passamos: ${areas.join(', ')}.`:'',
  garden.total?`O jardim da Lumi já tem ${garden.total} ${garden.total===1?'planta':'plantas'}.`:'',
  idea?`Ideia para casa: ${idea.name}. ${idea.steps[0]}`:'',
  'Este é um retrato das brincadeiras, não uma avaliação.'];
 return lines.filter(Boolean).join('\n');
}
