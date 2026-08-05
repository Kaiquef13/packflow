/* global __APP_VERSION__ */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const INTERVALO_MS = 5 * 60_000

// Telas onde recarregar e seguro (nunca no meio de uma embalagem em andamento)
const ROTAS_SEGURAS = ['/', '/dashboard', '/ranking', '/evolucao', '/operadores', '/configuracoes']

// Verifica periodicamente se saiu versao nova do app e recarrega sozinho.
// Sem isso, dispositivos do galpao ficam rodando bundle velho por dias,
// ja que operadores nunca dao refresh manualmente.
export default function AtualizadorVersao() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!ROTAS_SEGURAS.includes(pathname)) return

    let cancelado = false

    const verificar = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const { version } = await res.json()
        if (!cancelado && version && version !== __APP_VERSION__) {
          window.location.reload()
        }
      } catch {
        // offline ou dev server: tenta na proxima
      }
    }

    verificar()
    const timer = setInterval(verificar, INTERVALO_MS)
    const aoFocar = () => verificar()
    window.addEventListener('focus', aoFocar)
    document.addEventListener('visibilitychange', aoFocar)

    return () => {
      cancelado = true
      clearInterval(timer)
      window.removeEventListener('focus', aoFocar)
      document.removeEventListener('visibilitychange', aoFocar)
    }
  }, [pathname])

  return null
}
