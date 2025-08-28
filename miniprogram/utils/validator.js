// 输入验证工具模块

// 验证用户名
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: '用户名不能为空' }
  }
  
  const trimmed = username.trim()
  if (trimmed.length === 0) {
    return { valid: false, message: '用户名不能为空' }
  }
  
  if (trimmed.length < 2) {
    return { valid: false, message: '用户名至少需要2个字符' }
  }
  
  if (trimmed.length > 20) {
    return { valid: false, message: '用户名不能超过20个字符' }
  }
  
  // 检查特殊字符
  const specialChars = /[<>:"/\\|?*\x00-\x1F]/
  if (specialChars.test(trimmed)) {
    return { valid: false, message: '用户名包含非法字符' }
  }
  
  return { valid: true, value: trimmed }
}

// 验证会话ID
const validateSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string') {
    return { valid: false, message: '会话ID不能为空' }
  }
  
  const trimmed = sessionId.trim()
  if (trimmed.length === 0) {
    return { valid: false, message: '会话ID不能为空' }
  }
  
  if (trimmed.length < 10) {
    return { valid: false, message: '会话ID格式不正确' }
  }
  
  // 检查格式：只允许字母数字
  const format = /^[a-zA-Z0-9]+$/
  if (!format.test(trimmed)) {
    return { valid: false, message: '会话ID格式不正确' }
  }
  
  return { valid: true, value: trimmed }
}

// 验证兴趣数据
const validateInterests = (interests) => {
  if (!Array.isArray(interests)) {
    return { valid: false, message: '兴趣数据格式不正确' }
  }
  
  if (interests.length === 0) {
    return { valid: false, message: '请至少选择一个兴趣' }
  }
  
  if (interests.length > 20) {
    return { valid: false, message: '最多只能选择20个兴趣' }
  }
  
  const validCategories = ['entertainment', 'sports', 'food', 'travel']
  const validInterests = {
    entertainment: ['movies', 'music', 'games', 'concerts', 'theater', 'art'],
    sports: ['basketball', 'football', 'tennis', 'swimming', 'hiking', 'yoga'],
    food: ['chinese', 'western', 'japanese', 'dessert', 'coffee', 'cooking'],
    travel: ['beach', 'mountains', 'city', 'countryside', 'museum', 'shopping']
  }
  
  for (const interest of interests) {
    // 检查基本结构
    if (!interest || typeof interest !== 'object') {
      return { valid: false, message: '兴趣数据格式不正确' }
    }
    
    if (!interest.id || !interest.name || !interest.category) {
      return { valid: false, message: '兴趣数据缺少必要字段' }
    }
    
    // 检查分类
    if (!validCategories.includes(interest.category)) {
      return { valid: false, message: `兴趣分类 "${interest.category}" 不存在` }
    }
    
    // 检查兴趣ID
    if (!validInterests[interest.category].includes(interest.id)) {
      return { valid: false, message: `兴趣 "${interest.name}" 不存在` }
    }
    
    // 检查重要程度
    if (interest.importance !== undefined) {
      const importance = parseInt(interest.importance)
      if (isNaN(importance) || importance < 1 || importance > 5) {
        return { valid: false, message: '重要程度必须是1-5之间的整数' }
      }
    }
  }
  
  return { valid: true, value: interests }
}

// 验证重要程度
const validateImportance = (importance) => {
  const value = parseInt(importance)
  if (isNaN(value) || value < 1 || value > 5) {
    return { valid: false, message: '重要程度必须是1-5之间的整数' }
  }
  return { valid: true, value }
}

// 清理和消毒输入
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  // 移除潜在的XSS攻击字符
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

// 验证数字范围
const validateNumberRange = (number, min, max, fieldName = '数值') => {
  const num = parseInt(number)
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName}必须是数字` }
  }
  
  if (num < min || num > max) {
    return { valid: false, message: `${fieldName}必须在${min}-${max}之间` }
  }
  
  return { valid: true, value: num }
}

// 验证必填字段
const validateRequired = (value, fieldName = '字段') => {
  if (value === undefined || value === null || value === '') {
    return { valid: false, message: `${fieldName}不能为空` }
  }
  
  if (typeof value === 'string' && value.trim().length === 0) {
    return { valid: false, message: `${fieldName}不能为空` }
  }
  
  return { valid: true, value }
}

// 批量验证
const validateMultiple = (validations) => {
  const errors = []
  const results = {}
  
  for (const [key, validation] of Object.entries(validations)) {
    const result = validation()
    results[key] = result
    
    if (!result.valid) {
      errors.push(result.message)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    results
  }
}

module.exports = {
  validateUsername,
  validateSessionId,
  validateInterests,
  validateImportance,
  sanitizeInput,
  validateNumberRange,
  validateRequired,
  validateMultiple
}