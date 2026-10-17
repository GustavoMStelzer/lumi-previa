export const ACTIVITIES = [
  {id:'letters',name:'Jardim das letras',category:'Letras',tag:'Primeiras descobertas',icon:'sprout',color:'mint',description:'Ouça e encontre cada letra.',duration:'3 min',skill:'Reconhecimento de letras'},
  {id:'sounds',name:'Detetive dos sons',category:'Letras',tag:'Ouvir e descobrir',icon:'search',color:'peach',description:'Descubra palavras com o mesmo começo.',duration:'4 min',skill:'Sons iniciais das palavras'},
  {id:'build',name:'Oficina de palavras',category:'Palavras',tag:'Juntar e criar',icon:'blocks',color:'butter',description:'Junte as sílabas para construir palavras.',duration:'4 min',skill:'Composição de palavras'},
  {id:'read',name:'Caminho da leitura',category:'Palavras',tag:'Minhas primeiras palavras',icon:'sign',color:'lilac',description:'Leia a palavra e encontre a figura.',duration:'3 min',skill:'Leitura de palavras'},
  {id:'missing',name:'A letra escondida',category:'Palavras',tag:'Completar e descobrir',icon:'puzzle',color:'sky',description:'Uma letra sumiu. Vamos encontrá-la?',duration:'3 min',skill:'Composição e reconhecimento de palavras'},
  {id:'story',name:'Lumi e a sementinha',category:'Histórias',tag:'Leitura acompanhada',icon:'book',color:'rose',description:'Uma história para ler e conversar juntos.',duration:'5 min',skill:'Compreensão de uma história',storyArt:'assets/stories/sementinha.svg',storyAlt:'Lumi no jardim, com uma semente, água e uma planta.'},
  {id:'animals',name:'Amigos do jardim',category:'Conversa',tag:'Ouvir, olhar e descobrir',icon:'heart',color:'mint',description:'Ouça o nome e encontre o bichinho.',duration:'3 min',skill:'Vocabulário e associação de imagens'},
  {id:'rhymes',name:'Palavras que rimam',category:'Sons',tag:'Explorando finais parecidos',icon:'sound',color:'peach',description:'Ouça as palavras e descubra os finais parecidos.',duration:'3 min',skill:'Exploração de rimas'},
  {id:'story-butterfly',name:'Lumi e a borboleta',category:'Histórias',tag:'Uma visita ao jardim',icon:'book',color:'lilac',description:'Acompanhe uma visita, uma flor e uma descoberta.',duration:'4 min',skill:'Escuta e compreensão de uma narrativa',storyArt:'assets/stories/borboleta.svg',storyAlt:'Lumi e uma borboleta em um jardim com flores e árvores.'},
  {id:'story-picnic',name:'O piquenique dos amigos',category:'Histórias',tag:'Um encontro para compartilhar',icon:'book',color:'butter',description:'Descubra o que os amigos levaram para o encontro.',duration:'4 min',skill:'Escuta e identificação de elementos de uma narrativa',storyArt:'assets/stories/piquenique.svg',storyAlt:'Lumi e seus amigos no jardim, com frutas, uma cesta e uma toalha.'},
  {id:'story-rain',name:'A visita da chuva',category:'Histórias',tag:'O jardim depois da chuva',icon:'book',color:'sky',description:'Acompanhe as mudanças no céu e no jardim.',duration:'4 min',skill:'Escuta e compreensão de acontecimentos',storyArt:'assets/stories/chuva.svg',storyAlt:'Lumi no jardim, com nuvens, uma casa, botas e plantas.'},
  {id:'story-ball',name:'A bola que sumiu',category:'Histórias',tag:'Vamos procurar juntos',icon:'book',color:'peach',description:'Lumi e os amigos procuram um brinquedo no jardim.',duration:'4 min',skill:'Escuta e localização de informações de uma narrativa',storyArt:'assets/stories/bola.svg',storyAlt:'Lumi e os amigos no jardim, com uma bola, uma mala, uma bota e plantas.'},
  {id:'colors',name:'As cores do jardim',category:'Cores e formas',tag:'Ouvir e escolher',icon:'star',color:'rose',description:'Ouça o nome da cor e escolha entre as figuras.',duration:'3 min',skill:'Exploração e identificação de cores'},
  {id:'shapes',name:'Formas para descobrir',category:'Cores e formas',tag:'Olhar, ouvir e apontar',icon:'blocks',color:'sky',description:'Descubra círculos, quadrados e outras formas.',duration:'3 min',skill:'Exploração de formas visuais'},
  {id:'animal-sounds',name:'Quem faz esse som?',category:'Sons',tag:'Ouvir e imitar',icon:'paw',color:'butter',description:'Au au, miau, muuu… descubra quem faz cada som.',duration:'3 min',skill:'Escuta, imitação e vocabulário'},
  {id:'odd-one',name:'Qual é diferente?',category:'Olhar e brincar',tag:'Olhar com atenção',icon:'eye',color:'lilac',description:'Três figuras, uma diferente. Você encontra?',duration:'3 min',skill:'Observação e comparação de figuras'},
  {id:'shadows',name:'Sombras do jardim',category:'Olhar e brincar',tag:'Formas e contornos',icon:'moon',color:'sky',description:'Cada figura tem uma sombra. Qual combina?',duration:'3 min',skill:'Percepção de formas e contornos'},
  {id:'memory',name:'Memória da Lumi',category:'Olhar e brincar',tag:'Virar e lembrar',icon:'cards',color:'mint',description:'Vire as cartas e encontre os pares iguais.',duration:'4 min',skill:'Atenção e memória visual'},
  {id:'sizes',name:'Grande e pequeno',category:'Números e tamanhos',tag:'Comparar',icon:'scale',color:'peach',description:'Ouça e toque na figura grande ou pequena.',duration:'2 min',skill:'Comparação de tamanhos'},
  {id:'count',name:'Vamos contar',category:'Números e tamanhos',tag:'Quantidades até 4',icon:'dots',color:'butter',description:'Conte as figuras e encontre a mesma quantidade.',duration:'3 min',skill:'Contagem e relação entre quantidades'},
  {id:'story-party',name:'O aniversário do gato',category:'Histórias',tag:'Uma festa no jardim',icon:'book',color:'rose',description:'Bolo, balão e um presente para o gato.',duration:'4 min',skill:'Escuta e compreensão de uma narrativa',storyArt:'assets/stories/aniversario.svg',storyAlt:'Lumi, o gato, o pato e o sapo no jardim, com um bolo e balões.'},
  {id:'story-night',name:'Hora de dormir',category:'Histórias',tag:'Uma noite tranquila',icon:'book',color:'lilac',description:'A lua apareceu. Lumi se prepara para dormir.',duration:'4 min',skill:'Escuta e sequência da rotina',storyArt:'assets/stories/noite.svg',storyAlt:'Lumi à noite, com a lua, estrelas, um livro e uma cama.'},
  {id:'story-lake',name:'Um passeio no lago',category:'Histórias',tag:'Água, peixe e barco',icon:'book',color:'sky',description:'Lumi e o pato descobrem o que mora no lago.',duration:'4 min',skill:'Escuta e identificação de elementos de uma narrativa',storyArt:'assets/stories/lago.svg',storyAlt:'Lumi e o pato perto de um lago, com um peixe, um barco e uma casa ao longe.'},
  {id:'emotions',name:'Como estou me sentindo?',category:'Sentimentos',tag:'Rostos e emoções',icon:'heart',color:'butter',description:'Olhe os rostos e encontre a emoção.',duration:'3 min',skill:'Reconhecimento de emoções'},
  {id:'story-sad',name:'O gato ficou triste',category:'Histórias',tag:'Amigos cuidam uns dos outros',icon:'book',color:'peach',description:'O vento levou o balão. Como os amigos ajudam?',duration:'4 min',skill:'Escuta e reconhecimento de sentimentos na narrativa',storyArt:'assets/stories/triste.svg',storyAlt:'O gato no jardim com Lumi e o pato; um balão voa longe no céu.'},
  {id:'story-bath',name:'Hora do banho',category:'Histórias',tag:'Espuma e água quentinha',icon:'book',color:'sky',description:'Lumi se suja no jardim e vai tomar banho.',duration:'4 min',skill:'Escuta e sequência da rotina',storyArt:'assets/stories/banho.svg',storyAlt:'Lumi ao lado de uma banheira com espuma, sabonete, toalha e um pato de borracha.'},
  {id:'story-garden',name:'A horta da coruja',category:'Histórias',tag:'Plantar e cuidar',icon:'book',color:'mint',description:'Cenouras, um regador e uma minhoca na terra.',duration:'4 min',skill:'Escuta e identificação de elementos de uma narrativa',storyArt:'assets/stories/horta.svg',storyAlt:'Lumi em uma horta com cenouras, um regador, uma minhoca e uma panela.'}
];

export const LETTERS = [
  {prompt:'Encontre a letra A.',target:'A',options:['A','E','O'],correct:'A',type:'letter'},
  {prompt:'Encontre a letra M.',target:'M',options:['M','N','P'],correct:'M',type:'letter'},
  {prompt:'Encontre a letra B.',target:'B',options:['B','D','P'],correct:'B',type:'letter'},
  {prompt:'Encontre a letra S.',target:'S',options:['S','C','Z'],correct:'S',type:'letter'}
];
export const SOUNDS = [
  {prompt:'Ouça: mala. Qual nome começa com o mesmo som de mala?',reference:'MALA',target:'MALA',options:['MACACO','BOLA','GATO'],correct:'MACACO',type:'sound'},
  {prompt:'Ouça: bola. Qual nome começa com o mesmo som de bola?',reference:'BOLA',target:'BOLA',options:['BOTA','SAPO','MALA'],correct:'BOTA',type:'sound'},
  {prompt:'Ouça: pato. Qual nome começa com o mesmo som de pato?',reference:'PATO',target:'PATO',options:['PANELA','GATO','BOLA'],correct:'PANELA',type:'sound'},
  {prompt:'Ouça: sapo. Qual nome começa com o mesmo som de sapo?',reference:'SAPO',target:'SAPO',options:['SACOLA','PATO','GATO'],correct:'SACOLA',type:'sound'}
];
export const WORDS = [
  {word:'BOLA',pieces:['BO','LA'],options:['BO','LA','MA','TO'],gap:'B_LA',missing:'O',choices:['O','T','R']},
  {word:'GATO',pieces:['GA','TO'],options:['GA','TO','PA','LA'],gap:'GA_O',missing:'T',choices:['T','P','R']},
  {word:'MALA',pieces:['MA','LA'],options:['MA','LA','BO','PO'],gap:'_ALA',missing:'M',choices:['M','J','Z']},
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

export const ANIMALS=[
 {prompt:'Encontre o gato.',target:'GATO',options:['GATO','PATO','SAPO'],correct:'GATO',visuals:{GATO:'GATO',PATO:'PATO',SAPO:'SAPO'},type:'choice'},
 {prompt:'Encontre o pato.',target:'PATO',options:['PATO','GATO','SAPO'],correct:'PATO',visuals:{GATO:'GATO',PATO:'PATO',SAPO:'SAPO'},type:'choice'},
 {prompt:'Encontre o sapo.',target:'SAPO',options:['SAPO','PATO','MACACO'],correct:'SAPO',visuals:{SAPO:'SAPO',PATO:'PATO',MACACO:'MACACO'},type:'choice'},
 {prompt:'Encontre o macaco.',target:'MACACO',options:['MACACO','GATO','PATO'],correct:'MACACO',visuals:{MACACO:'MACACO',GATO:'GATO',PATO:'PATO'},type:'choice'}
];
export const RHYMES=[
 {prompt:'Qual palavra rima com BOLA?',reference:'BOLA',target:'BOLA',options:['SACOLA','GATO','PATO'],correct:'SACOLA',type:'sound'},
 {prompt:'Qual palavra rima com GATO?',reference:'GATO',target:'GATO',options:['PATO','BOLA','MALA'],correct:'PATO',type:'sound'}
];

export const SOUND_DEMO='Vamos escutar o comecinho dos nomes. Bola. Bota. Os dois nomes começam de um jeito parecido. Ouça cada opção antes de escolher. Vamos experimentar?';
export const EXTRA_STORIES={
 'story-butterfly':[
  {text:'Lumi passeava pelo jardim. Uma borboleta apareceu perto dele.',prompt:'Quem apareceu perto de Lumi?',options:['BORBOLETA','GATO','PATO'],correct:'BORBOLETA'},
  {text:'A borboleta pousou em uma flor. Lumi ficou pertinho e olhou a visita.',prompt:'Onde a borboleta pousou?',options:['FLOR','BOLA','MALA'],correct:'FLOR'},
  {text:'Lumi chamou o pato para olhar. Os dois observaram a borboleta na flor.',prompt:'Quem Lumi chamou para olhar?',options:['PATO','GATO','SAPO'],correct:'PATO'},
  {text:'Depois de um tempo, a borboleta voou para outra parte do jardim. Lumi e o pato continuaram olhando as flores.',prompt:'O que Lumi e o pato continuaram olhando?',options:['FLOR','BOTA','SACOLA'],correct:'FLOR'}
 ],
 'story-picnic':[
  {text:'Lumi preparou um piquenique no jardim. Ele colocou uma maçã dentro da cesta.',prompt:'Que fruta Lumi colocou na cesta?',options:['MAÇÃ','BANANA','BOLA'],correct:'MAÇÃ'},
  {text:'O pato chegou para o encontro. Ele trouxe uma banana para o piquenique.',prompt:'O que o pato trouxe?',options:['BANANA','MAÇÃ','BOTA'],correct:'BANANA'},
  {text:'O gato também chegou ao jardim. Ele trouxe água para os amigos beberem.',prompt:'O que o gato trouxe para beber?',options:['ÁGUA','LEITE','SUCO'],correct:'ÁGUA'},
  {text:'Os amigos estenderam uma toalha no chão. Lumi tirou a maçã da cesta e colocou a fruta na toalha.',prompt:'De onde Lumi tirou a maçã?',options:['CESTA','MALA','SACOLA'],correct:'CESTA'}
 ],
 'story-rain':[
  {text:'Lumi estava no jardim quando viu uma nuvem no céu. Logo, algumas gotas de chuva começaram a cair.',prompt:'O que Lumi viu no céu?',options:['NUVEM','FLOR','BOLA'],correct:'NUVEM'},
  {text:'A chuva ficou mais forte. Lumi entrou em casa e observou o jardim pela janela.',prompt:'Onde Lumi entrou quando a chuva ficou forte?',options:['CASA','MALA','CESTA'],correct:'CASA'},
  {text:'Quando a chuva parou, Lumi calçou as botas. Ele saiu para olhar as poças de água.',prompt:'O que Lumi calçou para sair?',options:['BOTA','SACOLA','CESTA'],correct:'BOTA'},
  {text:'A terra do jardim ficou molhada. As plantas receberam a água que veio da chuva.',prompt:'O que molhou a terra do jardim?',options:['ÁGUA','LEITE','SUCO'],correct:'ÁGUA'}
 ],
 'story-ball':[
  {text:'Lumi queria brincar, mas não encontrou sua bola. Ele chamou o gato para ajudar a procurar.',prompt:'Quem Lumi chamou para ajudar?',options:['GATO','PATO','SAPO'],correct:'GATO'},
  {text:'O gato olhou perto da mala. Lumi procurou perto de uma bota. A bola ainda não apareceu.',prompt:'Perto de qual objeto o gato procurou?',options:['MALA','BOTA','SACOLA'],correct:'MALA'},
  {text:'O pato encontrou a bola ao lado de uma planta. Ele chamou Lumi para mostrar onde ela estava.',prompt:'A bola estava ao lado de quê?',options:['PLANTA','MALA','BOTA'],correct:'PLANTA'},
  {text:'Lumi agradeceu aos amigos pela ajuda. Depois, todos foram brincar com a bola no jardim.',prompt:'Com o que os amigos foram brincar?',options:['BOLA','MALA','BOTA'],correct:'BOLA'}
 ]
};
Object.assign(EXTRA_STORIES,{
 'story-party':[
  {text:'Hoje é o aniversário do gato. Lumi preparou um bolo bem bonito.',prompt:'O que Lumi preparou?',options:['BOLO','BOLA','BOTA'],correct:'BOLO'},
  {text:'O pato chegou com um balão amarelo. O balão balançava com o vento.',prompt:'O que o pato trouxe?',options:['BALÃO','MALA','PANELA'],correct:'BALÃO'},
  {text:'O sapo trouxe um presente. Dentro da caixa tinha uma bola nova.',prompt:'O que tinha dentro do presente?',options:['BOLA','BOLO','FLOR'],correct:'BOLA'},
  {text:'Todos cantaram parabéns. O gato soprou a vela e ficou muito feliz.',prompt:'Quem soprou a vela?',options:['GATO','PATO','SAPO'],correct:'GATO'}
 ],
 'story-night':[
  {text:'O céu ficou escuro. Lumi olhou pela janela e viu a lua.',prompt:'O que Lumi viu no céu?',options:['LUA','SOL','BOLA'],correct:'LUA'},
  {text:'Antes de dormir, Lumi tomou um copo de leite quentinho.',prompt:'O que Lumi tomou?',options:['LEITE','SUCO','ÁGUA'],correct:'LEITE'},
  {text:'Lumi escolheu um livro de histórias. Ele olhou as figuras bem devagar.',prompt:'O que Lumi escolheu?',options:['LIVRO','BOLA','CESTA'],correct:'LIVRO'},
  {text:'Lumi deitou na cama, fechou os olhos e dormiu. Boa noite, Lumi!',prompt:'Onde Lumi dormiu?',options:['CAMA','CESTA','BARCO'],correct:'CAMA'}
 ],
 'story-lake':[
  {text:'Lumi e o pato foram passear perto do lago. A água estava calminha.',prompt:'Quem foi passear com Lumi?',options:['PATO','GATO','VACA'],correct:'PATO'},
  {text:'Dentro do lago, Lumi viu um peixe laranja nadando.',prompt:'O que Lumi viu nadando?',options:['PEIXE','VACA','BOLA'],correct:'PEIXE'},
  {text:'Um barco de folha passou pela água. O pato empurrou o barco com o bico.',prompt:'O que passou pela água?',options:['BARCO','CASA','BOTA'],correct:'BARCO'},
  {text:'No fim do passeio, o sol foi embora. Lumi e o pato voltaram para casa.',prompt:'Para onde Lumi e o pato voltaram?',options:['CASA','BARCO','CESTA'],correct:'CASA'}
 ]
});

Object.assign(EXTRA_STORIES,{
 'story-sad':[
  {text:'O gato estava triste. O vento levou o balão dele para longe.',prompt:'O que o vento levou?',options:['BALÃO','BOLA','LIVRO'],correct:'BALÃO'},
  {text:'Lumi sentou perto do gato e deu um abraço bem apertado.',prompt:'Quem deu um abraço no gato?',options:['LUMI','PATO','VACA'],correct:'LUMI'},
  {text:'O pato trouxe uma flor amarela para alegrar o gato.',prompt:'O que o pato trouxe?',options:['FLOR','PEIXE','CAMA'],correct:'FLOR'},
  {text:'O gato sorriu. Com os amigos por perto, o gato ficou feliz de novo.',prompt:'Quem ficou feliz de novo?',options:['GATO','VACA','PEIXE'],correct:'GATO'}
 ],
 'story-bath':[
  {text:'Lumi brincou no jardim e ficou sujinho. Ele entrou na banheira com água quentinha.',prompt:'Onde Lumi entrou?',options:['BANHEIRA','CAMA','BARCO'],correct:'BANHEIRA'},
  {text:'Lumi usou o sabonete e fez muita espuma.',prompt:'O que Lumi usou para fazer espuma?',options:['SABONETE','LIVRO','BOLO'],correct:'SABONETE'},
  {text:'Um pato de borracha boiava na água da banheira.',prompt:'Quem boiava na água?',options:['PATO','VACA','CACHORRO'],correct:'PATO'},
  {text:'No fim, Lumi se enxugou com uma toalha macia.',prompt:'Com o que Lumi se enxugou?',options:['TOALHA','FLOR','MALA'],correct:'TOALHA'}
 ],
 'story-garden':[
  {text:'Lumi foi visitar a horta da coruja. Lá cresciam muitas cenouras.',prompt:'O que crescia na horta?',options:['CENOURA','BOLA','BOTA'],correct:'CENOURA'},
  {text:'A coruja deu um regador para Lumi molhar as plantas.',prompt:'O que a coruja deu para Lumi?',options:['REGADOR','PANELA','LIVRO'],correct:'REGADOR'},
  {text:'Na terra molhada, Lumi viu uma minhoca bem comprida.',prompt:'O que Lumi viu na terra?',options:['MINHOCA','PEIXE','ESTRELA'],correct:'MINHOCA'},
  {text:'Depois, os dois cozinharam as cenouras em uma panela.',prompt:'Onde eles cozinharam as cenouras?',options:['PANELA','CAMA','BARCO'],correct:'PANELA'}
 ]
});
export const EMOTIONS=[
 {prompt:'Encontre o rosto feliz.',options:['FELIZ','TRISTE','BRAVO'],correct:'FELIZ'},
 {prompt:'Encontre o rosto triste.',options:['TRISTE','FELIZ','ASSUSTADO'],correct:'TRISTE'},
 {prompt:'Encontre o rosto bravo.',options:['BRAVO','FELIZ','TRISTE'],correct:'BRAVO'},
 {prompt:'Encontre o rosto assustado.',options:['ASSUSTADO','BRAVO','FELIZ'],correct:'ASSUSTADO'}
];

// Temas do mês: organizam as sugestões. Todas as atividades continuam disponíveis em Brincar.
export const THEMES=[
 {id:'bichos',name:'Bichos e amigos',description:'Sons, cores e histórias dos bichos do jardim.',icon:'paw',activities:['animals','animal-sounds','story-butterfly','story-party','story-sad','memory','rhymes'],offline:['outside-animals','outside-listen']},
 {id:'rotina',name:'Meu dia a dia',description:'Banho, comida, sono e as pequenas tarefas do dia.',icon:'clock',activities:['story-bath','story-night','story-picnic','count','sizes','shapes'],offline:['outside-objects','outside-count']},
 {id:'natureza',name:'Natureza e água',description:'Chuva, lago, horta e o que cresce na terra.',icon:'leaf',activities:['story','story-rain','story-lake','story-garden','colors','shadows','odd-one'],offline:['outside-colors','outside-dance']},
 {id:'sentimentos',name:'Sentimentos e amizade',description:'Reconhecer emoções e cuidar dos amigos.',icon:'heart',activities:['emotions','story-sad','story-ball','story-party','odd-one','memory'],offline:['outside-story','outside-draw']}
];
export function themeForDate(date=new Date()){return THEMES[new Date(date).getMonth()%THEMES.length];}

// Brincadeiras por imagem: cada opção tem um identificador único e uma figura.
// mode: 'shadow' mostra só o contorno; 'big'/'small' mudam o tamanho; count repete a figura.
const NUMBER_WORDS=['zero','um','dois','três','quatro','cinco'];
const art=(key,extra={})=>({key,...extra});
export const LOOK_AND_PLAY={
 'odd-one':[
  {prompt:'Qual figura é diferente das outras?',options:['GATO~1','GATO~2','PATO'],correct:'PATO',art:{'GATO~1':art('GATO'),'GATO~2':art('GATO'),PATO:art('PATO')},labels:{'GATO~1':'gato','GATO~2':'gato',PATO:'pato'}},
  {prompt:'Qual figura é diferente das outras?',options:['FLOR~1','BOLA','FLOR~2'],correct:'BOLA',art:{'FLOR~1':art('FLOR'),'FLOR~2':art('FLOR'),BOLA:art('BOLA')},labels:{'FLOR~1':'flor','FLOR~2':'flor',BOLA:'bola'}},
  {prompt:'Qual figura é diferente das outras?',options:['ESTRELA~1','LUA','ESTRELA~2'],correct:'LUA',art:{'ESTRELA~1':art('ESTRELA'),'ESTRELA~2':art('ESTRELA'),LUA:art('LUA')},labels:{'ESTRELA~1':'estrela','ESTRELA~2':'estrela',LUA:'lua'}},
  {prompt:'Qual figura é diferente das outras?',options:['PEIXE~1','PEIXE~2','BARCO'],correct:'BARCO',art:{'PEIXE~1':art('PEIXE'),'PEIXE~2':art('PEIXE'),BARCO:art('BARCO')},labels:{'PEIXE~1':'peixe','PEIXE~2':'peixe',BARCO:'barco'}}
 ],
 shadows:[
  {prompt:'Encontre a sombra do gato.',reference:art('GATO'),options:['GATO','PATO','MACACO'],correct:'GATO',art:{GATO:art('GATO',{mode:'shadow'}),PATO:art('PATO',{mode:'shadow'}),MACACO:art('MACACO',{mode:'shadow'})},labels:{GATO:'sombra 1',PATO:'sombra 2',MACACO:'sombra 3'}},
  {prompt:'Encontre a sombra da borboleta.',reference:art('BORBOLETA'),options:['BORBOLETA','FLOR','PEIXE'],correct:'BORBOLETA',art:{BORBOLETA:art('BORBOLETA',{mode:'shadow'}),FLOR:art('FLOR',{mode:'shadow'}),PEIXE:art('PEIXE',{mode:'shadow'})},labels:{BORBOLETA:'sombra 1',FLOR:'sombra 2',PEIXE:'sombra 3'}},
  {prompt:'Encontre a sombra do barco.',reference:art('BARCO'),options:['BARCO','CASA','BOTA'],correct:'BARCO',art:{BARCO:art('BARCO',{mode:'shadow'}),CASA:art('CASA',{mode:'shadow'}),BOTA:art('BOTA',{mode:'shadow'})},labels:{BARCO:'sombra 1',CASA:'sombra 2',BOTA:'sombra 3'}},
  {prompt:'Encontre a sombra da estrela.',reference:art('ESTRELA'),options:['ESTRELA','LUA','SOL'],correct:'ESTRELA',art:{ESTRELA:art('ESTRELA',{mode:'shadow'}),LUA:art('LUA',{mode:'shadow'}),SOL:art('SOL',{mode:'shadow'})},labels:{ESTRELA:'sombra 1',LUA:'sombra 2',SOL:'sombra 3'}}
 ],
 sizes:[
  {prompt:'Toque no peixe grande.',options:['PEIXE~big','PEIXE~small'],correct:'PEIXE~big',art:{'PEIXE~big':art('PEIXE',{mode:'big'}),'PEIXE~small':art('PEIXE',{mode:'small'})},labels:{'PEIXE~big':'peixe grande','PEIXE~small':'peixe pequeno'}},
  {prompt:'Toque na bola pequena.',options:['BOLA~big','BOLA~small'],correct:'BOLA~small',art:{'BOLA~big':art('BOLA',{mode:'big'}),'BOLA~small':art('BOLA',{mode:'small'})},labels:{'BOLA~big':'bola grande','BOLA~small':'bola pequena'}},
  {prompt:'Toque no balão grande.',options:['BALÃO~big','BALÃO~small'],correct:'BALÃO~big',art:{'BALÃO~big':art('BALÃO',{mode:'big'}),'BALÃO~small':art('BALÃO',{mode:'small'})},labels:{'BALÃO~big':'balão grande','BALÃO~small':'balão pequeno'}},
  {prompt:'Toque na estrela pequena.',options:['ESTRELA~big','ESTRELA~small'],correct:'ESTRELA~small',art:{'ESTRELA~big':art('ESTRELA',{mode:'big'}),'ESTRELA~small':art('ESTRELA',{mode:'small'})},labels:{'ESTRELA~big':'estrela grande','ESTRELA~small':'estrela pequena'}}
 ],
 count:[
  {prompt:'Conte as estrelas. Qual cartão tem a mesma quantidade?',reference:art('ESTRELA',{count:2}),options:['N1','N2','N3'],correct:'N2'},
  {prompt:'Conte as maçãs. Qual cartão tem a mesma quantidade?',reference:art('MAÇÃ',{count:3}),options:['N2','N3','N4'],correct:'N3'},
  {prompt:'Conte os balões. Qual cartão tem a mesma quantidade?',reference:art('BALÃO',{count:1}),options:['N1','N2','N3'],correct:'N1'},
  {prompt:'Conte os peixes. Qual cartão tem a mesma quantidade?',reference:art('PEIXE',{count:4}),options:['N3','N4','N2'],correct:'N4'}
 ].map(q=>({...q,art:Object.fromEntries(q.options.map(o=>[o,{dots:Number(o.slice(1))}])),labels:Object.fromEntries(q.options.map(o=>[o,NUMBER_WORDS[Number(o.slice(1))]])),say:Object.fromEntries(q.options.map(o=>[o,NUMBER_WORDS[Number(o.slice(1))]]))}))
};
export const ANIMAL_SOUNDS=[
 {prompt:'Quem faz au au?',options:['CACHORRO','GATO','VACA'],correct:'CACHORRO'},
 {prompt:'Quem faz miau?',options:['GATO','PATO','CACHORRO'],correct:'GATO'},
 {prompt:'Quem faz quá quá?',options:['PATO','VACA','SAPO'],correct:'PATO'},
 {prompt:'Quem faz muuu?',options:['VACA','CACHORRO','PATO'],correct:'VACA'}
];
export const MEMORY_ROUNDS=[
 {prompt:'Vire as cartas e encontre os pares iguais.',pairs:['GATO','PATO']},
 {prompt:'Vire as cartas e encontre os pares iguais.',pairs:['SOL','LUA','ESTRELA']}
];
export const MEMORY_NAMES={GATO:'gato',PATO:'pato',SOL:'sol',LUA:'lua',ESTRELA:'estrela'};

export const EARLY_PLAY={
 colors:[
  {prompt:'Toque na cor vermelha.',options:['VERMELHO','AZUL','AMARELO'],correct:'VERMELHO'},
  {prompt:'Toque na cor azul.',options:['AZUL','VERDE','VERMELHO'],correct:'AZUL'},
  {prompt:'Toque na cor amarela.',options:['AMARELO','AZUL','VERDE'],correct:'AMARELO'},
  {prompt:'Toque na cor verde.',options:['VERDE','AMARELO','VERMELHO'],correct:'VERDE'}
 ],
 shapes:[
  {prompt:'Encontre o círculo.',options:['CÍRCULO','QUADRADO','TRIÂNGULO'],correct:'CÍRCULO'},
  {prompt:'Encontre o quadrado.',options:['QUADRADO','CÍRCULO','RETÂNGULO'],correct:'QUADRADO'},
  {prompt:'Encontre o triângulo.',options:['TRIÂNGULO','QUADRADO','CÍRCULO'],correct:'TRIÂNGULO'},
  {prompt:'Encontre o retângulo.',options:['RETÂNGULO','CÍRCULO','TRIÂNGULO'],correct:'RETÂNGULO'}
 ]
};

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
    case 'animals':data=ANIMALS;break;
    case 'rhymes':data=RHYMES;break;
    case 'emotions':data=EMOTIONS.map(q=>({...q,type:'choice',target:q.prompt}));break;
    case 'animal-sounds':data=ANIMAL_SOUNDS.map(q=>({...q,type:'choice',target:q.prompt}));break;
    case 'memory':return MEMORY_ROUNDS.map(r=>({type:'memory',prompt:r.prompt,target:r.prompt,pairs:[...r.pairs],cards:shuffle(r.pairs.flatMap(k=>[k+'~a',k+'~b']),rng),options:[],correct:'pairs'}));
    default:if(LOOK_AND_PLAY[id])data=LOOK_AND_PLAY[id].map(q=>({...q,type:'see',target:q.prompt}));else if(EXTRA_STORIES[id])data=EXTRA_STORIES[id].map(q=>({...q,type:'story',target:q.text+' '+q.prompt}));else if(EARLY_PLAY[id])data=EARLY_PLAY[id].map(q=>({...q,type:'choice',target:q.correct}));else throw new Error('Atividade desconhecida');
  }
  return data.map(q=>({...q,options:shuffle(q.options,rng),correct:Array.isArray(q.correct)?[...q.correct]:q.correct}));
}
export function answerIsCorrect(question,answer){
  return Array.isArray(question.correct)
    ? Array.isArray(answer)&&answer.length===question.correct.length&&answer.every((x,i)=>x===question.correct[i])
    : answer===question.correct;
}
