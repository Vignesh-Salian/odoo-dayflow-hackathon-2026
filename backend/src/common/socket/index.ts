/**
 * OWNER: Vignesh (Person C)
 * COPY FROM BRANCH: reference/copy-from-here
 * PATH: backend/src/common/socket/index.ts
 *
 * No-op stub so the API boots on main. Paste the full Socket.io implementation from the reference branch.
 */
import type { Server as HttpServer } from "node:http";

export function initSocket(_server: HttpServer) {
  console.info("[socket] placeholder — Vignesh: copy from reference/copy-from-here");
}

export function getIO(): null {
  return null;
}

export function emitPresenceUpdate(..._args: unknown[]) {
  /* noop until Vignesh pastes socket code */
}

export function emitAttendanceChecked(..._args: unknown[]) {
  /* noop */
}
