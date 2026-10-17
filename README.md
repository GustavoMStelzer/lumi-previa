# Lumi — Descobertas em família · 0.7.0

Prévia web para celular. Crianças de 3 a 5 anos brincam acompanhadas por um adulto. Não exige banco de dados, conta nem serviço de IA: os registros ficam no navegador. A voz gravada é produzida separadamente pelo ElevenLabs.

## Novidades da 0.7.0

Veja `NOVIDADES_0.7.0.md`: trilha de hoje, jardim da Lumi, temas do mês, 4 atividades novas (3 histórias e o jogo das emoções), reconto gravado no aparelho e resumo da semana pelo WhatsApp. As 137 gravações foram preservadas; 21 falas novas aguardam geração.

## Novidades da 0.6.0

Veja `NOVIDADES_0.6.0.md`. Em resumo:

- Botão **Continuar** sempre visível numa barra fixa depois do acerto, com a frase "Toque em Continuar.".
- Novo visual, alvos de toque maiores, contraste revisado e textos legíveis no celular.
- 9 atividades novas (sons dos bichos, figura diferente, sombras, memória, grande e pequeno, contar e 3 histórias) e 4 brincadeiras fora da tela.
- Área Brincar organizada pela idade do perfil.
- As 94 gravações existentes foram preservadas. 43 falas novas usam a voz do aparelho até serem geradas.

## O que está incluído

- Hoje, Brincar, Descobertas e Perfil.
- 27 experiências digitais (11 histórias) e 9 convites para brincar fora da tela.
- Trilha de hoje, jardim da Lumi e temas do mês.
- Reconto gravado (fica só no aparelho) e resumo da semana para compartilhar.
- Sugestões por idade e interesses.
- Celebração e botão Continuar após o acerto. O fim do áudio nunca troca a pergunta.
- Apoios por perfil: toques maiores, menos movimento, mais contraste e modo sem som.
- Resumo dos últimos sete dias, com registros do aplicativo separados dos relatos do responsável.
- Cópia e restauração dos registros locais.
- Área adulta de revisão de conteúdo e criação de atividades.
- Mapeamento preliminar à BNCC em `BNCC_MAPEAMENTO.md` (códigos pendentes de conferência).

## Testar e publicar

1. Para atualizar o repositório do GitHub, siga `ATUALIZAR_LUMI.md`. O conteúdo publicado é a pasta `dist`.
2. Abra `PREVIA_LOCAL.html` para um teste rápido sem servidor.
3. Siga `TESTAR_LUMI_v0.7.md` no teste com as famílias.
4. Para gravar as 21 falas novas com a voz da Lumi, siga `GERAR_VOZ_ELEVENLABS.md`.

## Verificação de código

Node.js 24 LTS recomendado, mínimo 20, sem instalação de pacotes:

```sh
npm test
npm run check
npm run audio:catalog
npm run preview:export
```

## Limites desta etapa

Esta é uma prévia para validar a usabilidade. Não há backend, autenticação, sincronização entre aparelhos, assinatura paga nem app nas lojas. Os recontos gravados ficam só no navegador do aparelho e não entram na cópia dos registros. O conteúdo ainda precisa de revisão pedagógica profissional. As adaptações facilitam o acesso, mas não são avaliação clínica. O resumo descreve o uso do aplicativo e os relatos da família, sem medir o desenvolvimento global.
