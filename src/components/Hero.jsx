import React, { useState, useEffect } from 'react'
import NodeCanvas from './NodeCanvas'
import PersonCard from './PersonCard'

const STYLES = ['network', 'particle', 'minimal']
const STYLE_LABELS = { network: 'Node Network', particle: 'Particle Cloud', minimal: 'Minimal' }

export default function Hero() {
  const [nodes,          setNodes]          = useState([])
  const [selected,       setSelected]       = useState(null)   // { person, pos }
  const [viewMode,       setViewMode]       = useState('network')

  useEffect(() => {
    fetch('/data/hero_nodes.json')
      .then(r => r.json())
      .then(setNodes)
      .catch(console.error)
  }, [])

  function handlePersonSelect(person, pos) {
    if (!person) { setSelected(null); return }
    setSelected({ person, pos })
  }

  const paused = !!selected

  return (
    <div
      id="hero"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f5f3f0 0%, #dad5ce 50%, #2a2520 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      onClick={e => {
        // Close card if clicking outside canvas nodes (canvas handles its own clicks)
        if (e.target === e.currentTarget) setSelected(null)
      }}
    >
      {/* Canvas layer */}
      <NodeCanvas
        nodes={nodes}
        paused={paused}
        viewMode={viewMode}
        onPersonSelect={handlePersonSelect}
        selectedId={selected?.person?.id}
      />

      {/* Title — centred, above canvas */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        <h1 style={{ fontSize: 'clamp(42px, 6vw, 64px)', fontWeight: 600,
                     color: '#1a1614', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Beyond Accuracy
        </h1>

        <div style={{ width: 200, height: 1, background: 'rgba(42,37,32,0.3)', margin: '20px auto' }} />

        <p style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', color: '#6b6661',
                    margin: '0 0 6px', fontWeight: 400 }}>
          How Proxy Variables Hide
        </p>
        <p style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', color: '#5b8fc4',
                    margin: 0, fontWeight: 600 }}>
          Algorithmic Bias
        </p>

        <p style={{ marginTop: 20, fontSize: 'clamp(14px, 1.5vw, 18px)', color: '#9b9690',
                    maxWidth: 480, lineHeight: 1.6 }}>
          When algorithms seem accurate, bias hides in proxy variables.
          <br />
          <span style={{ fontSize: '0.85em' }}>
            Click any node to explore a real case from the COMPAS dataset.
          </span>
        </p>
      </div>

      {/* Style switcher */}
      <div style={{
        position: 'absolute', top: 24, right: 24, zIndex: 30,
        display: 'flex', gap: 4,
      }}>
        {STYLES.map(s => (
          <button
            key={s}
            onClick={() => setViewMode(s)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: 'pointer',
              borderRadius: 20,
              border: '1px solid rgba(42,37,32,0.15)',
              background: viewMode === s ? '#5b8fc4' : 'rgba(42,37,32,0.05)',
              color:      viewMode === s ? '#fff'    : '#6b6661',
              transition: 'all 150ms ease',
            }}
          >
            {STYLE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 60, left: 24, zIndex: 10,
        display: 'flex', gap: 16, alignItems: 'center',
      }}>
        {[
          { color: 'rgba(201,167,124,0.9)', label: 'African-American' },
          { color: 'rgba(123,163,199,0.9)', label: 'Caucasian' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%',
                          background: color, border: '1.5px solid rgba(255,255,255,0.6)' }} />
            <span style={{ fontSize: 12, color: '#9b9690' }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(163,155,146,0.8)',
                        border: '1.5px solid rgba(255,255,255,0.6)', display: 'inline-block' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(163,155,146,0.8)',
                        border: '1.5px solid rgba(255,255,255,0.6)', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: '#9b9690' }}>Node size = risk score</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 12, color: '#9b9690', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Explore
        </span>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <path d="M1 1l7 7 7-7" stroke="rgba(42,37,32,0.4)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Person card */}
      {selected && (
        <PersonCard
          person={selected.person}
          position={selected.pos}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
