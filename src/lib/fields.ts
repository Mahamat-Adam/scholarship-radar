import taxonomy from '../data/fields.json'

/**
 * Subjects.
 *
 * Twelve families rather than a family-and-major tree, and that is a decision
 * about the data rather than about the design. Scholarships are almost never
 * scoped to a major: they are open to any subject, or to a whole faculty. Fewer
 * than half the awards in the index name a subject at all, and none of them name
 * one as narrow as "artificial intelligence". A two-level tree would therefore be
 * a couple of hundred filters of which nearly all return nothing, which looks
 * thorough and is useless.
 *
 * What the tree was really for is findable: somebody looking for computer science
 * needs to know it lives under Computing. So each family carries the majors it
 * covers, shown on screen rather than left to be guessed, and a typed subject is
 * matched against the full list of synonyms.
 */

export interface Family {
  key: string
  label: string
  examples: string[]
  match: string[]
}

export const FAMILIES: Family[] = taxonomy.families

export const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FAMILIES.map((f) => [f.key, f.label])
)

/** "computer science, artificial intelligence, data science…" for one family. */
export function examplesFor(key: string): string {
  const family = FAMILIES.find((f) => f.key === key)
  return family ? family.examples.join(' · ') : ''
}

/**
 * The families a typed subject belongs to.
 *
 * Matches on the synonym list rather than on the family name, so "AI", "nursing"
 * and "LLM" each land somewhere sensible without anybody having to know which
 * box they were filed in.
 */
export function familiesFor(query: string): Family[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []

  const scored: Array<{ family: Family; score: number }> = []
  for (const family of FAMILIES) {
    let best = 0
    if (family.label.toLowerCase() === needle) best = 100
    else if (family.label.toLowerCase().startsWith(needle)) best = 80

    // A trailing asterisk marks a stem for the collector's regexes; it is not
    // part of the word anybody types.
    for (const raw of family.match) {
      const term = raw.endsWith('*') ? raw.slice(0, -1) : raw
      if (term === needle) best = Math.max(best, 95)
      else if (term.startsWith(needle)) best = Math.max(best, 70)
      else if (term.includes(needle)) best = Math.max(best, 45)
      // "computer science" should be found by typing "science", but not as
      // strongly as Sciences itself is.
      else if (needle.includes(term) && term.length > 4) best = Math.max(best, 40)
    }
    if (best > 0) scored.push({ family, score: best })
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.family)
}

/** Does an award in these families answer a free-text search? */
export function fieldsMatchQuery(fields: string[], query: string): boolean {
  if (!fields.length) return false
  const hits = familiesFor(query)
  if (!hits.length) return false
  return hits.some((f) => fields.includes(f.key))
}
