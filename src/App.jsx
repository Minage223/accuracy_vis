import React, { useState } from 'react'
import { DataProvider, useData } from './context/DataContext'
import HeroBars from './components/HeroBars'
import Act1_Introduction from './components/Act1_Introduction'
import Act2_CorrelationNetwork from './components/Act2_CorrelationNetwork'
import Act3_FeatureAblation from './components/Act3_FeatureAblation'
import Act4_CaseComparison from './components/Act4_CaseComparison'
import Act5_FairnessDilemma from './components/Act5_FairnessDilemma'

function ProgressDots({ total, current }) {
  return (
    <div className="fixed top-1/2 -translate-y-1/2 right-6 z-50 flex flex-col gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <a
          key={i}
          href={`#act${i + 1}`}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i === current
              ? 'bg-bias-blue scale-150'
              : 'bg-bias-border hover:bg-bias-muted'
          }`}
          title={`Act ${i + 1}`}
        />
      ))}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-bias-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-bias-muted text-sm">Loading data...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card max-w-lg text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold text-bias-red">Data Not Found</h2>
        <p className="text-bias-muted text-sm leading-relaxed">{message}</p>
        <div className="text-left bg-bias-bg rounded-lg p-4 font-mono text-xs text-bias-green">
          <div># Run the data pipeline first:</div>
          <div>bash setup.sh</div>
          <div className="mt-2"># Or manually:</div>
          <div>pip install -r requirements.txt</div>
          <div>python scripts/data_processing.py</div>
        </div>
      </div>
    </div>
  )
}

function StoryContent() {
  const { data, loading, error } = useData()
  const [activeAct, setActiveAct] = useState(0)

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} />

  const acts = [
    { id: 'act1', label: <>
        <span style={{ color: '#4A5FC1' }}>Accuracy is similar.</span>{' '}
        <span style={{ color: '#A85454' }}>The errors are not.</span>
      </>, component: <Act1_Introduction data={data.act1} /> },
    { id: 'act2', label: <><span style={{ color: '#4A5FC1' }}>Same Crime,</span>{' '}<span style={{ color: '#A85454' }}>Different Score.</span></>, component: <Act4_CaseComparison data={data.cases} /> },
    { id: 'act3', label: <span style={{ color: '#4A5FC1' }}>The Fairness Dilemma</span>,
      component: <>
        {/* Part A */}
        <div className="max-w-4xl mx-auto px-6 pb-4 text-center">
          <div className="text-bias-muted text-sm tracking-widest uppercase">Part A</div>
          <div className="text-xl font-semibold text-bias-text mt-1">The Proxy Trap</div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-8 items-start">
          <div>
            <Act2_CorrelationNetwork data={data.correlations} embedded />
          </div>
          <div className="border-l border-bias-border pl-8">
            <div className="text-lg font-semibold text-bias-text mb-6">What happens when you take them out?</div>
            <Act3_FeatureAblation data={data.ablation} importance={data.importance} embedded />
          </div>
        </div>
        {/* Part B */}
        <div className="max-w-4xl mx-auto px-6 pb-4 text-center border-t border-bias-border pt-16">
          <div className="text-bias-muted text-sm tracking-widest uppercase">Part B</div>
          <div className="text-xl font-semibold text-bias-text mt-1">The Mathematical Impossibility</div>
        </div>
        <Act5_FairnessDilemma data={data.fairness} />
      </>
    },
  ]

  return (
    <div className="relative" style={{ background: '#F5F1EC' }}>
      <ProgressDots total={acts.length} current={activeAct} />

      <HeroBars />

      {acts.map((act, i) => (
        <section
          key={act.id}
          id={act.id}
          className="min-h-screen"
          style={{ background: '#F5F1EC' }}
          ref={el => {
            if (!el) return
            const obs = new IntersectionObserver(
              ([entry]) => { if (entry.isIntersecting) setActiveAct(i) },
              { threshold: 0.3 }
            )
            obs.observe(el)
          }}
        >
          <div className="pt-24 pb-8 px-6 text-center">
            <div className="text-bias-muted text-sm mb-2">{String(i + 1).padStart(2, '0')}</div>
            <h2 className="text-3xl md:text-4xl font-bold">{act.label}</h2>
            {act.subtitle && (
              <p className="text-bias-muted text-sm mt-2 max-w-xl mx-auto">{act.subtitle}</p>
            )}
          </div>
          {act.component}
        </section>
      ))}

      <footer className="border-t border-bias-border py-12 px-6 text-center space-y-3" style={{ background: '#F5F1EC' }}>
        <p className="text-bias-muted text-sm">
          Data: ProPublica COMPAS Analysis (2016) &middot;{' '}
          <a
            href="https://github.com/propublica/compas-analysis"
            className="text-bias-blue hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>
        </p>
        <p className="text-bias-muted text-xs">
          Angwin et al., "Machine Bias" (ProPublica, 2016) &middot;
          Chouldechova, "Fair prediction with disparate impact" (2017)
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <StoryContent />
    </DataProvider>
  )
}
