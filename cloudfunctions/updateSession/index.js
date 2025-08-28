// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { sessionId, user2Interests, matchResult, status } = event
  
  try {
    // 验证输入参数
    if (!sessionId) {
      return {
        success: false,
        error: '缺少会话ID'
      }
    }

    // 构建更新数据
    const updateData = {}
    if (user2Interests) updateData.user2Interests = user2Interests
    if (matchResult) updateData.matchResult = matchResult
    if (status) updateData.status = status
    
    // 更新会话数据
    const result = await db.collection('sessions').doc(sessionId).update({
      data: updateData
    })
    
    console.log('更新会话成功:', sessionId)
    
    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error('更新会话失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}