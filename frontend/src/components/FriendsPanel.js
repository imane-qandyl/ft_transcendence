/**
 * FriendsPanel - Pixel art style friends list and chat
 */

import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import api from '../services/api';
import friendService from '../services/friendService';
import { useAuth } from '../contexts/AuthContext';

const FriendsPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchBlockedUsers();
    
    // Poll for new friends every 10 seconds
    const friendsInterval = setInterval(() => {
      fetchFriends();
    }, 10000);
    
    // Poll for new friend requests every 10 seconds
    const requestsInterval = setInterval(() => {
      fetchFriendRequests();
    }, 10000);
    
    // Cleanup on unmount
    return () => {
      clearInterval(friendsInterval);
      clearInterval(requestsInterval);
    };
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      // Backend returns userId, not id
      const friendId = selectedFriend.userId || selectedFriend.id;
      
      // Use flushSync to force immediate rendering of loading state
      flushSync(() => {
        setMessagesLoading(true);
        setMessages([]);
      });
      
      // Then fetch messages
      fetchMessages(friendId);
      
      // Poll for new messages every 5 seconds while viewing chat
      const messagesInterval = setInterval(() => {
        fetchMessages(friendId);
      }, 5000);
      
      // Cleanup when friend is deselected
      return () => {
        clearInterval(messagesInterval);
      };
    }
    
    // Cleanup when friend is deselected
    return () => {
      // No polling to clean up if no friend selected
    };
  }, [selectedFriend]);

  const fetchFriends = async () => {
    try {
      const response = await api.get('/api/v1/friends/');
      // API returns { success: true, data: [...] }
      const friendsData = response.data.data || [];
      setFriends(friendsData);
      
      // Build unread counts map from friends data
      const unreadMap = {};
      friendsData.forEach(friend => {
        const friendId = friend.userId || friend.id;
        unreadMap[friendId] = friend.unread_count || 0;
      });
      setUnreadCounts(unreadMap);
    } catch (err) {
      console.error('[FriendsPanel] Failed to fetch friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await api.get('/api/v1/friends/requests/received');
      // API returns { success: true, data: [...] }
      setFriendRequests(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await friendService.listBlockedUsers();
      setBlockedUsers(response.data || []);
    } catch (err) {
      console.error('[FriendsPanel] Failed to fetch blocked users:', err);
      setBlockedUsers([]);
    }
  };

  const fetchMessages = async (friendId) => {
    try {
      try {
        // Get chat between current user and friend
        const response = await api.get(`/api/v1/chats/between/${friendId}`);
        
        // Response format: { success: true, chat_id: 1 }
        const chatId = response.data.chat_id || response.data.chat?.id;
        
        if (chatId) {
          setCurrentChatId(chatId);
          
          // Mark messages as read immediately
          try {
            await api.put(`/api/v1/chats/${chatId}/read`, {});
          } catch (readErr) {
            // Failed to mark messages as read - continue silently
          }
          
          // Fetch messages immediately
          const messagesResponse = await api.get(`/api/v1/chats/${chatId}/messages`);
          const msgs = messagesResponse.data.data || messagesResponse.data.messages || [];
          
          // Only update if we have messages, don't clear if empty
          if (msgs && msgs.length > 0) {
            setMessages(msgs);
          } else if (messages.length === 0) {
            // Only set empty array if we previously had no messages
            setMessages([]);
          }
          // If we have existing messages but fetch returns empty, keep existing messages
          
          setMessagesLoading(false);
          
          // Clear unread count for this friend
          setUnreadCounts(prev => ({
            ...prev,
            [friendId]: 0
          }));
          
          // ❌ REMOVED: Polling is deprecated - use WebSocket (Chat.js) for real-time updates
          // FriendsPanel should not continuously poll. This was causing excessive API calls.
          // Real-time message updates are handled by the dedicated Chat page with WebSocket support.
        } else {
          // No chatId in response, no messages to load yet
          // Only clear if this is the first time
          if (messages.length > 0) {
            setMessages([]);
          }
          setMessagesLoading(false);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          // No chat exists yet with this friend. Messages will be loaded after first message is sent.
          // Only clear on 404 if we had no previous messages
          if (messages.length === 0) {
            setMessages([]);
          }
          setMessagesLoading(false);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      // Only clear messages on actual errors, not on network timeouts or retries
      // Don't set loading to false if there was an error during polling
      if (messagesLoading) {
        setMessages([]);
        setMessagesLoading(false);
      }
    }
  };

  const sendMessage = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!newMessage.trim()) {
      return;
    }

    if (!selectedFriend) {
      return;
    }

    try {
      
      // Backend returns userId, not id
      const friendId = selectedFriend.userId || selectedFriend.id;
      
      let chatId = null;
      
      try {
        // Try to get existing chat
        const chatResponse = await api.get(`/api/v1/chats/between/${friendId}`);
        
        // Response format: { success: true, chat_id: 1 }
        chatId = chatResponse.data.chat_id || chatResponse.data.chat?.id;
      } catch (err) {
        // If chat doesn't exist (404), create one
        if (err.response?.status === 404) {
          try {
            const createResponse = await api.post('/api/v1/chats/', { user2_id: friendId });
            chatId = createResponse.data.chat_id || createResponse.data.chat?.id;
            
            if (!chatId) {
              alert('Failed to create chat. Please try again.');
              return;
            }
          } catch (createErr) {
            alert('Failed to create chat: ' + (createErr.response?.data?.message || createErr.message));
            return;
          }
        } else {
          throw err;
        }
      }
      
      if (!chatId) {
        alert('Failed to get chat. Please try again.');
        return;
      }
      
      // Send message to the chat
      const sendResponse = await api.post(`/api/v1/chats/${chatId}/messages`, { content: newMessage });
      
      // Refresh messages from server immediately after sending
      try {
        const refreshedMessages = await api.get(`/api/v1/chats/${chatId}/messages`);
        setMessages(refreshedMessages.data.data || refreshedMessages.data.messages || []);
      } catch (refreshErr) {
        // Fallback: add message to local state
        const newMsg = {
          id: Date.now(),
          content: newMessage,
          sender_id: 'me',
          is_own_message: true,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
      }
      
      setNewMessage('');
      
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message: ' + (err.response?.data?.message || err.message));
    }
  };

  const searchUsers = async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await api.get(`/api/v1/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      // Correct endpoint: POST /api/v1/friends/requests with receiverId in body
      await api.post('/api/v1/friends/requests', { receiverId: userId });
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      // Correct endpoint: PUT /api/v1/friends/requests/:friendshipId/respond
      await api.put(`/api/v1/friends/requests/${friendshipId}/respond`, { action: 'accept' });
      await fetchFriends();
      await fetchFriendRequests();
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const declineRequest = async (friendshipId) => {
    try {
      await api.put(`/api/v1/friends/requests/${friendshipId}/respond`, { action: 'decline' });
      await fetchFriendRequests();
    } catch (err) {
      console.error('Failed to decline:', err);
    }
  };

  const blockFriend = async (friendId) => {
    try {
      const friendName = friends.find(f => (f.userId || f.id) === friendId)?.username || 'User';
      const confirmed = window.confirm(`Block ${friendName}? You won't be able to communicate with them.`);
      
      if (!confirmed) return;
      
      await friendService.blockFriend(friendId);
      
      // Clear selected friend if blocking the currently selected friend
      if (selectedFriend && (selectedFriend.userId || selectedFriend.id) === friendId) {
        setSelectedFriend(null);
      }
      
      // Remove the blocked friend from the list
      setFriends(prev => prev.filter(f => (f.userId || f.id) !== friendId));
      
      // Refresh all data
      await fetchBlockedUsers();
      
    } catch (err) {
      console.error('Failed to block friend:', err);
      alert('Failed to block friend: ' + (err.response?.data?.message || err.message));
    }
  };

  const unblockFriend = async (friendId) => {
    try {
      const blockedUser = blockedUsers.find(b => b.userId === friendId);
      const userName = blockedUser?.username || 'User';
      
      await friendService.unblockFriend(friendId);
      
      // Remove from blocked list
      setBlockedUsers(prev => prev.filter(b => b.userId !== friendId));
      
      // Refresh friends list in case they should appear there
      await fetchFriends();
      
    } catch (err) {
      console.error('Failed to unblock friend:', err);
      alert('Failed to unblock friend: ' + (err.response?.data?.message || err.message));
    }
  };

  // Chat View
  if (selectedFriend) {
    return (
      <div className="w-64 bg-pixel-dark border-l-3 border-pixel-mid flex flex-col shrink-0 h-full max-h-full">
        {/* Chat Header */}
        <div className="h-10 px-2 flex items-center gap-2 border-b-3 border-pixel-mid shrink-0">
          <button
            onClick={() => setSelectedFriend(null)}
            className="text-pixel-light hover:text-retro-purple text-xs"
          >
            {'<'}
          </button>
          <span className="text-retro-green text-xs">*</span>
          <span className="text-pixel-white text-xs truncate">
            {selectedFriend.username?.toUpperCase()}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-2 space-y-2 relative min-h-0">
          {messagesLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-pixel-dark bg-opacity-90 z-10">
              <div className="text-center">
                <div className="text-retro-yellow text-xl mb-2">⏳</div>
                <div className="text-pixel-white text-xs uppercase">LOADING MESSAGES...</div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-pixel-mid text-xs py-4">
              NO MESSAGES YET
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              {messages.map((msg) => {
                // Use the is_own_message flag from the backend, fall back to checking sender_id
                const isOwnMessage = msg.is_own_message !== undefined ? msg.is_own_message : (msg.sender_id === user?.id);
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`inline-block max-w-xs px-3 py-2 border-2 text-xs break-words ${
                        isOwnMessage
                          ? 'bg-retro-purple border-retro-purple text-pixel-black'
                          : 'bg-pixel-mid border-pixel-light text-pixel-white'
                      }`}
                    >
                      {msg.content}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-2 border-t-3 border-pixel-mid shrink-0">
          <div className="flex gap-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="TYPE..."
              className="pixel-input flex-1 text-[8px] w-full"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="px-2 bg-retro-purple border-3 border-retro-purple text-pixel-black text-xs hover:cursor-pointer flex-shrink-0"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Friends List View
  return (
    <>
      {/* Mobile Modal Overlay */}
      <div className="md:hidden fixed inset-0 z-50 bg-pixel-black bg-opacity-90 flex items-end">
        <div className="w-full h-3/4 bg-pixel-dark border-t-3 border-pixel-mid flex flex-col">
          {/* Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b-3 border-pixel-mid">
            <span className="text-retro-purple text-sm">SOCIAL</span>
            <button onClick={onClose} className="text-pixel-light hover:text-retro-red text-sm px-3 py-1 border-3 border-pixel-light bg-pixel-mid">
              [X]
            </button>
          </div>

          {/* Mobile Tabs */}
          <div className="flex border-b-3 border-pixel-mid">
            {['friends', 'requests', 'add', 'blocked'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs uppercase border-r-3 border-pixel-mid last:border-r-0 ${
                  activeTab === tab
                    ? 'bg-retro-purple text-pixel-black'
                    : 'bg-pixel-mid text-pixel-light hover:text-pixel-white'
                }`}
              >
                {tab === 'requests' && friendRequests.length > 0 && (
                  <span className="inline-block w-2 h-2 bg-retro-red rounded-full ml-1"></span>
                )}
                {tab}
              </button>
            ))}
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-auto">
            {/* Mobile Tab Content - Same as desktop but optimized for touch */}
            {activeTab === 'friends' && (
              <div className="p-2">
                {loading ? (
                  <div className="text-center text-pixel-mid text-sm py-4">LOADING...</div>
                ) : friends.length === 0 ? (
                  <div className="text-center text-pixel-mid text-sm py-4">
                    <div className="mb-2">NO FRIENDS YET</div>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="text-retro-purple hover:text-retro-pink"
                    >
                      + ADD FRIENDS
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.filter(f => f.status === 'online').map((friend, index) => (
                      <div
                        key={`mobile-online-${friend.userId || friend.id || friend.friendshipId}-${index}`}
                        className="flex items-center justify-between p-3 border-3 border-pixel-mid bg-pixel-mid hover:border-retro-purple cursor-pointer"
                        onClick={() => setSelectedFriend(friend)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-retro-green rounded-full"></div>
                          <span className="text-pixel-white text-sm">{friend.username || friend.friendUsername}</span>
                        </div>
                        {unreadCounts[friend.userId || friend.id] > 0 && (
                          <span className="bg-retro-red text-pixel-white text-xs px-2 py-1">
                            {unreadCounts[friend.userId || friend.id]}
                          </span>
                        )}
                      </div>
                    ))}
                    {friends.filter(f => f.status !== 'online').map((friend, index) => (
                      <div
                        key={`mobile-offline-${friend.userId || friend.id || friend.friendshipId}-${index}`}
                        className="flex items-center justify-between p-3 border-3 border-pixel-mid bg-pixel-mid hover:border-retro-purple cursor-pointer opacity-60"
                        onClick={() => setSelectedFriend(friend)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-pixel-light rounded-full"></div>
                          <span className="text-pixel-white text-sm">{friend.username || friend.friendUsername}</span>
                        </div>
                        {unreadCounts[friend.userId || friend.id] > 0 && (
                          <span className="bg-retro-red text-pixel-white text-xs px-2 py-1">
                            {unreadCounts[friend.userId || friend.id]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other tabs - Add Friends */}
            {activeTab === 'add' && (
              <div className="p-4">
                <form onSubmit={(e) => { e.preventDefault(); searchUsers(searchQuery); }} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ENTER USERNAME..."
                    className="pixel-input text-sm flex-1"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="px-4 py-2 bg-retro-purple border-3 border-retro-purple text-pixel-black text-sm disabled:opacity-50"
                  >
                    {searchLoading ? '...' : 'SEARCH'}
                  </button>
                </form>

                {searchQuery && !searchLoading && searchResults.length === 0 && (
                  <div className="text-pixel-mid text-sm text-center py-4">
                    NO USERS FOUND
                  </div>
                )}

                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border-3 border-pixel-mid bg-pixel-mid">
                      <span className="text-pixel-white text-sm truncate">
                        {user.username?.toUpperCase()}
                      </span>
                      <button
                        onClick={() => sendFriendRequest(user.id)}
                        className="px-3 py-1 bg-retro-purple border-3 border-retro-purple text-pixel-black text-sm"
                      >
                        ADD
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other tabs - Requests */}
            {activeTab === 'requests' && (
              <div className="p-4 space-y-2">
                {friendRequests.length === 0 ? (
                  <div className="text-center text-pixel-mid text-sm py-4">
                    NO PENDING REQUESTS
                  </div>
                ) : (
                  friendRequests.map((req) => (
                    <div key={req.friendshipId} className="p-3 border-3 border-pixel-mid bg-pixel-mid">
                      <div className="text-pixel-white text-sm mb-3">
                        {req.senderUsername?.toUpperCase() || req.username?.toUpperCase() || '???'}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(req.friendshipId)}
                          className="flex-1 py-2 bg-retro-green border-3 border-retro-green text-pixel-black text-sm"
                        >
                          ACCEPT
                        </button>
                        <button
                          onClick={() => declineRequest(req.friendshipId)}
                          className="flex-1 py-2 bg-pixel-mid border-3 border-pixel-light text-pixel-light text-sm"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Other tabs - Blocked */}
            {activeTab === 'blocked' && (
              <div className="p-4">
                {blockedUsers.length === 0 ? (
                  <div className="text-center text-pixel-mid text-sm py-4">
                    NO BLOCKED USERS
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedUsers.map((blockedUser) => (
                      <div key={blockedUser.userId} className="flex items-center justify-between p-3 border-3 border-retro-yellow bg-pixel-light">
                        <span className="text-pixel-black text-sm truncate font-bold">
                          {blockedUser.username?.toUpperCase()}
                        </span>
                        <button
                          onClick={() => unblockFriend(blockedUser.userId)}
                          className="px-3 py-1 bg-retro-green border-3 border-retro-green text-pixel-black text-sm"
                          title="Unblock user"
                        >
                          UNBLOCK
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-pixel-dark border-l-3 border-pixel-mid flex-col shrink-0 h-full">
        {/* Header */}
        <div className="h-10 px-3 flex items-center justify-between border-b-3 border-pixel-mid">
          <span className="text-retro-purple text-xs">SOCIAL</span>
          <button onClick={onClose} className="text-pixel-light hover:text-retro-red text-xs">
            [X]
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-3 border-pixel-mid">
          {['friends', 'requests', 'add', 'blocked'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[8px] uppercase border-r-3 border-pixel-mid last:border-r-0 ${
                activeTab === tab
                  ? 'bg-retro-purple text-pixel-black'
                  : 'bg-pixel-mid text-pixel-light hover:text-pixel-white'
              }`}
            >
              {tab === 'requests' && friendRequests.length > 0 && (
              <span className="text-retro-red mr-1">({friendRequests.length})</span>
            )}
            {tab === 'blocked' && blockedUsers.length > 0 && (
              <span className="text-retro-red mr-1">({blockedUsers.length})</span>
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="p-2">
            {loading ? (
              <div className="text-center text-pixel-mid text-xs py-4">LOADING...</div>
            ) : friends.length === 0 ? (
              <div className="text-center text-pixel-mid text-xs py-4">
                <div className="mb-2">NO FRIENDS YET</div>
                <button
                  onClick={() => setActiveTab('add')}
                  className="text-retro-purple hover:text-retro-pink"
                >
                  + ADD FRIENDS
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Online */}
                <div className="text-pixel-mid text-[8px] py-1">
                  -- ONLINE ({friends.filter(f => f.status === 'online').length}) --
                </div>
                {friends.filter(f => f.status === 'online').map((friend, index) => (
                  <FriendItem key={`online-${friend.userId || friend.id || friend.friendshipId}-${index}`} friend={friend} unreadCount={unreadCounts[friend.userId || friend.id]} onClick={() => setSelectedFriend(friend)} onBlock={blockFriend} />
                ))}

                {/* Offline */}
                <div className="text-pixel-mid text-[8px] py-1 mt-2">
                  -- OFFLINE ({friends.filter(f => f.status !== 'online').length}) --
                </div>
                {friends.filter(f => f.status !== 'online').map((friend, index) => (
                  <FriendItem key={`offline-${friend.userId || friend.id || friend.friendshipId}-${index}`} friend={friend} unreadCount={unreadCounts[friend.userId || friend.id]} onClick={() => setSelectedFriend(friend)} onBlock={blockFriend} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="p-2 space-y-2">
            {friendRequests.length === 0 ? (
              <div className="text-center text-pixel-mid text-xs py-4">
                NO PENDING REQUESTS
              </div>
            ) : (
              friendRequests.map((req) => (
                <div key={req.friendshipId} className="pixel-card p-2">
                  <div className="text-pixel-white text-xs mb-2">
                    {req.senderUsername?.toUpperCase() || req.username?.toUpperCase() || '???'}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => acceptRequest(req.friendshipId)}
                      className="flex-1 py-1 bg-retro-green border-3 border-retro-green text-pixel-black text-[8px]"
                    >
                      YES
                    </button>
                    <button
                      onClick={() => declineRequest(req.friendshipId)}
                      className="flex-1 py-1 bg-pixel-mid border-3 border-pixel-light text-pixel-light text-[8px]"
                    >
                      NO
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Friends Tab */}
        {activeTab === 'add' && (
          <div className="p-2">
            <form onSubmit={(e) => { e.preventDefault(); searchUsers(searchQuery); }} className="flex gap-1 mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="USERNAME..."
                className="pixel-input text-[8px] flex-1"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="px-2 bg-retro-purple border-3 border-retro-purple text-pixel-black text-xs disabled:opacity-50"
              >
                {searchLoading ? '..' : '?'}
              </button>
            </form>

            {searchQuery && !searchLoading && searchResults.length === 0 && (
              <div className="text-pixel-mid text-xs text-center py-2">
                NO USERS FOUND
              </div>
            )}

            <div className="space-y-1">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between pixel-card p-2">
                  <span className="text-pixel-white text-xs truncate">
                    {user.username?.toUpperCase()}
                  </span>
                  <button
                    onClick={() => sendFriendRequest(user.id)}
                    className="px-2 py-1 bg-retro-purple border-3 border-retro-purple text-pixel-black text-[8px]"
                  >
                    ADD
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocked Users Tab */}
        {activeTab === 'blocked' && (
          <div className="p-2">
            {blockedUsers.length === 0 ? (
              <div className="text-center text-pixel-mid text-xs py-4">
                NO BLOCKED USERS
              </div>
            ) : (
              <div className="space-y-1">
                {blockedUsers.map((blockedUser) => (
                  <div key={blockedUser.userId} className="flex items-center justify-between pixel-card p-2 bg-pixel-light border-3 border-retro-yellow">
                    <span className="text-pixel-black text-xs truncate font-bold">
                      {blockedUser.username?.toUpperCase()}
                    </span>
                    <button
                      onClick={() => unblockFriend(blockedUser.userId)}
                      className="px-2 py-1 bg-retro-green border-3 border-retro-green text-pixel-black text-[8px]"
                      title="Unblock user"
                    >
                      UNBLOCK
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

const FriendItem = ({ friend, unreadCount, onClick, onBlock }) => (
  <div
    className="flex items-center gap-2 p-2 border-3 border-pixel-mid bg-pixel-mid hover:border-retro-purple cursor-pointer group"
  >
    <span 
      onClick={onClick}
      className={`flex-1 flex items-center gap-2 text-xs ${friend.status === 'online' ? 'text-retro-green' : friend.status === 'ingame' ? 'text-retro-yellow' : 'text-pixel-mid'}`}
    >
      <span>
        {friend.status === 'online' ? '*' : friend.status === 'ingame' ? '!' : '-'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-pixel-white text-xs truncate">
          {friend.username?.toUpperCase()}
        </div>
        <div className={`text-[8px] ${friend.status === 'online' ? 'text-retro-green' : friend.status === 'ingame' ? 'text-retro-yellow' : 'text-pixel-mid'}`}>
          {friend.status === 'ingame' ? 'IN GAME' : friend.status?.toUpperCase() || 'OFFLINE'}
        </div>
      </div>
    </span>
    
    {unreadCount > 0 && (
      <div className="px-2 py-1 bg-retro-red border-2 border-retro-red text-pixel-black text-[8px] font-bold flex-shrink-0 text-center min-w-[20px]">
        {unreadCount}
      </div>
    )}
    
    {onBlock && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBlock(friend.userId || friend.id);
        }}
        className="text-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:scale-110"
        title="Block user"
      >
        🚫
      </button>
    )}
  </div>
);

export default FriendsPanel;
