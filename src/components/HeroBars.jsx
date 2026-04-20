import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import BarsCanvas from './BarsCanvas'
import PersonTooltip from './PersonTooltip'

export default function HeroBars() {
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    fetch('/data/hero_bars_data.json')
      .then(r => r.json())
      .then(d => { setRawData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const displayData = useMemo(() => (
    [...rawData].sort((a, b) => a.decile_score - b.decile_score)
  ), [rawData])

  const handleHover = useCallback((person, pos, rect) => {
    setHovered(person ? { person, pos, rect } : null)
  }, [])

  // Stats for legend
  const LEGEND_RACES = [
    { race: 'African-American', color: 'rgba(215,162,20,0.85)',  label: 'African-American' },
    { race: 'Hispanic',         color: 'rgba(171,196,255,0.75)', label: 'Hispanic' },
    { race: 'Caucasian',        color: 'rgba(74,95,193,0.85)',  label: 'Caucasian' },
    { race: 'Asian',            color: 'rgba(14,149,148,0.75)', label: 'Asian' },
    { race: 'Other',            color: 'rgba(180,172,165,0.35)', label: 'Other' },
  ]
  const legendStats = LEGEND_RACES.map(({ race, color, label }) => {
    const group = rawData.filter(d => d.race === race)
    const avg   = group.length
      ? (group.reduce((s, d) => s + d.decile_score, 0) / group.length).toFixed(1) : '—'
    return { color, label, avg, n: group.length }
  })

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#F5F1EC',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Bar chart — 45vh */}
      <div style={{ flex: '0 0 45vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Score axis at top */}
        {!loading && (
          <div style={{ flexShrink: 0 }}>
            {/* Labels */}
            <div style={{ display: 'flex', height: 18 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(score => (
                <div key={score} style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 10,
                  color: '#A85454',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: '18px',
                }}>
                  {score}
                </div>
              ))}
            </div>
            {/* Ruler line with ticks */}
            <div style={{ position: 'relative', height: 8 }}>
              {/* Baseline */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 1, background: 'rgba(42,37,32,0.15)',
              }} />
              {/* Tick marks at each column centre */}
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: 0,
                  left: `${(i + 0.5) * 10}%`,
                  transform: 'translateX(-50%)',
                  width: 1,
                  height: i === 0 || i === 9 ? 7 : 4,  // taller at ends
                  background: 'rgba(42,37,32,0.20)',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Canvas fills remaining height */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                          height: '100%', paddingBottom: 20, color: '#9b9690', fontSize: 14 }}>
              Loading…
            </div>
          ) : (
            <BarsCanvas data={displayData} onHover={handleHover} />
          )}
        </div>

        {/* Legend — bottom right */}
        {!loading && (
          <div style={{ position: 'absolute', bottom: 12, right: 16,
                        display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
            {legendStats.filter(r => r.n > 0).map(({ color, label, avg }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#9b9690' }}>{label}  avg {avg}</span>
                <div style={{ width: 10, height: 2, background: color, borderRadius: 1 }} />
              </div>
            ))}
            <span style={{ fontSize: 11, color: '#c5bfba' }}>
              {displayData.length.toLocaleString()} defendants
            </span>
          </div>
        )}
      </div>

      {/* Title — 55vh, no hard border (bottom edge of bars creates the visual break) */}
      <div style={{
        flex: '0 0 55vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        <h1 style={{
          fontSize: 'clamp(40px, 5.5vw, 64px)',
          fontWeight: 600,
          color: '#4A5FC1',
          margin: 0,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
        }}>
          Beyond Accuracy
        </h1>

        <div style={{ width: 200, height: 2, background: 'rgba(42,37,32,0.25)',
                      margin: '18px auto' }} />

        {/* Single-line subtitle */}
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 24px)', margin: 0,
                    fontWeight: 400, whiteSpace: 'nowrap' }}>
          <span style={{ color: '#6b6661' }}>How Proxy Variables Hide </span>
          <span style={{ color: '#4A5FC1', fontWeight: 600 }}>Algorithmic Bias</span>
        </p>

        <p style={{ marginTop: 14, fontSize: 12, color: '#c5bfba', letterSpacing: '0.04em' }}>
          Each mark is a real defendant
        </p>


        {/* Scroll hint */}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: '#9b9690', letterSpacing: '0.1em',
                         textTransform: 'uppercase' }}>Explore</span>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 1l7 7 7-7" stroke="rgba(42,37,32,0.35)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <PersonTooltip
          person={hovered.person}
          position={hovered.pos}
          containerRect={hovered.rect}
        />
      )}
    </div>
  )
}
