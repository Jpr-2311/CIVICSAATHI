import { FileText, ListChecks, MessagesSquare, Search } from 'lucide-react'

/**
 * Structural metadata for the four workspace modules. All user-facing copy
 * lives in the i18n catalog under `modules.<catalogKey>`.
 *
 * Scheme discovery and eligibility are live from Day 2, document intelligence
 * from Day 3, and the evidence-grounded assistant from Day 4.
 */
export const MODULES = [
  {
    id: 'schemes',
    catalogKey: 'schemes',
    path: 'schemes',
    icon: Search,
    day: 2,
    status: 'live',
  },
  {
    id: 'eligibility',
    catalogKey: 'eligibility',
    path: 'eligibility',
    icon: ListChecks,
    day: 2,
    status: 'live',
  },
  {
    id: 'documents',
    catalogKey: 'documents',
    path: 'documents',
    icon: FileText,
    day: 3,
    status: 'live',
  },
  {
    id: 'assistant',
    catalogKey: 'assistant',
    path: 'assistant',
    icon: MessagesSquare,
    day: 4,
    status: 'live',
  },
]
