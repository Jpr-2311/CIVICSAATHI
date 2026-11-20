import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LanguageProvider from '@/i18n/LanguageProvider'
import AssistantPage from '@/pages/AssistantPage'
import { askAssistant, listDocuments } from '@/services/api'

vi.mock('@/services/api', () => ({
  askAssistant: vi.fn(),
  listDocuments: vi.fn(),
  toApiError: vi.fn((error) => ({
    message: error?.message ?? 'API error',
    code: error?.code ?? error?.response?.data?.code ?? null,
    status: error?.response?.status ?? null,
  })),
}))

function LocationProbe() {
  const location = useLocation()
  return (
    <div
      data-testid="router-location"
      data-search={location.search}
      data-state={JSON.stringify(location.state ?? null)}
    />
  )
}

const grounded = {
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
  similarity_notice: 'Similarity notice.',
}

function renderPage({ route = '/app/assistant' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <Routes>
          <Route
            path="/app/assistant"
            element={
              <>
                <AssistantPage />
                <LocationProbe />
              </>
            }
          />
          <Route path="/app/documents" element={<LocationProbe />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>,
  )
}

function ask(question = 'What documents are required?') {
  fireEvent.change(document.getElementById('assistant-question'), {
    target: { value: question },
  })
  fireEvent.click(document.querySelector('form button[type="submit"]'))
}

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.setItem('civicsaathi.language', 'en')
  listDocuments.mockResolvedValue({ documents: [] })
})

describe('AssistantPage', () => {
  it('shows an honest empty state and never a fake answer', () => {
    renderPage()
    expect(screen.getByText('Start with a question')).toBeTruthy()
    expect(screen.queryByText('demo_notification.pdf')).toBeNull()
    expect(screen.queryByText(grounded.answer)).toBeNull()
    expect(askAssistant).not.toHaveBeenCalled()
  })

  it('submits a real question and renders the backend answer and citation', async () => {
    askAssistant.mockResolvedValue(grounded)
    renderPage()
    ask()

    await waitFor(() => expect(screen.getByText(grounded.answer)).toBeTruthy())
    expect(askAssistant).toHaveBeenCalledWith({
      question: 'What documents are required?',
      language: 'en',
      document_id: null,
    })

    expect(screen.getByText('farm-notice.pdf')).toBeTruthy()
    expect(screen.getByText('Page 4')).toBeTruthy()
    const details = screen.getByText('farm-notice.pdf').closest('details')
    expect(details?.open).toBe(false)
    expect(screen.getByText(grounded.citations[0].excerpt)).toBeTruthy()
  })

  it('shows a loading state while waiting', () => {
    askAssistant.mockReturnValue(new Promise(() => {}))
    renderPage()
    ask()
    expect(screen.getByText('Reading your documents…')).toBeTruthy()
    expect(screen.getByText('Reading your documents…').closest('[aria-busy]')).toBeTruthy()
  })

  it('shows the insufficient-evidence answer from the backend', async () => {
    const insufficient = {
      answer:
        "I couldn't find sufficient information in the uploaded government documents to answer this question reliably. Please upload the relevant official document.",
      language: 'en',
      evidence_found: false,
      insufficient_evidence: true,
      citations: [],
    }
    askAssistant.mockResolvedValue(insufficient)
    renderPage()
    ask('Unsupported question?')

    await waitFor(() =>
      expect(
        screen.getByText('Not enough information in the documents'),
      ).toBeTruthy(),
    )
    expect(screen.getByText(insufficient.answer)).toBeTruthy()
    expect(screen.queryByText('farm-notice.pdf')).toBeNull()
  })

  it('shows an API error with a working retry', async () => {
    askAssistant
      .mockRejectedValueOnce(new Error('service unavailable'))
      .mockResolvedValueOnce(grounded)
    renderPage()
    ask()

    await waitFor(() =>
      expect(screen.getByText('The assistant could not answer')).toBeTruthy(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.getByText(grounded.answer)).toBeTruthy())
    expect(askAssistant).toHaveBeenCalledTimes(2)
  })

  it('sends the selected answer language to the API', async () => {
    askAssistant.mockResolvedValue({ ...grounded, language: 'ml' })
    renderPage()
    fireEvent.change(screen.getByLabelText('Answer language'), {
      target: { value: 'ml' },
    })
    ask('കർഷക സഹായം')

    await waitFor(() =>
      expect(askAssistant).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'ml', question: 'കർഷക സഹായം' }),
      ),
    )
  })

  it('passes an optional document filter to the API', async () => {
    listDocuments.mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          original_filename: 'farm-notice.pdf',
          status: 'indexed',
        },
      ],
    })
    askAssistant.mockResolvedValue(grounded)
    renderPage()

    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'farm-notice.pdf' }),
      ).toBeTruthy(),
    )
    fireEvent.change(screen.getByLabelText('Search within'), {
      target: { value: 'doc-1' },
    })
    ask()

    await waitFor(() =>
      expect(askAssistant).toHaveBeenCalledWith(
        expect.objectContaining({ document_id: 'doc-1' }),
      ),
    )
  })

  it('recovers from a stale document selection in the URL', async () => {
    listDocuments.mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          original_filename: 'farm-notice.pdf',
          status: 'indexed',
        },
      ],
    })
    renderPage({ route: '/app/assistant?document=deleted-doc' })

    await waitFor(() =>
      expect(screen.getByText('That document is no longer available')).toBeTruthy(),
    )
    await waitFor(() =>
      expect(screen.getByTestId('router-location').dataset.search).toBe(''),
    )
    ask()
    await waitFor(() =>
      expect(askAssistant).toHaveBeenCalledWith(
        expect.objectContaining({ document_id: null }),
      ),
    )
  })

  it('recovers when the backend reports document_not_found', async () => {
    listDocuments.mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          original_filename: 'farm-notice.pdf',
          status: 'indexed',
        },
      ],
    })
    askAssistant.mockRejectedValueOnce({
      response: { status: 404, data: { code: 'document_not_found' } },
    })
    renderPage({ route: '/app/assistant?document=doc-1' })
    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'farm-notice.pdf' }),
      ).toBeTruthy(),
    )

    ask()
    await waitFor(() =>
      expect(screen.getByText('That document is no longer available')).toBeTruthy(),
    )
    await waitFor(() =>
      expect(screen.getByTestId('router-location').dataset.search).toBe(''),
    )
    expect(screen.queryByText('The assistant could not answer')).toBeNull()
  })

  it('links a citation to an in-app source inspection with backend metadata', async () => {
    askAssistant.mockResolvedValue(grounded)
    renderPage()
    ask()

    const link = await screen.findByRole('link', { name: 'Inspect source' })
    expect(link.getAttribute('href')).toBe(
      '/app/documents?document=doc-1&page=4',
    )
    const state = JSON.parse(
      screen.getByTestId('router-location').dataset.state ?? 'null',
    )
    expect(state).toBeNull()

    fireEvent.click(link)
    await waitFor(() => {
      const location = screen.getByTestId('router-location')
      expect(location.dataset.search).toBe('?document=doc-1&page=4')
      expect(JSON.parse(location.dataset.state).citation.document_id).toBe(
        'doc-1',
      )
    })
  })

  it('shows a retryable notice when indexed documents cannot be loaded', async () => {
    listDocuments.mockRejectedValueOnce(new Error('network down'))
    listDocuments.mockResolvedValueOnce({ documents: [] })
    renderPage()

    await waitFor(() =>
      expect(
        screen.getByText('Indexed documents could not be loaded'),
      ).toBeTruthy(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retry document list' }))
    await waitFor(() =>
      expect(
        screen.queryByText('Indexed documents could not be loaded'),
      ).toBeNull(),
    )
    expect(listDocuments).toHaveBeenCalledTimes(2)
  })

  it('keeps document context when the language changes and re-asks the question', async () => {
    listDocuments.mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          original_filename: 'farm-notice.pdf',
          status: 'indexed',
        },
      ],
    })
    askAssistant
      .mockResolvedValueOnce(grounded)
      .mockResolvedValueOnce({
        ...grounded,
        language: 'ml',
        answer: 'Malayalam answer from the same passage.',
      })
    renderPage({ route: '/app/assistant?document=doc-1' })
    await screen.findByRole('option', { name: 'farm-notice.pdf' })

    ask('What documents are required?')
    await screen.findByText(grounded.answer)
    fireEvent.change(screen.getByLabelText('Answer language'), {
      target: { value: 'ml' },
    })

    await waitFor(() => expect(askAssistant).toHaveBeenCalledTimes(2))
    expect(askAssistant.mock.calls[1][0]).toEqual({
      question: 'What documents are required?',
      language: 'ml',
      document_id: 'doc-1',
    })
    expect(screen.getByTestId('router-location').dataset.search).toBe(
      '?document=doc-1',
    )
    await screen.findByText('Malayalam answer from the same passage.')
  })

  it.each([
    ['gemini_unavailable', 'The AI service is temporarily unavailable'],
    ['gemini_rate_limited', 'The AI service is busy'],
    ['gemini_timeout', 'The AI service took too long'],
    ['assistant_not_configured', 'The assistant is not configured'],
    ['timeout', 'The request took too long'],
    ['network_error', 'Cannot reach the assistant'],
  ])('maps %s to localized, safe copy', async (code, title) => {
    const rawProviderText = 'ServerError 503 internal-provider-detail'
    askAssistant.mockRejectedValueOnce({ code, message: rawProviderText })
    renderPage()
    ask()

    await waitFor(() => expect(screen.getByText(title)).toBeTruthy())
    expect(screen.queryByText(rawProviderText)).toBeNull()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  it('falls back to the safe API message for an unknown code', async () => {
    askAssistant.mockRejectedValueOnce({
      code: 'http_500',
      message: 'The API returned an unexpected 500 response.',
    })
    renderPage()
    ask()

    await waitFor(() =>
      expect(screen.getByText('The assistant could not answer')).toBeTruthy(),
    )
    expect(
      screen.getByText('The API returned an unexpected 500 response.'),
    ).toBeTruthy()
  })

  it('retries the last question after a mapped outage error', async () => {
    askAssistant
      .mockRejectedValueOnce({
        code: 'gemini_unavailable',
        message: 'ServerError 503 internal-provider-detail',
      })
      .mockResolvedValueOnce(grounded)
    renderPage()
    ask('What documents are required?')

    await screen.findByText('The AI service is temporarily unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText(grounded.answer)
    expect(askAssistant).toHaveBeenCalledTimes(2)
    expect(askAssistant.mock.calls[1][0]).toEqual({
      question: 'What documents are required?',
      language: 'en',
      document_id: null,
    })
  })
})
