import {ACTIVITIES} from './content.js';
import {restoreTeachingActivities,allActivities,availableActivities,activityById} from './teaching.js';
import {normalizeFamilyProfile,restoreFamilyObservations} from './family-model.js';
export const STORAGE_KEY='lumi-demo-v1';
const validRound=r=>r&&typeof r.prompt==='string'&&typeof r.answer==='string'&&Number.isInteger(r.attempts)&&r.attempts>0&&Number.isInteger(r.helps)&&r.helps>=0;
const validSession=(s,ids,activityIds)=>s&&typeof s.id==='string'&&s.id&&ids.has(s.profileId)&&activityIds.has(s.activityId)&&Array.isArray(s.rounds)&&s.rounds.length>0&&s.rounds.every(validRound)&&Number.isFinite(s.seconds)&&s.seconds>=0&&typeof s.createdAt==='string'&&Number.isFinite(Date.parse(s.createdAt));
export function createState(){
 return {version:1,contentVersion:7,activeProfile:'explorador-1',profiles:[{id:'explorador-1',name:'Explorador 1',avatar:'fox'},{id:'explorador-2',name:'Explorador 2',avatar:'cat'},{id:'explorador-3',name:'Explorador 3',avatar:'frog'}].map(normalizeFamilyProfile),sessions:[],assignments:[],customActivities:[],observations:[],enabledActivityIds:ACTIVITIES.map(a=>a.id),settings:{sound:true,reducedMotion:false,largeText:false,sessionMinutes:10}};
}
export function restoreState(raw){
 const base=createState();
 if(!raw||raw.version!==1||!Array.isArray(raw.profiles)||!raw.profiles.length)return base;
 const seen=new Set();
 const profiles=raw.profiles.filter(p=>p&&typeof p.id==='string'&&p.id&&typeof p.name==='string'&&p.name.trim()&&!seen.has(p.id)&&seen.add(p.id)).slice(0,30).map(p=>normalizeFamilyProfile({id:p.id,name:p.name.slice(0,30),avatar:['fox','cat','frog','owl'].includes(p.avatar)?p.avatar:'fox',age:p.age,attendsSchool:p.attendsSchool,interests:p.interests,supports:p.supports}));
 if(!profiles.length)return base;
 const ids=new Set(profiles.map(p=>p.id));
 const customActivities=restoreTeachingActivities(raw.customActivities),known=new Set(allActivities({customActivities},{includeDrafts:true}).map(a=>a.id));
 const published=new Set(allActivities({customActivities}).map(a=>a.id));
 const enabled=Array.isArray(raw.enabledActivityIds)?[...new Set(raw.enabledActivityIds)].filter(id=>published.has(id)):base.enabledActivityIds;
 if((!raw.contentVersion||raw.contentVersion<4)&&['letters','sounds','build','read','missing','story'].every(id=>enabled.includes(id))){for(const id of ['animals','rhymes'])if(!enabled.includes(id))enabled.push(id);}
 if((raw.contentVersion||0)<5&&['letters','sounds','build','read','missing','story','animals','rhymes'].every(id=>enabled.includes(id))){for(const id of ['story-butterfly','story-picnic','story-rain','story-ball','colors','shapes'])if(!enabled.includes(id))enabled.push(id);}
 // 0.6: quem usava a seleção completa da 0.5 recebe os novos jogos e histórias; seleções restritas pelo adulto são preservadas.
 const v5=['letters','sounds','build','read','missing','story','animals','rhymes','story-butterfly','story-picnic','story-rain','story-ball','colors','shapes'];
 if((raw.contentVersion||0)<6&&v5.every(id=>enabled.includes(id))){for(const id of ['animal-sounds','odd-one','shadows','memory','sizes','count','story-party','story-night','story-lake'])if(!enabled.includes(id))enabled.push(id);}
 const v6=[...v5,'animal-sounds','odd-one','shadows','memory','sizes','count','story-party','story-night','story-lake'];
 if((raw.contentVersion||0)<7&&v6.every(id=>enabled.includes(id))){for(const id of ['emotions','story-sad','story-bath','story-garden'])if(!enabled.includes(id))enabled.push(id);}
 const sessions=Array.isArray(raw.sessions)?raw.sessions.filter(s=>validSession(s,ids,known)).slice(-1000):[];
 return {...base,profiles,customActivities,enabledActivityIds:enabled.length?enabled:base.enabledActivityIds,activeProfile:ids.has(raw.activeProfile)?raw.activeProfile:profiles[0].id,
  sessions,observations:restoreFamilyObservations(raw.observations,profiles,sessions),
  assignments:Array.isArray(raw.assignments)?raw.assignments.filter(a=>a&&ids.has(a.profileId)&&known.has(a.activityId)&&['pending','done'].includes(a.status)).slice(-100):[],
  settings:{sound:raw.settings?.sound!==false,reducedMotion:raw.settings?.reducedMotion===true,largeText:raw.settings?.largeText===true,sessionMinutes:[5,10,15].includes(raw.settings?.sessionMinutes)?raw.settings.sessionMinutes:10}};
}
export function recordSession(state,{profileId,activityId,rounds,seconds},now=new Date().toISOString()){
 const activity=activityById(state,activityId,{includeDrafts:true});
 if(!state.profiles.some(p=>p.id===profileId)||!activity)throw new Error('Perfil ou atividade inválidos');
 if(!Array.isArray(rounds)||!rounds.length||!rounds.every(validRound)||!Number.isFinite(seconds)||seconds<0||!Number.isFinite(Date.parse(now)))throw new Error('Respostas inválidas');
 const id='session-'+now+'-'+state.sessions.length;
 const session={id,profileId,activityId,activityName:activity.name,supportsSelected:{...state.profiles.find(p=>p.id===profileId).supports},createdAt:now,seconds:Math.max(0,Math.round(seconds)),rounds:rounds.map(r=>({...r}))};
 return {...state,sessions:[...state.sessions,session].slice(-1000),assignments:state.assignments.map(a=>a.profileId===profileId&&a.activityId===activityId&&a.status==='pending'?{...a,status:'done',completedAt:now}:a)};
}
export function profileStats(state,profileId){
 const sessions=state.sessions.filter(s=>s.profileId===profileId);
 const rounds=sessions.flatMap(s=>s.rounds);
 return {sessions,completed:new Set(sessions.map(s=>s.activityId)),total:sessions.length,rounds:rounds.length,
  firstTry:rounds.filter(r=>r.attempts===1).length,helps:rounds.reduce((n,r)=>n+(Number(r.helps)||0),0),seconds:sessions.reduce((n,s)=>n+(Number(s.seconds)||0),0)};
}
export function nextActivity(state,profileId){
 const available=availableActivities(state);
 const pending=state.assignments.find(a=>a.profileId===profileId&&a.status==='pending'&&available.some(x=>x.id===a.activityId));
 if(pending)return available.find(a=>a.id===pending.activityId);
 const done=profileStats(state,profileId).completed;
 return available.find(a=>!done.has(a.id))||available[0];
}
export function addAssignment(state,profileId,activityId,now=new Date().toISOString()){
 if(!state.profiles.some(p=>p.id===profileId)||!availableActivities(state).some(a=>a.id===activityId))throw new Error('Perfil ou atividade inválidos');
 if(state.assignments.some(a=>a.profileId===profileId&&a.activityId===activityId&&a.status==='pending'))return state;
 return {...state,assignments:[...state.assignments,{id:'task-'+now+'-'+state.assignments.length,profileId,activityId,status:'pending',createdAt:now}].slice(-100)};
}
export function csvCell(value){
 let str=String(value??'');
 if(/^[\s]*[=+@-]/.test(str))str="'"+str;
 return '"'+str.replaceAll('"','""')+'"';
}
export function familyBackupJSON(state){return JSON.stringify({format:'lumi-family-backup',version:1,data:state},null,2);}
export function parseFamilyBackup(text){
 if(typeof text!=='string'||text.length>5*1024*1024)throw new Error('Escolha uma cópia da Lumi com até 5 MB.');
 let pack;try{pack=JSON.parse(text);}catch{throw new Error('Este arquivo não é um JSON válido.');}
 if(pack?.format!=='lumi-family-backup'||pack.version!==1||pack.data?.version!==1||!Array.isArray(pack.data.profiles)||!pack.data.profiles.length||!pack.data.profiles.every(p=>p&&typeof p.id==='string'&&p.id&&typeof p.name==='string'&&p.name.trim()))throw new Error('Escolha uma cópia de registros exportada pela Lumi.');
 return restoreState(pack.data);
}
export function sessionsCSV(state,profileId=null){
 const header=['Perfil de demonstração','Atividade','Data','Duração (segundos)','Desafios concluídos','Acertos na primeira tentativa','Pedidos de ajuda'];
 const rows=state.sessions.filter(s=>!profileId||s.profileId===profileId).map(s=>[
  state.profiles.find(p=>p.id===s.profileId)?.name||'Perfil',s.activityName||activityById(state,s.activityId,{includeDrafts:true})?.name||'Atividade',s.createdAt,s.seconds,s.rounds.length,s.rounds.filter(r=>r.attempts===1).length,s.rounds.reduce((n,r)=>n+(r.helps||0),0)]);
 return '\uFEFF'+[header,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
