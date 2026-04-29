/**
 * API Error Handling
 * 
 * Contains the ApiError class and error normalization logic.
 */

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

/**
 * Normalized API error class.
 * All API errors are transformed into this structure for consistent handling.
 */
export class ApiError extends Error {
    constructor(message, status, code, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;       // HTTP status code (e.g., 404, 500)
        this.code = code;           // Application-specific error code (e.g., 'VALIDATION_ERROR')
        this.details = details;     // Additional error details (e.g., field errors)
        this.timestamp = new Date().toISOString();
    }

    /**
     * Check if the error is a client error (4xx)
     */
    isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    /**
     * Check if the error is a server error (5xx)
     */
    isServerError() {
        return this.status >= 500;
    }

    /**
     * Check if the error is a network/connectivity error
     */
    isNetworkError() {
        return this.status === 0;
    }

    /**
     * Serialize error for logging
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            status: this.status,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
        };
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get default error message based on HTTP status code.
 */
function getDefaultErrorMessage(status) {
    const messages = {
        400: 'Bad request. Please check your input.',
        401: 'Authentication required.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        408: 'Request timeout. Please try again.',
        409: 'Conflict. The resource may already exist.',
        422: 'Validation failed. Please check your input.',
        429: 'Too many requests. Please slow down.',
        500: 'Internal server error. Please try again later.',
        502: 'Bad gateway. Please try again later.',
        503: 'Service unavailable. Please try again later.',
        504: 'Gateway timeout. Please try again later.',
    };

    return messages[status] || `Request failed with status ${status}`;
}

/**
 * Parse error response body safely.
 * Handles various backend error response formats.
 */
async function parseErrorResponse(response) {
    try {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const body = await response.json();
            
            // Extract error info from different potential formats
            let message = body.message || 'An error occurred';
            let code = body.code || `HTTP_${response.status}`;
            let details = body.details || body.errors || null;

            if (body.error && typeof body.error === 'object') {
                message = body.error.message || message;
                code = body.error.code || code;
                details = body.error.details || details;
            } else if (typeof body.error === 'string') {
                message = body.error;
            }

            return { message, code, details };
        }

        // Non-JSON response
        const text = await response.text();
        return {
            message: text || getDefaultErrorMessage(response.status),
            code: `HTTP_${response.status}`,
            details: null,
        };
    } catch {
        return {
            message: getDefaultErrorMessage(response.status),
            code: `HTTP_${response.status}`,
            details: null,
        };
    }
}

// ---------------------------------------------------------------------------
// Error Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize any error into an ApiError instance.
 */
export async function normalizeError(error, response = null) {
    // Already an ApiError
    if (error instanceof ApiError) {
        return error;
    }

    // Fetch response error
    if (response && !response.ok) {
        const { message, code, details } = await parseErrorResponse(response);
        return new ApiError(message, response.status, code, details);
    }

    // Network/connectivity error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return new ApiError(
            'Network error. Please check your connection.',
            0,
            'NETWORK_ERROR'
        );
    }

    // Abort error (timeout)
    if (error.name === 'AbortError') {
        return new ApiError(
            'Request timed out. Please try again.',
            0,
            'TIMEOUT_ERROR'
        );
    }

    // Unknown error
    return new ApiError(
        error.message || 'An unexpected error occurred',
        0,
        'UNKNOWN_ERROR'
    );
}
