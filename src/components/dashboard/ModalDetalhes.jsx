import { useEffect, useState } from 'react'
import { X, AlertTriangle, Check, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUpdateEmbalagem } from '@/hooks/useEmbalagens'
import ModalAvaria from './ModalAvaria'
import ImageLightbox from './ImageLightbox'
import amplifyService from '@/services/amplify'

export default function ModalDetalhes({ embalagem, isOpen, onClose, onUpdateSuccess }) {
  const [showModalAvaria, setShowModalAvaria] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fotoUrls, setFotoUrls] = useState([])
  const [isLoadingFotos, setIsLoadingFotos] = useState(false)
  const updateEmbalagem = useUpdateEmbalagem()

  if (!embalagem) return null

  useEffect(() => {
    let isActive = true

    const loadFotos = async () => {
      if (!isOpen || !embalagem) {
        if (isActive) {
          setFotoUrls([])
        }
        return
      }

      setIsLoadingFotos(true)
      try {
        const fotoValues = [
          embalagem.foto_danfe_url,
          embalagem.foto_conteudo_url,
          embalagem.foto_caixa_url
        ]

        const resolved = await Promise.all(
          fotoValues.map((value) => amplifyService.resolvePublicFileUrl(value))
        )

        if (isActive) {
          setFotoUrls(resolved)
        }
      } catch (error) {
        console.error('Erro ao carregar fotos da embalagem:', error)
        if (isActive) {
          setFotoUrls([])
        }
      } finally {
        if (isActive) {
          setIsLoadingFotos(false)
        }
      }
    }

    loadFotos()
    return () => {
      isActive = false
    }
  }, [embalagem, isOpen])

  const fotos = [
    { url: fotoUrls[0], titulo: 'DANFE' },
    { url: fotoUrls[1], titulo: 'Produtos' },
    { url: fotoUrls[2], titulo: 'Caixa Fechada' }
  ]

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleString('pt-BR')
    } catch {
      return dateString
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleRemoverAvaria = async () => {
    if (!window.confirm('Tem certeza que deseja remover o registro de avaria?')) {
      return
    }

    setIsRemoving(true)
    try {
      await updateEmbalagem.mutateAsync({
        id: embalagem.id,
        data: {
          tem_avaria: false,
          tipo_avaria: null,
          observacao_avaria: null,
          avaria_registrada_por: null,
          avaria_registrada_em: null,
        },
      })
      onUpdateSuccess?.()
      setShowModalAvaria(false)
      onClose()
    } catch (error) {
      console.error('Erro ao remover avaria:', error)
      alert('Erro ao remover avaria')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>NF: {embalagem.nf_number || 'Sem número'}</span>
              {embalagem.is_duplicada && <Badge variant="warning">Duplicada</Badge>}
              {embalagem.tem_avaria && <Badge variant="destructive">Avaria</Badge>}
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
            </DialogTitle>
          </DialogHeader>

          {/* Galeria de Fotos */}
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-lg">Fotos da Embalagem</h3>
            <div className="grid grid-cols-3 gap-4">
              {fotos.map((foto, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-lg overflow-hidden bg-gray-100 ${
                    isLoadingFotos || !foto.url ? 'cursor-default' : 'cursor-pointer'
                  } group`}
                  onClick={() => {
                    if (!isLoadingFotos && foto.url) {
                      setSelectedImageIndex(idx)
                    }
                  }}
                >
                  {isLoadingFotos ? (
                    <div className="w-full h-32 flex items-center justify-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : foto.url ? (
                    <>
                      <img
                        src={foto.url}
                        alt={foto.titulo}
                        className="w-full h-32 object-cover group-hover:opacity-75 transition"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/50">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center text-gray-400">
                      Sem foto
                    </div>
                  )}
                  <p className="text-center text-sm font-medium mt-2">{foto.titulo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Informações Gerais */}
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-lg">Informações</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{embalagem.cliente_nome || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Operador</p>
                <p className="font-medium">{embalagem.operador_nome || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data/Hora</p>
                <p className="font-medium">{formatDateTime(embalagem.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tempo Total</p>
                <p className="font-medium">{formatTime(embalagem.tempo_total_segundos)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Início</p>
                <p className="font-medium text-xs">{formatDateTime(embalagem.start_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fim</p>
                <p className="font-medium text-xs">{formatDateTime(embalagem.end_time)}</p>
              </div>
            </div>

            {embalagem.observacao && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Observação</p>
                <p className="font-medium">{embalagem.observacao}</p>
              </div>
            )}
          </div>

          {/* Duplicidade */}
          {embalagem.is_duplicada && (
            <Card className="mt-6 border-orange-200 bg-orange-50">
              <div className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900">Embalagem Duplicada</p>
                    <p className="text-sm text-orange-800">
                      Referência da embalagem original:
                    </p>
                    <p className="font-medium text-orange-900">
                      NF: {embalagem.nf_original_id || '-'}
                    </p>
                    {embalagem.data_nf_original && (
                      <p className="text-sm text-orange-800">
                        Data: {formatDateTime(embalagem.data_nf_original)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Avaria */}
          {embalagem.tem_avaria && (
            <Card className="mt-6 border-red-200 bg-red-50">
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Avaria Registrada</p>
                      <p className="text-sm text-red-800">
                        Tipo: <span className="font-medium">{embalagem.tipo_avaria}</span>
                      </p>
                      {embalagem.observacao_avaria && (
                        <p className="text-sm text-red-800 mt-1">{embalagem.observacao_avaria}</p>
                      )}
                      {embalagem.avaria_registrada_por && (
                        <p className="text-xs text-red-700 mt-2">
                          Registrado por: {embalagem.avaria_registrada_por}
                        </p>
                      )}
                      {embalagem.avaria_registrada_em && (
                        <p className="text-xs text-red-700">
                          Em: {formatDateTime(embalagem.avaria_registrada_em)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoverAvaria}
                    disabled={isRemoving}
                    className="ml-2"
                  >
                    {isRemoving ? 'Removendo...' : 'Remover'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Ações */}
          <div className="flex gap-2 mt-6">
            {!embalagem.tem_avaria ? (
              <Button
                onClick={() => setShowModalAvaria(true)}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={isProcessing}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Registrar Avaria
              </Button>
            ) : null}

            <Button onClick={onClose} className="ml-auto" disabled={isProcessing || isRemoving}>
              <Check className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Avaria */}
      <ModalAvaria
        embalagem={embalagem}
        isOpen={showModalAvaria}
        isProcessing={isProcessing}
        onClose={() => setShowModalAvaria(false)}
        onConfirmar={async (avariaData) => {
          setIsProcessing(true)
          try {
            const now = new Date().toISOString()
            await updateEmbalagem.mutateAsync({
              id: embalagem.id,
              data: {
                tem_avaria: true,
                tipo_avaria: avariaData.tipo_avaria,
                observacao_avaria: avariaData.observacao_avaria,
                avaria_registrada_por: 'Sistema', // Pode ser substituído por usuário autenticado
                avaria_registrada_em: now,
              },
            })
            onUpdateSuccess?.()
            setShowModalAvaria(false)
            onClose()
          } catch (error) {
            console.error('Erro ao registrar avaria:', error)
            alert('Erro ao registrar avaria')
          } finally {
            setIsProcessing(false)
          }
        }}
      />

      {/* Lightbox de Imagens */}
      {selectedImageIndex !== null && (
        <ImageLightbox
          fotos={fotos}
          selectedIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onPrevious={() =>
            setSelectedImageIndex((i) => (i === 0 ? fotos.length - 1 : i - 1))
          }
          onNext={() =>
            setSelectedImageIndex((i) => (i === fotos.length - 1 ? 0 : i + 1))
          }
        />
      )}
    </>
  )
}
