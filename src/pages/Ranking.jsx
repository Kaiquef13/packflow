import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, ArrowLeft, Package, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEmbalagens } from '@/hooks/useEmbalagens'
import { formatTime } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function Ranking() {
  const navigate = useNavigate()
  const { data: todasEmbalagens = [] } = useEmbalagens()
  const [periodo, setPeriodo] = useState('total')
  const [turno, setTurno] = useState('todos')

  const embalagensFiltradas = useMemo(() => {
    let filtradas = [...todasEmbalagens]

    // Filtro de período
    if (periodo === 'hoje') {
      const hoje = new Date().toDateString()
      filtradas = filtradas.filter(e => new Date(e.created_date).toDateString() === hoje)
    } else if (periodo === 'semana') {
      const semanaAtras = new Date()
      semanaAtras.setDate(semanaAtras.getDate() - 7)
      filtradas = filtradas.filter(e => new Date(e.created_date) >= semanaAtras)
    }

    // Filtro de turno
    if (turno !== 'todos') {
      filtradas = filtradas.filter(e => {
        const hora = new Date(e.start_time).getHours()
        if (turno === 'manha') return hora >= 6 && hora < 12
        if (turno === 'tarde') return hora >= 12 && hora < 18
        if (turno === 'noite') return hora >= 18 || hora < 6
        return true
      })
    }

    return filtradas
  }, [todasEmbalagens, periodo, turno])

  const rankings = useMemo(() => {
    const stats = {}

    embalagensFiltradas.forEach(e => {
      if (!stats[e.operador_id]) {
        stats[e.operador_id] = {
          nome: e.operador_nome,
          totalEmbalagens: 0,
          tempoTotal: 0,
          suspeitas: 0,
          avarias: 0,
        }
      }

      stats[e.operador_id].totalEmbalagens++
      stats[e.operador_id].tempoTotal += e.tempo_total_segundos || 0
      if (e.status === 'suspeito') stats[e.operador_id].suspeitas++
      if (e.tem_avaria) stats[e.operador_id].avarias++
    })

    const array = Object.entries(stats).map(([id, data]) => ({
      id,
      ...data,
      tempoMedio: data.totalEmbalagens > 0 ? Math.floor(data.tempoTotal / data.totalEmbalagens) : 0,
      taxaSucesso: data.totalEmbalagens > 0
        ? ((data.totalEmbalagens - data.suspeitas - data.avarias) / data.totalEmbalagens * 100).toFixed(1)
        : 0,
    }))

    return {
      porVolume: [...array].sort((a, b) => b.totalEmbalagens - a.totalEmbalagens),
      porVelocidade: [...array].sort((a, b) => a.tempoMedio - b.tempoMedio),
      porQualidade: [...array].sort((a, b) => b.taxaSucesso - a.taxaSucesso),
    }
  }, [embalagensFiltradas])

  const top3 = rankings.porVolume.slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-600" />
              Ranking de Operadores
            </h1>
            <p className="text-gray-600 mt-1">Performance e produtividade</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex gap-2">
            <span className="text-sm font-medium text-gray-600 self-center">Período:</span>
            {['hoje', 'semana', 'total'].map(p => (
              <Button
                key={p}
                variant={periodo === p ? 'default' : 'outline'}
                onClick={() => setPeriodo(p)}
                size="sm"
              >
                {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Total'}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-sm font-medium text-gray-600 self-center">Turno:</span>
            {['todos', 'manha', 'tarde', 'noite'].map(t => (
              <Button
                key={t}
                variant={turno === t ? 'default' : 'outline'}
                onClick={() => setTurno(t)}
                size="sm"
              >
                {t === 'todos' ? 'Todos' : t === 'manha' ? 'Manhã' : t === 'tarde' ? 'Tarde' : 'Noite'}
              </Button>
            ))}
          </div>
        </div>

        {/* Pódio Top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {top3.map((op, index) => (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${
                  index === 0 ? 'md:order-2 md:scale-110' : index === 1 ? 'md:order-1' : 'md:order-3'
                }`}
              >
                <div className="bg-white rounded-lg shadow-lg p-6 text-center border-2 border-yellow-400">
                  <div className="text-6xl mb-2">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{op.nome}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>{op.totalEmbalagens}</strong> embalagens</p>
                    <p>{formatTime(op.tempoMedio)} tempo médio</p>
                    <p><strong>{op.taxaSucesso}%</strong> qualidade</p>
                  </div>
                  {op.avarias > 0 && (
                    <Badge variant="destructive" className="mt-2">{op.avarias} avarias</Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Rankings Detalhados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Por Volume */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Por Volume
            </h3>
            <div className="space-y-2">
              {rankings.porVolume.map((op, index) => (
                <div key={op.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-400 w-6">{index + 1}º</span>
                    <span className="text-sm">{op.nome}</span>
                  </div>
                  <Badge variant="info">{op.totalEmbalagens}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Por Velocidade */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-emerald-600 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Por Velocidade
            </h3>
            <div className="space-y-2">
              {rankings.porVelocidade.map((op, index) => (
                <div key={op.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-400 w-6">{index + 1}º</span>
                    <span className="text-sm">{op.nome}</span>
                  </div>
                  <Badge variant="success">{formatTime(op.tempoMedio)}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Por Qualidade */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-purple-600 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Por Qualidade
            </h3>
            <div className="space-y-2">
              {rankings.porQualidade.map((op, index) => (
                <div key={op.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-400 w-6">{index + 1}º</span>
                    <span className="text-sm">{op.nome}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge>{op.taxaSucesso}%</Badge>
                    {op.avarias > 0 && <Badge variant="destructive" className="text-xs">{op.avarias}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
