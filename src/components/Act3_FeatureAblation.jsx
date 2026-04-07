import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { motion, AnimatePresence } from 'framer-motion'

const SCENARIO_MAP = {
  baseline:                { label: 'All features (baseline)',      features: ['age', 'age_at_first_arrest', 'priors_count', 'total_juvenile_charges', 'has_juvenile_record', 'charge_severity', 'criminal_history_length'] },
  remove_age:              { label: 'Remove age variables',         features: ['priors_count', 'total_juvenile_charges', 'has_juvenile_record', 'charge_severity', 'criminal_history_length'] },
  remove_age_first_arrest: { label: 'Remove age at first arrest',   features: ['age', 'priors_count', 'total_juvenile_charges', 'has_juvenile_record', 'charge_severity', 'criminal_history_length'] },
  remove_priors:           { label: 'Remove prior convictions',     features: ['age', 'age_at_first_arrest', 'total_juvenile_charges', 'has_juvenile_record', 'charge_severity', 'criminal_history_length'] },
  remove_juvenile:         { label: 'Remove juvenile charges',      features: ['age', 'age_at_first_arrest', 'priors_count', 'charge_severity', 'criminal_history_length'] },
  remove_proxies:          { label: 'Keep only non-proxy features', features: ['priors_count', 'charge_severity'] },
  only_priors:             { label: 'Only prior convictions',       features: ['priors_count'] },
  compas_proxies_only:     { label: 'Historical proxies only',      features: ['age_at_first_arrest', 'total_juvenile_charges', 'criminal_history_length'] },
}

const FEATURE_LABEL = {
  age:                    'Age',
  age_at_first_arrest:    'Age at First Arrest',
  priors_count:           'Prior Convictions',
  total_juvenile_charges: 'Juvenile Charges',
  has_juvenile_record:    'Has Juvenile Record',
  charge_severity:        'Charge Severity',
  criminal_history_length:'Criminal History Length',
}

function ImportanceTag({ p, alpha }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.span
      layout
      className="relative text-[11px] px-2 py-0.5 rounded-full border"
      style={{
        background: p.active ? `rgba(74,95,193,${alpha})` : 'transparent',
        borderColor: p.active ? `rgba(74,95,193,${alpha + 0.2})` : '#DDD5CB',
        color: p.active ? '#2A2520' : '#C5BFB9',
        textDecoration: p.active ? 'none' : 'line-through',
      }}
      animate={{ opacity: p.active ? 1 : 0.4 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => p.active && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {p.label}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }}
            className="absolute left-1/2 -translate-x-1/2 -top-7 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap pointer-events-none z-10"
            style={{ background: '#FAF7F4', border: '1px solid #DDD5CB', color: '#4A5FC1', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
          >
            {p.importance.toFixed(4)}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  )
}

const COLOR_BLACK = 'rgba(201,167,124,1)'
const COLOR_WHITE = 'rgba(123,163,199,1)'

function MetricCard({ label, value, subLabel, race }) {
  const color = race === 'black' ? COLOR_BLACK : race === 'white' ? COLOR_WHITE : null
  return (
    <motion.div
      layout
      className="card text-center space-y-1"
      style={color ? { borderColor: `${color}66`, background: `${color}11` } : {}}
    >
      <div className="text-xs text-bias-muted">{label}</div>
      <div className="text-2xl font-bold font-mono" style={{ color: color ?? '#2A2520' }}>
        {value ?? '-'}
      </div>
      {subLabel && <div className="text-xs text-bias-muted">{subLabel}</div>}
    </motion.div>
  )
}

function FPRChart({ blackFPR, whiteFPR }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || blackFPR == null || whiteFPR == null) return
    const W = svgRef.current.clientWidth || 320
    const H = 140
    const margin = { top: 16, right: 16, bottom: 32, left: 48 }
    const iW = W - margin.left - margin.right
    const iH = H - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', W).attr('height', H)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const groups = ['Black', 'White']
    const values = [blackFPR, whiteFPR]
    const colors = ['rgba(201,167,124,1)', 'rgba(123,163,199,1)']

    const x = d3.scaleBand().domain(groups).range([0, iW]).padding(0.4)
    const y = d3.scaleLinear().domain([0, Math.max(0.7, ...values)]).range([iH, 0])

    g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('.0%')))
      .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('x2', iW).attr('stroke', '#D4C8BE') })
      .selectAll('text').attr('fill', '#7A6E7A').attr('font-size', 11)

    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text').attr('fill', '#2B2D42').attr('font-size', 12)

    groups.forEach((grp, i) => {
      const barX = x(grp)
      const barW = x.bandwidth()
      g.append('rect')
        .attr('x', barX).attr('y', iH).attr('width', barW).attr('height', 0)
        .attr('fill', colors[i]).attr('rx', 3).attr('fill-opacity', 0.8)
        .transition().duration(600).ease(d3.easeCubicOut)
        .attr('y', y(values[i])).attr('height', iH - y(values[i]))

      g.append('text')
        .attr('x', barX + barW / 2).attr('y', y(values[i]) - 4)
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', 600)
        .attr('fill', colors[i])
        .text(`${(values[i] * 100).toFixed(1)}%`)
    })

    const gap = Math.abs(blackFPR - whiteFPR)
    if (gap > 0.02) {
      const y1 = y(Math.max(blackFPR, whiteFPR))
      const y2 = y(Math.min(blackFPR, whiteFPR))
      const midX = iW / 2
      g.append('line').attr('x1', midX).attr('x2', midX).attr('y1', y1 + 4).attr('y2', y2 - 4)
        .attr('stroke', '#8b949e').attr('stroke-dasharray', '2,2')
      g.append('text').attr('x', midX + 6).attr('y', (y1 + y2) / 2)
        .attr('fill', '#7A6E7A').attr('font-size', 10)
        .text(`Gap ${(gap * 100).toFixed(1)}%`)
    }
  }, [blackFPR, whiteFPR])

  return (
    <div className="space-y-2">
      <div className="text-xs text-bias-muted font-medium">False Positive Rate by Race</div>
      <svg ref={svgRef} className="w-full" />
      <p className="text-xs text-bias-muted">
        A higher FPR for Black defendants means they are more often falsely labeled high-risk.
      </p>
    </div>
  )
}

export default function Act3_FeatureAblation({ data, importance, embedded }) {
  const [scenario, setScenario] = useState('baseline')
  const metrics = data?.[scenario]

  const fprGap = metrics
    ? ((metrics.black?.fpr ?? 0) - (metrics.white?.fpr ?? 0)).toFixed(3)
    : null

  const importancePairs = useMemo(() => {
    if (!importance) return []
    const activeFeatures = new Set(SCENARIO_MAP[scenario].features)
    return importance.features.map((f, i) => ({
      feature: f,
      label: FEATURE_LABEL[f] ?? importance.labels[i],
      importance: importance.importances[i],
      active: activeFeatures.has(f),
    })).sort((a, b) => b.importance - a.importance)
  }, [importance, scenario])

  return (
    <div className={embedded ? '' : 'max-w-5xl mx-auto px-6 pb-24'}>
      <div className={embedded ? 'space-y-4' : 'grid md:grid-cols-[280px_1fr] gap-8'}>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-bias-muted uppercase tracking-widest">Choose a scenario</label>
            <select
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-bias-border bg-bias-surface text-bias-text focus:outline-none focus:border-bias-blue/50 cursor-pointer"
            >
              {Object.entries(SCENARIO_MAP).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {importancePairs.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <div className="text-xs text-bias-muted">Feature importance — hover to see value</div>
              <div className="flex flex-wrap gap-1.5">
                {importancePairs.map(p => {
                  const alpha = p.active ? 0.15 + Math.min(p.importance * 400, 1) * 0.6 : 0
                  return (
                    <ImportanceTag key={p.feature} p={p} alpha={alpha} />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={scenario}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap gap-1.5">
                {SCENARIO_MAP[scenario].features.map(f => (
                  <span key={f} className="badge bg-bias-blue/20 text-bias-blue border border-bias-blue/30 text-xs">
                    {FEATURE_LABEL[f] ?? f}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Overall Accuracy"
                  value={metrics?.overall?.accuracy != null ? `${(metrics.overall.accuracy * 100).toFixed(1)}%` : '-'}
                />
                <MetricCard
                  label="AUC"
                  value={metrics?.overall?.auc?.toFixed(3) ?? '-'}
                />
                <MetricCard
                  label="FPR (Black)"
                  value={metrics?.black?.fpr != null ? `${(metrics.black.fpr * 100).toFixed(1)}%` : '-'}
                  race="black"
                />
                <MetricCard
                  label="FPR (White)"
                  value={metrics?.white?.fpr != null ? `${(metrics.white.fpr * 100).toFixed(1)}%` : '-'}
                  race="white"
                />
              </div>

              {metrics && (
                <div className="card">
                  <FPRChart blackFPR={metrics.black?.fpr} whiteFPR={metrics.white?.fpr} />
                </div>
              )}

              {fprGap !== null && (
                <div className="card text-sm leading-relaxed" style={{ borderColor: '#4A5FC133', background: '#4A5FC108' }}>
                  {parseFloat(fprGap) > 0.05 ? (
                    <>
                      <span className="font-medium" style={{ color: '#4A5FC1' }}>Delta FPR = {fprGap}</span>
                      {' '} — Black defendants are{' '}
                      <span className="font-medium" style={{ color: '#4A5FC1' }}>{(parseFloat(fprGap) * 100).toFixed(1)} percentage points</span>
                      {' '}more likely to be false-positively flagged as high risk.
                    </>
                  ) : (
                    <>
                      <span className="font-medium" style={{ color: '#4A5FC1' }}>Delta FPR = {fprGap}</span>
                      {' '} — After removing these features, the false positive gap has nearly closed.
                      But notice the accuracy drop above — fairness comes at a cost.
                    </>
                  )}
                </div>
              )}

              {metrics && (
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="FNR (Black)"
                    value={metrics?.black?.fnr != null ? `${(metrics.black.fnr * 100).toFixed(1)}%` : '-'}
                    subLabel="Miss rate for Black defendants"
                    race="black"
                  />
                  <MetricCard
                    label="FNR (White)"
                    value={metrics?.white?.fnr != null ? `${(metrics.white.fnr * 100).toFixed(1)}%` : '-'}
                    subLabel="Miss rate for White defendants"
                    race="white"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
