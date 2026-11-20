import axios from 'axios'

import { normalizeApiBaseUrl } from './apiConfig'

export const API_PREFIX = '/api/v1'

// Production must set VITE_API_BASE_URL to the Render API origin. There is
// intentionally no localhost fallback in browser bundles.
export const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
export const isApiBaseConfigured = Boolean(apiBaseUrl)

// The assistant route retrieves evidence and may make several provider
// attempts, so it uses its own timeout. Other routes keep the shared default.
// The fallback covers the current 270s backend retry budget with overhead.
const DEFAULT_ASSISTANT_TIMEOUT_MS = 300000

function resolveAssistantTimeoutMs() {
  const configured = Number(import.meta.env.VITE_ASSISTANT_TIMEOUT_MS)
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_ASSISTANT_TIMEOUT_MS
}

export const assistantTimeoutMs = resolveAssistantTimeoutMs()

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12000,
  headers: { Accept: 'application/json' },
})

export class ApiError extends Error {
  constructor(message, { status = null, code = 'unknown', cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.cause = cause
  }
}

export function isCanceled(error) {
  return error instanceof ApiError && error.code === 'canceled'
}

/** Convert axios/network failures into messages a citizen can act on. */
export function toApiError(error) {
  if (error instanceof ApiError) return error

  if (axios.isCancel(error)) {
    return new ApiError('This request was replaced by a newer one.', {
      code: 'canceled',
      cause: error,
    })
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError(
        'The CIVICSAATHI API took too long to respond. Check that the backend is running and try again.',
        { code: 'timeout', cause: error },
      )
    }

    if (!error.response) {
      return new ApiError(
        `Cannot reach the CIVICSAATHI API at ${apiBaseUrl}. Start the FastAPI server and retry.`,
        { code: 'network_error', cause: error },
      )
    }

    const { status, data } = error.response
    const detail = data?.detail

    return new ApiError(
      typeof detail === 'string'
        ? detail
        : `The API returned an unexpected ${status} response.`,
      {
        status,
        code: data?.code || `http_${status}`,
        cause: error,
      },
    )
  }

  return new ApiError(
    'Something went wrong while contacting the CIVICSAATHI API.',
    { cause: error },
  )
}

function toParams(params) {
  if (!params) return undefined

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )
}

async function request(
  path,
  { method = 'get', params, data, signal, onUploadProgress, timeout } = {},
) {
  if (import.meta.env.PROD && !isApiBaseConfigured) {
    throw new ApiError(
      'The CIVICSAATHI API base URL is not configured. Set VITE_API_BASE_URL to the backend origin and rebuild.',
      { code: 'api_base_url_missing' },
    )
  }

  try {
    const response = await api.request({
      url: path,
      method,
      params: toParams(params),
      data,
      signal,
      onUploadProgress,
      ...(timeout ? { timeout } : {}),
    })
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export function getHealth() {
  return request(`${API_PREFIX}/health`)
}

export function getReadiness() {
  return request(`${API_PREFIX}/health/readiness`)
}

export function getSystemInfo() {
  return request(`${API_PREFIX}/system/info`)
}

/**
 * Search the curated scheme catalogue.
 *
 * @param {{q?: string, category?: string, government_level?: string,
 *          page?: number, page_size?: number, language?: string}} params
 * @param {{signal?: AbortSignal}} options
 */
export function getSchemes(params = {}, options = {}) {
  return request(`${API_PREFIX}/schemes`, {
    params,
    signal: options.signal,
  })
}

/** Read one curated scheme by id. */
export function getScheme(schemeId, params = {}, options = {}) {
  return request(`${API_PREFIX}/schemes/${encodeURIComponent(schemeId)}`, {
    params,
    signal: options.signal,
  })
}

/** Evaluate every curated scheme with the deterministic rules engine. */
export function checkEligibility(profile, options = {}) {
  return request(`${API_PREFIX}/eligibility/check`, {
    method: 'post',
    data: profile,
    signal: options.signal,
  })
}

/** List stored PDFs with their processing status and passage counts. */
export function listDocuments(options = {}) {
  return request(`${API_PREFIX}/documents`, { signal: options.signal })
}

/** Read one document's full metadata (never a local filesystem path). */
export function getDocument(documentId, options = {}) {
  return request(`${API_PREFIX}/documents/${encodeURIComponent(documentId)}`, {
    signal: options.signal,
  })
}

/** Upload and index a PDF. Progress is reported by axios as a percentage. */
export function uploadDocument(file, options = {}) {
  const form = new FormData()
  form.append('file', file)
  return request(`${API_PREFIX}/documents/upload`, {
    method: 'post',
    data: form,
    signal: options.signal,
    onUploadProgress: options.onUploadProgress,
  })
}

/** Delete a document, its stored PDF and all of its indexed passages. */
export function deleteDocument(documentId, options = {}) {
  return request(`${API_PREFIX}/documents/${encodeURIComponent(documentId)}`, {
    method: 'delete',
    signal: options.signal,
  })
}

/** Retrieve real source passages with page citations. */
export function searchDocuments(payload, options = {}) {
  return request(`${API_PREFIX}/documents/search`, {
    method: 'post',
    data: payload,
    signal: options.signal,
  })
}

/**
 * Ask a grounded question. Retrieval plus generation can take longer than a
 * normal API call, so this route uses a longer client-side timeout.
 *
 * @param {{question: string, language: string, document_id?: string|null}} payload
 * @param {{signal?: AbortSignal}} options
 */
export function askAssistant(payload, options = {}) {
  return request(`${API_PREFIX}/assistant/ask`, {
    method: 'post',
    data: payload,
    signal: options.signal,
    timeout: assistantTimeoutMs,
  })
}

export function apiDocsUrl() {
  return `${apiBaseUrl}/docs`
}

export default api
