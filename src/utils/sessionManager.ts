import { SessionData, UserSelection, Interest } from '../types';

const STORAGE_KEY = 'qixi-match-session';

class SessionManager {
  generateSessionId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  saveSession(sessionData: SessionData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  loadSession(): SessionData | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const sessionData = JSON.parse(stored);
        // Check if session is not older than 24 hours
        const now = Date.now();
        const sessionAge = now - sessionData.createdAt;
        if (sessionAge < 24 * 60 * 60 * 1000) { // 24 hours
          return sessionData;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    return null;
  }

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  createUserSelection(userId: string, name: string, interests: Interest[]): UserSelection {
    return {
      userId,
      name,
      interests,
      completed: true,
      timestamp: Date.now()
    };
  }

  updateSessionWithUser(sessionData: SessionData, userNumber: number, userSelection: UserSelection): SessionData {
    const updatedSession = { ...sessionData };
    if (userNumber === 1) {
      updatedSession.user1 = userSelection;
    } else {
      updatedSession.user2 = userSelection;
    }
    return updatedSession;
  }

  isSessionComplete(sessionData: SessionData): boolean {
    return sessionData.user1 !== null && sessionData.user2 !== null;
  }

  getShareableLink(sessionId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?session=${sessionId}`;
  }

  getSessionIdFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session');
  }
}

const sessionManager = new SessionManager();
export default sessionManager;