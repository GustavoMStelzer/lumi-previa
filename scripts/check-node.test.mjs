import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import checker from './check-node.cjs';

test('versões antigas são rejeitadas antes do gerador e Node 20 ou superior é aceito',()=>{
 for(const version of ['8.17.0','10.24.1','12.22.12','16.20.2','18.20.8','','invalid',null])assert.equal(checker.supportsGenerator(version),false,String(version));
 for(const version of ['20.0.0','22.0.0','24.0.0'])assert.equal(checker.supportsGenerator(version),true);
});
test('diagnóstico de Node antigo mostra a versão e o caminho sem carregar o ElevenLabs',()=>{
 const source=fs.readFileSync('scripts/check-node.cjs','utf8'),module={exports:{}},messages=[];
 const process={versions:{node:'10.24.1'},version:'v10.24.1',execPath:'C:\\OldNode\\node.exe',stderr:{write:value=>messages.push(value)},stdout:{write(){assert.fail('Nao deve informar compatibilidade');}}};
 vm.runInNewContext(source,{module,require:{main:module},process});
 assert.equal(process.exitCode,1);assert.ok(messages.join('').includes('v10.24.1'));assert.ok(messages.join('').includes('C:\\OldNode\\node.exe'));assert.ok(messages.join('').includes('Nenhuma fala foi solicitada'));
});
// Os BAT ficam só no computador de quem gera as vozes; no GitHub o teste é pulado.
const bats=['GERAR_VOZ_WINDOWS.bat','TESTAR_VOZ_WINDOWS.bat','TESTAR_HISTORIA_WINDOWS.bat','DIAGNOSTICAR_CONEXAO_WINDOWS.bat'].filter(name=>fs.existsSync(name));
test('todos os BAT validam o Node antes do gerador e preferem o executável local',{skip:bats.length?false:'BAT não publicados neste repositório'},()=>{
 for(const name of bats){
  const source=fs.readFileSync(name,'utf8');assert.ok(source.indexOf('scripts\\check-node.cjs')<source.indexOf('scripts\\elevenlabs-generate.mjs'));assert.ok(source.includes('runtime\\node.exe'));assert.ok(source.includes('if errorlevel 1'));assert.ok(source.includes('exit /b %LUMI_RESULT%'));
 }
});
