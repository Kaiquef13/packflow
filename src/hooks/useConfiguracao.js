import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import amplifyService from '@/services/amplify'

export const DEFAULT_TEMPO_MINIMO_SUSPEITA_SEGUNDOS = 60

export function useConfiguracao() {
  return useQuery({
    queryKey: ['configuracao'],
    queryFn: () => amplifyService.getConfiguracao(),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateConfiguracao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => amplifyService.upsertConfiguracao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao'] })
    },
  })
}
