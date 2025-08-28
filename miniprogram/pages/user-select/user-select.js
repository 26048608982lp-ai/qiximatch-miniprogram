// 兴趣选择页面逻辑
const sessionManager = require('../../utils/session')
const { getCurrentSession, createNewSession, updateSessionInfo, calculateMatchResult } = require('../../utils/session')
const { showLoading, hideLoading, showSuccess, showError, showModal } = require('../../utils/cloud')

const app = getApp()

Page({
  data: {
    // 页面状态
    isLoading: false,
    isUser1: true, // 是否是用户1
    userName: '', // 当前用户姓名
    otherUserName: '', // 对方姓名
    
    // 兴趣数据
    activeCategory: 'entertainment',
    selectedInterests: [],
    
    // 星空图数据
    showConstellation: false,
    
    // 会话数据
    sessionId: '',
    sessionData: null,
    
    // 页面动画
    showContent: false,
    
    // 兴趣分类
    interestCategories: [
      {
        id: 'entertainment',
        name: '娱乐',
        icon: '🎬'
      },
      {
        id: 'sports',
        name: '运动',
        icon: '🏀'
      },
      {
        id: 'food',
        name: '美食',
        icon: '🍽️'
      },
      {
        id: 'travel',
        name: '旅行',
        icon: '🧳'
      }
    ]
  },

  onLoad(options) {
    console.log('兴趣选择页加载，参数：', options)
    
    // 获取会话ID
    const sessionId = options.sessionId || ''
    this.setData({ sessionId })
    
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
    }, 300)
  },

  // 初始化页面
  async initPage() {
    try {
      showLoading('正在加载数据...')
      
      // 获取当前会话
      const sessionData = await this.getSessionData()
      
      if (!sessionData) {
        // 如果没有会话数据，返回首页
        wx.redirectTo({
          url: '/pages/index/index'
        })
        return
      }
      
      // 判断当前是用户1还是用户2
      const isUser1 = this.determineUserType(sessionData)
      
      // 设置页面数据
      this.setData({
        sessionData,
        isUser1,
        userName: isUser1 ? sessionData.user1Name : sessionData.user2Name,
        otherUserName: isUser1 ? sessionData.user2Name : sessionData.user1Name,
        selectedInterests: isUser1 ? sessionData.user1Interests || [] : []
      })
      
      hideLoading()
      
    } catch (error) {
      console.error('初始化页面失败:', error)
      hideLoading()
      showError('加载失败，请重试')
    }
  },

  // 获取会话数据
  async getSessionData() {
    const { sessionId } = this.data
    
    if (sessionId) {
      // 从云端获取会话数据
      const result = await sessionManager.getSessionInfo(sessionId)
      if (result.success) {
        return result.data
      }
    } else {
      // 从本地获取会话数据
      return getCurrentSession()
    }
    
    return null
  },

  // 判断用户类型
  determineUserType(sessionData) {
    // 如果用户2还没有完成兴趣选择，则当前用户是用户2
    if (sessionData.status === 'waiting' && !sessionData.user2Interests) {
      return false
    }
    
    // 如果用户1还没有兴趣数据，则当前用户是用户1
    if (!sessionData.user1Interests || sessionData.user1Interests.length === 0) {
      return true
    }
    
    // 默认为用户2
    return false
  },

  // 刷新数据
  refreshData() {
    // 重新获取会话数据
    this.getSessionData().then(sessionData => {
      if (sessionData) {
        const isUser1 = this.determineUserType(sessionData)
        this.setData({
          sessionData,
          isUser1,
          userName: isUser1 ? sessionData.user1Name : sessionData.user2Name,
          otherUserName: isUser1 ? sessionData.user2Name : sessionData.user1Name,
          selectedInterests: isUser1 ? sessionData.user1Interests || [] : []
        })
      }
    })
  },

  // 切换分类
  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.category
    this.setData({
      activeCategory: categoryId
    })
  },

  // 切换星空图显示
  toggleConstellation() {
    this.setData({
      showConstellation: !this.data.showConstellation
    })
  },

  // 处理兴趣选择（星空图）
  handleInterestSelect(e) {
    const { interest } = e.detail
    this.handleInterestSelectInternal(interest)
  },

  // 处理兴趣选择（列表）
  handleInterestClick(e) {
    const { interest } = e.currentTarget.dataset
    this.handleInterestSelectInternal(interest)
  },

  // 内部兴趣选择处理
  handleInterestSelectInternal(interest) {
    const { selectedInterests } = this.data
    
    // 检查是否已经选中
    const existingIndex = selectedInterests.findIndex(item => item.id === interest.id)
    
    let newSelection
    if (existingIndex >= 0) {
      // 如果已选中，则移除
      newSelection = selectedInterests.filter(item => item.id !== interest.id)
    } else {
      // 如果未选中，则添加
      newSelection = [...selectedInterests, { ...interest, importance: 1 }]
    }
    
    this.setData({
      selectedInterests: newSelection
    })
    
    // 更新会话数据
    this.updateSessionInterests(newSelection)
  },

  // 更新兴趣重要程度
  updateInterestImportance(e) {
    const { interestId, importance } = e.currentTarget.dataset
    const { selectedInterests } = this.data
    
    const newSelection = selectedInterests.map(interest => 
      interest.id === interestId ? { ...interest, importance: parseInt(importance) } : interest
    )
    
    this.setData({
      selectedInterests: newSelection
    })
    
    // 更新会话数据
    this.updateSessionInterests(newSelection)
  },

  // 更新会话兴趣数据
  async updateSessionInterests(interests) {
    const { sessionId, isUser1 } = this.data
    
    try {
      const updateData = isUser1 ? 
        { user1Interests: interests } : 
        { user2Interests: interests }
      
      await updateSessionInfo(sessionId, updateData)
    } catch (error) {
      console.error('更新兴趣数据失败:', error)
    }
  },

  // 完成选择
  async completeSelection() {
    const { selectedInterests, sessionId, isUser1 } = this.data
    
    if (selectedInterests.length === 0) {
      showError('请至少选择一个兴趣')
      return
    }
    
    if (this.data.isLoading) return
    
    this.setData({
      isLoading: true
    })
    
    try {
      showLoading('正在保存...')
      
      if (isUser1) {
        // 用户1完成，跳转到分享页
        await updateSessionInfo(sessionId, {
          user1Interests: selectedInterests
        })
        
        hideLoading()
        showSuccess('保存成功')
        
        wx.navigateTo({
          url: '/pages/share/share'
        })
      } else {
        // 用户2完成，计算匹配结果
        const result = await calculateMatchResult(sessionId, selectedInterests)
        
        if (result.success) {
          hideLoading()
          
          // 保存匹配结果到全局数据
          app.globalData.matchResult = result.matchResult
          app.globalData.getMatchLevel = result.getMatchLevel
          app.globalData.getCategoryName = result.getCategoryName
          
          wx.navigateTo({
            url: '/pages/results/results'
          })
        } else {
          hideLoading()
          showError('计算匹配失败')
        }
      }
      
    } catch (error) {
      console.error('完成选择失败:', error)
      hideLoading()
      showError('操作失败，请重试')
    } finally {
      this.setData({
        isLoading: false
      })
    }
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

  // 分享功能
  onShareAppMessage() {
    const { userName, otherUserName } = this.data
    return {
      title: `${userName}邀请你进行七夕匹配`,
      path: `/pages/user-select/user-select?sessionId=${this.data.sessionId}`,
      imageUrl: '/images/share.png'
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
    wx.stopPullDownRefresh()
  },

  // 获取当前分类的兴趣
  getCurrentCategoryInterests() {
    const { activeCategory } = this.data
    const app = getApp()
    
    const category = app.globalData.interestCategories.find(cat => cat.id === activeCategory)
    return category ? category.interests : []
  },

  // 检查兴趣是否被选中
  isSelected(interestId) {
    const { selectedInterests } = this.data
    return selectedInterests.some(item => item.id === interestId)
  },

  // 获取已选中的兴趣
  getSelectedInterest(interestId) {
    const { selectedInterests } = this.data
    return selectedInterests.find(item => item.id === interestId)
  }
})