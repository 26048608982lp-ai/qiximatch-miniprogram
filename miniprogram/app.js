App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }
    
    // 获取用户信息
    this.getUserInfo()
    
    // 检查更新
    this.checkForUpdate()
  },

  getUserInfo() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
  },

  checkForUpdate() {
    if (wx.getUpdateManager) {
      const updateManager = wx.getUpdateManager()
      
      updateManager.onCheckForUpdate((res) => {
        console.log('是否有新版本：', res.hasUpdate)
      })

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败')
      })
    }
  },

  globalData: {
    userInfo: null,
    // 匹配算法中用到的兴趣数据
    interestCategories: [
      {
        id: 'entertainment',
        name: '娱乐',
        interests: [
          { id: 'movies', name: '看电影', category: 'entertainment', icon: '🎬', importance: 0 },
          { id: 'music', name: '听音乐', category: 'entertainment', icon: '🎵', importance: 0 },
          { id: 'games', name: '玩游戏', category: 'entertainment', icon: '🎮', importance: 0 },
          { id: 'concerts', name: '演唱会', category: 'entertainment', icon: '🎤', importance: 0 },
          { id: 'theater', name: '话剧', category: 'entertainment', icon: '🎭', importance: 0 },
          { id: 'art', name: '艺术展', category: 'entertainment', icon: '🎨', importance: 0 },
        ]
      },
      {
        id: 'sports',
        name: '运动',
        interests: [
          { id: 'basketball', name: '篮球', category: 'sports', icon: '🏀', importance: 0 },
          { id: 'football', name: '足球', category: 'sports', icon: '⚽', importance: 0 },
          { id: 'tennis', name: '网球', category: 'sports', icon: '🎾', importance: 0 },
          { id: 'swimming', name: '游泳', category: 'sports', icon: '🏊', importance: 0 },
          { id: 'hiking', name: '徒步', category: 'sports', icon: '🥾', importance: 0 },
          { id: 'yoga', name: '瑜伽', category: 'sports', icon: '🧘', importance: 0 },
        ]
      },
      {
        id: 'food',
        name: '美食',
        interests: [
          { id: 'chinese', name: '中餐', category: 'food', icon: '🥘', importance: 0 },
          { id: 'western', name: '西餐', category: 'food', icon: '🍝', importance: 0 },
          { id: 'japanese', name: '日料', category: 'food', icon: '🍱', importance: 0 },
          { id: 'dessert', name: '甜点', category: 'food', icon: '🍰', importance: 0 },
          { id: 'coffee', name: '咖啡', category: 'food', icon: '☕', importance: 0 },
          { id: 'cooking', name: '烹饪', category: 'food', icon: '👨‍🍳', importance: 0 },
        ]
      },
      {
        id: 'travel',
        name: '旅行',
        interests: [
          { id: 'beach', name: '海滩', category: 'travel', icon: '🏖️', importance: 0 },
          { id: 'mountains', name: '山景', category: 'travel', icon: '🏔️', importance: 0 },
          { id: 'city', name: '城市', category: 'travel', icon: '🏙️', importance: 0 },
          { id: 'countryside', name: '乡村', category: 'travel', icon: '🌾', importance: 0 },
          { id: 'museum', name: '博物馆', category: 'travel', icon: '🏛️', importance: 0 },
          { id: 'shopping', name: '购物', category: 'travel', icon: '🛍️', importance: 0 },
        ]
      }
    ]
  }
})