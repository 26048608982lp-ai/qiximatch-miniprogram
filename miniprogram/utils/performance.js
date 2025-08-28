// 性能优化工具函数

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

// 图片懒加载
const lazyLoadImage = (selector) => {
  const images = wx.createSelectorQuery().selectAll(selector)
  
  images.boundingClientRect((rects) => {
    rects.forEach((rect) => {
      if (rect.top < wx.getSystemInfoSync().windowHeight) {
        // 图片进入视口，加载图片
        const imageUrl = rect.dataset.src
        if (imageUrl) {
          // 这里可以设置图片的src
          console.log('加载图片:', imageUrl)
        }
      }
    })
  }).exec()
}

// 页面性能监控
const monitorPagePerformance = (pageName) => {
  const performance = wx.getPerformance()
  if (performance) {
    const timing = performance.getEntriesByType('navigation')[0]
    console.log(`页面 ${pageName} 性能数据:`, {
      domReady: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      loadComplete: timing.loadEventEnd - timing.loadEventStart,
      firstPaint: timing.responseEnd - timing.fetchStart
    })
  }
}

// 内存使用监控
const monitorMemoryUsage = () => {
  const memory = wx.getPerformance().memory
  if (memory) {
    console.log('内存使用情况:', {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    })
  }
}

// 缓存管理
const cacheManager = {
  // 设置缓存
  set: (key, data, expireTime = 24 * 60 * 60 * 1000) => {
    try {
      const cacheData = {
        data,
        expireTime: Date.now() + expireTime
      }
      wx.setStorageSync(key, cacheData)
      return true
    } catch (error) {
      console.error('设置缓存失败:', error)
      return false
    }
  },

  // 获取缓存
  get: (key) => {
    try {
      const cacheData = wx.getStorageSync(key)
      if (!cacheData) return null
      
      if (Date.now() > cacheData.expireTime) {
        wx.removeStorageSync(key)
        return null
      }
      
      return cacheData.data
    } catch (error) {
      console.error('获取缓存失败:', error)
      return null
    }
  },

  // 删除缓存
  remove: (key) => {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('删除缓存失败:', error)
      return false
    }
  },

  // 清除过期缓存
  clearExpired: () => {
    try {
      const keys = wx.getStorageInfoSync().keys
      keys.forEach(key => {
        const cacheData = wx.getStorageSync(key)
        if (cacheData && cacheData.expireTime) {
          if (Date.now() > cacheData.expireTime) {
            wx.removeStorageSync(key)
          }
        }
      })
      return true
    } catch (error) {
      console.error('清除过期缓存失败:', error)
      return false
    }
  }
}

// 网络请求优化
const requestManager = {
  // 请求队列
  requestQueue: [],
  // 最大并发数
  maxConcurrent: 3,
  // 当前并发数
  currentConcurrent: 0,

  // 发起请求
  request: (options) => {
    return new Promise((resolve, reject) => {
      const task = {
        options,
        resolve,
        reject,
        startTime: Date.now()
      }
      
      requestManager.requestQueue.push(task)
      requestManager.processQueue()
    })
  },

  // 处理请求队列
  processQueue: () => {
    while (requestManager.currentConcurrent < requestManager.maxConcurrent && 
           requestManager.requestQueue.length > 0) {
      const task = requestManager.requestQueue.shift()
      requestManager.currentConcurrent++
      
      requestManager.executeRequest(task)
    }
  },

  // 执行请求
  executeRequest: (task) => {
    const { options, resolve, reject, startTime } = task
    
    wx.request({
      ...options,
      success: (res) => {
        const endTime = Date.now()
        const requestTime = endTime - startTime
        
        console.log(`请求完成: ${options.url}, 耗时: ${requestTime}ms`)
        
        resolve(res)
      },
      fail: (error) => {
        console.error(`请求失败: ${options.url}`, error)
        reject(error)
      },
      complete: () => {
        requestManager.currentConcurrent--
        requestManager.processQueue()
      }
    })
  }
}

// Canvas性能优化
const canvasOptimizer = {
  // 离屏Canvas
  offscreenCanvas: null,
  
  // 初始化离屏Canvas
  init: (canvasId) => {
    const query = wx.createSelectorQuery()
    query.select(canvasId)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          canvasOptimizer.offscreenCanvas = res[0].node
        }
      })
  },

  // 批量绘制
  batchDraw: (ctx, operations) => {
    ctx.beginPath()
    
    operations.forEach(op => {
      switch (op.type) {
        case 'moveTo':
          ctx.moveTo(op.x, op.y)
          break
        case 'lineTo':
          ctx.lineTo(op.x, op.y)
          break
        case 'arc':
          ctx.arc(op.x, op.y, op.radius, op.startAngle, op.endAngle)
          break
        case 'rect':
          ctx.rect(op.x, op.y, op.width, op.height)
          break
      }
    })
    
    ctx.stroke()
  },

  // 减少重绘
  shouldRedraw: (lastDrawTime, minInterval = 16) => {
    return Date.now() - lastDrawTime >= minInterval
  }
}

// 动画优化
const animationOptimizer = {
  // 使用requestAnimationFrame
  requestAnimationFrame: (callback) => {
    const systemInfo = wx.getSystemInfoSync()
    const platform = systemInfo.platform
    
    if (platform === 'devtools') {
      // 开发工具使用setTimeout
      return setTimeout(callback, 16)
    } else {
      // 真机使用requestAnimationFrame
      return wx.createAnimation({
        duration: 16,
        timingFunction: 'linear'
      }).step().export()
    }
  },

  // 取消动画
  cancelAnimationFrame: (timer) => {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

// 数据预加载
const preloader = {
  // 预加载图片
  preloadImages: (imageList) => {
    imageList.forEach(imageUrl => {
      const img = wx.createImage()
      img.onload = () => {
        console.log('图片预加载成功:', imageUrl)
      }
      img.onerror = () => {
        console.error('图片预加载失败:', imageUrl)
      }
      img.src = imageUrl
    })
  },

  // 预加载数据
  preloadData: (dataList) => {
    return Promise.all(dataList.map(data => {
      return new Promise((resolve) => {
        // 模拟数据加载
        setTimeout(() => {
          resolve(data)
        }, Math.random() * 100)
      })
    }))
  }
}

// 错误监控
const errorMonitor = {
  // 错误日志
  errorLogs: [],
  
  // 记录错误
  logError: (error, context = {}) => {
    const errorLog = {
      message: error.message || error,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: wx.getSystemInfoSync()
    }
    
    errorMonitor.errorLogs.push(errorLog)
    
    // 上报到服务器（可选）
    // wx.cloud.callFunction({
    //   name: 'logError',
    //   data: errorLog
    // })
    
    console.error('错误记录:', errorLog)
  },

  // 获取错误日志
  getErrorLogs: () => {
    return errorMonitor.errorLogs
  },

  // 清除错误日志
  clearErrorLogs: () => {
    errorMonitor.errorLogs = []
  }
}

// 性能优化建议
const performanceTips = {
  // 检查页面性能
  checkPagePerformance: () => {
    const tips = []
    
    // 检查图片大小
    const images = wx.getSystemInfoSync().windowWidth > 750 ? 'large' : 'small'
    tips.push(`当前设备屏幕尺寸: ${images}`)
    
    // 检查网络状况
    tips.push('建议使用CDN加速图片加载')
    
    // 检查缓存使用
    tips.push('合理使用本地缓存减少网络请求')
    
    return tips
  },

  // 获取优化建议
  getOptimizationTips: () => {
    return [
      '使用防抖和节流减少事件触发频率',
      '图片懒加载减少首屏加载时间',
      '合理使用缓存减少网络请求',
      '避免频繁的setData操作',
      '使用Canvas离屏渲染提升绘制性能',
      '组件复用减少内存占用'
    ]
  }
}

module.exports = {
  debounce,
  throttle,
  lazyLoadImage,
  monitorPagePerformance,
  monitorMemoryUsage,
  cacheManager,
  requestManager,
  canvasOptimizer,
  animationOptimizer,
  preloader,
  errorMonitor,
  performanceTips
}