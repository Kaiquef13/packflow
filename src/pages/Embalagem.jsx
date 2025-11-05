import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraCapture from '@/components/embalagem/CameraCapture'
import ModalFinalizacao from '@/components/embalagem/ModalFinalizacao'
import ModalDuplicidade from '@/components/embalagem/ModalDuplicidade'
import { useUploadFile, useExtractData, useCreateEmbalagem } from '@/hooks/useEmbalagens'
import amplifyService from '@/services/amplify'

export default function Embalagem() {
  const navigate = useNavigate()
  const [operador, setOperador] = useState(null)
  const [etapa, setEtapa] = useState(1)
  const [startTime, setStartTime] = useState(null)

  // Dados da embalagem
  const [nfNumber, setNfNumber] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [fotoDanfeUrl, setFotoDanfeUrl] = useState('')
  const [fotoConteudoUrl, setFotoConteudoUrl] = useState('')
  const [fotoCaixaUrl, setFotoCaixaUrl] = useState('')

  // Estados
  const [showModalFinalizacao, setShowModalFinalizacao] = useState(false)
  const [showModalDuplicidade, setShowModalDuplicidade] = useState(false)
  const [embalagemOriginal, setEmbalagemOriginal] = useState(null)
  const [isDuplicada, setIsDuplicada] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const uploadFile = useUploadFile()
  const extractData = useExtractData()
  const createEmbalagem = useCreateEmbalagem()

  useEffect(() => {
    const operadorData = localStorage.getItem('packflow_operador')
    if (!operadorData) {
      navigate('/')
      return
    }
    setOperador(JSON.parse(operadorData))
  }, [navigate])

  const handleCaptureEtapa1 = async (file, preview) => {
    setIsProcessing(true)

    try {
      // 1. Upload da foto
      const uploadResult = await uploadFile.mutateAsync(file)
      const fileUrl = uploadResult.file_url
      setFotoDanfeUrl(fileUrl)

      // 2. Extrair dados com OCR
      const jsonSchema = {
        type: 'object',
        properties: {
          nf_number: { type: 'string', description: 'Número da nota fiscal' },
          cliente_nome: { type: 'string', description: 'Nome do cliente' }
        }
      }

      const ocrResult = await extractData.mutateAsync({ fileUrl, jsonSchema })
      const extractedNf = ocrResult.nf_number || ''
      const extractedCliente = ocrResult.cliente_nome || ''

      setNfNumber(extractedNf)
      setClienteNome(extractedCliente)

      // 3. Verificar duplicidade
      if (extractedNf) {
        const embalagens = await amplifyService.filterEmbalagens({ nf_number: { eq: extractedNf } })
        const original = embalagens?.find(e => !e.is_duplicada)

        if (original) {
          setEmbalagemOriginal(original)
          setIsDuplicada(true)
          setShowModalDuplicidade(true)
          setIsProcessing(false)
          return
        }
      }

      // 4. Iniciar cronômetro
      setStartTime(new Date())
      setIsProcessing(false)
      setEtapa(2)
    } catch (error) {
      console.error('Erro na etapa 1:', error)
      alert('Erro ao processar foto da DANFE')
      setIsProcessing(false)
    }
  }

  const confirmarDuplicidade = () => {
    setShowModalDuplicidade(false)
    setStartTime(new Date())
    setEtapa(2)
  }

  const handleCaptureEtapa2 = async (file, preview) => {
    setIsProcessing(true)

    try {
      const uploadResult = await uploadFile.mutateAsync(file)
      setFotoConteudoUrl(uploadResult.file_url)
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
      const uploadResult = await uploadFile.mutateAsync(file)
      setFotoCaixaUrl(uploadResult.file_url)
      setIsProcessing(false)
      setShowModalFinalizacao(true)
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
      const tempoTotalSegundos = Math.floor((endTime - startTime) / 1000)
      const status = tempoTotalSegundos < 60 ? 'suspeito' : 'concluido'

      const data = {
        nf_number: nfNumber,
        cliente_nome: clienteNome,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        tempo_total_segundos: tempoTotalSegundos,
        foto_danfe_url: fotoDanfeUrl,
        foto_conteudo_url: fotoConteudoUrl,
        foto_caixa_url: fotoCaixaUrl,
        observacao: observacao || '',
        operador_id: operador.id,
        operador_nome: operador.apelido || operador.nome,
        pendente_extracao: !nfNumber,
        status: status,
        tem_avaria: false,
        is_duplicada: isDuplicada,
        nf_original_id: embalagemOriginal?.id || null,
        data_nf_original: embalagemOriginal?.created_date || null,
      }

      await createEmbalagem.mutateAsync(data)

      // Resetar para próxima embalagem
      resetarEstado()
    } catch (error) {
      console.error('Erro ao finalizar embalagem:', error)
      alert('Erro ao salvar embalagem')
      setIsProcessing(false)
    }
  }

  const resetarEstado = () => {
    setEtapa(1)
    setStartTime(null)
    setNfNumber('')
    setClienteNome('')
    setFotoDanfeUrl('')
    setFotoConteudoUrl('')
    setFotoCaixaUrl('')
    setShowModalFinalizacao(false)
    setShowModalDuplicidade(false)
    setEmbalagemOriginal(null)
    setIsDuplicada(false)
    setIsProcessing(false)
  }

  const tempoTotal = startTime ? Math.floor((new Date() - startTime) / 1000) : 0

  return (
    <>
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

      {showModalFinalizacao && (
        <ModalFinalizacao
          nfNumber={nfNumber}
          clienteNome={clienteNome}
          tempoTotal={tempoTotal}
          operadorNome={operador?.apelido || operador?.nome}
          onFinalizar={() => finalizarEmbalagem('')}
          onFinalizarComObservacao={finalizarEmbalagem}
          isProcessing={isProcessing}
        />
      )}

      {showModalDuplicidade && (
        <ModalDuplicidade
          nfNumber={nfNumber}
          embalagemOriginal={embalagemOriginal}
          onConfirmar={confirmarDuplicidade}
          isProcessing={isProcessing}
        />
      )}
    </>
  )
}
