import type { Award, SourceRow, Summary } from './types'

/**
 * Loading the index.
 *
 * The whole index is far too much to hand a phone at once, so it is published
 * one file per country and this fetches only what is being looked at. Country
 * files carry a content hash in their name, which makes them immutable and
 * cacheable forever; the summary that maps countries to filenames is the only
 * thing that must never be served stale, so it is the only thing fetched with
 * caching turned off.
 */

const BASE = import.meta.env.BASE_URL

let summaryPromise: Promise<Summary> | null = null
const shardCache = new Map<string, Promise<Award[]>>()

export function loadSummary(): Promise<Summary> {
  if (!summaryPromise) {
    summaryPromise = fetch(`${BASE}data/summary.json`, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`The index is not published yet (${r.status})`)
      return r.json() as Promise<Summary>
    })
  }
  return summaryPromise
}

export function loadCountry(summary: Summary, cc: string): Promise<Award[]> {
  const file = summary.shards[cc]
  if (!file) return Promise.resolve([])
  let pending = shardCache.get(cc)
  if (!pending) {
    pending = fetch(`${BASE}data/${file}`)
      .then((r) => (r.ok ? (r.json() as Promise<Award[]>) : []))
      .catch(() => [])
    shardCache.set(cc, pending)
  }
  return pending
}

/** Every country at once, for the views that genuinely need the whole picture. */
export async function loadAll(summary: Summary): Promise<Award[]> {
  const parts = await Promise.all(Object.keys(summary.shards).map((cc) => loadCountry(summary, cc)))
  return parts.flat()
}

let closedPromise: Promise<Award[]> | null = null

export function loadClosed(summary: Summary): Promise<Award[]> {
  if (!closedPromise) {
    closedPromise = fetch(`${BASE}data/${summary.closedShard}`)
      .then((r) => (r.ok ? (r.json() as Promise<Award[]>) : []))
      .catch(() => [])
  }
  return closedPromise
}

let sourcesPromise: Promise<SourceRow[]> | null = null

export function loadSources(): Promise<SourceRow[]> {
  if (!sourcesPromise) {
    sourcesPromise = fetch(`${BASE}data/sources.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { institutions: [] }))
      .then((j) => (j.institutions || []) as SourceRow[])
      .catch(() => [])
  }
  return sourcesPromise
}
