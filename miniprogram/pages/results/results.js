// 结果页面逻辑
const { getCurrentSession, generateShareLink, copyShareLink } = require('../../utils/session')
const { showLoading, hideLoading, showSuccess, showError, showModal, copyToClipboard } = require('../../utils/cloud')

const app = getApp()

Page({
  data: {
    // 匹配结果
    matchResult: null,
    user1Name: '',
    user2Name: '',
    
    // 页面状态
    isLoading: false,
    showContent: false,
    
    // 动画相关
    scoreAnimation: 0,
    showScore: false,
    showSections: false,
    
    // 分享相关
    shareLink: '',
    shareText: '',
    
    // 会话数据
    sessionData: null
  },

  onLoad(options) {
    console.log('结果页加载，参数：', options)
    
    // 初始化页面
    this.initPage()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.refreshData()
  },

  onReady() {
    // 页面准备完成，显示内容
    setTimeout(() => {
      this.setData({
        showContent: true
      })
      this.startAnimations()
    }, 300)
  },

  // 初始化页面
  async initPage() {
    try {
      showLoading('正在加载结果...')
      
      // 获取匹配结果
      const matchResult = this.getMatchResult()
      
      if (!matchResult) {
        // 如果没有匹配结果，返回首页
        hideLoading()
        wx.showModal({
          title: '提示',
          content: '匹配结果丢失，请重新开始',
          showCancel: false,
          success: () => {
            wx.redirectTo({
              url: '/pages/index/index'
            })
          }
        })
        return
      }
      
      // 获取会话数据
      const sessionData = getCurrentSession()
      
      // 生成分享信息
      const shareInfo = this.generateShareInfo(matchResult, sessionData)
      
      this.setData({
        matchResult,
        user1Name: sessionData?.user1Name || '用户A',
        user2Name: sessionData?.user2Name || '用户B',
        sessionData,
        shareLink: shareInfo.link,
        shareText: shareInfo.text
      })
      
      hideLoading()
      
    } catch (error) {
      console.error('初始化页面失败:', error)
      hideLoading()
      showError('加载失败，请重试')
    }
  },

  // 获取匹配结果
  getMatchResult() {
    // 从全局数据中获取匹配结果
    const matchResult = app.globalData.matchResult
    const getMatchLevel = app.globalData.getMatchLevel
    const getCategoryName = app.globalData.getCategoryName
    
    if (matchResult) {
      // 添加辅助函数
      matchResult.getMatchLevel = getMatchLevel
      matchResult.getCategoryName = getCategoryName
      return matchResult
    }
    
    // 从本地存储获取
    const sessionData = getCurrentSession()
    return sessionData?.matchResult || null
  },

  // 生成分享信息
  generateShareInfo(matchResult, sessionData) {
    const { user1Name, user2Name } = sessionData || {}
    const matchLevel = matchResult.getMatchLevel(matchResult.overallScore)
    
    const link = generateShareLink(sessionData?.sessionId || '').path
    
    const text = `💕 ${user1Name} & ${user2Name} 的七夕匹配结果
    
匹配度：${matchResult.overallScore}%
匹配等级：${matchLevel}
    
共同兴趣：${matchResult.commonInterests.length}个
推荐活动：${matchResult.recommendedActivities.length}个
    
点击链接查看详细结果：
${link}`
    
    return { link, text }
  },

  // 开始动画
  startAnimations() {
    // 分数动画
    setTimeout(() => {
      this.setData({
        showScore: true
      })
      this.animateScore()
    }, 500)
    
    // 内容区域动画
    setTimeout(() => {
      this.setData({
        showSections: true
      })
    }, 1000)
  },

  // 分数动画
  animateScore() {
    const targetScore = this.data.matchResult.overallScore
    let currentScore = 0
    
    this.scoreAnimation = setInterval(() => {
      currentScore += 2
      if (currentScore >= targetScore) {
        currentScore = targetScore
        clearInterval(this.scoreAnimation)
        this.scoreAnimation = null
      }
      
      this.setData({
        scoreAnimation: currentScore
      })
    }, 30)
  },

  // 清理定时器
  clearIntervals() {
    if (this.scoreAnimation) {
      clearInterval(this.scoreAnimation)
      this.scoreAnimation = null
    }
  },

  // 刷新数据
  refreshData() {
    const matchResult = this.getMatchResult()
    const sessionData = getCurrentSession()
    
    if (matchResult && sessionData) {
      const shareInfo = this.generateShareInfo(matchResult, sessionData)
      
      this.setData({
        matchResult,
        user1Name: sessionData.user1Name || '用户A',
        user2Name: sessionData.user2Name || '用户B',
        sessionData,
        shareLink: shareInfo.link,
        shareText: shareInfo.text
      })
    }
  },

  // 获取匹配等级描述
  getMatchLevel(score) {
    if (score >= 90) return '天作之合 💕'
    if (score >= 80) return '心有灵犀 💖'
    if (score >= 70) return '志趣相投 💗'
    if (score >= 60) return '互相吸引 💓'
    return '需要了解 💝'
  },

  // 获取分类名称
  getCategoryName(category) {
    const names = {
      entertainment: '娱乐',
      sports: '运动',
      food: '美食',
      travel: '旅行'
    }
    return names[category] || category
  },

  // 复制分享链接
  async copyResultsLink() {
    const { shareText } = this.data
    
    try {
      await copyToClipboard(shareText)
    } catch (error) {
      console.error('复制分享链接失败:', error)
      showError('复制失败，请手动复制')
    }
  },

  // 重新开始
  restart() {
    wx.showModal({
      title: '确认重新开始',
      content: '确定要清除当前结果，重新开始匹配吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除全局数据
          app.globalData.matchResult = null
          app.globalData.getMatchLevel = null
          app.globalData.getCategoryName = null
          
          wx.redirectTo({
            url: '/pages/index/index'
          })
        }
      }
    })
  },

  // 返回首页
  goHome() {
    wx.redirectTo({
      url: '/pages/index/index'
    })
  },

  // 查看建议
  viewSuggestions() {
    const { matchResult } = this.data
    
    let suggestions = ''
    
    // 基于共同兴趣的建议
    if (matchResult.commonInterests.length > 0) {
      const topInterest = matchResult.commonInterests[0]
      suggestions += `💕 基于共同兴趣：\n多参与${topInterest.name}相关的活动，创造共同回忆。\n\n`
    } else {
      suggestions += `💕 基于共同兴趣：\n尝试一起探索新的兴趣，发现彼此的新一面。\n\n`
    }
    
    // 基于独特兴趣的建议
    if (matchResult.uniqueInterests.user1.length > 0 || matchResult.uniqueInterests.user2.length > 0) {
      suggestions += `💝 基于独特兴趣：\n互相分享各自的专长，教会对方新的技能。`
    } else {
      suggestions += `💝 基于独特兴趣：\n一起尝试全新的活动，共同成长。`
    }
    
    wx.showModal({
      title: '💡 增进感情的小建议',
      content: suggestions,
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 分享功能
  onShareAppMessage() {
    const { user1Name, user2Name, matchResult, sessionData } = this.data
    
    return {
      title: `${user1Name} & ${user2Name} 的匹配结果：${matchResult.overallScore}%`,
      path: `/pages/results/results?sessionId=${sessionData?.sessionId}`,
      imageUrl: '/images/results-share.png'
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
    wx.stopPullDownRefresh()
  },

  // 页面卸载时清除定时器
  onUnload() {
    this.clearIntervals()
  },

  // 页面隐藏时清除定时器
  onHide() {
    this.clearIntervals()
  }
})