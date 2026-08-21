/**
 * The English copy, and the shape every other language has to fill.
 *
 * Kept as one object rather than scattered through the components so that a
 * second language is a translation job rather than an archaeology job, and so
 * that a missing string is a type error instead of a blank space on a page.
 */

export const en = {
  dir: 'ltr' as const,
  locale: 'en-GB',
  name: 'English',

  brand: 'Scholarship Radar',
  tagline: 'every link on the institution’s own site',

  nav: {
    find: 'Find for me',
    browse: 'Browse',
    saved: 'Saved',
    upcoming: 'Opens later',
    sources: 'Where this comes from',
    safety: 'Avoiding scams',
  },

  common: {
    open: 'open',
    countries: 'countries',
    loading: 'Reading the index…',
    loadFailed: 'The index could not be loaded.',
    show: 'show',
    clear: 'Clear',
    notSet: 'Not set',
    everywhere: 'Everywhere',
    moreFilters: 'More filters',
    countriesPicked: (n: number) => `${n} countries`,
    search: 'Search by award, university or subject',
    footerPrivacy:
      'No account, no tracking, nothing uploaded. Everything you save stays in this browser.',
    builtOn: (date: string, checked: string) => `Index built ${date} · ${checked} institutions checked`,
    language: 'Language',
    thanks: 'Thank you for passing by.',
    rights: (year: number) => `© ${year} Mahamat Adam. All rights reserved.`,
  },

  find: {
    badge: 'Six questions, no account, nothing uploaded',
    title: 'Tell me who you are.',
    intro:
      'Every answer is optional except the first, and every one you skip simply widens the search rather than narrowing it the wrong way.',
    levelQ: 'What are you looking to study?',
    bachelor: 'A bachelor’s degree',
    master: 'A master’s degree',
    nationalityQ: 'Which passport do you hold?',
    nationalityHelp:
      'A lot of the best-funded scholarships are open only to certain countries. This rules those out for you instead of letting you find out on the application form.',
    nationalitySkip: 'Rather not say — show me everything',
    whereQ: 'Where would you like to study?',
    whereHelp: 'Pick as many as you like, or none at all to see everywhere.',
    subjectQ: 'What do you want to study?',
    subjectHelp:
      'Grouped by faculty, because that is how scholarships are written — very few name a single degree. Awards that name no subject at all stay in the list whatever you pick here.',
    subjectSearch: 'Type your subject — computer science, nursing, LLM…',
    subjectNoMatch:
      'Nothing matches that. Leave it blank and the subject filter simply will not narrow anything.',
    subjectAdd: (label: string) => `Add ${label}`,
    coverQ: 'How much do you need covered?',
    coverHelp:
      'Worth knowing: awards an ordinary applicant actually wins are more often partial than total. Asking for everything narrows the list a long way.',
    coverAll: 'Everything covered',
    coverAllHint: 'Tuition, living costs and usually flights',
    coverTuition: 'At least all my tuition',
    coverTuitionHint: 'Fees paid in full',
    coverAny: 'Any help at all',
    coverAnyHint: 'Includes partial awards and fee reductions',
    gradesQ: 'Roughly what are your grades?',
    gradesHelp:
      'Only used to hide awards whose published entry bar is above you. It never ranks you, and it never leaves your browser.',
    scaleGpa: 'GPA out of 4',
    scalePercent: 'Percentage',
    scaleClass: 'UK classification',
    gradesNotSet: 'Not set — nothing will be hidden.',
    ratherNotSay: 'Rather not say',
    submit: 'Find what I can apply for',
  },

  results: {
    count: (n: number) => `${n} ${n === 1 ? 'scholarship' : 'scholarships'}`,
    // Said plainly, because the count above it cannot be honest on its own: a
    // listing whose page never published a closing date is not one we have
    // confirmed is open, and lumping it in with the ones we re-check every day
    // would be exactly the overclaim this site exists to avoid.
    confirmed: (dated: number, undated: number) =>
      undated === 0
        ? `All of them state a closing date, re-checked daily.`
        : `${dated} state a closing date, which is re-checked every day. The other ${undated} do not publish one — their cards say so, and we do not claim they are still open.`,
    hiddenTitle: 'Not shown, and why:',
    emptyTitle: 'Nothing matches all of that.',
    emptyBody:
      'The lines above say which rule removed what. Lifting the one that took the most is usually enough.',
    horizonTitle: (n: string) => `${n} open, by how long you have left`,
    horizonHint: 'Nearest deadlines in front. Drag to look further ahead.',
    legendWeek: 'closes within a week',
    legendMonth: 'within a month',
    legendQuarter: 'within three months',
    legendLater: 'later, or no fixed date',
    legendBand:
      'The lower band is the awards with no closing date — you are considered when you apply.',
  },

  reasons: {
    level: 'a different level of study',
    nationality: 'not open to your nationality',
    country: 'a country you did not pick',
    field: 'a different field of study',
    tier: 'a different kind of funding',
    selective: 'aimed at exceptional candidates',
    automatic: 'needing a separate application',
    grades: 'asking for higher grades than you entered',
    deadline: 'a deadline outside the window you chose',
    query: 'not matching your search',
  },

  card: {
    read: 'Read it on their site',
    save: 'Save',
    saved: 'Saved',
    showEvidence: 'Show what the page says',
    hideEvidence: 'Hide what the page says',
    new: 'New',
    programme: 'Government programme',
    noSeparate: 'No separate application',
    available: (n: number) => `${n} available`,
    renewable: 'Renewable',
    limited: 'Limited duration',
    onlyFrom: (list: string, more: boolean) =>
      `Open only to applicants from ${list}${more ? ' and others' : ''}.`,
    foreignPage: (language: string) =>
      `The official page is in ${language}. The details above were read from it.`,
    hostedPortal: (institution: string, portal: string) =>
      `${institution} runs its scholarships on ${portal}. The page is theirs, hosted there — not a third party reposting it.`,
    checkedToday: 'Checked today',
    checkedYesterday: 'Checked yesterday',
    checkedDays: (n: number) => `Checked ${n} days ago`,
    checkedLastWeek: 'Checked last week',
    checkedWeeks: (n: number) => `Checked ${n} weeks ago`,
  },

  deadline: {
    today: 'Closes today',
    tomorrow: 'Closes tomorrow',
    inDays: (n: number) => `Closes in ${n} days`,
    on: (date: string) => `Closes ${date}`,
    automatic: 'No deadline — considered when you apply',
    reopens: (month: string) => `Expected to open in ${month}`,
    unannounced: 'Next round not announced',
    none: 'No closing date stated',
  },

  tiers: {
    'full-ride': 'Fully funded',
    'full-tuition': 'Full tuition',
    partial: 'Partial tuition',
    fixed: 'Fixed amount',
    stipend: 'Living costs',
    waiver: 'Fee reduction',
    'not-stated': 'Amount not stated',
    percentOfTuition: (n: number) => `${n}% of tuition`,
  },

  bands: {
    'open-to-most': 'Open to most applicants',
    competitive: 'Competitive',
    'highly-selective': 'Highly selective',
  },

  application: {
    automatic: 'No separate application',
    separate: 'Separate application',
    unclear: 'Application route not stated',
  },

  levels: {
    bachelor: 'Bachelor’s',
    master: 'Master’s',
    notStated: 'Level not stated',
  },

  filters: {
    nationality: 'Your nationality',
    nationalityNone: 'Not set — show everything',
    where: 'Where to study',
    whereNote: (total: number) =>
      `Only countries with something open right now are listed. ${total} are indexed in total, and the crawler works through them over about a week.`,
    funding: 'Funding',
    subject: 'Subject',
    deadline: 'Deadline',
    anyTime: 'Any time',
    closingMonth: 'Closing in a month',
    closingQuarter: 'Closing in three months',
    onlyAutomatic: 'No separate application',
    includeSelective: 'Include the highly selective ones',
    yourGrades: 'Your grades',
    gradesHint: 'hides awards asking for more',
  },

  saved: {
    heading: (n: number) => `${n} saved`,
    note:
      'There is no account behind this, so nothing syncs on its own. Back up the file and open it on your phone to carry the list across.',
    emptyTitle: 'Nothing saved yet.',
    emptyBody: 'Save anything worth an application and it will wait here with its deadline.',
    calendar: 'Add deadlines to calendar',
    backup: 'Back up',
    restore: 'Restore',
    noDeadlines: 'None of your saved awards has a stated deadline',
    stageSaved: 'Saved',
    stagePreparing: 'Preparing',
    stageSubmitted: 'Submitted',
    stageOutcome: 'Heard back',
    sentOn: (date: string) => `sent ${date}`,
    closesToday: 'closes today',
    daysLeft: (n: number) => `${n} days left`,
    followUp: 'two weeks with no reply — worth a follow-up',
  },

  upcoming: {
    title: 'Opens later',
    intro:
      'These are closed right now, so they are kept off the main list — but they are real awards on real university pages, and most of them run every year. Where the page says when it reopens, it says so below.',
    named: 'The university has named a month',
    reopensIn: (month: string) => `Expected to reopen in ${month}`,
    unannounced: 'Closed, next round not announced',
    unannouncedBody:
      'No month is claimed for these, because their pages do not name one. Most reopen on the same schedule as last year.',
    none: 'Nothing is closed at the moment — everything in the index is open.',
    loading: 'Reading the closed list…',
  },

  sources: {
    title: 'Where this comes from',
    intro:
      'Every scholarship on this site was read off a page belonging to the institution that awards it, or to the government body that funds it. Nothing is taken from an aggregator, and no link on any card points at one — a URL that is not on a registered institution’s own domain cannot enter the index at all.',
    statOpen: 'Open right now',
    statCountries: 'Countries',
    statListed: 'Institutions listed',
    statChecked: 'Institutions checked',
    crawler:
      'The crawler identifies itself honestly, obeys each site’s robots file and waits between requests. Some universities block it anyway, which is their right — those show below as unreachable rather than being quietly dropped.',
    summary: (withAwards: number, total: number) =>
      `${withAwards} of ${total} checked institutions had something for international students`,
    unreachableCount: (n: number) => `${n} could not be reached`,
    searchPlaceholder: 'Find an institution',
    colInstitution: 'Institution',
    colDomain: 'Domain',
    colListings: 'Listings',
    colChecked: 'Last checked',
    noneFound: 'none found',
    unreachable: 'unreachable',
    movedTo: (domain: string) => `now ${domain}`,
    truncated: (shown: number, total: number) =>
      `Showing the first ${shown} of ${total}. Search to narrow it.`,
    loading: 'Reading the source list…',
  },

  safety: {
    title: 'Avoiding scams',
    intro:
      'This site links only to the pages of the institutions and governments that award the money, which removes one whole category of problem. But you will search elsewhere too, so here is what to look for.',
    ruleTitle: 'The one rule that catches nearly everything',
    ruleBody:
      'If you are asked to pay anything in order to apply for, receive, or release a scholarship, it is not a scholarship. Stop there. You do not need to work out what kind of scam it is.',
    checkTitle: 'How to check something in a minute',
    check1:
      'Find the university’s own website yourself, by typing its name into a search engine — not by following the link you were sent.',
    check2:
      'Look for the scholarship on that site. If it is real, it is on there. If it is not on there, it does not exist.',
    check3:
      'Check the address bar of the page you are actually on. Scam sites copy the branding perfectly and cannot copy the domain.',
    check4:
      'Write to the university’s admissions office from the address on their own contact page and ask. They will tell you, and they are used to the question.',
    closing:
      'None of this is unique to scholarships, and none of it requires you to be suspicious of everything. It requires you to check the domain.',
    flags: [
      {
        title: 'It asks you to pay to apply',
        body: 'No legitimate scholarship charges an application fee, a processing fee, a registration fee or a deposit to "hold" your award. Not one. This single rule catches most of them.',
      },
      {
        title: 'You won something you never applied for',
        body: 'Awards are not given to people who did not apply. An email congratulating you on a scholarship you have never heard of is a way of getting your bank details.',
      },
      {
        title: 'It wants money to release the money',
        body: 'A "transfer fee", "insurance", "clearance", or tax payable up front before your funds can be sent. Real awards are paid to the university or to you, and never require you to send money first.',
      },
      {
        title: 'It guarantees you will win',
        body: 'Nobody can guarantee an outcome that depends on a selection committee. A guarantee is a sales pitch, and you are the product.',
      },
      {
        title: 'The pressure is the point',
        body: 'A deadline in forty-eight hours, an offer that expires today, a place that will go to somebody else by tonight. Urgency is manufactured to stop you checking.',
      },
      {
        title: 'The email address does not match the institution',
        body: 'A university writes to you from its own domain. A message from a free mail account about a university scholarship did not come from that university.',
      },
      {
        title: 'It asks for your passport, bank details or card up front',
        body: 'A scholarship application needs your transcripts and your documents at the point where you are actually offered something, through the institution’s own system. It does not need your card number, ever.',
      },
      {
        title: 'The agent takes a cut',
        body: 'Paid recruitment agents can be legitimate, but an agent who charges you for access to a scholarship that is free to apply for directly is selling you something you already have.',
      },
    ],
  },

  regions: {
    'Britain and Ireland': 'Britain and Ireland',
    'North America': 'North America',
    'Western Europe': 'Western Europe',
    'Northern Europe': 'Northern Europe',
    'Southern Europe': 'Southern Europe',
    'Central and Eastern Europe': 'Central and Eastern Europe',
    'East Asia': 'East Asia',
    Oceania: 'Oceania',
    'Middle East': 'Middle East',
  },


  /** What each faculty covers, so "Computing" is not a guessing game. */

  grades: {
    caveat:
      'These equivalences are approximate. No official universal conversion exists, universities publish their own tables, and a borderline case is decided by an admissions office rather than by arithmetic.',
    first: 'First class',
    firstNote: '70% and above',
    upperSecond: '2:1 (upper second)',
    upperSecondNote: '60–69%',
    lowerSecond: '2:2 (lower second)',
    lowerSecondNote: '50–59%',
    third: 'Third class',
    thirdNote: '40–49%',
    pass: 'Pass',
    fromGpa: (gpa: string, percent: number, cls: string) =>
      `GPA ${gpa} — about ${percent}%, a ${cls.toLowerCase()}`,
    fromPercent: (percent: number, gpa: string, cls: string) =>
      `${percent}% — about GPA ${gpa}, a ${cls.toLowerCase()}`,
    fromClass: (cls: string, percent: number, gpa: string) =>
      `${cls} — about ${percent}%, GPA ${gpa}`,
  },

  fieldExamples: {
    computing: ['computer science', 'artificial intelligence', 'data science', 'cyber security', 'software engineering'],
    engineering: ['mechanical', 'electrical', 'civil', 'chemical', 'aerospace'],
    business: ['management', 'finance', 'accounting', 'economics', 'marketing'],
    medicine: ['medicine', 'nursing', 'pharmacy', 'dentistry', 'public health'],
    sciences: ['physics', 'chemistry', 'biology', 'mathematics', 'biotechnology'],
    law: ['law', 'international law', 'human rights', 'criminology'],
    arts: ['architecture', 'graphic design', 'music', 'film', 'fashion'],
    humanities: ['history', 'philosophy', 'literature', 'languages', 'linguistics'],
    'social-sciences': ['psychology', 'politics', 'international relations', 'sociology', 'social work'],
    education: ['teaching', 'teacher training', 'early childhood', 'special education'],
    agriculture: ['agronomy', 'food science', 'forestry', 'animal science'],
    environment: ['environmental science', 'sustainability', 'climate', 'renewable energy'],
  },

  fields: {
    computing: 'Computing',
    engineering: 'Engineering',
    business: 'Business',
    medicine: 'Medicine and health',
    sciences: 'Sciences',
    law: 'Law',
    arts: 'Arts and design',
    humanities: 'Humanities',
    'social-sciences': 'Social sciences',
    education: 'Education',
    agriculture: 'Agriculture',
    environment: 'Environment',
  },
}

export type Dictionary = typeof en
