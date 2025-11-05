import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Loader2 } from 'lucide-react'

const TIPOS_AVARIA = [
  { value: 'produto_errado', label: 'Produto Errado' },
  { value: 'produto_faltando', label: 'Produto Faltando' },
  { value: 'produto_danificado', label: 'Produto Danificado' },
  { value: 'embalagem_inadequada', label: 'Embalagem Inadequada' },
  { value: 'etiqueta_errada', label: 'Etiqueta Errada' },
  { value: 'outro', label: 'Outro' },
]

export default function ModalAvaria({
  embalagem,
  isOpen,
  onClose,
  onConfirmar,
  isProcessing = false
}) {
  const [tipoAvaria, setTipoAvaria] = useState('')
  const [observacaoAvaria, setObservacaoAvaria] = useState('')

  const handleConfirmar = () => {
    if (!tipoAvaria) return

    onConfirmar?.({
      tipo_avaria: tipoAvaria,
      observacao_avaria: observacaoAvaria.trim() || '-',
    })
  }

  const handleClose = () => {
    if (!isProcessing) {
      setTipoAvaria('')
      setObservacaoAvaria('')
      onClose?.()
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="bg-red-50 -m-6 mb-0 p-6 border-b-4 border-red-500">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-red-600 rounded-full p-3">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-red-900 text-xl">
            Registrar Avaria/Erro
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Alerta */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900">Atenção!</p>
                <p className="text-sm text-orange-800 mt-1">
                  Este registro impactará negativamente a qualidade do operador <strong>{embalagem?.operador_nome}</strong> no ranking.
                </p>
              </div>
            </div>
          </div>

          {/* Informações da embalagem */}
          <div className="bg-gray-50 rounded p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">NF:</span>
              <span className="font-medium">{embalagem?.nf_number || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{embalagem?.cliente_nome || '-'}</span>
            </div>
          </div>

          {/* Tipo de avaria */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tipo de Avaria/Erro *
            </label>
            <Select
              value={tipoAvaria}
              onChange={(e) => setTipoAvaria(e.target.value)}
              disabled={isProcessing}
            >
              <option value="">Selecione o tipo...</option>
              {TIPOS_AVARIA.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Detalhes/Observação
            </label>
            <Textarea
              value={observacaoAvaria}
              onChange={(e) => setObservacaoAvaria(e.target.value)}
              placeholder="Descreva o problema encontrado..."
              rows={3}
              disabled={isProcessing}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={!tipoAvaria || isProcessing}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Confirmar Avaria'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
