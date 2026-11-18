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
    live: 'Live',
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
    foundation: 'Foundation · Day 2 of 7',
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
    buildLabel: 'Build 0.2 · Day 2',
    buildSub: 'Schemes, eligibility and documents are live · Assistant is a preview',
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
        'A searchable catalogue of 15 curated Kerala and central government schemes. Every record carries benefits, eligibility conditions, required documents, application steps and an official source link.',
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
        'Eligibility is evaluated by deterministic backend rules, never by a language model. Each condition returns a pass, fail or unknown result with a plain-language explanation.',
      bullets: [
        'An optional form that never asks for Aadhaar or addresses',
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
      eyebrow: 'What we offer',
      title: 'Five connected services. One source of truth.',
      description:
        'Discovery, eligibility, documents and conversation share one evidence layer, so every answer can be traced back to an official source.',
      note: 'Scheme discovery, eligibility and document intelligence are live. Only the assistant is a clearly marked preview.',
      cta: 'Explore this service',
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
        'Explore the live scheme catalogue, check your eligibility, search official PDFs, or open the clearly marked assistant preview.',
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
      'Scheme discovery, eligibility and document intelligence are live today. The assistant remains a clearly marked preview until Day 4.',
    snapshot: {
      api: 'API status',
      online: 'Online',
      offline: 'Offline',
      connecting: 'Connecting',
      languages: 'Languages',
      languagesValue: '3',
      next: 'Next milestone',
      nextValue: 'Document help',
      foundation: 'Foundation',
      foundationValue: 'Day 2 of 7',
    },
    quick: {
      title: 'Start here',
      copy: 'Choose the path that feels closest to your question.',
      items: {
        schemes: {
          title: 'Find a scheme',
          copy: 'Browse verified support by everyday need.',
        },
        eligibility: {
          title: 'Check eligibility',
          copy: 'Check encoded rules and see every reason.',
        },
        assistant: {
          title: 'Ask a question',
          copy: 'See how a cited answer will look.',
        },
        documents: {
          title: 'Read a notice',
          copy: 'Upload a PDF and find page-cited passages.',
        },
      },
    },
    services: {
      title: 'Explore services',
      copy: 'Three live services and one clearly labelled preview.',
      badge: 'Schemes & eligibility live',
      cta: 'Open service',
    },
    language: {
      title: 'A workspace in your language',
      copy: 'Switch between English, Malayalam and Hindi at any time. The whole interface follows.',
      hint: 'The API returns scheme content in the language you choose.',
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
          state: 'done',
        },
        {
          day: 'Day 3',
          title: 'Document intelligence',
          detail: 'PDFs, retrieval and page metadata',
          state: 'done',
        },
        {
          day: 'Day 4',
          title: 'Evidence-backed assistant',
          detail: 'Grounded answers with citations',
          state: 'current',
        },
        {
          day: 'Day 5–7',
          title: 'Trilingual polish & launch',
          detail: 'Malayalam, Hindi, testing and deployment',
          state: 'next',
        },
      ],
      nextLabel: 'Next up · Day 4',
      nextCopy: 'Grounded answers with page citations in all three languages.',
      nextCta: 'Open assistant preview',
    },
    trust: {
      title: 'Our promise',
      items: [
        'Official sources only',
        'Eligibility decided by rules',
        'Nothing you type is saved',
      ],
    },
    footer:
      'CIVICSAATHI AI is a hackathon prototype, not an official government service.',
  },
  schemes: {
    eyebrow: 'Scheme discovery',
    title: 'Support that fits your life.',
    description:
      'Search 15 curated central and Kerala schemes by name, department or everyday need. Every record links to an official source and states when it was last verified.',
    badge: 'Live catalogue',
    noticeTitle: 'Verified records, clear translations',
    noticeCopy:
      'Each record was checked against the linked official source and shows its verification date. Malayalam and Hindi are editorial interface translations, not official translations.',
    search: 'Search by name, department or need',
    clearSearch: 'Clear search',
    helper: 'Curated from official sources',
    filters: 'Filter by category',
    levelLabel: 'Government level',
    categories: {
      all: 'All',
      agriculture: 'Agriculture',
      business: 'Business',
      education: 'Education',
      employment: 'Employment',
      health: 'Health',
      housing: 'Housing',
      insurance: 'Insurance',
      pension: 'Pension',
      welfare: 'Welfare',
    },
    levels: {
      all: 'All governments',
      central: 'Central government',
      state: 'Kerala government',
    },
    results: '{count} schemes',
    resultsOne: '{count} scheme',
    pageOf: 'Page {page} of {total}',
    previous: 'Previous page',
    next: 'Next page',
    reset: 'Clear filters',
    verifiedOn: 'Verified {date}',
    department: 'Department',
    benefits: 'Support',
    viewDetails: 'View details',
    officialSource: 'Official source',
    centralBadge: 'Central',
    stateBadge: 'Kerala',
    state: 'State',
    errorTitle: 'The scheme catalogue could not load',
    errorCopy:
      'Check that the CIVICSAATHI backend is running, then try again. No sample records are shown in place of real data.',
    retry: 'Try again',
    emptyTitle: 'No verified scheme matches those filters.',
    emptyCopy:
      'Try a different keyword or clear the category and government filters.',
    detail: {
      back: 'Back to all schemes',
      about: 'About this scheme',
      benefits: 'What the scheme provides',
      documents: 'Documents to prepare',
      steps: 'How to apply',
      conditions: 'What the eligibility rules check',
      manualBadge: 'Manual check',
      manualNote:
        'The official rules include a condition this rules engine cannot decide from answers alone. A manual review is required.',
      sources: 'Official sources',
      additionalSources: 'Additional official sources',
      contentNote: 'About this content',
      eligibilityCta: 'Check your eligibility',
      loading: 'Loading the verified scheme record',
      notFoundTitle: 'Scheme not found',
      notFoundCopy:
        'This scheme id does not exist in the verified catalogue. Return to the catalogue and choose a listed scheme.',
      errorTitle: 'This scheme could not load',
      errorCopy:
        'Check that the CIVICSAATHI backend is running, then try again.',
      retry: 'Try again',
      verifiedOn: 'Last verified {date}',
    },
  },
  eligibility: {
    eyebrow: 'Eligibility check',
    title: 'A few questions. A clearer path.',
    description:
      'Answer only what you know. A deterministic rules engine compares your answers with encoded scheme conditions and explains every pass, fail and unknown.',
    badge: 'Live rules engine',
    noticeTitle: 'A preliminary result, not an official decision',
    noticeCopy:
      'The engine checks the conditions encoded in this prototype. Final eligibility is always determined by the relevant government authority.',
    privacyTitle: 'Nothing you type is saved',
    privacyCopy:
      'Answers are evaluated in memory and never stored. Do not enter Aadhaar, phone numbers, addresses or document numbers; this form never asks for them.',
    formTitle: 'Tell us what you know',
    formCopy:
      'Every question is optional. Leave anything blank and the result will say the information is missing instead of guessing.',
    sections: {
      about: {
        title: 'About you',
        description: 'Age, location and social category.',
      },
      household: {
        title: 'Household and finances',
        description: 'Income, ration status and banking details.',
      },
      work: {
        title: 'Work and livelihood',
        description: 'Farmland, employment, trade and existing loans.',
      },
      health: {
        title: 'Health and family',
        description: 'Medical needs, education and loss of a parent.',
      },
      insurance: {
        title: 'Insurance consents',
        description: 'Consent and previous enrolment checks.',
      },
    },
    fields: {
      age: { label: 'Age', placeholder: 'For example, 34' },
      state: { label: 'State', placeholder: 'Choose your state' },
      area: {
        label: 'Where do you live?',
        placeholder: 'Choose rural or urban',
      },
      annual_income: {
        label: 'Annual household income (₹)',
        placeholder: 'For example, 120000',
      },
      category: { label: 'Social category', placeholder: 'Choose a category' },
      indian_citizen: { label: 'Indian citizen' },
      bpl: {
        label: 'Below Poverty Line (BPL) household',
        hint: 'As recorded on your ration card.',
      },
      income_tax_payer: {
        label: 'I or my household paid income tax in the last assessment year',
      },
      ever_income_tax_payer: {
        label: 'I have ever been an income-tax payer (APY bar)',
      },
      bank_account: { label: 'Bank account in my own name' },
      monthly_pension: {
        label: 'Monthly pension (₹)',
        placeholder: 'Enter 0 if none',
      },
      government_employee: { label: 'Government employee' },
      excluded_government_job: {
        label:
          'A family member is a serving or retired government, public-sector, autonomous-body or local-body employee (MTS, Class IV and Group D are exempt)',
      },
      constitutional_post_holder: {
        label:
          'A family member is or was a constitutional post holder, minister, MP, MLA, MLC, mayor or district panchayat chairperson',
      },
      registered_professional: {
        label:
          'Registered professional (doctor, engineer, lawyer, chartered accountant)',
      },
      landholding: { label: 'I hold agricultural land' },
      institutional_landholder: { label: 'Institutional landholder' },
      informal_self_employed: { label: 'Informal self-employed worker' },
      vishwakarma_trade: {
        label: 'I work in one of the 18 Vishwakarma trades',
      },
      family_registered_in_scheme: {
        label: 'Another family member is enrolled in this scheme',
      },
      similar_loan_unrepaid: {
        label: 'An earlier similar loan is still unpaid',
      },
      similar_loan_in_5_years: {
        label: 'I took a similar loan in the last five years',
      },
      consent_auto_debit: {
        label: 'I consent to automatic premium debit',
      },
      duplicate_enrolment: { label: 'I am already enrolled in this scheme' },
      willing_manual_work: {
        label: 'Willing to do unskilled manual work',
      },
      street_vendor: { label: 'I am a street vendor' },
      unique_upi_id: {
        label: 'I have a valid UPI ID not already used by another beneficiary',
      },
      loan_npa_or_written_off: {
        label: 'An existing loan account is an NPA or has been written off',
      },
      lost_parent: { label: 'A parent is deceased' },
      education_level: {
        label: 'Current education',
        placeholder: 'Choose education level',
      },
      dialysis_patient: { label: 'Patient needs dialysis' },
      transplant_patient: { label: 'Patient had a kidney or liver transplant' },
      years_since_transplant: {
        label: 'Years since the transplant',
        placeholder: 'Enter 0 to 100',
      },
      hemophilia_patient: { label: 'Patient has haemophilia' },
      sickle_cell_patient: { label: 'Patient has sickle cell disease' },
    },
    options: {
      yes: 'Yes',
      no: 'No',
      unsure: 'Not sure — leave unknown',
      choose: 'Choose an option',
      area: { rural: 'Village or rural area', urban: 'Town or city' },
      state: { kerala: 'Kerala', other: 'Another state' },
      category: {
        general: 'General',
        obc: 'OBC',
        sc: 'SC',
        st: 'ST',
        ews: 'EWS',
      },
      education: {
        below_school: 'Below school age',
        school_or_college: 'At school or college',
        degree_or_professional: 'In a degree or professional degree course',
        completed_degree: 'Completed a degree',
        not_studying: 'Not studying',
      },
    },
    submit: 'Check eligibility',
    checking: 'Checking…',
    clear: 'Clear answers',
    errors: {
      age: 'Enter a whole number between 0 and 120.',
      annual_income: 'Enter a whole number of ₹0 or more.',
      monthly_pension: 'Enter a whole number of ₹0 or more.',
      years_since_transplant: 'Enter a whole number between 0 and 100.',
    },
    errorTitle: 'The eligibility check could not run',
    errorCopy:
      'Check that the CIVICSAATHI backend is running, then try again. Nothing was saved.',
    retry: 'Try again',
    results: {
      title: 'Preliminary results',
      count: '{count} schemes checked',
      countOne: '{count} scheme checked',
      fields: '{count} answers used',
      fieldsOne: '{count} answer used',
      privateNote: 'Evaluated in memory. Nothing was saved.',
      filterLabel: 'Filter by outcome',
      all: 'All outcomes',
      outcomes: {
        potentially_eligible: 'Potentially eligible',
        ineligible: 'Not eligible',
        insufficient_information: 'More information needed',
        manual_review: 'Manual review needed',
      },
      emptyTitle: 'No scheme matches this outcome.',
      emptyCopy: 'Choose another outcome to see the other results.',
      conditionsTitle: 'Condition checks',
      groupsTitle: 'How the rules combined',
      statuses: { pass: 'Passed', fail: 'Did not pass', unknown: 'Unknown' },
      groupStatuses: {
        satisfied: 'Satisfied',
        failed: 'Failed',
        insufficient_information: 'Incomplete',
        manual_review: 'Manual review',
      },
      reasons: {
        evaluated: 'Checked against your answer',
        missing_profile_field: 'Your answer is missing',
        manual_verification_required: 'Needs manual verification',
        unsupported_value: 'Answer could not be interpreted',
      },
      viewScheme: 'View scheme',
      source: 'Official source',
      expand: 'See condition details',
      collapse: 'Hide condition details',
      loadingTitle: 'Checking every encoded condition',
      loadingCopy:
        'The rules engine is comparing your answers. Nothing is sent anywhere else.',
      emptyResultsTitle: 'No results were returned',
      emptyResultsCopy:
        'Try again with at least one answer, or clear the form and start over.',
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
    eyebrow: 'Document intelligence · Live',
    title: 'Bring an official notice. Find the exact page.',
    description:
      'Upload a PDF, search every page in English, Malayalam or Hindi, and verify the passage beside its page number.',
    noticeTitle: 'How this prototype handles your PDF',
    noticeCopy:
      'Files are processed on the CIVICSAATHI server and searched with a multilingual embedding model. No AI answers are generated — only real passages from your document.',
    dropTitle: 'Drop a PDF here',
    dropCopy: 'or choose a file from your device',
    browse: 'Choose a PDF',
    addMore: 'Add another PDF',
    dropActive: 'Release to upload this PDF',
    accepted: 'PDF only · up to 10 MB · 100 pages',
    errorType: 'Please choose a PDF file.',
    errorSize: 'That file is larger than 10 MB.',
    libraryTitle: 'Document library',
    libraryCopy:
      'Every uploaded PDF with its processing status and indexed passage count.',
    loading: 'Loading your documents…',
    loadError: 'The document library could not be loaded.',
    emptyTitle: 'No documents yet',
    emptyCopy:
      'Upload a text-based government PDF to build a searchable, page-cited library.',
    retry: 'Try again',
    status: {
      indexed: 'Indexed',
      needs_ocr: 'Needs OCR',
      empty: 'No text found',
    },
    pagesLabel: 'pages',
    passagesLabel: 'passages',
    uploadedLabel: 'Uploaded',
    uploading: 'Uploading and indexing…',
    uploadSuccess: 'PDF indexed successfully.',
    duplicate: 'This PDF was already uploaded. Showing the existing document.',
    uploadError: 'The PDF could not be uploaded.',
    detailsTitle: 'Document details',
    detailsCopy: 'Stored metadata for this PDF — no local server paths are shown.',
    checksum: 'SHA-256 checksum',
    metadataTitle: 'PDF metadata',
    noMetadata: 'No PDF metadata was available.',
    closeDetails: 'Close details',
    deleteTitle: 'Delete document',
    deleteConfirm:
      'Delete this document and all of its indexed passages? This cannot be undone.',
    deleting: 'Deleting…',
    deleteSuccess: 'Document deleted.',
    deleteError: 'The document could not be deleted.',
    searchTitle: 'Search your documents',
    searchCopy:
      'Ask in English, Malayalam or Hindi. Results are actual passages, with the file and page shown.',
    searchPlaceholder: 'e.g. crop support for farmers',
    searchButton: 'Find passages',
    searching: 'Searching…',
    filterAll: 'All documents',
    resultsTitle: 'Source passages',
    resultsCount: 'passages found',
    noResultsTitle: 'No relevant evidence found',
    noResultsCopy:
      'No uploaded passage matched this query. Try different words or upload the official notice.',
    pageLabel: 'Page',
    similarity: 'Similarity',
    resultNoticeTitle: 'Verify before you rely on it',
    resultNoticeCopy:
      'Similarity shows how closely a passage matches your query. It is not proof the passage is factually correct. Check the official source.',
    stepsTitle: 'How it works',
    steps: [
      {
        title: 'Upload a notice',
        copy: 'Choose an official PDF from a department or portal.',
      },
      {
        title: 'We read every page',
        copy: 'Text and page numbers are kept together, with short overlapping passages.',
      },
      {
        title: 'Search and verify',
        copy: 'A query returns real passages with the filename and page number.',
      },
    ],
    privacyTitle: 'Your documents stay on this server',
    privacyCopy:
      'PDFs are processed and stored by your own CIVICSAATHI backend. Nothing is used to train a public model, and no generated answers are produced in this release.',
    formatsTitle: 'What works best',
    formatsCopy:
      'Text-based PDFs from official portals search best. Scanned notices are flagged as needing OCR and are not indexed until OCR is added.',
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
