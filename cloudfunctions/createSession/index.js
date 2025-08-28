// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 生成会话ID
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9)
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { user1Name, user2Name, user1Interests } = event
  
  try {
    // 验证输入参数
    if (!user1Name || !user2Name || !user1Interests) {
      return {
        success: false,
        error: '缺少必要参数'
      }
    }

    // 生成会话ID
    const sessionId = generateSessionId()
    
    // 设置过期时间（24小时后）
    const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    // 创建会话数据
    const sessionData = {
      _id: sessionId,
      user1Name,
      user2Name,
      user1Interests,
      user2Interests: [],
      status: 'waiting',
      createdAt: new Date(),
      expireAt,
      shareCount: 0
    }
    
    // 插入数据库
    const result = await db.collection('sessions').add({
      data: sessionData
    })
    
    console.log('会话创建成功:', sessionId)
    
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