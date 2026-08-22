/**
 * OWNER: Prajwal (Person D)
 * Notification centre service (Build Plan §7).
 */
import { AppError } from "../../common/errors/AppError.js";
import { notificationsRepository } from "./notifications.repository.js";

export const notificationsService = {
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedEntity?: string | null;
    relatedId?: string | null;
  }) {
    const row = await notificationsRepository.create(data);
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.isRead,
      relatedEntity: row.relatedEntity,
      relatedId: row.relatedId,
      createdAt: row.createdAt.toISOString(),
    };
  },

  async list(
    userId: string,
    query: { page: number; limit: number; unreadOnly?: boolean },
  ) {
    const skip = (query.page - 1) * query.limit;
    const [total, rows, unreadCount] = await notificationsRepository.listForUser({
      userId,
      unreadOnly: query.unreadOnly,
      skip,
      take: query.limit,
    });
    return {
      items: rows.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        relatedEntity: n.relatedEntity,
        relatedId: n.relatedId,
        createdAt: n.createdAt.toISOString(),
      })),
      page: query.page,
      limit: query.limit,
      total,
      unreadCount,
    };
  },

  async markRead(userId: string, id: string) {
    const existing = await notificationsRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Notification not found");
    }
    const row = await notificationsRepository.markRead(id);
    return {
      id: row.id,
      isRead: row.isRead,
      title: row.title,
      message: row.message,
      type: row.type,
      relatedEntity: row.relatedEntity,
      relatedId: row.relatedId,
      createdAt: row.createdAt.toISOString(),
    };
  },

  async markAllRead(userId: string) {
    const result = await notificationsRepository.markAllRead(userId);
    return { updated: result.count };
  },
};
