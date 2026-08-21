/** The shape the collector publishes. Kept in step with pipeline/index.mjs by hand. */

export type Level = 'bachelor' | 'master'

export type FundingTier =
  | 'full-ride'
  | 'full-tuition'
  | 'partial'
  | 'fixed'
  | 'stipend'
  | 'waiver'
  | 'not-stated'

export type Band = 'open-to-most' | 'competitive' | 'highly-selective'

export type ApplicationMode = 'automatic' | 'separate' | 'unclear'

export type StatusState = 'open' | 'upcoming' | 'closed'

export interface Money {
  value: number
  currency: string
  period: 'month' | 'year' | 'semester' | 'total'
}

export interface Institution {
  id: string
  name: string
  cc: string
  domain: string
}

export interface Status {
  state: StatusState
  days?: number | null
  reopenMonth?: number | null
  why?: string | null
}

export interface Evidence {
  label: string
  quote: string
}

export interface Requirement {
  kind: 'english' | 'language' | 'grades' | 'documents' | 'process'
  label: string
}

export interface Award {
  id: string
  name: string
  url: string
  host: string
  institution: Institution
  kind: 'university' | 'programme'
  levels: Level[]
  /** False when the page never said which level it is for. */
  levelsStated?: boolean
  fields: string[]
  funding: {
    tier: FundingTier
    percent: number | null
    amount: Money | null
    timeLimited: boolean
    renewable: boolean
  }
  covers?: string
  /** Arabic versions of this project’s own summary copy, for curated programmes. */
  coversAr?: string | null
  noteAr?: string | null
  notesAr?: string[] | null
  deadline: string | null
  intakeYear: number | null
  window?: [number, number] | null
  status: Status
  application: ApplicationMode
  selectivity: { band: Band; awardCount: number | null; notes: string[] }
  requirements: Requirement[]
  gradeBar: { kind: string; percent: number } | null
  eligibleCountries: string[] | null
  excludedCountries: string[] | null
  lang: string
  langName: string
  note?: string | null
  evidence: Evidence[]
  foundBy: string
  firstSeen: string
  lastVerified: string
}

export interface Summary {
  built: string
  day: string
  counts: Record<string, number>
  total: number
  closed: number
  institutions: number
  checked: number
  countries: number
  shards: Record<string, string>
  closedShard: string
}

export interface SourceRow {
  id: string
  name: string
  cc: string
  domain: string
  reachable: boolean
  movedTo?: string | null
  awards: number
  checked: string
}
