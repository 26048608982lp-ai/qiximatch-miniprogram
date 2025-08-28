# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chinese Valentine's Day (七夕) couple matching **WeChat Mini Program**. The app allows users to select interests, calculate compatibility scores, and share results with friends. Built with WeChat Mini Program framework, cloud functions for backend logic, and local storage for session management.

## Development Environment

### Requirements
- WeChat Developer Tools
- Node.js (for cloud functions)
- WeChat Cloud Development account

### Project Structure
```
miniprogram/
├── app.js                 # 小程序入口文件
├── app.json               # 小程序配置文件
├── app.wxss               # 全局样式文件
├── pages/                 # 页面目录
│   ├── index/             # 首页
│   ├── user-select/       # 兴趣选择页
│   ├── results/           # 结果页
│   └── share/             # 分享页
├── utils/                 # 工具函数
│   ├── session.js         # 会话管理
│   ├── cloud.js           # 云开发API
│   ├── validator.js       # 输入验证
│   └── performance.js     # 性能监控
├── components/            # 自定义组件
├── images/                # 图片资源
└── styles/                # 样式文件

cloudfunctions/            # 云函数
├── createSession/         # 创建会话
├── getSession/           # 获取会话
├── updateSession/        # 更新会话
└── calculateMatch/       # 计算匹配结果
```

## Architecture Overview

### Core Components
1. **首页 (index)** - 用户名输入和会话管理
2. **兴趣选择页 (user-select)** - 分类兴趣选择和重要程度评分
3. **结果页 (results)** - 匹配结果展示和活动推荐
4. **分享页 (share)** - 生成分享链接和多种分享方式

### Data Flow
- 用户输入 → 本地验证 → 云函数处理 → 数据库存储
- 会话管理通过 localStorage 和云数据库同步
- 兴趣选择实时保存到云端
- 匹配结果由云函数计算后返回

### Key Architecture Patterns
- **页面路由**: 小程序原生页面跳转机制
- **状态管理**: 每个页面独立管理状态，通过 localStorage 和云数据库同步
- **云函数**: 后端逻辑部署在微信云开发平台
- **数据验证**: 前后端双重验证确保数据安全

### Styling System
- **WXSS**: 小程序原生样式语言，类似 CSS
- **自定义主题**: 使用 CSS 变量定义主题色彩
- **响应式设计**: 针对不同屏幕尺寸的适配
- **动画效果**: CSS 动画和过渡效果

### Matching Algorithm Logic
The `calculateMatch` cloud function implements:
- **分类匹配度计算**: 按娱乐、运动、美食、旅行四个类别分别计算
- **重要程度加权**: 用户设置的 1-5 星重要程度影响匹配分数
- **共同兴趣奖励**: 额外加分机制
- **活动推荐**: 基于匹配结果推荐相关活动

### Technical Considerations
- **小程序生命周期**: 正确处理页面的 onLoad, onShow, onUnload 等生命周期
- **云开发**: 使用微信云开发进行数据存储和云函数调用
- **内存管理**: 避免内存泄漏，正确清理定时器和事件监听
- **输入验证**: 前后端双重验证确保数据安全
- **错误处理**: 完善的错误捕获和用户友好提示

### Security Considerations
- **安全的会话ID**: 使用时间戳+随机数+加密组合生成
- **输入消毒**: 防止XSS攻击和SQL注入
- **数据验证**: 严格的数据格式和范围验证
- **云函数安全**: 云函数端的数据验证和清理

### Session Management
- **会话生成**: 使用安全算法生成唯一会话ID
- **本地存储**: localStorage 存储当前会话信息
- **云端同步**: 云数据库存储完整的会话数据
- **过期机制**: 24小时自动过期清理
- **分享机制**: 通过会话ID实现用户间数据共享

### Performance Optimization
- **定时器管理**: 避免内存泄漏，正确清理定时器
- **数据缓存**: 合理使用本地存储减少网络请求
- **动画优化**: 使用 CSS 动画提升性能
- **资源优化**: 图片压缩和懒加载

### Development Notes
- **代码规范**: 遵循小程序开发规范
- **错误处理**: 完善的错误提示和日志记录
- **测试策略**: 云函数需要独立测试
- **部署流程**: 使用微信开发者工具进行部署

### Cloud Functions
- **createSession**: 创建新会话，包含输入验证和数据消毒
- **getSession**: 获取会话信息
- **updateSession**: 更新会话数据
- **calculateMatch**: 计算匹配结果，包含复杂算法逻辑

### Input Validation
- **用户名验证**: 长度、字符集、特殊字符检查
- **兴趣验证**: 兴趣类别、ID、重要程度验证
- **会话ID验证**: 格式和长度验证
- **数据消毒**: XSS防护和输入清理