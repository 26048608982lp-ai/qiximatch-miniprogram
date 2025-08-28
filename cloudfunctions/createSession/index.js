// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const { authMiddleware } = require('../auth-middleware')

// 生成安全的会话ID
function generateSessionId() {
  // 使用时间戳 + 随机数生成更安全的ID
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  
  // 在云环境中使用更安全的随机数生成
  try {
    const crypto = require('crypto')
    const randomBytes = crypto.randomBytes(8)
    const cryptoPart = randomBytes.toString('hex').substring(0, 12)
    return timestamp + randomPart + cryptoPart
  } catch (e) {
    // 降级方案
    return timestamp + randomPart + Math.random().toString(36).substring(2, 8)
  }
}

// 输入验证函数
function validateInput(data) {
  const errors = []
  
  // 验证用户名
  if (!data.user1Name || typeof data.user1Name !== 'string') {
    errors.push('用户1姓名不能为空')
  } else {
    const trimmed = data.user1Name.trim()
    if (trimmed.length < 2 || trimmed.length > 20) {
      errors.push('用户1姓名长度必须在2-20个字符之间')
    }
    if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmed)) {
      errors.push('用户1姓名包含非法字符')
    }
  }
  
  if (!data.user2Name || typeof data.user2Name !== 'string') {
    errors.push('用户2姓名不能为空')
  } else {
    const trimmed = data.user2Name.trim()
    if (trimmed.length < 2 || trimmed.length > 20) {
      errors.push('用户2姓名长度必须在2-20个字符之间')
    }
    if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmed)) {
      errors.push('用户2姓名包含非法字符')
    }
  }
  
  // 验证兴趣数组
  if (!Array.isArray(data.user1Interests)) {
    errors.push('兴趣数据必须是数组')
  } else if (data.user1Interests.length > 20) {
    errors.push('兴趣数量不能超过20个')
  }
  
  return errors
}

// 云函数入口函数
const handler = async (event, context) => {
  const { user1Name, user2Name, user1Interests } = event
  
  try {
    // 验证输入参数
    const validationErrors = validateInput({ user1Name, user2Name, user1Interests })
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', ')
      }
    }

    // 生成会话ID
    const sessionId = generateSessionId()
    
    // 设置过期时间（24小时后）
    const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    // 清理和消毒输入数据
    const sanitizeInput = (input) => {
      if (typeof input !== 'string') return input
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;')
        .trim()
    }
    
    // 创建会话数据
    const sessionData = {
      _id: sessionId,
      user1Name: sanitizeInput(user1Name),
      user2Name: sanitizeInput(user2Name),
      user1Interests: user1Interests, // 兴趣数据在客户端已验证
      user2Interests: [],
      status: 'waiting',
      createdAt: new Date(),
      expireAt,
      shareCount: 0,
      createdBy: event.auth?.openid || 'unknown'
    }
    
    // 插入数据库
    const result = await db.collection('sessions').add({
      data: sessionData
    })
    
    console.log('会话创建成功:', sessionId, '创建者:', event.auth?.openid)
    
    return {
      success: true,
      sessionId,
      data: sessionData
    }
    
  } catch (error) {
    console.error('创建会话失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 使用认证中间件包装处理器
exports.main = authMiddleware(handler)