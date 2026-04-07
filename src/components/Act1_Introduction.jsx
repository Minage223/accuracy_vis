import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COLOR_BLACK = 'rgba(201,167,124,1)'
const COLOR_WHITE = 'rgba(123,163,199,1)'
const COLOR_TRACK = '#DDD5CB'

// ── Score Distribution Chart ────────────────────────────────────────────
const CHART_H = 88

function ScoreChart({ black, white }) {
  const [selected, setSelected] = useState(null)

  const counts = Array.from({ length: 10 }, (_, i) => {
    const k = String(i + 1)
    return { k, b: black[k] || 0, w: white[k] || 0 }
  })
  const maxVal = Math.max(...counts.map(c => Math.max(c.b, c.w)))

  // Y-axis ticks: 0, half, max (rounded)
  const tickMax = Math.ceil(maxVal / 100) * 100
  const ticks   = [0, Math.round(tickMax / 2), tickMax]

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {/* Y-axis */}
        <div className="flex flex-col justify-between items-end pr-1" style={{ height: CHART_H, minWidth: 28 }}>
          {[...ticks].reverse().map(t => (
            <span key={t} className="text-[9px] text-bias-muted leading-none">{t}</span>
          ))}
        </div>

        {/* Bars + gridlines */}
        <div className="flex-1 relative">
          {/* Gridlines */}
          {ticks.map((t, i) => (
            <div key={t} className="absolute w-full border-t border-bias-border/60"
              style={{ bottom: i === 0 ? 0 : `${(t / tickMax) * 100}%`, opacity: i === 0 ? 1 : 0.5 }} />
          ))}

          {/* Bars */}
          <div className="flex items-end gap-px relative z-10" style={{ height: CHART_H }}>
            {counts.map(({ k, b, w }, i) => {
              const bH = (b / tickMax) * CHART_H
              const wH = (w / tickMax) * CHART_H
              const isSel = selected === k
              return (
                <div
                  key={k}
                  className="flex-1 flex items-end gap-px cursor-pointer group"
                  style={{ height: CHART_H }}
                  onClick={() => setSelected(isSel ? null : k)}
                >
                  <motion.div className="flex-1 rounded-t-sm"
                    style={{ background: COLOR_BLACK, opacity: isSel ? 1 : 0.75 }}
                    initial={{ height: 0 }}
                    animate={{ height: bH }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                  />
                  <motion.div className="flex-1 rounded-t-sm"
                    style={{ background: COLOR_WHITE, opacity: isSel ? 1 : 0.75 }}
                    initial={{ height: 0 }}
                    animate={{ height: wH }}
                    transition={{ duration: 0.6, delay: i * 0.04 + 0.07 }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* X-axis: all 10 labels */}
      <div className="flex pl-8">
        <div className="flex-1 flex">
          {counts.map(({ k }) => (
            <div key={k} className="flex-1 text-center text-[9px] text-bias-muted">{k}</div>
          ))}
        </div>
      </div>

      {/* Click-to-reveal data label */}
      <AnimatePresence>
        {selected && (() => {
          const c = counts.find(x => x.k === selected)
          return (
            <motion.div key={selected}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
              className="rounded-lg border border-bias-border px-3 py-2 text-xs space-y-0.5"
              style={{ background: '#FAF7F4' }}
            >
              <div className="font-medium text-bias-text">Score {selected}</div>
              <div className="flex gap-4">
                <span style={{ color: COLOR_BLACK }}>Black: <strong>{c.b}</strong></span>
                <span style={{ color: COLOR_WHITE }}>White: <strong>{c.w}</strong></span>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

// ── Confusion Matrix — bubble grid ───────────────────────────────────────
// 2×2 arrangement: FN top-left, TP top-right, TN bot-left, FP bot-right
// Circle area ∝ percentage of total defendants
const CELL_META = {
  FN: { label: 'False Low Risk',  desc: 'Predicted low risk — did reoffend',     bg: '#5B749928', border: '#5B749966', text: '#5B7499' },
  TP: { label: 'True High Risk',  desc: 'Predicted high risk — did reoffend',    bg: '#5A8A6E28', border: '#5A8A6E66', text: '#5A8A6E' },
  TN: { label: 'True Low Risk',   desc: 'Predicted low risk — did NOT reoffend', bg: '#5A8A6E28', border: '#5A8A6E66', text: '#5A8A6E' },
  FP: { label: 'False High Risk', desc: 'Predicted high risk — did NOT reoffend',bg: '#A8545428', border: '#A8545466', text: '#A85454' },
}
const MAX_R = 34   // radius of the largest bubble in px

function ConfusionPetal({ label, color, data, visible }) {
  const [hovered, setHovered] = useState(null)
  const { tp, fp, tn, fn, n, accuracy } = data

  const cells = [
    { key: 'FN', val: fn },
    { key: 'TP', val: tp },
    { key: 'TN', val: tn },
    { key: 'FP', val: fp },
  ]
  const maxVal = Math.max(...cells.map(c => c.val))

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-medium" style={{ color }}>{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>
          {Math.round(accuracy * 100)}%
        </span>
        <span className="text-[10px] text-bias-muted">accuracy</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 text-[8px] text-bias-muted">
        <div className="text-center">Low risk</div>
        <div className="text-center">High risk</div>
      </div>

      {/* 2×2 bubble grid */}
      <div className="grid grid-cols-2" style={{ height: 108 }}>
        {cells.map(({ key, val }) => {
          const m = CELL_META[key]
          // r² ∝ val  →  r = MAX_R × sqrt(val / maxVal)
          const r = MAX_R * Math.sqrt(val / maxVal)
          const pct = ((val / n) * 100).toFixed(1)
          return (
            <div key={key}
              className="flex items-center justify-center cursor-pointer"
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
            >
              <motion.div
                className="rounded-full flex flex-col items-center justify-center shrink-0"
                style={{ background: m.bg, border: `1.5px solid ${m.border}` }}
                initial={{ width: 0, height: 0, opacity: 0 }}
                animate={visible
                  ? { width: r * 2, height: r * 2, opacity: 1 }
                  : { width: 0,     height: 0,     opacity: 0 }}
                transition={{ duration: 0.55, delay: 0.3, ease: [0.25, 0, 0, 1] }}
              >
                <span className="text-xs font-bold tabular-nums leading-none" style={{ color: m.text }}>
                  {pct}%
                </span>
                <span className="text-[7px] font-medium mt-0.5" style={{ color: m.text }}>{key}</span>
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (() => {
          const m   = CELL_META[hovered]
          const val = data[hovered.toLowerCase()] ?? 0
          const pct = ((val / n) * 100).toFixed(1)
          return (
            <motion.div key={hovered}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="rounded-lg border border-bias-border px-2 py-1.5 text-[10px] space-y-0.5"
              style={{ background: '#FAF7F4' }}
            >
              <div className="font-medium" style={{ color: m.text }}>
                {m.label} — {pct}% ({val.toLocaleString()} defendants)
              </div>
              <div className="text-bias-muted">{m.desc}</div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

// ── Compare Bar ───────────────────────────────────────────────────────────
function CompareBar({ labelA, valueA, colorA, labelB, valueB, colorB, max }) {
  return (
    <div className="space-y-2">
      {[{ label: labelA, value: valueA, color: colorA },
        { label: labelB, value: valueB, color: colorB }].map(({ label, value, color }) => (
        <div key={label} className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span style={{ color }} className="font-medium">{label}</span>
            <span className="text-bias-muted tabular-nums">{Math.round(value * 100)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: COLOR_TRACK }}>
            <motion.div className="h-full rounded-full" style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${(value / max) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.25, 0, 0, 1], delay: 0.3 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Clickable stacked bar ─────────────────────────────────────────────────
function ClickableBar({ segs, n }) {
  const [active, setActive] = useState(null)
  const activeKey = active?.key

  return (
    <div className="space-y-1">
      <div className="flex h-9 rounded-lg overflow-hidden gap-px">
        {segs.map(({ key, pct, bg, border, text, hint }, i) => (
          <motion.div key={key}
            className="flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
            style={{
              background: bg,
              borderTop: `2px solid ${border}`,
              outline: activeKey === key ? `2px solid ${border}` : 'none',
              outlineOffset: '-2px',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: [0.25, 0, 0, 1] }}
            onClick={() => setActive(activeKey === key ? null : { key, pct, text, hint })}
          >
            <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: text }}>
              {pct * 100 > 7 ? `${(pct * 100).toFixed(0)}%` : ''}
            </span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="rounded-lg border border-bias-border px-3 py-1.5 text-[11px] flex justify-between"
            style={{ background: '#FAF7F4' }}
          >
            <span className="font-semibold" style={{ color: active.text }}>
              {active.key} — {(active.pct * 100).toFixed(1)}%
            </span>
            <span className="text-bias-muted">{active.hint}</span>
            <span className="text-bias-muted tabular-nums">
              {Math.round(active.pct * n).toLocaleString()} defendants
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Reoffend composition chart ────────────────────────────────────────────
const RACE_GROUPS = [
  { key: 'black',    label: 'Black',    color: 'rgba(201,167,124,1)' },
  { key: 'hispanic', label: 'Hispanic', color: 'rgba(180,155,110,0.7)' },
  { key: 'white',    label: 'White',    color: 'rgba(123,163,199,1)' },
  { key: 'asian',    label: 'Asian',    color: 'rgba(140,180,160,0.8)' },
  { key: 'other',    label: 'Other',    color: 'rgba(180,172,165,0.6)' },
]

function ReoffendChart({ data }) {
  const [selected, setSelected] = useState(null)

  const groups = RACE_GROUPS.map(g => {
    const d = data[g.key]
    if (!d || !d.n) return null
    return { ...g, recid: Math.round(d.recid_rate * d.n), noRecid: d.n - Math.round(d.recid_rate * d.n) }
  }).filter(Boolean)

  const rows = [
    { key: 'reoffended',    label: 'Reoffended',       getValue: g => g.recid   },
    { key: 'not_reoffended', label: 'Did not reoffend', getValue: g => g.noRecid },
  ]

  return (
    <div className="space-y-2 border-t border-bias-border pt-3 mt-auto">
      <div className="text-[10px] text-bias-muted uppercase tracking-widest">Racial composition by outcome</div>
      {rows.map(({ key, label, getValue }) => {
        const vals  = groups.map(g => ({ ...g, val: getValue(g) }))
        const total = vals.reduce((s, g) => s + g.val, 0)
        const isSel = selected === key
        return (
          <div key={key} className="space-y-0.5">
            <div className="text-[10px] text-bias-muted">{label}</div>
            <div
              className="flex h-2.5 rounded-full overflow-hidden cursor-pointer"
              onClick={() => setSelected(isSel ? null : key)}
            >
              {vals.map((g, i) => (
                <motion.div key={g.key} style={{ background: g.color }}
                  initial={{ width: 0 }} animate={{ width: `${g.val / total * 100}%` }}
                  transition={{ duration: 0.9, ease: [0.25, 0, 0, 1], delay: 0.4 + i * 0.05 }}
                />
              ))}
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
        {groups.map(({ key, color, label }) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-2 h-1.5 rounded-sm inline-block" style={{ background: color }} />
            <span className="text-bias-muted">{label}</span>
          </span>
        ))}
      </div>
      <AnimatePresence>
        {selected && (() => {
          const row = rows.find(r => r.key === selected)
          const vals  = groups.map(g => ({ ...g, val: row.getValue(g) }))
          const total = vals.reduce((s, g) => s + g.val, 0)
          return (
            <motion.div key={selected}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
              className="rounded-lg border border-bias-border px-3 py-2 text-[11px] space-y-1"
              style={{ background: '#FAF7F4' }}
            >
              <div className="font-medium text-bias-text">{row.label}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {vals.map(g => (
                  <span key={g.key} style={{ color: g.color, filter: 'brightness(0.8)' }}>
                    {g.label}: <strong>{g.val.toLocaleString()}</strong> ({(g.val/total*100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

// ── Panel variants ────────────────────────────────────────────────────────
const panelVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.12, duration: 0.5 } }),
}

// ── Main component ────────────────────────────────────────────────────────
export default function Act1_Introduction({ data }) {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  if (!data) return null
  const { black, white } = data
  const bAcc = black.accuracy * 100
  const wAcc = white.accuracy * 100

  return (
    <div ref={sectionRef} className="max-w-5xl mx-auto px-6 pb-24 space-y-8">

      {/* Intro */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="text-center text-bias-muted text-sm max-w-2xl mx-auto leading-relaxed"
      >
        COMPAS is a recidivism risk-scoring tool used by US courts. In 2016, ProPublica
        obtained scores for {((black.n + white.n) / 1000).toFixed(1)}k defendants in
        Broward County, Florida, and compared predictions against <span style={{ whiteSpace: 'nowrap' }}>two-year re-arrest records.</span>
      </motion.p>

      {/* Dashboard */}
      <div className="grid md:grid-cols-3 gap-4 items-stretch">

        {/* Panel 1: Score distribution */}
        <motion.div custom={0} variants={panelVariants}
          initial="hidden" animate={visible ? 'visible' : 'hidden'}
          className="card space-y-3 flex flex-col"
        >
          <div className="text-xs text-bias-muted uppercase tracking-widest">Score distribution</div>
          <ScoreChart black={black.score_distribution} white={white.score_distribution} />
          <div className="flex gap-4 text-xs border-t border-bias-border pt-2">
            {[{ color: COLOR_BLACK, label: 'Black', avg: black.avg_score },
              { color: COLOR_WHITE, label: 'White', avg: white.avg_score }].map(({ color, label, avg }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-1.5 rounded-sm inline-block" style={{ background: color }} />
                <span style={{ color }}>{label}</span>
                <span className="text-bias-muted">avg {avg}</span>
              </span>
            ))}
          </div>

          {/* Reoffend rate by race */}
          <ReoffendChart data={data} />
        </motion.div>

        {/* Panel 2+3 merged: accuracy + error types */}
        <motion.div custom={1} variants={panelVariants}
          initial="hidden" animate={visible ? 'visible' : 'hidden'}
          className="card space-y-4 md:col-span-2"
        >
          <div className="text-xs text-bias-muted uppercase tracking-widest">Prediction breakdown</div>

          <div className="space-y-5">
            {[
              { label: 'Black defendants', color: COLOR_BLACK, d: black },
              { label: 'White defendants', color: COLOR_WHITE, d: white },
            ].map(({ label, color, d }) => {
              // Segments ordered: correct first (TP, TN), then errors (FP, FN)
              const segs = [
                { key: 'TP', pct: d.tp / d.n, bg: '#5A8A6E33', border: '#5A8A6E66', text: '#5A8A6E', hint: 'Predicted high — did reoffend' },
                { key: 'TN', pct: d.tn / d.n, bg: '#5A8A6E18', border: '#5A8A6E44', text: '#5A8A6E', hint: 'Predicted low — did not reoffend' },
                { key: 'FP', pct: d.fp / d.n, bg: '#A8545433', border: '#A8545466', text: '#A85454', hint: 'Predicted high — did NOT reoffend' },
                { key: 'FN', pct: d.fn / d.n, bg: '#5B749933', border: '#5B749966', text: '#5B7499', hint: 'Predicted low — DID reoffend' },
              ]
              const correctPct = (d.tp + d.tn) / d.n * 100
              const errorPct   = (d.fp + d.fn) / d.n * 100

              return (
                <div key={label} className="space-y-1">
                  <div className="text-[11px] font-medium" style={{ color }}>{label}</div>

                  {/* Stacked bar — click segment to see label */}
                  <ClickableBar segs={segs} n={d.n} />

                  {/* Bracket annotations */}
                  <div className="flex" style={{ gap: '1px' }}>
                    {/* Accuracy bracket */}
                    <div style={{ width: `${correctPct}%` }}
                      className="flex flex-col items-center shrink-0 overflow-hidden">
                      <div className="w-full flex items-center">
                        <div className="border-l border-b border-bias-muted/50 h-2 w-2 shrink-0" />
                        <div className="flex-1 border-b border-bias-muted/50" />
                        <div className="border-r border-b border-bias-muted/50 h-2 w-2 shrink-0" />
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap" style={{ color }}>
                        {Math.round(correctPct)}% accurate
                      </span>
                    </div>
                    {/* FP bracket */}
                    <div style={{ width: `${d.fp / d.n * 100}%` }}
                      className="flex flex-col items-center shrink-0 overflow-hidden">
                      <div className="w-full flex items-center">
                        <div className="border-l border-b border-[#A85454]/50 h-2 w-2 shrink-0" />
                        <div className="flex-1 border-b border-[#A85454]/50" />
                        <div className="border-r border-b border-[#A85454]/50 h-2 w-2 shrink-0" />
                      </div>
                      <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: '#A85454' }}>
                        false high
                      </span>
                    </div>
                    {/* FN bracket */}
                    <div style={{ width: `${d.fn / d.n * 100}%` }}
                      className="flex flex-col items-center shrink-0 overflow-hidden">
                      <div className="w-full flex items-center">
                        <div className="border-l border-b border-[#5B7499]/50 h-2 w-2 shrink-0" />
                        <div className="flex-1 border-b border-[#5B7499]/50" />
                        <div className="border-r border-b border-[#5B7499]/50 h-2 w-2 shrink-0" />
                      </div>
                      <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: '#5B7499' }}>
                        false low
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend + footnote */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-bias-border">
            {[
              { key: 'TP', color: '#5A8A6E', label: 'Correct high risk', opacity: 1 },
              { key: 'TN', color: '#5A8A6E', label: 'Correct low risk',  opacity: 0.4 },
              { key: 'FP', color: '#A85454', label: 'False high risk',   opacity: 1 },
              { key: 'FN', color: '#5B7499', label: 'False low risk',    opacity: 1 },
            ].map(({ key, color, label, opacity }) => (
              <div key={key} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2 h-2 rounded-sm shrink-0 inline-block"
                  style={{ background: color, opacity }} />
                <span className="text-bias-muted">{key} — {label}</span>
              </div>
            ))}
            <span className="text-[10px] text-bias-muted ml-auto">score ≥ 5 = high risk (ProPublica 2016)</span>
          </div>
        </motion.div>
      </div>

      {/* Conclusion */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center space-y-3 py-4"
      >
        <p style={{ color: '#4A5FC1' }} className="text-xl font-semibold leading-snug max-w-2xl mx-auto">
          Accuracy looks similar across groups —<br />
          but Black defendants are more likely to be{' '}
          <span style={{ color: '#A85454' }}>incorrectly labeled high risk.</span>
        </p>
        <p className="text-xs text-bias-muted">
          Scroll to 02 to see how race enters the model through proxy variables →
        </p>
      </motion.div>

    </div>
  )
}
