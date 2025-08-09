import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { useSharedSSE, type EventDto } from './lib/sse'

// Dark mode hook
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved) return JSON.parse(saved)
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark))
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return [isDark, setIsDark] as const
}

function NavBar({ connected }: { connected: boolean }) {
  const [isDark, setIsDark] = useDarkMode()

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <div className="font-bold text-xl text-gray-900 dark:text-white">RAGMon</div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">Connection</div>
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            connected 
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' 
              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-500' : 'bg-red-500'
            }`}></div>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/live', label: 'Live Stream', icon: '🔴' },
    { to: '/instances', label: 'Instances', icon: '🖥️' },
    { to: '/apps', label: 'Apps', icon: '📱' },
    { to: '/settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 h-full bg-gray-50 dark:bg-gray-800">
      <nav className="p-4 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all duration-200 group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform duration-200">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

function Dashboard({ recent }: { recent: EventDto[] }) {
  const total = recent.length
  const errors = recent.filter(e => e.status?.toLowerCase() === 'error').length
  const processing = recent.filter(e => e.status?.toLowerCase() === 'processing' || e.status?.toLowerCase() === 'running').length
  const apps = new Set(recent.map(r => r.app)).size
  
  const stats = [
    { label: 'Total Events', value: total, icon: '📊', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { label: 'Errors', value: errors, icon: '❌', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
    { label: 'Processing', value: processing, icon: '⚡', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { label: 'Active Apps', value: apps, icon: '📱', color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' }
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor your RAG system performance and activity</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon, bgColor, textColor }) => (
          <div key={label} className={`${bgColor} rounded-xl p-6 border border-opacity-20`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
              </div>
              <div className="text-2xl">{icon}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Events</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest {Math.min(50, recent.length)} events from your system</p>
        </div>
        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">App</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doc ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recent.slice(-50).reverse().map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                        {e.app}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{e.stage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{e.docId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        e.status?.toLowerCase() === 'error' 
                          ? 'bg-red-100 text-red-800'
                          : (e.status?.toLowerCase() === 'processing' || e.status?.toLowerCase() === 'running')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {e.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="max-w-xs truncate" title={e.message}>{e.message}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveStream() {
  const [items, setItems] = useState<EventDto[]>([])
  const [paused, setPaused] = useState(false)
  const { connected } = useSharedSSE('/stream', {
    onEvent: (e) => {
      if (!paused) setItems(prev => [...prev.slice(-999), e])
    }
  })
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button className="border rounded px-3 py-1" onClick={() => setPaused(p => !p)}>{paused ? 'Resume' : 'Pause'}</button>
        <div className="text-sm">Stream: <span className={connected ? 'text-green-600' : 'text-red-600'}>{connected ? 'connected' : 'disconnected'}</span></div>
      </div>
      <div className="border rounded p-2 max-h-[70vh] overflow-auto bg-white">
        <table className="w-full text-sm">
          <thead className="text-left sticky top-0 bg-white">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">App</th>
              <th className="p-2">Stage</th>
              <th className="p-2">Event</th>
              <th className="p-2">DocId</th>
              <th className="p-2">File</th>
              <th className="p-2">Latency</th>
              <th className="p-2">Status</th>
              <th className="p-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {items.slice().reverse().map((e, i) => (
              <tr key={i} className="odd:bg-gray-50">
                <td className="p-2">{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td className="p-2">{e.app}</td>
                <td className="p-2">{e.stage}</td>
                <td className="p-2">{e.event ?? '-'}</td>
                <td className="p-2">{e.docId}</td>
                <td className="p-2">{(e as any).filename ?? (e as any).currentFile ?? '-'}</td>
                <td className="p-2">{e.latencyMs ?? '-'}</td>
                <td className="p-2">{e.status}</td>
                <td className="p-2 truncate max-w-[40rem]" title={e.message}>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InitDebugPanel />
    </div>
  )
}

function InitDebugPanel() {
  const { debug } = useSharedSSE('/stream')
  const inits = debug.filter(d => d.event === 'INIT').slice(-5).reverse()
  if (inits.length === 0) return null
  return (
    <div className="border rounded p-3 bg-amber-50 mt-3">
      <div className="font-medium mb-1">Recent INIT messages (for discovery)</div>
      <ul className="text-sm list-disc pl-5">
        {inits.map((e, i) => (
          <li key={i}>
            {e.app} @ {new Date(e.timestamp).toLocaleTimeString()} — host: {(e as any).publicHostname ?? (e as any).hostname ?? '-'} url: {e.url ?? '-'} status: {e.status ?? '-'}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Apps({ recent }: { recent: EventDto[] }) {
  const apps = useMemo(() => {
    const latestByApp = new Map<string, EventDto>()
    for (const e of recent) {
      if (!e.app) continue
      const cur = latestByApp.get(e.app)
      if (!cur || e.timestamp > cur.timestamp) latestByApp.set(e.app, e)
    }
    return Array.from(latestByApp.entries()).map(([app, e]) => ({ app, e }))
  }, [recent])

  const [busy, setBusy] = useState<string | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState(false)

  async function call(appName: string, path: string, method: string, body?: any, contentType?: string) {
    setBusy(`${method} ${path}`)
    // Safety timeout to clear busy state if something goes wrong
    const timeoutId = setTimeout(() => {
      console.warn(`[${appName}] Call timeout, clearing busy state for ${method} ${path}`)
      setBusy(null)
    }, 30000) // 30 second timeout
    
    try {
      const encodedApp = encodeURIComponent(appName)
      const res = await fetch(`/api/proxy/${encodedApp}${path}`, {
        method,
        credentials: 'include',
        headers: body ? { 'Content-Type': contentType || 'application/json' } : undefined,
        body: body ? (contentType ? body : JSON.stringify(body)) : undefined,
      })
      const txt = await res.text()
      return { status: res.status, text: txt }
    } finally {
      clearTimeout(timeoutId)
      setBusy(null)
    }
  }

  function AppCard({ app, e }: { app: string, e: EventDto }) {
    const connected = !!e.url
    
    // Enable controls if we have a URL and the instance status indicates it's available
    const instanceAvailable = ['RUNNING', 'PROCESSING', 'IDLE'].includes(e.status?.toUpperCase() || '')
    const disabled = (!connected || !instanceAvailable) || !!busy
    
    // DISABLED: Automatic health check causes infinite loops
    // Manual health check via buttons only

    // Debug logging  
    console.log(`[${app}] DEBUG: connected:${connected}, status:"${e.status}", instanceAvailable:${instanceAvailable}, busy:${busy ? `"${busy}"` : false}, disabled:${disabled}`)
    if (disabled && instanceAvailable) {
      console.log(`[${app}] WARNING: Buttons disabled despite instance being available. Reason: ${!connected ? 'not connected' : !!busy ? `busy with "${busy}"` : 'unknown'}`)
    }

    async function refreshFiles() {
      if (!connected) return
      // Try to discover a directory hint from the InstanceRegistry meta for this service
      let dirHint: string | null = null
      try {
        const instRes = await fetch('/api/instances', { credentials: 'include' })
        const instances = await instRes.json()
        const match = (instances || []).find((i: any) => i?.service === app)
        const meta = match?.meta || {}
        dirHint = meta.localStoragePath || meta['local-storage-path'] || meta.local_storage_path || meta.storagePath || null
        if (!dirHint && typeof meta === 'object') {
          // Heuristic: pick the first meta value that looks like an absolute or HDFS path
          for (const [_, v] of Object.entries(meta)) {
            if (typeof v === 'string' && (v.startsWith('/') || v.startsWith('hdfs://') || v.startsWith('file:/'))) {
              dirHint = v
              break
            }
          }
        }
      } catch {}

      const baseCandidates = ['/api/files', '/files', '/api/v1/files']
      const paramNames = ['dir', 'directory', 'path', 'baseDir']
      const candidates = dirHint
        ? [
            ...baseCandidates.flatMap(p => paramNames.map(n => `${p}?${n}=${encodeURIComponent(dirHint as string)}`)),
            ...baseCandidates
          ]
        : baseCandidates
      let lastError: any = null
      for (const path of candidates) {
        try {
          console.log(`[${app}] Attempting to refresh files via ${path}`)
          const r = await call(app, path, 'GET')
          if (r.status < 200 || r.status >= 300) {
            console.warn(`[${app}] Files API non-OK status ${r.status} at ${path}`)
            continue
          }
          let data: any
          try { data = JSON.parse(r.text) } catch (e) {
            console.warn(`[${app}] Files API response is not JSON at ${path}`)
            continue
          }
          const list = Array.isArray(data)
            ? data
            : Array.isArray((data as any).files)
              ? (data as any).files
              : Array.isArray((data as any).items)
                ? (data as any).items
                : Array.isArray((data as any).data)
                  ? (data as any).data
                  : Array.isArray((data as any).entries)
                    ? (data as any).entries
                    : null
          if (Array.isArray(list)) {
            const normalized = list.map((x: any) => {
              let name: string | undefined = typeof x?.name === 'string' ? x.name : undefined
              const url: string | undefined = typeof x?.url === 'string' ? x.url : undefined
              if (url) {
                try {
                  const u = new URL(url)
                  const p = u.pathname || ''
                  const marker = '/policies/'
                  if (p.includes(marker)) {
                    name = p.substring(p.indexOf(marker) + marker.length)
                  } else {
                    const idx = p.lastIndexOf('/')
                    name = idx >= 0 ? p.substring(idx + 1) : p
                  }
                } catch {}
              }
              return { ...x, name: name || x?.name }
            })
            setFiles(normalized)
            console.log(`[${app}] Files refresh successful from ${path} (count=${normalized.length})`)
            return
          }
          console.warn(`[${app}] Files API JSON shape not recognized at ${path}`)
        } catch (err) {
          lastError = err
          console.log(`[${app}] Files refresh attempt failed at candidate path`, err)
        }
      }
      // All candidates failed
      console.log(`[${app}] Files refresh failed for all candidates`, lastError)
      setFiles([])
    }

    async function bulk(action: 'process-now' | 'reprocess') {
      const hashes = Object.entries(selected).filter(([, v]) => v).map(([k]) => k)
      if (hashes.length === 0) return
      const path = action === 'process-now' ? '/api/process-now' : '/api/reprocess'
      const r = await call(app, path, 'POST', { fileHashes: hashes })
      alert(`${action}: ${r.status}`)
      refreshFiles()
    }

    async function danger(action: 'reprocess-all' | 'clear') {
      if (!confirm(`Are you sure you want to ${action.replace('-', ' ')}?`)) return
      const path = action === 'reprocess-all' ? '/api/reprocess-all' : '/api/clear'
      const r = await call(app, path, 'POST')
      alert(`${action}: ${r.status}`)
      refreshFiles()
    }

    async function toggleProcessing() {
      const r = await call(app, '/api/processing/toggle', 'POST')
      alert(`toggle: ${r.status}`)
    }

    async function upload(ev: any) {
      if (!ev.target.files || ev.target.files.length === 0) return
      const file = ev.target.files[0]
      const form = new FormData()
      form.append('file', file)
      setUploading(true)
      try {
        const encodedApp = encodeURIComponent(app)
        const res = await fetch(`/api/proxy/${encodedApp}/api/files/upload`, { method: 'POST', credentials: 'include', body: form })
        await res.text()
        alert(`upload: ${res.status}`)
        refreshFiles()
      } finally {
        setUploading(false)
      }
    }

    // DISABLED: All automatic health checks cause infinite loops
    // Health checks now only via manual button clicks

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              (e.status?.toLowerCase() === 'processing' || e.status?.toLowerCase() === 'running')
                ? 'bg-green-500 animate-pulse' 
                : e.status?.toLowerCase() === 'error' 
                ? 'bg-red-500'
                : 'bg-gray-400'
            }`}></div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{app}</h3>
              {e.url && (
                <a 
                  className="text-sm text-brand-600 hover:text-brand-700 hover:underline transition-colors" 
                  href={e.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {e.url}
                </a>
              )}
            </div>
          </div>
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
            e.status?.toLowerCase() === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : (e.status?.toLowerCase() === 'processing' || e.status?.toLowerCase() === 'running')
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            {e.status || 'Unknown'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Event:</span>
            <span className="ml-2 font-medium text-gray-900">{e.event || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Stage:</span>
            <span className="ml-2 font-medium text-gray-900">{e.stage || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">API:</span>
            <span className={`ml-2 font-semibold ${
              instanceAvailable ? 'text-green-600' : 'text-gray-500'
            }`}>
              {instanceAvailable ? 'Active' : 'Offline'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Host:</span>
            <span className="ml-2 font-mono text-sm text-gray-900">
              {(e as any).publicHostname ?? (e as any).hostname ?? '-'}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">System Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" 
                disabled={disabled} 
                onClick={() => call(app, '/actuator/health', 'GET').then(r=>alert(`health: ${r.status}`))}
              >
                🩺 Health
              </button>
              <button 
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" 
                disabled={disabled} 
                onClick={() => call(app, '/actuator/info', 'GET').then(r=>alert(`info: ${r.status}`))}
              >
                ℹ️ Info
              </button>
              <button 
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" 
                disabled={disabled} 
                onClick={() => call(app, '/actuator/metrics', 'GET').then(r=>alert(`metrics: ${r.status}`))}>
                📈 Metrics
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Processing Control</h4>
            <div className="text-xs text-gray-600 mb-2">
              Debug: disabled={String(disabled)}, connected={String(connected)}, instanceAvailable={String(instanceAvailable)}, busy={String(!!busy)}
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  disabled 
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                }`} 
                disabled={disabled} 
                onClick={() => call(app, '/api/processing/start', 'POST').then(()=>alert('Started'))}
              >
                ▶️ Start
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  disabled 
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                }`} 
                disabled={disabled} 
                onClick={() => call(app, '/api/processing/stop', 'POST').then(()=>alert('Stopped'))}
              >
                ⏸️ Stop
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  disabled 
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                }`} 
                disabled={disabled} 
                onClick={toggleProcessing}
              >
                🔁 Toggle
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">File Management</h4>
            <div className="flex items-center space-x-3">
              <label className={`px-4 py-2 bg-brand-100 text-brand-700 hover:bg-brand-200 border border-brand-300 rounded-lg cursor-pointer transition-all duration-200 ${
                disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
                <input type="file" className="hidden" onChange={upload} disabled={disabled || uploading} />
                <span className="flex items-center space-x-2">
                  <span>⬆️</span>
                  <span className="text-sm font-medium">Upload{uploading ? 'ing...' : ''}</span>
                </span>
              </label>
              <button 
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" 
                disabled={disabled} 
                onClick={refreshFiles}
              >
                🔄 Refresh Files
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
            <h4 className="text-sm font-semibold text-gray-700">Files ({files.length})</h4>
          </div>
          <div className="p-4">
            <div className="max-h-64 overflow-auto bg-white rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        onChange={(e)=>{
                          const next: Record<string, boolean> = {}
                          for (const f of files) { next[f.hash ?? f.name] = (e.target as HTMLInputElement).checked }
                          setSelected(next)
                        }} 
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {files.map((f, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          checked={!!selected[f.hash ?? f.name]} 
                          onChange={(e)=> setSelected(prev => ({...prev, [f.hash ?? f.name]: (e.target as HTMLInputElement).checked}))} 
                        />
                      </td>
                      <td className="p-3 font-medium text-gray-900">{f.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          f.state?.toLowerCase() === 'processed' 
                            ? 'bg-green-100 text-green-800'
                            : f.state?.toLowerCase() === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {f.state || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{typeof f.size==='number'? f.size.toLocaleString(): '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-3">
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  disabled 
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                }`} 
                disabled={disabled} 
                onClick={()=>bulk('process-now')}
              >
                ⚡ Process Selected
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  disabled 
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                }`} 
                disabled={disabled} 
                onClick={()=>bulk('reprocess')}
              >
                ♻️ Reprocess Selected
              </button>
              
              <div className="ml-auto flex gap-2">
                <button 
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    disabled 
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                  }`} 
                  disabled={disabled} 
                  onClick={()=>danger('reprocess-all')}
                >
                  🧨 Reprocess All
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    disabled 
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                  }`} 
                  disabled={disabled} 
                  onClick={()=>danger('clear')}
                >
                  🗑️ Clear Flags
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-1">Monitor and manage your RAG applications</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apps.map(({ app, e }) => (
          <div key={app} className="bg-white rounded-xl shadow-sm border border-gray-200"><AppCard app={app} e={e} /></div>
        ))}
      </div>
    </div>
  )
}

function Instances() {
  const [instances, setInstances] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/instances', { credentials: 'include' })
      .then(r => r.json())
      .then(setInstances)
      .catch(() => {})
    const es = new EventSource('/api/instances/stream', { withCredentials: true })
    es.onmessage = (m) => {
      try { setInstances(JSON.parse(m.data)) } catch {}
    }
    return () => { try { es.close() } catch {} }
  }, [])
  const groups = instances.reduce((acc: Record<string, any[]>, i) => {
    (acc[i.service] ||= []).push(i); return acc
  }, {})
  
  const totalInstances = instances.length
  const activeInstances = instances.filter(i => i.status === 'PROCESSING' || i.status === 'RUNNING').length
  const errorInstances = instances.filter(i => i.status === 'ERROR').length
  const offlineInstances = instances.filter(i => i.status === 'OFFLINE').length
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instances</h1>
        <p className="text-gray-600 mt-1">Monitor application instances across services</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Instances</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{totalInstances}</p>
            </div>
            <div className="text-2xl">🖥️</div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{activeInstances}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-3xl font-bold text-red-700 mt-2">{errorInstances}</p>
            </div>
            <div className="text-2xl">❌</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offline</p>
              <p className="text-3xl font-bold text-gray-700 mt-2">{offlineInstances}</p>
            </div>
            <div className="text-2xl">⏸️</div>
          </div>
        </div>
      </div>
      
      {Object.entries(groups).map(([svc, list]) => (
        <div key={svc} className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{svc}</h2>
              <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
                {list.length} instance{list.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((i, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        i.status === 'ERROR' 
                          ? 'bg-red-500' 
                          : (i.status === 'PROCESSING' || i.status === 'RUNNING')
                          ? 'bg-green-500 animate-pulse' 
                          : i.status === 'OFFLINE'
                          ? 'bg-gray-400'
                          : 'bg-yellow-500'
                      }`}></div>
                      <h3 className="font-semibold text-gray-900">{i.instanceId}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      i.status === 'ERROR'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : (i.status === 'PROCESSING' || i.status === 'RUNNING')
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : i.status === 'OFFLINE'
                        ? 'bg-gray-100 text-gray-700 border border-gray-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {i.status || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">URL:</span>
                      <div className="font-mono text-xs text-gray-900 mt-1 break-all">
                        {i.url || '-'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-gray-500">Last Activity:</span>
                        <div className="text-gray-900 font-medium">
                          {i.lastActivityAt ? new Date(i.lastActivityAt).toLocaleTimeString() : '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Heartbeat:</span>
                        <div className="text-gray-900 font-medium">
                          {i.lastHeartbeatAt ? new Date(i.lastHeartbeatAt).toLocaleTimeString() : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Settings() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your RAGMon preferences</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Connection Settings</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Transport Protocol</h3>
              <p className="text-sm text-gray-500 mt-1">Real-time communication method</p>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Server-Sent Events (SSE)
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Authentication</h3>
              <p className="text-sm text-gray-500 mt-1">Security method for API access</p>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Basic Auth
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Display Preferences</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Theme</h3>
              <p className="text-sm text-gray-500 mt-1">Choose your preferred appearance</p>
            </div>
            <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              Light Mode
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


function Shell() {
  const [recent, setRecent] = useState<EventDto[]>([])
  const { connected } = useSharedSSE('/stream', { onEvent: (e) => setRecent(prev => [...prev.slice(-999), e]) })

  useEffect(() => {
    fetch('/api/events/recent', { credentials: 'include' })
      .then(r => r.json())
      .then((data: EventDto[]) => setRecent(data))
      .catch(() => {})
  }, [])

  return (
    <div className="h-screen flex flex-col">
      <NavBar connected={connected} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard recent={recent} />} />
            <Route path="/live" element={<LiveStream />} />
            <Route path="/instances" element={<Instances />} />
            <Route path="/apps" element={<Apps recent={recent} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
