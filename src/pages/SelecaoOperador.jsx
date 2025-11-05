import { useNavigate } from 'react-router-dom'
import { Package, LayoutDashboard, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useOperadoresAtivos } from '@/hooks/useOperadores'
import { motion } from 'framer-motion'

export default function SelecaoOperador() {
  const navigate = useNavigate()
  const { data: operadores, isLoading, error } = useOperadoresAtivos()

  const selecionarOperador = (operador) => {
    // Salvar operador selecionado no localStorage
    localStorage.setItem('packflow_operador', JSON.stringify({
      id: operador.id,
      nome: operador.nome,
      apelido: operador.apelido
    }))

    // Navegar para página de embalagem
    navigate('/embalagem')
  }

  const irParaDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-lg">
              <Package className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sistema PackFlow
          </h1>
          <p className="text-lg text-gray-600">
            Selecione seu nome para iniciar o turno
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-600">Carregando operadores...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto">
            <Card className="p-6 border-red-200 bg-red-50">
              <p className="text-red-900 text-center">
                Erro ao carregar operadores. Tente novamente.
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="destructive"
                className="w-full mt-4"
              >
                Recarregar
              </Button>
            </Card>
          </div>
        )}

        {/* Grid de Operadores */}
        {!isLoading && !error && operadores && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8"
          >
            {operadores.length === 0 ? (
              <div className="col-span-full">
                <Card className="p-8 text-center">
                  <p className="text-gray-600 mb-4">
                    Nenhum operador ativo encontrado.
                  </p>
                  <Button onClick={irParaDashboard} variant="outline">
                    Ir para o Dashboard
                  </Button>
                </Card>
              </div>
            ) : (
              operadores.map((operador, index) => (
                <motion.div
                  key={operador.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    onClick={() => selecionarOperador(operador)}
                    className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-indigo-400 bg-white"
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      <div className="mb-4 relative">
                        {operador.foto_url ? (
                          <img
                            src={operador.foto_url}
                            alt={operador.nome}
                            className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-indigo-100">
                            <User className="w-10 h-10 text-white" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-6 h-6 border-2 border-white" />
                      </div>

                      {/* Nome */}
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {operador.apelido || operador.nome}
                      </h3>
                      {operador.apelido && (
                        <p className="text-sm text-gray-500">
                          {operador.nome}
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Botão Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Button
            onClick={irParaDashboard}
            variant="outline"
            size="lg"
            className="shadow-md hover:shadow-lg transition-all"
          >
            <LayoutDashboard className="w-5 h-5 mr-2" />
            Acessar Dashboard de Gestão
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
