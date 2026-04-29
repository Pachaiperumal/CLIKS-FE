/**
 * API Client
 * 
 * Centralized HTTP client for all API requests.
 * Provides consistent error handling, headers, and base URL configuration.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

import { config } from '../lib/config';

const API_BASE_URL = config.api.baseUrl;

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

const DEFAULT_TIMEOUT = config.api.timeout;

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

import { ApiError, normalizeError } from './errors';

// ---------------------------------------------------------------------------
// Request Builder
// ---------------------------------------------------------------------------

/**
 * Build the full URL for an API request.
 */
function buildUrl(endpoint, params = null) {
    // Ensure base URL ends with a slash so the URL constructor doesn't drop the last segment (/v1)
    const baseUrl = API_BASE_URL
        ? (API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`)
        : window.location.origin;

    // Remove leading slash from endpoint if present. 
    // If endpoint has a leading slash, new URL(endpoint, baseUrl) resets to the root of the domain.
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = new URL(path, baseUrl);

    if (params) {
        // Detect and ignore React Query context objects
        const isReactQueryContext = params.queryKey && (params.signal instanceof AbortSignal || params.meta);
        
        if (!isReactQueryContext) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }
    }

    return url.toString();
}

/**
 * Build headers for a request.
 * Merges default headers with custom headers and injects Auth token if present.
 */
function buildHeaders(customHeaders = {}) {
    const headers = {
        ...DEFAULT_HEADERS,
        ...customHeaders,
    };

    // Inject token from localStorage
    const token = localStorage.getItem('books_auth_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

// ---------------------------------------------------------------------------
// Core Request Function
// ---------------------------------------------------------------------------

/**
 * Execute an API request.
 * 
 * @param {string} endpoint - API endpoint (e.g., '/users/123')
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {Object} options.body - Request body (will be JSON stringified)
 * @param {Object} options.headers - Custom headers
 * @param {Object} options.params - URL query parameters
 * @param {number} options.timeout - Request timeout in milliseconds
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<any>} - Parsed response data
 * @throws {ApiError} - Normalized error
 */
async function request(endpoint, options = {}) {
    const {
        method = 'GET',
        body = null,
        headers = {},
        params = null,
        timeout = DEFAULT_TIMEOUT,
        signal = null,
    } = options;

    const url = buildUrl(endpoint, params);
    const requestHeaders = buildHeaders(headers);

    // Setup timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Merge external signal with timeout signal
    const combinedSignal = signal
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal;

    const fetchOptions = {
        method,
        headers: requestHeaders,
        signal: combinedSignal,
        credentials: 'same-origin', // Include cookies for same-origin requests
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
    }

    let response;

    try {
        response = await fetch(url, fetchOptions);
    } catch (error) {
        clearTimeout(timeoutId);
        throw await normalizeError(error);
    }

    clearTimeout(timeoutId);

    // Handle error responses
    if (!response.ok) {
        throw await normalizeError(null, response);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
        return null;
    }

    // Parse JSON response
    try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        throw new ApiError(
            'Failed to parse server response',
            response.status,
            'PARSE_ERROR'
        );
    }
}

// ---------------------------------------------------------------------------
// HTTP Method Shortcuts
// ---------------------------------------------------------------------------

/**
 * API Client instance with convenient HTTP method shortcuts.
 */
export const apiClient = {
    /**
     * GET request
     * @param {string} endpoint
     * @param {Object} options - { params, headers, timeout, signal }
     */
    get: (endpoint, options = {}) =>
        request(endpoint, { ...options, method: 'GET' }),

    /**
     * POST request
     * @param {string} endpoint
     * @param {Object} body - Request body
     * @param {Object} options - { headers, timeout, signal }
     */
    post: (endpoint, body = null, options = {}) =>
        request(endpoint, { ...options, method: 'POST', body }),

    /**
     * PUT request
     * @param {string} endpoint
     * @param {Object} body - Request body
     * @param {Object} options - { headers, timeout, signal }
     */
    put: (endpoint, body = null, options = {}) =>
        request(endpoint, { ...options, method: 'PUT', body }),

    /**
     * PATCH request
     * @param {string} endpoint
     * @param {Object} body - Request body
     * @param {Object} options - { headers, timeout, signal }
     */
    patch: (endpoint, body = null, options = {}) =>
        request(endpoint, { ...options, method: 'PATCH', body }),

    /**
     * DELETE request
     * @param {string} endpoint
     * @param {Object} options - { params, headers, timeout, signal }
     */
    delete: (endpoint, options = {}) =>
        request(endpoint, { ...options, method: 'DELETE' }),
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default apiClient;
