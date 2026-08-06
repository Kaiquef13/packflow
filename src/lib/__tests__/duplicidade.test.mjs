import { decidirDuplicidade, montarMarcadorPedido, montarMarcadorChave, limparMarcadores, extrairPedidoDeObservacao } from '../nfe.js'
import { ordenarCandidatos } from '../barcode.js'

// Pedidos e NFs reais das etiquetas usadas para validar o fluxo
const PEDIDO_42160 = '44887644' // NF 42160, Multiloja
const PEDIDO_43594 = '44923246' // NF 43594, Boutique (Orquiflora)
const CODIGO_TRANSPORTADORA = '47661235671'

let falhas = 0
const check = (nome, obtido, esperado) => {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado)
  if (!ok) falhas++
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}: ${JSON.stringify(obtido)}${ok ? '' : ` (esperado ${JSON.stringify(esperado)})`}`)
}

console.log('--- Identidade pelo numero do pedido (unico na conta) ---')
check('mesmo pedido = duplicata',
  decidirDuplicidade({
    pedidoAtual: PEDIDO_42160,
    clienteAtual: 'Debora Ortiz Barbosa',
    candidato: { cliente_nome: 'Debora Ortiz Barbosa', observacao: montarMarcadorPedido(PEDIDO_42160) }
  }), 'duplicata')

check('pedido diferente = outro documento (mesmo com NF igual)',
  decidirDuplicidade({
    pedidoAtual: PEDIDO_42160,
    clienteAtual: 'Debora Ortiz Barbosa',
    candidato: { cliente_nome: 'EDVANIA PASTORA MOURA SILVA', observacao: montarMarcadorPedido(PEDIDO_43594) }
  }), 'outro_documento')

console.log('\n--- Colisao real entre os dois CNPJs (registro antigo sem marcador) ---')
check('NF 42160 Multi vs registro antigo da Orquiflora',
  decidirDuplicidade({
    pedidoAtual: PEDIDO_42160,
    clienteAtual: 'Debora Ortiz Barbosa',
    candidato: { cliente_nome: 'EDVANIA PASTORA MOURA SILVA', observacao: '[ALERTA: Tempo suspeito - 52s]' }
  }), 'outro_documento')

check('registro antigo sem marcador, mesmo cliente = duplicata',
  decidirDuplicidade({
    pedidoAtual: PEDIDO_42160,
    clienteAtual: 'Debora Ortiz Barbosa',
    candidato: { cliente_nome: 'DEBORA ORTIZ BARBOSA', observacao: '' }
  }), 'duplicata')

console.log('\n--- Leitura incerta pergunta ao operador ---')
check('sem pedido e cliente diferente',
  decidirDuplicidade({
    pedidoAtual: '',
    clienteAtual: 'Debora Ortiz Barbosa',
    candidato: { cliente_nome: 'EDVANIA PASTORA', observacao: '' }
  }), 'confirmar')

check('pedido lido mas cliente desconhecido',
  decidirDuplicidade({
    pedidoAtual: PEDIDO_42160,
    clienteAtual: '',
    candidato: { cliente_nome: 'EDVANIA PASTORA', observacao: '' }
  }), 'confirmar')

console.log('\n--- Compatibilidade com registros gravados com chave de acesso ---')
const CHAVE_42160 = '35260851449654000138550060000421601945604105'
check('mesma chave ainda e reconhecida',
  decidirDuplicidade({
    chaveAtual: CHAVE_42160,
    clienteAtual: 'Debora Ortiz Barbosa',
    candidato: { cliente_nome: 'Debora Ortiz Barbosa', observacao: montarMarcadorChave(CHAVE_42160) }
  }), 'duplicata')

console.log('\n--- Selecao do codigo do pedido entre os barcodes da etiqueta ---')
check('descarta codigo longo da transportadora',
  ordenarCandidatos([CODIGO_TRANSPORTADORA, PEDIDO_42160])[0], PEDIDO_42160)

check('ignora codigo de 16 digitos da etiqueta de envio',
  ordenarCandidatos(['2000015509732230', PEDIDO_43594]), [PEDIDO_43594])

check('remove duplicados lidos em frames diferentes',
  ordenarCandidatos([PEDIDO_42160, PEDIDO_42160]), [PEDIDO_42160])

console.log('\n--- Marcadores nao vazam para a tela ---')
check('observacao limpa',
  limparMarcadores(`Cliente pediu cuidado\n${montarMarcadorPedido(PEDIDO_42160)}`), 'Cliente pediu cuidado')

check('pedido recuperado da observacao',
  extrairPedidoDeObservacao(montarMarcadorPedido(PEDIDO_42160)), PEDIDO_42160)

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${falhas} FALHA(S)`)
process.exit(falhas === 0 ? 0 : 1)
