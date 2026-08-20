/**
 * The words this project runs on.
 *
 * Two jobs. First, recognising that a URL is worth fetching at all, out of the
 * hundred thousand a large university publishes. Second, reading the facts off
 * the page once we have it — how much, by when, for whom — in whichever
 * language the page happens to be written in.
 *
 * The second job is why a page in Chinese or Hungarian is not a dead end. The
 * facts a card needs are not prose: they are amounts, dates, levels and a small
 * recurring set of terms. Those we can read directly, and present in English,
 * so somebody deciding whether a scholarship is worth their evening never has
 * to fight a language barrier to find out.
 */

/** URL fragments that mark a page as worth looking at. Matched against the path. */
export const URL_HINTS = [
  // English
  'scholarship', 'scholarships', 'bursary', 'bursaries', 'financial-aid',
  'financialaid', 'fees-and-funding', 'fees-funding', 'tuition-fees',
  'funding', 'grants', 'awards', 'fee-waiver', 'fee-reduction', 'studentfinance',
  'student-finance', 'money', 'affordability', 'cost-aid', 'aid',
  // German
  'stipendium', 'stipendien', 'studienfinanzierung', 'foerderung', 'erlass',
  // French
  'bourse', 'bourses', 'aide-financiere', 'exoneration',
  // Dutch
  'beurs', 'beurzen', 'studiebeurs', 'collegegeld',
  // Italian
  'borsa-di-studio', 'borse', 'borsedistudio', 'agevolazioni', 'esonero', 'diritto-allo-studio',
  // Spanish / Portuguese
  'beca', 'becas', 'ayudas', 'exencion', 'convocatoria', 'bolsa', 'bolsas',
  // Polish
  'stypendium', 'stypendia', 'stypendialny', 'czesne',
  // Hungarian
  'osztondij', 'osztondijak', 'penzugyek', 'palyazat',
  // Turkish
  'burs', 'burslar', 'ogrenim-ucreti',
  // Nordic
  'stipendier', 'stipend', 'apuraha', 'stipendi', 'studieavgift', 'legat',
  // Chinese, Japanese, Korean (percent-encoded and literal both appear in URLs)
  'jiangxuejin', 'jxj', 'scholarship-cn', '奖学金', '獎學金', '奨学金', '장학금',
  // Romanian / Czech / Slovak / Greek
  'bursa', 'burse', 'stipendia', 'stipendijne', 'ypotrofies',
]

/**
 * Paths that use one of the words above but never carry an award a student can
 * apply for. Cheap to exclude here, expensive to filter out later.
 */
export const URL_BLOCKERS = [
  '/news', '/press', '/blog', '/events', '/event/', '/calendar',
  '/staff', '/employee', '/hr/', '/jobs', '/vacanc', '/recruit', '/career',
  '/alumni', '/giving', '/donate', '/donor', '/support-us', '/fundraising',
  '/library', '/archive', '/gallery', '/photo', '/video',
  '/phd', '/doctoral', '/doctorate', '/postdoc', '/fellowship-programme',
  '/research-grants', '/grant-writing', '/erc-', '/tender', '/procurement',
  '/login', '/signin', '/account', '/basket', '/cart', '/search',
  '.jpg', '.png', '.gif', '.zip', '.doc', '.xls', '.ppt', '.mp4',
]

/**
 * Per-language terms for reading facts off a page.
 *
 * `mark` is what makes a page a scholarship page at all; the rest are the
 * fields on the card. Terms are matched case-insensitively as substrings, so
 * inflected forms want their stem here rather than every ending.
 */
export const LANGS = {
  en: {
    name: 'English',
    mark: ['scholarship', 'bursary', 'bursaries', 'financial aid', 'fee waiver', 'grant'],
    tuition: ['tuition', 'tuition fee', 'course fee', 'fees'],
    deadline: ['deadline', 'closing date', 'applications close', 'apply by', 'application period'],
    full: ['full scholarship', 'fully funded', 'full tuition', 'covers the full', 'full fee'],
    partial: ['partial', 'part-funded', 'contribution towards', 'reduction', 'discount'],
    waiver: ['fee waiver', 'tuition waiver', 'fee reduction', 'exemption', 'waived'],
    stipend: ['stipend', 'living costs', 'maintenance', 'monthly allowance', 'living allowance'],
    bachelor: ['undergraduate', 'bachelor', 'first degree', 'freshman', 'foundation year'],
    master: ["master's", 'masters', 'postgraduate taught', 'msc', 'graduate programme'],
    intl: ['international student', 'overseas student', 'non-eu', 'international applicant'],
  },
  de: {
    name: 'German',
    mark: ['stipendium', 'stipendien', 'studienfinanzierung', 'erlass', 'förderung', 'beihilfe'],
    tuition: ['studiengebühren', 'semesterbeitrag', 'gebühren'],
    deadline: ['bewerbungsfrist', 'antragsfrist', 'bewerbungszeitraum', 'einsendeschluss'],
    full: ['vollstipendium'],
    partial: ['teilstipendium', 'teilerlass'],
    waiver: ['gebührenerlass', 'befreiung', 'erlass'],
    stipend: ['lebenshaltungskosten', 'lebensunterhalt', 'monatliche rate', 'monatlich'],
    bachelor: ['bachelor', 'grundständig'],
    master: ['master', 'weiterführend'],
    intl: ['internationale studierende', 'ausländische studierende', 'bildungsausländer', 'nicht-eu'],
  },
  fr: {
    name: 'French',
    mark: ['bourse', 'bourses', 'aide financière', 'exonération'],
    tuition: ['frais de scolarité', "frais d'inscription", "droits d'inscription"],
    deadline: ['date limite', 'clôture', 'échéance', 'candidature avant'],
    full: ['bourse complète'],
    partial: ['bourse partielle', 'exonération partielle'],
    waiver: ['exonération'],
    stipend: ['allocation mensuelle', 'coût de la vie'],
    bachelor: ['licence'],
    master: ['master'],
    intl: ['étudiants internationaux', 'étudiants étrangers'],
  },
  nl: {
    name: 'Dutch',
    mark: ['beurs', 'beurzen', 'studiebeurs', 'toelage'],
    tuition: ['collegegeld', 'instellingscollegegeld'],
    deadline: ['deadline', 'uiterste datum', 'aanmelddeadline'],
    full: ['volledige beurs'],
    partial: ['gedeeltelijke beurs', 'korting op collegegeld'],
    waiver: ['vrijstelling'],
    stipend: ['levensonderhoud', 'maandelijkse toelage'],
    bachelor: ['bachelor'],
    master: ['master'],
    intl: ['internationale studenten', 'niet-eer'],
  },
  it: {
    name: 'Italian',
    mark: ['borsa di studio', 'borse di studio', 'agevolazioni', 'esonero', 'diritto allo studio'],
    tuition: ['tasse universitarie', 'contributi', 'tassa regionale'],
    deadline: ['scadenza', 'termine', 'bando'],
    full: ['esonero totale', 'borsa totale'],
    partial: ['esonero parziale', 'parziale'],
    waiver: ['esonero'],
    stipend: ['importo mensile', 'costo della vita', 'fuori sede', 'pendolare', 'in sede'],
    bachelor: ['laurea triennale'],
    master: ['laurea magistrale'],
    intl: ['studenti internazionali', 'studenti stranieri'],
  },
  es: {
    name: 'Spanish',
    mark: ['beca', 'becas', 'ayuda', 'ayudas', 'exención', 'convocatoria'],
    tuition: ['matrícula', 'tasas académicas', 'precios públicos'],
    deadline: ['plazo de solicitud', 'fecha límite', 'convocatoria abierta'],
    full: ['beca completa'],
    partial: ['beca parcial', 'exención de matrícula'],
    waiver: ['exención'],
    stipend: ['ayuda mensual', 'manutención', 'coste de vida'],
    bachelor: ['grado'],
    master: ['máster'],
    intl: ['estudiantes internacionales', 'estudiantes extranjeros'],
  },
  pl: {
    name: 'Polish',
    mark: ['stypendium', 'stypendia', 'program stypendialny', 'nabór'],
    tuition: ['czesne', 'opłaty za studia'],
    deadline: ['termin składania wniosków', 'nabór wniosków'],
    full: ['pełne stypendium'],
    partial: ['częściowe', 'zwolnienie z czesnego'],
    waiver: ['zwolnienie z czesnego'],
    stipend: ['koszty utrzymania', 'stypendium miesięczne'],
    bachelor: ['studia licencjackie', 'i stopnia'],
    master: ['studia magisterskie', 'ii stopnia'],
    intl: ['studenci zagraniczni', 'cudzoziemcy'],
  },
  hu: {
    name: 'Hungarian',
    mark: ['ösztöndíj', 'ösztöndíjak', 'pályázat'],
    tuition: ['tandíj', 'költségtérítés'],
    deadline: ['jelentkezési határidő', 'pályázati határidő'],
    full: ['teljes ösztöndíj', 'tandíjmentesség'],
    partial: ['részleges'],
    waiver: ['tandíjmentesség'],
    stipend: ['havi ösztöndíj', 'megélhetési költségek', 'lakhatási támogatás'],
    bachelor: ['alapképzés'],
    master: ['mesterképzés', 'osztatlan'],
    intl: ['nemzetközi hallgatók', 'külföldi hallgatók'],
  },
  tr: {
    name: 'Turkish',
    mark: ['burs', 'burslar', 'öğrenci bursu'],
    tuition: ['öğrenim ücreti', 'harç'],
    deadline: ['son başvuru tarihi', 'başvuru takvimi'],
    full: ['tam burs'],
    partial: ['kısmi burs', 'burs indirimi'],
    waiver: ['ücret muafiyeti'],
    stipend: ['aylık burs', 'yaşam gideri', 'barınma'],
    bachelor: ['lisans', 'ön lisans'],
    master: ['yüksek lisans'],
    intl: ['uluslararası öğrenciler', 'yabancı uyruklu'],
  },
  zh: {
    name: 'Chinese',
    mark: ['奖学金', '獎學金', '资助', '助学金'],
    tuition: ['学费', '學費', '学杂费', '學雜費'],
    deadline: ['申请截止日期', '截止日期', '申请期限', '報名截止'],
    full: ['全额奖学金', '全額獎學金', '全免', '全额'],
    partial: ['部分奖学金', '部分獎學金', '半免', '部分'],
    waiver: ['免学费', '免學費', '学费减免', '學費減免', '减免'],
    stipend: ['生活费', '生活補助', '生活补贴', '每月生活费', '住宿费', '综合医疗保险'],
    bachelor: ['本科生', '本科', '学士班', '學士班'],
    master: ['硕士研究生', '硕士', '碩士班', '研究生'],
    intl: ['留学生', '来华留学生', '国际学生', '外國學生', '境外生'],
    extras: {
      prospectus: ['招生简章'],
      eligibility: ['申请条件'],
      coverage: ['资助内容及标准'],
      renewal: ['年度评审', '年度审核', '续期'],
      language: ['汉语水平考试', 'hsk'],
    },
  },
  ja: {
    name: 'Japanese',
    mark: ['奨学金', '給付奨学金'],
    tuition: ['授業料', '入学料'],
    deadline: ['締切', '応募期限', '出願'],
    full: ['全額免除'],
    partial: ['半額免除', '3割免除', '減免'],
    waiver: ['授業料免除', '授業料減免', '入学料免除', '徴収猶予'],
    stipend: ['月額', '学習奨励費'],
    bachelor: ['学部'],
    master: ['大学院', '修士課程'],
    intl: ['私費外国人留学生', '留学生'],
  },
  ko: {
    name: 'Korean',
    mark: ['장학금'],
    tuition: ['등록금', '수업료', '입학금'],
    deadline: ['지원 마감', '모집요강'],
    full: ['전액장학금'],
    partial: ['부분장학금', '감면'],
    waiver: ['면제', '감면'],
    stipend: ['월 생활비'],
    bachelor: ['학사'],
    master: ['석사'],
    intl: ['외국인 유학생', '국제 학생'],
  },
  sv: {
    name: 'Swedish',
    mark: ['stipendium', 'stipendier'],
    tuition: ['studieavgift'],
    deadline: ['sista ansökningsdag'],
    full: ['helt stipendium'],
    partial: ['partiellt', 'avgiftsbefrielse'],
    waiver: ['avgiftsbefrielse'],
    stipend: ['levnadskostnader'],
    bachelor: ['kandidatprogram'],
    master: ['masterprogram'],
    intl: ['internationella studenter'],
  },
}

/** Language codes in the order a page should be tested against them. */
export const LANG_ORDER = ['en', 'zh', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'hu', 'tr', 'ja', 'ko', 'sv']

const CJK = /[぀-ヿ㐀-鿿豈-﫿가-힯]/

const matcherCache = new Map()

/**
 * Whole-word matching, which for this vocabulary is not a nicety.
 *
 * Turkish for scholarship is `burs`, and a plain substring test finds it inside
 * the English word "bursary" — which quietly relabelled every British funding
 * page in the index as Turkish, and would have sent their facts through the
 * wrong extractor. Chinese, Japanese and Korean have no word boundaries to
 * respect, so those fall back to a substring test as before.
 */
export function hasTerm(text, term) {
  if (CJK.test(term)) return text.includes(term)
  let re = matcherCache.get(term)
  if (!re) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    re = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu')
    matcherCache.set(term, re)
  }
  return re.test(text)
}

/**
 * Which language a page is written in, judged by which vocabulary it answers
 * to. English is checked last on purpose: an English word appearing on a
 * Hungarian page proves nothing, while `ösztöndíj` appearing anywhere is
 * decisive.
 */
export function detectLang(text) {
  const hay = text.toLowerCase()
  const englishWeight = LANGS.en.mark.reduce((n, t) => n + (hasTerm(hay, t) ? 1 : 0), 0)

  let best = 'en'
  let bestScore = 0
  for (const code of LANG_ORDER) {
    if (code === 'en') continue
    const v = LANGS[code]
    let score = 0
    for (const term of v.mark) if (hasTerm(hay, term)) score += 3
    for (const term of [...v.tuition, ...v.deadline]) if (hasTerm(hay, term)) score += 1
    if (score > bestScore) {
      bestScore = score
      best = code
    }
  }
  // A page has to look more like the other language than it does like English
  // before we treat it as one. Pages that mix the two are common — an English
  // summary above a native-language table — and English is the safer reading.
  return bestScore >= 4 && bestScore > englishWeight * 2 ? best : 'en'
}

/**
 * decodeURIComponent, without the exception.
 *
 * A single malformed percent-escape anywhere in a university's markup — a stray
 * "%" in a link, which is common enough — throws "URI malformed" and, before
 * this, took the whole institution down with it. The undecoded string is a
 * perfectly good thing to match against; losing the institution is not.
 */
export function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return String(value)
  }
}

/** Does this URL look like it could hold an award? */
export function urlLooksRelevant(url) {
  let pathname
  try {
    const u = new URL(url)
    pathname = safeDecode(u.pathname + u.search).toLowerCase()
  } catch {
    return false
  }
  if (URL_BLOCKERS.some((b) => pathname.includes(b))) return false
  return URL_HINTS.some((h) => pathname.includes(h))
}

/** Does the body of this page talk about scholarships in any language we read? */
export function pageLooksRelevant(text) {
  const hay = text.toLowerCase()
  for (const code of LANG_ORDER) {
    for (const term of LANGS[code].mark) {
      if (hasTerm(hay, term)) return true
    }
  }
  return false
}
