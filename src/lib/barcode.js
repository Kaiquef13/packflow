// Leitura do codigo de barras do pedido BaseLinker impresso na etiqueta.
// Sao ~8 digitos, muito mais rapidos de decodificar que a chave de acesso
// (44 digitos): com o numero do pedido a API devolve NF, cliente e produtos.

// Etiquetas DANFE/BaseLinker imprimem em Code 128; ITF cobre DANFE classica.
// Lista curta de proposito: cada formato extra custa tempo de processamento.
const NATIVE_FORMATS = ['code_128', 'itf']
const ZXING_FORMATS = ['Code128', 'ITF']

// Frames grandes (4K) travam a decodificacao em celular
const LARGURA_MAX_ANALISE = 1600

// Intervalo entre tentativas na leitura ao vivo (~15 leituras por segundo)
const INTERVALO_NATIVO_MS = 66
const INTERVALO_ZXING_MS = 400

// Numero de pedido BaseLinker tem 8 digitos hoje; a folga cobre o futuro
const TAM_PEDIDO_PROVAVEL = 8
const TAM_MIN = 6
const TAM_MAX = 10

// Ordena os numeros lidos pela chance de serem o pedido: a etiqueta tambem
// traz codigos da transportadora, que costumam ser mais longos.
export function ordenarCandidatos(valores) {
  const vistos = new Set()
  return (valores || [])
    .map((v) => String(v).replace(/\D/g, ''))
    .filter((d) => {
      if (!d || d.length < TAM_MIN || d.length > TAM_MAX || vistos.has(d)) return false
      vistos.add(d)
      return true
    })
    .sort((a, b) => Math.abs(a.length - TAM_PEDIDO_PROVAVEL) - Math.abs(b.length - TAM_PEDIDO_PROVAVEL))
}

async function detectarNativo(fonte) {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null
  try {
    const suportados = await window.BarcodeDetector.getSupportedFormats()
    const formats = NATIVE_FORMATS.filter((f) => suportados.includes(f))
    if (formats.length === 0) return null

    const detector = new window.BarcodeDetector({ formats })
    const resultados = await detector.detect(fonte)
    return resultados.map((r) => r.rawValue)
  } catch (error) {
    console.warn('BarcodeDetector nativo falhou:', error)
    return null
  }
}

let zxingPromise = null
function carregarZxing() {
  if (!zxingPromise) {
    zxingPromise = Promise.all([
      import('zxing-wasm/reader'),
      import('zxing-wasm/reader/zxing_reader.wasm?url').then((m) => m.default)
    ]).then(([reader, wasmUrl]) => {
      // Serve o wasm do proprio site: a rede do galpao pode bloquear CDN
      reader.prepareZXingModule({
        overrides: {
          locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path)
        }
      })
      return reader.readBarcodes
    })
  }
  return zxingPromise
}

async function detectarZxing(blob) {
  try {
    const readBarcodes = await carregarZxing()
    const resultados = await readBarcodes(blob, {
      formats: ZXING_FORMATS,
      tryHarder: true,
      maxNumberOfSymbols: 6
    })
    return resultados.filter((r) => r.isValid).map((r) => r.text)
  } catch (error) {
    console.warn('Fallback zxing falhou:', error)
    return null
  }
}

// Le os codigos de barras de uma foto e devolve os candidatos a numero de
// pedido, do mais provavel para o menos provavel.
export async function lerCandidatosPedido(blob) {
  let valores = await detectarNativo(blob)
  if (!valores || valores.length === 0) {
    valores = await detectarZxing(blob)
  }
  return ordenarCandidatos(valores)
}

// Leitura continua do video enquanto o operador mira: decodifica varios
// frames por segundo, bem mais confiavel que um unico frame parado.
// onDetect recebe a lista de candidatos assim que algo e lido.
// Retorna a funcao para encerrar a leitura.
export function iniciarLeituraContinua(videoEl, onDetect) {
  let ativo = true
  let jaAvisou = false

  const processar = (valores) => {
    const candidatos = ordenarCandidatos(valores)
    if (candidatos.length === 0 || jaAvisou) return
    jaAvisou = true
    onDetect(candidatos)
  }

  const rodarNativo = async () => {
    let detector
    try {
      const suportados = await window.BarcodeDetector.getSupportedFormats()
      const formats = NATIVE_FORMATS.filter((f) => suportados.includes(f))
      if (formats.length === 0) return false
      detector = new window.BarcodeDetector({ formats })
    } catch {
      return false
    }

    const tick = async () => {
      if (!ativo || jaAvisou) return
      if (videoEl.readyState >= 2) {
        try {
          const resultados = await detector.detect(videoEl)
          processar(resultados.map((r) => r.rawValue))
        } catch { /* frame ruim, tenta o proximo */ }
      }
      if (ativo && !jaAvisou) setTimeout(tick, INTERVALO_NATIVO_MS)
    }
    tick()
    return true
  }

  const rodarZxing = async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const tick = async () => {
      if (!ativo || jaAvisou) return
      if (videoEl.readyState >= 2) {
        try {
          const escala = Math.min(1, LARGURA_MAX_ANALISE / (videoEl.videoWidth || 1))
          canvas.width = Math.round(videoEl.videoWidth * escala)
          canvas.height = Math.round(videoEl.videoHeight * escala)
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
          if (blob) processar(await detectarZxing(blob))
        } catch { /* frame ruim, tenta o proximo */ }
      }
      if (ativo && !jaAvisou) setTimeout(tick, INTERVALO_ZXING_MS)
    }
    tick()
  }

  ;(async () => {
    const nativoOk = typeof window !== 'undefined' && 'BarcodeDetector' in window
      ? await rodarNativo()
      : false
    if (!nativoOk && ativo) rodarZxing()
  })()

  return () => { ativo = false }
}
