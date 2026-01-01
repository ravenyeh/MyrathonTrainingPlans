import { GarminConnect } from '@gooin/garmin-connect';

// In-memory session storage (for demo purposes)
// In production, use Redis or database
export const sessions = new Map<string, { gc: GarminConnect; user: Record<string, unknown>; timestamp: number }>();

// Clean up old sessions (older than 30 minutes)
export function cleanupSessions() {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  sessions.forEach((session, sessionId) => {
    if (now - session.timestamp > maxAge) {
      sessions.delete(sessionId);
    }
  });
}
