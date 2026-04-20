import React, { useEffect, useRef, useCallback } from 'react'

const NODE_COLORS = {
  'African-American': 'rgba(215, 162, 20,  0.9)',
  'Caucasian':        'rgba(74,  95,  193, 0.9)',
  'Hispanic':         'rgba(171, 196, 255, 0.9)',
  'Asian':            'rgba(14,  149, 148, 0.9)',
  'Other':            'rgba(163, 155, 146, 0.8)',
}

function getRadius(score) {
  if (score <= 3) return 5
  if (score <= 7) return 7
  return 9
}

function getColor(race) {
  return NODE_COLORS[race] || NODE_COLORS['Other']
}

export default function NodeCanvas({ nodes, paused, viewMode, onPersonSelect, selectedId }) {
  const canvasRef  = useRef(null)
  const stateRef   = useRef({ particles: [], animId: null, paused: false })

  // Initialise particles from nodes
  useEffect(() => {
    if (!nodes.length || !canvasRef.current) return
    const canvas = canvasRef.current
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight

    const count = viewMode === 'particle' ? 100 : nodes.length

    stateRef.current.particles = Array.from({ length: count }, (_, i) => {
      const node = nodes[i % nodes.length]
      return {
        ...node,
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        scale: 1,
      }
    })
  }, [nodes, viewMode])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    function resize() {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      const { particles, paused } = stateRef.current
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      if (!paused) {
        for (const p of particles) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > W) p.vx *= -1
          if (p.y < 0 || p.y > H) p.vy *= -1
        }
      }

      // Draw connections (Node Network mode only)
      if (viewMode === 'network') {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx   = particles[i].x - particles[j].x
            const dy   = particles[i].y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 140) {
              const alpha = (1 - dist / 140) * 0.12
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = `rgba(42, 37, 32, ${alpha})`
              ctx.lineWidth   = 1
              ctx.stroke()
            }
          }
        }
      }

      // Draw nodes
      if (viewMode !== 'minimal') {
        for (const p of particles) {
          const r     = viewMode === 'particle' ? 3 : getRadius(p.decile_score) * p.scale
          const color = getColor(p.race)
          const isSelected = p.id === selectedId

          ctx.beginPath()
          ctx.arc(p.x, p.y, r * (isSelected ? 1.4 : 1), 0, Math.PI * 2)
          ctx.fillStyle   = color
          ctx.fill()

          // Border
          ctx.strokeStyle = isSelected ? '#5b8fc4' : 'rgba(255,255,255,0.6)'
          ctx.lineWidth   = isSelected ? 2.5 : 1.5
          ctx.stroke()
        }
      }

      stateRef.current.animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(stateRef.current.animId)
    }
  }, [nodes, viewMode, selectedId])

  // Sync paused state
  useEffect(() => { stateRef.current.paused = paused }, [paused])

  // Click handler
  const handleClick = useCallback(e => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    for (const p of stateRef.current.particles) {
      const r  = getRadius(p.decile_score) + 8
      const dx = mx - p.x
      const dy = my - p.y
      if (dx * dx + dy * dy < r * r) {
        onPersonSelect(p, { x: e.clientX, y: e.clientY })
        return
      }
    }
    onPersonSelect(null, null)
  }, [onPersonSelect])

  // Hover cursor
  const handleMouseMove = useCallback(e => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let hit = false
    for (const p of stateRef.current.particles) {
      const r  = getRadius(p.decile_score) + 8
      const dx = mx - p.x
      const dy = my - p.y
      if (dx * dx + dy * dy < r * r) { hit = true; break }
    }
    canvas.style.cursor = hit ? 'pointer' : 'default'
  }, [])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
    />
  )
}
