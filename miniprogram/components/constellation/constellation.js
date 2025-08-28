// 星空图组件逻辑
Component({
  properties: {
    // 兴趣数据
    interests: {
      type: Array,
      value: []
    },
    // 选中的兴趣
    selectedInterests: {
      type: Array,
      value: []
    },
    // 画布尺寸
    canvasWidth: {
      type: Number,
      value: 600
    },
    canvasHeight: {
      type: Number,
      value: 400
    }
  },

  data: {
    // 画布上下文
    ctx: null,
    // 悬停的兴趣
    hoveredInterest: null,
    // 兴趣位置映射
    interestPositions: {},
    // 画布准备状态
    canvasReady: false,
    // 动画相关
    animationFrame: null,
    // 连线动画进度
    lineAnimationProgress: 0
  },

  lifetimes: {
    attached() {
      console.log('星空图组件 attached')
    },

    ready() {
      console.log('星空图组件 ready')
      this.initCanvas()
    },

    detached() {
      this.cleanup()
    }
  },

  observers: {
    'interests, selectedInterests': function(interests, selectedInterests) {
      if (interests.length > 0) {
        this.calculatePositions()
        this.drawConstellation()
      }
    }
  },

  methods: {
    // 初始化画布
    async initCanvas() {
      try {
        // 获取画布上下文
        const query = wx.createSelectorQuery().in(this)
        query.select('#constellation-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res[0]) {
              const canvas = res[0].node
              const ctx = canvas.getContext('2d')
              
              // 设置画布尺寸
              const dpr = wx.getSystemInfoSync().pixelRatio
              canvas.width = res[0].width * dpr
              canvas.height = res[0].height * dpr
              ctx.scale(dpr, dpr)
              
              this.setData({
                ctx,
                canvasReady: true
              })
              
              // 开始绘制
              this.calculatePositions()
              this.drawConstellation()
            }
          })
      } catch (error) {
        console.error('初始化画布失败:', error)
      }
    },

    // 计算兴趣位置
    calculatePositions() {
      const { interests, canvasWidth, canvasHeight } = this.data
      if (!interests.length) return

      const positions = {}
      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2
      const radius = Math.min(canvasWidth, canvasHeight) * 0.3

      interests.forEach((interest, index) => {
        const angle = (index / interests.length) * 2 * Math.PI - Math.PI / 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        positions[interest.id] = { x, y }
      })

      this.setData({
        interestPositions: positions
      })
    },

    // 绘制星空图
    drawConstellation() {
      const { ctx, canvasReady, selectedInterests, hoveredInterest, interestPositions } = this.data
      
      if (!ctx || !canvasReady) return

      // 清空画布
      ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight)

      // 绘制连线
      this.drawConnections()
      
      // 绘制兴趣点
      this.drawInterestPoints()
    },

    // 绘制连线
    drawConnections() {
      const { ctx, selectedInterests, interestPositions, lineAnimationProgress } = this.data
      
      if (selectedInterests.length < 2) return

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'

      // 绘制选中兴趣之间的连线
      for (let i = 0; i < selectedInterests.length - 1; i++) {
        const currentInterest = selectedInterests[i]
        const nextInterest = selectedInterests[i + 1]
        
        const fromPos = interestPositions[currentInterest.id]
        const toPos = interestPositions[nextInterest.id]
        
        if (fromPos && toPos) {
          this.drawAnimatedLine(ctx, fromPos, toPos, lineAnimationProgress)
        }
      }

      // 绘制悬停兴趣到选中兴趣的连线
      if (hoveredInterest && !selectedInterests.some(item => item.id === hoveredInterest.id)) {
        const hoverPos = interestPositions[hoveredInterest.id]
        
        selectedInterests.forEach(interest => {
          const interestPos = interestPositions[interest.id]
          if (interestPos && hoverPos) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(hoverPos.x, hoverPos.y)
            ctx.lineTo(interestPos.x, interestPos.y)
            ctx.stroke()
            ctx.setLineDash([])
          }
        })
      }
    },

    // 绘制动画连线
    drawAnimatedLine(ctx, from, to, progress) {
      const currentX = from.x + (to.x - from.x) * progress
      const currentY = from.y + (to.y - from.y) * progress
      
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(currentX, currentY)
      ctx.stroke()
    },

    // 绘制兴趣点
    drawInterestPoints() {
      const { ctx, interests, selectedInterests, hoveredInterest, interestPositions } = this.data
      
      interests.forEach(interest => {
        const position = interestPositions[interest.id]
        if (!position) return

        const isSelected = selectedInterests.some(item => item.id === interest.id)
        const isHovered = hoveredInterest && hoveredInterest.id === interest.id
        
        this.drawStar(ctx, position.x, position.y, isSelected, isHovered)
        
        // 绘制文字
        ctx.fillStyle = '#ffffff'
        ctx.font = '24rpx Arial'
        ctx.textAlign = 'center'
        ctx.fillText(interest.name, position.x, position.y + 40)
      })
    },

    // 绘制星星
    drawStar(ctx, x, y, isSelected, isHovered) {
      const size = isSelected ? 25 : 20
      const points = 5
      const outerRadius = size
      const innerRadius = size * 0.5
      
      ctx.beginPath()
      
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const pointX = x + Math.cos(angle) * radius
        const pointY = y + Math.sin(angle) * radius
        
        if (i === 0) {
          ctx.moveTo(pointX, pointY)
        } else {
          ctx.lineTo(pointX, pointY)
        }
      }
      
      ctx.closePath()
      
      // 设置颜色
      if (isSelected) {
        ctx.fillStyle = '#ffe66d'
        ctx.strokeStyle = '#ff6b9d'
        ctx.lineWidth = 3
      } else if (isHovered) {
        ctx.fillStyle = '#4ecdc4'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
      } else {
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#c44569'
        ctx.lineWidth = 2
      }
      
      ctx.fill()
      ctx.stroke()
    },

    // 处理画布点击
    handleCanvasClick(e) {
      const { interests, interestPositions } = this.data
      const touch = e.detail[0]
      
      // 获取画布位置
      const query = wx.createSelectorQuery().in(this)
      query.select('#constellation-canvas')
        .boundingClientRect((rect) => {
          if (rect) {
            const x = touch.x - rect.left
            const y = touch.y - rect.top
            
            // 检查点击了哪个兴趣
            const clickedInterest = this.getInterestAtPosition(x, y)
            
            if (clickedInterest) {
              this.triggerEvent('interestselect', {
                interest: clickedInterest
              })
            }
          }
        })
        .exec()
    },

    // 处理画布触摸移动
    handleCanvasTouchMove(e) {
      const { interests, interestPositions } = this.data
      const touch = e.detail[0]
      
      const query = wx.createSelectorQuery().in(this)
      query.select('#constellation-canvas')
        .boundingClientRect((rect) => {
          if (rect) {
            const x = touch.x - rect.left
            const y = touch.y - rect.top
            
            // 检查悬停的兴趣
            const hoveredInterest = this.getInterestAtPosition(x, y)
            
            if (hoveredInterest !== this.data.hoveredInterest) {
              this.setData({
                hoveredInterest
              })
              this.drawConstellation()
            }
          }
        })
        .exec()
    },

    // 处理触摸结束
    handleCanvasTouchEnd() {
      this.setData({
        hoveredInterest: null
      })
      this.drawConstellation()
    },

    // 获取指定位置的兴趣
    getInterestAtPosition(x, y) {
      const { interests, interestPositions } = this.data
      
      for (const interest of interests) {
        const position = interestPositions[interest.id]
        if (position) {
          const distance = Math.sqrt(
            Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2)
          )
          
          if (distance <= 25) {
            return interest
          }
        }
      }
      
      return null
    },

    // 开始连线动画
    startLineAnimation() {
      if (this.data.animationFrame) {
        cancelAnimationFrame(this.data.animationFrame)
      }
      
      const animate = () => {
        this.setData({
          lineAnimationProgress: Math.min(this.data.lineAnimationProgress + 0.02, 1)
        })
        
        this.drawConstellation()
        
        if (this.data.lineAnimationProgress < 1) {
          this.data.animationFrame = requestAnimationFrame(animate)
        }
      }
      
      this.setData({
        lineAnimationProgress: 0
      })
      
      this.data.animationFrame = requestAnimationFrame(animate)
    },

    // 清理资源
    cleanup() {
      if (this.data.animationFrame) {
        cancelAnimationFrame(this.data.animationFrame)
      }
    }
  }
})