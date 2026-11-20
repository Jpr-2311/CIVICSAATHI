import { afterEach, describe, expect, it, vi } from 'vitest'

// Hoisted so the mock factory and the assertions share the same spy instances,
// even after vi.resetModules() re-evaluates api.js for each environment case.
const { requestMock, createMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  createMock: vi.fn(() => ({ request: requestMock })),
}))

vi.mock('axios', () => ({
  default: {
    create: createMock,
    isCancel: () => false,
    isAxiosError: () => false,
  },
}))

/** Re-import api.js so its module-level env parsing is re-evaluated. */
async function loadApi(env = {}) {
  vi.resetModules()
  vi.unstubAllEnvs()
  requestMock.mockReset()
  createMock.mockClear()
  requestMock.mockResolvedValue({ data: { ok: true } })

  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value)
  }

  return import('@/services/api')
}

const pdfFile = () =>
  new File(['%PDF-1.4'], 'scheme.pdf', { type: 'application/pdf' })

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('document upload timeout', () => {
  it('uses 300000 ms by default and leaves the shared client at 12000 ms', async () => {
    const api = await loadApi()

    expect(api.documentUploadTimeoutMs).toBe(300000)

    await api.uploadDocument(pdfFile())

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(requestMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        url: '/api/v1/documents/upload',
        method: 'post',
        timeout: 300000,
      }),
    )
    expect(createMock.mock.calls.at(-1)[0]).toEqual(
      expect.objectContaining({ timeout: 12000 }),
    )
  })

  it('honours a valid VITE_DOCUMENT_UPLOAD_TIMEOUT_MS override', async () => {
    const api = await loadApi({ VITE_DOCUMENT_UPLOAD_TIMEOUT_MS: '180000' })

    expect(api.documentUploadTimeoutMs).toBe(180000)

    await api.uploadDocument(pdfFile())

    expect(requestMock.mock.calls[0][0].timeout).toBe(180000)
  })

  it.each(['abc', '', '0', '-5', 'Infinity', '-Infinity', 'NaN'])(
    'falls back to 300000 ms for invalid value %j',
    async (value) => {
      const api = await loadApi({ VITE_DOCUMENT_UPLOAD_TIMEOUT_MS: value })

      expect(api.documentUploadTimeoutMs).toBe(300000)

      await api.uploadDocument(pdfFile())

      expect(requestMock.mock.calls[0][0].timeout).toBe(300000)
    },
  )

  it('does not change the shared or assistant timeouts', async () => {
    const api = await loadApi({ VITE_DOCUMENT_UPLOAD_TIMEOUT_MS: '180000' })

    await api.getHealth()
    await api.askAssistant({ question: 'q', language: 'en' })

    const [healthConfig, assistantConfig] = requestMock.mock.calls.map(
      (call) => call[0],
    )

    expect(healthConfig).not.toHaveProperty('timeout')
    expect(assistantConfig.timeout).toBe(300000)
    expect(createMock.mock.calls.at(-1)[0]).toEqual(
      expect.objectContaining({ timeout: 12000 }),
    )
  })

  it('preserves upload progress reporting and AbortSignal support', async () => {
    const { signal } = new AbortController()
    const onUploadProgress = vi.fn()
    const api = await loadApi()

    await api.uploadDocument(pdfFile(), { signal, onUploadProgress })

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/v1/documents/upload',
        method: 'post',
        signal,
        onUploadProgress,
        timeout: 300000,
      }),
    )
  })
})
