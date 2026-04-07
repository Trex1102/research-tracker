import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const QUERY_KEY = ['entries']

async function fetchEntries(userId) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function useEntries() {
  const { user } = useAuth()
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchEntries(user.id),
    enabled: !!user,
    staleTime: 30_000,
  })
}

export function useEntry(id) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['entries', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user && !!id,
  })
}

export function useCreateEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (entryData) => {
      const payload = {
        ...entryData,
        user_id: user.id,
        status_history: [{ status: entryData.status, timestamp: new Date().toISOString() }],
        reminders_sent: {},
      }
      const { data, error } = await supabase.from('entries').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Entry created')
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data: entryData, prevStatus }) => {
      const now = new Date().toISOString()
      let statusHistoryUpdate = {}

      // If status changed, append to history
      if (prevStatus && prevStatus !== entryData.status) {
        const { data: existing } = await supabase
          .from('entries')
          .select('status_history')
          .eq('id', id)
          .single()

        const history = existing?.status_history || []
        statusHistoryUpdate = {
          status_history: [...history, { status: entryData.status, timestamp: now }],
        }
      }

      const { data, error } = await supabase
        .from('entries')
        .update({ ...entryData, updated_at: now, ...statusHistoryUpdate })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.setQueryData(['entries', data.id], data)
      toast.success('Entry updated')
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const prev = queryClient.getQueryData(QUERY_KEY)
      queryClient.setQueryData(QUERY_KEY, old => old?.filter(e => e.id !== id) ?? [])
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(QUERY_KEY, ctx.prev)
      toast.error('Failed to delete entry')
    },
    onSuccess: () => toast.success('Entry deleted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
