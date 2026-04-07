import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const VERTICES = {
  dp: { x: 0.5,  y: 0.05, label: 'Demographic Parity', color: '#7A6E7A', key: 'demographic_parity_gap' },
  eo: { x: 0.05, y: 0.9,  label: 'Equalized Odds',     color: '#5A8A6E', key: 'equalized_odds_fpr_gap' },
  pp: { x: 0.95, y: 0.9,  label: 'Predictive Parity',  color: '#5B7499', key: 'predictive_parity_gap'  },
}

function barycentricWeights(px, py, v) {
  const denom = (v.eo.y - v.pp.y) * (v.dp.x - v.pp.x) + (v.pp.x - v.eo.x) * (v.dp.y - v.pp.y)
  const wDP   = ((v.eo.y - v.pp.y) * (px - v.pp.x) + (v.pp.x - v.eo.x) * (py - v.pp.y)) / denom
  const wEO   = ((v.pp.y - v.dp.y) * (px - v.pp.x) + (v.dp.x - v.pp.x) * (py - v.pp.y)) / denom
  const wPP   = 1 - wDP - wEO
  return { wDP: Math.max(0, wDP), wEO: Math.max(0, wEO), wPP: Math.max(0, wPP) }
}

function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)) }

function interpolateMetrics(records, weights) {
  if (!records?.length) return null
  const sorted = [...records].sort((a, b) => a.threshold - b.threshold)
  const target = clamp(weights.wEO * 0.8 + weights.wPP * 0.45 + weights.wDP * 0.15, 0.1, 0.85)
  const lo = sorted.findLast(r => r.threshold <= target) ?? sorted[0]
  const hi = sorted.find(r => r.threshold > target)     ?? sorted[sorted.length - 1]
  if (lo === hi) return lo
  const t = (target - lo.threshold) / (hi.threshold - lo.threshold)
  const lerp = (a, b) => typeof a === 'number' ? a + t * (b - a) : a
  return {
    threshold:               target,
    demographic_parity_gap:  lerp(lo.demographic_parity_gap,  hi.demographic_parity_gap),
    equalized_odds_fpr_gap:  lerp(lo.equalized_odds_fpr_gap,  hi.equalized_odds_fpr_gap),
    equalized_odds_fnr_gap:  lerp(lo.equalized_odds_fnr_gap,  hi.equalized_odds_fnr_gap),
    predictive_parity_gap:   lerp(lo.predictive_parity_gap,   hi.predictive_parity_gap),
    black: {
      fpr: lerp(lo.black.fpr, hi.black.fpr),
      fnr: lerp(lo.black.fnr, hi.black.fnr),
      ppv: lerp(lo.black.ppv, hi.black.ppv),
      positive_rate: lerp(lo.black.positive_rate, hi.black.positive_rate),
      tp: Math.round(lerp(lo.black.tp, hi.black.tp)),
      fp: Math.round(lerp(lo.black.fp, hi.black.fp)),
      tn: Math.round(lerp(lo.black.tn, hi.black.tn)),
      fn: Math.round(lerp(lo.black.fn, hi.black.fn)),
    },
    white: {
      fpr: lerp(lo.white.fpr, hi.white.fpr),
      fnr: lerp(lo.white.fnr, hi.white.fnr),
      ppv: lerp(lo.white.ppv, hi.white.ppv),
      positive_rate: lerp(lo.white.positive_rate, hi.white.positive_rate),
      tp: Math.round(lerp(lo.white.tp, hi.white.tp)),
      fp: Math.round(lerp(lo.white.fp, hi.white.fp)),
      tn: Math.round(lerp(lo.white.tn, hi.white.tn)),
      fn: Math.round(lerp(lo.white.fn, hi.white.fn)),
    },
  }
}

function ConfusionMatrix({ group, m, color }) {
  if (!m) return null
  const total = m.tp + m.fp + m.tn + m.fn
  const cells = [
    { label: 'TP', value: m.tp, bg: `${color}22`, text: color },
    { label: 'FP', value: m.fp, bg: '#A8545422',  text: '#A85454' },
    { label: 'FN', value: m.fn, bg: '#A8856E22',  text: '#A8856E' },
    { label: 'TN', value: m.tn, bg: '#5A8A6E22',  text: '#5A8A6E' },
  ]
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium" style={{ color }}>{group}</div>
      <div className="grid grid-cols-2 gap-1">
        {cells.map(c => (
          <div key={c.label} className="rounded p-2 text-center" style={{ backgroundColor: c.bg }}>
            <div className="text-xs text-bias-muted">{c.label}</div>
            <div className="font-mono font-bold text-sm" style={{ color: c.text }}>{c.value}</div>
            <div className="text-xs text-bias-muted">
              {total > 0 ? `${(c.value / total * 100).toFixed(0)}%` : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-bias-muted">
        <div>FPR: <span className="font-mono text-bias-text">{(m.fpr * 100).toFixed(1)}%</span></div>
        <div>FNR: <span className="font-mono text-bias-text">{(m.fnr * 100).toFixed(1)}%</span></div>
      </div>
    </div>
  )
}

function FairnessTriangle({ position, onDrag }) {
  const svgRef    = useRef(null)
  const isDragging = useRef(false)

  const getSVGCoords = e => {
    const svg = svgRef.current
    if (!svg) return null
    const rect    = svg.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clamp((clientX - rect.left) / rect.width),
      y: clamp((clientY - rect.top)  / rect.height),
    }
  }

  const handleStart = e => { isDragging.current = true; e.preventDefault() }
  const handleEnd   = ()  => { isDragging.current = false }
  const handleMove  = useCallback(e => {
    if (!isDragging.current) return
    const coords = getSVGCoords(e)
    if (coords) onDrag(coords)
  }, [onDrag])

  useEffect(() => {
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup',   handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend',  handleEnd)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup',   handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend',  handleEnd)
    }
  }, [handleMove])

  const V = VERTICES

  const LABEL_LINES = {
    dp: { lines: ['Demographic', 'Parity'], x: V.dp.x*100,      y: V.dp.y*100 - 10, anchor: 'middle',  dy: 6 },
    eo: { lines: ['Equalized',   'Odds'],   x: V.eo.x*100 + 4,  y: V.eo.y*100 + 6,  anchor: 'start',   dy: 6 },
    pp: { lines: ['Predictive',  'Parity'], x: V.pp.x*100 - 4,  y: V.pp.y*100 + 6,  anchor: 'end',     dy: 6 },
  }

  return (
    <svg
      ref={svgRef}
      viewBox="-12 -12 124 130"
      className="w-full select-none"
      style={{ touchAction: 'none' }}
    >
      <polygon
        points={`${V.dp.x*100},${V.dp.y*100} ${V.eo.x*100},${V.eo.y*100} ${V.pp.x*100},${V.pp.y*100}`}
        fill="rgba(91,116,153,0.08)"
        stroke="#D4C8BE"
        strokeWidth="0.5"
      />
      {Object.entries(V).map(([key, v]) => {
        const lbl = LABEL_LINES[key]
        return (
          <g key={key}>
            <circle cx={v.x*100} cy={v.y*100} r="3" fill={v.color} fillOpacity="0.8" />
            <text
              x={lbl.x} y={lbl.y}
              textAnchor={lbl.anchor}
              fontSize="5"
              fill={v.color}
              fontFamily="Inter, sans-serif"
            >
              {lbl.lines.map((line, i) => (
                <tspan key={i} x={lbl.x} dy={i === 0 ? 0 : lbl.dy}>{line}</tspan>
              ))}
            </text>
          </g>
        )
      })}
      <circle
        cx={position.x*100} cy={position.y*100} r="4"
        fill="#4A5FC1" stroke="#4A5FC1" strokeWidth="1.5"
        style={{ cursor: 'grab' }}
        onMouseDown={handleStart} onTouchStart={handleStart}
      />
      <circle
        cx={position.x*100} cy={position.y*100} r="8"
        fill="transparent"
        style={{ cursor: 'grab' }}
        onMouseDown={handleStart} onTouchStart={handleStart}
      />
    </svg>
  )
}

function GapPill({ label, gap, color }) {
  const isNear = Math.abs(gap) < 0.02
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-bias-muted text-xs">{label}</span>
      <span
        className="font-mono text-xs px-2 py-0.5 rounded-full"
        style={{
          color:           isNear ? '#3fb950' : color,
          backgroundColor: isNear ? '#3fb95020' : `${color}20`,
          border:          `1px solid ${isNear ? '#3fb95040' : `${color}40`}`,
        }}
      >
        {gap > 0 ? '+' : ''}{(gap * 100).toFixed(1)} pp
      </span>
    </div>
  )
}

export default function Act5_FairnessDilemma({ data }) {
  const records = data?.thresholds ?? []
  const summary = data?.summary

  const [pos, setPos] = useState({
    x: (VERTICES.dp.x + VERTICES.eo.x + VERTICES.pp.x) / 3,
    y: (VERTICES.dp.y + VERTICES.eo.y + VERTICES.pp.y) / 3,
  })

  const weights = barycentricWeights(pos.x, pos.y, VERTICES)
  const metrics = interpolateMetrics(records, weights)
  const handleDrag = useCallback(coords => setPos(coords), [])

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">

        {/* Left: triangle + priority weights + race gaps */}
        <div className="space-y-4">
          <FairnessTriangle position={pos} onDrag={handleDrag} />

          <div className="card space-y-2">
            <div className="text-xs text-bias-muted font-medium">Current priority weights</div>
            {[
              { label: 'Demographic Parity', w: weights.wDP, color: VERTICES.dp.color },
              { label: 'Equalized Odds',     w: weights.wEO, color: VERTICES.eo.color },
              { label: 'Predictive Parity',  w: weights.wPP, color: VERTICES.pp.color },
            ].map(({ label, w, color }) => (
              <div key={label} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-bias-muted">{label}</span>
                  <span className="font-mono" style={{ color }}>{(w * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-bias-border rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                    animate={{ width: `${w * 100}%` }} transition={{ duration: 0.1 }} />
                </div>
              </div>
            ))}
          </div>

          {metrics && (
            <div className="card space-y-2">
              <div className="text-xs text-bias-muted font-medium">Racial gaps (Black minus White)</div>
              <GapPill label="Demographic Parity" gap={metrics.demographic_parity_gap} color={VERTICES.dp.color} />
              <GapPill label="EO (FPR gap)"       gap={metrics.equalized_odds_fpr_gap} color={VERTICES.eo.color} />
              <GapPill label="EO (FNR gap)"       gap={metrics.equalized_odds_fnr_gap} color={VERTICES.eo.color} />
              <GapPill label="Predictive Parity"  gap={metrics.predictive_parity_gap}  color={VERTICES.pp.color} />
            </div>
          )}
        </div>

        {/* Right: impossibility theorem + confusion matrices */}
        <div className="space-y-4">
          <div className="rounded-xl border px-5 py-4 space-y-2" style={{ borderColor: '#4A5FC133', background: '#4A5FC108' }}>
            <div className="font-semibold" style={{ color: '#4A5FC1' }}>The Impossibility Theorem</div>
            <p className="text-bias-muted text-sm leading-relaxed">
              There are three mathematical definitions of algorithmic fairness:
            </p>
            <div className="space-y-1.5 text-sm">
              {[
                { name: 'Demographic Parity', def: 'Equal proportion of high-risk predictions across groups.' },
                { name: 'Equalized Odds',     def: 'Equal true positive rate and false positive rate across groups.' },
                { name: 'Predictive Parity',  def: 'Among those predicted high-risk, equal actual recidivism rate across groups.' },
              ].map(({ name, def }) => (
                <div key={name} className="flex gap-2">
                  <span className="font-medium shrink-0" style={{ color: '#4A5FC1' }}>{name}:</span>
                  <span className="text-bias-muted">{def}</span>
                </div>
              ))}
            </div>
            <p className="text-bias-muted text-sm leading-relaxed">
              <a href="https://arxiv.org/abs/1703.00056" target="_blank" rel="noreferrer" style={{ color: '#4A5FC1' }} className="underline underline-offset-2">Chouldechova (2017)</a> proved that when recidivism base rates differ between groups,
              these three definitions{' '}
              <span className="text-bias-text font-medium">cannot all be satisfied simultaneously</span>.
              This is a mathematical constraint, not an algorithm design choice.
            </p>
            <p className="text-sm" style={{ color: '#4A5FC1' }}>
              Drag the dot to explore the trade-off.
            </p>
          </div>

          {metrics && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card">
                  <ConfusionMatrix group="Black Defendants" m={metrics.black} color="rgba(201,167,124,1)" />
                </div>
                <div className="card">
                  <ConfusionMatrix group="White Defendants" m={metrics.white} color="rgba(123,163,199,1)" />
                </div>
              </div>

              <p className="text-sm text-bias-muted leading-relaxed">
                Dragging toward <span style={{ color: VERTICES.eo.color }}>Equalized Odds</span> shrinks
                the FPR gap but PPV diverges. Dragging toward{' '}
                <span style={{ color: VERTICES.pp.color }}>Predictive Parity</span> widens FPR inequality.
                This trade-off is mathematical, not a matter of algorithm choice — it follows from unequal
                base rates caused by systemic injustice upstream.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
