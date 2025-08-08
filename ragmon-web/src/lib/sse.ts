import { useEffect, useRef, useState } from 'react'

export type EventDto = {
  app?: string
  stage?: string
  docId?: string
  timestamp: number
  latencyMs?: number
  status?: string
  message?: string
  url?: string
}

export function useSSE(url: string, options?: { onEvent?: (e: EventDto) => void }) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(url, { withCredentials: true })
    esRef.current = es
    es.onopen = () => {
      setConnected(true)
      setError(null)
    }
    es.onerror = () => {
      setConnected(false)
      setError('disconnected')
    }
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as EventDto
        options?.onEvent?.(data)
      } catch (_e) {
        // ignore
      }
    }
    return () => {
      es.close()
    }
  }, [url])

  return { connected, error }
}
