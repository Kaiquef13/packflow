import { decidirDuplicidade, montarMarcadorChave, nfFromChave, cnpjFromChave } from '../nfe.js'

// Chaves reais das etiquetas enviadas pelo usuario
const CHAVE_42160_MULTI = '35260851449654000138550060000421601945604105' // NF 42160, Multi Loja, 05/08
const CHAVE_42155_MULTI = '35260851449654000138550060000421551162352998' // NF 42155, Multi Loja, 05/08
const CHAVE_43594_ORQUI = '35260845007571000196550060000435941165652649' // NF 43594, Orquiflora, 05/08

let falhas = 0
const check = (nome, obtido, esperado) => {
  const ok = obtido === esperado
  if (!ok) falhas++
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}: ${obtido}${ok ? '' : ` (esperado ${esperado})`}`)
}

console.log('--- Casos reais que geraram falso positivo em producao ---')
// NF 42160: registro antigo de 29/07 (Orquiflora, sem chave gravada, cliente EDVANIA)
check('42160 Multi vs registro antigo EDVANIA',
  decidirDuplicidade({
    chaveAtual: CHAVE_42160_MULTI,
    clienteAtual: 'DEBORA ORTIZ BARBOSA',
    candidato: { cliente_nome: 'EDVANIA PASTORA MOURA SILVA', observacao: '[ALERTA: Tempo suspeito - 52s]' }
  }), 'outro_documento')

check('42155 Multi vs registro antigo Marli',
  decidirDuplicidade({
    chaveAtual: CHAVE_42155_MULTI,
    clienteAtual: 'LAUDINELA DE JESUS SILVA',
    candidato: { cliente_nome: 'Marli Braz Pinto', observacao: '[ALERTA: Tempo suspeito - 40s]' }
  }), 'outro_documento')

console.log('\n--- Duplicata verdadeira deve continuar sendo detectada ---')
check('mesma chave gravada',
  decidirDuplicidade({
    chaveAtual: CHAVE_42160_MULTI,
    clienteAtual: 'DEBORA ORTIZ BARBOSA',
    candidato: { cliente_nome: 'DEBORA ORTIZ BARBOSA', observacao: montarMarcadorChave(CHAVE_42160_MULTI) }
  }), 'duplicata')

check('registro antigo sem chave, mesmo cliente',
  decidirDuplicidade({
    chaveAtual: CHAVE_42160_MULTI,
    clienteAtual: 'DEBORA ORTIZ BARBOSA',
    candidato: { cliente_nome: 'Debora Ortiz Barbosa', observacao: '' }
  }), 'duplicata')

check('mesmo cliente com erro de OCR (PAIVA/PALVA)',
  decidirDuplicidade({
    chaveAtual: '',
    clienteAtual: 'MARIA PALVA SANTOS',
    candidato: { cliente_nome: 'MARIA PAIVA SANTOS', observacao: '' }
  }), 'duplicata')

console.log('\n--- Chaves diferentes = CNPJs diferentes ---')
check('chave gravada de outro CNPJ',
  decidirDuplicidade({
    chaveAtual: CHAVE_42160_MULTI,
    clienteAtual: 'DEBORA ORTIZ BARBOSA',
    candidato: { cliente_nome: 'RITA MARIA', observacao: montarMarcadorChave(CHAVE_43594_ORQUI) }
  }), 'outro_documento')

console.log('\n--- Leitura incerta deve perguntar ao operador ---')
check('sem chave e cliente diferente',
  decidirDuplicidade({
    chaveAtual: '',
    clienteAtual: 'DEBORA ORTIZ BARBOSA',
    candidato: { cliente_nome: 'EDVANIA PASTORA', observacao: '' }
  }), 'confirmar')

check('chave valida mas cliente nao lido',
  decidirDuplicidade({
    chaveAtual: CHAVE_42160_MULTI,
    clienteAtual: '',
    candidato: { cliente_nome: 'EDVANIA PASTORA', observacao: '' }
  }), 'confirmar')

// Mesma chave da NF 42160 com o digito verificador trocado (5 -> 6)
const CHAVE_DV_ERRADO = CHAVE_42160_MULTI.slice(0, 43) + '6'
check('chave com DV errado e mesmo rejeitada',
  (await import('../nfe.js')).validarChaveAcesso(CHAVE_DV_ERRADO), false)

check('chave invalida (leitura corrompida) trata como sem chave',
  decidirDuplicidade({
    chaveAtual: CHAVE_DV_ERRADO,
    clienteAtual: 'DEBORA ORTIZ BARBOSA',
    candidato: { cliente_nome: 'EDVANIA PASTORA', observacao: '' }
  }), 'confirmar')

console.log('\n--- Sanidade das chaves reais ---')
console.log('NF 42160 ->', nfFromChave(CHAVE_42160_MULTI), '| CNPJ', cnpjFromChave(CHAVE_42160_MULTI))
console.log('NF 43594 ->', nfFromChave(CHAVE_43594_ORQUI), '| CNPJ', cnpjFromChave(CHAVE_43594_ORQUI))

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${falhas} FALHA(S)`)
process.exit(falhas === 0 ? 0 : 1)
