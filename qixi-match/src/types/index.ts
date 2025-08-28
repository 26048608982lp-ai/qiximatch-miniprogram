export interface Interest {
  id: string;
  name: string;
  category: string;
  icon: string;
  importance: number;
}

export interface UserSelection {
  userId: string;
  name: string;
  interests: Interest[];
  completed: boolean;
  timestamp: number;
}

export interface SessionData {
  sessionId: string;
  user1: UserSelection | null;
  user2: UserSelection | null;
  createdAt: number;
}

export interface MatchResult {
  overallScore: number;
  categoryScores: {
    entertainment: number;
    sports: number;
    food: number;
    travel: number;
  };
  commonInterests: Interest[];
  uniqueInterests: {
    user1: Interest[];
    user2: Interest[];
  };
  recommendedActivities: Activity[];
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  description: string;
  matchScore: number;
  duration: string;
  cost: string;
}