import React, { useEffect, useRef, useCallback, useMemo } from 'react'

const RACE_COLORS = {
  'African-American': ['rgba(201,167,124,0.85)', 'rgba(201,167,124,1)'],
  'Caucasian':        ['rgba(123,163,199,0.85)', 'rgba(123,163,199,1)'],
  'Hispanic':         ['rgba(180,140,100,0.75)', 'rgba(180,140,100,1)'],
  'Asian':            ['rgba(120,170,145,0.75)', 'rgba(120,170,145,1)'],
  'Other':            ['rgba(180,172,165,0.35)', 'rgba(180,172,165,0.65)'],
}

function raceColor(race, hover) {
  const pair = RACE_COLORS[race] || RACE_COLORS['Other']
  return hover ? pair[1] : pair[0]
}

// Seeded PRNG — gives the same jitter every render
function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const MARK_W      = 22   // px — width of each horizontal mark
const MARK_H      = 2    // px — height of each horizontal mark
const MARK_GAP    = 3    // px — vertical gap between stacked marks
const MAX_PER_COL = 90   // marks per score column (proportionally sampled)

export default function BarsCanvas({ data, onHover }) {
  const canvasRef     = useRef(null)
  const marksRef      = useRef([])       // computed mark positions (canvas-independent)
  const hoveredRef    = useRef(-1)       // index into marksRef
  const drawScheduled = useRef(false)

  // Build mark layout whenever data changes.
  // Positions are stored as normalized x (0–1) + stackIndex (row from top).
  // Actual canvas px are computed at draw time.
  const maxStackIndex = useMemo(() => {
    if (!data.length) return 0

    // Group by score
    const groups = {}
    for (let s = 1; s <= 10; s++) groups[s] = []
    data.forEach(d => { if (groups[d.decile_score]) groups[d.decile_score].push(d) })

    const maxCount = Math.max(...Object.values(groups).map(g => g.length))
    const rand = seededRand(42)
    const marks = []

    for (let s = 1; s <= 10; s++) {
      const group = groups[s]
      if (!group.length) continue

      // Proportional sampling so relative column heights are accurate
      const sampleN = Math.max(1, Math.round((group.length / maxCount) * MAX_PER_COL))
      const step    = group.length / sampleN
      const sampled = Array.from({ length: sampleN }, (_, i) => group[Math.floor(i * step)])

      sampled.forEach((person, i) => {
        // Normalized x: centre of score column + scatter jitter within ±35% of col width
        const jitter = (rand() - 0.5) * 0.7
        marks.push({
          ...person,
          xNorm:      (s - 0.5) / 10,   // column centre (0–1)
          xJitter:    jitter,            // fraction of col width
          stackIndex: i,                 // row from top within this column
          markIdx:    marks.length,      // global index for hover
        })
      })
    }

    marksRef.current = marks
    return Math.max(...marks.map(m => m.stackIndex))
  }, [data])

  // ── Draw ────────────────────────────────────────────────────────────────
  const draw = useCallback((hIdx) => {
    const canvas = canvasRef.current
    if (!canvas || !marksRef.current.length) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.width  / dpr
    const H   = canvas.height / dpr

    const colW    = W / 10
    // Space marks so the tallest column uses ~90% of canvas height
    const spacing = H / (maxStackIndex + 2) // px per stack row

    ctx.clearRect(0, 0, W * dpr, H * dpr)
    ctx.save()
    ctx.scale(dpr, dpr)

    for (const m of marksRef.current) {
      const isH = m.markIdx === hIdx
      const x   = m.xNorm * W + m.xJitter * colW - MARK_W / 2
      const y   = m.stackIndex * spacing            // hangs from top
      const mw  = isH ? MARK_W + 4 : MARK_W
      const mh  = isH ? MARK_H + 1 : MARK_H

      ctx.fillStyle = raceColor(m.race, isH)
      ctx.fillRect(x, y, mw, mh)
    }

    ctx.restore()
  }, [maxStackIndex])

  const scheduleDraw = useCallback((hIdx) => {
    if (drawScheduled.current) return
    drawScheduled.current = true
    requestAnimationFrame(() => { drawScheduled.current = false; draw(hIdx) })
  }, [draw])

  // ── Resize / init ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return
    const dpr = window.devicePixelRatio || 1
    function resize() {
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      scheduleDraw(hoveredRef.current)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [data, scheduleDraw])

  // ── Hover: find nearest mark to cursor ──────────────────────────────────
  const handleMouseMove = useCallback(e => {
    const canvas = canvasRef.current
    if (!canvas || !marksRef.current.length) return
    const rect    = canvas.getBoundingClientRect()
    const mx      = e.clientX - rect.left
    const my      = e.clientY - rect.top
    const W       = canvas.offsetWidth
    const H       = canvas.offsetHeight
    const colW    = W / 10
    const spacing = H / (maxStackIndex + 2)

    let bestIdx  = -1
    let bestDist = 16 * 16  // px² threshold

    for (const m of marksRef.current) {
      const cx = m.xNorm * W + m.xJitter * colW
      const cy = m.stackIndex * spacing + MARK_H / 2
      const d2 = (mx - cx) ** 2 + (my - cy) ** 2
      if (d2 < bestDist) { bestDist = d2; bestIdx = m.markIdx }
    }

    if (bestIdx !== hoveredRef.current) {
      hoveredRef.current = bestIdx
      scheduleDraw(bestIdx)
      if (bestIdx >= 0) {
        const m  = marksRef.current[bestIdx]
        const cx = m.xNorm * W + m.xJitter * colW
        const cy = m.stackIndex * (H / (maxStackIndex + 2))
        onHover(m, { x: rect.left + cx, y: rect.top + cy }, rect)
      } else {
        onHover(null, null, null)
      }
    }
  }, [maxStackIndex, scheduleDraw, onHover])

  const handleMouseLeave = useCallback(() => {
    if (hoveredRef.current !== -1) {
      hoveredRef.current = -1
      scheduleDraw(-1)
      onHover(null, null, null)
    }
  }, [scheduleDraw, onHover])

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
    />
  )
}
