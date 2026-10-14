# Colocar a voz da Lumi em todos os exercícios

**Gerador v4:** mostra o código e o detalhe de erros HTTP, ocultando a API key. Inclui o tratamento do erro Windows `CRYPT_E_NO_REVOCATION_CHECK (0x80092012)`.

O gerador prepara as **39 falas únicas** desta versão: instruções dos cinco jogos, palavras das alternativas, dicas de leitura, respostas positivas, encerramento e os três trechos da historinha. O roteiro tem **999 caracteres**. O número de créditos debitados depende das regras da sua conta e da voz utilizada.

## Uma única execução

1. Extraia o ZIP em uma pasta do computador. Instale Node.js **20 ou superior**, se necessário: <https://nodejs.org>.
2. No ElevenLabs, abra **Voices → My Voices**, encontre a voz **Lumi**, clique nos três pontos e escolha **Copy voice ID**. Guarde esse identificador para o próximo passo.
3. Abra **Developers → API Keys**, crie uma chave para este trabalho e habilite acesso a **Text to Speech**. Você pode limitar os créditos dessa chave no painel. Não coloque a chave no GitHub nem envie pelo chat.
4. No Windows, abra **GERAR_VOZ_WINDOWS.bat**. No macOS ou Linux, abra o terminal na pasta extraída e execute `node scripts/elevenlabs-generate.mjs`.
5. Cole o **Voice ID** quando solicitado. Depois cole a **API key**: os caracteres da chave ficam ocultos no terminal. Pressione Enter e aguarde a geração.

O gerador usa a mesma voz e o modelo **Eleven Multilingual v2** em todas as falas. Usa as configurações salvas dessa voz no ElevenLabs, sem aumentar a velocidade do MP3. A chave fica somente na memória do processo; não é escrita em arquivos, no site ou no ZIP.

No Windows, a conexão usa o **cURL do próprio Windows**, com verificação de certificado HTTPS. A chave é transmitida ao processo somente pela entrada padrão, sem aparecer na linha de comando ou em arquivo de configuração. No macOS e Linux, a conexão usa o HTTPS do Node.js.

Somente nas requisições para `https://api.elevenlabs.io`, o cURL do Windows usa `ssl-revoke-best-effort`: quando os dados de revogação estão ausentes ou a consulta está indisponível, a conexão pode continuar. A validação da cadeia de confiança, do domínio e de revogações conhecidas permanece ativa. Essa opção fica restrita ao processo do gerador e não altera configurações do Windows. Referência: [documentação do cURL](https://curl.se/docs/manpage.html#--ssl-revoke-best-effort).

## O que fica pronto

- **PREVIA_LOCAL.html**: prévia com todos os áudios incorporados, para abrir no navegador do computador.
- **dist/**: site pronto para o GitHub Pages, com os MP3 ligados às falas corretas.
- **outputs/Lumi_Voz_Completa.zip**: pacote pronto para enviar ao ChatGPT e atualizar a prévia hospedada.

Você pode mandar o HTML para sua mãe testar no computador ou publicar o conteúdo de `dist/` pelo workflow do GitHub Pages. A chave não é necessária para reproduzir os áudios e nenhuma chamada ao ElevenLabs ocorre quando a criança joga.

Confira principalmente a pronúncia dos nomes das letras, das palavras e o ritmo da historinha. O gerador valida o formato dos arquivos, mas a revisão da voz é feita ouvindo a prévia.

## Se a geração parar

Se aparecer **Falha de conexão**, execute **DIAGNOSTICAR_CONEXAO_WINDOWS.bat**. Ele testa uma rota da API sem usar chave, sem gerar áudio e sem solicitar conversão de texto em fala. Um HTTP **200** ou **401** confirma que houve resposta HTTPS; **401** é esperado quando a rota exige chave. Um **404** também significa que houve resposta HTTP à consulta de modelos; nesse caso, execute o gerador para testar a rota de fala. O diagnóstico não valida o Voice ID nem a API key. O teste não altera configurações do computador.

Se a geração retornar **HTTP 400**, o v4 mostra **Código**, **Parâmetro** (quando disponíveis) e **Detalhe** enviados pelo servidor. Compartilhe essas linhas para identificar a causa. O gerador oculta a chave nos detalhes e não grava um relatório de erro no pacote. Referência: [erros da API](https://elevenlabs.io/docs/eleven-api/resources/errors).

O gerador identifica falhas de DNS, conexão, tempo limite e certificado quando esse código está disponível. Não desativa a verificação HTTPS nem repete uma geração automaticamente após erro.

Execute o mesmo gerador novamente com a mesma voz. Os arquivos já concluídos e conferidos pelo registro local são reaproveitados. O processo não repete automaticamente requisições com erro. Se a conexão cair depois de o ElevenLabs processar uma fala, essa tentativa pode ter consumido créditos mesmo sem salvar o áudio; confira o histórico da conta antes de tentar novamente.

O registro `.lumi-audio-generation.json` guarda apenas códigos de verificação, sem API key. Ele fica fora do site e do ZIP. Para mudar de voz, extraia uma cópia nova do pacote e execute nela.

Depois de gerar, você pode excluir a chave no painel do ElevenLabs. Os MP3 continuam funcionando.

Documentação do serviço: [gerar áudio](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), [chaves de API](https://elevenlabs.io/docs/api-reference/authentication) e [copiar Voice ID](https://elevenlabs.io/docs/eleven-creative/voices/voice-library).
