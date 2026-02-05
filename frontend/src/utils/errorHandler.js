/**
 * Error Handler - Suppresses expected/handled errors from bubbling to console
 * Intercepts errors at the source before console logs them
 */

// Suppress unhandled promise rejection handlers for expected 404s
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  
  // Check if it's a 404 for /characters/me (expected when no character)
  if (error?.response?.status === 404 && 
      error?.response?.config?.url?.includes('/characters/me')) {
    // Prevent the error from being logged
    event.preventDefault();
    return;
  }
  
  // Check for WebSocket connection errors (handled by reconnection)
  if (error?.message?.includes('WebSocket') || 
      error?.message?.includes('websocket')) {
    event.preventDefault();
    return;
  }
}, true);

// Intercept window.onerror to suppress browser default error logging
const originalWindowError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  // Suppress WebSocket connection failed messages
  if (message?.includes('WebSocket connection') && message?.includes('failed')) {
    return true; // Suppress error
  }
  
  // Suppress 404 xhr errors for characters/me
  if (message?.includes('GET') && message?.includes('/characters/me') && message?.includes('404')) {
    return true; // Suppress error
  }
  
  // Call original handler for other errors
  if (originalWindowError) {
    return originalWindowError.apply(this, arguments);
  }
};

export default {
  init: () => {
    console.log('✓ Error handler initialized - suppressing expected connection errors');
  }
};
