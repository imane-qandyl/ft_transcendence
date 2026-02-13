/**
 * XSS Sanitization Utilities
 * 
 * Provides functions to sanitize user input before storage to prevent
 * stored XSS attacks. React auto-escapes on render, but defense-in-depth
 * requires server-side sanitization too.
 */

/**
 * Escape HTML special characters to prevent XSS injection.
 * Converts &, <, >, ", ' to their HTML entity equivalents.
 * 
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Validate that a URL uses a safe protocol.
 * Only allows http:, https:, and data:image/ (for base64 avatars).
 * Rejects javascript:, vbscript:, data:text/html, and other dangerous schemes.
 * 
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL uses a safe protocol
 */
function isValidUrl(url) {
    if (typeof url !== 'string' || url.trim().length === 0) return false;

    const trimmed = url.trim().toLowerCase();

    // Allow http and https
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return true;
    }

    // Allow data:image/ for base64 encoded images only
    if (trimmed.startsWith('data:image/')) {
        return true;
    }

    // Reject everything else (javascript:, vbscript:, data:text/html, etc.)
    return false;
}

/**
 * Sanitize a URL for safe storage.
 * Returns null if the URL uses an unsafe protocol.
 * 
 * @param {string} url - The URL to sanitize
 * @returns {string|null} The sanitized URL or null if unsafe
 */
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (!isValidUrl(url)) return null;
    return url.trim();
}

module.exports = {
    escapeHtml,
    isValidUrl,
    sanitizeUrl,
};
