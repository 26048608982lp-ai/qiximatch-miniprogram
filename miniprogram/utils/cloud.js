// 云开发API工具函数

// 调用云函数
const callCloudFunction = async (name, data = {}) => {
  try {
    // 添加时间戳用于认证
    const requestData = {
      ...data,
      timestamp: Date.now()
    }
    
    const result = await wx.cloud.callFunction({
      name,
      data: requestData
    })
    return result.result
  } catch (error) {
    console.error(`调用云函数 ${name} 失败:`, error)
    throw error
  }
}

// 创建会话
const createSession = async (user1Name, user2Name, user1Interests) => {
  return await callCloudFunction('createSession', {
    user1Name,
    user2Name,
    user1Interests
  })
}

// 获取会话
const getSession = async (sessionId) => {
  return await callCloudFunction('getSession', {
    sessionId
  })
}

// 更新会话
const updateSession = async (sessionId, data) => {
  return await callCloudFunction('updateSession', {
    sessionId,
    ...data
  })
}

// 计算匹配
const calculateMatch = async (sessionId, user2Interests) => {
  return await callCloudFunction('calculateMatch', {
    sessionId,
    user2Interests
  })
}

// 导入通用工具函数
const { wxApi, storage, time, fn } = require('./common')

// 获取匹配等级描述
const getMatchLevel = (score) => {
  if (score >= 90) return '天作之合 💕'
  if (score >= 80) return '心有灵犀 💖'
  if (score >= 70) return '志趣相投 💗'
  if (score >= 60) return '互相吸引 💓'
  return '需要了解 💝'
}

// 获取分类名称
const getCategoryName = (category) => {
  const names = {
    entertainment: '娱乐',
    sports: '运动',
    food: '美食',
    travel: '旅行'
  }
  return names[category] || category
}

module.exports = {
  callCloudFunction,
  createSession,
  getSession,
  updateSession,
  calculateMatch,
  getMatchLevel,
  getCategoryName
}