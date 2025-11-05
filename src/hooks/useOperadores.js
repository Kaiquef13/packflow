import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import amplifyService from '@/services/amplify'

export function useOperadores() {
  return useQuery({
    queryKey: ['operadores'],
    queryFn: () => amplifyService.listOperadores(),
  })
}

export function useOperadoresAtivos() {
  return useQuery({
    queryKey: ['operadores', 'ativos'],
    queryFn: () => amplifyService.filterOperadores({ ativo: { eq: true } }),
  })
}

export function useCreateOperador() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => amplifyService.createOperador(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] })
    },
  })
}

export function useUpdateOperador() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => amplifyService.updateOperador(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] })
    },
  })
}

export function useDeleteOperador() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => amplifyService.deleteOperador(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] })
    },
  })
}
