import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, ArrowLeft, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useEmbalagensPeriodo } from '@/hooks/useEmbalagens'
import { formatTime } from '@/lib/utils'
import { format } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const CORES = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

const METRICAS = {
  volume: { label: 'Volume (embalagens)', formatValue: (v) => v },
  tempoMedio: { label: 'Tempo médio', formatValue: (v) => formatTime(v) },
  qualidade: { label: 'Taxa de qualidade (%)', formatValue: (v) => `${v}%` },
}

function getPeriodoRange(periodo, dataInicio, dataFim) {
  const now = new Date()
  if (periodo === 'hoje') {
    const s = new Date(now); s.setHours(0, 0, 0, 0)
    return { startDate: s.toISOString(), endDate: null, granularidade: 'hora' }
  }
  if (periodo === 'semana') {
    const s = new Date(now); s.setDate(s.getDate() - 7); s.setHours(0, 0, 0, 0)
    return { startDate: s.toISOString(), endDate: null, granularidade: 'dia' }
  }
  if (periodo === 'mes') {
    const s = new Date(now); s.setDate(s.getDate() - 30); s.setHours(0, 0, 0, 0)
    return { startDate: s.toISOString(), endDate: null, granularidade: 'dia' }
  }
  if (periodo === 'personalizado') {
    const startDate = dataInicio ? new Date(dataInicio + 'T00:00:00').toISOString() : null
    const endDate = dataFim ? new Date(dataFim + 'T23:59:59').toISOString() : null
    const mesmoDia = dataInicio && dataFim && dataInicio === dataFim
    return { startDate, endDate, granularidade: mesmoDia ? 'hora' : 'dia' }
  }
  return { startDate: null, endDate: null, granularidade: 'dia' }
}

function matchesTurno(dateValue, turno, horaInicio, horaFim) {
  const hora = new Date(dateValue).getHours()

  if (turno === 'customizado') {
    const inicio = Number(horaInicio)
    const fim = Number(horaFim)
    if (Number.isNaN(inicio) || Number.isNaN(fim)) return true
    if (inicio <= fim) return hora >= inicio && hora < fim
    return hora >= inicio || hora < fim
  }

  if (turno === 'manha') return hora >= 6 && hora < 12
  if (turno === 'tarde') return hora >= 12 && hora < 18
  if (turno === 'noite') return hora >= 18 || hora < 6
  return true
}

function getBucketKey(dateValue, granularidade) {
  const date = new Date(dateValue)
  return granularidade === 'hora' ? format(date, 'HH:00') : format(date, 'dd/MM')
}

export default function Evolucao() {
  const navigate = useNavigate()
  const [periodo, setPeriodo] = useState('semana')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [turno, setTurno] = useState('todos')
  const [horaInicio, setHoraInicio] = useState('8')
  const [horaFim, setHoraFim] = useState('18')
  const [metrica, setMetrica] = useState('volume')
  const [operadoresSelecionados, setOperadoresSelecionados] = useState([])

  const { startDate, endDate, granularidade } = useMemo(
    () => getPeriodoRange(periodo, dataInicio, dataFim),
    [periodo, dataInicio, dataFim]
  )

  const { data: embalagens = [], isLoading } = useEmbalagensPeriodo(startDate, endDate, {})

  const embalagensFiltradas = useMemo(
    // Embalagens duplicadas sao o mesmo pacote fisico escaneado de novo: nao entram nas estatisticas
    () => embalagens.filter((e) => !e.is_duplicada && matchesTurno(e.start_time || e.createdAt, turno, horaInicio, horaFim)),
    [embalagens, turno, horaInicio, horaFim]
  )

  const todosOperadores = useMemo(
    () => [...new Set(embalagensFiltradas.map((e) => e.operador_nome).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [embalagensFiltradas]
  )

  const totaisPorOperador = useMemo(() => {
    const stats = {}
    embalagensFiltradas.forEach((e) => {
      const nome = e.operador_nome
      if (!nome) return
      if (!stats[nome]) stats[nome] = { totalEmbalagens: 0, tempoTotal: 0, suspeitas: 0, avarias: 0 }
      stats[nome].totalEmbalagens++
      stats[nome].tempoTotal += e.tempo_total_segundos || 0
      if (e.status === 'SUSPEITA') stats[nome].suspeitas++
      if (e.tem_avaria) stats[nome].avarias++
    })
    return Object.entries(stats)
      .map(([nome, data]) => ({
        nome,
        ...data,
        tempoMedio: data.totalEmbalagens > 0 ? Math.floor(data.tempoTotal / data.totalEmbalagens) : 0,
        taxaSucesso: data.totalEmbalagens > 0
          ? Number(((data.totalEmbalagens - data.suspeitas - data.avarias) / data.totalEmbalagens * 100).toFixed(1))
          : 0,
      }))
      .sort((a, b) => b.totalEmbalagens - a.totalEmbalagens)
  }, [embalagensFiltradas])

  // Seleciona os 5 operadores com maior volume por padrão assim que os dados chegam
  useEffect(() => {
    if (operadoresSelecionados.length === 0 && totaisPorOperador.length > 0) {
      setOperadoresSelecionados(totaisPorOperador.slice(0, 5).map((o) => o.nome))
    }
  }, [totaisPorOperador]) // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = useMemo(() => {
    const buckets = {}

    embalagensFiltradas.forEach((e) => {
      const nome = e.operador_nome
      if (!nome || !operadoresSelecionados.includes(nome)) return

      const key = getBucketKey(e.start_time || e.createdAt, granularidade)
      if (!buckets[key]) buckets[key] = {}
      if (!buckets[key][nome]) buckets[key][nome] = { totalEmbalagens: 0, tempoTotal: 0, suspeitas: 0, avarias: 0 }

      buckets[key][nome].totalEmbalagens++
      buckets[key][nome].tempoTotal += e.tempo_total_segundos || 0
      if (e.status === 'SUSPEITA') buckets[key][nome].suspeitas++
      if (e.tem_avaria) buckets[key][nome].avarias++
    })

    return Object.entries(buckets)
      .map(([bucket, porOperador]) => {
        const linha = { bucket }
        Object.entries(porOperador).forEach(([nome, data]) => {
          if (metrica === 'volume') linha[nome] = data.totalEmbalagens
          else if (metrica === 'tempoMedio') linha[nome] = Math.floor(data.tempoTotal / data.totalEmbalagens)
          else if (metrica === 'qualidade') {
            linha[nome] = Number(((data.totalEmbalagens - data.suspeitas - data.avarias) / data.totalEmbalagens * 100).toFixed(1))
          }
        })
        return linha
      })
      .sort((a, b) => {
        if (granularidade === 'hora') return a.bucket.localeCompare(b.bucket)
        const [diaA, mesA] = a.bucket.split('/').map(Number)
        const [diaB, mesB] = b.bucket.split('/').map(Number)
        return mesA - mesB || diaA - diaB
      })
  }, [embalagensFiltradas, operadoresSelecionados, metrica, granularidade])

  const toggleOperador = (nome) => {
    setOperadoresSelecionados((prev) =>
      prev.includes(nome) ? prev.filter((o) => o !== nome) : [...prev, nome]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              Evolução de Operadores
            </h1>
            <p className="text-gray-600 mt-1">Tendência e comparação de performance ao longo do tempo</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Período:</span>
            {['hoje', 'semana', 'mes', 'personalizado'].map((p) => (
              <Button key={p} size="sm" variant={periodo === p ? 'default' : 'outline'} onClick={() => setPeriodo(p)}>
                {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Última semana' : p === 'mes' ? 'Últimos 30 dias' : 'Personalizado'}
              </Button>
            ))}
            {periodo === 'personalizado' && (
              <div className="flex items-center gap-2">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-40" />
                <span className="text-gray-400">até</span>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-40" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Horário:</span>
            {['todos', 'manha', 'tarde', 'noite', 'customizado'].map((t) => (
              <Button key={t} size="sm" variant={turno === t ? 'default' : 'outline'} onClick={() => setTurno(t)}>
                {t === 'todos' ? 'Todos' : t === 'manha' ? 'Manhã' : t === 'tarde' ? 'Tarde' : t === 'noite' ? 'Noite' : 'Faixa customizada'}
              </Button>
            ))}
            {turno === 'customizado' && (
              <div className="flex items-center gap-2">
                <Select value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-24">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}h</option>
                  ))}
                </Select>
                <span className="text-gray-400">até</span>
                <Select value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className="w-24">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}h</option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Métrica:</span>
            {Object.entries(METRICAS).map(([key, { label }]) => (
              <Button key={key} size="sm" variant={metrica === key ? 'default' : 'outline'} onClick={() => setMetrica(key)}>
                {label}
              </Button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Operadores para comparar:</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setOperadoresSelecionados(todosOperadores)}>
                  Selecionar todos
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOperadoresSelecionados([])}>
                  Limpar
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {todosOperadores.map((nome) => {
                const ativo = operadoresSelecionados.includes(nome)
                return (
                  <button
                    key={nome}
                    onClick={() => toggleOperador(nome)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      ativo ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-600'
                    }`}
                  >
                    {ativo ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    {nome}
                  </button>
                )
              })}
              {todosOperadores.length === 0 && !isLoading && (
                <span className="text-sm text-gray-400">Nenhum operador encontrado no período selecionado</span>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico de evolução */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{METRICAS[metrica].label} ao longo do tempo</h3>
          {isLoading ? (
            <div className="py-16 text-center text-gray-500">Carregando...</div>
          ) : chartData.length === 0 || operadoresSelecionados.length === 0 ? (
            <div className="py-16 text-center text-gray-500">Selecione ao menos um operador com dados no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={METRICAS[metrica].formatValue} />
                <Tooltip formatter={(value) => METRICAS[metrica].formatValue(value)} />
                <Legend />
                {operadoresSelecionados.map((nome, index) => (
                  <Line
                    key={nome}
                    type="monotone"
                    dataKey={nome}
                    stroke={CORES[index % CORES.length]}
                    strokeWidth={2}
                    connectNulls
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabela comparativa */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="text-lg font-bold text-gray-900">Comparativo no período</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Operador</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Volume</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tempo médio</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Qualidade</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Avarias</th>
                </tr>
              </thead>
              <tbody>
                {totaisPorOperador.map((op) => (
                  <tr key={op.nome} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{op.nome}</td>
                    <td className="px-4 py-3 text-sm">{op.totalEmbalagens}</td>
                    <td className="px-4 py-3 text-sm">{formatTime(op.tempoMedio)}</td>
                    <td className="px-4 py-3 text-sm">{op.taxaSucesso}%</td>
                    <td className="px-4 py-3 text-sm">
                      {op.avarias > 0 ? <Badge variant="destructive">{op.avarias}</Badge> : '-'}
                    </td>
                  </tr>
                ))}
                {totaisPorOperador.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum dado no período selecionado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
