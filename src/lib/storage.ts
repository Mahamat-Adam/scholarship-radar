import type { Filters } from './filters'
import { EMPTY_FILTERS } from './filters'

/**
 * Everything the site remembers about you, kept in your own browser.
 *
 * There is no account and no server — this project has nowhere to send any of
 * it, which is the point. Clearing your browser data clears all of it, so the
 * backup file below is the only way to carry a shortlist to another device.
 */

const KEY = 'scholarship-radar/v1'

export type Stage = 'saved' | 'preparing' | 'submitted' | 'outcome'

export interface Tracked {
  stage: Stage
  savedOn: string
  submittedOn?: string
  note?: string
}

interface Store {
  profile: Filters | null
  tracked: Record<string, Tracked>
  seen: Record<string, string>
  lastVisit: string | null
  // The visit before this one. Stamping the current visit on load would
  // otherwise destroy the only value that can answer "what is new since I was
  // last here" — by the time anything renders, "last visit" would be today.
  previousVisit: string | null
}

const EMPTY: Store = { profile: null, tracked: {}, seen: {}, lastVisit: null, previousVisit: null }

function read(): Store {
  if (typeof localStorage === 'undefined') return { ...EMPTY }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<Store>
    return {
      profile: parsed.profile ?? null,
      tracked: parsed.tracked ?? {},
      seen: parsed.seen ?? {},
      lastVisit: parsed.lastVisit ?? null,
      previousVisit: parsed.previousVisit ?? null,
    }
  } catch {
    return { ...EMPTY }
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // A full or disabled storage quota is not worth breaking the page over.
  }
}

let cache: Store | null = null
const listeners = new Set<() => void>()

function state(): Store {
  if (!cache) cache = read()
  return cache
}

function commit(next: Store) {
  cache = next
  write(next)
  for (const fn of listeners) fn()
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/* ------------------------------------------------------------------ profile */

export function getProfile(): Filters | null {
  const p = state().profile
  // Merging over the defaults means a profile saved by an older version of the
  // site still works after a new filter is added.
  return p ? { ...EMPTY_FILTERS, ...p } : null
}

export function saveProfile(profile: Filters) {
  commit({ ...state(), profile })
}

export function clearProfile() {
  commit({ ...state(), profile: null })
}

/* ------------------------------------------------------------ saved and seen */

export function getTracked(): Record<string, Tracked> {
  return state().tracked
}

export function isSaved(id: string): boolean {
  return Boolean(state().tracked[id])
}

export function toggleSaved(id: string) {
  const tracked = { ...state().tracked }
  if (tracked[id]) delete tracked[id]
  else tracked[id] = { stage: 'saved', savedOn: new Date().toISOString().slice(0, 10) }
  commit({ ...state(), tracked })
}

export function setStage(id: string, stage: Stage) {
  const current = state().tracked[id]
  if (!current) return
  const next: Tracked = { ...current, stage }
  if (stage === 'submitted' && !next.submittedOn) {
    next.submittedOn = new Date().toISOString().slice(0, 10)
  }
  commit({ ...state(), tracked: { ...state().tracked, [id]: next } })
}

export function markSeen(ids: string[]) {
  if (!ids.length) return
  const seen = { ...state().seen }
  const today = new Date().toISOString().slice(0, 10)
  let changed = false
  for (const id of ids) {
    if (!seen[id]) {
      seen[id] = today
      changed = true
    }
  }
  if (changed) commit({ ...state(), seen })
}

export function isSeen(id: string): boolean {
  return Boolean(state().seen[id])
}

/* -------------------------------------------------------------- last visit */

/**
 * The day before today's, for deciding what counts as new. Read this rather
 * than lastVisit: by the time anything renders, lastVisit is today.
 */
export function getPreviousVisit(): string | null {
  return state().previousVisit
}

export function stampVisit() {
  const today = new Date().toISOString().slice(0, 10)
  const current = state()
  if (current.lastVisit === today) return
  commit({ ...current, previousVisit: current.lastVisit, lastVisit: today })
}

/* ------------------------------------------------------------------ backup */

export function exportBackup(): string {
  return JSON.stringify({ kind: 'scholarship-radar-backup', version: 1, data: state() }, null, 2)
}

export function importBackup(text: string): { ok: boolean; message: string } {
  try {
    const parsed = JSON.parse(text)
    if (parsed?.kind !== 'scholarship-radar-backup') {
      return { ok: false, message: 'That file was not written by this site.' }
    }
    const incoming = parsed.data as Store
    const merged: Store = {
      profile: incoming.profile ?? state().profile,
      tracked: { ...state().tracked, ...incoming.tracked },
      seen: { ...state().seen, ...incoming.seen },
      lastVisit: state().lastVisit,
      previousVisit: state().previousVisit,
    }
    commit(merged)
    const count = Object.keys(incoming.tracked ?? {}).length
    return { ok: true, message: `Restored ${count} saved scholarship${count === 1 ? '' : 's'}.` }
  } catch {
    return { ok: false, message: 'That file could not be read.' }
  }
}

export function clearEverything() {
  commit({ ...EMPTY })
}
