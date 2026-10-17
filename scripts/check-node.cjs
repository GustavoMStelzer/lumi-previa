'use strict';
// Sintaxe compativel com Nodes antigos: este arquivo roda antes dos modulos .mjs.
function supportsGenerator(version) {
 var match = /^(\d+)\./.exec(String(version || ''));
 return !!match && parseInt(match[1], 10) >= 20;
}
module.exports = {supportsGenerator: supportsGenerator};
if (require.main === module) {
 if (!supportsGenerator(process.versions.node)) {
  process.stderr.write('\nLUMI - NODE.JS INCOMPATIVEL\n');
  process.stderr.write('Versao encontrada: ' + process.version + '\n');
  process.stderr.write('Executavel utilizado: ' + process.execPath + '\n\n');
  process.stderr.write('O gerador exige Node.js 20 ou superior. Recomendado: Node.js 24 LTS.\n');
  process.stderr.write('Download oficial: https://nodejs.org/en/download\n');
  process.stderr.write('Depois de instalar, feche esta janela e abra o arquivo BAT novamente.\n');
  process.stderr.write('Se voce ja atualizou, use "where node" para identificar outra instalacao no PATH.\n');
  process.stderr.write('Alternativa sem trocar o Node dos outros projetos: runtime\\node.exe.\n');
  process.stderr.write('Veja GERAR_VOZ_ELEVENLABS.md. Nenhuma fala foi solicitada ao ElevenLabs.\n\n');
  process.exitCode = 1;
 } else {
  process.stdout.write('Lumi - Node.js ' + process.versions.node + ' compativel.\n');
 }
}
