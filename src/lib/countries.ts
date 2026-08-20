/**
 * Countries, in two lists that do different jobs.
 *
 * `DESTINATIONS` is where you can study — a closed list, matching what the
 * collector crawls. `NATIONALITIES` is who you are, and has to be the whole
 * world, because the point of asking is to rule out awards that are closed to
 * your passport.
 */

export interface Destination {
  cc: string
  name: string
  region: Region
}

export type Region =
  | 'Britain and Ireland'
  | 'North America'
  | 'Western Europe'
  | 'Northern Europe'
  | 'Southern Europe'
  | 'Central and Eastern Europe'
  | 'East Asia'
  | 'Oceania'
  | 'Middle East'

export const DESTINATIONS: Destination[] = [
  { cc: 'GB', name: 'United Kingdom', region: 'Britain and Ireland' },
  { cc: 'IE', name: 'Ireland', region: 'Britain and Ireland' },

  { cc: 'US', name: 'United States', region: 'North America' },
  { cc: 'CA', name: 'Canada', region: 'North America' },

  { cc: 'DE', name: 'Germany', region: 'Western Europe' },
  { cc: 'FR', name: 'France', region: 'Western Europe' },
  { cc: 'NL', name: 'Netherlands', region: 'Western Europe' },
  { cc: 'BE', name: 'Belgium', region: 'Western Europe' },
  { cc: 'CH', name: 'Switzerland', region: 'Western Europe' },
  { cc: 'AT', name: 'Austria', region: 'Western Europe' },
  { cc: 'LU', name: 'Luxembourg', region: 'Western Europe' },
  { cc: 'LI', name: 'Liechtenstein', region: 'Western Europe' },

  { cc: 'SE', name: 'Sweden', region: 'Northern Europe' },
  { cc: 'NO', name: 'Norway', region: 'Northern Europe' },
  { cc: 'DK', name: 'Denmark', region: 'Northern Europe' },
  { cc: 'FI', name: 'Finland', region: 'Northern Europe' },
  { cc: 'IS', name: 'Iceland', region: 'Northern Europe' },
  { cc: 'EE', name: 'Estonia', region: 'Northern Europe' },
  { cc: 'LV', name: 'Latvia', region: 'Northern Europe' },
  { cc: 'LT', name: 'Lithuania', region: 'Northern Europe' },

  { cc: 'IT', name: 'Italy', region: 'Southern Europe' },
  { cc: 'ES', name: 'Spain', region: 'Southern Europe' },
  { cc: 'PT', name: 'Portugal', region: 'Southern Europe' },
  { cc: 'GR', name: 'Greece', region: 'Southern Europe' },
  { cc: 'MT', name: 'Malta', region: 'Southern Europe' },
  { cc: 'CY', name: 'Cyprus', region: 'Southern Europe' },

  { cc: 'PL', name: 'Poland', region: 'Central and Eastern Europe' },
  { cc: 'CZ', name: 'Czechia', region: 'Central and Eastern Europe' },
  { cc: 'HU', name: 'Hungary', region: 'Central and Eastern Europe' },
  { cc: 'SK', name: 'Slovakia', region: 'Central and Eastern Europe' },
  { cc: 'SI', name: 'Slovenia', region: 'Central and Eastern Europe' },
  { cc: 'HR', name: 'Croatia', region: 'Central and Eastern Europe' },
  { cc: 'RO', name: 'Romania', region: 'Central and Eastern Europe' },
  { cc: 'BG', name: 'Bulgaria', region: 'Central and Eastern Europe' },
  { cc: 'TR', name: 'Türkiye', region: 'Central and Eastern Europe' },

  { cc: 'CN', name: 'China', region: 'East Asia' },
  { cc: 'JP', name: 'Japan', region: 'East Asia' },
  { cc: 'KR', name: 'South Korea', region: 'East Asia' },
  { cc: 'TW', name: 'Taiwan', region: 'East Asia' },
  { cc: 'HK', name: 'Hong Kong', region: 'East Asia' },
  { cc: 'SG', name: 'Singapore', region: 'East Asia' },

  { cc: 'AU', name: 'Australia', region: 'Oceania' },
  { cc: 'NZ', name: 'New Zealand', region: 'Oceania' },

  { cc: 'AE', name: 'United Arab Emirates', region: 'Middle East' },
  { cc: 'SA', name: 'Saudi Arabia', region: 'Middle East' },
  { cc: 'QA', name: 'Qatar', region: 'Middle East' },
  { cc: 'KW', name: 'Kuwait', region: 'Middle East' },
  { cc: 'BH', name: 'Bahrain', region: 'Middle East' },
  { cc: 'OM', name: 'Oman', region: 'Middle East' },
]

export const REGIONS: Region[] = [
  'Britain and Ireland',
  'North America',
  'Western Europe',
  'Northern Europe',
  'Southern Europe',
  'Central and Eastern Europe',
  'East Asia',
  'Oceania',
  'Middle East',
]

/** A programme run across several countries rather than in one. */
export const MULTI_COUNTRY = 'EU'

const DEST_BY_CC = new Map(DESTINATIONS.map((d) => [d.cc, d]))

export function countryName(cc: string): string {
  if (cc === MULTI_COUNTRY) return 'Across Europe'
  return DEST_BY_CC.get(cc)?.name ?? NATIONALITY_BY_CC.get(cc) ?? cc
}

/** Everyone. Used for the nationality question, never for filtering destinations. */
export const NATIONALITIES: Array<{ cc: string; name: string }> = [
  ['AF', 'Afghanistan'], ['AL', 'Albania'], ['DZ', 'Algeria'], ['AO', 'Angola'],
  ['AR', 'Argentina'], ['AM', 'Armenia'], ['AU', 'Australia'], ['AT', 'Austria'],
  ['AZ', 'Azerbaijan'], ['BH', 'Bahrain'], ['BD', 'Bangladesh'], ['BY', 'Belarus'],
  ['BE', 'Belgium'], ['BJ', 'Benin'], ['BT', 'Bhutan'], ['BO', 'Bolivia'],
  ['BA', 'Bosnia and Herzegovina'], ['BW', 'Botswana'], ['BR', 'Brazil'], ['BN', 'Brunei'],
  ['BG', 'Bulgaria'], ['BF', 'Burkina Faso'], ['BI', 'Burundi'], ['KH', 'Cambodia'],
  ['CM', 'Cameroon'], ['CA', 'Canada'], ['CF', 'Central African Republic'], ['TD', 'Chad'],
  ['CL', 'Chile'], ['CN', 'China'], ['CO', 'Colombia'], ['CG', 'Congo'],
  ['CD', 'Democratic Republic of the Congo'], ['CR', 'Costa Rica'], ['CI', "Côte d'Ivoire"],
  ['HR', 'Croatia'], ['CU', 'Cuba'], ['CY', 'Cyprus'], ['CZ', 'Czechia'],
  ['DK', 'Denmark'], ['DJ', 'Djibouti'], ['DO', 'Dominican Republic'], ['EC', 'Ecuador'],
  ['EG', 'Egypt'], ['SV', 'El Salvador'], ['ER', 'Eritrea'], ['EE', 'Estonia'],
  ['SZ', 'Eswatini'], ['ET', 'Ethiopia'], ['FJ', 'Fiji'], ['FI', 'Finland'],
  ['FR', 'France'], ['GA', 'Gabon'], ['GM', 'Gambia'], ['GE', 'Georgia'],
  ['DE', 'Germany'], ['GH', 'Ghana'], ['GR', 'Greece'], ['GT', 'Guatemala'],
  ['GN', 'Guinea'], ['GY', 'Guyana'], ['HT', 'Haiti'], ['HN', 'Honduras'],
  ['HK', 'Hong Kong'], ['HU', 'Hungary'], ['IS', 'Iceland'], ['IN', 'India'],
  ['ID', 'Indonesia'], ['IR', 'Iran'], ['IQ', 'Iraq'], ['IE', 'Ireland'],
  ['IL', 'Israel'], ['IT', 'Italy'], ['JM', 'Jamaica'], ['JP', 'Japan'],
  ['JO', 'Jordan'], ['KZ', 'Kazakhstan'], ['KE', 'Kenya'], ['KW', 'Kuwait'],
  ['KG', 'Kyrgyzstan'], ['LA', 'Laos'], ['LV', 'Latvia'], ['LB', 'Lebanon'],
  ['LS', 'Lesotho'], ['LR', 'Liberia'], ['LY', 'Libya'], ['LT', 'Lithuania'],
  ['LU', 'Luxembourg'], ['MG', 'Madagascar'], ['MW', 'Malawi'], ['MY', 'Malaysia'],
  ['MV', 'Maldives'], ['ML', 'Mali'], ['MT', 'Malta'], ['MR', 'Mauritania'],
  ['MU', 'Mauritius'], ['MX', 'Mexico'], ['MD', 'Moldova'], ['MN', 'Mongolia'],
  ['ME', 'Montenegro'], ['MA', 'Morocco'], ['MZ', 'Mozambique'], ['MM', 'Myanmar'],
  ['NA', 'Namibia'], ['NP', 'Nepal'], ['NL', 'Netherlands'], ['NZ', 'New Zealand'],
  ['NI', 'Nicaragua'], ['NE', 'Niger'], ['NG', 'Nigeria'], ['MK', 'North Macedonia'],
  ['NO', 'Norway'], ['OM', 'Oman'], ['PK', 'Pakistan'], ['PS', 'Palestine'],
  ['PA', 'Panama'], ['PG', 'Papua New Guinea'], ['PY', 'Paraguay'], ['PE', 'Peru'],
  ['PH', 'Philippines'], ['PL', 'Poland'], ['PT', 'Portugal'], ['QA', 'Qatar'],
  ['RO', 'Romania'], ['RU', 'Russia'], ['RW', 'Rwanda'], ['SA', 'Saudi Arabia'],
  ['SN', 'Senegal'], ['RS', 'Serbia'], ['SL', 'Sierra Leone'], ['SG', 'Singapore'],
  ['SK', 'Slovakia'], ['SI', 'Slovenia'], ['SO', 'Somalia'], ['ZA', 'South Africa'],
  ['KR', 'South Korea'], ['SS', 'South Sudan'], ['ES', 'Spain'], ['LK', 'Sri Lanka'],
  ['SD', 'Sudan'], ['SE', 'Sweden'], ['CH', 'Switzerland'], ['SY', 'Syria'],
  ['TW', 'Taiwan'], ['TJ', 'Tajikistan'], ['TZ', 'Tanzania'], ['TH', 'Thailand'],
  ['TL', 'Timor-Leste'], ['TG', 'Togo'], ['TT', 'Trinidad and Tobago'], ['TN', 'Tunisia'],
  ['TR', 'Türkiye'], ['TM', 'Turkmenistan'], ['UG', 'Uganda'], ['UA', 'Ukraine'],
  ['AE', 'United Arab Emirates'], ['GB', 'United Kingdom'], ['US', 'United States'],
  ['UY', 'Uruguay'], ['UZ', 'Uzbekistan'], ['VE', 'Venezuela'], ['VN', 'Vietnam'],
  ['YE', 'Yemen'], ['ZM', 'Zambia'], ['ZW', 'Zimbabwe'],
].map(([cc, name]) => ({ cc, name }))

const NATIONALITY_BY_CC = new Map(NATIONALITIES.map((n) => [n.cc, n.name]))

/**
 * Whether a country named on a scholarship page is the one somebody selected.
 *
 * Pages write country names by hand, so this has to survive "Türkiye" against
 * "Turkey", "UK" against "United Kingdom", and a stray "the" — while refusing to
 * match on a coincidence, because a wrong match here hides an award somebody
 * was eligible for.
 */
const ALIASES: Record<string, string[]> = {
  GB: ['uk', 'united kingdom', 'britain', 'great britain', 'england', 'scotland', 'wales'],
  US: ['usa', 'united states', 'america', 'united states of america'],
  TR: ['turkey', 'turkiye', 'türkiye'],
  KR: ['korea', 'south korea', 'republic of korea'],
  CN: ['china', "people's republic of china", 'prc'],
  AE: ['uae', 'united arab emirates', 'emirates'],
  CZ: ['czechia', 'czech republic'],
  CI: ['ivory coast', "côte d'ivoire", "cote d'ivoire"],
  VN: ['vietnam', 'viet nam'],
  LA: ['laos', 'lao pdr'],
  RU: ['russia', 'russian federation'],
  CD: ['drc', 'democratic republic of the congo', 'dr congo'],
  MM: ['myanmar', 'burma'],
}

export function matchesCountry(nameOnPage: string, cc: string): boolean {
  const needle = nameOnPage.trim().toLowerCase().replace(/^the\s+/, '')
  if (!needle) return false
  const official = (NATIONALITY_BY_CC.get(cc) || '').toLowerCase()
  if (official && needle === official) return true
  const aliases = ALIASES[cc] || []
  return aliases.includes(needle)
}
