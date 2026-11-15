import axios from 'axios'

export const API_PREFIX = '/api/v1'

export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

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

/** Convert axios/network failures into messages a citizen can act on. */
export function toApiError(error) {
  if (error instanceof ApiError) return error

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

async function get(path) {
  try {
    const { data } = await api.get(path)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export function getHealth() {
  return get(`${API_PREFIX}/health`)
}

export function getReadiness() {
  return get(`${API_PREFIX}/health/readiness`)
}

export function getSystemInfo() {
  return get(`${API_PREFIX}/system/info`)
}

export function apiDocsUrl() {
  return `${apiBaseUrl}/docs`
}

export default api
