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

let sharedES: EventSource | null = null
let sharedListeners: Array<(e: EventDto) => void> = []
let sharedConnected = false
let sharedError: string | null = null
let started = false

function ensureEventSource(url: string, withCredentials: boolean) {
  if (started && sharedES) return
  sharedES = new EventSource(url, { withCredentials })
  started = true
  sharedES.onopen = () => {
    sharedConnected = true
    sharedError = null
  }
  sharedES.onerror = () => {
    sharedConnected = false
    sharedError = 'disconnected'
  }
  sharedES.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data) as EventDto
      for (const cb of sharedListeners) cb(data)
    } catch {
      // ignore
    }
  }
}

export function useSharedSSE(url: string, options?: { withCredentials?: boolean; onEvent?: (e: EventDto) => void }) {
  const [connected, setConnected] = useState(sharedConnected)
  const [error, setError] = useState<string | null>(sharedError)
  const listenerRef = useRef<(e: EventDto) => void>(() => {})

  useEffect(() => {
    if (options?.onEvent) listenerRef.current = options.onEvent
  }, [options?.onEvent])

  useEffect(() => {
    ensureEventSource(url, options?.withCredentials ?? false)
    const cb = (e: EventDto) => listenerRef.current && listenerRef.current(e)
    sharedListeners.push(cb)
    const id = setInterval(() => {
      setConnected(sharedConnected)
      setError(sharedError)
    }, 1000)
    return () => {
      sharedListeners = sharedListeners.filter(x => x !== cb)
      clearInterval(id)
    }
  }, [url, options?.withCredentials])

  return { connected, error }
}
