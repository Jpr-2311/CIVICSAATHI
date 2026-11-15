import { useCallback, useEffect, useRef, useState } from 'react'

import { getHealth, getReadiness, getSystemInfo } from '@/services/api'

const POLL_INTERVAL_MS = 30000

const initialState = {
  status: 'loading',
  health: null,
  readiness: null,
  systemInfo: null,
  error: null,
  latencyMs: null,
  checkedAt: null,
}

/**
 * One snapshot of the backend: liveness, dependency readiness and product
 * metadata. Health is required; readiness and info degrade gracefully.
 */
export function useSystemSnapshot() {
  const [state, setState] = useState(initialState)
  const [refreshing, setRefreshing] = useState(false)
  const mountedRef = useRef(true)
  const requestIdRef = useRef(0)

  const runSnapshot = useCallback(async () => {
    const requestId = ++requestIdRef.current
    const startedAt = performance.now()

    try {
      const health = await getHealth()
      const latencyMs = Math.round(performance.now() - startedAt)

      const [readinessResult, infoResult] = await Promise.allSettled([
        getReadiness(),
        getSystemInfo(),
      ])

      if (!mountedRef.current || requestId !== requestIdRef.current) return

      setState({
        status: 'ready',
        health,
        latencyMs,
        readiness:
          readinessResult.status === 'fulfilled'
            ? readinessResult.value
            : null,
        systemInfo:
          infoResult.status === 'fulfilled' ? infoResult.value : null,
        error: null,
        checkedAt: new Date().toISOString(),
      })
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return

      setState((previous) => ({
        ...previous,
        status: 'error',
        error,
        checkedAt: new Date().toISOString(),
      }))
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await runSnapshot()
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }, [runSnapshot])

  useEffect(() => {
    mountedRef.current = true
    // Initial load synchronises with an external system (the API).
    // oxlint-disable-next-line react/set-state-in-effect
    runSnapshot()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') runSnapshot()
    }, POLL_INTERVAL_MS)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') runSnapshot()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [runSnapshot])

  return { state, refresh, refreshing }
}
