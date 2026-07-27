import { validarChaveAcesso, nfFromChave } from './nfe'

// Formatos usados em DANFE: chave de acesso em CODE-128 (etiquetas novas) ou ITF (DANFE classica)
const NATIVE_FORMATS = ['code_128', 'itf']

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
      formats: ['Code128', 'ITF'],
      tryHarder: true,
      maxNumberOfSymbols: 4
    })
    return resultados.filter((r) => r.isValid).map((r) => r.text)
  } catch (error) {
    console.warn('Fallback zxing falhou:', error)
    return null
  }
}

// Le os codigos de barras da foto da DANFE.
// Retorna a chave de acesso validada (digito verificador), o numero da NF
// derivado dela e, quando presente, o numero do pedido (etiquetas BaseLinker).
export async function decodeDanfeBarcodes(blob) {
  let valores = await detectComBarcodeDetectorNativo(blob)
  if (!valores || valores.length === 0) {
    valores = await detectComZxing(blob)
  }
  if (!valores) valores = []

  const somenteDigitos = valores
    .map((v) => String(v).replace(/\D/g, ''))
    .filter(Boolean)

  const chave = somenteDigitos.find((d) => d.length === 44 && validarChaveAcesso(d)) || ''
  const pedido = somenteDigitos.find((d) => d !== chave && d.length >= 6 && d.length <= 12) || ''

  return {
    chave,
    nf: chave ? nfFromChave(chave) : '',
    pedido,
    valoresBrutos: valores
  }
}
