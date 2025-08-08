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
let lastMessageAt = 0
let reconnectDelayMs = 1000

function startEventSource(url: string, withCredentials: boolean) {
  if (sharedES) sharedES.close()
  const es = new EventSource(url, { withCredentials })
  sharedES = es
  es.onopen = () => {
    sharedConnected = true
    sharedError = null
    reconnectDelayMs = 1000
  }
  es.onerror = () => {
    sharedConnected = false
    sharedError = 'disconnected'
    // close and schedule reopen with backoff
    try { es.close() } catch {}
    sharedES = null
    setTimeout(() => {
      if (!started) return
      startEventSource(url, withCredentials)
    }, reconnectDelayMs)
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, 15000)
  }
  es.addEventListener('heartbeat', () => {
    lastMessageAt = Date.now()
  })
  es.onmessage = (msg) => {
    try {
      lastMessageAt = Date.now()
      const data = JSON.parse(msg.data) as EventDto
      for (const cb of sharedListeners) cb(data)
    } catch {
      // ignore
    }
  }
}

function ensureEventSource(url: string, withCredentials: boolean) {
  if (!started) {
    started = true
    startEventSource(url, withCredentials)
    // health monitor: if no messages or heartbeat in 25s, mark disconnected
    setInterval(() => {
      if (Date.now() - lastMessageAt > 25000) {
        sharedConnected = false
        sharedError = 'timeout'
      }
    }, 5000)
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
