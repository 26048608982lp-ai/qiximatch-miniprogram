// 会话管理工具

const app = getApp()
const { createSession, getSession, updateSession, calculateMatch, setStorage, getStorage, removeStorage } = require('./cloud')

// 本地存储键名
const STORAGE_KEYS = {
  CURRENT_SESSION: 'current_session',
  USER_INFO: 'user_info',
  SETTINGS: 'settings'
}

// 生成会话ID
const generateSessionId = () => {
  return Math.random().toString(36).substr(2, 9)
}

// 创建新会话
const createNewSession = async (user1Name, user2Name, user1Interests) => {
  try {
    showLoading('正在创建会话...')
    
    const result = await createSession(user1Name, user2Name, user1Interests)
    
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
      
      setStorage(STORAGE_KEYS.CURRENT_SESSION, sessionData)
      
      hideLoading()
      return {
        success: true,
        sessionId: result.sessionId,
        data: sessionData
      }
    } else {
      hideLoading()
      showError('创建会话失败')
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    hideLoading()
    console.error('创建会话失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取会话信息
const getSessionInfo = async (sessionId) => {
  try {
    showLoading('正在获取会话...')
    
    const result = await getSession(sessionId)
    
    if (result.success) {
      hideLoading()
      return {
        success: true,
        data: result.data
      }
    } else {
      hideLoading()
      showError('获取会话失败')
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    hideLoading()
    console.error('获取会话失败:', error)
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
      const localSession = getStorage(STORAGE_KEYS.CURRENT_SESSION)
      if (localSession) {
        const updatedSession = { ...localSession, ...updateData }
        setStorage(STORAGE_KEYS.CURRENT_SESSION, updatedSession)
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
    console.error('更新会话失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 计算匹配结果
const calculateMatchResult = async (sessionId, user2Interests) => {
  try {
    showLoading('正在计算匹配...')
    
    const result = await calculateMatch(sessionId, user2Interests)
    
    if (result.success) {
      // 更新本地存储
      const localSession = getStorage(STORAGE_KEYS.CURRENT_SESSION)
      if (localSession) {
        const updatedSession = {
          ...localSession,
          user2Interests,
          matchResult: result.matchResult,
          status: 'completed'
        }
        setStorage(STORAGE_KEYS.CURRENT_SESSION, updatedSession)
      }
      
      hideLoading()
      return {
        success: true,
        matchResult: result.matchResult,
        getMatchLevel: result.getMatchLevel,
        getCategoryName: result.getCategoryName
      }
    } else {
      hideLoading()
      showError('计算匹配失败')
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    hideLoading()
    console.error('计算匹配失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取当前会话
const getCurrentSession = () => {
  return getStorage(STORAGE_KEYS.CURRENT_SESSION)
}

// 清除当前会话
const clearCurrentSession = () => {
  removeStorage(STORAGE_KEYS.CURRENT_SESSION)
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
  
  return await copyToClipboard(shareText)
}

// 保存用户设置
const saveUserSettings = (settings) => {
  return setStorage(STORAGE_KEYS.SETTINGS, settings)
}

// 获取用户设置
const getUserSettings = () => {
  return getStorage(STORAGE_KEYS.SETTINGS, {
    enableNotifications: true,
    autoSave: true,
    theme: 'default'
  })
}

// 显示加载提示
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载提示
const hideLoading = () => {
  wx.hideLoading()
}

// 显示成功提示
const showSuccess = (title, duration = 2000) => {
  wx.showToast({
    title,
    icon: 'success',
    duration
  })
}

// 显示错误提示
const showError = (title, duration = 2000) => {
  wx.showToast({
    title,
    icon: 'error',
    duration
  })
}

// 复制到剪贴板
const copyToClipboard = (data) => {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: typeof data === 'string' ? data : JSON.stringify(data),
      success: () => {
        showSuccess('复制成功')
        resolve(true)
      },
      fail: (error) => {
        showError('复制失败')
        reject(error)
      }
    })
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