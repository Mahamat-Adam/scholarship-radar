import type { Dictionary } from './en'

/**
 * The Arabic copy.
 *
 * Written for Arabic readers rather than translated across from the English.
 * Several strings are deliberately not parallel: English idiom that lands flat
 * in Arabic has been replaced with the nearest thing an Arabic speaker would
 * actually say, and a few sentences are shorter here because Arabic carries the
 * same meaning in fewer words.
 *
 * Numbers stay in Western digits. Arabic-Indic digits are correct in prose but
 * this site is full of GPAs, percentages and currency, and mixing the two makes
 * a page harder to read rather than more authentic — Arabic technical interfaces
 * overwhelmingly use Western digits for the same reason.
 *
 * What is NOT translated: the name of an award, and the sentence quoted from the
 * page it came from. Those are the institution's own words. Producing an Arabic
 * version of a sentence a university never wrote would be inventing evidence,
 * which is the one thing this project cannot do.
 */

/**
 * Arabic counts its nouns in five different ways depending on the number, and
 * getting it wrong is the clearest possible sign that a page was machine
 * translated. One award is منحة واحدة, two are منحتان, three to ten take the
 * plural منح, and eleven upwards return to the singular.
 */
function awards(n: number): string {
  if (n === 1) return 'منحة واحدة'
  if (n === 2) return 'منحتان'
  if (n >= 3 && n <= 10) return `${n} منح`
  return `${n} منحة`
}

function days(n: number): string {
  if (n === 1) return 'يوم واحد'
  if (n === 2) return 'يومان'
  if (n >= 3 && n <= 10) return `${n} أيام`
  return `${n} يومًا`
}

function weeks(n: number): string {
  if (n === 1) return 'أسبوع'
  if (n === 2) return 'أسبوعين'
  if (n >= 3 && n <= 10) return `${n} أسابيع`
  return `${n} أسبوعًا`
}

export const ar: Dictionary = {
  dir: 'rtl' as never,
  locale: 'ar',
  name: 'العربية',

  brand: 'رادار المنح',
  tagline: 'كل رابط يقودك إلى موقع الجهة المانحة نفسها',

  nav: {
    find: 'ابحث لي',
    browse: 'تصفّح',
    saved: 'المحفوظة',
    upcoming: 'تُفتح لاحقًا',
    sources: 'مصادر البيانات',
    safety: 'تجنّب الاحتيال',
  },

  common: {
    open: 'مفتوحة',
    countries: 'دولة',
    loading: 'جارٍ قراءة الفهرس…',
    loadFailed: 'تعذّر تحميل الفهرس.',
    show: 'اعرضها',
    clear: 'مسح',
    notSet: 'غير محدّد',
    everywhere: 'كل الوجهات',
    moreFilters: 'خيارات تصفية أخرى',
    countriesPicked: (n: number) =>
      n === 1 ? 'دولة واحدة' : n === 2 ? 'دولتان' : n <= 10 ? `${n} دول` : `${n} دولة`,
    search: 'ابحث باسم المنحة أو الجامعة أو التخصّص',
    footerPrivacy:
      'بلا حساب، وبلا تتبّع، وبلا رفع أي ملف. كل ما تحفظه يبقى داخل هذا المتصفّح وحده.',
    builtOn: (date: string, checked: string) => `حُدّث الفهرس في ${date} · فُحصت ${checked} مؤسسة`,
    language: 'اللغة',
    thanks: 'شكرًا لمرورك الكريم، نوّرتنا.',
    rights: (year: number) => `© ${year} محمد آدم. جميع الحقوق محفوظة.`,
  },

  find: {
    badge: 'ستة أسئلة، بلا حساب، وبلا رفع أي ملف',
    title: 'عرّفنا بنفسك.',
    intro:
      'كل الأسئلة اختيارية عدا الأول، وكل سؤال تتخطّاه يوسّع دائرة البحث بدل أن يضيّقها عليك.',
    levelQ: 'ما المرحلة التي تريد دراستها؟',
    bachelor: 'بكالوريوس',
    master: 'ماجستير',
    nationalityQ: 'ما الجنسية التي تحملها؟',
    nationalityHelp:
      'كثير من أفضل المنح تمويلًا مفتوح لجنسيات بعينها دون غيرها. تحديد جنسيتك هنا يستبعد ما لا ينطبق عليك، بدل أن تكتشف ذلك بعد أن تبدأ استمارة التقديم.',
    nationalitySkip: 'أفضّل ألّا أحدّد — أرني كل شيء',
    whereQ: 'أين تودّ الدراسة؟',
    whereHelp: 'اختر ما شئت من الدول، أو لا تختر شيئًا لترى كل الوجهات.',
    subjectQ: 'ماذا تريد أن تدرس؟',
    subjectHelp:
      'مصنّفة حسب الكلية، فهكذا تُصاغ شروط المنح عادةً — وقلّما تُخصَّص منحة لتخصّص واحد بعينه. أما المنح التي لا تذكر تخصّصًا أصلًا فتبقى في القائمة مهما اخترت هنا.',
    subjectSearch: 'اكتب تخصّصك — علوم حاسوب، تمريض، ذكاء اصطناعي…',
    subjectNoMatch:
      'لا يوجد ما يطابق ذلك. اترك الحقل فارغًا فلن تستبعد تصفية التخصّص شيئًا.',
    subjectAdd: (label: string) => `أضف ${label}`,
    coverQ: 'ما القدر الذي تحتاج إلى تغطيته؟',
    coverHelp:
      'ممّا يجدر أن تعرفه: المنح التي يفوز بها المتقدّم العادي غالبًا جزئية لا كاملة، واشتراط التغطية الكاملة يضيّق القائمة كثيرًا.',
    coverAll: 'تغطية كاملة',
    coverAllHint: 'الرسوم والمعيشة وغالبًا تذاكر السفر',
    coverTuition: 'الرسوم الدراسية كاملة على الأقل',
    coverTuitionHint: 'الرسوم مدفوعة بالكامل',
    coverAny: 'أي مساعدة مهما كانت',
    coverAnyHint: 'تشمل المنح الجزئية وخصومات الرسوم',
    gradesQ: 'ما مستوى درجاتك تقريبًا؟',
    gradesHelp:
      'تُستخدم فقط لإخفاء المنح التي يفوق حدّها المعلن مستواك. لا تُصنّفك، ولا تغادر متصفّحك.',
    scaleGpa: 'المعدل من 4',
    scalePercent: 'نسبة مئوية',
    scaleClass: 'التصنيف البريطاني',
    gradesNotSet: 'غير محدّد — لن يُخفى شيء.',
    ratherNotSay: 'أفضّل ألّا أحدّد',
    submit: 'اعرض ما يمكنني التقديم عليه',
  },

  results: {
    count: (n: number) => awards(n),
    confirmed: (dated: number, undated: number) =>
      undated === 0
        ? 'جميعها تذكر موعدًا نهائيًا، ونراجعه كل يوم.'
        : `${dated} منها تذكر موعدًا نهائيًا نراجعه كل يوم، أما البقية وعددها ${undated} فلا تنشر موعدًا أصلًا. وبطاقاتها تقول ذلك، فلا ندّعي أنها ما زالت مفتوحة.`,
    hiddenTitle: 'ما لم يُعرض، وسببه:',
    emptyTitle: 'لا شيء يطابق كل هذه الشروط.',
    emptyBody:
      'الأسطر أعلاه تبيّن ما استبعده كل شرط، وغالبًا ما يكفي أن ترفع الشرط الذي استبعد أكبر عدد.',
    horizonTitle: (n: string) => `المنح المفتوحة (${n})، مرتّبة حسب الوقت المتبقّي`,
    horizonHint: 'أقرب المواعيد في المقدّمة. اسحب لترى ما بعدها.',
    legendWeek: 'يُغلق خلال أسبوع',
    legendMonth: 'خلال شهر',
    legendQuarter: 'خلال ثلاثة أشهر',
    legendLater: 'لاحقًا، أو بلا موعد محدّد',
    legendBand:
      'الصف السفلي يضمّ المنح التي لا تحمل موعدًا نهائيًا — يُنظر فيها تلقائيًا عند تقدّمك بطلب الالتحاق.',
  },

  reasons: {
    level: 'مرحلة دراسية مختلفة',
    nationality: 'غير متاحة لجنسيتك',
    country: 'دولة لم تخترها',
    field: 'تخصّص مختلف',
    tier: 'نوع تمويل مختلف',
    selective: 'موجّهة لمتقدّمين استثنائيين',
    automatic: 'تحتاج طلبًا منفصلًا',
    grades: 'تشترط درجات أعلى ممّا أدخلت',
    deadline: 'موعدها خارج المدة التي اخترتها',
    query: 'لا تطابق بحثك',
  },

  card: {
    read: 'اقرأها في موقع الجهة',
    save: 'احفظ',
    saved: 'محفوظة',
    showEvidence: 'اعرض ما تقوله الصفحة',
    hideEvidence: 'أخفِ ما تقوله الصفحة',
    new: 'جديدة',
    programme: 'برنامج حكومي',
    noSeparate: 'دون طلب منفصل',
    available: (n: number) => `المتاح: ${n}`,
    renewable: 'قابلة للتجديد',
    limited: 'مدّة محدودة',
    onlyFrom: (list: string, more: boolean) =>
      `متاحة فقط للمتقدّمين من ${list}${more ? ' وغيرها' : ''}.`,
    foreignPage: (language: string) =>
      `الصفحة الرسمية مكتوبة باللغة ${language}، والتفاصيل أعلاه مستخرجة منها.`,
    hostedPortal: (institution: string, portal: string) =>
      `تدير ${institution} منحها عبر ${portal}. الصفحة تخصّها هي، مستضافة هناك — لا طرف ثالث يعيد نشرها.`,
    checkedToday: 'تم التحقق اليوم',
    checkedYesterday: 'تم التحقق أمس',
    checkedDays: (n: number) => `تم التحقق قبل ${n === 2 ? 'يومين' : days(n)}`,
    checkedLastWeek: 'تم التحقق الأسبوع الماضي',
    checkedWeeks: (n: number) => `تم التحقق قبل ${weeks(n)}`,
  },

  deadline: {
    today: 'يُغلق التقديم اليوم',
    tomorrow: 'يُغلق التقديم غدًا',
    inDays: (n: number) => `يُغلق التقديم بعد ${n === 2 ? 'يومين' : days(n)}`,
    on: (date: string) => `يُغلق التقديم في ${date}`,
    automatic: 'بلا موعد نهائي — يُنظر فيها عند تقدّمك بطلب الالتحاق',
    reopens: (month: string) => `يُتوقّع فتحها في ${month}`,
    unannounced: 'لم تُعلن الدورة القادمة بعد',
    none: 'لا يذكر الموقع موعدًا نهائيًا',
  },

  tiers: {
    'full-ride': 'منحة كاملة',
    'full-tuition': 'الرسوم الدراسية كاملة',
    partial: 'تغطية جزئية للرسوم',
    fixed: 'مبلغ محدّد',
    stipend: 'نفقات المعيشة',
    waiver: 'خصم على الرسوم',
    'not-stated': 'القيمة غير مذكورة',
    percentOfTuition: (n: number) => `${n}% من الرسوم`,
  },

  bands: {
    'open-to-most': 'متاحة لمعظم المتقدّمين',
    competitive: 'تنافسية',
    'highly-selective': 'شديدة الانتقاء',
  },

  application: {
    automatic: 'دون طلب منفصل',
    separate: 'تحتاج طلبًا منفصلًا',
    unclear: 'طريقة التقديم غير مذكورة',
  },

  levels: {
    bachelor: 'بكالوريوس',
    master: 'ماجستير',
    notStated: 'المرحلة غير مذكورة',
  },

  filters: {
    nationality: 'جنسيتك',
    nationalityNone: 'غير محدّدة — اعرض كل شيء',
    where: 'وجهة الدراسة',
    whereNote: (total: number) =>
      `لا تظهر هنا إلا الدول التي بها منح مفتوحة الآن. الفهرس يشمل ${total} دولة، وتمرّ عليها أداة البحث خلال أسبوع تقريبًا.`,
    funding: 'التمويل',
    subject: 'التخصّص',
    deadline: 'الموعد النهائي',
    anyTime: 'أي وقت',
    closingMonth: 'يُغلق خلال شهر',
    closingQuarter: 'يُغلق خلال ثلاثة أشهر',
    onlyAutomatic: 'دون طلب منفصل',
    includeSelective: 'أدرِج المنح شديدة الانتقاء',
    yourGrades: 'درجاتك',
    gradesHint: 'تُخفي المنح التي تشترط درجات أعلى',
  },

  saved: {
    heading: (n: number) =>
      n === 0 ? 'لا شيء محفوظ' : n === 2 ? 'منحتان محفوظتان' : `${awards(n)} محفوظة`,
    note:
      'لا يوجد حساب خلف هذا الموقع، فلا شيء يُزامَن تلقائيًا. نزّل ملف النسخة الاحتياطية وافتحه على هاتفك لتنقل قائمتك معك.',
    emptyTitle: 'لم تحفظ شيئًا بعد.',
    emptyBody: 'احفظ ما يستحق التقديم عليه وسينتظرك هنا مع موعده النهائي.',
    calendar: 'أضف المواعيد إلى التقويم',
    backup: 'نسخة احتياطية',
    restore: 'استعادة',
    noDeadlines: 'لا تحمل أي من منحك المحفوظة موعدًا نهائيًا معلنًا',
    stageSaved: 'محفوظة',
    stagePreparing: 'قيد التحضير',
    stageSubmitted: 'قُدّمت',
    stageOutcome: 'وصل الرد',
    sentOn: (date: string) => `قُدّمت في ${date}`,
    closesToday: 'يُغلق اليوم',
    daysLeft: (n: number) => `بقي ${days(n)}`,
    followUp: 'مضى أسبوعان بلا رد — يستحق متابعة',
  },

  upcoming: {
    title: 'تُفتح لاحقًا',
    intro:
      'هذه المنح مغلقة الآن، ولهذا لا تظهر في القائمة الرئيسية — لكنها منح حقيقية على صفحات جامعات حقيقية، ومعظمها يتكرّر كل عام. وحين تذكر الصفحة موعد إعادة الفتح، تجده مكتوبًا أدناه.',
    named: 'الجامعة حدّدت الشهر',
    reopensIn: (month: string) => `يُتوقّع فتحها في ${month}`,
    unannounced: 'مغلقة، ولم تُعلن الدورة القادمة',
    unannouncedBody:
      'لا ندّعي شهرًا لهذه المنح، لأن صفحاتها لا تذكر شهرًا. ومعظمها يُفتح عادةً في الموعد نفسه الذي فُتح فيه العام الماضي.',
    none: 'لا شيء مغلق حاليًا — كل ما في الفهرس مفتوح.',
    loading: 'جارٍ قراءة قائمة المنح المغلقة…',
  },

  sources: {
    title: 'مصادر البيانات',
    intro:
      'كل منحة في هذا الموقع قُرئت من صفحة تخصّ المؤسسة المانحة نفسها، أو الجهة الحكومية التي تموّلها. لا شيء مأخوذ من المواقع الوسيطة، ولا يقود أي رابط في أي بطاقة إلى واحد منها — فأي رابط خارج نطاقات المؤسسات المسجّلة لا يدخل الفهرس أصلًا.',
    statOpen: 'مفتوحة الآن',
    statCountries: 'الدول',
    statListed: 'مؤسسات مدرجة',
    statChecked: 'مؤسسات فُحصت',
    crawler:
      'تُعرِّف أداة البحث بنفسها صراحةً، وتلتزم بملف robots في كل موقع، وتنتظر بين طلب وآخر. ومع ذلك تحجبها بعض الجامعات، وهذا حقّها — فتظهر هنا ضمن ما تعذّر الوصول إليه بدل أن تُحذف بصمت.',
    summary: (withAwards: number, total: number) =>
      `من أصل ${total} مؤسسة فُحصت، لدى ${withAwards} منها ما يخصّ الطلاب الدوليين`,
    unreachableCount: (n: number) => `تعذّر الوصول إلى ${n} منها`,
    searchPlaceholder: 'ابحث عن مؤسسة',
    colInstitution: 'المؤسسة',
    colDomain: 'النطاق',
    colListings: 'المنح',
    colChecked: 'آخر فحص',
    noneFound: 'لم يُعثر على شيء',
    unreachable: 'تعذّر الوصول',
    movedTo: (domain: string) => `الآن ${domain}`,
    truncated: (shown: number, total: number) =>
      `تُعرض أول ${shown} من ${total}. استخدم البحث لتضييق القائمة.`,
    loading: 'جارٍ قراءة قائمة المصادر…',
  },

  safety: {
    title: 'تجنّب الاحتيال',
    intro:
      'روابط هذا الموقع لا تقودك إلا إلى صفحات الجامعات والجهات الحكومية المانحة نفسها، وهذا وحده يجنّبك صنفًا كاملًا من المتاعب. لكنك ستبحث في أماكن أخرى أيضًا، وهذه علامات تستحق الانتباه.',
    ruleTitle: 'قاعدة واحدة تكشف معظم عمليات الاحتيال',
    ruleBody:
      'إن طُلب منك دفع أي مبلغ لتتقدّم لمنحة، أو لتستلمها، أو ليُفرَج عن أموالها، فهي ليست منحة. توقّف عند هذا الحدّ، ولا حاجة بك إلى أن تعرف نوع الاحتيال.',
    checkTitle: 'كيف تتحقّق في دقيقة',
    check1:
      'ابحث عن موقع الجامعة بنفسك، بكتابة اسمها في محرّك البحث — لا بالنقر على الرابط الذي وصلك.',
    check2:
      'ابحث عن المنحة داخل ذلك الموقع. إن كانت حقيقية فستجدها فيه. وإن لم تكن فيه، فهي غير موجودة.',
    check3:
      'انظر إلى شريط العنوان في الصفحة التي أنت فيها فعلًا. مواقع الاحتيال تنسخ الشكل نسخًا متقنًا، ولا تستطيع نسخ النطاق.',
    check4:
      'راسل مكتب القبول في الجامعة على العنوان المدرج في صفحة التواصل بموقعها واسأل. سيردّون عليك، فهم معتادون على هذا السؤال.',
    closing:
      'هذا كلّه لا يخصّ المنح وحدها، وليس المطلوب منك أن تشكّ في كل شيء؛ المطلوب أن تتحقّق من النطاق.',
    flags: [
      {
        title: 'تطلب منك الدفع مقابل التقديم',
        body: 'لا توجد منحة نظامية تفرض رسم تقديم، أو رسم معالجة، أو رسم تسجيل، أو عربونًا «لحجز» المنحة. ولا واحدة. هذه القاعدة وحدها تكشف معظم عمليات الاحتيال.',
      },
      {
        title: 'ربحت شيئًا لم تتقدّم له أصلًا',
        body: 'المنح لا تُعطى لمن لم يتقدّم. ورسالة تهنّئك بمنحة لم تسمع بها من قبل هي وسيلة للوصول إلى بياناتك البنكية.',
      },
      {
        title: 'تطلب مالًا للإفراج عن المال',
        body: '«رسوم تحويل» أو «تأمين» أو «تخليص» أو ضريبة تُدفع مقدّمًا قبل أن تصلك أموالك. المنح الحقيقية تُصرف للجامعة أو لك مباشرة، ولا يُطلب منك فيها أبدًا أن ترسل مالًا أولًا.',
      },
      {
        title: 'تضمن لك الفوز',
        body: 'لا أحد يضمن نتيجة تقرّرها لجنة اختيار. الضمان عرض تسويقي، وأنت السلعة فيه.',
      },
      {
        title: 'الاستعجال هو الهدف',
        body: 'موعد نهائي بعد ثمانٍ وأربعين ساعة، أو عرض ينتهي اليوم، أو مقعد سيذهب إلى غيرك الليلة. الاستعجال مفتعل ليمنعك من التحقّق.',
      },
      {
        title: 'عنوان المرسل لا يخصّ المؤسسة',
        body: 'الجامعة تراسلك من نطاقها هي. وإذا وصلتك رسالة عن منحة جامعية من بريد مجاني، فهي لم تأتِ من تلك الجامعة.',
      },
      {
        title: 'تطلب جواز سفرك أو بياناتك البنكية مقدّمًا',
        body: 'طلب المنحة يحتاج إلى كشف درجاتك ووثائقك عند مرحلة العرض الفعلي، ومن خلال نظام المؤسسة نفسها. أما رقم بطاقتك فلا يُطلب منك بحال من الأحوال.',
      },
      {
        title: 'الوسيط يأخذ حصّة',
        body: 'قد تكون مكاتب القبول الجامعي نظامية، لكنّ الوكيل الذي يتقاضى منك أجرًا مقابل منحة تستطيع التقديم عليها بنفسك مجانًا إنما يبيعك شيئًا تملكه أصلًا.',
      },
    ],
  },

  regions: {
    'Britain and Ireland': 'بريطانيا وأيرلندا',
    'North America': 'أمريكا الشمالية',
    'Western Europe': 'أوروبا الغربية',
    'Northern Europe': 'شمال أوروبا',
    'Southern Europe': 'جنوب أوروبا',
    'Central and Eastern Europe': 'وسط أوروبا وشرقها',
    'East Asia': 'شرق آسيا',
    Oceania: 'أوقيانوسيا',
    'Middle East': 'الشرق الأوسط',
  },



  grades: {
    caveat:
      'هذه المعادلات تقريبية. لا يوجد تحويل رسمي موحّد، وكل جامعة تنشر جدولها الخاص، والحالات الحدّية يبتّ فيها مكتب القبول لا الحساب.',
    first: 'امتياز',
    firstNote: '70% فأعلى',
    upperSecond: 'الدرجة الثانية العليا (2:1)',
    upperSecondNote: '60–69%',
    lowerSecond: 'الدرجة الثانية الدنيا (2:2)',
    lowerSecondNote: '50–59%',
    third: 'جيد',
    thirdNote: '40–49%',
    pass: 'مقبول',
    fromGpa: (gpa: string, percent: number, cls: string) =>
      `معدل ${gpa} — أي نحو ${percent}%، بتقدير ${cls}`,
    fromPercent: (percent: number, gpa: string, cls: string) =>
      `${percent}% — أي معدل ${gpa} تقريبًا، بتقدير ${cls}`,
    fromClass: (cls: string, percent: number, gpa: string) =>
      `${cls} — أي نحو ${percent}%، ومعدل ${gpa}`,
  },

  fieldExamples: {
    computing: ['علوم الحاسوب', 'الذكاء الاصطناعي', 'علم البيانات', 'الأمن السيبراني', 'هندسة البرمجيات'],
    engineering: ['ميكانيكية', 'كهربائية', 'مدنية', 'كيميائية', 'طيران وفضاء'],
    business: ['إدارة', 'تمويل', 'محاسبة', 'اقتصاد', 'تسويق'],
    medicine: ['طب', 'تمريض', 'صيدلة', 'طب أسنان', 'صحة عامة'],
    sciences: ['فيزياء', 'كيمياء', 'أحياء', 'رياضيات', 'تقنية حيوية'],
    law: ['قانون', 'قانون دولي', 'حقوق الإنسان', 'علم الإجرام'],
    arts: ['عمارة', 'تصميم جرافيكي', 'موسيقى', 'سينما', 'أزياء'],
    humanities: ['تاريخ', 'فلسفة', 'أدب', 'لغات', 'لسانيات'],
    'social-sciences': ['علم نفس', 'علوم سياسية', 'علاقات دولية', 'علم اجتماع', 'خدمة اجتماعية'],
    education: ['تدريس', 'إعداد المعلمين', 'الطفولة المبكرة', 'التربية الخاصة'],
    agriculture: ['علوم المحاصيل', 'علوم الأغذية', 'الغابات', 'علوم الحيوان'],
    environment: ['علوم البيئة', 'الاستدامة', 'المناخ', 'الطاقة المتجددة'],
  },

  fields: {
    computing: 'الحاسوب وتقنية المعلومات',
    engineering: 'الهندسة',
    business: 'إدارة الأعمال',
    medicine: 'الطب والصحة',
    sciences: 'العلوم',
    law: 'القانون',
    arts: 'الفنون والتصميم',
    humanities: 'العلوم الإنسانية',
    'social-sciences': 'العلوم الاجتماعية',
    education: 'التربية والتعليم',
    agriculture: 'الزراعة',
    environment: 'البيئة',
  },
}
