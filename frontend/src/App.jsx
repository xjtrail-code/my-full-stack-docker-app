import { useState, useEffect, useRef } from 'react'
import './App.css'

// ── Fake container data ──────────────────────────────────────────────────────
const CONTAINERS = [
  { id: 'a1b2c3d4', name: 'nginx-proxy',    image: 'nginx:alpine',       port: '80:80',    status: 'running', cpu: 0.4,  mem: 12  },
  { id: 'e5f6a7b8', name: 'my-docker-app',  image: 'node:20-alpine',     port: '3000:3000',status: 'running', cpu: 2.1,  mem: 87  },
  { id: 'c9d0e1f2', name: 'postgres-db',    image: 'postgres:16',        port: '5432:5432',status: 'running', cpu: 0.8,  mem: 134 },
  { id: 'g3h4i5j6', name: 'redis-cache',    image: 'redis:7-alpine',     port: '6379:6379',status: 'running', cpu: 0.1,  mem: 8   },
  { id: 'k7l8m9n0', name: 'mail-service',   image: 'mailhog/mailhog',    port: '8025:8025',status: 'exited',  cpu: 0,    mem: 0   },
  { id: 'o1p2q3r4', name: 'prometheus',     image: 'prom/prometheus',    port: '9090:9090',status: 'running', cpu: 1.3,  mem: 56  },
]

const TERMINAL_LINES = [
  { delay: 0,    type: 'cmd',  text: 'docker ps' },
  { delay: 600,  type: 'out',  text: 'CONTAINER ID   IMAGE              STATUS        PORTS' },
  { delay: 700,  type: 'out',  text: 'a1b2c3d4       nginx:alpine       Up 3 days     0.0.0.0:80->80/tcp' },
  { delay: 800,  type: 'out',  text: 'e5f6a7b8       node:20-alpine     Up 2 hours    0.0.0.0:3000->3000/tcp' },
  { delay: 900,  type: 'out',  text: 'c9d0e1f2       postgres:16        Up 3 days     0.0.0.0:5432->5432/tcp' },
  { delay: 1000, type: 'out',  text: 'g3h4i5j6       redis:7-alpine     Up 3 days     0.0.0.0:6379->6379/tcp' },
  { delay: 1100, type: 'out',  text: 'o1p2q3r4       prom/prometheus    Up 1 day      0.0.0.0:9090->9090/tcp' },
  { delay: 1800, type: 'cmd',  text: 'docker images | wc -l' },
  { delay: 2400, type: 'out',  text: '12' },
  { delay: 3000, type: 'cmd',  text: 'docker stats --no-stream --format "{{.Name}}: {{.CPUPerc}}"' },
  { delay: 3600, type: 'out',  text: 'nginx-proxy:    0.41%' },
  { delay: 3700, type: 'out',  text: 'my-docker-app:  2.13%' },
  { delay: 3800, type: 'out',  text: 'postgres-db:    0.82%' },
  { delay: 3900, type: 'out',  text: 'redis-cache:    0.09%' },
  { delay: 4600, type: 'cmd',  text: 'echo "All systems operational 🚀"' },
  { delay: 5200, type: 'out',  text: 'All systems operational 🚀' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function Uptime() {
  const [secs, setSecs] = useState(Math.floor(Math.random() * 200000) + 50000)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return <span>{d}d {h}h {m}m {s}s</span>
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
}

function CpuBar({ value }) {
  const color = value > 80 ? '#ff4d4d' : value > 50 ? '#f5a623' : '#00e5a0'
  return (
    <div className="cpu-bar-track">
      <div className="cpu-bar-fill" style={{ width: `${Math.min(value * 10, 100)}%`, background: color }} />
    </div>
  )
}

function StatusDot({ status }) {
  return <span className={`status-dot ${status}`} />
}

// ── Terminal component ────────────────────────────────────────────────────────
function Terminal() {
  const [lines, setLines] = useState([])
  const [cursor, setCursor] = useState(true)
  const bodyRef = useRef(null)

  useEffect(() => {
    const timers = TERMINAL_LINES.map(({ delay, type, text }) =>
      setTimeout(() => setLines(l => [...l, { type, text }]), delay)
    )
    // Loop: reset after full sequence
    const reset = setTimeout(() => setLines([]), 6000)
    return () => { timers.forEach(clearTimeout); clearTimeout(reset) }
  }, [lines.length === 0 ? 0 : undefined])

  // Blink cursor
  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(t)
  }, [])

  // Scroll only the terminal body, never the page
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div className="terminal">
      <div className="terminal-bar">
        <span className="tb-dot tb-red" />
        <span className="tb-dot tb-yellow" />
        <span className="tb-dot tb-green" />
        <span className="terminal-title">ubuntu@docker-lab: ~/my-docker-app</span>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {lines.map((l, i) => (
          <div key={i} className={`tline tline-${l.type}`}>
            {l.type === 'cmd' && <span className="prompt">$ </span>}
            {l.type === 'out' && <span className="prompt out-indent">  </span>}
            <span>{l.text}</span>
          </div>
        ))}
        <div className="tline tline-cmd">
          <span className="prompt">$ </span>
          <span className={`t-cursor ${cursor ? 'vis' : ''}`}>▋</span>
        </div>
      </div>
    </div>
  )
}

// ── Container card ────────────────────────────────────────────────────────────
function ContainerCard({ c, index }) {
  const running = c.status === 'running'
  return (
    <div className="c-card" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="c-card-top">
        <div className="c-name-row">
          <StatusDot status={c.status} />
          <span className="c-name">{c.name}</span>
        </div>
        <span className={`c-badge ${c.status}`}>{c.status}</span>
      </div>
      <div className="c-image">{c.image}</div>
      <div className="c-meta">
        <div className="c-meta-item">
          <span className="c-label">PORT</span>
          <span className="c-val mono">{c.port}</span>
        </div>
        <div className="c-meta-item">
          <span className="c-label">ID</span>
          <span className="c-val mono">{c.id}</span>
        </div>
      </div>
      {running && (
        <div className="c-stats">
          <div className="c-stat">
            <span className="c-label">CPU</span>
            <CpuBar value={c.cpu} />
            <span className="c-stat-val">{c.cpu}%</span>
          </div>
          <div className="c-stat">
            <span className="c-label">MEM</span>
            <CpuBar value={c.mem / 2} />
            <span className="c-stat-val">{c.mem} MB</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const running = CONTAINERS.filter(c => c.status === 'running').length
  const stopped = CONTAINERS.length - running

  return (
    <div className="app">
      {/* Background grid */}
      <div className="bg-grid" aria-hidden="true" />

      {/* Top nav */}
      <header className="nav">
        <div className="nav-logo">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <rect x="2" y="14" width="10" height="10" rx="2" fill="#00e5a0" />
            <rect x="15" y="14" width="10" height="10" rx="2" fill="#00e5a0" />
            <rect x="28" y="14" width="10" height="10" rx="2" fill="#00e5a0" />
            <rect x="2" y="2"  width="10" height="10" rx="2" fill="#00e5a0" opacity=".4" />
            <rect x="15" y="2" width="10" height="10" rx="2" fill="#00e5a0" opacity=".4" />
            <path d="M2 27 Q20 38 38 27" stroke="#00e5a0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="nav-title">DockerLab</span>
          <span className="nav-tag">v2.0.0</span>x>
        </div>
        <div className="nav-right">
          <span className="nav-clock"><LiveClock /></span>
          <span className="nav-env">Production</span>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span className="pulse-dot" />
          <span>Live Environment</span>
        </div>
        <h1 className="hero-title">
          Container<br />
          <span className="hero-accent">Dashboard</span>
        </h1>
        <p className="hero-sub">
          Your Dockerized React app is running. This is what containerization looks like from the inside.
        </p>

        {/* Stat pills */}
        <div className="stats-row">
          <div className="stat-pill green">
            <span className="sp-num">{running}</span>
            <span className="sp-label">Running</span>
          </div>
          <div className="stat-pill red">
            <span className="sp-num">{stopped}</span>
            <span className="sp-label">Stopped</span>
          </div>
          <div className="stat-pill blue">
            <span className="sp-num">{CONTAINERS.length}</span>
            <span className="sp-label">Total</span>
          </div>
          <div className="stat-pill purple">
            <span className="sp-num"><Uptime /></span>
            <span className="sp-label">Uptime</span>
          </div>
        </div>
      </section>

      {/* Container grid */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Containers</h2>
          <span className="section-badge">{CONTAINERS.length} total</span>
        </div>
        <div className="cards-grid">
          {CONTAINERS.map((c, i) => <ContainerCard key={c.id} c={c} index={i} />)}
        </div>
      </section>

      {/* Terminal */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Live Terminal</h2>
          <span className="section-badge">docker-lab</span>
        </div>
        <Terminal />
      </section>

      {/* How it works */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">The 4 Steps</h2>
          <span className="section-badge">Dockerfile</span>
        </div>
        <div className="steps-row">
          {[
            { n: '01', label: 'Get the code',           cmd: 'git clone ...',            color: '#00e5a0' },
            { n: '02', label: 'Download dependencies',   cmd: 'RUN npm install',          color: '#3b9eff' },
            { n: '03', label: 'Run the code',            cmd: 'RUN npm run build',        color: '#f5a623' },
            { n: '04', label: 'Expose to a port',        cmd: 'docker run -p 8080:80 .', color: '#c97bff' },
          ].map((s, i) => (
            <div className="step-card" key={i} style={{ '--accent': s.color, animationDelay: `${i * 100}ms` }}>
              <span className="step-n" style={{ color: s.color }}>{s.n}</span>
              <span className="step-label">{s.label}</span>
              <code className="step-cmd">{s.cmd}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span>Built with React + Vite · Containerized with Docker · </span>
        <span className="footer-accent">innoetech-dev/my-docker-app</span>
      </footer>
    </div>
  )
}
