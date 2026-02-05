/**
 * Chat Service - WebSocket real-time chat
 * Handles connection, authentication, and message management
 */

class ChatService {
  constructor() {
    this.socket = null;
    this.listeners = {
      onMessage: null,
      onConnect: null,
      onDisconnect: null,
      onError: null
    };
    this.token = null;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  /**
   * Internal error logging method
   */
  logError(...args) {
    console.error('[ChatService ERROR]', ...args);
  }

  /**
   * Connect to WebSocket chat server
   * @param {string} token - JWT token from authentication
   * @param {number} userId - Current user ID
   */
  connect(token, userId) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.token = token;
    this.userId = userId;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        
        // Send AUTH message
        const authMsg = {
          type: 'AUTH',
          payload: { token }
        };
        this.socket.send(JSON.stringify(authMsg));

        if (this.listeners.onConnect) {
          this.listeners.onConnect();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (err) {
          this.logError('Failed to parse message:', err, 'Raw data:', event.data);
        }
      };

      this.socket.onerror = (error) => {
        this.logError('WebSocket error event:', error);
        if (this.listeners.onError) {
          this.listeners.onError(error);
        }
      };

      this.socket.onclose = () => {
        if (this.listeners.onDisconnect) {
          this.listeners.onDisconnect();
        }
        
        // Attempt to reconnect
        this.attemptReconnect();
      };
    } catch (err) {
      this.logError('Failed to connect to chat:', err);
      if (this.listeners.onError) {
        this.listeners.onError(err);
      }
    }
  }

  /**
   * Handle incoming messages from server
   */
  handleMessage(msg) {
    switch (msg.type) {
      case 'AUTH_OK':
        break;

      case 'CHAT_NEW':
        // New message received
        if (this.listeners.onMessage) {
          this.listeners.onMessage(msg.payload);
        }
        break;

      case 'ERROR':
        this.logError('Chat error from server:', msg.payload?.message);
        if (this.listeners.onError) {
          this.listeners.onError(new Error(msg.payload?.message));
        }
        break;

      default:
        // Unknown message type
    }
  }

  /**
   * Send a chat message
   * @param {number} chatId - Chat ID
   * @param {string} content - Message content
   */
  sendMessage(chatId, content) {
    if (!this.socket) {
      this.logError('sendMessage: socket is null');
      return false;
    }
    
    if (this.socket.readyState !== WebSocket.OPEN) {
      this.logError('sendMessage: WebSocket not open. Ready state:', this.socket.readyState, 
        '(CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3)');
      return false;
    }

    try {
      const payload = {
        type: 'CHAT_SEND',
        payload: {
          chatId: Number(chatId),
          content: content.trim()
        }
      };
      this.socket.send(JSON.stringify(payload));
      return true;
    } catch (err) {
      this.logError('Failed to send message:', err);
      return false;
    }
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    const eventKey = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
    
    if (this.listeners.hasOwnProperty(eventKey)) {
      this.listeners[eventKey] = callback;
    }
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logError('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    setTimeout(() => {
      if (this.token && this.userId) {
        this.connect(this.token, this.userId);
      } else {
        this.logError('Cannot reconnect: missing token or userId', { hasToken: !!this.token, hasUserId: !!this.userId });
      }
    }, this.reconnectDelay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    const connected = this.socket?.readyState === WebSocket.OPEN;
    // Don't log every check to avoid spam - log only when called explicitly
    return connected;
  }
}

// Export singleton instance
export default new ChatService();
