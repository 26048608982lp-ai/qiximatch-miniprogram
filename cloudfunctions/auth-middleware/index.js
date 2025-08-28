// 云函数认证中间件

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 验证微信小程序调用
const verifyWeChatContext = (context) => {
  // 检查是否为微信小程序调用
  if (!context || !context.WXENV) {
    return false
  }
  
  // 检查用户信息
  if (!context.APPID || !context.OPENID || !context.UNIONID) {
    return false
  }
  
  return true
}

// 验证请求来源
const verifyRequestSource = (event) => {
  // 检查必要字段
  if (!event || typeof event !== 'object') {
    return false
  }
  
  // 检查时间戳（防止重放攻击）
  if (!event.timestamp || Date.now() - event.timestamp > 300000) { // 5分钟有效期
    return false
  }
  
  return true
}

// 验证请求频率
class RateLimiter {
  constructor() {
    this.requests = new Map()
    this.windowMs = 60000 // 1分钟窗口
    this.maxRequests = 30 // 每分钟最大请求数
  }
  
  isAllowed(identifier) {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [])
    }
    
    const userRequests = this.requests.get(identifier)
    
    // 清理过期请求
    const validRequests = userRequests.filter(time => time > windowStart)
    this.requests.set(identifier, validRequests)
    
    // 检查是否超过限制
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    // 记录新请求
    validRequests.push(now)
    return true
  }
  
  cleanup() {
    // 定期清理过期的请求记录
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart)
      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }
}

// 全局限流器实例
const rateLimiter = new RateLimiter()

// 认证中间件
const authMiddleware = (handler) => {
  return async (event, context) => {
    try {
      // 验证微信上下文
      if (!verifyWeChatContext(context)) {
        return {
          success: false,
          error: '非法调用',
          code: 'AUTH_INVALID_CONTEXT'
        }
      }
      
      // 验证请求来源
      if (!verifyRequestSource(event)) {
        return {
          success: false,
          error: '请求格式不正确',
          code: 'AUTH_INVALID_REQUEST'
        }
      }
      
      // 限流检查
      const identifier = context.OPENID || event.ip || 'unknown'
      if (!rateLimiter.isAllowed(identifier)) {
        return {
          success: false,
          error: '请求过于频繁，请稍后重试',
          code: 'AUTH_RATE_LIMIT'
        }
      }
      
      // 清理过期的限流记录
      rateLimiter.cleanup()
      
      // 添加认证信息到事件中
      event.auth = {
        openid: context.OPENID,
        appid: context.APPID,
        unionid: context.UNIONID,
        env: context.ENV,
        timestamp: Date.now()
      }
      
      // 调用原始处理器
      return await handler(event, context)
      
    } catch (error) {
      console.error('认证中间件错误:', error)
      return {
        success: false,
        error: '认证失败',
        code: 'AUTH_MIDDLEWARE_ERROR'
      }
    }
  }
}

// 会话认证中间件
const sessionAuthMiddleware = (handler) => {
  return async (event, context) => {
    try {
      // 首先通过基础认证
      const authResult = await authMiddleware(handler)(event, context)
      if (!authResult.success) {
        return authResult
      }
      
      // 验证会话ID
      if (!event.sessionId) {
        return {
          success: false,
          error: '缺少会话ID',
          code: 'AUTH_MISSING_SESSION'
        }
      }
      
      // 验证会话格式
      if (typeof event.sessionId !== 'string' || event.sessionId.length < 10 || event.sessionId.length > 50) {
        return {
          success: false,
          error: '会话ID格式不正确',
          code: 'AUTH_INVALID_SESSION'
        }
      }
      
      // 验证会话权限
      const db = cloud.database()
      const sessionDoc = await db.collection('sessions').doc(event.sessionId).get()
      
      if (!sessionDoc.data) {
        return {
          success: false,
          error: '会话不存在',
          code: 'AUTH_SESSION_NOT_FOUND'
        }
      }
      
      const sessionData = sessionDoc.data
      
      // 检查会话是否过期
      if (sessionData.expireAt && new Date(sessionData.expireAt) < new Date()) {
        return {
          success: false,
          error: '会话已过期',
          code: 'AUTH_SESSION_EXPIRED'
        }
      }
      
      // 检查会话状态
      if (sessionData.status === 'completed') {
        return {
          success: false,
          error: '会话已完成',
          code: 'AUTH_SESSION_COMPLETED'
        }
      }
      
      // 添加会话信息到事件中
      event.session = sessionData
      
      // 调用原始处理器
      return await handler(event, context)
      
    } catch (error) {
      console.error('会话认证中间件错误:', error)
      return {
        success: false,
        error: '会话认证失败',
        code: 'AUTH_SESSION_MIDDLEWARE_ERROR'
      }
    }
  }
}

// 管理员认证中间件
const adminAuthMiddleware = (handler) => {
  return async (event, context) => {
    try {
      // 首先通过基础认证
      const authResult = await authMiddleware(handler)(event, context)
      if (!authResult.success) {
        return authResult
      }
      
      // 验证管理员密钥
      if (!event.adminKey || event.adminKey !== process.env.ADMIN_KEY) {
        return {
          success: false,
          error: '管理员权限不足',
          code: 'AUTH_ADMIN_REQUIRED'
        }
      }
      
      // 调用原始处理器
      return await handler(event, context)
      
    } catch (error) {
      console.error('管理员认证中间件错误:', error)
      return {
        success: false,
        error: '管理员认证失败',
        code: 'AUTH_ADMIN_MIDDLEWARE_ERROR'
      }
    }
  }
}

module.exports = {
  authMiddleware,
  sessionAuthMiddleware,
  adminAuthMiddleware,
  verifyWeChatContext,
  verifyRequestSource,
  RateLimiter
}