// 分享功能工具函数
const { getCurrentSession } = require('./session')
const { showModal, showSuccess, showError } = require('./cloud')

// 生成分享信息
const generateShareInfo = (pageType, sessionData = null) => {
  if (!sessionData) {
    sessionData = getCurrentSession()
  }
  
  if (!sessionData) {
    return null
  }
  
  const { sessionId, user1Name, user2Name, status, matchResult } = sessionData
  
  // 根据页面类型生成不同的分享信息
  switch (pageType) {
    case 'user-select':
      return {
        title: `${user1Name}邀请你进行七夕匹配`,
        path: `/pages/user-select/user-select?sessionId=${sessionId}`,
        imageUrl: '/images/share-invite.png',
        shareText: `💌 ${user1Name} 邀请你进行七夕匹配测试\n\n点击链接，开始你的兴趣选择：\n${generateMiniProgramPath(sessionId)}\n\n💕 完成后就能看到你们的匹配结果哦！`
      }
      
    case 'share':
      return {
        title: `${user1Name}邀请你进行七夕匹配`,
        path: `/pages/user-select/user-select?sessionId=${sessionId}`,
        imageUrl: '/images/share-invite.png',
        shareText: `💌 ${user1Name} 邀请你进行七夕匹配测试\n\n点击链接，开始你的兴趣选择：\n${generateMiniProgramPath(sessionId)}\n\n💕 完成后就能看到你们的匹配结果哦！`
      }
      
    case 'results':
      if (matchResult) {
        const matchLevel = getMatchLevel(matchResult.overallScore)
        return {
          title: `${user1Name} & ${user2Name} 的匹配结果：${matchResult.overallScore}%`,
          path: `/pages/results/results?sessionId=${sessionId}`,
          imageUrl: '/images/share-result.png',
          shareText: `💕 ${user1Name} & ${user2Name} 的七夕匹配结果\n\n匹配度：${matchResult.overallScore}%\n匹配等级：${matchLevel}\n\n共同兴趣：${matchResult.commonInterests.length}个\n推荐活动：${matchResult.recommendedActivities.length}个\n\n点击链接查看详细结果：\n${generateMiniProgramPath(sessionId)}`
        }
      }
      break
      
    default:
      return {
        title: '七夕匹配测试',
        path: '/pages/index/index',
        imageUrl: '/images/share-default.png',
        shareText: '💕 七夕情侣匹配测试\n\n发现你们之间的兴趣匹配，找到最适合的约会活动！\n\n点击链接开始测试：\nhttps://mini.program/qixi-match'
      }
  }
  
  return null
}

// 生成小程序路径
const generateMiniProgramPath = (sessionId) => {
  return `/pages/user-select/user-select?sessionId=${sessionId}`
}

// 获取匹配等级
const getMatchLevel = (score) => {
  if (score >= 90) return '天作之合 💕'
  if (score >= 80) return '心有灵犀 💖'
  if (score >= 70) return '志趣相投 💗'
  if (score >= 60) return '互相吸引 💓'
  return '需要了解 💝'
}

// 分享到微信好友
const shareToWechat = (shareInfo) => {
  return {
    title: shareInfo.title,
    path: shareInfo.path,
    imageUrl: shareInfo.imageUrl,
    success: () => {
      showSuccess('分享成功')
    },
    fail: () => {
      showError('分享失败')
    }
  }
}

// 分享到朋友圈
const shareToMoments = () => {
  showModal({
    title: '分享到朋友圈',
    content: '请截图保存当前页面，然后分享到朋友圈',
    showCancel: true,
    confirmText: '我知道了'
  })
}

// 复制分享链接
const copyShareLink = async (shareText) => {
  try {
    await wx.setClipboardData({
      data: shareText,
      success: () => {
        showSuccess('分享链接已复制到剪贴板')
      },
      fail: () => {
        showError('复制失败，请手动复制')
      }
    })
  } catch (error) {
    console.error('复制分享链接失败:', error)
    showError('复制失败，请手动复制')
  }
}

// 生成小程序码（模拟功能）
const generateQRCode = () => {
  showModal({
    title: '小程序码',
    content: '小程序码功能正在开发中，请使用其他分享方式',
    showCancel: true,
    confirmText: '我知道了'
  })
}

// 生成海报分享（模拟功能）
const generatePoster = () => {
  showModal({
    title: '生成海报',
    content: '海报生成功能正在开发中，请使用其他分享方式',
    showCancel: true,
    confirmText: '我知道了'
  })
}

// 分享统计
const logShareEvent = (shareType, pageType, sessionId) => {
  // 这里可以添加分享统计逻辑
  console.log('分享事件:', {
    shareType,
    pageType,
    sessionId,
    timestamp: new Date().toISOString()
  })
  
  // 可以调用云函数记录分享事件
  // wx.cloud.callFunction({
  //   name: 'logShare',
  //   data: { shareType, pageType, sessionId }
  // })
}

// 统一的分享处理函数
const handleShare = (shareType, pageType, sessionData = null) => {
  const shareInfo = generateShareInfo(pageType, sessionData)
  
  if (!shareInfo) {
    showError('分享信息生成失败')
    return
  }
  
  // 记录分享事件
  logShareEvent(shareType, pageType, shareInfo.sessionId || sessionData?.sessionId)
  
  switch (shareType) {
    case 'wechat':
      return shareToWechat(shareInfo)
      
    case 'moments':
      shareToMoments()
      break
      
    case 'link':
      copyShareLink(shareInfo.shareText)
      break
      
    case 'qrcode':
      generateQRCode()
      break
      
    case 'poster':
      generatePoster()
      break
      
    default:
      showError('不支持的分享方式')
  }
}

// 获取当前页面的分享配置
const getCurrentPageShareConfig = (pageType) => {
  const shareInfo = generateShareInfo(pageType)
  
  if (!shareInfo) {
    return {
      title: '七夕匹配测试',
      path: '/pages/index/index',
      imageUrl: '/images/share-default.png'
    }
  }
  
  return {
    title: shareInfo.title,
    path: shareInfo.path,
    imageUrl: shareInfo.imageUrl
  }
}

// 检查分享权限
const checkShareAuth = () => {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => {
        const authSetting = res.authSetting
        if (authSetting['scope.writePhotosAlbum']) {
          resolve(true)
        } else {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => resolve(true),
            fail: () => resolve(false)
          })
        }
      },
      fail: () => resolve(false)
    })
  })
}

// 保存图片到相册
const saveImageToAlbum = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        showSuccess('图片已保存到相册')
        resolve(true)
      },
      fail: (error) => {
        console.error('保存图片失败:', error)
        if (error.errMsg.includes('auth deny')) {
          showModal({
            title: '授权提示',
            content: '需要您授权保存图片到相册',
            confirmText: '去授权',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          showError('保存图片失败')
        }
        reject(error)
      }
    })
  })
}

module.exports = {
  generateShareInfo,
  generateMiniProgramPath,
  getMatchLevel,
  shareToWechat,
  shareToMoments,
  copyShareLink,
  generateQRCode,
  generatePoster,
  logShareEvent,
  handleShare,
  getCurrentPageShareConfig,
  checkShareAuth,
  saveImageToAlbum
}