import { host, haptic, useValue } from '@hermes/plugin-sdk'
import { useEffect, useRef } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

// Palette and four domains are the ABUZ8 living spatial kernel
// (ABUZ8_OS three-stage.js), drawn on canvas because a catalog desktop
// plugin may not import three.js. Positions are seeded so the field is
// the same every open. Motion follows host.state, never invented numbers.

const GOLD = '#c8a55c'
const GOLD_HOT = '#f0cf76'
const EMERALD = '#37e6b1'
const CYAN = '#7ce8ff'
const RED = '#ff6b6b'
const WHITE = '#eafaf4'

const DOMAINS = [
  { id: 'dream', label: 'DREAM', color: EMERALD, x: 0.22, y: 0.32 },
  { id: 'forge', label: 'FORGE', color: GOLD_HOT, x: 0.78, y: 0.30 },
  { id: 'command', label: 'COMMAND', color: CYAN, x: 0.28, y: 0.74 },
  { id: 'abyss', label: 'ABYSS', color: RED, x: 0.74, y: 0.72 }
]

function mulberry32(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildField() {
  const rand = mulberry32(0xab08)
  const neurons = []
  for (let i = 0; i < 42; i += 1) {
    neurons.push({
      x: 0.08 + rand() * 0.84,
      y: 0.1 + rand() * 0.8,
      phase: rand() * Math.PI * 2,
      speed: 0.4 + rand() * 1.2
    })
  }
  const links = []
  for (let i = 0; i < neurons.length; i += 1) {
    for (let j = i + 1; j < neurons.length; j += 1) {
      const a = neurons[i]
      const b = neurons[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      if (dx * dx + dy * dy < 0.045 && links.length < 48) {
        links.push({ i, j, phase: rand() * Math.PI * 2 })
      }
    }
  }
  return { neurons, links }
}

const FIELD = buildField()

function paint(canvas, busy, gatewayOpen, now) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = canvas.clientWidth || 320
  const height = canvas.clientHeight || 420
  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = 'rgba(1, 4, 8, 0.55)'
  ctx.fillRect(0, 0, width, height)

  const speed = busy ? 2.4 : 0.55
  const linkAlpha = gatewayOpen ? (busy ? 0.55 : 0.16) : 0.05

  FIELD.links.forEach((link) => {
    const a = FIELD.neurons[link.i]
    const b = FIELD.neurons[link.j]
    const pulse = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.001 * speed + link.phase))
    ctx.strokeStyle = busy ? GOLD : CYAN
    ctx.globalAlpha = linkAlpha * pulse
    ctx.lineWidth = busy ? 1.4 : 0.7
    ctx.beginPath()
    ctx.moveTo(a.x * width, a.y * height)
    ctx.lineTo(b.x * width, b.y * height)
    ctx.stroke()
  })
  ctx.globalAlpha = 1

  FIELD.neurons.forEach((neuron) => {
    const bob = Math.sin(now * 0.001 * neuron.speed * speed + neuron.phase) * (busy ? 3 : 1)
    ctx.fillStyle = busy ? GOLD_HOT : CYAN
    ctx.globalAlpha = gatewayOpen ? 0.85 : 0.3
    ctx.beginPath()
    ctx.arc(neuron.x * width, neuron.y * height + bob, busy ? 2.2 : 1.5, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1

  DOMAINS.forEach((domain) => {
    const x = domain.x * width
    const y = domain.y * height
    ctx.strokeStyle = domain.color
    ctx.globalAlpha = gatewayOpen ? 0.85 : 0.35
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(x, y, busy ? 16 : 12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = domain.color
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(domain.label, x, y + 28)
  })
  ctx.globalAlpha = 1
}

function FieldPane() {
  const busy = useValue(host.state.busy)
  const gateway = useValue(host.state.gateway)
  const model = useValue(host.state.model)
  const canvasRef = useRef(null)
  const live = useRef({ busy: false, gateway: 'idle' })
  live.current = { busy: Boolean(busy), gateway: gateway || 'idle' }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    let frame = 0
    let stop = false
    function tick(now) {
      if (stop) return
      const gatewayOpen = live.current.gateway === 'open'
      paint(canvas, live.current.busy, gatewayOpen, now)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      stop = true
      cancelAnimationFrame(frame)
    }
  }, [])

  const gatewayOpen = gateway === 'open'
  const stateLabel = busy ? 'WORKING' : 'IDLE'
  const socketLabel = gatewayOpen ? 'socket open' : 'socket ' + (gateway || 'idle')

  return jsxs('div', {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--ui-text-secondary)',
      fontSize: 12
    },
    children: [
      jsxs('div', {
        style: { padding: '10px 12px 6px' },
        children: [
          jsx('div', { style: { fontWeight: 600, color: 'var(--ui-text-secondary)' }, children: 'Living field' }),
          jsx('div', {
            style: { color: 'var(--ui-text-tertiary)', marginTop: 2 },
            children: stateLabel + ' · ' + socketLabel
          }),
          jsx('div', {
            style: { color: 'var(--ui-text-quaternary)', marginTop: 2, wordBreak: 'break-all' },
            children: model || 'no model'
          })
        ]
      }),
      jsx('canvas', {
        ref: canvasRef,
        style: { flex: 1, width: '100%', minHeight: 280 }
      })
    ]
  })
}

function FieldChip() {
  const busy = useValue(host.state.busy)
  const label = busy ? 'field live' : 'field idle'
  return jsx('button', {
    type: 'button',
    style: {
      padding: '0 6px',
      fontSize: 11,
      color: busy ? GOLD : 'var(--ui-text-tertiary)',
      background: 'transparent',
      border: 0
    },
    onClick: () => {
      haptic('tap')
      host.notify({ kind: 'info', message: label })
    },
    children: label
  })
}

export default {
  id: 'living-field',
  name: 'Living Field',
  defaultEnabled: false,
  register(ctx) {
    ctx.register({
      id: 'pane',
      area: 'panes',
      title: 'Living field',
      data: { placement: 'right', width: '420px' },
      render: () => jsx(FieldPane, {})
    })
    ctx.register({
      id: 'chip',
      area: 'statusBar.right',
      order: 120,
      render: () => jsx(FieldChip, {})
    })
  }
}
