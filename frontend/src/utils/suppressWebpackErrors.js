/**
 * Suppress webpack dev server WebSocket errors
 * These are from webpack dev server's hot reload, not our app
 */

const originalWarn = console.warn;

console.warn = function (...args) {
  const message = String(args[0] || '');
  
  // Suppress webpack dev server websocket failures
  if (message.includes('WebSocket connection') && message.includes('3001')) {
    return;
  }
  
  return originalWarn.apply(console, arguments);
};

export default { init: () => {} };
