import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraCapture from '@/components/embalagem/CameraCapture'
import ModalFinalizacao from '@/components/embalagem/ModalFinalizacao'
import ModalDuplicidade from '@/components/embalagem/ModalDuplicidade'
import { Button } from '@/components/ui/button'
import { useUploadFile, useExtractData, useCreateEmbalagem, useUpdateEmbalagem } from '@/hooks/useEmbalagens'
import { useConfiguracao, DEFAULT_TEMPO_MINIMO_SUSPEITA_SEGUNDOS } from '@/hooks/useConfiguracao'
import { validarChaveAcesso, nfFromChave, normalizeNf, montarMarcadorPedido, decidirDuplicidade } from '@/lib/nfe'
import { lerCandidatosPedido } from '@/lib/barcode'
import { verificarAtualizacao } from '@/lib/versao'
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
  const [duplicidadeSuspeita, setDuplicidadeSuspeita] = useState(false)
  const [infoNfNova, setInfoNfNova] = useState(null)
  const [pedidoBaseLinker, setPedidoBaseLinker] = useState('')
  const [produtosPedido, setProdutosPedido] = useState([])
  const empresaEmitenteRef = useRef('')
  const pedidoRef = useRef('')
  const ocrJobIdRef = useRef(0)
  const feedbackTimeoutRef = useRef(null)

  const uploadFile = useUploadFile()
  const extractData = useExtractData()
  const createEmbalagem = useCreateEmbalagem()
  const updateEmbalagem = useUpdateEmbalagem()
  const { data: configuracao } = useConfiguracao()
  const tempoMinimoSuspeitaSegundos = configuracao?.tempo_minimo_suspeita_segundos ?? DEFAULT_TEMPO_MINIMO_SUSPEITA_SEGUNDOS

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

  const startOcrBackground = async (fileKey, candidatosPedido = null) => {
    const jobId = Date.now()
    ocrJobIdRef.current = jobId
    setIsOcrRunning(true)
    setOcrError(null)

    try {
      let extractedCliente = ''
      let extractedNf = ''
      let pedidoLido = ''
      let ocrResult = null

      // Caminho principal: o numero do pedido lido do codigo de barras traz
      // NF, cliente e produtos direto do BaseLinker — exato e sem custo.
      if (candidatosPedido?.length) {
        try {
          const info = await amplifyService.consultarPedidoBaseLinker(candidatosPedido)
          if (ocrJobIdRef.current !== jobId) return
          if (info?.order_id) {
            pedidoLido = String(info.order_id)
            extractedCliente = info.cliente_nome || ''
            extractedNf = normalizeNf(info.nf_number || '')
            setProdutosPedido(info.produtos || [])
            empresaEmitenteRef.current = info.empresa || ''
            pedidoRef.current = pedidoLido
          }
        } catch (consultaErro) {
          console.warn('Consulta BaseLinker falhou, usando OCR como fallback:', consultaErro)
          if (ocrJobIdRef.current !== jobId) return
        }
      }

      // Fallback: etiqueta ilegivel ou pedido ausente na API
      if (!extractedNf || !extractedCliente) {
        ocrResult = await extractData.mutateAsync({
          key: fileKey,
          skipForms: Boolean(extractedNf),
          barcodeStatus: pedidoLido ? 'pedido_ok' : (candidatosPedido?.length ? 'pedido_nao_encontrado' : 'sem_barcode')
        })
        if (ocrJobIdRef.current !== jobId) return
        if (!extractedCliente) extractedCliente = ocrResult.cliente_nome || ''
        if (!extractedNf) {
          const chaveOcr = ocrResult?.chave_acesso || ''
          extractedNf = validarChaveAcesso(chaveOcr)
            ? nfFromChave(chaveOcr)
            : normalizeNf(ocrResult?.nf_number || '')
        }
      }

      setNfNumber(extractedNf)
      setClienteNome(extractedCliente)
      setPedidoBaseLinker(pedidoLido)

      if (extractedNf) {
        const embalagens = await amplifyService.filterEmbalagens({ nf_number: { eq: extractedNf } })
        if (ocrJobIdRef.current !== jobId) return

        // Candidatos: registros nao-duplicados dos ultimos 30 dias
        const candidatos = (embalagens || []).filter(e => {
          if (e.is_duplicada) return false
          const diffDias = (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          return diffDias <= 30
        })

        // Duplicata confirmada tem prioridade; 'confirmar' so prevalece se
        // nenhum outro candidato for duplicata de fato.
        let decisao = 'outro_documento'
        let original = null
        for (const candidato of candidatos) {
          const resultado = decidirDuplicidade({
            pedidoAtual: pedidoLido,
            clienteAtual: extractedCliente,
            candidato
          })
          if (resultado === 'duplicata') {
            decisao = 'duplicata'
            original = candidato
            break
          }
          if (resultado === 'confirmar' && decisao !== 'duplicata') {
            decisao = 'confirmar'
            original = candidato
          }
        }

        if (original && decisao === 'confirmar') {
          // Leitura incerta (sem chave ou sem cliente): o operador decide
          setEmbalagemOriginal(original)
          setInfoNfNova(pedidoLido ? { pedido: pedidoLido, empresa: empresaEmitenteRef.current } : null)
          setDuplicidadeSuspeita(true)
          setShowModalDuplicidade(true)
          setIsOcrRunning(false)
          return
        }

        if (original && decisao === 'duplicata') {
          setEmbalagemOriginal(original)
          setIsDuplicada(true)
          try {
            const resumo = await registrarDuplicidadeAutomatica({
              original,
              nfNumberValue: extractedNf,
              clienteValue: extractedCliente,
              fileKey,
              pedidoValue: pedidoLido
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

  const handleCaptureEtapa1 = async (file, preview, candidatosAoVivo = null) => {
    setIsProcessing(true)

    try {
      // A leitura durante a mira ja costuma resolver; a foto parada so entra
      // como reforco quando nada foi lido ao vivo.
      const barcodePromise = candidatosAoVivo?.length
        ? Promise.resolve([])
        : lerCandidatosPedido(file).catch((error) => {
            console.warn('Leitura de codigo de barras da foto falhou:', error)
            return []
          })

      const { key: fileKey } = await uploadFile.mutateAsync(file)
      setFotoDanfeKey(fileKey)
      setIsProcessing(false)
      if (!startTime) {
        setStartTime(new Date())
      }
      setEtapa(2)

      const candidatosFoto = await barcodePromise
      const candidatos = [...new Set([...(candidatosAoVivo || []), ...(candidatosFoto || [])])]
      startOcrBackground(fileKey, candidatos)
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
      await finalizarEmbalagem('', { fotoCaixaKey: key })
    } catch (error) {
      console.error('Erro na etapa 3:', error)
      alert('Erro ao fazer upload da foto')
      setIsProcessing(false)
    }
  }

  const finalizarEmbalagem = async (observacao = '', overrides = {}) => {
    setIsProcessing(true)

    try {
      const endTime = new Date()
      const effectiveStart = startTime || endTime
      const tempoTotalSegundos = Math.max(
        1,
        Math.floor((endTime - effectiveStart) / 1000)
      )

      const status = tempoTotalSegundos < tempoMinimoSuspeitaSegundos ? 'SUSPEITA' : 'CONCLUIDA'

      const alertaPrefix = observacao ? `${observacao}\n` : ''
      const observacaoFinal = tempoTotalSegundos < tempoMinimoSuspeitaSegundos
        ? `${alertaPrefix}[ALERTA: Tempo suspeito - ${tempoTotalSegundos}s]`.trim()
        : observacao || ''

      // Guarda a chave de acesso no registro (via marcador na observacao)
      // para futuras checagens de duplicidade compararem o documento completo
      const observacaoComChave = [observacaoFinal, montarMarcadorPedido(pedidoBaseLinker)]
        .filter(Boolean)
        .join('\n')

      const data = {
        nf_number: nfNumber,
        cliente_nome: clienteNome,
        start_time: effectiveStart.toISOString(),
        end_time: endTime.toISOString(),
        tempo_total_segundos: tempoTotalSegundos,
        foto_danfe_url: fotoDanfeKey,
        foto_conteudo_url: fotoConteudoKey,
        foto_caixa_url: overrides.fotoCaixaKey ?? fotoCaixaKey,
        observacao: observacaoComChave,
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
      // Entre uma embalagem e outra e o unico momento seguro para recarregar
      // no fluxo do operador, que nunca sai desta tela
      verificarAtualizacao()
    } catch (error) {
      console.error('Erro ao finalizar embalagem:', error)
      alert('Erro ao salvar embalagem')
      setIsProcessing(false)
    }
  }

  const handleSuspeitaConfirmada = async () => {
    if (isRegistrandoDuplicidade) return
    setDuplicidadeSuspeita(false)
    setInfoNfNova(null)
    setIsDuplicada(true)
    try {
      const resumo = await registrarDuplicidadeAutomatica({
        original: embalagemOriginal,
        nfNumberValue: nfNumber,
        clienteValue: clienteNome,
        fileKey: fotoDanfeKey
      })
      setDuplicidadeAutoResumo(resumo)
    } catch (error) {
      console.error('Erro ao registrar duplicidade confirmada:', error)
      alert('Erro ao registrar duplicidade. Tente novamente.')
      setDuplicidadeAutoResumo(null)
    }
  }

  const handleSuspeitaRecusada = () => {
    setDuplicidadeSuspeita(false)
    setShowModalDuplicidade(false)
    setEmbalagemOriginal(null)
    setIsDuplicada(false)
    setInfoNfNova(null)
  }

  const registrarDuplicidadeAutomatica = async ({ original, nfNumberValue, clienteValue, fileKey, pedidoValue = '' }) => {
    setIsRegistrandoDuplicidade(true)
    try {
      const now = new Date()
      const nfValue = nfNumberValue || nfNumber
      const cliente = clienteValue || clienteNome
      const observacaoDup = [
        `[DUPLICIDADE] Registro vinculado à NF original ${original?.nf_number || original?.id || ''}`,
        montarMarcadorPedido(pedidoValue || pedidoRef.current)
      ].filter(Boolean).join('\n')

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
    setDuplicidadeSuspeita(false)
    setInfoNfNova(null)
    setPedidoBaseLinker('')
    setProdutosPedido([])
    pedidoRef.current = ''
    empresaEmitenteRef.current = ''
    setIsProcessing(false)
    setIsOcrRunning(false)
    setOcrError(null)
    ocrJobIdRef.current = 0
  }

  const voltarParaEtapa1 = () => {
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
    setDuplicidadeSuspeita(false)
    setInfoNfNova(null)
    setPedidoBaseLinker('')
    setProdutosPedido([])
    pedidoRef.current = ''
    empresaEmitenteRef.current = ''
    setIsProcessing(false)
    setIsOcrRunning(false)
    setOcrError(null)
    setDuplicidadeAutoResumo(null)
    setIsRegistrandoDuplicidade(false)
    ocrJobIdRef.current = 0
  }

  const voltarParaEtapa2 = () => {
    setEtapa(2)
    setFotoCaixaKey('')
    setIsProcessing(false)
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
          onBack={voltarParaEtapa1}
          isProcessing={isProcessing}
          produtos={produtosPedido}
        />
      )}

      {etapa === 3 && (
        <CameraCapture
          etapa={3}
          titulo="FOTO DA CAIXA FECHADA"
          subtitulo="Tire uma foto da embalagem pronta"
          onCapture={handleCaptureEtapa3}
          onBack={voltarParaEtapa2}
          isProcessing={isProcessing}
          produtos={produtosPedido}
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
          modoConfirmacao={duplicidadeSuspeita}
          clienteNovo={clienteNome}
          infoNfNova={infoNfNova}
          onConfirmar={duplicidadeSuspeita ? handleSuspeitaConfirmada : duplicidadeAutoResumo ? handleDuplicidadeAutoConfirm : confirmarDuplicidade}
          onRecusar={duplicidadeSuspeita ? handleSuspeitaRecusada : undefined}
          isProcessing={isRegistrandoDuplicidade || isProcessing}
        />
      )}
    </>
  )
}
