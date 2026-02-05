import api from './api';

const friendService = {
  // Block a friend
  blockFriend: async (friendId) => {
    try {
      const response = await api.post(`/api/v1/friends/${friendId}/block`, { friendId });
      return response.data;
    } catch (error) {
      console.error('Error blocking friend:', error.response?.data || error.message);
      throw error;
    }
  },

  // Unblock a friend
  unblockFriend: async (friendId) => {
    try {
      const response = await api.post(`/api/v1/friends/${friendId}/unblock`, { friendId });
      return response.data;
    } catch (error) {
      console.error('Error unblocking friend:', error.response?.data || error.message);
      throw error;
    }
  },

  // List all blocked users
  listBlockedUsers: async () => {
    try {
      const response = await api.get('/api/v1/friends/blocked');
      return response.data;
    } catch (error) {
      console.error('Error listing blocked users:', error.response?.data || error.message);
      throw error;
    }
  },

  // List all friends
  listFriends: async () => {
    try {
      const response = await api.get('/api/v1/friends');
      return response.data;
    } catch (error) {
      console.error('Error listing friends:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default friendService;
