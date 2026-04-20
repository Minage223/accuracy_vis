import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const SHORT_LABEL = {
  age:                     'Age',
  age_at_first_arrest:     'Age 1st Arrest',
  priors_count:            'Prior Conv.',
  total_juvenile_charges:  'Juv. Charges',
  juv_fel_count:           'Juv. Felonies',
  juv_misd_count:          'Juv. Misd.',
  juv_other_count:         'Juv. Other',
  has_juvenile_record:     'Juv. Record',
  charge_severity:         'Charge Sev.',
  criminal_history_length: 'Crim. History',
  decile_score:            'COMPAS Score',
  two_year_recid:          '2yr Recid.',
  race_binary:             'Race',
}

// Diverging color: blue (–1) → white (0) → amber (+1)
function corrColor(r) {
  if (r === null || r === undefined) return '#E8E2DC'
  const abs = Math.abs(r)
  if (r > 0) {
    const t = abs
    return `rgb(${Math.round(240 - 80*t)},${Math.round(200 - 60*t)},${Math.round(170 - 100*t)})`
  } else {
    const t = abs
    return `rgb(${Math.round(200 - 20*t)},${Math.round(220 - 40*t)},${Math.round(240)})`
  }
}

function textColor(r) {
  return Math.abs(r) > 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(42,37,32,0.55)'
}

// ── Correlation matrix heatmap ────────────────────────────────────────────
function CorrMatrix({ matrix, visible }) {
  const [hov, setHov] = useState(null)
  const { features, labels, values } = matrix
  const n = features.length

  return (
    <div className="space-y-2">
      <div className="text-xs text-bias-muted uppercase tracking-widest">Correlation matrix</div>
      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ fontSize: 9 }}>
          <thead>
            <tr>
              <th style={{ width: 72 }} />
              {labels.map((l, ci) => (
                <th key={ci} className="font-normal pb-1 px-px"
                  style={{ color: features[ci] === 'race_binary' ? '#A85454' : '#9b9690',
                           writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                           height: 72, verticalAlign: 'bottom', textAlign: 'left', width: 22 }}>
                  {SHORT_LABEL[features[ci]] ?? l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((rowF, ri) => (
              <tr key={ri}>
                <td className="pr-1.5 text-right whitespace-nowrap"
                  style={{ color: rowF === 'race_binary' ? '#A85454' : '#9b9690', fontSize: 9, width: 72 }}>
                  {SHORT_LABEL[rowF] ?? labels[ri]}
                </td>
                {features.map((colF, ci) => {
                  const r = values[ri][ci]
                  const isHov = hov?.r === ri && hov?.c === ci
                  const isDiag = ri === ci
                  return (
                    <td key={ci} className="p-px">
                      <motion.div
                        className="flex items-center justify-center rounded-sm cursor-default select-none"
                        style={{
                          width: 22, height: 22,
                          background: isDiag ? '#DDD5CB' : corrColor(r),
                          outline: isHov ? '1.5px solid rgba(42,37,32,0.4)' : 'none',
                          outlineOffset: -1,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: visible ? 1 : 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + (ri + ci) * 0.004 }}
                        onMouseEnter={() => setHov({ r: ri, c: ci })}
                        onMouseLeave={() => setHov(null)}
                      >
                        {!isDiag && (
                          <span style={{ fontSize: 7, color: textColor(r), fontVariantNumeric: 'tabular-nums' }}>
                            {r > 0 ? '+' : ''}{r.toFixed(2)}
                          </span>
                        )}
                      </motion.div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover label */}
      {hov && (() => {
        const r = values[hov.r][hov.c]
        const a = SHORT_LABEL[features[hov.r]] ?? labels[hov.r]
        const b = SHORT_LABEL[features[hov.c]] ?? labels[hov.c]
        return (
          <div className="text-[10px] text-bias-muted">
            <span className="font-medium text-bias-text">{a}</span> ↔ <span className="font-medium text-bias-text">{b}</span>
            {' '}r = <span className="font-mono" style={{ color: r > 0 ? '#A8856E' : '#5B7499' }}>
              {r > 0 ? '+' : ''}{r.toFixed(3)}
            </span>
          </div>
        )
      })()}

      {/* Legend */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[9px] text-bias-muted">−1</span>
        <div className="flex-1 h-1.5 rounded-full" style={{
          background: 'linear-gradient(to right, rgb(180,200,240), rgb(240,220,190), rgb(160,140,70))'
        }} />
        <span className="text-[9px] text-bias-muted">+1</span>
      </div>
      <div className="text-[9px] text-bias-muted">
        <span style={{ color: '#A85454' }}>Race</span> column shows each feature's correlation with being Black
      </div>
    </div>
  )
}

// ── Black vs White dot plot ───────────────────────────────────────────────
function BWCompare({ rows, visible }) {
  const [hov, setHov] = useState(null)

  // Sort by absolute difference
  const sorted = [...rows].sort((a, b) =>
    Math.abs(b.black_mean - b.white_mean) / Math.max(b.black_mean, b.white_mean, 0.01) -
    Math.abs(a.black_mean - a.white_mean) / Math.max(a.black_mean, a.white_mean, 0.01)
  )

  // Normalize each row to [0,1] for dot position
  const normalized = sorted.map(row => {
    const mn = Math.min(row.black_mean, row.white_mean)
    const mx = Math.max(row.black_mean, row.white_mean)
    const range = mx - mn || 1
    const globalMin = 0
    // Use z-scores for positioning
    return row
  })

  // Global min/max of z-scores for scale
  const allZ = rows.flatMap(r => [r.black_z, r.white_z])
  const zMin = Math.min(...allZ)
  const zMax = Math.max(...allZ)
  const zRange = zMax - zMin

  return (
    <div className="space-y-2">
      <div className="text-xs text-bias-muted uppercase tracking-widest">Black vs White feature means</div>
      <div className="space-y-0">
        {sorted.map((row, i) => {
          const bX = ((row.black_z - zMin) / zRange) * 100
          const wX = ((row.white_z - zMin) / zRange) * 100
          const left  = Math.min(bX, wX)
          const right = Math.max(bX, wX)
          const isHov = hov === row.id

          return (
            <div key={row.id}
              className="group cursor-default"
              onMouseEnter={() => setHov(row.id)}
              onMouseLeave={() => setHov(null)}
            >
              <div className="flex items-center gap-2" style={{ height: 26 }}>
                <div className="text-right shrink-0 text-[9px]"
                  style={{ width: 76, color: isHov ? '#2A2520' : '#9b9690' }}>
                  {SHORT_LABEL[row.id] ?? row.label}
                </div>
                <div className="flex-1 relative" style={{ height: 20 }}>
                  {/* Connecting line */}
                  <motion.div className="absolute top-1/2 -translate-y-1/2 h-px"
                    style={{ left: `${left}%`, width: `${right - left}%`,
                             background: isHov ? 'rgba(42,37,32,0.3)' : 'rgba(42,37,32,0.1)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                  />
                  {/* Black dot */}
                  <motion.div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
                    style={{ left: `${bX}%`, width: isHov ? 9 : 7, height: isHov ? 9 : 7,
                             background: 'rgba(215,162,20,1)', transition: 'width 0.15s, height 0.15s' }}
                    initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                  />
                  {/* White dot */}
                  <motion.div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
                    style={{ left: `${wX}%`, width: isHov ? 9 : 7, height: isHov ? 9 : 7,
                             background: 'rgba(74,95,193,1)', transition: 'width 0.15s, height 0.15s' }}
                    initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                  />
                </div>
              </div>
              {isHov && (
                <div className="text-[10px] flex gap-3 pl-20 pb-1" style={{ marginTop: -2 }}>
                  <span style={{ color: 'rgba(201,167,124,1)' }}>Black avg {row.black_mean.toFixed(2)}</span>
                  <span style={{ color: 'rgba(74,95,193,1)' }}>White avg {row.white_mean.toFixed(2)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] pt-1 border-t border-bias-border">
        {[['rgba(201,167,124,1)', 'Black'], ['rgba(74,95,193,1)', 'White']].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            <span className="text-bias-muted">{l}</span>
          </span>
        ))}
        <span className="text-bias-muted ml-auto">sorted by gap size · z-score scaled</span>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function Act2_CorrelationNetwork({ data, embedded }) {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    const el = sectionRef.current?.closest('section') ?? sectionRef.current
    if (el) obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (!data?.corr_matrix) return null

  return (
    <div ref={sectionRef} className={embedded ? 'space-y-8' : 'max-w-4xl mx-auto px-6 pb-24 space-y-8'}>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="text-sm text-bias-muted leading-relaxed"
      >
        COMPAS takes age, criminal history, prior convictions, and juvenile records as inputs. Race is not among them. Yet many of these variables are strongly correlated with race, acting as indirect proxies.
      </motion.p>

      <CorrMatrix matrix={data.corr_matrix} visible={visible} />
      <BWCompare rows={data.bw_compare} visible={visible} />
    </div>
  )
}
