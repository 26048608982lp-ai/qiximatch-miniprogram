// 通用工具函数模块

// 微信小程序API封装
const wxApi = {
  // 显示加载提示
  showLoading: (title = '加载中...') => {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading: () => {
    wx.hideLoading()
  },

  // 显示成功提示
  showSuccess: (title, duration = 2000) => {
    wx.showToast({
      title,
      icon: 'success',
      duration
    })
  },

  // 显示错误提示
  showError: (title, duration = 2000) => {
    wx.showToast({
      title,
      icon: 'error',
      duration
    })
  },

  // 显示普通提示
  showToast: (title, icon = 'none', duration = 2000) => {
    wx.showToast({
      title,
      icon,
      duration
    })
  },

  // 显示确认对话框
  showModal: (title, content, confirmText = '确定', cancelText = '取消') => {
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
  },

  // 复制到剪贴板
  copyToClipboard: (data) => {
    return new Promise((resolve, reject) => {
      wx.setClipboardData({
        data: typeof data === 'string' ? data : JSON.stringify(data),
        success: () => {
          wxApi.showSuccess('复制成功')
          resolve(true)
        },
        fail: (error) => {
          wxApi.showError('复制失败')
          reject(error)
        }
      })
    })
  }
}

// 本地存储工具
const storage = {
  // 保存到本地存储
  set: (key, data) => {
    try {
      wx.setStorageSync(key, data)
      return true
    } catch (error) {
      console.error('保存到本地存储失败:', error)
      return false
    }
  },

  // 从本地存储获取
  get: (key, defaultValue = null) => {
    try {
      return wx.getStorageSync(key) || defaultValue
    } catch (error) {
      console.error('从本地存储获取失败:', error)
      return defaultValue
    }
  },

  // 删除本地存储
  remove: (key) => {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('删除本地存储失败:', error)
      return false
    }
  },

  // 清空本地存储
  clear: () => {
    try {
      wx.clearStorageSync()
      return true
    } catch (error) {
      console.error('清空本地存储失败:', error)
      return false
    }
  }
}

// 时间格式化工具
const time = {
  // 格式化时间
  format: (date) => {
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${Math.floor(diff / 86400000)}天前`
  },

  // 获取当前时间戳
  timestamp: () => Date.now(),

  // 格式化日期
  formatDate: (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }
}

// 函数式工具
const fn = {
  // 防抖函数
  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // 节流函数
  throttle: (func, limit) => {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // 延迟执行
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // 重试函数
  retry: async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await fn.delay(delay)
      }
    }
  }
}

// 数据处理工具
const data = {
  // 深拷贝
  clone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => data.clone(item))
    if (typeof obj === 'object') {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = data.clone(obj[key])
        }
      }
      return clonedObj
    }
  },

  // 数组去重
  unique: (array, key) => {
    if (key) {
      const seen = new Set()
      return array.filter(item => {
        const value = item[key]
        if (seen.has(value)) {
          return false
        }
        seen.add(value)
        return true
      })
    }
    return [...new Set(array)]
  },

  // 数组分组
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key]
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(item)
      return groups
    }, {})
  },

  // 对象排序
  sort: (array, key, order = 'asc') => {
    return array.sort((a, b) => {
      const valueA = a[key]
      const valueB = b[key]
      
      if (order === 'asc') {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })
  }
}

// 字符串工具
const string = {
  // 生成随机字符串
  random: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // 截断字符串
  truncate: (str, length, suffix = '...') => {
    if (str.length <= length) return str
    return str.substring(0, length) + suffix
  },

  // 驼峰转下划线
  camelToSnake: (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  },

  // 下划线转驼峰
  snakeToCamel: (str) => {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
  }
}

// URL工具
const url = {
  // 解析URL参数
  parseParams: (urlString) => {
    const params = {}
    const queryString = urlString.split('?')[1]
    if (!queryString) return params
    
    const pairs = queryString.split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=')
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
    return params
  },

  // 构建URL参数
  buildParams: (params) => {
    return Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  }
}

// 设备信息工具
const device = {
  // 获取设备信息
  getInfo: () => {
    try {
      return wx.getSystemInfoSync()
    } catch (error) {
      console.error('获取设备信息失败:', error)
      return null
    }
  },

  // 判断是否为iOS
  isIOS: () => {
    const system = device.getInfo()?.system || ''
    return system.toLowerCase().includes('ios')
  },

  // 判断是否为Android
  isAndroid: () => {
    const system = device.getInfo()?.system || ''
    return system.toLowerCase().includes('android')
  }
}

// 日志工具
const logger = {
  // 日志级别
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },

  // 当前日志级别
  currentLevel: 2, // INFO

  // 记录日志
  log: (level, message, ...args) => {
    if (level > logger.currentLevel) return
    
    const timestamp = time.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const prefix = `[${timestamp}] [${level}]`
    
    switch (level) {
      case 0:
        console.error(prefix, message, ...args)
        break
      case 1:
        console.warn(prefix, message, ...args)
        break
      case 2:
        console.info(prefix, message, ...args)
        break
      case 3:
        console.debug(prefix, message, ...args)
        break
    }
  },

  // 便捷方法
  error: (message, ...args) => logger.log(0, message, ...args),
  warn: (message, ...args) => logger.log(1, message, ...args),
  info: (message, ...args) => logger.log(2, message, ...args),
  debug: (message, ...args) => logger.log(3, message, ...args)
}

module.exports = {
  wxApi,
  storage,
  time,
  fn,
  data,
  string,
  url,
  device,
  logger
}