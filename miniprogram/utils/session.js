// 会话管理工具

const app = getApp()
const { createSession, getSession, updateSession, calculateMatch } = require('./cloud')
const { wxApi, storage, logger } = require('./common')
const { ErrorHandler, NetworkErrorHandler, ValidationErrorHandler, ErrorTypes } = require('./errorHandler')

// 本地存储键名
const STORAGE_KEYS = {
  CURRENT_SESSION: 'current_session',
  USER_INFO: 'user_info',
  SETTINGS: 'settings'
}

// 生成安全的会话ID
const generateSessionId = () => {
  // 使用时间戳 + 随机数生成更安全的ID
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const cryptoPart = () => {
    try {
      const array = new Uint8Array(8)
      crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(36).padStart(2, '0')).join('')
    } catch (e) {
      // 降级方案
      return Math.random().toString(36).substring(2, 15)
    }
  }
  
  return timestamp + randomPart + cryptoPart().substring(0, 8)
}

// 创建新会话
const createNewSession = async (user1Name, user2Name, user1Interests) => {
  return await ErrorHandler.withErrorHandling(async () => {
    wxApi.showLoading('正在创建会话...')
    
    const result = await ErrorHandler.retryWithBackoff(async () => {
      return await createSession(user1Name, user2Name, user1Interests)
    }, 3, 1000, { operation: 'createSession', user1Name, user2Name })
    
    if (result.success) {
      // 保存当前会话到本地
      const sessionData = {
        sessionId: result.sessionId,
        user1Name,
        user2Name,
        user1Interests,
        status: 'waiting',
        createdAt: new Date()
      }
      
      storage.set(STORAGE_KEYS.CURRENT_SESSION, sessionData)
      
      wxApi.hideLoading()
      return {
        success: true,
        sessionId: result.sessionId,
        data: sessionData
      }
    } else {
      throw ErrorHandler.createError(ErrorTypes.SERVER, result.error)
    }
  }, { operation: 'createNewSession' })
}

// 获取会话信息
const getSessionInfo = async (sessionId) => {
  try {
    wxApi.showLoading('正在获取会话...')
    
    const result = await getSession(sessionId)
    
    if (result.success) {
      wxApi.hideLoading()
      return {
        success: true,
        data: result.data
      }
    } else {
      wxApi.hideLoading()
      wxApi.showError('获取会话失败')
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    wxApi.hideLoading()
    logger.error('获取会话失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 更新会话信息
const updateSessionInfo = async (sessionId, updateData) => {
  try {
    const result = await updateSession(sessionId, updateData)
    
    if (result.success) {
      // 更新本地存储
      const localSession = storage.get(STORAGE_KEYS.CURRENT_SESSION)
      if (localSession) {
        const updatedSession = { ...localSession, ...updateData }
        storage.set(STORAGE_KEYS.CURRENT_SESSION, updatedSession)
      }
      
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    logger.error('更新会话失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 计算匹配结果
const calculateMatchResult = async (sessionId, user2Interests) => {
  try {
    wxApi.showLoading('正在计算匹配...')
    
    const result = await calculateMatch(sessionId, user2Interests)
    
    if (result.success) {
      // 更新本地存储
      const localSession = storage.get(STORAGE_KEYS.CURRENT_SESSION)
      if (localSession) {
        const updatedSession = {
          ...localSession,
          user2Interests,
          matchResult: result.matchResult,
          status: 'completed'
        }
        storage.set(STORAGE_KEYS.CURRENT_SESSION, updatedSession)
      }
      
      wxApi.hideLoading()
      return {
        success: true,
        matchResult: result.matchResult,
        getMatchLevel: result.getMatchLevel,
        getCategoryName: result.getCategoryName
      }
    } else {
      wxApi.hideLoading()
      wxApi.showError('计算匹配失败')
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    wxApi.hideLoading()
    logger.error('计算匹配失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取当前会话
const getCurrentSession = () => {
  return storage.get(STORAGE_KEYS.CURRENT_SESSION)
}

// 清除当前会话
const clearCurrentSession = () => {
  storage.remove(STORAGE_KEYS.CURRENT_SESSION)
}

// 检查会话是否过期
const isSessionExpired = (sessionData) => {
  if (!sessionData || !sessionData.expireAt) return true
  
  const now = new Date()
  const expireAt = new Date(sessionData.expireAt)
  
  return now > expireAt
}

// 生成分享链接
const generateShareLink = (sessionId) => {
  // 小程序页面路径
  const path = `/pages/user-select/user-select?sessionId=${sessionId}`
  
  // 如果是在小程序内，返回页面路径
  // 如果需要分享到外部，可以生成小程序码
  return {
    path,
    miniProgramPath: path,
    // 可以添加其他分享信息
    title: '七夕情侣匹配测试',
    imageUrl: '/images/share.png'
  }
}

// 复制分享链接
const copyShareLink = async (sessionId) => {
  const shareInfo = generateShareLink(sessionId)
  
  // 创建分享文本
  const shareText = `💌 七夕情侣匹配测试\n\n点击链接，看看你们有多匹配！\n\n小程序路径：${shareInfo.path}`
  
  return await wxApi.copyToClipboard(shareText)
}

// 保存用户设置
const saveUserSettings = (settings) => {
  return storage.set(STORAGE_KEYS.SETTINGS, settings)
}

// 获取用户设置
const getUserSettings = () => {
  return storage.get(STORAGE_KEYS.SETTINGS, {
    enableNotifications: true,
    autoSave: true,
    theme: 'default'
  })
}

module.exports = {
  generateSessionId,
  createNewSession,
  getSessionInfo,
  updateSessionInfo,
  calculateMatchResult,
  getCurrentSession,
  clearCurrentSession,
  isSessionExpired,
  generateShareLink,
  copyShareLink,
  saveUserSettings,
  getUserSettings,
  STORAGE_KEYS
}