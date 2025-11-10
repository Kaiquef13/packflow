import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Download, Trophy, Users, RefreshCw, Search, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useEmbalagens } from '@/hooks/useEmbalagens'
import ResumoCards from '@/components/dashboard/ResumoCards'
import ModalDetalhes from '@/components/dashboard/ModalDetalhes'
import { formatDateTime, formatTime } from '@/lib/utils'
import { format } from 'date-fns'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: embalagens = [], isLoading, refetch } = useEmbalagens()
  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [embalagemSelecionada, setEmbalagemSelecionada] = useState(null)
  const [showDetalhes, setShowDetalhes] = useState(false)

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

  const embalagensFiltradas = embalagens.filter(e => {
    if (filtro === 'hoje') {
      const hoje = new Date().toDateString()
      const dataEmbalagem = new Date(e.createdAt).toDateString()
      if (hoje !== dataEmbalagem) return false
    } else if (filtro === 'semana') {
      const semanaAtras = new Date()
      semanaAtras.setDate(semanaAtras.getDate() - 7)
      if (new Date(e.createdAt) < semanaAtras) return false
    }

    if (busca) {
      const termo = busca.toLowerCase()
      return (
        (e.nf_number && e.nf_number.toLowerCase().includes(termo)) ||
        (e.cliente_nome && e.cliente_nome.toLowerCase().includes(termo)) ||
        (e.operador_nome && e.operador_nome.toLowerCase().includes(termo))
      )
    }

    return true
  })

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
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={filtro === 'todas' ? 'default' : 'outline'} onClick={() => setFiltro('todas')}>
                Todas
              </Button>
              <Button size="sm" variant={filtro === 'hoje' ? 'default' : 'outline'} onClick={() => setFiltro('hoje')}>
                Hoje
              </Button>
              <Button size="sm" variant={filtro === 'semana' ? 'default' : 'outline'} onClick={() => setFiltro('semana')}>
                Ultima Semana
              </Button>
            </div>
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por NF, cliente ou operador..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
