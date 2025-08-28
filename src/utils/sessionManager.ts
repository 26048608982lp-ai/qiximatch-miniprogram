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
    console.log('SessionManager: getShareableLinkWithData called');
    console.log('Session data input:', sessionData);
    
    try {
      const baseUrl = window.location.origin;
      console.log('Base URL:', baseUrl);
      
      // Clean the session data before encoding to remove undefined values
      const cleanData = {
        sessionId: sessionData.sessionId,
        user1: sessionData.user1,
        user2: sessionData.user2,
        user2Name: sessionData.user2Name,
        createdAt: sessionData.createdAt
      };
      console.log('Clean data:', cleanData);
      
      const jsonString = JSON.stringify(cleanData);
      console.log('JSON string length:', jsonString.length);
      
      // Fix for UTF-8 characters (like Chinese characters)
      const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
      console.log('Encoded data length:', encodedData.length);
      console.log('First 100 chars of encoded data:', encodedData.substring(0, 100));
      
      const finalUrl = `${baseUrl}?data=${encodedData}`;
      console.log('Final URL:', finalUrl);
      
      return finalUrl;
    } catch (error) {
      console.error('Failed to encode session data:', error);
      console.error('Error details:', error);
      // Fallback to session ID only
      console.log('Using fallback to session ID only');
      return this.getShareableLink(sessionData.sessionId);
    }
  }

  getSessionDataFromUrl(): SessionData | null {
    console.log('SessionManager: getSessionDataFromUrl called');
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    console.log('Encoded data from URL:', encodedData);
    
    if (encodedData) {
      try {
        // Fix for UTF-8 characters (like Chinese characters)
        const decodedData = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
        console.log('Decoded data:', decodedData);
        // 验证数据结构
        if (decodedData.sessionId && decodedData.user1) {
          console.log('Data validation passed, returning session data');
          return decodedData;
        } else {
          console.log('Data validation failed - missing sessionId or user1');
        }
      } catch (error) {
        console.error('Failed to decode session data:', error);
        console.log('Raw encoded data length:', encodedData.length);
        try {
          console.log('First 100 chars of encoded data:', encodedData.substring(0, 100));
        } catch (e) {
          console.log('Could not log encoded data');
        }
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