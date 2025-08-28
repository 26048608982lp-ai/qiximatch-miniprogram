// 首页页面逻辑
const sessionManager = require('../../utils/session')
const { getCurrentSession, clearCurrentSession, createNewSession } = require('../../utils/session')
const { validateUsername, validateMultiple } = require('../../utils/validator')

Page({
  data: {
    user1Name: '',
    user2Name: '',
    currentSession: null,
    isLoading: false,
    // 动画数据
    heartAnimation: false,
    showContent: false
  },

  onLoad(options) {
    console.log('首页加载，参数：', options)
    
    // 检查是否有分享链接参数
    if (options.sessionId) {
      // 如果有sessionId，跳转到用户选择页
      wx.redirectTo({
        url: `/pages/user-select/user-select?sessionId=${options.sessionId}`
      })
      return
    }
    
    // 检查当前会话
    this.checkCurrentSession()
    
    // 设置页面动画
    this.setPageAnimations()
  },

  onShow() {
    // 每次显示页面时检查会话状态
    this.checkCurrentSession()
  },

  onReady() {
    // 页面准备完成，显示内容
    setTimeout(() => {
      this.setData({
        showContent: true
      })
    }, 300)
  },

  // 设置页面动画
  setPageAnimations() {
    // 心形动画
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

  // 检查当前会话
  checkCurrentSession() {
    const currentSession = getCurrentSession()
    
    if (currentSession) {
      // 检查会话是否过期
      if (sessionManager.isSessionExpired(currentSession)) {
        clearCurrentSession()
        return
      }
      
      this.setData({
        currentSession
      })
    }
  },

  // 输入框变化事件
  onUser1NameInput(e) {
    this.setData({
      user1Name: e.detail.value
    })
  },

  onUser2NameInput(e) {
    this.setData({
      user2Name: e.detail.value
    })
  },

  // 开始匹配
  async startMatching() {
    const { user1Name, user2Name, currentSession } = this.data
    
    // 验证输入
    const validation = validateMultiple({
      user1Name: () => validateUsername(user1Name),
      user2Name: () => validateUsername(user2Name)
    })
    
    if (!validation.valid) {
      wx.showToast({
        title: validation.errors[0],
        icon: 'none'
      })
      return
    }
    
    // 防止重复提交
    if (this.data.isLoading) return
    
    this.setData({
      isLoading: true
    })
    
    try {
      if (currentSession && currentSession.status === 'waiting') {
        // 如果有待完成的会话，直接跳转到用户选择页
        wx.navigateTo({
          url: '/pages/user-select/user-select'
        })
      } else {
        // 创建新会话，跳转到兴趣选择页
        const result = await createNewSession(
          validation.results.user1Name.value,
          validation.results.user2Name.value,
          [] // 初始为空兴趣列表
        )
        
        if (result.success) {
          wx.navigateTo({
            url: '/pages/user-select/user-select'
          })
        } else {
          wx.showToast({
            title: '创建会话失败，请重试',
            icon: 'error'
          })
        }
      }
    } catch (error) {
      console.error('开始匹配失败：', error)
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'error'
      })
    } finally {
      this.setData({
        isLoading: false
      })
    }
  },

  // 清除当前会话
  clearSession() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除当前的匹配记录吗？',
      success: (res) => {
        if (res.confirm) {
          clearCurrentSession()
          this.setData({
            currentSession: null,
            user1Name: '',
            user2Name: ''
          })
          wx.showToast({
            title: '已清除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '七夕情侣匹配测试 - 看看你们有多匹配',
      path: '/pages/index/index',
      imageUrl: '/images/share.png'
    }
  },

  // 页面卸载时清除定时器
  onUnload() {
    this.clearIntervals()
  },

  // 页面隐藏时清除定时器
  onHide() {
    this.clearIntervals()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.checkCurrentSession()
    wx.stopPullDownRefresh()
  }
})