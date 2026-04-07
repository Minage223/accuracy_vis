import React from 'react'

export default function PersonTooltip({ person, position, containerRect }) {
  if (!person || !position) return null

  const TW = 220
  const TH = 160
  const MARGIN = 12

  // horizontal: centre on bar, clamp to viewport
  let left = position.x - TW / 2
  if (containerRect) {
    left = Math.max(containerRect.left + MARGIN,
           Math.min(left, containerRect.right - TW - MARGIN))
  }
  // vertical: above the bar top
  let top = position.y - TH - 10
  if (top < MARGIN) top = position.y + 20

  const style = {
    position: 'fixed',
    left, top,
    width: TW,
    background: 'rgba(245,243,240,0.98)',
    border: '2px solid rgba(42,37,32,0.15)',
    borderRadius: 8,
    padding: '14px 18px',
    boxShadow: '0 8px 24px rgba(42,37,32,0.12)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    color: '#1a1614',
    pointerEvents: 'none',
    zIndex: 50,
    animation: 'ttIn 150ms ease-out forwards',
  }

  const label = { color: '#6b6661', fontSize: 11, marginBottom: 1 }
  const value = { fontWeight: 500 }

  const RISK_COLOR = { Low: '#5b8fc4', Medium: '#c9a77c', High: '#d4896b' }
  const riskLevel = person.decile_score <= 4 ? 'Low' : person.decile_score <= 7 ? 'Medium' : 'High'

  return (
    <>
      <style>{`@keyframes ttIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div style={style}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#1a1614' }}>
          Person #{person.id}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          <div><div style={label}>Age</div><div style={value}>{person.age}</div></div>
          <div><div style={label}>Sex</div><div style={value}>{person.sex}</div></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={label}>Race</div>
            <div style={value}>{person.race}</div>
          </div>
          <div><div style={label}>Priors</div><div style={value}>{person.priors_count}</div></div>
          <div>
            <div style={label}>Risk Score</div>
            <div style={{ ...value, color: RISK_COLOR[riskLevel] }}>{person.decile_score}/10</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={label}>Recidivism</div>
            <div style={{ ...value, color: person.two_year_recid ? '#d4896b' : '#5b8fc4' }}>
              {person.two_year_recid ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
