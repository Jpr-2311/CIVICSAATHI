import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Topbar from '@/components/layout/Topbar'
import LanguageProvider from '@/i18n/LanguageProvider'
import AssistantPage from '@/pages/AssistantPage'
import DashboardPage from '@/pages/DashboardPage'
import DocumentsPage from '@/pages/DocumentsPage'
import EligibilityPage from '@/pages/EligibilityPage'
import SchemeDetailPage from '@/pages/SchemeDetailPage'

vi.mock('@/services/api', () => ({
  API_PREFIX: '/api/v1',
  apiBaseUrl: 'http://127.0.0.1:8000',
  apiDocsUrl: () => 'http://127.0.0.1:8000/docs',
  askAssistant: vi.fn(),
  checkEligibility: vi.fn(),
  deleteDocument: vi.fn(),
  getDocument: vi.fn(),
  getScheme: vi.fn(),
  getSchemes: vi.fn(),
  isCanceled: vi.fn(() => false),
  listDocuments: vi.fn(),
  searchDocuments: vi.fn(),
  toApiError: vi.fn((error) => ({
    message: error?.message ?? 'API error',
    code: error?.code ?? error?.response?.data?.code ?? null,
    status: error?.response?.status ?? null,
  })),
  uploadDocument: vi.fn(),
}))

import {
  askAssistant,
  checkEligibility,
  getDocument,
  getScheme,
  getSchemes,
  listDocuments,
} from '@/services/api'

const SYSTEM = {
  state: {
    status: 'ready',
    health: { status: 'ok' },
    readiness: {
      status: 'ready',
      checks: [
        { id: 'scheme_dataset', status: 'ok' },
        { id: 'vector_store', status: 'ok' },
        { id: 'gemini', status: 'ok' },
      ],
    },
    latencyMs: 18,
    error: null,
    checkedAt: new Date('2026-11-18T10:00:00Z').toISOString(),
  },
  refresh: vi.fn(),
  refreshing: false,
}

const INDEXED_DOCUMENT = {
  document_id: 'doc-1',
  original_filename: 'farm-notice.pdf',
  status: 'indexed',
  size_bytes: 24_576,
  page_count: 2,
  chunk_count: 8,
  uploaded_at: '2026-11-18T09:00:00Z',
}

const OCR_DOCUMENT = {
  document_id: 'doc-2',
  original_filename: 'scanned-notice.pdf',
  status: 'needs_ocr',
  size_bytes: 40_960,
  page_count: 1,
  chunk_count: 0,
  uploaded_at: '2026-11-18T08:00:00Z',
}

const SCHEME_DETAIL = {
  id: 'farm-support',
  name: 'Farm support',
  summary: 'Support for registered farmers.',
  description: 'A curated pilot scheme for small farmers.',
  category: 'agriculture',
  government_level: 'state',
  state: 'Kerala',
  department: 'Department of Agriculture',
  verified_on: '2026-10-01',
  benefits: ['Crop support', 'Income certificate guidance'],
  documents_required: ['Income certificate', 'Identity proof'],
  application_steps: ['Apply online', 'Submit documents at the village office'],
  conditions: [{ id: 'kerala_resident', label: 'Kerala resident', manual: false }],
  source: {
    url: 'https://example.invalid/farm-support',
    title: 'Official notice',
    publisher: 'Department of Agriculture',
  },
  additional_sources: [],
  content_note: 'Curated prototype content.',
  disclaimer: 'Not an official decision.',
}

const GROUNDED = {
  answer: 'Submit an income certificate to the village office.',
  language: 'en',
  evidence_found: true,
  insufficient_evidence: false,
  citations: [
    {
      evidence_id: 'e1',
      document_id: 'doc-1',
      document_title: 'farm-notice.pdf',
      page: 4,
      excerpt: 'Applicants must submit an income certificate.',
    },
  ],
  message: 'Answer grounded in the cited passages.',
  disclaimer: 'Prototype notice.',
  similarity_notice: 'Similarity is not proof of factuality.',
}

function LocationProbe() {
  const location = useLocation()
  return (
    <div
      data-testid="router-location"
      data-pathname={location.pathname}
      data-search={location.search}
      data-state={JSON.stringify(location.state ?? null)}
    />
  )
}

function AppOutlet() {
  return <Outlet context={{ system: SYSTEM }} />
}

function renderJourney({ route = '/app', withTopbar = false } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        {withTopbar ? (
          <Topbar system={SYSTEM} title="CIVICSAATHI workspace" onOpenNav={() => {}} />
        ) : null}
        <Routes>
          <Route path="/app" element={<AppOutlet />}>
            <Route index element={<DashboardPage />} />
            <Route path="schemes/:schemeId" element={<SchemeDetailPage />} />
            <Route path="eligibility" element={<EligibilityPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="assistant" element={<AssistantPage />} />
          </Route>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
        <LocationProbe />
      </LanguageProvider>
    </MemoryRouter>,
  )
}

function metricCard(label) {
  return label.closest('div.rounded-xl')
}

function askQuestion(question = 'What documents are required?') {
  fireEvent.change(screen.getByLabelText('Your question'), {
    target: { value: question },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Send question' }))
}

beforeEach(() => {
  // jsdom does not implement scrollIntoView; the eligibility page uses it after
  // a successful check.
  Element.prototype.scrollIntoView = vi.fn()
  vi.clearAllMocks()
  getSchemes.mockResolvedValue({ total: 12, schemes: [] })
  listDocuments.mockResolvedValue({ documents: [INDEXED_DOCUMENT, OCR_DOCUMENT], total: 2 })
  getScheme.mockResolvedValue(SCHEME_DETAIL)
  getDocument.mockResolvedValue({
    ...INDEXED_DOCUMENT,
    checksum: 'abc123',
    metadata: { title: 'Kerala Farm Support Notice' },
  })
  checkEligibility.mockResolvedValue({
    profile_fields_received: ['age'],
    checked_at: '2026-11-18T10:00:00Z',
    results: [
      {
        scheme_id: 'farm-support',
        scheme_name: 'Farm support',
        category: 'agriculture',
        government_level: 'state',
        outcome: 'potentially_eligible',
        outcome_message: 'This scheme may be open to you.',
        summary: 'Support for registered farmers.',
        conditions: [],
        groups: [],
        source: SCHEME_DETAIL.source,
      },
      {
        scheme_id: 'other-scheme',
        scheme_name: 'Other scheme',
        category: 'health',
        government_level: 'central',
        outcome: 'insufficient_information',
        outcome_message: 'More information is needed.',
        summary: 'A different scheme.',
        conditions: [],
        groups: [],
        source: SCHEME_DETAIL.source,
      },
    ],
  })
  askAssistant.mockResolvedValue(GROUNDED)
})

describe('Day 5 connected journey', () => {
  it('shows real dashboard totals and honest errors, with mobile-first grids', async () => {
    const { container } = renderJourney()

    const schemesLabel = await screen.findByText('Verified schemes')
    await waitFor(() =>
      expect(within(metricCard(schemesLabel)).getByText('12')).toBeTruthy(),
    )
    const documentsLabel = screen.getByText('Documents indexed')
    await waitFor(() =>
      expect(within(metricCard(documentsLabel)).getByText('2')).toBeTruthy(),
    )
    expect(screen.queryByText('Recent activity')).toBeNull()
    expect(screen.queryByText('Sample activity')).toBeNull()
    expect(container.innerHTML).toContain('grid-cols-1')
    expect(container.innerHTML).toContain('sm:grid-cols-2')
    expect(container.innerHTML).toContain('xl:grid-cols-4')

    expect(getSchemes).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, page_size: 1, language: 'en' }),
    )
  })

  it('marks unavailable dashboard totals instead of inventing a count', async () => {
    getSchemes.mockRejectedValueOnce(new Error('API offline'))
    renderJourney()

    const label = await screen.findByText('Verified schemes')
    await waitFor(() =>
      expect(within(metricCard(label)).getByText('Unavailable')).toBeTruthy(),
    )
    expect(within(metricCard(label)).queryByText('12')).toBeNull()
  })

  it('carries a scheme into eligibility without changing the eligibility payload', async () => {
    renderJourney({ route: '/app/schemes/farm-support' })

    const eligibilityCta = await screen.findByRole('link', {
      name: 'Check your eligibility',
    })
    expect(eligibilityCta.getAttribute('href')).toBe(
      '/app/eligibility?scheme_id=farm-support',
    )
    fireEvent.click(eligibilityCta)

    await waitFor(() =>
      expect(screen.getByText('Checking: Farm support')).toBeTruthy(),
    )
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '34' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check eligibility' }))

    await screen.findByText('This scheme may be open to you.')
    expect(screen.queryByText('A different scheme.')).toBeNull()
    expect(checkEligibility).toHaveBeenCalledTimes(1)
    expect(checkEligibility.mock.calls[0][0]).toEqual({
      language: 'en',
      age: 34,
    })
    expect(checkEligibility.mock.calls[0][0]).not.toHaveProperty('scheme_id')
  })

  it('hands an indexed document to the assistant and inspects the returned citation', async () => {
    const { container } = renderJourney({ route: '/app/documents' })

    await screen.findByRole('link', { name: 'Ask about this PDF' })
    const filter = screen.getByLabelText('All documents')
    expect(Array.from(filter.options).map((option) => option.value)).toEqual([
      '',
      'doc-1',
    ])
    expect(screen.getByText('Not searchable yet')).toBeTruthy()
    expect(container.innerHTML).toContain('flex-wrap')

    fireEvent.click(screen.getByRole('link', { name: 'Ask about this PDF' }))
    await waitFor(() =>
      expect(screen.getByTestId('router-location').dataset.search).toBe(
        '?document=doc-1',
      ),
    )

    askQuestion()
    await screen.findByText(GROUNDED.answer)
    expect(askAssistant).toHaveBeenCalledWith({
      question: 'What documents are required?',
      language: 'en',
      document_id: 'doc-1',
    })

    fireEvent.click(screen.getByRole('link', { name: 'Inspect source' }))
    await waitFor(() =>
      expect(screen.getByTestId('router-location').dataset.search).toBe(
        '?document=doc-1&page=4',
      ),
    )

    const state = JSON.parse(
      screen.getByTestId('router-location').dataset.state ?? 'null',
    )
    expect(state.citation).toEqual(GROUNDED.citations[0])
    expect(await screen.findByText('Citation from the assistant')).toBeTruthy()
    expect(screen.getByText('Cited page 4')).toBeTruthy()
    expect(screen.getByText('Evidence e1')).toBeTruthy()
    expect(screen.getByText(GROUNDED.citations[0].excerpt)).toBeTruthy()
    expect(getDocument).toHaveBeenCalledWith('doc-1')
  })

  it('keeps a cited excerpt visible when the cited document was deleted', async () => {
    const citation = {
      ...GROUNDED.citations[0],
      document_id: 'deleted-doc',
      document_title: 'deleted-notice.pdf',
    }
    renderJourney({
      route: {
        pathname: '/app/documents',
        search: '?document=deleted-doc&page=4',
        state: { citation },
      },
    })

    expect(await screen.findByText('Citation from the assistant')).toBeTruthy()
    expect(screen.getByText(citation.excerpt)).toBeTruthy()
    await waitFor(() =>
      expect(
        screen.getAllByText(/It may have been deleted from the library/).length,
      ).toBeGreaterThan(0),
    )
    expect(getDocument).not.toHaveBeenCalled()
  })

  it('preserves the route and document context while switching the interface language', async () => {
    renderJourney({
      route: '/app/assistant?document=doc-1',
      withTopbar: true,
    })
    await screen.findByRole('option', { name: 'farm-notice.pdf' })

    askQuestion('What documents are required?')
    await screen.findByText(GROUNDED.answer)

    const switches = screen.getAllByLabelText('Choose a language')
    fireEvent.change(switches[0], { target: { value: 'ml' } })

    await waitFor(() => expect(askAssistant).toHaveBeenCalledTimes(2))
    expect(askAssistant.mock.calls[1][0]).toEqual({
      question: 'What documents are required?',
      language: 'ml',
      document_id: 'doc-1',
    })
    expect(screen.getByTestId('router-location').dataset.search).toBe(
      '?document=doc-1',
    )
  })
})
