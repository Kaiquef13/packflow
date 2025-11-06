import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function ImageLightbox({ fotos, selectedIndex, onClose, onPrevious, onNext }) {
  const foto = fotos[selectedIndex]

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onPrevious()
    if (e.key === 'ArrowRight') onNext()
  }

  // Adicionar listener ao montar
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrevious, onNext])

  return (
    <motion.div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Imagem */}
      <motion.div
        className="relative max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        <img
          src={foto.url}
          alt={foto.titulo}
          className="w-full h-full object-contain rounded-lg"
        />

        {/* Título */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white font-semibold text-lg">{foto.titulo}</p>
          <p className="text-gray-300 text-sm">
            {selectedIndex + 1} de {fotos.length}
          </p>
        </div>
      </motion.div>

      {/* Botão Fechar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Botão Anterior */}
      {selectedIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={onPrevious}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {/* Botão Próximo */}
      {selectedIndex < fotos.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={onNext}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      {/* Dica de teclado */}
      <div className="absolute bottom-4 left-4 text-gray-400 text-sm">
        <p>ESC para fechar | ← → para navegar</p>
      </div>
    </motion.div>
  )
}
