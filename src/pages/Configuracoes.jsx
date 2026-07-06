import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConfiguracao, useUpdateConfiguracao, DEFAULT_TEMPO_MINIMO_SUSPEITA_SEGUNDOS } from '@/hooks/useConfiguracao'

export default function Configuracoes() {
  const navigate = useNavigate()
  const { data: configuracao, isLoading } = useConfiguracao()
  const updateConfiguracao = useUpdateConfiguracao()

  const [tempoMinimoSuspeita, setTempoMinimoSuspeita] = useState(DEFAULT_TEMPO_MINIMO_SUSPEITA_SEGUNDOS)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (configuracao?.tempo_minimo_suspeita_segundos != null) {
      setTempoMinimoSuspeita(configuracao.tempo_minimo_suspeita_segundos)
    }
  }, [configuracao])

  const handleSalvar = async () => {
    setSalvo(false)
    try {
      await updateConfiguracao.mutateAsync({
        tempo_minimo_suspeita_segundos: Number(tempoMinimoSuspeita),
      })
      setSalvo(true)
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      alert('Erro ao salvar configuração')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Configurações
            </h1>
            <p className="text-gray-600 mt-1">Parâmetros do sistema</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Detecção de tempo suspeito</h3>
          <p className="text-sm text-gray-600 mb-4">
            Embalagens finalizadas com tempo total abaixo deste valor são marcadas automaticamente
            como <strong>Suspeita</strong>.
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando...
            </div>
          ) : (
            <>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tempo mínimo (segundos)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  value={tempoMinimoSuspeita}
                  onChange={(e) => setTempoMinimoSuspeita(e.target.value)}
                  className="w-40"
                  disabled={updateConfiguracao.isPending}
                />
                <Button
                  onClick={handleSalvar}
                  disabled={updateConfiguracao.isPending || !tempoMinimoSuspeita || Number(tempoMinimoSuspeita) <= 0}
                >
                  {updateConfiguracao.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
                {salvo && !updateConfiguracao.isPending && (
                  <span className="text-sm text-emerald-600">Salvo!</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
