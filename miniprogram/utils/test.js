// 功能测试文件

// 测试工具函数
const testUtils = {
  // 断言函数
  assert: (condition, message) => {
    if (!condition) {
      throw new Error(`测试失败: ${message}`)
    }
    console.log(`✅ 测试通过: ${message}`)
  },

  // 测试匹配算法
  testMatchingAlgorithm: () => {
    console.log('🧪 开始测试匹配算法...')
    
    // 模拟用户数据
    const user1Interests = [
      { id: 'movies', name: '看电影', category: 'entertainment', icon: '🎬', importance: 5 },
      { id: 'music', name: '听音乐', category: 'entertainment', icon: '🎵', importance: 4 },
      { id: 'hiking', name: '徒步', category: 'sports', icon: '🥾', importance: 3 }
    ]
    
    const user2Interests = [
      { id: 'movies', name: '看电影', category: 'entertainment', icon: '🎬', importance: 4 },
      { id: 'games', name: '玩游戏', category: 'entertainment', icon: '🎮', importance: 5 },
      { id: 'hiking', name: '徒步', category: 'sports', icon: '🥾', importance: 4 }
    ]
    
    // 计算匹配结果
    const matchResult = calculateMatchResult(user1Interests, user2Interests)
    
    // 验证结果结构
    testUtils.assert(
      typeof matchResult.overallScore === 'number' && 
      matchResult.overallScore >= 0 && 
      matchResult.overallScore <= 100,
      '匹配度应该在0-100之间'
    )
    
    testUtils.assert(
      Array.isArray(matchResult.commonInterests),
      '共同兴趣应该是数组'
    )
    
    testUtils.assert(
      matchResult.commonInterests.length === 2,
      '应该有2个共同兴趣'
    )
    
    testUtils.assert(
      typeof matchResult.categoryScores === 'object',
      '分类分数应该是对象'
    )
    
    testUtils.assert(
      Array.isArray(matchResult.recommendedActivities),
      '推荐活动应该是数组'
    )
    
    console.log('🎉 匹配算法测试通过!')
    return true
  },

  // 测试会话管理
  testSessionManager: () => {
    console.log('🧪 开始测试会话管理...')
    
    // 测试会话创建
    const sessionData = {
      sessionId: 'test_session_123',
      user1Name: '测试用户A',
      user2Name: '测试用户B',
      user1Interests: [],
      user2Interests: [],
      status: 'waiting',
      createdAt: Date.now(),
      expireAt: Date.now() + 24 * 60 * 60 * 1000
    }
    
    // 测试本地存储
    try {
      wx.setStorageSync('test_session', sessionData)
      const storedData = wx.getStorageSync('test_session')
      
      testUtils.assert(
        storedData.sessionId === sessionData.sessionId,
        '会话数据应该正确存储'
      )
      
      // 清理测试数据
      wx.removeStorageSync('test_session')
      
      console.log('🎉 会话管理测试通过!')
      return true
    } catch (error) {
      console.error('❌ 会话管理测试失败:', error)
      return false
    }
  },

  // 测试云函数
  testCloudFunctions: async () => {
    console.log('🧪 开始测试云函数...')
    
    try {
      // 测试createSession云函数
      const createResult = await wx.cloud.callFunction({
        name: 'createSession',
        data: {
          user1Name: '云函数测试A',
          user2Name: '云函数测试B',
          user1Interests: []
        }
      })
      
      testUtils.assert(
        createResult.result.success,
        'createSession云函数应该调用成功'
      )
      
      const sessionId = createResult.result.sessionId
      
      // 测试getSession云函数
      const getResult = await wx.cloud.callFunction({
        name: 'getSession',
        data: { sessionId }
      })
      
      testUtils.assert(
        getResult.result.success,
        'getSession云函数应该调用成功'
      )
      
      // 测试updateSession云函数
      const updateResult = await wx.cloud.callFunction({
        name: 'updateSession',
        data: {
          sessionId,
          status: 'completed'
        }
      })
      
      testUtils.assert(
        updateResult.result.success,
        'updateSession云函数应该调用成功'
      )
      
      console.log('🎉 云函数测试通过!')
      return true
    } catch (error) {
      console.error('❌ 云函数测试失败:', error)
      return false
    }
  },

  // 测试分享功能
  testShareFunction: () => {
    console.log('🧪 开始测试分享功能...')
    
    // 测试分享链接生成
    const sessionId = 'test_share_session'
    const shareLink = generateShareLink(sessionId)
    
    testUtils.assert(
      typeof shareLink === 'string',
      '分享链接应该是字符串'
    )
    
    testUtils.assert(
      shareLink.includes(sessionId),
      '分享链接应该包含会话ID'
    )
    
    console.log('🎉 分享功能测试通过!')
    return true
  },

  // 测试Canvas组件
  testCanvasComponent: () => {
    console.log('🧪 开始测试Canvas组件...')
    
    // 测试Canvas绘制
    try {
      const query = wx.createSelectorQuery()
      query.select('#test-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            
            // 测试基本绘制
            ctx.clearRect(0, 0, 100, 100)
            ctx.fillStyle = '#ff0000'
            ctx.fillRect(0, 0, 50, 50)
            
            console.log('🎉 Canvas组件测试通过!')
            return true
          }
        })
    } catch (error) {
      console.error('❌ Canvas组件测试失败:', error)
      return false
    }
  },

  // 运行所有测试
  runAllTests: async () => {
    console.log('🚀 开始运行所有测试...')
    
    const results = []
    
    try {
      results.push({ name: '匹配算法', result: testUtils.testMatchingAlgorithm() })
      results.push({ name: '会话管理', result: testUtils.testSessionManager() })
      results.push({ name: '分享功能', result: testUtils.testShareFunction() })
      
      // 如果在云开发环境中，测试云函数
      if (wx.cloud) {
        results.push({ name: '云函数', result: await testUtils.testCloudFunctions() })
      }
      
      // 如果Canvas可用，测试Canvas组件
      results.push({ name: 'Canvas组件', result: testUtils.testCanvasComponent() })
      
    } catch (error) {
      console.error('测试运行失败:', error)
    }
    
    // 输出测试结果
    console.log('\n📊 测试结果汇总:')
    results.forEach(({ name, result }) => {
      const status = result ? '✅ 通过' : '❌ 失败'
      console.log(`${name}: ${status}`)
    })
    
    const passedTests = results.filter(r => r.result).length
    const totalTests = results.length
    
    console.log(`\n🎯 测试完成: ${passedTests}/${totalTests} 通过`)
    
    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests
    }
  }
}

// 模拟匹配算法（用于测试）
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
  const activities = [
    {
      id: 'movie_night',
      name: '电影之夜',
      category: 'entertainment',
      description: '一起看一场浪漫的电影',
      matchScore: 0,
      duration: '2-3小时',
      cost: '中等'
    }
  ]
  
  return activities.map(activity => ({
    ...activity,
    matchScore: Math.floor(Math.random() * 40) + 60
  }))
}

// 模拟分享链接生成
function generateShareLink(sessionId) {
  return `/pages/user-select/user-select?sessionId=${sessionId}`
}

module.exports = testUtils