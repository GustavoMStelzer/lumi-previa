import {WORD_ART} from './illustrations.js';
import {ACTIVITIES,makeQuestions,shuffle} from './content.js';

export const TEMPLATES=[
 {id:'choice',name:'Escolha uma resposta',description:'Uma pergunta, imagens ou palavras e uma resposta correta.',icon:'search',color:'peach'},
 {id:'build',name:'Monte com sílabas',description:'Escolha a palavra, suas sílabas e as opções para experimentar.',icon:'blocks',color:'butter'},
 {id:'story',name:'História com perguntas',description:'Um trecho de história acompanhado de uma pergunta.',icon:'book',color:'rose'}
];
export const VISUALS=[...Object.keys(WORD_ART),'🐶','🐻','🐰','🦋','🐝','🍎','🍌','🌞','⭐','❤️','🏠','🚗','🎈','🔵','🟡','🟢'];
export const WRONG_FEEDBACK={default:'Vamos olhar de novo? Você pode ouvir a dica e tentar outra vez.',build:'Vamos ajustar as sílabas? Você pode desfazer e ouvir a palavra.'};
const text=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const demand=(condition,message)=>{if(!condition)throw new Error(message);};
const safeVisual=value=>VISUALS.includes(value)?value:'';

export function validateTeachingActivity(raw){
 demand(raw&&typeof raw==='object','A atividade está vazia.');
 const template=TEMPLATES.find(t=>t.id===raw.template);
 demand(template,'Escolha um dos modelos disponíveis.');
 const name=text(raw.name,70),skill=text(raw.skill,100);
 demand(name.length>=3,'Dê à atividade um título com pelo menos 3 caracteres.');
 demand(skill.length>=3,'Informe o objetivo da atividade.');
 demand(Array.isArray(raw.questions)&&raw.questions.length>=1&&raw.questions.length<=12,'Inclua de 1 a 12 desafios.');
 const questions=raw.questions.map((q,index)=>{
  demand(q&&typeof q==='object',`Confira o desafio ${index+1}.`);
  const prefix=`Desafio ${index+1}: `,prompt=text(q.prompt,250);
  demand(prompt.length>=3,prefix+'escreva uma instrução ou pergunta.');
  if(template.id==='build'){
   const target=text(q.target,30).toLocaleUpperCase('pt-BR');
   const correct=Array.isArray(q.correct)?q.correct.map(s=>text(s,10).toLocaleUpperCase('pt-BR')):[];
   const options=Array.isArray(q.options)?q.options.map(s=>text(s,10).toLocaleUpperCase('pt-BR')):[];
   demand(target&&correct.length>=2&&correct.length<=6&&correct.every(Boolean),prefix+'informe a palavra e de 2 a 6 sílabas.');
   demand(correct.join('')===target,prefix+'as sílabas, na ordem, precisam formar a palavra.');
   demand(options.length>=correct.length&&options.length<=8&&options.every(Boolean),prefix+'use até 8 opções de sílabas.');
   const remaining=[...options];
   for(const part of correct){const i=remaining.indexOf(part);demand(i>=0,prefix+'inclua todas as sílabas da palavra nas opções.');remaining.splice(i,1);}
   return {type:'build',prompt,target,correct,options,slots:correct.length,visual:safeVisual(q.visual)};
  }
  const options=Array.isArray(q.options)?q.options.map(v=>text(v,40)):[];
  demand(options.length>=2&&options.length<=4&&options.every(Boolean),prefix+'preencha de 2 a 4 respostas.');
  demand(new Set(options.map(v=>v.toLocaleLowerCase('pt-BR'))).size===options.length,prefix+'as opções precisam ser diferentes.');
  const correct=text(q.correct,40);
  demand(options.includes(correct),prefix+'marque a resposta correta.');
  const visuals=Object.fromEntries(options.map(v=>[v,safeVisual(q.visuals?.[v])]));
  const common={type:template.id,prompt,target:prompt,options,correct,visuals};
  if(template.id==='story'){
   const story=text(q.text,1200);
   demand(story.length>=10,prefix+'escreva um trecho de história com pelo menos 10 caracteres.');
   return {...common,text:story,visual:safeVisual(q.visual),scene:'seed',target:story+' '+prompt};
  }
  return common;
 });
 const id=text(raw.id,90);
 demand(/^teacher-[A-Za-z0-9_-]{1,80}$/.test(id),'O identificador da atividade está inválido.');
 return {id,name,skill,description:text(raw.description,200)||'Uma atividade preparada pela professora.',age:['3','4','5','mixed'].includes(raw.age)?raw.age:'mixed',template:template.id,published:raw.published===true,questions,category:template.id==='story'?'Histórias':template.id==='build'?'Palavras':'Da professora',tag:'Preparada pela professora',icon:template.icon,color:template.color,duration:questions.length+' desafios',updatedAt:typeof raw.updatedAt==='string'&&Number.isFinite(Date.parse(raw.updatedAt))?raw.updatedAt:new Date().toISOString()};
}

export function restoreTeachingActivities(raw){
 if(!Array.isArray(raw))return [];
 const items=[],seen=new Set();
 for(const entry of raw.slice(0,50)){try{const item=validateTeachingActivity(entry);if(!seen.has(item.id)){seen.add(item.id);items.push(item);}}catch{}}
 return items;
}
export function allActivities(state,{includeDrafts=false}={}){
 return [...ACTIVITIES,...(state.customActivities||[]).filter(a=>includeDrafts||a.published)];
}
export function activityById(state,id,options){return allActivities(state,options).find(a=>a.id===id);}
export function availableActivities(state){
 const ids=new Set(state.enabledActivityIds||ACTIVITIES.map(a=>a.id));
 return allActivities(state).filter(a=>ids.has(a.id));
}
export function setAvailableActivities(state,ids){
 demand(Array.isArray(ids),'Selecione as atividades.');
 const known=new Set(allActivities(state).map(a=>a.id));
 const enabledActivityIds=[...new Set(ids)].filter(id=>known.has(id));
 demand(enabledActivityIds.length,'Mantenha pelo menos uma atividade disponível.');
 return {...state,enabledActivityIds};
}
export function saveTeachingActivity(state,raw){
 const activity=validateTeachingActivity(raw),previous=(state.customActivities||[]).find(a=>a.id===activity.id);
 demand(previous||(state.customActivities||[]).length<50,'A prévia permite até 50 atividades próprias.');
 const customActivities=[...(state.customActivities||[]).filter(a=>a.id!==activity.id),activity];
 const enabled=new Set(state.enabledActivityIds||ACTIVITIES.map(a=>a.id));
 if(activity.published&&!previous?.published)enabled.add(activity.id);
 if(!activity.published)enabled.delete(activity.id);
 return {...state,customActivities,enabledActivityIds:[...enabled]};
}
export function questionsForActivity(state,id,rng=Math.random){
 const activity=activityById(state,id,{includeDrafts:true});
 demand(activity,'Atividade não encontrada.');
 if(!activity.template)return makeQuestions(id,rng);
 return activity.questions.map(q=>({...q,options:shuffle(q.options,rng),correct:Array.isArray(q.correct)?[...q.correct]:q.correct,visuals:q.visuals?{...q.visuals}:undefined}));
}
export function newTeachingDraft(template='choice',id='teacher-'+Date.now().toString(36)){
 return {id,template,name:'',skill:'',description:'',age:'mixed',published:false,questions:[blankQuestion(template)]};
}
export function blankQuestion(template){
 if(template==='build')return {type:'build',prompt:'Monte a palavra BOLA.',target:'BOLA',correct:['BO','LA'],options:['BO','LA','MA','TO'],visual:'BOLA'};
 return {type:template,prompt:'',options:['','',''],correct:'',visuals:{},...(template==='story'?{text:'',visual:'SEMENTE'}:{})};
}
export function exportTeachingPack(state){
 return JSON.stringify({format:'lumi-teacher-pack',version:1,activities:state.customActivities,enabledActivityIds:state.enabledActivityIds},null,2);
}
export function parseTeachingPack(raw){
 demand(typeof raw==='string'&&raw.length<1024*1024,'Use um arquivo de atividades da Lumi com até 1 MB.');
 let pack;try{pack=JSON.parse(raw);}catch{throw new Error('O arquivo não é um pacote válido da Lumi.');}
 demand(pack?.format==='lumi-teacher-pack'&&pack.version===1&&Array.isArray(pack.activities),'Escolha um pacote de atividades exportado pela Lumi.');
 demand(pack.activities.length<=50,'O pacote excede 50 atividades.');
 const activities=pack.activities.map(validateTeachingActivity);
 demand(new Set(activities.map(a=>a.id)).size===activities.length,'O pacote contém identificadores repetidos.');
 return {activities,enabledActivityIds:Array.isArray(pack.enabledActivityIds)?pack.enabledActivityIds.filter(id=>typeof id==='string'):[]};
}
export function importTeachingPack(state,pack){
 let next={...state};
 for(const activity of pack.activities)next=saveTeachingActivity(next,activity);
 // A importação adiciona as atividades selecionadas no pacote e preserva a seleção local.
 const allowed=new Set(pack.enabledActivityIds),enabled=new Set(state.enabledActivityIds);
 for(const activity of pack.activities)if(activity.published&&allowed.has(activity.id))enabled.add(activity.id);
 next.enabledActivityIds=[...enabled].filter(id=>activityById(next,id));
 if(!next.enabledActivityIds.length)next.enabledActivityIds=ACTIVITIES.map(a=>a.id);
 return next;
}
