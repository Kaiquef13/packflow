// Utilitarios de validacao de NF-e (chave de acesso e comparacao de dados do OCR)

// A chave de acesso NF-e tem 44 digitos; o ultimo e o digito verificador (mod 11)
export function validarChaveAcesso(chave) {
  if (!chave) return false
  const digits = String(chave).replace(/\D/g, '')
  if (digits.length !== 44) return false

  const pesos = [2, 3, 4, 5, 6, 7, 8, 9]
  let soma = 0
  for (let i = 42; i >= 0; i -= 1) {
    soma += Number(digits[i]) * pesos[(42 - i) % 8]
  }
  const resto = soma % 11
  const dv = resto === 0 || resto === 1 ? 0 : 11 - resto
  return dv === Number(digits[43])
}

// nNF ocupa as posicoes 26-34 (1-based) da chave de acesso
export function nfFromChave(chave) {
  const digits = String(chave || '').replace(/\D/g, '')
  if (digits.length !== 44) return ''
  return normalizeNf(digits.slice(25, 34))
}

export function normalizeNf(nf) {
  const digits = String(nf || '').replace(/\D/g, '')
  return digits.replace(/^0+/, '') || ''
}

function normalizeNome(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Distancia de Levenshtein simples, suficiente para nomes curtos
function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i += 1) {
    const curr = [i]
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[n]
}

// Compara nomes de cliente tolerando erros comuns de OCR (ex: PAIVA/PALVA).
// Retorna true quando os nomes provavelmente se referem a mesma pessoa.
export function clientesSimilares(a, b) {
  const nomeA = normalizeNome(a)
  const nomeB = normalizeNome(b)
  if (!nomeA || !nomeB) return false
  if (nomeA === nomeB) return true
  if (nomeA.includes(nomeB) || nomeB.includes(nomeA)) return true

  const dist = levenshtein(nomeA, nomeB)
  const maxLen = Math.max(nomeA.length, nomeB.length)
  if (dist / maxLen <= 0.25) return true

  // Sobreposicao de tokens: cobre abreviacoes e ordem trocada
  const tokensA = new Set(nomeA.split(' ').filter(t => t.length > 2))
  const tokensB = new Set(nomeB.split(' ').filter(t => t.length > 2))
  if (tokensA.size === 0 || tokensB.size === 0) return false
  let comuns = 0
  for (const t of tokensA) if (tokensB.has(t)) comuns += 1
  return comuns / Math.min(tokensA.size, tokensB.size) >= 0.5
}
