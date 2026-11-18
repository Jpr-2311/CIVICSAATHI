import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LanguageProvider from '@/i18n/LanguageProvider'
import AssistantPage from '@/pages/AssistantPage'
import { askAssistant, listDocuments } from '@/services/api'

vi.mock('@/services/api', () => ({
  askAssistant: vi.fn(),
  listDocuments: vi.fn(),
}))

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

function renderPage() {
  return render(
    <LanguageProvider>
      <AssistantPage />
    </LanguageProvider>,
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
})
