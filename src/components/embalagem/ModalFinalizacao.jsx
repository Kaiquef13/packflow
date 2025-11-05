import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Clock, Package, User, Loader2, MessageSquare } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function ModalFinalizacao({
  nfNumber,
  clienteNome,
  tempoTotal,
  operadorNome,
  onFinalizar,
  onFinalizarComObservacao,
  isProcessing = false
}) {
  const [showObservacao, setShowObservacao] = useState(false)
  const [observacao, setObservacao] = useState('')

  const handleFinalizarSemObservacao = () => {
    onFinalizar?.()
  }

  const handleFinalizarComObservacao = () => {
    if (observacao.trim()) {
      onFinalizarComObservacao?.(observacao.trim())
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md">
        <DialogHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 -m-6 mb-0 p-6 rounded-t-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="flex items-center justify-center mb-2"
          >
            <div className="bg-white rounded-full p-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
          </motion.div>
          <DialogTitle className="text-center text-white text-2xl">
            Embalagem Concluída!
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Package className="w-4 h-4" />
                <span>NF</span>
              </div>
              <p className="font-bold text-lg">{nfNumber || '-'}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>Tempo</span>
              </div>
              <p className="font-bold text-lg">{formatTime(tempoTotal)}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <User className="w-4 h-4" />
                <span>Cliente</span>
              </div>
              <p className="font-medium">{clienteNome || '-'}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <User className="w-4 h-4" />
                <span>Operador</span>
              </div>
              <p className="font-medium">{operadorNome}</p>
            </div>
          </div>

          {/* Observação */}
          {showObservacao && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MessageSquare className="w-4 h-4" />
                Observação (opcional)
              </label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Adicione alguma observação sobre esta embalagem..."
                rows={3}
                className="resize-none"
              />
            </motion.div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-2 pt-2">
            {!showObservacao ? (
              <>
                <Button
                  onClick={handleFinalizarSemObservacao}
                  disabled={isProcessing}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Tudo OK - Próxima Embalagem
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowObservacao(true)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Adicionar Observação
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleFinalizarComObservacao}
                  disabled={isProcessing || !observacao.trim()}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Salvar e Continuar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowObservacao(false)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
