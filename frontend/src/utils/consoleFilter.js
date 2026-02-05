/**
 * Console Filter - Suppress expected/non-critical errors
 * Keeps console clean while preserving important errors
 */

const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Patterns that are expected and non-critical
const SUPPRESSED_ERROR_PATTERNS = [
  /WebSocket connection.*failed/i,
  /wss?:.*failed/i,
  /Connection error.*websocket/i,
  /Failed to establish a new connection/i,
  /Network error/i,
  /socket\.io.*failed/i,
  /GET.*\/api\/v1\/characters\/me.*404/i,
  /xhr\.js/i,
  /dispatchXhrRequest/i,
];

// Patterns to suppress entirely (no output)
const SUPPRESSED_WARN_PATTERNS = [
  /websocket/i,
  /socket/i,
  /connection/i,
];

// Patterns that are info level (demote to log)
const INFO_PATTERNS = [
  /connection error/i,
  /reconnect/i,
  /disconnect/i,
  /not found.*404/i,
];

/**
 * Check if a value should be suppressed
 */
function shouldSuppress(args, patterns) {
  if (!args || args.length === 0) return false;
  
  const message = args[0]?.toString?.() || String(args[0] || '');
  const fullMessage = args.map(a => a?.toString?.() || String(a || '')).join(' ');
  
  return patterns.some(pattern => pattern.test(message) || pattern.test(fullMessage));
}

/**
 * Filter console.error to suppress expected errors
 */
console.error = function (...args) {
  // Suppress WebSocket/connection/404 errors - they're handled by reconnection logic
  if (shouldSuppress(args, SUPPRESSED_ERROR_PATTERNS)) {
    return;
  }
  
  // Demote connection info to log level
  if (shouldSuppress(args, INFO_PATTERNS)) {
    originalLog('[INFO]', ...args);
    return;
  }
  
  // Pass through all other errors
  originalError.call(console, ...args);
};

/**
 * Filter console.warn - suppress expected warnings
 */
console.warn = function (...args) {
  // Suppress websocket/socket/connection warnings entirely
  if (shouldSuppress(args, SUPPRESSED_WARN_PATTERNS)) {
    return;
  }
  
  originalWarn.call(console, ...args);
};

/**
 * Intercept XMLHttpRequest errors from being logged
 */
const OriginalXMLHttpRequest = XMLHttpRequest;
XMLHttpRequest.prototype.addEventListener = (function (original) {
  return function (type, listener, ...args) {
    if (type === 'error' || type === 'abort') {
      // Wrap error listeners to suppress 404 character not found
      const wrappedListener = function (e) {
        if (e?.target?.status === 404 && e?.target?.responseURL?.includes('/characters/me')) {
          // Suppress 404 for character endpoint
          return;
        }
        return listener.apply(this, arguments);
      };
      return original.call(this, type, wrappedListener, ...args);
    }
    return original.call(this, type, listener, ...args);
  };
})(XMLHttpRequest.prototype.addEventListener);

export default {
  enable: () => {
    console.log('✓ Console filter enabled - suppressing non-critical connection errors');
  }
};

