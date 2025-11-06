import { Package, Clock, Users, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatTime } from '@/lib/utils'

export default function ResumoCards({ embalagens = [] }) {
  const totalEmbalagens = embalagens.length
  const tempoMedio = embalagens.length > 0
    ? Math.floor(embalagens.reduce((sum, e) => sum + (e.tempo_total_segundos || 0), 0) / embalagens.length)
    : 0
  const operadoresUnicos = new Set(embalagens.map(e => e.operador_id)).size
  const embalagensSuspeitas = embalagens.filter(e => e.status === 'SUSPEITA' || e.tem_avaria).length

  const cards = [
    {
      title: 'Total de Embalagens',
      value: totalEmbalagens,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Tempo Médio',
      value: formatTime(tempoMedio),
      icon: Clock,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Operadores Ativos',
      value: operadoresUnicos,
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Embalagens Suspeitas',
      value: embalagensSuspeitas,
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-red-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.bg} border-none shadow-md`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-lg shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
