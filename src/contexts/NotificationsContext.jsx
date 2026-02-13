import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, AlertCircle, AlertTriangle, Info, X, Check } from 'lucide-react';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  subscribeToNotifications
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { themes } from '../utils/theme';

const NotificationsContext = createContext(null);

const typeIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  import: CheckCircle
};

const typeColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  import: 'text-teal-500'
};

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme];
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const data = await getNotifications(user.id);
    setNotifications(data);
    const count = await getUnreadNotificationsCount(user.id);
    setUnreadCount(count);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      const subscription = subscribeToNotifications(user.id, (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id, loadNotifications]);

  const handleMarkRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    if (!user?.id) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [user?.id]);

  const handleDelete = useCallback(async (id) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const value = {
    notifications,
    unreadCount,
    loadNotifications,
    isOpen,
    setIsOpen,
    handleMarkRead,
    handleMarkAllRead,
    handleDelete,
    formatDate,
    t,
    typeIcons,
    typeColors
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function NotificationsBell() {
  const { 
    unreadCount, 
    isOpen, 
    setIsOpen, 
    notifications,
    handleMarkRead,
    handleMarkAllRead,
    handleDelete,
    formatDate,
    t,
    typeIcons,
    typeColors
  } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl ${t.bgTertiary} ${t.bgHover} transition-colors`}
      >
        <Bell className={`w-5 h-5 ${t.textSecondary}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className={`
            absolute right-0 top-full mt-2 z-50 w-80 max-h-96
            rounded-2xl border shadow-xl overflow-hidden
            ${t.card} ${t.border}
          `}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border} ${t.bgSecondary}`}>
              <h3 className={`font-semibold ${t.text}`}>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-teal-500 hover:text-teal-600 font-medium"
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className={`p-8 text-center ${t.textMuted}`}>
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const Icon = typeIcons[notif.type] || Info;
                  return (
                    <div
                      key={notif.id}
                      className={`
                        relative p-4 border-b ${t.border} last:border-b-0
                        ${!notif.read ? t.bgTertiary : ''} 
                        transition-colors
                      `}
                    >
                      <div className="flex gap-3">
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${typeColors[notif.type] || typeColors.info}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${t.text} ${!notif.read ? '' : 'opacity-70'}`}>
                            {notif.title}
                          </p>
                          {notif.message && (
                            <p className={`text-xs mt-1 ${t.textMuted}`}>
                              {notif.message}
                            </p>
                          )}
                          <p className={`text-xs mt-1 ${t.textMuted} opacity-60`}>
                            {formatDate(notif.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkRead(notif.id)}
                              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700`}
                              title="Marquer comme lu"
                            >
                              <Check className="w-3.5 h-3.5 text-teal-500" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notif.id)}
                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700`}
                            title="Supprimer"
                          >
                            <X className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                          </button>
                        </div>
                      </div>
                      {!notif.read && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-teal-500 rounded-full" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}

export default NotificationsContext;
