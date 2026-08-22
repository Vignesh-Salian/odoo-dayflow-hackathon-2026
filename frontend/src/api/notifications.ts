/**
 * OWNER: Prajwal (Person D)
 * Notifications API client (Build Plan §7).
 */
import { api } from "./client.ts";

export type NotificationItem = {
  id: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntity: string | null;
  relatedId: string | null;
  createdAt: string;
};

export type NotificationsPage = {
  items: NotificationItem[];
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
};

export const notificationsApi = {
  list(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    return api.get<{ success: true; data: NotificationsPage }>("/notifications", { params });
  },

  markRead(id: string) {
    return api.patch<{ success: true; data: NotificationItem }>(`/notifications/${id}/read`);
  },

  markAllRead() {
    return api.patch<{ success: true; data: { updated: number } }>("/notifications/read-all");
  },
};
