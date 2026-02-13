/**
 * useWebSocketChat - WebSocket connection and message handling for chat
 * Encapsulates all WebSocket logic for real-time messaging
 */

import { useRef, useEffect, useCallback } from 'react';

export const useWebSocketChat = (onMessageReceived) => {
  const wsRef = useRef(null);
  const wsConnectedRef = useRef(false);
  const currentChatIdRef = useRef(null);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const isInitializingRef = useRef(false);

  // Update the callback ref whenever it changes
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  /**
   * Initialize WebSocket connection
   */
  const initWebSocket = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isInitializingRef.current) {
      return;
    }

    // Don't reinitialize if already connected
    if (wsRef.current && wsConnectedRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    isInitializingRef.current = true;

    
    const ws = new WebSocket('wss://localhost:8443/ws/chat');
    
    ws.onopen = async () => {
      wsConnectedRef.current = true;
      isInitializingRef.current = false;
      // Send auth message
      const token = localStorage.getItem('token');
      if (token) {
        ws.send(JSON.stringify({ type: 'AUTH', payload: { token } }));
      }
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'AUTH_OK') {
      } else if (msg.type === 'CHAT_NEW') {
        // New message received in real-time
        const chatMsg = msg.payload?.message;
        const msgChatId = msg.payload?.chatId;
        if (chatMsg && msgChatId === currentChatIdRef.current) {
          // Use ref to always have the latest callback
          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current(chatMsg);
          }
        }
      } else if (msg.type === 'ERROR') {
        console.error('[useWebSocketChat] WebSocket error:', msg.payload?.message);
      }
    };

    ws.onerror = (event) => {
      isInitializingRef.current = false;
      wsConnectedRef.current = false;
    };

    ws.onclose = (event) => {
      wsConnectedRef.current = false;
      isInitializingRef.current = false;
    };

    wsRef.current = ws;
  }, []);

  /**
   * Initialize and cleanup WebSocket on mount/unmount only
   */
  useEffect(() => {
    initWebSocket();
    
    return () => {
      // Cleanup: close connection on unmount
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsConnectedRef.current = false;
        isInitializingRef.current = false;
      }
    };
  }, []);

  /**
   * Send a message via WebSocket
   */
  const sendMessage = useCallback((chatId, message) => {
    if (!wsRef.current || !wsConnectedRef.current) {
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'CHAT_SEND',
        payload: {
          chatId: Number(chatId),
          content: message
        }
      }));
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  /**
   * Set the current chat context
   */
  const setCurrentChat = useCallback((chatId) => {
    currentChatIdRef.current = chatId;
  }, []);

  /**
   * Clear the current chat context
   */
  const clearCurrentChat = useCallback(() => {
    currentChatIdRef.current = null;
  }, []);

  /**
   * Get connection status
   */
  const isConnected = useCallback(() => wsConnectedRef.current, []);

  return {
    sendMessage,
    setCurrentChat,
    clearCurrentChat,
    isConnected,
    wsRef,
    wsConnectedRef,
    currentChatIdRef
  };
};
