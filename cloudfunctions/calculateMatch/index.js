// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const { sessionAuthMiddleware } = require('../auth-middleware')

// 活动推荐数据
const activities = [
  {
    id: 'movie_night',
    name: '电影之夜',
    category: 'entertainment',
    description: '一起看一场浪漫的电影，享受二人世界',
    duration: '2-3小时',
    cost: '中等'
  },
  {
    id: 'concert',
    name: '演唱会',
    category: 'entertainment',
    description: '参加一场激动人心的演唱会',
    duration: '3-4小时',
    cost: '较高'
  },
  {
    id: 'hiking_date',
    name: '徒步约会',
    category: 'sports',
    description: '一起徒步，享受自然风光',
    duration: '半天',
    cost: '低'
  },
  {
    id: 'cooking_class',
    name: '烹饪课程',
    category: 'food',
    description: '一起学习制作美食',
    duration: '2-3小时',
    cost: '中等'
  },
  {
    id: 'beach_vacation',
    name: '海滩度假',
    category: 'travel',
    description: '享受阳光、沙滩和海浪',
    duration: '几天',
    cost: '较高'
  },
  {
    id: 'museum_visit',
    name: '博物馆之旅',
    category: 'travel',
    description: '一起探索文化和历史',
    duration: '2-3小时',
    cost: '低'
  },
  {
    id: 'game_night',
    name: '游戏之夜',
    category: 'entertainment',
    description: '一起玩游戏，享受竞争的乐趣',
    duration: '2-3小时',
    cost: '低'
  },
  {
    id: 'coffee_date',
    name: '咖啡约会',
    category: 'food',
    description: '在咖啡厅享受悠闲时光',
    duration: '1-2小时',
    cost: '低'
  }
]

// 计算匹配结果的核心算法
function calculateMatchResult(user1Interests, user2Interests) {
  // 计算共同兴趣
  const commonInterests = user1Interests.filter(interest1 =>
    user2Interests.some(interest2 => interest2.id === interest1.id)
  )

  // 计算各分类匹配度
  const categoryScores = calculateCategoryScores(user1Interests, user2Interests)

  // 计算总体匹配度
  const overallScore = calculateOverallScore(categoryScores, commonInterests)

  // 找出独特兴趣
  const uniqueInterests = {
    user1: user1Interests.filter(interest1 =>
      !user2Interests.some(interest2 => interest2.id === interest1.id)
    ),
    user2: user2Interests.filter(interest2 =>
      !user1Interests.some(interest1 => interest1.id === interest2.id)
    )
  }

  // 推荐活动
  const recommendedActivities = recommendActivities(
    commonInterests,
    categoryScores,
    user1Interests,
    user2Interests
  )

  return {
    overallScore,
    categoryScores,
    commonInterests,
    uniqueInterests,
    recommendedActivities
  }
}

// 计算分类匹配度
function calculateCategoryScores(user1Interests, user2Interests) {
  const categories = ['entertainment', 'sports', 'food', 'travel']
  const scores = {}

  categories.forEach(category => {
    const user1CategoryInterests = user1Interests.filter(i => i.category === category)
    const user2CategoryInterests = user2Interests.filter(i => i.category === category)

    if (user1CategoryInterests.length === 0 && user2CategoryInterests.length === 0) {
      scores[category] = 0
      return
    }

    // 计算该分类的共同兴趣
    const commonCategoryInterests = user1CategoryInterests.filter(interest1 =>
      user2CategoryInterests.some(interest2 => interest2.id === interest1.id)
    )

    // 计算匹配度
    const totalInterests = new Set([
      ...user1CategoryInterests.map(i => i.id),
      ...user2CategoryInterests.map(i => i.id)
    ]).size

    const commonScore = commonCategoryInterests.length / Math.max(totalInterests, 1)
    
    // 考虑重要程度
    const importanceWeight = commonCategoryInterests.reduce((sum, interest) => {
      const user1Importance = user1Interests.find(i => i.id === interest.id)?.importance || 1
      const user2Importance = user2Interests.find(i => i.id === interest.id)?.importance || 1
      return sum + (user1Importance + user2Importance) / 2
    }, 0) / Math.max(commonCategoryInterests.length, 1)

    scores[category] = Math.min(100, Math.round(commonScore * importanceWeight * 100))
  })

  return scores
}

// 计算总体匹配度
function calculateOverallScore(categoryScores, commonInterests) {
  const categoryAverage = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / 4
  const commonInterestBonus = Math.min(20, commonInterests.length * 5)
  
  return Math.min(100, Math.round(categoryAverage + commonInterestBonus))
}

// 推荐活动
function recommendActivities(commonInterests, categoryScores, user1Interests, user2Interests) {
  const allInterests = [...user1Interests, ...user2Interests]
  const interestCounts = new Map()
  
  allInterests.forEach(interest => {
    interestCounts.set(interest.id, (interestCounts.get(interest.id) || 0) + 1)
  })

  return activities
    .map(activity => {
      // 根据活动类别计算匹配度
      const categoryScore = categoryScores[activity.category] || 0
      
      // 计算相关兴趣的匹配度
      const relatedInterests = getRelatedInterests(activity.category)
      const relatedScore = relatedInterests.reduce((sum, interestId) => {
        const count = interestCounts.get(interestId) || 0
        return sum + (count > 1 ? 10 : 0)
      }, 0)

      // 计算总匹配度
      const matchScore = Math.round((categoryScore * 0.7 + relatedScore * 0.3))

      return {
        ...activity,
        matchScore
      }
    })
    .filter(activity => activity.matchScore > 30)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6)
}

// 获取相关兴趣
function getRelatedInterests(category) {
  const relatedMap = {
    entertainment: ['movies', 'music', 'games', 'concerts', 'theater', 'art'],
    sports: ['basketball', 'football', 'tennis', 'swimming', 'hiking', 'yoga'],
    food: ['chinese', 'western', 'japanese', 'dessert', 'coffee', 'cooking'],
    travel: ['beach', 'mountains', 'city', 'countryside', 'museum', 'shopping']
  }

  return relatedMap[category] || []
}

// 获取匹配等级描述
function getMatchLevel(score) {
  if (score >= 90) return '天作之合 💕'
  if (score >= 80) return '心有灵犀 💖'
  if (score >= 70) return '志趣相投 💗'
  if (score >= 60) return '互相吸引 💓'
  return '需要了解 💝'
}

// 获取分类名称
function getCategoryName(category) {
  const names = {
    entertainment: '娱乐',
    sports: '运动',
    food: '美食',
    travel: '旅行'
  }
  return names[category] || category
}

// 输入验证函数
function validateInput(data) {
  const errors = []
  
  // 验证会话ID
  if (!data.sessionId || typeof data.sessionId !== 'string') {
    errors.push('会话ID不能为空')
  } else {
    const trimmed = data.sessionId.trim()
    if (trimmed.length < 10 || trimmed.length > 50) {
      errors.push('会话ID格式不正确')
    }
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
      errors.push('会话ID包含非法字符')
    }
  }
  
  // 验证兴趣数组
  if (!Array.isArray(data.user2Interests)) {
    errors.push('兴趣数据必须是数组')
  } else if (data.user2Interests.length === 0) {
    errors.push('请至少选择一个兴趣')
  } else if (data.user2Interests.length > 20) {
    errors.push('兴趣数量不能超过20个')
  } else {
    // 验证每个兴趣项
    const validCategories = ['entertainment', 'sports', 'food', 'travel']
    const validInterests = {
      entertainment: ['movies', 'music', 'games', 'concerts', 'theater', 'art'],
      sports: ['basketball', 'football', 'tennis', 'swimming', 'hiking', 'yoga'],
      food: ['chinese', 'western', 'japanese', 'dessert', 'coffee', 'cooking'],
      travel: ['beach', 'mountains', 'city', 'countryside', 'museum', 'shopping']
    }
    
    for (const interest of data.user2Interests) {
      if (!interest || typeof interest !== 'object') {
        errors.push('兴趣数据格式不正确')
        break
      }
      
      if (!interest.id || !interest.name || !interest.category) {
        errors.push('兴趣数据缺少必要字段')
        break
      }
      
      if (!validCategories.includes(interest.category)) {
        errors.push(`兴趣分类 "${interest.category}" 不存在`)
        break
      }
      
      if (!validInterests[interest.category].includes(interest.id)) {
        errors.push(`兴趣 "${interest.name}" 不存在`)
        break
      }
      
      if (interest.importance !== undefined) {
        const importance = parseInt(interest.importance)
        if (isNaN(importance) || importance < 1 || importance > 5) {
          errors.push('重要程度必须是1-5之间的整数')
          break
        }
      }
    }
  }
  
  return errors
}

// 云函数入口函数
const handler = async (event, context) => {
  const { sessionId, user2Interests } = event
  
  try {
    // 验证输入参数
    const validationErrors = validateInput({ sessionId, user2Interests })
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', ')
      }
    }

    // 获取会话数据（已在中间件中验证）
    const sessionData = event.session
    
    // 检查会话状态
    if (sessionData.status !== 'waiting') {
      return {
        success: false,
        error: '会话状态不正确'
      }
    }
    
    // 计算匹配结果
    const matchResult = calculateMatchResult(sessionData.user1Interests, user2Interests)
    
    // 更新会话数据
    await db.collection('sessions').doc(sessionId).update({
      data: {
        user2Interests,
        matchResult,
        status: 'completed',
        completedAt: new Date(),
        completedBy: event.auth?.openid || 'unknown'
      }
    })
    
    console.log('匹配计算成功:', sessionId, '完成者:', event.auth?.openid)
    
    return {
      success: true,
      matchResult,
      getMatchLevel,
      getCategoryName
    }
    
  } catch (error) {
    console.error('匹配计算失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 使用会话认证中间件包装处理器
exports.main = sessionAuthMiddleware(handler)