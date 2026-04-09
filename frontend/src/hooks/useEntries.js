import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

function getEntriesQueryKey(userId) {
  return ['entries', userId]
}

function getEntryQueryKey(userId, id) {
  return ['entries', userId, id]
}

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
    queryKey: getEntriesQueryKey(user?.id),
    queryFn: () => fetchEntries(user.id),
    enabled: !!user,
    staleTime: 30_000,
  })
}

export function useEntry(id) {
  const { user } = useAuth()
  return useQuery({
    queryKey: getEntryQueryKey(user?.id, id),
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
  const queryKey = getEntriesQueryKey(user?.id)

  return useMutation({
    mutationFn: async (entryData) => {
      const payload = {
        ...entryData,
        user_id: user.id,
        status_history: entryData.status_history || [{ status: entryData.status, timestamp: new Date().toISOString() }],
        reminders_sent: entryData.reminders_sent || {},
      }
      const { data, error } = await supabase.from('entries').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.setQueryData(getEntryQueryKey(user.id, data.id), data)
      toast.success('Entry created')
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = getEntriesQueryKey(user?.id)

  return useMutation({
    mutationFn: async ({ id, data: entryData, prevStatus, prevStatusHistory = [] }) => {
      const payload = {
        ...entryData,
      }

      if (prevStatus && prevStatus !== entryData.status) {
        payload.status_history = [
          ...prevStatusHistory,
          { status: entryData.status, timestamp: new Date().toISOString() },
        ]
      }

      const { data, error } = await supabase
        .from('entries')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.setQueryData(getEntryQueryKey(user.id, data.id), data)
      toast.success('Entry updated')
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = getEntriesQueryKey(user?.id)

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
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, old => old?.filter(e => e.id !== id) ?? [])
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKey, ctx.prev)
      }
      toast.error('Failed to delete entry')
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: getEntryQueryKey(user.id, id) })
      toast.success('Entry deleted')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
