import {
  FileStack,
  ListChecks,
  MessagesSquare,
  Search,
  ShieldCheck,
} from 'lucide-react'

/**
 * The four workspace modules. Status is intentionally honest: only the
 * foundation is live on Day 1. The dashboard renders these as previews.
 */
export const MODULES = [
  {
    id: 'schemes',
    name: 'Scheme discovery',
    shortName: 'Discover schemes',
    path: 'schemes',
    icon: Search,
    milestone: 'Day 2',
    status: 'next',
    summary:
      'Find schemes by category, understand the benefits and open the official portal to apply.',
    description:
      'A searchable catalogue of curated Kerala and central government schemes. Every record carries benefits, eligibility, required documents, application steps and an official source URL.',
    bullets: [
      'Keyword search across a curated, source-linked dataset',
      'Category, department and beneficiary filters',
      'Benefits, documents, steps and the official portal on every record',
    ],
    endpoint: 'GET /api/v1/schemes?q=&category=\nGET /api/v1/schemes/{scheme_id}',
  },
  {
    id: 'eligibility',
    name: 'Eligibility checker',
    shortName: 'Check eligibility',
    path: 'eligibility',
    icon: ListChecks,
    milestone: 'Day 2',
    status: 'next',
    summary:
      'Answer a short structured form and see which schemes may apply — with a reason for every rule.',
    description:
      'Eligibility is evaluated by deterministic backend rules, never by a language model. Each condition returns a pass, fail or unknown result with a plain-language explanation.',
    bullets: [
      'Validated profile form covering age, location, income and category',
      'Rules stored as data and evaluated by code, not guessed by AI',
      'Rule-by-rule explanations plus prompts for missing information',
    ],
    endpoint: 'POST /api/v1/eligibility/check\n{ "profile": { "age": 34, ... } }',
  },
  {
    id: 'documents',
    name: 'Document intelligence',
    shortName: 'Document intelligence',
    path: 'documents',
    icon: FileStack,
    milestone: 'Day 3',
    status: 'planned',
    summary:
      'Upload a government PDF and turn it into a searchable, page-aware knowledge source.',
    description:
      'Official notifications are extracted with PyMuPDF, split into meaningful chunks, embedded and stored in ChromaDB. Document names and page numbers travel with every chunk.',
    bullets: [
      'PDF text extraction with page-level metadata preserved',
      'Semantic chunking with overlap for reliable retrieval',
      'ChromaDB index scoped to the documents you upload',
    ],
    endpoint:
      'POST /api/v1/documents  (multipart PDF)\nGET  /api/v1/documents/{document_id}',
  },
  {
    id: 'assistant',
    name: 'AI assistant',
    shortName: 'AI assistant',
    path: 'assistant',
    icon: MessagesSquare,
    milestone: 'Day 4',
    status: 'planned',
    summary:
      'Ask in English or Malayalam and get a clear answer with the exact source and page attached.',
    description:
      'The assistant retrieves the most relevant passages first, then asks Gemini to explain them in the citizen’s language. If the evidence is missing, it says so instead of inventing an answer.',
    bullets: [
      'Evidence-first RAG pipeline with Gemini generation',
      'English and Malayalam answers from the same sources',
      'Explicit “not found in the uploaded documents” responses',
    ],
    endpoint:
      'POST /api/v1/assistant/query\n{ "question": "...", "language": "ml" }',
  },
]

/** Five marketing capabilities, including the cross-cutting trust layer. */
export const FEATURES = [
  {
    id: 'discovery',
    icon: Search,
    capability: 'Discovery',
    title: 'Scheme discovery',
    description:
      'Search curated government schemes and read benefits, documents and application steps in plain language.',
    path: 'schemes',
  },
  {
    id: 'eligibility',
    icon: ListChecks,
    capability: 'Rules engine',
    title: 'Eligibility checker',
    description:
      'Answer a short structured form. Deterministic backend rules explain every match and every mismatch.',
    path: 'eligibility',
  },
  {
    id: 'documents',
    icon: FileStack,
    capability: 'Retrieval',
    title: 'Document intelligence',
    description:
      'Upload official PDFs. Text is extracted, chunked, embedded and indexed with page numbers intact.',
    path: 'documents',
  },
  {
    id: 'assistant',
    icon: MessagesSquare,
    capability: 'Generation',
    title: 'Multilingual assistant',
    description:
      'Ask in English or Malayalam and get grounded answers built only from retrieved evidence.',
    path: 'assistant',
  },
  {
    id: 'evidence',
    icon: ShieldCheck,
    capability: 'Trust layer',
    title: 'Evidence & citations',
    description:
      'Every claim links back to its document and page — and missing evidence is stated clearly, never filled in.',
    path: null,
  },
]
