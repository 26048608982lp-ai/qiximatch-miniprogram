// 错误处理工具函数

const { wxApi, logger } = require('./common')

// 错误类型定义
const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

// 错误码映射
const ErrorCodes = {
  NETWORK_ERROR: 'NET_001',
  VALIDATION_ERROR: 'VAL_001',
  AUTH_ERROR: 'AUTH_001',
  SERVER_ERROR: 'SRV_001',
  TIMEOUT_ERROR: 'TMO_001',
  UNKNOWN_ERROR: 'UNK_001'
}

// 错误消息映射
const ErrorMessages = {
  [ErrorCodes.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorCodes.VALIDATION_ERROR]: '输入数据格式不正确',
  [ErrorCodes.AUTH_ERROR]: '身份验证失败',
  [ErrorCodes.SERVER_ERROR]: '服务器内部错误',
  [ErrorCodes.TIMEOUT_ERROR]: '请求超时，请重试',
  [ErrorCodes.UNKNOWN_ERROR]: '未知错误，请稍后重试'
}

// 创建应用错误对象
class AppError extends Error {
  constructor(type, message, code, details = {}) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = code || ErrorCodes[type]
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

// 错误处理器
const ErrorHandler = {
  // 判断错误类型
  classifyError(error) {
    if (error instanceof AppError) {
      return error.type
    }
    
    if (error.message && error.message.includes('network')) {
      return ErrorTypes.NETWORK
    }
    
    if (error.message && error.message.includes('timeout')) {
      return ErrorTypes.TIMEOUT
    }
    
    if (error.message && (error.message.includes('auth') || error.message.includes('unauthorized'))) {
      return ErrorTypes.AUTH
    }
    
    if (error.message && error.message.includes('validation')) {
      return ErrorTypes.VALIDATION
    }
    
    if (error.message && error.message.includes('server')) {
      return ErrorTypes.SERVER
    }
    
    return ErrorTypes.UNKNOWN
  },
  
  // 获取用户友好的错误消息
  getUserFriendlyMessage(error) {
    if (error instanceof AppError) {
      return error.message
    }
    
    const errorType = this.classifyError(error)
    const errorCode = ErrorCodes[errorType]
    return ErrorMessages[errorCode] || ErrorMessages[ErrorCodes.UNKNOWN_ERROR]
  },
  
  // 处理错误
  handleError(error, context = {}) {
    const errorType = this.classifyError(error)
    const userMessage = this.getUserFriendlyMessage(error)
    
    // 记录错误日志
    logger.error('Error occurred:', {
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
    
    // 显示用户友好的错误消息
    wxApi.showError(userMessage)
    
    return {
      success: false,
      error: userMessage,
      errorType,
      timestamp: new Date().toISOString()
    }
  },
  
  // 创建特定类型的错误
  createError(type, message, details = {}) {
    return new AppError(type, message, ErrorCodes[type], details)
  },
  
  // 异步操作包装器
  async withErrorHandling(asyncFn, context = {}) {
    try {
      return await asyncFn()
    } catch (error) {
      return this.handleError(error, context)
    }
  },
  
  // 重试机制
  async retryWithBackoff(asyncFn, maxRetries = 3, baseDelay = 1000, context = {}) {
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          break
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1)
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message)
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    return this.handleError(lastError, { ...context, retryAttempts: maxRetries })
  }
}

// 网络请求错误处理
const NetworkErrorHandler = {
  // 检查网络状态
  checkNetworkStatus() {
    return new Promise((resolve, reject) => {
      wx.getNetworkType({
        success: (res) => {
          if (res.networkType === 'none') {
            reject(ErrorHandler.createError(ErrorTypes.NETWORK, '网络不可用'))
          } else {
            resolve(res)
          }
        },
        fail: (error) => {
          reject(ErrorHandler.createError(ErrorTypes.NETWORK, '获取网络状态失败'))
        }
      })
    })
  },
  
  // 带网络检查的请求
  async requestWithNetworkCheck(requestFn) {
    try {
      await this.checkNetworkStatus()
      return await requestFn()
    } catch (error) {
      if (error.type === ErrorTypes.NETWORK) {
        return ErrorHandler.handleError(error)
      }
      throw error
    }
  }
}

// 验证错误处理
const ValidationErrorHandler = {
  // 处理验证错误
  handleValidationError(validationResult) {
    if (validationResult.valid) {
      return { success: true, value: validationResult.value }
    }
    
    const error = ErrorHandler.createError(
      ErrorTypes.VALIDATION, 
      validationResult.message,
      { validationResult }
    )
    
    return ErrorHandler.handleError(error)
  },
  
  // 批量验证
  validateMultiple(validations) {
    const errors = []
    
    for (const [field, validationResult] of Object.entries(validations)) {
      if (!validationResult.valid) {
        errors.push({
          field,
          message: validationResult.message
        })
      }
    }
    
    if (errors.length > 0) {
      const error = ErrorHandler.createError(
        ErrorTypes.VALIDATION,
        `验证失败: ${errors.map(e => e.message).join(', ')}`,
        { errors }
      )
      return ErrorHandler.handleError(error)
    }
    
    return { success: true }
  }
}

module.exports = {
  ErrorTypes,
  ErrorCodes,
  ErrorMessages,
  AppError,
  ErrorHandler,
  NetworkErrorHandler,
  ValidationErrorHandler
}