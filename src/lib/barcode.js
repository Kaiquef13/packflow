import { validarChaveAcesso, nfFromChave } from './nfe'

// Chave de acesso costuma vir em CODE-128 (etiquetas novas) ou ITF (DANFE
// classica); os demais entram porque etiquetas de transportadora variam.
const NATIVE_FORMATS = ['code_128', 'itf', 'code_39', 'codabar', 'ean_13']
const ZXING_FORMATS = ['Code128', 'ITF', 'Code39', 'Codabar', 'EAN-13']

// Frames grandes (4K) travam a decodificacao em celular: reduz antes de ler
const LARGURA_MAX_ANALISE = 1600

async function detectComBarcodeDetectorNativo(blob) {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null
  try {
    const suportados = await window.BarcodeDetector.getSupportedFormats()
    const formats = NATIVE_FORMATS.filter((f) => suportados.includes(f))
    if (formats.length === 0) return null

    const detector = new window.BarcodeDetector({ formats })
    const bitmap = await createImageBitmap(blob)
    try {
      const resultados = await detector.detect(bitmap)
      return resultados.map((r) => r.rawValue)
    } finally {
      bitmap.close()
    }
  } catch (error) {
    console.warn('BarcodeDetector nativo falhou:', error)
    return null
  }
}

async function detectComZxing(blob) {
  try {
    // Carregado sob demanda: so paga o peso do wasm em navegadores sem BarcodeDetector
    const [{ prepareZXingModule, readBarcodes }, wasmUrl] = await Promise.all([
      import('zxing-wasm/reader'),
      import('zxing-wasm/reader/zxing_reader.wasm?url').then((m) => m.default)
    ])

    // Serve o wasm do proprio site em vez do CDN padrao (rede local pode ser restrita)
    prepareZXingModule({
      overrides: {
        locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path)
      }
    })

    const resultados = await readBarcodes(blob, {
      formats: ZXING_FORMATS,
      tryHarder: true,
      maxNumberOfSymbols: 4
    })
    return resultados.filter((r) => r.isValid).map((r) => r.text)
  } catch (error) {
    console.warn('Fallback zxing falhou:', error)
    return null
  }
}

// Classifica valores decodificados: chave = 44 digitos com DV valido;
// pedido = 6-12 digitos (etiquetas BaseLinker). Mescla com leituras anteriores.
export function classificarValores(valores, previo = null) {
  const somenteDigitos = (valores || [])
    .map((v) => String(v).replace(/\D/g, ''))
    .filter(Boolean)

  const chave = previo?.chave || somenteDigitos.find((d) => d.length === 44 && validarChaveAcesso(d)) || ''
  const pedido = previo?.pedido || somenteDigitos.find((d) => d !== chave && d.length >= 6 && d.length <= 12) || ''

  return {
    chave,
    nf: chave ? nfFromChave(chave) : '',
    pedido
  }
}

// Le os codigos de barras da foto da DANFE (frame unico).
export async function decodeDanfeBarcodes(blob) {
  let valores = await detectComBarcodeDetectorNativo(blob)
  if (!valores || valores.length === 0) {
    valores = await detectComZxing(blob)
  }
  return classificarValores(valores)
}

// Leitura continua do stream de video: decodifica varios frames por segundo
// enquanto o operador mira (muito mais confiavel que um unico frame parado).
// onDetect recebe o acumulado {chave, nf, pedido} a cada novo achado.
// Retorna uma funcao para encerrar a leitura.
export function iniciarLeituraContinua(videoEl, onDetect) {
  let ativo = true
  let acumulado = { chave: '', nf: '', pedido: '' }

  const processar = (valores) => {
    if (!valores || valores.length === 0) return
    const novo = classificarValores(valores, acumulado)
    if (novo.chave !== acumulado.chave || novo.pedido !== acumulado.pedido) {
      acumulado = novo
      onDetect(acumulado)
    }
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
      if (!ativo) return
      if (videoEl.readyState >= 2 && (!acumulado.chave || !acumulado.pedido)) {
        try {
          const resultados = await detector.detect(videoEl)
          processar(resultados.map((r) => r.rawValue))
        } catch { /* frame ruim, tenta o proximo */ }
      }
      if (ativo && (!acumulado.chave || !acumulado.pedido)) setTimeout(tick, 250)
    }
    tick()
    return true
  }

  const rodarZxing = async () => {
    let readBarcodes
    try {
      const [reader, wasmUrl] = await Promise.all([
        import('zxing-wasm/reader'),
        import('zxing-wasm/reader/zxing_reader.wasm?url').then((m) => m.default)
      ])
      reader.prepareZXingModule({
        overrides: {
          locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path)
        }
      })
      readBarcodes = reader.readBarcodes
    } catch (error) {
      console.warn('zxing indisponivel para leitura continua:', error)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const tick = async () => {
      if (!ativo) return
      if (videoEl.readyState >= 2 && (!acumulado.chave || !acumulado.pedido)) {
        try {
          const escala = Math.min(1, LARGURA_MAX_ANALISE / (videoEl.videoWidth || 1))
          canvas.width = Math.round(videoEl.videoWidth * escala)
          canvas.height = Math.round(videoEl.videoHeight * escala)
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
          if (blob) {
            const resultados = await readBarcodes(blob, {
              formats: ZXING_FORMATS,
              tryHarder: true,
              maxNumberOfSymbols: 4
            })
            processar(resultados.filter((r) => r.isValid).map((r) => r.text))
          }
        } catch { /* frame ruim, tenta o proximo */ }
      }
      if (ativo && (!acumulado.chave || !acumulado.pedido)) setTimeout(tick, 900)
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
