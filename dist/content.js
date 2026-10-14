export const ACTIVITIES = [
  {id:'letters',name:'Jardim das letras',category:'Letras',tag:'Primeiras descobertas',icon:'sprout',color:'mint',description:'Ouça e encontre cada letra.',duration:'3 min',skill:'Reconhecimento de letras'},
  {id:'sounds',name:'Detetive dos sons',category:'Letras',tag:'Ouvir e descobrir',icon:'search',color:'peach',description:'Descubra palavras com o mesmo começo.',duration:'4 min',skill:'Sons iniciais das palavras'},
  {id:'build',name:'Oficina de palavras',category:'Palavras',tag:'Juntar e criar',icon:'blocks',color:'butter',description:'Junte as sílabas para construir palavras.',duration:'4 min',skill:'Composição de palavras'},
  {id:'read',name:'Caminho da leitura',category:'Palavras',tag:'Minhas primeiras palavras',icon:'sign',color:'lilac',description:'Leia a palavra e encontre a figura.',duration:'3 min',skill:'Leitura de palavras'},
  {id:'missing',name:'A letra escondida',category:'Palavras',tag:'Completar e descobrir',icon:'puzzle',color:'sky',description:'Uma letra sumiu. Vamos encontrá-la?',duration:'3 min',skill:'Composição e reconhecimento de palavras'},
  {id:'story',name:'Lumi e a sementinha',category:'Histórias',tag:'Leitura acompanhada',icon:'book',color:'rose',description:'Uma história para ler e conversar juntos.',duration:'5 min',skill:'Compreensão de uma história'}
];

export const LETTERS = [
  {prompt:'Encontre a letra A.',target:'A',options:['A','E','O'],correct:'A',type:'letter'},
  {prompt:'Encontre a letra M.',target:'M',options:['M','N','P'],correct:'M',type:'letter'},
  {prompt:'Encontre a letra B.',target:'B',options:['B','D','P'],correct:'B',type:'letter'},
  {prompt:'Encontre a letra S.',target:'S',options:['S','C','Z'],correct:'S',type:'letter'}
];
export const SOUNDS = [
  {prompt:'Qual palavra começa como MALA?',reference:'MALA',target:'MALA',options:['MACACO','BOLA','GATO'],correct:'MACACO',type:'sound'},
  {prompt:'Qual palavra começa como BOLA?',reference:'BOLA',target:'BOLA',options:['BOTA','SAPO','MALA'],correct:'BOTA',type:'sound'},
  {prompt:'Qual palavra começa como PATO?',reference:'PATO',target:'PATO',options:['PANELA','GATO','BOLA'],correct:'PANELA',type:'sound'},
  {prompt:'Qual palavra começa como SAPO?',reference:'SAPO',target:'SAPO',options:['SACOLA','PATO','GATO'],correct:'SACOLA',type:'sound'}
];
export const WORDS = [
  {word:'BOLA',pieces:['BO','LA'],options:['BO','LA','MA','TO'],gap:'B_LA',missing:'O',choices:['O','A','E']},
  {word:'GATO',pieces:['GA','TO'],options:['GA','TO','PA','LA'],gap:'GA_O',missing:'T',choices:['T','P','M']},
  {word:'MALA',pieces:['MA','LA'],options:['MA','LA','BO','PO'],gap:'_ALA',missing:'M',choices:['M','B','S']},
  {word:'SAPO',pieces:['SA','PO'],options:['SA','PO','GA','TO'],gap:'SA_O',missing:'P',choices:['P','T','L']}
];
export const READING = [
  {prompt:'Qual figura combina com esta palavra?',target:'BOLA',options:['BOLA','GATO','PATO'],correct:'BOLA',type:'read'},
  {prompt:'Qual figura combina com esta palavra?',target:'GATO',options:['GATO','MALA','BOLA'],correct:'GATO',type:'read'},
  {prompt:'Qual figura combina com esta palavra?',target:'MALA',options:['MALA','SAPO','GATO'],correct:'MALA',type:'read'},
  {prompt:'Qual figura combina com esta palavra?',target:'SAPO',options:['SAPO','BOLA','PATO'],correct:'SAPO',type:'read'}
];
export const STORY = [
  {text:'Lumi encontrou uma semente no jardim.\nEle colocou a semente na terra.',prompt:'O que Lumi encontrou?',target:'Lumi encontrou uma semente no jardim. Ele colocou a semente na terra.',options:['SEMENTE','BOLA','MALA'],correct:'SEMENTE',scene:'seed',type:'story'},
  {text:'Lumi levou água para o jardim.\nA terra ficou molhada.',prompt:'O que Lumi levou para o jardim?',target:'Lumi levou água para o jardim. A terra ficou molhada.',options:['ÁGUA','LEITE','SUCO'],correct:'ÁGUA',scene:'water',type:'story'},
  {text:'Depois de alguns dias, nasceu uma planta.\nLumi chamou seus amigos para olhar.',prompt:'O que nasceu no jardim?',target:'Depois de alguns dias, nasceu uma planta. Lumi chamou seus amigos para olhar.',options:['PLANTA','BOLA','PATO'],correct:'PLANTA',scene:'plant',type:'story'}
];

export function shuffle(values,rng=Math.random) {
  const copy=[...values];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
export function makeQuestions(id,rng=Math.random) {
  let data;
  switch(id){
    case 'letters':data=LETTERS;break;
    case 'sounds':data=SOUNDS;break;
    case 'build':data=WORDS.map(w=>({prompt:`Monte a palavra ${w.word}.`,target:w.word,options:w.options,correct:w.pieces,slots:w.pieces.length,type:'build'}));break;
    case 'read':data=READING;break;
    case 'missing':data=WORDS.map(w=>({prompt:`Qual letra completa ${w.word}?`,target:w.word,gap:w.gap,options:w.choices,correct:w.missing,type:'missing'}));break;
    case 'story':data=STORY;break;
    default:throw new Error('Atividade desconhecida');
  }
  return data.map(q=>({...q,options:shuffle(q.options,rng),correct:Array.isArray(q.correct)?[...q.correct]:q.correct}));
}
export function answerIsCorrect(question,answer){
  return Array.isArray(question.correct)
    ? Array.isArray(answer)&&answer.length===question.correct.length&&answer.every((x,i)=>x===question.correct[i])
    : answer===question.correct;
}
