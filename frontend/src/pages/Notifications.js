import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/v1/notifications/others');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/api/v1/notifications/others/${notificationId}`);
      fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/v1/notifications/others');
      fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Notifications</h1>
        {notifications.length > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary">
            Mark All as Read
          </button>
        )}
      </div>
      
      <div className="card">
        {notifications.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No notifications yet. You'll see friend requests, game invites, and other updates here.
          </p>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div key={notification.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                marginBottom: '10px',
                backgroundColor: notification.is_read ? '#f8f9fa' : '#fff3cd'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                    {notification.message}
                  </p>
                  <small style={{ color: '#666' }}>
                    {new Date(notification.created_at).toLocaleString()}
                  </small>
                </div>
                {!notification.is_read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;