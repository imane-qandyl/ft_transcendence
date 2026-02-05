import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AddFriend = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Search for users by username
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await api.get(`/api/v1/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Send friend request by user ID
  const sendFriendRequest = async (userId, username) => {
    setLoading(true);
    setMessage('');

    try {
      await api.post('/api/v1/friends/requests', {
        receiverId: userId
      });

      setMessage(`Friend request sent to ${username}!`);
      // Remove user from search results
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-4 overflow-auto">
      <h1 className="text-retro-purple text-lg mb-4 text-center">ADD FRIEND</h1>
      
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- SEARCH USERS --</div>
        
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type username to search..."
            className="w-full p-3 bg-pixel-black border-3 border-pixel-light text-pixel-white text-xs focus:border-retro-purple outline-none"
          />
        </div>

        {message && (
          <div className={`pixel-card p-2 mb-4 text-center text-xs ${message.includes('sent') ? 'border-retro-green text-retro-green' : 'border-retro-red text-retro-red'}`}>
            {message}
          </div>
        )}

        {searching && (
          <div className="text-pixel-light text-xs text-center py-4">SEARCHING...</div>
        )}

        {!searching && searchQuery.length > 0 && searchResults.length === 0 && (
          <div className="text-pixel-mid text-xs text-center py-4">NO USERS FOUND</div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map(user => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-3 bg-pixel-black border-3 border-pixel-light"
              >
                <span className="text-pixel-white text-xs">{user.username?.toUpperCase()}</span>
                <button
                  onClick={() => sendFriendRequest(user.id, user.username)}
                  disabled={loading}
                  className="px-3 py-1 bg-retro-green border-2 border-retro-green text-pixel-black text-[10px] disabled:opacity-50 hover:bg-retro-green/80"
                >
                  + ADD
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-2">-- TIPS --</div>
        <ul className="text-pixel-light text-[10px] space-y-1">
          <li>• Search by username</li>
          <li>• Your friend will get a notification</li>
          <li>• Once accepted, you can play together</li>
        </ul>
      </div>

      <button 
        onClick={() => navigate('/friends')}
        className="pixel-btn w-full text-xs"
      >
        {'<'} BACK TO FRIENDS
      </button>
    </div>
  );
};

export default AddFriend;