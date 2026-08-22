/**
 * OWNER: Vignesh (Person C)
 * Socket.io — company/user rooms + presence:update helpers (Build Plan §5.5, §8).
 */
import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../utils/security.js";

export type PresenceStatus = "IN_OFFICE" | "CHECKED_OUT" | "ON_LEAVE" | "ABSENT" | "NOT_CHECKED_IN";

export type PresenceUpdatePayload = {
  employeeId: string;
  status: PresenceStatus;
  date?: string;
};

export type AttendanceCheckedPayload = {
  employeeId: string;
  date: string;
  action: "check-in" | "check-out" | "regularized";
};

let io: Server | null = null;

function companyRoom(companyId: string) {
  return `company:${companyId}`;
}

function userRoom(userId: string) {
  return `user:${userId}`;
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", async (socket: Socket) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (typeof socket.handshake.headers.authorization === "string" &&
        socket.handshake.headers.authorization.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.slice(7)
          : undefined);

      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.companyId = payload.companyId;
      socket.data.role = payload.role;

      await socket.join(companyRoom(payload.companyId));
      await socket.join(userRoom(payload.sub));
    } catch {
      socket.disconnect(true);
    }
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call initSocket(server) first.");
  }
  return io;
}

/** Safe emit — no-ops before init (e.g. tests / early boot). */
export function emitPresenceUpdate(companyId: string, payload: PresenceUpdatePayload) {
  if (!io) return;
  io.to(companyRoom(companyId)).emit("presence:update", payload);
}

export function emitAttendanceChecked(companyId: string, payload: AttendanceCheckedPayload) {
  if (!io) return;
  io.to(companyRoom(companyId)).emit("attendance:checked", payload);
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}

export { companyRoom, userRoom };
