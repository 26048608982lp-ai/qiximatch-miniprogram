// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { sessionId } = event
  
  try {
    // 验证输入参数
    if (!sessionId) {
      return {
        success: false,
        error: '缺少会话ID'
      }
    }

    // 获取会话数据
    const result = await db.collection('sessions').doc(sessionId).get()
    
    if (!result.data) {
      return {
        success: false,
        error: '会话不存在'
      }
    }
    
    const sessionData = result.data
    
    // 检查会话是否过期
    const now = new Date()
    if (now > new Date(sessionData.expireAt)) {
      return {
        success: false,
        error: '会话已过期'
      }
    }
    
    // 增加分享次数
    await db.collection('sessions').doc(sessionId).update({
      data: {
        shareCount: sessionData.shareCount + 1
      }
    })
    
    console.log('获取会话成功:', sessionId)
    
    return {
      success: true,
      data: sessionData
    }
    
  } catch (error) {
    console.error('获取会话失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}