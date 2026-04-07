import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const RACE_COLOR = {
  'Caucasian':        'rgba(123,163,199,1)',
  'African-American': 'rgba(201,167,124,1)',
}

function ScoreGauge({ score }) {
  const pct = (score / 10) * 100
  const color = score <= 3 ? '#3fb950' : score <= 6 ? '#d29922' : '#f85149'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-bias-muted">
        <span>Risk Score</span>
        <span className="font-mono font-bold" style={{ color }}>{score} / 10</span>
      </div>
      <div className="h-2 bg-bias-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function CaseCard({ caseData, side }) {
  const raceColor = RACE_COLOR[caseData.race] ?? '#8b949e'

  const rows = [
    ['Charge',                caseData.charge_severity],
    ['Prior Convictions',     caseData.priors_count],
    ['Juvenile Charges',      caseData.juvenile_charges],
    ['Age at First Arrest',   caseData.age_at_first_arrest],
    ['Criminal History Len.', caseData.criminal_history_length],
  ]

  return (
    <div className="card space-y-4 flex-1">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold" style={{ color: raceColor }}>{caseData.race}</div>
          <div className="text-xs text-bias-muted">{caseData.sex}, age {caseData.age}</div>
          {caseData.case_number && (
            <div className="text-[10px] text-bias-muted font-mono mt-0.5">Case #{caseData.case_number}</div>
          )}
        </div>
        <div
          className="badge"
          style={{ backgroundColor: `${raceColor}20`, color: raceColor, border: `1px solid ${raceColor}40` }}
        >
          Case {side === 'a' ? 'A' : 'B'}
        </div>
      </div>

      <ScoreGauge score={caseData.decile_score} />

      <div className="space-y-1">
        <div className="text-xs text-bias-muted font-medium uppercase tracking-wide mb-2">Features</div>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs border-b border-bias-border/30 py-1">
            <span className="text-bias-muted">{k}</span>
            <span className="font-mono text-bias-text">{String(v)}</span>
          </div>
        ))}
      </div>

      <div className="text-xs">
        <span className="text-bias-muted">Actual recidivism: </span>
        <span className={caseData.actual_recidivism ? 'text-bias-red' : 'text-bias-green'}>
          {caseData.actual_recidivism ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  )
}

function CasePair({ pair }) {
  const [open, setOpen] = useState(false)
  const a = pair.case_a
  const b = pair.case_b

  const compareRows = [
    { label: 'Age',               valA: a.age,                     valB: b.age,                     diff: a.age !== b.age },
    { label: 'Charge',            valA: a.charge_severity,         valB: b.charge_severity,         diff: a.charge_severity !== b.charge_severity },
    { label: 'Priors',            valA: a.priors_count,            valB: b.priors_count,            diff: a.priors_count !== b.priors_count },
    { label: 'Juvenile',          valA: a.juvenile_charges,        valB: b.juvenile_charges,        diff: a.juvenile_charges !== b.juvenile_charges },
    { label: 'Age@Arrest',        valA: a.age_at_first_arrest,     valB: b.age_at_first_arrest,     diff: a.age_at_first_arrest !== b.age_at_first_arrest },
    { label: 'Hist. Length',      valA: a.criminal_history_length, valB: b.criminal_history_length, diff: a.criminal_history_length !== b.criminal_history_length },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-4 py-4"
      >
        <div className="text-center">
          <div className="text-4xl font-bold" style={{ color: RACE_COLOR['Caucasian'] }}>{a.decile_score}</div>
          <div className="text-xs text-bias-muted mt-1">Caucasian</div>
        </div>
        <div className="text-center">
          <div className="text-2xl text-bias-muted">&rarr;</div>
          <div className="text-xs font-semibold mt-1" style={{ color: RACE_COLOR['African-American'] }}>+{pair.score_gap} pts</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold" style={{ color: RACE_COLOR['African-American'] }}>{b.decile_score}</div>
          <div className="text-xs text-bias-muted mt-1">African-American</div>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4">
        <CaseCard caseData={a} side="a" />
        <CaseCard caseData={b} side="b" />
      </div>

      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-sm text-bias-blue hover:text-bias-text transition-colors duration-200"
        >
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>&#9654;</motion.span>
          Why the difference?
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="card mt-3 space-y-3" style={{ borderColor: '#4A5FC133', background: '#4A5FC108' }}>
                <p className="text-sm leading-relaxed text-bias-text">{pair.explanation}</p>
                <div className="space-y-1">
                  <div className="text-xs font-medium" style={{ color: '#4A5FC1' }}>Key proxy differences:</div>
                  {pair.key_differences.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-bias-muted">
                      <span style={{ color: '#4A5FC1' }} className="mt-0.5">*</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function Act4_CaseComparison({ data }) {
  const [pairIdx, setPairIdx] = useState(0)

  if (!data || data.length === 0) {
    return <div className="text-center text-bias-muted py-24">No case data available.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pb-24 space-y-8">
      <p className="text-bias-muted leading-relaxed">
        These cases are drawn directly from the COMPAS dataset. The defendants share similar age,
        charge type, and prior convictions - yet received substantially different risk scores.
        The gap is explained by <span className="text-bias-text font-medium">proxy variables</span> that
        encode systemic differences in how communities are policed.
      </p>

      {data.length > 1 && (
        <div className="flex gap-2">
          {data.map((_, i) => (
            <button
              key={i}
              onClick={() => setPairIdx(i)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                pairIdx === i
                  ? 'bg-bias-blue/20 text-bias-blue border border-bias-blue/40'
                  : 'text-bias-muted border border-bias-border hover:text-bias-text'
              }`}
            >
              Pair {i + 1}
            </button>
          ))}
        </div>
      )}

      <CasePair pair={data[pairIdx]} />
    </div>
  )
}
