# 七夕匹配小程序

一个基于微信云开发的七夕情侣匹配测试小程序，帮助情侣发现彼此的兴趣匹配和推荐适合的约会活动。

## 🌟 功能特色

- **星座连接UI**: 创新的星空图界面，用户选择兴趣作为星星，形成独特的星座连线
- **智能匹配算法**: 基于兴趣重叠和重要程度的多维度匹配计算
- **个性化推荐**: 根据匹配结果为情侣推荐最适合的约会活动
- **云端数据存储**: 使用微信云开发存储用户数据，支持跨设备同步
- **便捷分享**: 支持微信好友、朋友圈等多种分享方式

## 🛠️ 技术架构

### 前端技术栈
- **框架**: 微信小程序原生框架
- **语言**: JavaScript (ES6+)
- **样式**: WXSS + 小程序rpx单位
- **组件**: 小程序自定义组件
- **图表**: 小程序Canvas组件

### 后端服务
- **云存储**: 微信云开发数据库
- **云函数**: 数据处理和匹配计算
- **云存储**: 静态资源存储
- **用户管理**: 微信用户授权

## 📱 页面结构

### 1. 首页 (index)
- 欢迎页面
- 用户姓名输入
- 当前会话状态显示

### 2. 兴趣选择页 (user-select)
- 星空图模式选择
- 分类兴趣选择
- 重要程度评分
- 已选择兴趣预览

### 3. 分享页 (share)
- 分享链接生成
- 多种分享方式
- 快速操作入口

### 4. 结果页 (results)
- 匹配度展示
- 分类匹配详情
- 共同兴趣展示
- 独特兴趣分析
- 推荐活动列表

## 🎨 核心组件

### 星空图组件 (constellation)
- Canvas绘制星空效果
- 兴趣点交互
- 动态连线显示
- 悬停效果

### 兴趣选择组件 (interest)
- 分类标签切换
- 兴趣网格选择
- 重要程度评分
- 选中状态管理

## 🗄️ 数据结构

### 会话数据 (sessions)
```javascript
{
  _id: "session_id",
  user1Name: "用户A姓名",
  user2Name: "用户B姓名", 
  user1Interests: [...],
  user2Interests: [...],
  matchResult: {...},
  status: "waiting|completed",
  createdAt: timestamp,
  expireAt: timestamp
}
```

### 匹配结果 (matchResult)
```javascript
{
  overallScore: 85,
  categoryScores: {
    entertainment: 90,
    sports: 70,
    food: 85,
    travel: 80
  },
  commonInterests: [...],
  uniqueInterests: {
    user1: [...],
    user2: [...]
  },
  recommendedActivities: [...]
}
```

## 🌥️ 云函数

### createSession
- 创建新的匹配会话
- 生成唯一会话ID
- 设置过期时间

### getSession
- 获取会话信息
- 验证会话有效性
- 更新分享次数

### updateSession
- 更新会话数据
- 保存用户兴趣
- 更新匹配状态

### calculateMatch
- 计算匹配结果
- 生成活动推荐
- 返回匹配等级

## 🚀 开发指南

### 环境要求
- 微信开发者工具
- Node.js 14+
- 微信小程序AppID

### 安装步骤
1. 克隆项目代码
2. 使用微信开发者工具打开项目
3. 配置云开发环境
4. 安装云函数依赖
5. 本地调试测试

### 云函数部署
```bash
# 部署所有云函数
cd cloudfunctions/createSession && npm install
cd ../updateSession && npm install  
cd ../calculateMatch && npm install
cd ../getSession && npm install
```

### 本地开发
1. 修改 project.config.json 中的 appid
2. 开启云开发本地调试
3. 配置云环境ID

## 📋 注意事项

- 确保微信开发者工具版本为最新稳定版
- 云开发环境需要正确配置权限
- 分享功能需要配置合法域名
- 小程序码功能需要申请权限

## 🔐 隐私政策

- 用户数据仅用于匹配计算
- 会话数据24小时后自动过期
- 不会收集用户个人信息
- 支持用户手动删除数据

## 📝 更新日志

### v1.0.0 (2024-08-28)
- 完成基础功能开发
- 实现云端数据存储
- 支持分享功能
- 优化用户体验

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
