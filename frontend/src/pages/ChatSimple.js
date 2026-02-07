import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Simplified Chat Component - Test Version
 * This version uses only REST API (no WebSocket) for basic testing
 */
const ChatSimple = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      setStatus('Fetching chats...');
      const response = await api.get('chats');
      setChats(response.data.chats || []);
      setStatus(`✓ Loaded ${response.data.chats?.length || 0} chats`);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setStatus(`✗ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      setStatus('Fetching messages...');
      const response = await api.get(`chats/${chatId}/messages`);
      setMessages(response.data.messages || []);
      setStatus(`✓ Loaded ${response.data.messages?.length || 0} messages`);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setStatus(`✗ Error: ${error.message}`);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      setStatus('Cannot send empty message');
      return;
    }

    if (!selectedChat) {
      setStatus('Please select a chat first');
      return;
    }

    try {
      setStatus('Sending message...');
      
      const response = await api.post(`chats/${selectedChat.id}/messages`, {
        content: newMessage
      });
      
      setNewMessage('');
      setStatus('✓ Message sent!');
      
      // Refresh messages
      fetchMessages(selectedChat.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      setStatus(`✗ Error: ${errorMsg}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return <div className="loading">Loading chats...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>💬 Chat (Simple Test Version)</h1>
      
      <div style={{ 
        padding: '10px', 
        marginBottom: '10px', 
        backgroundColor: '#e8f4f8',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        Status: {status}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', height: '600px' }}>
        {/* Chat List */}
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '4px', 
          padding: '10px',
          overflow: 'auto',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Conversations ({chats.length})</h3>
          {chats.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No conversations yet
            </p>
          ) : (
            chats.map((chat) => (
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
                  transition: 'all 0.2s'
                }}
              >
                <strong>{chat.other_user_username || 'Unknown'}</strong>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                  {chat.last_message || 'No messages'}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Messages & Input */}
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '4px', 
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff'
        }}>
          {selectedChat ? (
            <>
              <h3 style={{ marginTop: 0 }}>
                💬 {selectedChat.other_user_username || 'Chat'}
              </h3>
              
              <div style={{ 
                flex: 1, 
                overflow: 'auto', 
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px'
              }}>
                {messages.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center' }}>No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id}
                      style={{ 
                        marginBottom: '10px',
                        padding: '8px',
                        backgroundColor: msg.is_own_message ? '#007bff' : '#e9ecef',
                        color: msg.is_own_message ? 'white' : 'black',
                        borderRadius: '8px',
                        marginLeft: msg.is_own_message ? '20%' : '0',
                        marginRight: msg.is_own_message ? '0' : '20%'
                      }}
                    >
                      <p style={{ margin: '0 0 5px 0' }}>{msg.content}</p>
                      <small style={{ opacity: 0.7 }}>
                        {new Date(msg.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type message and press Enter or click Send..."
                  style={{ 
                    flex: 1,
                    padding: '10px',
                    borderRadius: '4px',
                    border: '2px solid #ddd',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
              fontSize: '16px'
            }}>
              👈 Select a conversation to start
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSimple;
