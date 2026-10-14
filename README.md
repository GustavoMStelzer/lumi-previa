# Lumi — Aventuras de leitura

Primeira versão navegável de uma plataforma de apoio à alfabetização para famílias e escolas. Identidade e preços são provisórios. Público da trilha demonstrada: aproximadamente 5 a 7 anos, com acompanhamento de adulto e adaptação profissional às habilidades individuais.

## Funcionalidades

- Cinco jogos com quatro desafios cada: reconhecimento de letras, sons iniciais de palavras, montagem com sílabas, associação de palavra escrita e imagem, preenchimento de letras.
- História original com três páginas, narração pelo dispositivo e perguntas de compreensão.
- Registros independentes por perfil fictício, persistidos no navegador.
- Painel da família, turma demonstrativa, sugestões de atividades e exportação CSV.
- Atividade imprimível, áudio opcional, redução de movimento, texto maior, lembrete de pausa e cache offline.
- Interface responsiva, instruções em português, alternativas a gestos de arrastar e navegação por teclado.
- Prévia da voz feminina enviada do ElevenLabs, acessível em **Ouvir a voz da Lumi**.
- Formulário de avaliação pedagógica em **Escola → Avaliar a prévia**, com download das observações.

## Prévia para GitHub e avaliação

Consulte `COMO_PUBLICAR_GITHUB.md` para publicar pelo GitHub Pages e `AVALIACAO_PROFESSORA.md` para o roteiro de avaliação. O workflow em `.github/workflows/pages.yml` publica `dist/`.

O pacote de entrega inclui `PREVIA_LOCAL.html`, com código, imagens e MP3 incorporados, para abrir no navegador do computador sem instalar dependências.

A gravação foi incorporada integralmente como prévia independente. Nenhum trecho foi atribuído a uma instrução sem confirmar seu conteúdo. A estrutura aceita MP3 para cada fala e usa a voz do navegador quando o arquivo correspondente ainda não existe.

`node scripts/audio-catalog.mjs` produz o roteiro com as 39 falas únicas usadas nas atividades, dicas e retornos. Salve os MP3 com os nomes indicados em `dist/assets/audio/` e execute esse comando novamente para atualizar `audio-manifest.js`.

Para gerar todas as falas de uma vez com a voz da Lumi, siga **GERAR_VOZ_ELEVENLABS.md**. O gerador local pede a chave de forma oculta, usa a assinatura do ElevenLabs, preserva o progresso em caso de erro e prepara o site, o HTML independente e um ZIP com os áudios. A chave não é incluída nos arquivos. Os MP3 gerados entram também no cache offline da versão publicada.

## Limites da demonstração

Esta versão não deve coletar dados reais de crianças. Não possui autenticação de contas, banco de dados compartilhado, controle de permissões institucionais, sincronização entre aparelhos ou cobrança. A conta simples na transição de áreas é apenas uma barreira contra trocas acidentais e não um mecanismo de segurança.

Os painéis mostram participação em atividades; não medem domínio de leitura nem fornecem diagnóstico. A trilha e todos os enunciados necessitam de revisão por alfabetizador antes de um piloto com crianças. As falas com MP3 usam a voz gravada; quando não há gravação ou ela falha, a narração usa Web Speech, cuja voz portuguesa, pronúncia e funcionamento offline dependem do aparelho. Nenhum áudio infantil é gravado ou enviado.

Os jogos de letras ensinam reconhecimento dos nomes das letras. O jogo de sons compara começos de palavras, sem usar voz sintetizada como demonstração isolada de fonemas.

## Executar e verificar

O diretório publicado é `dist/`. Não há dependências nem etapa de build. Servir esse diretório por HTTP/HTTPS para testar módulos e service worker.

```sh
npm run check
npm test
```

A verificação inicial inclui lógica de conteúdo, persistência e agregação de registros, conclusão de sugestões, exportação CSV e integridade de arquivos. A inspeção visual e os fluxos de browser precisam de verificação em celular e computador; o ambiente de criação não dispõe do controle de navegador exigido pelo fluxo Sites.

## Próxima versão para um piloto real

1. Revisar conteúdo, sequência e adaptações com alfabetizador e especialista em acessibilidade.
2. Implementar backend, autenticação de adultos, perfis vinculados a responsáveis, controle institucional e autorização do compartilhamento escola-família.
3. Definir tratamento de dados, retenção, exclusão e consentimentos/bases aplicáveis com revisão jurídica de LGPD e ECA Digital.
4. Gravar e revisar áudios em português brasileiro; testar acessibilidade e usabilidade com profissionais antes de envolver crianças.
5. Validar preços e termos, depois integrar pagamentos de adultos e gestão de assinaturas.

O código e as ilustrações SVG foram criados para este projeto. Não foram reutilizados personagens ou materiais didáticos de terceiros. O nome Lumi é uma identidade provisória; nenhuma disponibilidade de marca ou domínio é afirmada.
