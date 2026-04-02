import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import amplifyService from '@/services/amplify'

export function useEmbalagensPeriodo(startDate, endDate, options = {}) {
  return useQuery({
    queryKey: ['embalagens-periodo', startDate, endDate],
    queryFn: () => amplifyService.listEmbalagensPeriodo(startDate, endDate),
    staleTime: 60_000,
    ...options,
  })
}

export function useEmbalagens(sortDirection = 'DESC') {
  return useQuery({
    queryKey: ['embalagens', sortDirection],
    queryFn: () => amplifyService.listEmbalagens(sortDirection),
    staleTime: 30_000,
  })
}

export function useCreateEmbalagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => amplifyService.createEmbalagem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embalagens'] })
    },
  })
}

export function useUpdateEmbalagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => amplifyService.updateEmbalagem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embalagens'] })
    },
  })
}

export function useUploadFile() {
  return useMutation({
    mutationFn: (file) => amplifyService.uploadFile(file),
  })
}

export function useExtractData() {
  return useMutation({
    mutationFn: ({ key }) => amplifyService.extractDataFromFile({ key }),
  })
}
