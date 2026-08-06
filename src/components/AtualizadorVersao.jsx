import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { verificarAtualizacao } from '@/lib/versao'

const INTERVALO_MS = 5 * 60_000

// Telas onde recarregar e sempre seguro. A tela de embalagem fica de fora
// porque pode haver captura em andamento: la a verificacao e disparada
// explicitamente pelo proprio fluxo, ao finalizar cada embalagem.
const ROTAS_SEGURAS = ['/', '/dashboard', '/ranking', '/evolucao', '/operadores', '/configuracoes']

// Mantem os dispositivos do galpao na versao publicada: sem isso eles rodam
// bundle de semanas atras, ja que operadores nunca recarregam a pagina.
export default function AtualizadorVersao() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!ROTAS_SEGURAS.includes(pathname)) return

    verificarAtualizacao()
    const timer = setInterval(verificarAtualizacao, INTERVALO_MS)
    const aoFocar = () => verificarAtualizacao()
    window.addEventListener('focus', aoFocar)
    document.addEventListener('visibilitychange', aoFocar)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', aoFocar)
      document.removeEventListener('visibilitychange', aoFocar)
    }
  }, [pathname])

  return null
}
