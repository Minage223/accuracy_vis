/**
 * Standalone fetch helpers — useful outside React (e.g., Web Workers).
 */

export async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`)
  return res.json()
}

/**
 * Interpolate a metric from the fairness thresholds array at a given threshold.
 * Uses linear interpolation between the two nearest records.
 */
export function interpolateAtThreshold(records, threshold, metric) {
  if (!records || records.length === 0) return null
  const sorted = [...records].sort((a, b) => a.threshold - b.threshold)
  const lo = sorted.findLast(r => r.threshold <= threshold) ?? sorted[0]
  const hi = sorted.find(r => r.threshold > threshold) ?? sorted[sorted.length - 1]
  if (lo === hi) return lo[metric]
  const t = (threshold - lo.threshold) / (hi.threshold - lo.threshold)
  const loVal = lo[metric]
  const hiVal = hi[metric]
  if (typeof loVal === 'number') return loVal + t * (hiVal - loVal)
  return loVal
}

/**
 * Build a lookup map from ablation scenario name → metrics object.
 */
export function buildAblationLookup(ablationData) {
  return ablationData ?? {}
}
