import { FileText, ListChecks, MessagesSquare, Search } from 'lucide-react'

/**
 * Structural metadata for the four workspace modules. All user-facing copy
 * lives in the i18n catalog under `modules.<catalogKey>`.
 *
 * Only the foundation is live on Day 1. Every module below is an honest UI
 * preview until its milestone lands.
 */
export const MODULES = [
  {
    id: 'schemes',
    catalogKey: 'schemes',
    path: 'schemes',
    icon: Search,
    day: 2,
    status: 'preview',
  },
  {
    id: 'eligibility',
    catalogKey: 'eligibility',
    path: 'eligibility',
    icon: ListChecks,
    day: 2,
    status: 'preview',
  },
  {
    id: 'documents',
    catalogKey: 'documents',
    path: 'documents',
    icon: FileText,
    day: 3,
    status: 'preview',
  },
  {
    id: 'assistant',
    catalogKey: 'assistant',
    path: 'assistant',
    icon: MessagesSquare,
    day: 4,
    status: 'preview',
  },
]
