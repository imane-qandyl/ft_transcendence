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
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-retro-purple text-xs pixel-blink">LOADING NOTIFICATIONS...</div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-retro-purple text-lg pixel-text">
          [*] NOTIFICATIONS
        </h1>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="pixel-btn text-xs bg-retro-purple border-retro-purple text-pixel-black hover:brightness-110"
          >
            MARK ALL READ
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="pixel-card p-6 text-center">
            <div className="text-pixel-mid text-xs mb-2">[EMPTY INBOX]</div>
            <p className="text-pixel-light text-xs">
              NO NOTIFICATIONS YET.<br/>
              FRIEND REQUESTS, GAME INVITES,<br/>
              AND OTHER UPDATES APPEAR HERE.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`pixel-card p-4 ${
                notification.is_read
                  ? 'bg-pixel-black border-pixel-light'
                  : 'bg-retro-purple/10 border-retro-purple'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs mb-2 ${
                    notification.is_read 
                      ? 'text-pixel-light' 
                      : 'text-pixel-white font-bold'
                  }`}>
                    {notification.message}
                  </p>
                  <div className="text-[8px] text-pixel-mid">
                    {new Date(notification.created_at).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit', 
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(/\//g, '.').replace(',', ' @')}
                  </div>
                </div>
                
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="px-2 py-1 bg-retro-green border-2 border-retro-green text-pixel-black text-[8px] hover:brightness-110 shrink-0"
                  >
                    READ
                  </button>
                )}
              </div>
              
              {!notification.is_read && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-retro-red border border-pixel-black"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Status */}
      {notifications.length > 0 && (
        <div className="mt-6 text-center text-pixel-mid text-[8px]">
          {notifications.filter(n => !n.is_read).length} UNREAD / {notifications.length} TOTAL
        </div>
      )}
    </div>
  );
};

export default Notifications;