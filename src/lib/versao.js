/* global __APP_VERSION__ */

export const VERSAO_ATUAL = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

// Versao curta para exibir na tela (ajuda a diagnosticar dispositivo desatualizado)
export const VERSAO_CURTA = String(VERSAO_ATUAL).slice(-6)

// Verifica se ha build novo publicado e, havendo, recarrega o app.
// Deve ser chamada apenas em momentos seguros (sem embalagem em andamento).
export async function verificarAtualizacao() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return false
    const { version } = await res.json()
    if (version && String(version) !== String(VERSAO_ATUAL)) {
      window.location.reload()
      return true
    }
  } catch {
    // offline ou dev server: tenta na proxima
  }
  return false
}
