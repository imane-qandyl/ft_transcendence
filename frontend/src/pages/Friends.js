import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get('friends');
      setFriends(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      setFriends([]);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await api.get('friends/requests/received');
      setFriendRequests(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      setFriendRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('friends/requests', {
        user2_email: newFriendEmail
      });
      setMessage('Friend request sent successfully!');
      setNewFriendEmail('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send friend request');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await api.put(`friends/requests/${requestId}/respond`, {
        action: action
      });
      fetchFriendRequests();
      fetchFriends();
      setMessage(`Friend request ${action}ed successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || `Failed to ${action} friend request`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Loading friends...</div>;
  }

  return (
    <div>
      <h1>Friends</h1>
      
      {message && (
        <div className={message.includes('successfully') ? 'success' : 'error'} style={{ marginBottom: '20px' }}>
          {message}
        </div>
      )}
      
      <div className="card">
        <h2>Add Friend</h2>
        <form onSubmit={sendFriendRequest}>
          <div className="form-group">
            <label htmlFor="friendEmail">Friend's Email</label>
            <input
              type="email"
              id="friendEmail"
              value={newFriendEmail}
              onChange={(e) => setNewFriendEmail(e.target.value)}
              placeholder="Enter friend's email address"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Send Friend Request
          </button>
        </form>
      </div>

      {friendRequests.length > 0 && (
        <div className="card">
          <h2>Friend Requests</h2>
          {friendRequests.map((request) => (
            <div key={request.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              marginBottom: '10px' 
            }}>
              <div>
                <strong>{request.senderUsername || 'Unknown User'}</strong>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                  Sent {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => respondToRequest(request.friendshipId, 'accept')}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  Accept
                </button>
                <button 
                  onClick={() => respondToRequest(request.friendshipId, 'decline')}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>My Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No friends yet. Send some friend requests to get started!
          </p>
        ) : (
          <div>
            {friends.map((friend) => (
              <div key={friend.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                marginBottom: '10px' 
              }}>
                <div>
                  <strong>{friend.username || 'Unknown User'}</strong>
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                    Friends since {new Date(friend.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary" style={{ fontSize: '12px', padding: '5px 10px' }}>
                    Message
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;