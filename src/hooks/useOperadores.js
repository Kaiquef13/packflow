import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import base44 from '@/services/base44'

export function useOperadores() {
  return useQuery({
    queryKey: ['operadores'],
    queryFn: () => base44.listOperadores(),
  })
}

export function useOperadoresAtivos() {
  return useQuery({
    queryKey: ['operadores', 'ativos'],
    queryFn: () => base44.filterOperadores({ ativo: true }),
  })
}

export function useCreateOperador() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => base44.createOperador(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] })
    },
  })
}

export function useUpdateOperador() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => base44.updateOperador(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] })
    },
  })
}

export function useDeleteOperador() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => base44.deleteOperador(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] })
    },
  })
}
