import {ACTIVITIES} from './content.js';
export const STORAGE_KEY='lumi-demo-v1';
const validActivities=new Set(ACTIVITIES.map(a=>a.id));
const validRound=r=>r&&typeof r.prompt==='string'&&typeof r.answer==='string'&&Number.isInteger(r.attempts)&&r.attempts>0&&Number.isInteger(r.helps)&&r.helps>=0;
const validSession=(s,ids)=>s&&ids.has(s.profileId)&&validActivities.has(s.activityId)&&Array.isArray(s.rounds)&&s.rounds.length>0&&s.rounds.every(validRound)&&Number.isFinite(s.seconds)&&s.seconds>=0&&typeof s.createdAt==='string'&&Number.isFinite(Date.parse(s.createdAt));
export function createState(){
 return {version:1,activeProfile:'explorador-1',profiles:[{id:'explorador-1',name:'Explorador 1',avatar:'fox'},{id:'explorador-2',name:'Explorador 2',avatar:'cat'},{id:'explorador-3',name:'Explorador 3',avatar:'frog'}],sessions:[],assignments:[],settings:{sound:true,reducedMotion:false,largeText:false,sessionMinutes:10}};
}
export function restoreState(raw){
 const base=createState();
 if(!raw||raw.version!==1||!Array.isArray(raw.profiles)||!raw.profiles.length)return base;
 const seen=new Set();
 const profiles=raw.profiles.filter(p=>p&&typeof p.id==='string'&&p.id&&typeof p.name==='string'&&p.name.trim()&&!seen.has(p.id)&&seen.add(p.id)).slice(0,30).map(p=>({id:p.id,name:p.name.slice(0,30),avatar:['fox','cat','frog','owl'].includes(p.avatar)?p.avatar:'fox'}));
 if(!profiles.length)return base;
 const ids=new Set(profiles.map(p=>p.id));
 return {...base,profiles,activeProfile:ids.has(raw.activeProfile)?raw.activeProfile:profiles[0].id,
  sessions:Array.isArray(raw.sessions)?raw.sessions.filter(s=>validSession(s,ids)).slice(-1000):[],
  assignments:Array.isArray(raw.assignments)?raw.assignments.filter(a=>a&&ids.has(a.profileId)&&validActivities.has(a.activityId)&&['pending','done'].includes(a.status)).slice(-100):[],
  settings:{sound:raw.settings?.sound!==false,reducedMotion:raw.settings?.reducedMotion===true,largeText:raw.settings?.largeText===true,sessionMinutes:[5,10,15].includes(raw.settings?.sessionMinutes)?raw.settings.sessionMinutes:10}};
}
export function recordSession(state,{profileId,activityId,rounds,seconds},now=new Date().toISOString()){
 if(!state.profiles.some(p=>p.id===profileId)||!validActivities.has(activityId))throw new Error('Perfil ou atividade inválidos');
 if(!Array.isArray(rounds)||!rounds.length||!rounds.every(validRound)||!Number.isFinite(seconds)||seconds<0||!Number.isFinite(Date.parse(now)))throw new Error('Respostas inválidas');
 const id='session-'+now+'-'+state.sessions.length;
 const session={id,profileId,activityId,createdAt:now,seconds:Math.max(0,Math.round(seconds)),rounds:rounds.map(r=>({...r}))};
 return {...state,sessions:[...state.sessions,session].slice(-1000),assignments:state.assignments.map(a=>a.profileId===profileId&&a.activityId===activityId&&a.status==='pending'?{...a,status:'done',completedAt:now}:a)};
}
export function profileStats(state,profileId){
 const sessions=state.sessions.filter(s=>s.profileId===profileId);
 const rounds=sessions.flatMap(s=>s.rounds);
 return {sessions,completed:new Set(sessions.map(s=>s.activityId)),total:sessions.length,rounds:rounds.length,
  firstTry:rounds.filter(r=>r.attempts===1).length,helps:rounds.reduce((n,r)=>n+(Number(r.helps)||0),0),seconds:sessions.reduce((n,s)=>n+(Number(s.seconds)||0),0)};
}
export function nextActivity(state,profileId){
 const pending=state.assignments.find(a=>a.profileId===profileId&&a.status==='pending');
 if(pending)return ACTIVITIES.find(a=>a.id===pending.activityId);
 const done=profileStats(state,profileId).completed;
 return ACTIVITIES.find(a=>!done.has(a.id))||ACTIVITIES[0];
}
export function addAssignment(state,profileId,activityId,now=new Date().toISOString()){
 if(!state.profiles.some(p=>p.id===profileId)||!validActivities.has(activityId))throw new Error('Perfil ou atividade inválidos');
 if(state.assignments.some(a=>a.profileId===profileId&&a.activityId===activityId&&a.status==='pending'))return state;
 return {...state,assignments:[...state.assignments,{id:'task-'+now+'-'+state.assignments.length,profileId,activityId,status:'pending',createdAt:now}].slice(-100)};
}
export function csvCell(value){
 let str=String(value??'');
 if(/^[\s]*[=+@-]/.test(str))str="'"+str;
 return '"'+str.replaceAll('"','""')+'"';
}
export function sessionsCSV(state,profileId=null){
 const header=['Perfil de demonstração','Atividade','Data','Duração (segundos)','Desafios concluídos','Acertos na primeira tentativa','Pedidos de ajuda'];
 const rows=state.sessions.filter(s=>!profileId||s.profileId===profileId).map(s=>[
  state.profiles.find(p=>p.id===s.profileId)?.name||'Perfil',ACTIVITIES.find(a=>a.id===s.activityId).name,s.createdAt,s.seconds,s.rounds.length,s.rounds.filter(r=>r.attempts===1).length,s.rounds.reduce((n,r)=>n+(r.helps||0),0)]);
 return '\uFEFF'+[header,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
