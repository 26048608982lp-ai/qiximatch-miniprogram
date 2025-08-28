// 分享页面逻辑
const { getCurrentSession, generateShareLink, copyShareLink } = require('../../utils/session')
const { showLoading, hideLoading, showSuccess, showError, showModal } = require('../../utils/cloud')

Page({
  data: {
    // 会话数据
    sessionData: null,
    sessionId: '',
    user1Name: '',
    user2Name: '',
    
    // 分享链接
    shareLink: '',
    shareText: '',
    
    // 页面状态
    isLoading: false,
    showContent: false,
    
    // 分享方式
    shareMethods: [
      {
        id: 'wechat',
        name: '微信好友',
        icon: '💬',
        description: '分享给微信好友'
      },
      {
        id: 'moments',
        name: '朋友圈',
        icon: '🌟',
        description: '分享到朋友圈'
      },
      {
        id: 'link',
        name: '复制链接',
        icon: '🔗',
        description: '复制分享链接'
      },
      {
        id: 'qrcode',
        name: '小程序码',
        icon: '📱',
        description: '生成小程序码'
      }
    ],
    
    // 动画效果
    heartAnimation: false,
    showActions: false
  },

  onLoad(options) {
    console.log('分享页加载，参数：', options)
    
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
        showContent: true,
        showActions: true
      })
    }, 300)
    
    // 开始心形动画
    this.startHeartAnimation()
  },

  // 初始化页面
  async initPage() {
    try {
      showLoading('正在加载数据...')
      
      // 获取当前会话
      const sessionData = getCurrentSession()
      
      if (!sessionData) {
        // 如果没有会话数据，返回首页
        hideLoading()
        wx.showModal({
          title: '提示',
          content: '分享数据丢失，请重新开始',
          showCancel: false,
          success: () => {
            wx.redirectTo({
              url: '/pages/index/index'
            })
          }
        })
        return
      }
      
      // 生成分享链接
      const shareInfo = generateShareLink(sessionData.sessionId)
      const shareText = this.generateShareText(sessionData)
      
      this.setData({
        sessionData,
        sessionId: sessionData.sessionId,
        user1Name: sessionData.user1Name,
        user2Name: sessionData.user2Name,
        shareLink: shareInfo.path,
        shareText
      })
      
      hideLoading()
      
    } catch (error) {
      console.error('初始化页面失败:', error)
      hideLoading()
      showError('加载失败，请重试')
    }
  },

  // 生成分享文本
  generateShareText(sessionData) {
    const { user1Name, user2Name } = sessionData
    
    return `💌 七夕情侣匹配测试

${user1Name} 邀请你进行七夕匹配测试，看看你们有多匹配！

点击下方链接，开始你的兴趣选择：
${this.data.shareLink}

💕 完成后就能看到你们的匹配结果和推荐活动哦！`
  },

  // 刷新数据
  refreshData() {
    const sessionData = getCurrentSession()
    if (sessionData) {
      const shareInfo = generateShareLink(sessionData.sessionId)
      const shareText = this.generateShareText(sessionData)
      
      this.setData({
        sessionData,
        sessionId: sessionData.sessionId,
        user1Name: sessionData.user1Name,
        user2Name: sessionData.user2Name,
        shareLink: shareInfo.path,
        shareText
      })
    }
  },

  // 心形动画
  startHeartAnimation() {
    this.heartInterval = setInterval(() => {
      this.setData({
        heartAnimation: true
      })
      
      setTimeout(() => {
        this.setData({
          heartAnimation: false
        })
      }, 1000)
    }, 3000)
  },

  // 清理定时器
  clearIntervals() {
    if (this.heartInterval) {
      clearInterval(this.heartInterval)
      this.heartInterval = null
    }
  },

  // 处理分享方式选择
  handleShareMethod(e) {
    const method = e.currentTarget.dataset.method
    
    switch (method) {
      case 'wechat':
        this.shareToWechat()
        break
      case 'moments':
        this.shareToMoments()
        break
      case 'link':
        this.copyShareLink()
        break
      case 'qrcode':
        this.generateQRCode()
        break
    }
  },

  // 分享给微信好友
  shareToWechat() {
    const { user1Name, user2Name, sessionId } = this.data
    
    return {
      title: `${user1Name}邀请你进行七夕匹配`,
      path: `/pages/user-select/user-select?sessionId=${sessionId}`,
      imageUrl: '/images/share.png',
      success: () => {
        showSuccess('分享成功')
      },
      fail: () => {
        showError('分享失败')
      }
    }
  },

  // 分享到朋友圈
  shareToMoments() {
    const { user1Name, user2Name } = this.data
    
    wx.showModal({
      title: '分享到朋友圈',
      content: '请截图保存此页面，然后分享到朋友圈',
      showCancel: true,
      confirmText: '我知道了'
    })
  },

  // 复制分享链接
  async copyShareLink() {
    const { shareText } = this.data
    
    try {
      await copyShareLink(shareText)
    } catch (error) {
      console.error('复制分享链接失败:', error)
      showError('复制失败，请手动复制')
    }
  },

  // 生成小程序码
  generateQRCode() {
    wx.showModal({
      title: '小程序码',
      content: '小程序码功能正在开发中，请使用其他分享方式',
      showCancel: true,
      confirmText: '我知道了'
    })
  },

  // 我就是对方，开始填写
  startFill() {
    const { sessionId } = this.data
    
    wx.navigateTo({
      url: `/pages/user-select/user-select?sessionId=${sessionId}`
    })
  },

  // 返回修改
  goBack() {
    wx.navigateBack()
  },

  // 返回首页
  goHome() {
    wx.showModal({
      title: '确认返回',
      content: '返回首页将丢失当前进度，确定要返回吗？',
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/index/index'
          })
        }
      }
    })
  },

  // 预览结果
  previewResults() {
    wx.showModal({
      title: '提示',
      content: '需要对方完成选择后才能查看结果',
      showCancel: true,
      confirmText: '我知道了'
    })
  },

  // 分享功能
  onShareAppMessage() {
    const { user1Name, sessionId } = this.data
    return {
      title: `${user1Name}邀请你进行七夕匹配`,
      path: `/pages/user-select/user-select?sessionId=${sessionId}`,
      imageUrl: '/images/share.png'
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