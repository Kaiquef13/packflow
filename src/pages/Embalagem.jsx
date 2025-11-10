import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraCapture from '@/components/embalagem/CameraCapture'
import ModalFinalizacao from '@/components/embalagem/ModalFinalizacao'
import ModalDuplicidade from '@/components/embalagem/ModalDuplicidade'
import { Button } from '@/components/ui/button'
import { useUploadFile, useExtractData, useCreateEmbalagem, useUpdateEmbalagem } from '@/hooks/useEmbalagens'
import amplifyService from '@/services/amplify'

export default function Embalagem() {
  const navigate = useNavigate()
  const [operador, setOperador] = useState(null)
  const [etapa, setEtapa] = useState(1)
  const [startTime, setStartTime] = useState(null)

  // Dados da embalagem
  const [nfNumber, setNfNumber] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [fotoDanfeKey, setFotoDanfeKey] = useState('')
  const [fotoConteudoKey, setFotoConteudoKey] = useState('')
  const [fotoCaixaKey, setFotoCaixaKey] = useState('')

  // Estados
  const [showModalFinalizacao, setShowModalFinalizacao] = useState(false)
  const [showModalDuplicidade, setShowModalDuplicidade] = useState(false)
  const [ultimoResumo, setUltimoResumo] = useState(null)
  const [embalagemOriginal, setEmbalagemOriginal] = useState(null)
  const [isDuplicada, setIsDuplicada] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOcrRunning, setIsOcrRunning] = useState(false)
  const [ocrError, setOcrError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [isSalvandoObservacao, setIsSalvandoObservacao] = useState(false)
  const [duplicidadeAutoResumo, setDuplicidadeAutoResumo] = useState(null)
  const [isRegistrandoDuplicidade, setIsRegistrandoDuplicidade] = useState(false)
  const ocrJobIdRef = useRef(0)
  const feedbackTimeoutRef = useRef(null)

  const uploadFile = useUploadFile()
  const extractData = useExtractData()
  const createEmbalagem = useCreateEmbalagem()
  const updateEmbalagem = useUpdateEmbalagem()

  useEffect(() => {
    const operadorData = localStorage.getItem('packflow_operador')
    if (!operadorData) {
      navigate('/')
      return
    }
    setOperador(JSON.parse(operadorData))
  }, [navigate])

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  const startOcrBackground = async (fileKey) => {
    const jobId = Date.now()
    ocrJobIdRef.current = jobId
    setIsOcrRunning(true)
    setOcrError(null)

    try {
      const ocrResult = await extractData.mutateAsync({ key: fileKey })
      if (ocrJobIdRef.current !== jobId) return

      const extractedNf = ocrResult.nf_number || ''
      const extractedCliente = ocrResult.cliente_nome || ''

      setNfNumber(extractedNf)
      setClienteNome(extractedCliente)

      if (extractedNf) {
        const embalagens = await amplifyService.filterEmbalagens({ nf_number: { eq: extractedNf } })
        if (ocrJobIdRef.current !== jobId) return

        const original = embalagens?.find(e => !e.is_duplicada)

        if (original) {
          setEmbalagemOriginal(original)
          setIsDuplicada(true)
          try {
            const resumo = await registrarDuplicidadeAutomatica({
              original,
              nfNumberValue: extractedNf,
              clienteValue: extractedCliente,
              fileKey
            })
            if (ocrJobIdRef.current !== jobId) return
            setDuplicidadeAutoResumo(resumo)
            setShowModalDuplicidade(true)
          } catch (registroErro) {
            console.error('Erro ao registrar duplicidade automaticamente:', registroErro)
            alert('Erro ao registrar duplicidade automaticamente. Tente novamente.')
            setDuplicidadeAutoResumo(null)
            setShowModalDuplicidade(true)
          } finally {
            setIsProcessing(false)
            setIsOcrRunning(false)
          }
          return
        }
      }

      setIsDuplicada(false)
      setEmbalagemOriginal(null)
      setShowModalDuplicidade(false)
    } catch (error) {
      console.error('Erro na extracao da DANFE:', error)
      if (ocrJobIdRef.current === jobId) {
        setOcrError('Nao foi possivel extrair automaticamente. Preencha manualmente.')
      }
    } finally {
      if (ocrJobIdRef.current === jobId) {
        setIsOcrRunning(false)
      }
    }
  }

  const handleCaptureEtapa1 = async (file, preview) => {
    setIsProcessing(true)

    try {
      const { key: fileKey } = await uploadFile.mutateAsync(file)
      setFotoDanfeKey(fileKey)
      setIsProcessing(false)
      if (!startTime) {
        setStartTime(new Date())
      }
      setEtapa(2)
      startOcrBackground(fileKey)
    } catch (error) {
      console.error('Erro na etapa 1:', error)
      alert('Erro ao processar foto da DANFE')
      setIsProcessing(false)
    }
  }

  const confirmarDuplicidade = () => {
    setShowModalDuplicidade(false)
    if (!startTime) {
      setStartTime(new Date())
    }
    if (etapa < 2) {
      setEtapa(2)
    }
  }

  const handleCaptureEtapa2 = async (file, preview) => {
    setIsProcessing(true)

    try {
      const { key } = await uploadFile.mutateAsync(file)
      setFotoConteudoKey(key)

      setIsProcessing(false)
      setEtapa(3)
    } catch (error) {
      console.error('Erro na etapa 2:', error)
      alert('Erro ao fazer upload da foto')
      setIsProcessing(false)
    }
  }

  const handleCaptureEtapa3 = async (file, preview) => {
    setIsProcessing(true)

    try {
      const { key } = await uploadFile.mutateAsync(file)
      setFotoCaixaKey(key)
      await finalizarEmbalagem('')
    } catch (error) {
      console.error('Erro na etapa 3:', error)
      alert('Erro ao fazer upload da foto')
      setIsProcessing(false)
    }
  }

  const finalizarEmbalagem = async (observacao = '') => {
    setIsProcessing(true)

    try {
      const endTime = new Date()
      const effectiveStart = startTime || endTime
      const tempoTotalSegundos = Math.max(
        1,
        Math.floor((endTime - effectiveStart) / 1000)
      )

      const status = tempoTotalSegundos < 60 ? 'SUSPEITA' : 'CONCLUIDA'

      const alertaPrefix = observacao ? `${observacao}\n` : ''
      const observacaoFinal = tempoTotalSegundos < 60
        ? `${alertaPrefix}[ALERTA: Tempo suspeito - ${tempoTotalSegundos}s]`.trim()
        : observacao || ''

      const data = {
        nf_number: nfNumber,
        cliente_nome: clienteNome,
        start_time: effectiveStart.toISOString(),
        end_time: endTime.toISOString(),
        tempo_total_segundos: tempoTotalSegundos,
        foto_danfe_url: fotoDanfeKey,
        foto_conteudo_url: fotoConteudoKey,
        foto_caixa_url: fotoCaixaKey,
        observacao: observacaoFinal,
        operador_id: operador.id,
        operador_nome: operador.apelido || operador.nome,
        pendente_extracao: !nfNumber,
        status: status,
        tem_avaria: false,
        is_duplicada: isDuplicada,
        nf_original_id: embalagemOriginal?.id || null,
        data_nf_original: embalagemOriginal?.createdAt || null,
      }

      const created = await createEmbalagem.mutateAsync(data)

      setUltimoResumo({
        id: created?.id,
        nfNumber: created?.nf_number ?? data.nf_number,
        clienteNome: created?.cliente_nome ?? data.cliente_nome,
        tempoTotal: tempoTotalSegundos,
        operadorNome: operador?.apelido || operador?.nome,
        observacao: observacaoFinal,
        status,
      })
      setShowModalFinalizacao(true)

      triggerFeedback('Embalagem salva!')
      resetarEstado()
    } catch (error) {
      console.error('Erro ao finalizar embalagem:', error)
      alert('Erro ao salvar embalagem')
      setIsProcessing(false)
    }
  }

  const registrarDuplicidadeAutomatica = async ({ original, nfNumberValue, clienteValue, fileKey }) => {
    setIsRegistrandoDuplicidade(true)
    try {
      const now = new Date()
      const nfValue = nfNumberValue || nfNumber
      const cliente = clienteValue || clienteNome
      const observacaoDup = `[DUPLICIDADE] Registro vinculado à NF original ${original?.nf_number || original?.id || ''}`

      const data = {
        nf_number: nfValue,
        cliente_nome: cliente,
        start_time: now.toISOString(),
        end_time: now.toISOString(),
        tempo_total_segundos: 0,
        foto_danfe_url: fileKey,
        foto_conteudo_url: null,
        foto_caixa_url: null,
        observacao: observacaoDup,
        operador_id: operador?.id,
        operador_nome: operador?.apelido || operador?.nome,
        pendente_extracao: false,
        status: 'CANCELADA',
        tem_avaria: false,
        is_duplicada: true,
        nf_original_id: original?.id || null,
        data_nf_original: original?.createdAt || original?.start_time || null,
      }

      const record = await createEmbalagem.mutateAsync(data)
      triggerFeedback('Duplicidade registrada!')

      return {
        id: record?.id ?? data.nf_number,
        nfNumber: record?.nf_number ?? nfValue,
        clienteNome: record?.cliente_nome ?? cliente,
        operadorNome: operador?.apelido || operador?.nome,
        originalOperador: original?.operador_nome || '-',
        originalData: original?.createdAt || original?.start_time || null,
      }
    } finally {
      setIsRegistrandoDuplicidade(false)
    }
  }

  const triggerFeedback = (message) => {
    setFeedbackMessage(message)
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    feedbackTimeoutRef.current = setTimeout(() => setFeedbackMessage(null), 3000)
  }

  const resetarEstado = () => {
    setEtapa(1)
    setStartTime(null)
    setNfNumber('')
    setClienteNome('')
    setFotoDanfeKey('')
    setFotoConteudoKey('')
    setFotoCaixaKey('')
    setShowModalDuplicidade(false)
    setEmbalagemOriginal(null)
    setIsDuplicada(false)
    setIsProcessing(false)
    setIsOcrRunning(false)
    setOcrError(null)
    ocrJobIdRef.current = 0
  }

  const handleResumoConfirmado = () => {
    setShowModalFinalizacao(false)
    setUltimoResumo(null)
  }

  const handleSalvarObservacaoExtra = async (texto) => {
    if (!ultimoResumo?.id || !texto) {
      handleResumoConfirmado()
      return
    }

    setIsSalvandoObservacao(true)
    try {
      await updateEmbalagem.mutateAsync({
        id: ultimoResumo.id,
        data: { observacao: texto }
      })
      triggerFeedback('Observação salva!')
      setUltimoResumo((prev) => (prev ? { ...prev, observacao: texto } : prev))
      handleResumoConfirmado()
    } catch (error) {
      console.error('Erro ao salvar observação:', error)
      alert('Erro ao salvar observação')
    } finally {
      setIsSalvandoObservacao(false)
    }
  }

  const handleDuplicidadeAutoConfirm = () => {
    setShowModalDuplicidade(false)
    setDuplicidadeAutoResumo(null)
    resetarEstado()
  }

  const handleVoltarInicio = () => {
    if (window.confirm('Deseja voltar para a tela inicial? O progresso atual será perdido.')) {
      resetarEstado()
      setShowModalFinalizacao(false)
      setShowModalDuplicidade(false)
      navigate('/')
    }
  }

  return (
    <>
      {(isOcrRunning || ocrError || feedbackMessage) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
          {isOcrRunning && (
            <div className="bg-white/90 text-indigo-700 px-4 py-2 rounded shadow">
              Extraindo dados da DANFE em segundo plano...
            </div>
          )}
          {ocrError && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded shadow">
              {ocrError}
            </div>
          )}
          {feedbackMessage && (
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded shadow">
              {feedbackMessage}
            </div>
          )}
        </div>
      )}

      <div className="fixed top-28 right-4 z-[60] pointer-events-auto opacity-90">
        <Button variant="outline" size="sm" onClick={handleVoltarInicio} className="bg-white/80 backdrop-blur border-gray-200 shadow">
          Tela Inicial
        </Button>
      </div>

      {etapa === 1 && (
        <CameraCapture
          etapa={1}
          titulo="FOTO DA DANFE"
          subtitulo="Tire uma foto clara da nota fiscal"
          onCapture={handleCaptureEtapa1}
          isProcessing={isProcessing}
        />
      )}

      {etapa === 2 && (
        <CameraCapture
          etapa={2}
          titulo="FOTO DOS PRODUTOS"
          subtitulo="Tire uma foto dos itens antes de embalar"
          onCapture={handleCaptureEtapa2}
          isProcessing={isProcessing}
        />
      )}

      {etapa === 3 && (
        <CameraCapture
          etapa={3}
          titulo="FOTO DA CAIXA FECHADA"
          subtitulo="Tire uma foto da embalagem pronta"
          onCapture={handleCaptureEtapa3}
          isProcessing={isProcessing}
        />
      )}

      {showModalFinalizacao && ultimoResumo && (
        <ModalFinalizacao
          nfNumber={ultimoResumo.nfNumber}
          clienteNome={ultimoResumo.clienteNome}
          tempoTotal={ultimoResumo.tempoTotal}
          operadorNome={ultimoResumo.operadorNome}
          onFinalizar={handleResumoConfirmado}
          onFinalizarComObservacao={handleSalvarObservacaoExtra}
          isProcessing={isSalvandoObservacao}
        />
      )}

      {showModalDuplicidade && (
        <ModalDuplicidade
          nfNumber={duplicidadeAutoResumo?.nfNumber || nfNumber}
          embalagemOriginal={embalagemOriginal}
          autoSaved={Boolean(duplicidadeAutoResumo)}
          resumoDuplicidade={duplicidadeAutoResumo}
          onConfirmar={duplicidadeAutoResumo ? handleDuplicidadeAutoConfirm : confirmarDuplicidade}
          isProcessing={isRegistrandoDuplicidade || isProcessing}
        />
      )}
    </>
  )
}
