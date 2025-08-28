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

  getShareableLinkWithData(sessionData: SessionData): string {
    try {
      const baseUrl = window.location.origin;
      // Clean the session data before encoding to remove undefined values
      const cleanData = {
        sessionId: sessionData.sessionId,
        user1: sessionData.user1,
        user2: sessionData.user2,
        user2Name: sessionData.user2Name,
        createdAt: sessionData.createdAt
      };
      const encodedData = btoa(JSON.stringify(cleanData));
      return `${baseUrl}?data=${encodedData}`;
    } catch (error) {
      console.error('Failed to encode session data:', error);
      // Fallback to session ID only
      return this.getShareableLink(sessionData.sessionId);
    }
  }

  getSessionDataFromUrl(): SessionData | null {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    if (encodedData) {
      try {
        const decodedData = JSON.parse(atob(encodedData));
        // 验证数据结构
        if (decodedData.sessionId && decodedData.user1) {
          return decodedData;
        }
      } catch (error) {
        console.error('Failed to decode session data:', error);
      }
    }
    return null;
  }

  getReportLink(sessionId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?report=${sessionId}`;
  }

  getReportIdFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('report');
  }
}

const sessionManager = new SessionManager();
export default sessionManager;