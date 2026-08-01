// src/services/notificationService.js
import api from "./api";

const notificationService = {
  // 65. List My Notifications
  getNotifications: async () => {
    const response = await api.get("/notifications/");
    return response.data;
  },

  // 66. Mark Notification Read
  markRead: async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/mark-read/`);
    return response.data;
  },

  // 67. Mark All Notifications Read
  markAllRead: async () => {
    const response = await api.post("/notifications/mark-all-read/");
    return response.data;
  },

  getUnreadStatus: async () => {
    try {
      const response = await api.get(`/notifications/unread-count/?t=${Date.now()}`);
      return {
        unreadCount: response.data?.unread_count ?? 0,
        roleChanged: response.data?.role_changed ?? false,
      };
    } catch {
      try {
        const response = await api.get("/notifications/");
        const rawItems = Array.isArray(response.data) ? response.data : (response.data?.results || []);
        const unreadCount = rawItems.filter(item => !item.is_read).length;
        const roleChanged = rawItems.some(item => !item.is_read && item.title === 'Role Changed');
        return { unreadCount, roleChanged };
      } catch {
        return { unreadCount: 0, roleChanged: false };
      }
    }
  },
};

export default notificationService;