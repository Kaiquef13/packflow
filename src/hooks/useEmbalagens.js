import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import base44 from '@/services/base44'

export function useEmbalagens(sortBy = '-created_date') {
  return useQuery({
    queryKey: ['embalagens', sortBy],
    queryFn: () => base44.listEmbalagens(sortBy),
  })
}

export function useCreateEmbalagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => base44.createEmbalagem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embalagens'] })
    },
  })
}

export function useUpdateEmbalagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => base44.updateEmbalagem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embalagens'] })
    },
  })
}

export function useUploadFile() {
  return useMutation({
    mutationFn: (file) => base44.uploadFile(file),
  })
}

export function useExtractData() {
  return useMutation({
    mutationFn: ({ fileUrl, jsonSchema }) => base44.extractDataFromFile(fileUrl, jsonSchema),
  })
}
