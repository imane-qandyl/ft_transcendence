import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import api from '../services/api';
import chatService from '../services/chatService';
import friendService from '../services/friendService';
import { useAuth } from '../contexts/AuthContext';

const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  
  // Use ref to access current selectedChat without adding it to dependencies
  const selectedChatRef = useRef(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Use ref to track abort controller for fetch requests
  const fetchAbortControllerRef = useRef(null);

  const logError = (...args) => {
    console.error('[Chat ERROR]', ...args);
  };

  // Fetch chats on mount
  useEffect(() => {
    fetchChats();
    fetchBlockedUsers();
  }, []);

  // Connect to WebSocket when user is authenticated (only once)
  useEffect(() => {
    // Get the actual user ID - it could be in different fields
    const userId = user?.id || user?.userId || user?.sub;
    
    if (user?.token && userId) {
      chatService.connect(user.token, userId);
      
      // Listen for new messages
      const handleMessage = (payload) => {
        // Get current selected chat from ref - this ensures we have the latest value
        const currentSelectedChat = selectedChatRef.current;
        
        // CRITICAL: Only process message if it's for the currently selected chat
        if (!currentSelectedChat) {
          return;
        }
        
        if (payload.chatId !== currentSelectedChat.id) {
          return;
        }
        
        // Ensure message has correct is_own_message flag based on current user
        const message = {
          ...payload.message,
          is_own_message: payload.message.sender_id === (user?.id || user?.userId || user?.sub)
        };
        
        setMessages(prev => {
          // Double-check the message belongs to the current chat (prevent race conditions)
          if (message.chat_id && message.chat_id !== currentSelectedChat.id) {
            return prev;
          }
          
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, message];
        });
        
        // Update chat list with latest message (for chats NOT currently viewing)
        setChats(prev => prev.map(chat => 
          chat.id === payload.chatId
            ? { ...chat, last_message: payload.message.content, last_message_time: payload.message.created_at }
            : chat
        ));
      };

      chatService.on('message', handleMessage);

      chatService.on('connect', () => {
        setConnected(true);
        setError(null);
      });

      chatService.on('disconnect', () => {
        setConnected(false);
      });

      chatService.on('error', (err) => {
        logError('Chat service error event:', err);
        setError(err.message);
      });

      return () => {
        chatService.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      // Cancel any pending fetch requests for the previous chat
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
      
      // Use flushSync to force immediate rendering of loading state
      // This ensures the "Loading messages..." text appears right away
      flushSync(() => {
        setMessagesLoading(true);
        setMessages([]);
      });
      
      // Then fetch new messages for this chat
      fetchMessages(selectedChat.id);
      
      // Poll for new messages every 5 seconds
      const messagesPollInterval = setInterval(() => {
        fetchMessages(selectedChat.id);
      }, 5000);
      
      // Cleanup poll when chat is unselected
      return () => {
        clearInterval(messagesPollInterval);
      };
    } else {
      // Clear messages if no chat is selected
      setMessages([]);
      setMessagesLoading(false);
      
      // Cancel any pending fetch requests
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const response = await api.get('chats');
      setChats(response.data.chats || []);
    } catch (error) {
      logError('Failed to fetch chats:', error.response?.data || error.message);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await friendService.listBlockedUsers();
      setBlockedUsers(response.data || []);
    } catch (error) {
      logError('Failed to fetch blocked users:', error.response?.data || error.message);
      setBlockedUsers([]);
    }
  };

  const handleBlockFriend = async (friendId) => {
    try {
      await friendService.blockFriend(friendId);
      // Remove the blocked friend from chats
      setChats(chats.filter(chat => chat.other_user_id !== friendId));
      // Refresh blocked users list
      fetchBlockedUsers();
      setError(null);
    } catch (error) {
      logError('Failed to block friend:', error.response?.data || error.message);
      setError(`Failed to block friend: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUnblockFriend = async (friendId) => {
    try {
      await friendService.unblockFriend(friendId);
      // Refresh blocked users list
      fetchBlockedUsers();
      setError(null);
    } catch (error) {
      logError('Failed to unblock friend:', error.response?.data || error.message);
      setError(`Failed to unblock friend: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      // Create a new abort controller for this request
      const abortController = new AbortController();
      fetchAbortControllerRef.current = abortController;
      
      // Add signal to api call - we need to use axios AbortSignal support
      const response = await api.get(`chats/${chatId}/messages`, {
        signal: abortController.signal
      });
      
      // Only update messages if we're still viewing the same chat AND this request wasn't aborted
      // This prevents race conditions when switching chats quickly
      if (selectedChatRef.current?.id === chatId) {
        setMessages(response.data.messages || []);
        setMessagesLoading(false);
      }
    } catch (error) {
      // Ignore abort errors (they're expected when switching chats)
      if (error.name === 'AbortError') {
        return;
      }
      
      logError('Failed to fetch messages for chat:', chatId, error.response?.data || error.message);
      // Only clear if we're still viewing the same chat
      if (selectedChatRef.current?.id === chatId) {
        setMessages([]);
        setMessagesLoading(false);
      }
    }
  };

  const sendMessage = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!newMessage.trim()) {
      return;
    }

    if (!selectedChat) {
      setError('Please select a conversation first');
      return;
    }

    // For WebSocket:
    if (connected && chatService.isConnected()) {
      const success = chatService.sendMessage(selectedChat.id, newMessage);
      if (success) {
        setNewMessage('');
        setError(null);
      } else {
        setError('Failed to send message via WebSocket, trying REST API...');
        // Try REST fallback
        sendViaREST(newMessage);
      }
    } else {
      // Fallback to REST API if WebSocket is not connected
      sendViaREST(newMessage);
    }
  };

  const sendViaREST = async (messageContent) => {
    try {
      const url = `chats/${selectedChat.id}/messages`;
      await api.post(url, {
        content: messageContent
      });
      setNewMessage('');
      setError(null);
      fetchMessages(selectedChat.id);
    } catch (error) {
      logError('Failed to send message via REST:', error.response?.data || error.message);
      setError(`Failed to send message: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return <div className="loading">Loading chats...</div>;
  }

  return (
    <div>
      <h1>Chat</h1>
      
      {/* Connection Status */}
      <div style={{ 
        marginBottom: '10px', 
        padding: '10px', 
        borderRadius: '4px',
        backgroundColor: connected ? '#d4edda' : '#f8d7da',
        color: connected ? '#155724' : '#721c24'
      }}>
        {connected ? '✓ Connected' : '✗ Disconnected (using fallback mode)'}
      </div>

      {error && (
        <div style={{ 
          marginBottom: '10px', 
          padding: '10px', 
          borderRadius: '4px',
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', height: '600px' }}>
        {/* Chat List */}
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Conversations</h3>
            <button
              onClick={() => setShowBlockedUsers(!showBlockedUsers)}
              style={{
                backgroundColor: showBlockedUsers ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              title="View blocked users"
            >
              {showBlockedUsers ? 'Add' : '🚫 Blocked'}
            </button>
          </div>

          {showBlockedUsers ? (
            // Blocked Users Section
            <div>
              {blockedUsers.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No blocked users.
                </p>
              ) : (
                <div>
                  {blockedUsers.map((blockedUser) => (
                    <div
                      key={blockedUser.userId}
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        backgroundColor: '#fff3cd',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong>{blockedUser.username}</strong>
                        <p style={{ margin: '3px 0', color: '#666', fontSize: '12px' }}>
                          (Blocked)
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnblockFriend(blockedUser.userId)}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          marginLeft: '10px',
                          whiteSpace: 'nowrap'
                        }}
                        title="Unblock this user"
                      >
                        🔓 Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Normal Conversations Section
            <div>
              {chats.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No conversations yet. Start chatting with your friends!
                </p>
          ) : (
            <div>
              {chats.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => {
                    setSelectedChat(chat);
                  }}
                  style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    marginBottom: '10px',
                    cursor: 'pointer',
                    backgroundColor: selectedChat?.id === chat.id ? '#e3f2fd' : 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong>{chat.other_user_username || 'Unknown User'}</strong>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                      {chat.last_message || 'No messages yet'}
                    </p>
                    <small style={{ color: '#999' }}>
                      {chat.last_message_time && new Date(chat.last_message_time).toLocaleString()}
                    </small>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBlockFriend(chat.other_user_id);
                    }}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginLeft: '10px',
                      whiteSpace: 'nowrap'
                    }}
                    title="Block this user"
                  >
                    🚫 Block
                  </button>
                </div>
              ))}
            </div>
          )}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          {selectedChat ? (
            <>
              <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px' }}>
                <h3>{selectedChat.other_user_username || 'Chat'}</h3>
              </div>
              
              <div style={{ flex: 1, overflow: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Loading overlay */}
                {messagesLoading && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 100 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</p>
                      <p style={{ fontSize: '18px', color: '#333', fontWeight: 'bold' }}>Loading messages...</p>
                    </div>
                  </div>
                )}
                
                {/* Messages list */}
                {messages.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {messages.map((message) => {
                      // Safety check: verify message belongs to current chat
                      // This prevents showing messages from the wrong chat if there's a race condition
                      if (message.chat_id && message.chat_id !== selectedChat.id) {
                        return null;
                      }
                      
                      return (
                        <div 
                          key={message.id}
                          style={{ 
                            display: 'flex',
                            justifyContent: message.is_own_message ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div 
                            style={{ 
                              padding: '10px 15px',
                              borderRadius: '12px',
                              backgroundColor: message.is_own_message ? '#a855f7' : '#2d3748',
                              color: 'white',
                              maxWidth: '70%',
                              wordWrap: 'break-word'
                            }}
                          >
                            <p style={{ margin: '0 0 5px 0' }}>{message.content}</p>
                            <small style={{ 
                              opacity: 0.7, 
                              fontSize: '12px',
                              display: 'block'
                            }}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Press Enter to send)"
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button 
                  type="submit" 
                  onClick={() => sendMessage()}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {connected ? 'Send' : 'Send (REST)'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#666',
              fontStyle: 'italic'
            }}>
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;