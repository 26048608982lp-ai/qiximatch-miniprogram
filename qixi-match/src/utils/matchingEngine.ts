import { Interest, MatchResult, Activity } from '../types';

export class MatchingEngine {
  private activities: Activity[] = [
    {
      id: 'movie_night',
      name: '电影之夜',
      category: 'entertainment',
      description: '一起看一场浪漫的电影，享受二人世界',
      matchScore: 0,
      duration: '2-3小时',
      cost: '中等'
    },
    {
      id: 'concert',
      name: '演唱会',
      category: 'entertainment',
      description: '参加一场激动人心的演唱会',
      matchScore: 0,
      duration: '3-4小时',
      cost: '较高'
    },
    {
      id: 'hiking_date',
      name: '徒步约会',
      category: 'sports',
      description: '一起徒步，享受自然风光',
      matchScore: 0,
      duration: '半天',
      cost: '低'
    },
    {
      id: 'cooking_class',
      name: '烹饪课程',
      category: 'food',
      description: '一起学习制作美食',
      matchScore: 0,
      duration: '2-3小时',
      cost: '中等'
    },
    {
      id: 'beach_vacation',
      name: '海滩度假',
      category: 'travel',
      description: '享受阳光、沙滩和海浪',
      matchScore: 0,
      duration: '几天',
      cost: '较高'
    },
    {
      id: 'museum_visit',
      name: '博物馆之旅',
      category: 'travel',
      description: '一起探索文化和历史',
      matchScore: 0,
      duration: '2-3小时',
      cost: '低'
    },
    {
      id: 'game_night',
      name: '游戏之夜',
      category: 'entertainment',
      description: '一起玩游戏，享受竞争的乐趣',
      matchScore: 0,
      duration: '2-3小时',
      cost: '低'
    },
    {
      id: 'coffee_date',
      name: '咖啡约会',
      category: 'food',
      description: '在咖啡厅享受悠闲时光',
      matchScore: 0,
      duration: '1-2小时',
      cost: '低'
    }
  ];

  calculateMatch(user1Interests: Interest[], user2Interests: Interest[]): MatchResult {
    // 计算共同兴趣
    const commonInterests = user1Interests.filter(interest1 =>
      user2Interests.some(interest2 => interest2.id === interest1.id)
    );

    // 计算各分类匹配度
    const categoryScores = this.calculateCategoryScores(user1Interests, user2Interests);

    // 计算总体匹配度
    const overallScore = this.calculateOverallScore(categoryScores, commonInterests);

    // 找出独特兴趣
    const uniqueInterests = {
      user1: user1Interests.filter(interest1 =>
        !user2Interests.some(interest2 => interest2.id === interest1.id)
      ),
      user2: user2Interests.filter(interest2 =>
        !user1Interests.some(interest1 => interest1.id === interest2.id)
      )
    };

    // 推荐活动
    const recommendedActivities = this.recommendActivities(
      commonInterests,
      categoryScores,
      user1Interests,
      user2Interests
    );

    return {
      overallScore,
      categoryScores,
      commonInterests,
      uniqueInterests,
      recommendedActivities
    };
  }

  private calculateCategoryScores(user1Interests: Interest[], user2Interests: Interest[]) {
    const categories = ['entertainment', 'sports', 'food', 'travel'];
    const scores: any = {};

    categories.forEach(category => {
      const user1CategoryInterests = user1Interests.filter(i => i.category === category);
      const user2CategoryInterests = user2Interests.filter(i => i.category === category);

      if (user1CategoryInterests.length === 0 && user2CategoryInterests.length === 0) {
        scores[category] = 0;
        return;
      }

      // 计算该分类的共同兴趣
      const commonCategoryInterests = user1CategoryInterests.filter(interest1 =>
        user2CategoryInterests.some(interest2 => interest2.id === interest1.id)
      );

      // 计算匹配度
      const totalInterests = new Set([
        ...user1CategoryInterests.map(i => i.id),
        ...user2CategoryInterests.map(i => i.id)
      ]).size;

      const commonScore = commonCategoryInterests.length / Math.max(totalInterests, 1);
      
      // 考虑重要程度
      const importanceWeight = commonCategoryInterests.reduce((sum, interest) => {
        const user1Importance = user1Interests.find(i => i.id === interest.id)?.importance || 1;
        const user2Importance = user2Interests.find(i => i.id === interest.id)?.importance || 1;
        return sum + (user1Importance + user2Importance) / 2;
      }, 0) / Math.max(commonCategoryInterests.length, 1);

      scores[category] = Math.min(100, Math.round(commonScore * importanceWeight * 100));
    });

    return scores;
  }

  private calculateOverallScore(categoryScores: any, commonInterests: Interest[]): number {
    const categoryAverage = Object.values(categoryScores).reduce((sum: number, score: any) => sum + score, 0) / 4;
    const commonInterestBonus = Math.min(20, commonInterests.length * 5);
    
    return Math.min(100, Math.round(categoryAverage + commonInterestBonus));
  }

  private recommendActivities(
    commonInterests: Interest[],
    categoryScores: any,
    user1Interests: Interest[],
    user2Interests: Interest[]
  ): Activity[] {
    const allInterests = [...user1Interests, ...user2Interests];
    const interestCounts = new Map<string, number>();
    
    allInterests.forEach(interest => {
      interestCounts.set(interest.id, (interestCounts.get(interest.id) || 0) + 1);
    });

    return this.activities
      .map(activity => {
        // 根据活动类别计算匹配度
        const categoryScore = categoryScores[activity.category] || 0;
        
        // 计算相关兴趣的匹配度
        const relatedInterests = this.getRelatedInterests(activity.category);
        const relatedScore = relatedInterests.reduce((sum, interestId) => {
          const count = interestCounts.get(interestId) || 0;
          return sum + (count > 1 ? 10 : 0);
        }, 0);

        // 计算总匹配度
        const matchScore = Math.round((categoryScore * 0.7 + relatedScore * 0.3));

        return {
          ...activity,
          matchScore
        };
      })
      .filter(activity => activity.matchScore > 30)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }

  private getRelatedInterests(category: string): string[] {
    const relatedMap: Record<string, string[]> = {
      entertainment: ['movies', 'music', 'games', 'concerts', 'theater', 'art'],
      sports: ['basketball', 'football', 'tennis', 'swimming', 'hiking', 'yoga'],
      food: ['chinese', 'western', 'japanese', 'dessert', 'coffee', 'cooking'],
      travel: ['beach', 'mountains', 'city', 'countryside', 'museum', 'shopping']
    };

    return relatedMap[category] || [];
  }

  getMatchLevel(score: number): string {
    if (score >= 90) return '天作之合 💕';
    if (score >= 80) return '心有灵犀 💖';
    if (score >= 70) return '志趣相投 💗';
    if (score >= 60) return '互相吸引 💓';
    return '需要了解 💝';
  }

  getCategoryName(category: string): string {
    const names: Record<string, string> = {
      entertainment: '娱乐',
      sports: '运动',
      food: '美食',
      travel: '旅行'
    };
    return names[category] || category;
  }
}