const en = {
  meta: {
    title: 'CIVICSAATHI AI — Government help, made human',
    description:
      'A multilingual civic assistant for discovering government schemes, checking eligibility and reading official documents with verifiable citations.',
  },
  common: {
    skip: 'Skip to content',
    openWorkspace: 'Open workspace',
    findSupport: 'Find support',
    seeHow: 'See how it works',
    preview: 'Preview',
    illustrative: 'Illustrative preview',
    demo: 'Demo',
    remove: 'Remove',
    api: 'API',
    menu: 'Menu',
    close: 'Close',
    back: 'Back',
    next: 'Continue',
    previous: 'Previous',
    startOver: 'Start over',
    edit: 'Edit',
    reset: 'Reset',
    loading: 'Loading',
    dayLabel: 'Day',
    optional: 'Optional',
    required: 'Required',
    comingSoon: 'Coming soon',
    source: 'Source',
    page: 'Page',
    verified: 'Verified',
    notConnected: 'Not connected yet',
    viewApi: 'View API reference',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    selected: 'Selected',
    useLanguage: 'Use this language',
  },
  shell: {
    workspace: 'Workspace',
    dashboard: 'Dashboard',
    citizenServices: 'Citizen services',
    resources: 'Resources',
    keralaPilot: 'Kerala pilot',
    foundation: 'Foundation · Day 1 of 7',
    backendConnected: 'Backend connected',
    checkingBackend: 'Checking backend',
    backendOffline: 'Backend offline',
    apiOnline: 'API online',
    apiOffline: 'API offline',
    connecting: 'Connecting',
    workspaceTitle: 'CIVICSAATHI workspace',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    viewLanding: 'View landing page',
    apiReference: 'API reference',
    navLabel: 'Workspace navigation',
    skip: 'Skip to content',
    recheck: 'Recheck backend connection',
    preview: 'Preview',
    systemLive: 'Live services',
    demo: 'Demo',
    buildLabel: 'Build 0.1 · Day 1',
    buildSub: 'Foundation only · Modules are previews',
  },
  nav: {
    capabilities: 'Services',
    howItWorks: 'How it works',
    trust: 'Trust',
    languages: 'Languages',
    apiReference: 'API reference',
    mainNavigation: 'Main navigation',
    mobileNavigation: 'Mobile navigation',
  },
  languages: {
    label: 'Language',
    choose: 'Choose a language',
    current: 'Current language',
    switchTo: 'Switch to',
  },
  footer: {
    tagline:
      'Multilingual civic support for Kerala, built for the NxtWave IDEA//FORGE Online Hackathon.',
    product: 'Product',
    developers: 'Developers',
    workspace: 'Workspace',
    schemes: 'Discover schemes',
    eligibility: 'Eligibility check',
    assistant: 'CivicSaathi assistant',
    documents: 'Document help',
    api: 'API reference',
    health: 'Health check',
    metadata: 'System metadata',
    language: 'Language',
    copyright: 'Hackathon prototype · Not an official government service',
    disclaimer:
      'Always verify scheme details on the official portal linked in each record.',
  },
  modules: {
    schemes: {
      name: 'Scheme discovery',
      shortName: 'Find schemes',
      summary:
        'Search support by everyday needs, not by department names or complicated codes.',
      description:
        'A searchable catalogue of curated Kerala and central government schemes. Every record will carry benefits, eligibility, required documents, application steps and an official source link.',
      bullets: [
        'Search and filter a curated, source-linked catalogue',
        'Read benefits, documents and next steps in plain language',
        'Open the official portal from every scheme record',
      ],
    },
    eligibility: {
      name: 'Eligibility check',
      shortName: 'Check eligibility',
      summary:
        'Answer a few clear questions and understand which schemes may fit your situation.',
      description:
        'Eligibility will be evaluated by deterministic backend rules, never by a language model. Each condition returns a pass, fail or unknown result with a plain-language explanation.',
      bullets: [
        'A short guided form with privacy-first defaults',
        'Rules stored as data and evaluated by code, not guessed by AI',
        'A reason for every match, mismatch and missing answer',
      ],
    },
    documents: {
      name: 'Document help',
      shortName: 'Read documents',
      summary:
        'Turn a long official PDF into clear answers about documents, dates and next steps.',
      description:
        'Official notices are extracted with PyMuPDF, split into meaningful chunks, embedded and stored in ChromaDB. Document names and page numbers travel with every chunk.',
      bullets: [
        'PDF text extraction with page-level metadata preserved',
        'Semantic search that finds the right passage, not just keywords',
        'Every answer keeps its document name and page number',
      ],
    },
    assistant: {
      name: 'CivicSaathi assistant',
      shortName: 'Ask CivicSaathi',
      summary:
        'Ask in English, Malayalam or Hindi and get a calm answer with its source attached.',
      description:
        'The assistant retrieves the most relevant passages first, then explains them in the language you choose. If the evidence is missing, it says so instead of inventing an answer.',
      bullets: [
        'Evidence-first answers grounded in retrieved passages',
        'English, Malayalam and Hindi from the same sources',
        'An honest “not found” response when evidence is missing',
      ],
    },
  },
  landing: {
    hero: {
      badge: 'Civic support for Kerala · NxtWave IDEA//FORGE',
      title: 'Government help,',
      accent: 'made human.',
      description:
        'Find the schemes you may qualify for, understand the documents you need, and read official notices in the language you think in — English, Malayalam or Hindi.',
      primary: 'Find support',
      secondary: 'See how it works',
      trust: [
        'Official sources only',
        'Rules-based checks',
        'English · മലയാളം · हिन्दी',
      ],
      note: 'A hackathon prototype built around one promise: no source, no claim.',
    },
    answer: {
      title: 'CivicSaathi',
      subtitle: 'Answers grounded in official documents',
      badge: 'Illustrative',
      question: 'What documents do I need for farmer support?',
      answer:
        'The notification lists three documents: an Aadhaar card, a ration card, and a recent income certificate from the Village Office. Applications are submitted at the nearest Akshaya Centre.',
      sourceLabel: 'Example source',
      file: 'demo_notification.pdf',
      page: 'Page 3',
      excerpt:
        '“Applicants shall submit proof of identity, proof of residence and an annual income certificate issued by the Village Office...”',
      disclaimer: 'Illustrative preview — not an official answer.',
      evidence: 'Source attached',
      footnote: 'Eligibility is rule-checked, never guessed by the model.',
    },
    gap: {
      eyebrow: 'The everyday gap',
      title: 'A scheme exists. A family qualifies.',
      accent: 'The hard part is finding out.',
      description:
        'Most people do not need more information. They need the right information, in their language, with a clear next step.',
      items: [
        {
          title: 'Scattered portals',
          copy: 'Scheme details live across department sites, PDF notices and application portals.',
        },
        {
          title: 'Dense language',
          copy: 'Eligibility and procedure are written for administrators, not for citizens.',
        },
        {
          title: 'Language barriers',
          copy: 'Critical information is rarely available in the language people think in.',
        },
      ],
    },
    services: {
      eyebrow: 'What we are building',
      title: 'Five connected services. One source of truth.',
      description:
        'Discovery, eligibility, documents and conversation share one evidence layer, so every answer can be traced back to an official source.',
      note: 'The foundation is live today. Scheme discovery and eligibility arrive in the next milestone.',
      cta: 'Preview this service',
      across: 'Across every answer',
      items: {
        discovery: {
          name: 'Scheme discovery',
          capability: 'Discover',
          description:
            'Search support by life situation, not by department names or codes.',
        },
        eligibility: {
          name: 'Eligibility check',
          capability: 'Understand',
          description:
            'Answer a few questions. Rules, not guesswork, show what may fit.',
        },
        documents: {
          name: 'Document help',
          capability: 'Read',
          description:
            'Understand official notices, required documents and next steps.',
        },
        assistant: {
          name: 'Ask CivicSaathi',
          capability: 'Ask',
          description:
            'Ask in your language and get an answer with its source attached.',
        },
        evidence: {
          name: 'Evidence & citations',
          capability: 'Verify',
          description:
            'See the document, page and excerpt behind every answer.',
        },
      },
    },
    how: {
      eyebrow: 'How it works',
      title: 'From a dense notice to a clear next step.',
      description:
        'No jargon, no hidden guesses. Just a simple path from your question to an answer you can check.',
      steps: [
        {
          title: 'Tell us what you need',
          copy: 'Start with a question or a life situation. No department codes, no forms designed for administrators.',
          tags: ['Plain language', 'Three languages'],
        },
        {
          title: 'We check the official source',
          copy: 'CivicSaathi reads curated scheme records and official documents, keeping the page and excerpt.',
          tags: ['Official PDFs', 'Page metadata'],
        },
        {
          title: 'Act with confidence',
          copy: 'Get a clear next step, the documents to prepare, and a link to the official portal.',
          tags: ['Cited answers', 'Next steps'],
        },
      ],
    },
    evidence: {
      eyebrow: 'Verifiable by design',
      title: 'No source.',
      accent: 'No claim.',
      description:
        'Government advice is only useful if it can be checked. Every answer returns the document, page and excerpt it relied on — and says so when the evidence is not there.',
      points: [
        {
          title: 'Page-level proof',
          copy: 'Document name, page number and the supporting excerpt stay attached to every answer.',
        },
        {
          title: 'Clear when unsure',
          copy: 'A missing answer looks different from a confident one. We never fill the gap with a guess.',
        },
        {
          title: 'Rules decide eligibility',
          copy: 'Eligibility is evaluated by deterministic backend rules, never decided by a language model.',
        },
      ],
      card: {
        file: 'kerala_notification.pdf',
        page: 'Page 4',
        label: 'Supporting excerpt',
        excerpt:
          '“Applicants must submit a valid ration card and an income certificate issued within the last six months...”',
        verified: 'Verified excerpt',
        match: 'Semantic match',
        missingTitle: '“I couldn’t find this in the uploaded documents.”',
        missingCopy:
          'When evidence is missing, the assistant says so instead of inventing a rule.',
        illustrative: 'Illustrative interface',
      },
    },
    languages: {
      eyebrow: 'Made for how you speak',
      title: 'Three languages. One shared source of truth.',
      description:
        'Switch the whole interface, not just the answer. Longer Malayalam and Hindi text is designed to wrap cleanly and stay readable.',
      select: 'Use this language',
      selected: 'Selected',
      sameEvidence: 'Same evidence in every language',
      samples: {
        en: 'Find the support you may qualify for. Every answer keeps its source.',
        ml: 'നിങ്ങൾക്ക് അർഹതയുള്ള സഹായം കണ്ടെത്തുക. ഓരോ ഉത്തരവും ഉറവിടത്തോടൊപ്പം.',
        hi: 'आप जिस सहायता के योग्य हो सकते हैं, उसे खोजें। हर उत्तर अपने स्रोत के साथ रहता है।',
      },
    },
    cta: {
      eyebrow: 'Start with a question',
      title: 'Support should feel',
      accent: 'within reach.',
      description:
        'Explore the workspace, try the guided previews, or read the API contract powering the assistant.',
      primary: 'Open the workspace',
      secondary: 'Explore services',
      disclaimer: 'Hackathon prototype. Not an official government service.',
    },
  },
  dashboard: {
    eyebrow: 'Kerala pilot',
    greeting: 'Namaskaram.',
    title: 'What can we help with today?',
    description:
      'Start with what you need. The foundation and live API are working today; scheme intelligence, document reading and the assistant arrive in the next milestones.',
    snapshot: {
      api: 'API status',
      online: 'Online',
      offline: 'Offline',
      connecting: 'Connecting',
      languages: 'Languages',
      languagesValue: '3',
      next: 'Next milestone',
      nextValue: 'Schemes & eligibility',
      foundation: 'Foundation',
      foundationValue: 'Day 1 of 7',
    },
    quick: {
      title: 'Start here',
      copy: 'Choose the path that feels closest to your question.',
      items: {
        schemes: {
          title: 'Find a scheme',
          copy: 'Browse support by everyday need.',
        },
        eligibility: {
          title: 'Check eligibility',
          copy: 'See what information you will need.',
        },
        assistant: {
          title: 'Ask a question',
          copy: 'See how a cited answer will look.',
        },
        documents: {
          title: 'Read a notice',
          copy: 'Preview the document workspace.',
        },
      },
    },
    services: {
      title: 'Explore services',
      copy: 'Four connected previews, each honest about what is live today.',
      badge: 'Foundation live',
      cta: 'Open preview',
    },
    language: {
      title: 'A workspace in your language',
      copy: 'Switch between English, Malayalam and Hindi at any time. The whole interface follows.',
      hint: 'The API will return answers in the language you choose.',
    },
    status: {
      title: 'System status',
      copy: 'Live API and dependency checks, kept out of the way until you need them.',
      refresh: 'Refresh',
      checked: 'Last checked',
      awaiting: 'Waiting for the first response',
      latency: 'Response time',
      readinessTitle: 'Readiness',
      version: 'Version',
      never: 'Waiting for the first check',
      details: 'View dependency details',
      raw: 'Raw report',
      unavailable: 'Dependency report unavailable',
      offlineCopy: 'Start the FastAPI server to reconnect.',
      retry: 'Try again',
      checks: {
        api: 'API runtime',
        scheme_dataset: 'Scheme dataset',
        supabase: 'Database',
        gemini: 'Gemini',
        vector_store: 'Document search',
      },
      checkStatus: {
        ok: 'Working',
        pending: 'Planned',
        not_configured: 'Not configured',
        error: 'Error',
      },
      readiness: {
        ready: 'Ready',
        degraded: 'Partly ready',
        not_ready: 'Not ready',
      },
    },
    offline: {
      title: 'We cannot reach the workspace API',
      copy: 'The interface is still here, but live status and future scheme data need the backend.',
      command: 'Start the API from the backend folder',
      retry: 'Retry connection',
      details: 'Technical detail',
    },
    plan: {
      title: 'Delivery plan',
      copy: 'Seven days, built in honest, testable milestones.',
      items: [
        {
          day: 'Day 1',
          title: 'Foundation',
          detail: 'Design system, routing and live API status',
          state: 'done',
        },
        {
          day: 'Day 2',
          title: 'Schemes & eligibility',
          detail: 'Curated dataset and deterministic rules',
          state: 'current',
        },
        {
          day: 'Day 3',
          title: 'Document intelligence',
          detail: 'PDFs, retrieval and page metadata',
          state: 'next',
        },
        {
          day: 'Day 4',
          title: 'Evidence-backed assistant',
          detail: 'Grounded answers with citations',
          state: 'next',
        },
        {
          day: 'Day 5–7',
          title: 'Trilingual polish & launch',
          detail: 'Malayalam, Hindi, testing and deployment',
          state: 'next',
        },
      ],
      nextLabel: 'Next up · Day 2',
      nextCopy: 'Curated schemes and the deterministic eligibility engine.',
      nextCta: 'Open scheme preview',
    },
    trust: {
      title: 'Our promise',
      items: [
        'Official sources only',
        'Eligibility decided by rules',
        'Nothing you type is saved in previews',
      ],
    },
    footer:
      'CIVICSAATHI AI is a hackathon prototype, not an official government service.',
  },
  schemes: {
    eyebrow: 'Scheme discovery · Preview',
    title: 'Support that fits your life.',
    description:
      'This is the finder we are building: search by everyday needs, read a clear summary, and follow the official source when it is time to apply.',
    noticeTitle: 'A layout preview, not the official catalogue',
    noticeCopy:
      'The curated scheme dataset arrives on Day 2. The cards below are clearly marked samples that show how records will look. They are not official schemes.',
    search: 'Search by need, department or support',
    filters: 'Filter by category',
    categories: {
      all: 'All',
      agriculture: 'Agriculture',
      health: 'Health',
      education: 'Education',
      welfare: 'Welfare',
    },
    demoBadge: 'Sample card',
    benefit: 'Support',
    department: 'Department',
    audience: 'Who it is for',
    sourcePending: 'Official source link arrives Day 2',
    detailsSoon: 'Details soon',
    results: '{count} sample services',
    resultsOne: '{count} sample service',
    emptyTitle: 'No sample service matches that search.',
    emptyCopy: 'Try a different word or show every category.',
    reset: 'Show all samples',
    clearSearch: 'Clear search',
    helper: 'Sample content only',
    records: [
      {
        id: 'farmer-support',
        category: 'agriculture',
        title: 'Farmer livelihood support',
        summary:
          'A sample card for seasonal income support, the documents involved and how an application would work.',
        benefit: 'Seasonal income support',
        department: 'Agriculture & farmers welfare',
        audience: 'Small and marginal farming households',
      },
      {
        id: 'maternal-health',
        category: 'health',
        title: 'Maternal health support',
        summary:
          'A sample card for health, nutrition and check-up support for mothers and young children.',
        benefit: 'Health and nutrition support',
        department: 'Health & family welfare',
        audience: 'Mothers and young children',
      },
      {
        id: 'student-scholarship',
        category: 'education',
        title: 'Higher education scholarship',
        summary:
          'A sample card for tuition assistance, renewal steps and the documents students need.',
        benefit: 'Education assistance',
        department: 'Higher education',
        audience: 'Students from low-income households',
      },
      {
        id: 'artisan-pension',
        category: 'welfare',
        title: 'Artisan pension support',
        summary:
          'A sample card for social security support and enrolment for traditional artisans.',
        benefit: 'Monthly social security',
        department: 'Labour & skills',
        audience: 'Traditional artisans',
      },
    ],
  },
  eligibility: {
    eyebrow: 'Eligibility check · Preview',
    title: 'A few questions. A clearer path.',
    description:
      'This preview shows how we will ask for the information needed to check schemes — step by step, without jargon.',
    noticeTitle: 'No eligibility result in this preview',
    noticeCopy:
      'The deterministic rules engine arrives on Day 2. This walkthrough does not decide eligibility, contact any service, or save your answers.',
    privacy: 'Stays in your browser. Nothing is sent or saved.',
    stepOf: 'Step {current} of {total}',
    steps: [
      {
        title: 'About you',
        description: 'Age, district and where you live.',
      },
      {
        title: 'Your household',
        description: 'Income range, household size and category.',
      },
      {
        title: 'What you need',
        description: 'Choose the kinds of support you are looking for.',
      },
      {
        title: 'Review',
        description: 'Check your answers before the rules engine connects.',
      },
    ],
    fields: {
      age: 'Age',
      ageHint: 'Used to check age-based scheme rules.',
      agePlaceholder: 'For example, 34',
      district: 'District',
      districtPlaceholder: 'Choose your district',
      area: 'Where do you live?',
      areaHint: 'Some schemes are limited to rural or urban areas.',
      rural: 'Village or rural area',
      urban: 'Town or city',
      income: 'Annual household income',
      incomePlaceholder: 'Choose an income range',
      household: 'People in your household',
      householdHint: 'Include yourself and everyone you support.',
      householdPlaceholder: 'For example, 4',
      category: 'Social category',
      categoryPlaceholder: 'Choose a category',
      needs: 'What kind of support are you looking for?',
      needsHint: 'Choose all that apply. You can change this later.',
    },
    options: {
      income: {
        below1: 'Below ₹1 lakh',
        oneTo2_5: '₹1–2.5 lakh',
        two5To5: '₹2.5–5 lakh',
        above5: 'Above ₹5 lakh',
        prefer: 'Prefer not to say',
      },
      category: {
        general: 'General',
        obc: 'OBC',
        sc: 'SC',
        st: 'ST',
        ews: 'EWS',
        prefer: 'Prefer not to say',
      },
      needs: {
        health: 'Health',
        education: 'Education',
        housing: 'Housing',
        agriculture: 'Agriculture',
        pension: 'Pension',
        business: 'Small business',
      },
    },
    districts: {
      kasaragod: 'Kasaragod',
      kannur: 'Kannur',
      wayanad: 'Wayanad',
      kozhikode: 'Kozhikode',
      malappuram: 'Malappuram',
      palakkad: 'Palakkad',
      thrissur: 'Thrissur',
      ernakulam: 'Ernakulam',
      idukki: 'Idukki',
      kottayam: 'Kottayam',
      alappuzha: 'Alappuzha',
      pathanamthitta: 'Pathanamthitta',
      kollam: 'Kollam',
      thiruvananthapuram: 'Thiruvananthapuram',
    },
    errors: {
      age: 'Enter an age between 0 and 120.',
      district: 'Choose your district.',
      area: 'Choose where you live.',
      income: 'Choose an income range.',
      household: 'Enter a household size between 1 and 30.',
      category: 'Choose a social category.',
      needs: 'Choose at least one kind of support.',
    },
    review: {
      title: 'Your answers',
      copy: 'Review the information you entered. Nothing has been sent anywhere.',
      age: 'Age',
      district: 'District',
      area: 'Location',
      income: 'Annual income',
      household: 'Household size',
      category: 'Social category',
      needs: 'Support needed',
      notProvided: 'Not provided',
    },
    result: {
      title: 'Your result will appear here',
      copy: 'On Day 2, deterministic rules will compare these answers with official scheme conditions. You will see a reason for every match, mismatch and missing answer.',
      badge: 'Rules engine arrives Day 2',
    },
    buttons: {
      back: 'Back',
      continue: 'Continue',
      review: 'Review answers',
      startOver: 'Start over',
    },
  },
  assistant: {
    eyebrow: 'CivicSaathi assistant · Preview',
    title: 'Ask in your own words.',
    description:
      'A calm place to ask about schemes, documents and next steps. Answers will always show where they came from.',
    noticeTitle: 'A conversation preview',
    noticeCopy:
      'The assistant is not connected to Gemini yet. The example below shows the intended experience; sending a question will not generate a real answer.',
    chatTitle: 'CivicSaathi',
    chatSubtitle: 'Grounded in official documents',
    previewBadge: 'Preview',
    exampleBadge: 'Example answer',
    question: 'What documents do I need for farmer support?',
    answer:
      'The notification lists three documents: an Aadhaar card, a ration card, and a recent income certificate from the Village Office. Applications are submitted at the nearest Akshaya Centre.',
    sourceLabel: 'Example source',
    file: 'demo_notification.pdf',
    page: 'Page 3',
    excerpt:
      '“Applicants shall submit proof of identity, proof of residence and an annual income certificate issued by the Village Office...”',
    suggestionsTitle: 'Try asking',
    suggestions: [
      'How do I apply?',
      'Which documents are needed?',
      'Where is the nearest office?',
    ],
    composerPlaceholder: 'Type your question…',
    composerLabel: 'Your question',
    you: 'You',
    send: 'Send',
    composerHint: 'Preview only · The assistant connects on Day 4.',
    previewReplyTitle: 'This is where the answer will appear.',
    previewReply:
      'The assistant is not connected in this design preview. On Day 4, it will answer only from uploaded documents and show the file, page and excerpt.',
    trustTitle: 'Built to be checked',
    trust: [
      {
        title: 'Evidence first',
        copy: 'The assistant retrieves passages before it writes a single word.',
      },
      {
        title: 'Your language',
        copy: 'English, Malayalam and Hindi answers share the same evidence.',
      },
      {
        title: 'Honest gaps',
        copy: 'If the documents do not contain the answer, it says so.',
      },
    ],
    reset: 'Reset conversation',
  },
  documents: {
    eyebrow: 'Document help · Preview',
    title: 'Bring an official notice. We’ll help you read it.',
    description:
      'Upload a PDF, find the passages that matter, and ask questions with the page number kept beside every answer.',
    noticeTitle: 'A local-only document preview',
    noticeCopy:
      'Upload and extraction arrive on Day 3. In this preview, files stay in your browser and are never sent to a server.',
    dropTitle: 'Drop a PDF here',
    dropCopy: 'or choose a file from your device',
    browse: 'Choose a PDF',
    addMore: 'Add another PDF',
    dropActive: 'Release to add this PDF',
    accepted: 'PDF only · up to 10 MB',
    selectedTitle: 'Selected on this device',
    emptyTitle: 'No documents selected yet',
    emptyCopy:
      'When you add a PDF, it will appear here with its local status. Nothing is uploaded in this preview.',
    notUploaded: 'Not uploaded',
    remove: 'Remove document',
    localNote:
      'This preview keeps files in your browser. Upload and extraction arrive on Day 3.',
    errorType: 'Please choose a PDF file.',
    errorSize: 'That file is larger than 10 MB.',
    stepsTitle: 'What will happen here',
    steps: [
      {
        title: 'Upload a notice',
        copy: 'Choose an official PDF from a department or portal.',
      },
      {
        title: 'We read the pages',
        copy: 'Text, page numbers and document names are kept together.',
      },
      {
        title: 'Ask and verify',
        copy: 'Questions return the passage and page they came from.',
      },
    ],
    privacyTitle: 'Your documents stay yours',
    privacyCopy:
      'In the finished product, files will be processed on the server, not in the browser, and will never be used to train a public model.',
    formatsTitle: 'What works best',
    formatsCopy:
      'Text-based PDFs from official portals. Scanned notices will need OCR before they can be searched.',
  },
  notFound: {
    eyebrow: '404',
    title: 'This page isn’t in the file.',
    copy: 'The link may be outdated, or the module has not shipped yet. The dashboard shows what is live today.',
    home: 'Back to home',
    workspace: 'Open workspace',
  },
}

export default en
