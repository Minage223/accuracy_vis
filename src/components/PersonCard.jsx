import React from 'react'

const RISK_COLORS = {
  Low:    '#5b8fc4',
  Medium: '#c9a77c',
  High:   '#d4896b',
}

export default function PersonCard({ person, position, onClose }) {
  if (!person) return null

  const riskColor = RISK_COLORS[person.risk_level] || '#a39b92'
  const scorePct  = (person.decile_score / 10) * 100

  // Keep card on screen
  const style = {
    position: 'fixed',
    left: Math.min(position.x + 20, window.innerWidth - 320),
    top:  Math.min(position.y - 20, window.innerHeight - 420),
    width: 300,
    background: 'rgba(245, 243, 240, 0.98)',
    border: '2px solid rgba(42, 37, 32, 0.15)',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 8px 32px rgba(42, 37, 32, 0.12)',
    zIndex: 20,
    fontFamily: 'Inter, system-ui, sans-serif',
    animation: 'cardIn 200ms ease-out forwards',
  }

  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={style}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1614' }}>{person.id}</div>
            <div style={{ fontSize: 13, color: '#6b6661', marginTop: 2 }}>
              {person.age} yrs &middot; {person.sex}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
                     color: '#9b9690', lineHeight: 1, padding: '2px 4px' }}
            onMouseEnter={e => e.target.style.color = '#5b8fc4'}
            onMouseLeave={e => e.target.style.color = '#9b9690'}
          >
            &times;
          </button>
        </div>

        <Row label="Race"              value={person.race} />
        <Row label="Prior Convictions" value={person.priors_count} />
        <Row label="Charge"            value={person.charge_degree} />

        {/* Risk Score */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#6b6661' }}>COMPAS Risk Score</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: riskColor }}>
              {person.decile_score}/10
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(42,37,32,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${scorePct}%`, height: '100%', background: riskColor,
                          borderRadius: 3, transition: 'width 400ms ease' }} />
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: riskColor, fontWeight: 500 }}>
            {person.risk_level} Risk
          </div>
        </div>

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(42,37,32,0.08)' }}>
          <Row
            label="Actual Recidivism"
            value={person.actual_recidivism ? 'Yes' : 'No'}
            valueColor={person.actual_recidivism ? '#d4896b' : '#5b8fc4'}
          />
        </div>
      </div>
    </>
  )
}

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 0', borderBottom: '1px solid rgba(42,37,32,0.06)' }}>
      <span style={{ fontSize: 13, color: '#6b6661' }}>{label}</span>
      <span style={{ fontSize: 14, color: valueColor || '#1a1614', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
