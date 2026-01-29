import { useState, useRef, useEffect } from 'react'
import { Camera, SwitchCamera, ZoomIn, ZoomOut, Check, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

const CAMERA_PREFERENCE_KEY = 'packflow_preferred_camera'

export default function CameraCapture({ etapa, titulo, subtitulo, onCapture, onBack, isProcessing = false }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [cameras, setCameras] = useState([])
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [maxZoom, setMaxZoom] = useState(1)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [capturedFile, setCapturedFile] = useState(null)
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)

  // Listar câmeras disponíveis
  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setCameras(videoDevices)

        // Tentar recuperar preferência salva
        const savedPreference = localStorage.getItem(CAMERA_PREFERENCE_KEY)
        if (savedPreference) {
          const savedIndex = videoDevices.findIndex(d => d.deviceId === savedPreference)
          if (savedIndex !== -1) {
            setSelectedCameraIndex(savedIndex)
            return
          }
        }

        // Preferir câmera traseira
        const backCameraIndex = videoDevices.findIndex(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('traseira')
        )
        if (backCameraIndex !== -1) {
          setSelectedCameraIndex(backCameraIndex)
        }
      } catch (err) {
        console.error('Erro ao listar câmeras:', err)
        setError('Não foi possível acessar as câmeras')
      }
    }

    getCameras()
  }, [])

  // Iniciar câmera
  useEffect(() => {
    if (cameras.length === 0 || capturedImage) return

    async function startCamera() {
      try {
        setCameraReady(false)
        setError(null)

        // Parar stream anterior se existir
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }

        const deviceId = cameras[selectedCameraIndex]?.deviceId

        // Tentar resoluções em ordem decrescente: 4K → Full HD → Padrão
        const resolutions = [
          { width: 3840, height: 2160 }, // 4K
          { width: 1920, height: 1080 }, // Full HD
          { width: 1280, height: 720 },  // HD
        ]

        let stream = null
        for (const resolution of resolutions) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                facingMode: deviceId ? undefined : { ideal: 'environment' },
                width: { ideal: resolution.width },
                height: { ideal: resolution.height },
              },
              audio: false,
            })
            break
          } catch (err) {
            console.warn(`Falha ao usar resolução ${resolution.width}x${resolution.height}`, err)
          }
        }

        if (!stream) {
          throw new Error('Não foi possível iniciar a câmera')
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Configurar zoom
        const videoTrack = stream.getVideoTracks()[0]
        const capabilities = videoTrack.getCapabilities?.()
        if (capabilities?.zoom) {
          setMaxZoom(capabilities.zoom.max || 1)
          setZoom(capabilities.zoom.min || 1)
        }

        // Salvar preferência
        if (deviceId) {
          localStorage.setItem(CAMERA_PREFERENCE_KEY, deviceId)
        }

        setCameraReady(true)
      } catch (err) {
        console.error('Erro ao iniciar câmera:', err)
        setError('Erro ao acessar a câmera. Verifique as permissões.')
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameras, selectedCameraIndex, capturedImage])

  // Aplicar zoom
  useEffect(() => {
    if (!streamRef.current) return

    const videoTrack = streamRef.current.getVideoTracks()[0]
    const capabilities = videoTrack.getCapabilities?.()

    if (capabilities?.zoom) {
      videoTrack.applyConstraints({
        advanced: [{ zoom }]
      }).catch(err => console.error('Erro ao aplicar zoom:', err))
    }
  }, [zoom])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, maxZoom))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1))
  }

  const switchCamera = () => {
    if (cameras.length <= 1) return
    setSelectedCameraIndex((prev) => (prev + 1) % cameras.length)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95)
      setCapturedImage(imageDataUrl)

      // Converter para File (confirmado depois)
      const blob = await (await fetch(imageDataUrl)).blob()
      const file = new File([blob], `foto_etapa_${etapa}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCapturedFile(file)
    } catch (err) {
      console.error('Erro ao capturar foto:', err)
      setError('Erro ao capturar foto')
    } finally {
      setIsCapturing(false)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setCapturedFile(null)
  }

  const confirmPhoto = () => {
    if (!capturedFile || !onCapture) return
    onCapture(capturedFile, capturedImage)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">{titulo}</h2>
              {subtitulo && <p className="text-sm opacity-90">{subtitulo}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            {onBack && etapa > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                disabled={isProcessing || isCapturing}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
            <span>Etapa {etapa}/3</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-indigo-800 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${(etapa / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-white text-center p-4">
              <p className="text-lg mb-2">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Recarregar
              </Button>
            </div>
          </div>
        )}

        {!cameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-white text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
              <p>Iniciando câmera...</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {capturedImage ? (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={capturedImage}
              alt="Foto capturada"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Controls */}
        {!capturedImage && cameraReady && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              {/* Zoom Controls */}
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  className="bg-white/20 hover:bg-white/30 text-white border-none"
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleZoomIn}
                  disabled={zoom >= maxZoom}
                  className="bg-white/20 hover:bg-white/30 text-white border-none"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
              </div>

              {/* Capture Button */}
              <Button
                size="icon"
                onClick={capturePhoto}
                disabled={isCapturing || isProcessing}
                className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-indigo-600 shadow-lg"
              >
                {isCapturing || isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Camera className="w-8 h-8" />
                )}
              </Button>

              {/* Switch Camera */}
              <Button
                size="icon"
                variant="secondary"
                onClick={switchCamera}
                disabled={cameras.length <= 1}
                className="bg-white/20 hover:bg-white/30 text-white border-none"
              >
                <SwitchCamera className="w-5 h-5" />
              </Button>
            </div>

            {/* Camera Indicator */}
            {cameras.length > 1 && (
              <div className="text-white text-xs text-center mt-2 opacity-70">
                Câmera {selectedCameraIndex + 1} de {cameras.length}
              </div>
            )}
          </div>
        )}

        {/* Preview Controls */}
        {capturedImage && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent"
          >
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={retakePhoto}
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Tirar Novamente
              </Button>
              <Button
                variant="success"
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={confirmPhoto}
                disabled={!capturedFile || isCapturing}
              >
                <Check className="w-5 h-5 mr-2" />
                Confirmar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
          >
            <div className="text-white text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">
                {etapa === 1 ? 'Extraindo dados da DANFE...' : 'Processando foto...'}
              </p>
              <p className="text-sm opacity-70 mt-1">
                {etapa === 1 ? 'Aguarde enquanto o OCR processa a nota fiscal' : 'Aguarde um momento'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Success Animation */}
        {capturedImage && !isProcessing && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-4 right-4 bg-emerald-600 text-white rounded-full p-3 shadow-lg"
          >
            <Check className="w-6 h-6" />
          </motion.div>
        )}
      </div>
    </div>
  )
}
