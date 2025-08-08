import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { useSharedSSE, type EventDto } from './lib/sse'

function NavBar({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
      <div className="font-semibold">imc-ragmon</div>
      <div className="text-sm">
        Connection: <span className={connected ? 'text-green-600' : 'text-red-600'}>{connected ? 'OK' : 'DOWN'}</span>
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <div className="w-56 border-r h-full p-3 space-y-2">
      <Link className="block hover:underline" to="/">Dashboard</Link>
      <Link className="block hover:underline" to="/live">Live Stream</Link>
      <Link className="block hover:underline" to="/apps">Apps</Link>
      <Link className="block hover:underline" to="/settings">Settings</Link>
    </div>
  )
}

function Dashboard({ recent }: { recent: EventDto[] }) {
  const total = recent.length
  const errors = recent.filter(e => e.status?.toLowerCase() === 'error').length
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded p-4"><div className="text-sm text-gray-500">Events</div><div className="text-2xl font-semibold">{total}</div></div>
        <div className="border rounded p-4"><div className="text-sm text-gray-500">Errors</div><div className="text-2xl font-semibold">{errors}</div></div>
        <div className="border rounded p-4"><div className="text-sm text-gray-500">Apps</div><div className="text-2xl font-semibold">{new Set(recent.map(r=>r.app)).size}</div></div>
      </div>
      <div className="border rounded p-4">
        <div className="font-medium mb-2">Recent Events</div>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left sticky top-0 bg-white">
              <tr>
                <th className="p-2">Time</th>
                <th className="p-2">App</th>
                <th className="p-2">Stage</th>
                <th className="p-2">DocId</th>
                <th className="p-2">Status</th>
                <th className="p-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(-50).reverse().map((e, i) => (
                <tr key={i} className="odd:bg-gray-50">
                  <td className="p-2">{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2">{e.app}</td>
                  <td className="p-2">{e.stage}</td>
                  <td className="p-2">{e.docId}</td>
                  <td className="p-2">{e.status}</td>
                  <td className="p-2 truncate max-w-[24rem]" title={e.message}>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div className="border rounded p-2 max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left sticky top-0 bg-white">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">App</th>
              <th className="p-2">Stage</th>
              <th className="p-2">DocId</th>
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
                <td className="p-2">{e.docId}</td>
                <td className="p-2">{e.latencyMs ?? '-'}</td>
                <td className="p-2">{e.status}</td>
                <td className="p-2 truncate max-w-[40rem]" title={e.message}>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Apps({ recent }: { recent: EventDto[] }) {
  const apps = useMemo(() => {
    const map = new Map<string, string | undefined>()
    for (const e of recent) {
      if (!map.has(e.app || '')) map.set(e.app || '', e.url)
    }
    return Array.from(map.entries()).filter(([k]) => k)
  }, [recent])
  return (
    <div className="p-4 grid grid-cols-3 gap-4">
      {apps.map(([app, url]) => (
        <div key={app} className="border rounded p-4">
          <div className="font-medium">{app}</div>
          {url && <a className="text-blue-600 underline text-sm" href={url} target="_blank">Open</a>}
        </div>
      ))}
    </div>
  )
}

function Settings() {
  return (
    <div className="p-4 space-y-2">
      <div className="font-medium">Settings</div>
      <div className="text-sm text-gray-600">Transport: SSE (default)</div>
      <div className="text-sm text-gray-600">Credentials provided via Basic Auth</div>
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
