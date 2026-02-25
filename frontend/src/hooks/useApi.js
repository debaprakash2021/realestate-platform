import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

/**
 * useApi — generic hook for GET requests with loading/error/refetch
 * Usage:
 *   const { data, loading, error, refetch } = useApi('/properties')
 *   const { data, loading } = useApi(`/reviews/property/${id}`, { immediate: true })
 */
export function useApi(url, options = {}) {
  const { immediate = true, initialData = null } = options
  const [data, setData]     = useState(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error, setError]   = useState(null)

  const fetch = useCallback(async (overrideUrl) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(overrideUrl || url)
      setData(res.data.data)
      return res.data.data
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Request failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (immediate && url) fetch()
  }, [url, immediate])

  return { data, loading, error, refetch: fetch, setData }
}

/**
 * usePost — hook for POST/PUT/DELETE mutations
 * Usage:
 *   const { mutate, loading } = usePost()
 *   await mutate('post', '/bookings', payload)
 */
export function useMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const mutate = useCallback(async (method, url, data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api[method](url, data)
      return res.data.data
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Request failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { mutate, loading, error }
}

export default useApi