import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Download, Trophy, Users, RefreshCw, Search, Eye, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useEmbalagens, useEmbalagensPeriodo } from '@/hooks/useEmbalagens'
import ResumoCards from '@/components/dashboard/ResumoCards'
import ModalDetalhes from '@/components/dashboard/ModalDetalhes'
import { formatDateTime, formatTime } from '@/lib/utils'
import { format } from 'date-fns'

const INITIAL_FILTERS = {
  periodo: 'hoje',
  status: 'todos',
  operador: 'todos',
  ocorrencia: 'todas',
  dataInicio: '',
  dataFim: '',
}

function getDayBounds(dateValue) {
  const date = new Date(dateValue)
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function matchesPeriodo(dateValue, periodo, dataInicio, dataFim) {
  const embalagemDate = new Date(dateValue)
  const now = new Date()

  if (periodo === 'hoje') {
    return embalagemDate.toDateString() === now.toDateString()
  }

  if (periodo === 'semana') {
    const semanaAtras = new Date(now)
    semanaAtras.setDate(semanaAtras.getDate() - 7)
    return embalagemDate >= semanaAtras
  }

  if (periodo === 'mes') {
    const mesAtras = new Date(now)
    mesAtras.setDate(mesAtras.getDate() - 30)
    return embalagemDate >= mesAtras
  }

  if (periodo === 'personalizado') {
    if (dataInicio) {
      const { start } = getDayBounds(dataInicio)
      if (embalagemDate < start) return false
    }

    if (dataFim) {
      const { end } = getDayBounds(dataFim)
      if (embalagemDate > end) return false
    }
  }

  return true
}

function matchesOcorrencia(embalagem, ocorrencia) {
  if (ocorrencia === 'avaria') return Boolean(embalagem.tem_avaria)
  if (ocorrencia === 'duplicada') return Boolean(embalagem.is_duplicada)
  if (ocorrencia === 'pendente') return Boolean(embalagem.pendente_extracao)
  if (ocorrencia === 'suspeita') return embalagem.status === 'SUSPEITA'
  if (ocorrencia === 'cancelada') return embalagem.status === 'CANCELADA'
  if (ocorrencia === 'sem_nf') return !embalagem.nf_number
  return true
}

function getServerFilter(filtros) {
  const { periodo, dataInicio, dataFim } = filtros
  if (periodo === 'hoje') {
    const s = new Date(); s.setHours(0, 0, 0, 0)
    const e = new Date(); e.setHours(23, 59, 59, 999)
    return { startDate: s.toISOString(), endDate: e.toISOString() }
  }
  if (periodo === 'semana') {
    const s = new Date(); s.setDate(s.getDate() - 7); s.setHours(0, 0, 0, 0)
    return { startDate: s.toISOString(), endDate: null }
  }
  if (periodo === 'mes') {
    const s = new Date(); s.setDate(s.getDate() - 30); s.setHours(0, 0, 0, 0)
    return { startDate: s.toISOString(), endDate: null }
  }
  if (periodo === 'personalizado') {
    const startDate = dataInicio ? new Date(dataInicio + 'T00:00:00').toISOString() : null
    const endDate = dataFim ? new Date(dataFim + 'T23:59:59').toISOString() : null
    if (startDate || endDate) return { startDate, endDate }
  }
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState(INITIAL_FILTERS)
  const [busca, setBusca] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [embalagemSelecionada, setEmbalagemSelecionada] = useState(null)
  const [showDetalhes, setShowDetalhes] = useState(false)

  const serverFilter = useMemo(() => getServerFilter(filtros), [filtros])
  const limitado = useEmbalagens()
  const comFiltro = useEmbalagensPeriodo(
    serverFilter?.startDate ?? null,
    serverFilter?.endDate ?? null,
    { enabled: Boolean(serverFilter) }
  )
  const { data: embalagens = [], isLoading, refetch } = serverFilter ? comFiltro : limitado

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => refetch(), 5000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, refetch])

  const exportarCSV = () => {
    const headers = ['Data/Hora', 'NF', 'Cliente', 'Operador', 'Tempo (seg)', 'Status', 'Observacao']
    const rows = embalagensFiltradas.map(e => [
      formatDateTime(e.createdAt),
      e.nf_number || '-',
      e.cliente_nome || '-',
      e.operador_nome || '-',
      e.tempo_total_segundos || 0,
      e.status || '-',
      e.observacao || '-'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `embalagens_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    a.click()
  }

  const operadores = [...new Set(
    embalagens
      .map((embalagem) => embalagem.operador_nome)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))

  const embalagensFiltradas = embalagens.filter(e => {
    if (!matchesPeriodo(e.createdAt, filtros.periodo, filtros.dataInicio, filtros.dataFim)) {
      return false
    }

    if (filtros.status !== 'todos' && e.status !== filtros.status) {
      return false
    }

    if (filtros.operador !== 'todos' && e.operador_nome !== filtros.operador) {
      return false
    }

    if (!matchesOcorrencia(e, filtros.ocorrencia)) {
      return false
    }

    if (busca) {
      const termo = busca.toLowerCase()
      const matchBusca = (
        (e.nf_number && e.nf_number.toLowerCase().includes(termo)) ||
        (e.cliente_nome && e.cliente_nome.toLowerCase().includes(termo)) ||
        (e.operador_nome && e.operador_nome.toLowerCase().includes(termo)) ||
        (e.observacao && e.observacao.toLowerCase().includes(termo))
      )

      if (!matchBusca) {
        return false
      }
    }

    return true
  })

  const filtrosAtivos = [
    filtros.periodo !== 'todas',
    filtros.status !== 'todos',
    filtros.operador !== 'todos',
    filtros.ocorrencia !== 'todas',
    Boolean(filtros.dataInicio),
    Boolean(filtros.dataFim),
    Boolean(busca.trim())
  ].filter(Boolean).length

  const atualizarFiltro = (campo, valor) => {
    setFiltros((prev) => {
      const next = { ...prev, [campo]: valor }

      if (campo === 'periodo' && valor !== 'personalizado') {
        next.dataInicio = ''
        next.dataFim = ''
      }

      if ((campo === 'dataInicio' || campo === 'dataFim') && valor) {
        next.periodo = 'personalizado'
      }

      return next
    })
  }

  const limparFiltros = () => {
    setFiltros(INITIAL_FILTERS)
    setBusca('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center lg:justify-start gap-2">
              <LayoutDashboard className="w-8 h-8" />
              Dashboard PackFlow
            </h1>
            <p className="text-gray-600 mt-1">Gestao de Embalagens</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex-1 sm:flex-none"
            >
              Tela Inicial
            </Button>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-atualizar
            </Button>
            <Button onClick={exportarCSV} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={() => navigate('/ranking')} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Trophy className="w-4 h-4 mr-2" />
              Ver Ranking
            </Button>
            <Button onClick={() => navigate('/operadores')} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Users className="w-4 h-4 mr-2" />
              Operadores
            </Button>
          </div>
        </div>

        <ResumoCards embalagens={embalagensFiltradas} />

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={filtros.periodo === 'todas' ? 'default' : 'outline'} onClick={() => atualizarFiltro('periodo', 'todas')}>
                Todas
              </Button>
              <Button size="sm" variant={filtros.periodo === 'hoje' ? 'default' : 'outline'} onClick={() => atualizarFiltro('periodo', 'hoje')}>
                Hoje
              </Button>
              <Button size="sm" variant={filtros.periodo === 'semana' ? 'default' : 'outline'} onClick={() => atualizarFiltro('periodo', 'semana')}>
                Ultima Semana
              </Button>
              <Button size="sm" variant={filtros.periodo === 'mes' ? 'default' : 'outline'} onClick={() => atualizarFiltro('periodo', 'mes')}>
                Ultimos 30 dias
              </Button>
              <Button size="sm" variant={filtros.periodo === 'personalizado' ? 'default' : 'outline'} onClick={() => atualizarFiltro('periodo', 'personalizado')}>
                Periodo customizado
              </Button>
              <Button size="sm" variant="ghost" onClick={limparFiltros} className="text-gray-600">
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar filtros
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por NF, cliente, operador ou observacao..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtros.status} onChange={(e) => atualizarFiltro('status', e.target.value)}>
                <option value="todos">Todos os status</option>
                <option value="CONCLUIDA">Concluida</option>
                <option value="SUSPEITA">Suspeita</option>
                <option value="CANCELADA">Cancelada</option>
              </Select>
              <Select value={filtros.operador} onChange={(e) => atualizarFiltro('operador', e.target.value)}>
                <option value="todos">Todos os operadores</option>
                {operadores.map((operador) => (
                  <option key={operador} value={operador}>{operador}</option>
                ))}
              </Select>
              <Select value={filtros.ocorrencia} onChange={(e) => atualizarFiltro('ocorrencia', e.target.value)}>
                <option value="todas">Todas as ocorrencias</option>
                <option value="avaria">Com avaria</option>
                <option value="duplicada">Duplicadas</option>
                <option value="pendente">Pendentes OCR</option>
                <option value="suspeita">Somente suspeitas</option>
                <option value="cancelada">Somente canceladas</option>
                <option value="sem_nf">Sem NF</option>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => atualizarFiltro('dataInicio', e.target.value)}
                />
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => atualizarFiltro('dataFim', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
              <span>{embalagensFiltradas.length} embalagens encontradas</span>
              <span>{filtrosAtivos} filtros ativos</span>
            </div>
            {!serverFilter && (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
                Exibindo os 500 registros mais recentes. Para buscar registros antigos, use o filtro de período ou datas.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">Carregando...</div>
          ) : embalagensFiltradas.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">Nenhuma embalagem encontrada</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Data/Hora</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">NF</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Operador</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tempo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {embalagensFiltradas.map((embalagem) => (
                      <tr
                        key={embalagem.id}
                        className={`border-b hover:bg-gray-50 ${
                          embalagem.tem_avaria ? 'bg-red-50' : embalagem.is_duplicada ? 'bg-orange-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-sm">{formatDateTime(embalagem.createdAt)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{embalagem.nf_number || '-'}</td>
                        <td className="px-4 py-3 text-sm">{embalagem.cliente_nome || '-'}</td>
                        <td className="px-4 py-3 text-sm">{embalagem.operador_nome || '-'}</td>
                        <td className="px-4 py-3 text-sm">{formatTime(embalagem.tempo_total_segundos || 0)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={
                                embalagem.status === 'CONCLUIDA'
                                  ? 'success'
                                  : embalagem.status === 'SUSPEITA'
                                    ? 'warning'
                                    : 'secondary'
                              }
                            >
                              {embalagem.status}
                            </Badge>
                            {embalagem.is_duplicada && <Badge variant="warning">Duplicada</Badge>}
                            {embalagem.tem_avaria && <Badge variant="destructive">Avaria</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEmbalagemSelecionada(embalagem)
                              setShowDetalhes(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y">
                {embalagensFiltradas.map((embalagem) => (
                  <div
                    key={embalagem.id}
                    className={`p-4 space-y-2 ${
                      embalagem.tem_avaria ? 'bg-red-50' : embalagem.is_duplicada ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{formatDateTime(embalagem.createdAt)}</p>
                        <p className="text-lg font-semibold">{embalagem.nf_number || '-'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmbalagemSelecionada(embalagem)
                          setShowDetalhes(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Cliente:</span> {embalagem.cliente_nome || '-'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Operador:</span> {embalagem.operador_nome || '-'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        Tempo: {formatTime(embalagem.tempo_total_segundos || 0)}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant={
                            embalagem.status === 'CONCLUIDA'
                              ? 'success'
                              : embalagem.status === 'SUSPEITA'
                                ? 'warning'
                                : 'secondary'
                          }
                        >
                          {embalagem.status}
                        </Badge>
                        {embalagem.is_duplicada && <Badge variant="warning">Duplicada</Badge>}
                        {embalagem.tem_avaria && <Badge variant="destructive">Avaria</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {embalagemSelecionada && (
        <ModalDetalhes
          embalagem={embalagemSelecionada}
          isOpen={showDetalhes}
          onClose={() => {
            setShowDetalhes(false)
            setEmbalagemSelecionada(null)
          }}
          onUpdateSuccess={() => {
            refetch()
            setShowDetalhes(false)
            setEmbalagemSelecionada(null)
          }}
        />
      )}
    </div>
  )
}
