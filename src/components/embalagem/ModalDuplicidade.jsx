import { useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, User, Calendar, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function ModalDuplicidade({
  nfNumber,
  embalagemOriginal,
  onConfirmar,
  isProcessing = false
}) {
  const audioContextRef = useRef(null)
  const oscillatorRef = useRef(null)

  // Tocar sirene sonora
  useEffect(() => {
    const playAlarmSound = () => {
      try {
        // Criar contexto de áudio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        audioContextRef.current = audioContext

        // Criar oscilador
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Configurar sirene (alternando entre duas frequências)
        oscillator.type = 'sine'
        oscillator.frequency.value = 800

        // Volume
        gainNode.gain.value = 0.3

        // Alternar frequências para criar efeito de sirene
        let toggle = false
        const interval = setInterval(() => {
          oscillator.frequency.value = toggle ? 600 : 800
          toggle = !toggle
        }, 200)

        oscillatorRef.current = { oscillator, interval }

        oscillator.start()

        // Parar após 3 segundos
        setTimeout(() => {
          oscillator.stop()
          clearInterval(interval)
        }, 3000)
      } catch (error) {
        console.error('Erro ao tocar sirene:', error)
      }
    }

    playAlarmSound()

    return () => {
      // Cleanup
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.oscillator.stop()
          clearInterval(oscillatorRef.current.interval)
        } catch (e) {
          // Ignore
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md border-4 border-orange-500">
        <DialogHeader className="bg-gradient-to-r from-orange-500 to-red-600 -m-6 mb-0 p-6 rounded-t-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mb-2"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, -5, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 0.5,
                repeatDelay: 0.5
              }}
              className="bg-white rounded-full p-3"
            >
              <AlertTriangle className="w-12 h-12 text-orange-600" />
            </motion.div>
          </motion.div>
          <DialogTitle className="text-center text-white text-2xl">
            ⚠️ NOTA FISCAL DUPLICADA!
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Alerta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4"
          >
            <p className="text-center font-bold text-orange-900 text-lg mb-2">
              Esta NF já foi embalada!
            </p>
            <p className="text-center text-orange-800 text-sm">
              A nota fiscal <strong>{nfNumber}</strong> já foi processada anteriormente.
            </p>
          </motion.div>

          {/* Dados da embalagem original */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">
              Informações da Embalagem Original:
            </h3>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Package className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">NF</p>
                  <p className="font-medium">{embalagemOriginal?.nf_number || nfNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{embalagemOriginal?.cliente_nome || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Operador</p>
                  <p className="font-medium">{embalagemOriginal?.operador_nome || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Data/Hora</p>
                  <p className="font-medium">{formatDateTime(embalagemOriginal?.createdAt || embalagemOriginal?.start_time)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Atenção:</strong> Verifique com o supervisor antes de continuar.
              Esta embalagem será marcada como duplicada no sistema.
            </p>
          </div>

          {/* Botão */}
          <Button
            onClick={onConfirmar}
            disabled={isProcessing}
            size="lg"
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Entendi - Registrar como Duplicada'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
