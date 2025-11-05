import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ArrowLeft, Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useOperadores, useCreateOperador, useUpdateOperador, useDeleteOperador } from '@/hooks/useOperadores'

export default function GestaoOperadores() {
  const navigate = useNavigate()
  const { data: operadores = [], isLoading } = useOperadores()
  const createOperador = useCreateOperador()
  const updateOperador = useUpdateOperador()
  const deleteOperador = useDeleteOperador()

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    ativo: true
  })

  const abrirModalNovo = () => {
    setEditando(null)
    setFormData({ nome: '', apelido: '', ativo: true })
    setShowModal(true)
  }

  const abrirModalEditar = (operador) => {
    setEditando(operador)
    setFormData({
      nome: operador.nome || '',
      apelido: operador.apelido || '',
      ativo: operador.ativo !== false
    })
    setShowModal(true)
  }

  const handleSalvar = async () => {
    if (!formData.nome) {
      alert('Nome é obrigatório')
      return
    }

    try {
      if (editando) {
        await updateOperador.mutateAsync({
          id: editando.id,
          data: formData
        })
      } else {
        await createOperador.mutateAsync(formData)
      }
      setShowModal(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar operador')
    }
  }

  const handleDeletar = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este operador?')) return

    try {
      await deleteOperador.mutateAsync(id)
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar operador')
    }
  }

  const isProcessing = createOperador.isPending || updateOperador.isPending || deleteOperador.isPending

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8" />
              Gestão de Operadores
            </h1>
            <p className="text-gray-600 mt-1">Gerenciar operadores do sistema</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={abrirModalNovo} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Operador
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Apelido</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando...
                    </td>
                  </tr>
                ) : operadores.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      Nenhum operador cadastrado
                    </td>
                  </tr>
                ) : (
                  operadores.map((operador) => (
                    <tr key={operador.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{operador.nome}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {operador.apelido || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={operador.ativo ? 'success' : 'secondary'}>
                          {operador.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalEditar(operador)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletar(operador.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Cadastro/Edição */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editando ? 'Editar Operador' : 'Novo Operador'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Nome Completo *
                </label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo do operador"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Apelido/Nome Curto
                </label>
                <Input
                  value={formData.apelido}
                  onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  placeholder="Como será exibido (opcional)"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  disabled={isProcessing}
                  className="w-4 h-4"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Operador ativo
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvar}
                disabled={isProcessing || !formData.nome}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editando ? 'Salvar' : 'Cadastrar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
