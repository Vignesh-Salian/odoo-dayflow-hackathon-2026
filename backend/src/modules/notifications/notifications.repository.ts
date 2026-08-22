/**
 * OWNER: Prajwal (Person D)
 * Data access for in-app notifications.
 */
import { prisma } from "../../common/db/prisma.js";

export const notificationsRepository = {
  create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedEntity?: string | null;
    relatedId?: string | null;
  }) {
    return prisma.notification.create({ data });
  },

  listForUser(params: {
    userId: string;
    unreadOnly?: boolean;
    skip: number;
    take: number;
  }) {
    const where = {
      userId: params.userId,
      ...(params.unreadOnly ? { isRead: false } : {}),
    };
    return prisma.$transaction([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      prisma.notification.count({ where: { userId: params.userId, isRead: false } }),
    ]);
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.notification.findFirst({ where: { id, userId } });
  },

  markRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
