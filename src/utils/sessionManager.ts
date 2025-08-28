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
    console.log('Session data structure:', {
      hasSessionId: !!sessionData.sessionId,
      hasUser1: !!sessionData.user1,
      hasUser2: !!sessionData.user2,
      hasUser2Name: !!sessionData.user2Name,
      user1Name: sessionData.user1?.name,
      user2Name: sessionData.user2Name,
      sessionId: sessionData.sessionId
    });
    
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
      console.log('✅ Clean data prepared:', cleanData);
      
      const jsonString = JSON.stringify(cleanData);
      console.log('✅ JSON string length:', jsonString.length);
      console.log('JSON string preview:', jsonString.substring(0, 200));
      
      // Fix for UTF-8 characters (like Chinese characters)
      const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
      console.log('✅ Encoded data length:', encodedData.length);
      console.log('First 100 chars of encoded data:', encodedData.substring(0, 100));
      
      const finalUrl = `${baseUrl}?data=${encodedData}`;
      console.log('✅ Final URL generated:', finalUrl);
      console.log('URL contains data parameter:', finalUrl.includes('?data='));
      
      return finalUrl;
    } catch (error) {
      console.error('❌ Failed to encode session data:', error);
      console.error('Error details:', error);
      // Fallback to session ID only
      console.log('⚠️ Using fallback to session ID only');
      return this.getShareableLink(sessionData.sessionId);
    }
  }

  getSessionDataFromUrl(): SessionData | null {
    console.log('SessionManager: getSessionDataFromUrl called');
    console.log('Full URL:', window.location.href);
    console.log('URL search:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    console.log('Encoded data from URL:', encodedData);
    
    if (encodedData) {
      try {
        console.log('Attempting to decode data...');
        console.log('Encoded data length:', encodedData.length);
        
        // Fix for UTF-8 characters (like Chinese characters)
        const decodedData = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
        console.log('Successfully decoded data:', decodedData);
        console.log('Decoded data structure:', {
          hasSessionId: !!decodedData.sessionId,
          hasUser1: !!decodedData.user1,
          hasUser2: !!decodedData.user2,
          hasUser2Name: !!decodedData.user2Name,
          hasMatchResult: !!decodedData.matchResult,
          user1Name: decodedData.user1?.name,
          user2Name: decodedData.user2Name,
          sessionId: decodedData.sessionId
        });
        
        // 严格的数据验证 - 确保包含必要的字段
        if (decodedData && decodedData.user1 && decodedData.user2 && decodedData.matchResult) {
          console.log('✅ Complete match result data validation passed');
          
          // 确保数据结构完整
          const normalizedData: SessionData = {
            sessionId: decodedData.sessionId || this.generateSessionId(),
            user1: decodedData.user1,
            user2: decodedData.user2,
            user2Name: decodedData.user2Name || decodedData.user2?.name || '',
            createdAt: decodedData.createdAt || Date.now(),
            matchResult: decodedData.matchResult
          };
          
          console.log('✅ Normalized match result data:', normalizedData);
          return normalizedData;
        } 
        // 部分数据验证 - 只有用户1完成了
        else if (decodedData && decodedData.user1 && !decodedData.user2) {
          console.log('✅ Partial data validation passed - User1 completed');
          
          const normalizedData: SessionData = {
            sessionId: decodedData.sessionId || this.generateSessionId(),
            user1: decodedData.user1,
            user2: null,
            user2Name: decodedData.user2Name || '',
            createdAt: decodedData.createdAt || Date.now(),
            matchResult: undefined
          };
          
          console.log('✅ Normalized partial data:', normalizedData);
          return normalizedData;
        }
        // 基本结构验证
        else if (decodedData && (decodedData.sessionId || decodedData.user1 || decodedData.user2)) {
          console.log('✅ Basic structure validation passed');
          
          const normalizedData: SessionData = {
            sessionId: decodedData.sessionId || this.generateSessionId(),
            user1: decodedData.user1 || null,
            user2: decodedData.user2 || null,
            user2Name: decodedData.user2Name || '',
            createdAt: decodedData.createdAt || Date.now(),
            matchResult: decodedData.matchResult || undefined
          };
          
          console.log('✅ Normalized basic data:', normalizedData);
          return normalizedData;
        } else {
          console.log('❌ Data validation failed - missing basic session structure');
          console.log('Available keys:', Object.keys(decodedData));
        }
      } catch (error) {
        console.error('❌ Failed to decode session data:', error);
        console.log('Raw encoded data length:', encodedData.length);
        try {
          console.log('First 100 chars of encoded data:', encodedData.substring(0, 100));
        } catch (e) {
          console.log('Could not log encoded data');
        }
      }
    } else {
      console.log('❌ No encoded data found in URL parameters');
      console.log('Available URL parameters:', Array.from(urlParams.keys()));
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