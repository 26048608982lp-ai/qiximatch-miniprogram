// 云开发API工具函数

// 调用云函数
const callCloudFunction = async (name, data = {}) => {
  try {
    const result = await wx.cloud.callFunction({
      name,
      data
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

// 格式化时间
const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
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

// 显示普通提示
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  })
}

// 显示确认对话框
const showModal = (title, content, confirmText = '确定', cancelText = '取消') => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText,
      cancelText,
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
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

// 保存到本地存储
const setStorage = (key, data) => {
  try {
    wx.setStorageSync(key, data)
    return true
  } catch (error) {
    console.error('保存到本地存储失败:', error)
    return false
  }
}

// 从本地存储获取
const getStorage = (key, defaultValue = null) => {
  try {
    return wx.getStorageSync(key) || defaultValue
  } catch (error) {
    console.error('从本地存储获取失败:', error)
    return defaultValue
  }
}

// 删除本地存储
const removeStorage = (key) => {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (error) {
    console.error('删除本地存储失败:', error)
    return false
  }
}

// 防抖函数
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

module.exports = {
  callCloudFunction,
  createSession,
  getSession,
  updateSession,
  calculateMatch,
  getMatchLevel,
  getCategoryName,
  formatTime,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showToast,
  showModal,
  copyToClipboard,
  setStorage,
  getStorage,
  removeStorage,
  debounce,
  throttle
}