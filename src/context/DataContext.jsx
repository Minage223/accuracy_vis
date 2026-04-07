/**
 * DataContext — loads all JSON data files once and makes them available
 * to every component via useData() hook.
 */
import React, { createContext, useContext, useEffect, useState } from 'react'

const DataContext = createContext(null)

const DATA_FILES = {
  act1:         '/data/act1_stats.json',
  correlations: '/data/proxy_correlations.json',
  importance:   '/data/feature_importance.json',
  ablation:     '/data/ablation_results.json',
  cases:        '/data/comparison_cases.json',
  fairness:     '/data/fairness_tradeoffs.json',
}

export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAll() {
      try {
        const entries = await Promise.all(
          Object.entries(DATA_FILES).map(async ([key, url]) => {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`)
            return [key, await res.json()]
          })
        )
        setData(Object.fromEntries(entries))
      } catch (err) {
        console.error('Data load error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  return (
    <DataContext.Provider value={{ data, loading, error }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
