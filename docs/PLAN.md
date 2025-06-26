# LinkBoard 项目规划文档

## 📋 项目概述

### 项目名称
LinkBoard - 链接管理面板

### 项目定位
一个现代化的静态网页框架，用于收集、整理和展示个人或团队的链接资源

### 项目目标
- 📚 静态展示个人收集的各类工具和资源链接
- 🎯 通过左侧TabButton实现分类浏览
- 💡 创建一个美观、简洁的个人导航页面
- 🚀 部署到GitHub Pages供个人使用

## 🎯 核心功能模块

### 1. 分类导航模块 (TabButton System)
**优先级**: 🔴 高
**描述**: 左侧垂直标签页系统，硬编码的分类导航

#### 预设分类建议：
- 🛠️ **开发工具**
  - 在线代码工具
  - API测试工具
  - 代码仓库
  - 技术社区

- 🎨 **设计资源**
  - 在线设计工具
  - 图标库网站
  - 配色工具
  - 字体资源

- 📚 **学习资源**
  - 技术文档
  - 在线教程
  - 技术博客
  - 课程平台

- 🔧 **实用工具**
  - 在线工具
  - 文件处理
  - 格式转换
  - 效率工具

- 📖 **参考资料**
  - 技术手册
  - 常用命令
  - 规范文档
  - 备忘录

- 🌐 **常用网站**
  - 搜索引擎
  - 资讯网站
  - 社交平台
  - 其他收藏

#### 功能特性：
- 点击切换分类显示
- 高亮当前选中分类
- 简单的CSS交互效果
- 响应式布局设计

### 2. 链接展示模块
**优先级**: 🔴 高
**描述**: 主要内容区域，展示当前分类下的硬编码链接

#### 展示样式：
- **卡片布局**: 每个链接以卡片形式展示
- **网格排列**: 响应式网格布局
- **信息展示**:
  - 网站图标/Logo
  - 网站标题
  - 简短描述
  - 直接链接

#### 交互功能：
- 点击直接在新标签页打开
- 悬停效果和动画
- 简洁美观的界面

### 3. 简单搜索功能（可选）
**优先级**: 🟢 低
**描述**: 可选的客户端搜索功能

#### 搜索功能：
- **关键词搜索**: 搜索标题和描述
- **即时过滤**: 输入时实时过滤显示
- **简单高亮**: 搜索结果高亮

#### 搜索界面：
- 顶部简单搜索框
- 清空搜索按钮

### 4. 静态数据结构
**优先级**: 🔴 高
**描述**: 硬编码在HTML/JS中的链接数据

#### 数据结构设计：
```javascript
const categories = [
  {
    id: "dev-tools",
    name: "开发工具", 
    icon: "🛠️",
    links: [
      {
        title: "GitHub",
        url: "https://github.com",
        description: "代码托管平台",
        icon: "https://github.com/favicon.ico"
      },
      {
        title: "VS Code Web",
        url: "https://vscode.dev",
        description: "在线代码编辑器",
        icon: "https://vscode.dev/favicon.ico"
      }
    ]
  },
  {
    id: "design-resources",
    name: "设计资源",
    icon: "🎨", 
    links: [
      {
        title: "Figma",
        url: "https://figma.com",
        description: "在线设计工具",
        icon: "https://figma.com/favicon.ico"
      }
    ]
  }
]
```

#### 数据维护：
- **手动编辑**: 直接修改代码中的数据
- **版本控制**: 通过Git管理链接变更
- **简单结构**: 易于维护和扩展

## 🏗️ 技术架构

### 前端技术选型

#### 方案一：原生 HTML/CSS/JavaScript（推荐）
**优点**: 
- 轻量级，加载快速
- 无框架依赖，简单直接
- GitHub Pages 直接部署
- 易于维护和修改

**技术栈**:
- HTML5 (页面结构)
- CSS3 (样式和动画)
- Vanilla JavaScript (交互逻辑)
- CSS Grid/Flexbox (响应式布局)

#### 方案二：简化版 Vue.js（可选）
**适用场景**: 如果链接数量很多，需要更好的组织代码
**技术栈**:
- Vue 3 CDN 版本
- 单页面应用
- 无构建工具

### 数据存储方案

#### 硬编码存储（推荐）
- 数据直接写在 JavaScript 文件中
- 通过 Git 版本控制管理
- 简单直接，无额外依赖

#### 静态 JSON 文件（备选）
- 数据存储在单独的 JSON 文件中
- 便于数据的查看和编辑
- 支持异步加载

### 部署方案
- **GitHub Pages**: 免费静态网站托管（推荐）
- **Netlify**: 可选的替代方案

## 📅 开发计划

### 阶段一：基础页面搭建 (1-2天)
- [x] 项目初始化和文档规划
- [ ] 创建基础HTML结构
- [ ] 设计CSS样式框架
- [ ] 准备硬编码数据结构

**交付物**:
- 基础HTML页面
- CSS样式框架
- 静态数据结构

### 阶段二：核心功能实现 (2-3天)
- [ ] 左侧分类导航
- [ ] 右侧链接卡片展示
- [ ] 分类切换交互
- [ ] 响应式布局

**交付物**:
- 完整的分类导航
- 链接展示功能
- 基础交互效果

### 阶段三：样式优化 (1-2天)
- [ ] 美化界面设计
- [ ] 添加悬停动画
- [ ] 优化移动端适配
- [ ] 完善视觉效果

**交付物**:
- 精美的用户界面
- 流畅的交互动画
- 完美的移动端体验

### 阶段四：内容填充与部署 (1天)
- [ ] 添加实际链接数据
- [ ] 测试所有链接可用性
- [ ] GitHub Pages 部署配置
- [ ] 域名配置（可选）

**交付物**:
- 完整的链接数据
- 可访问的在线网站
- 部署文档

## 🎨 UI/UX 设计规划

### 设计风格
- **现代简约**: 清爽的界面设计
- **卡片化**: 信息组织清晰
- **响应式**: 适配各种设备
- **可访问性**: 符合无障碍设计

### 色彩方案
#### 主色调
- 主色: `#2563eb` (蓝色)
- 辅色: `#10b981` (绿色)
- 警告色: `#f59e0b` (橙色)
- 错误色: `#ef4444` (红色)

#### 中性色
- 深色文字: `#1f2937`
- 浅色文字: `#6b7280`
- 边框色: `#e5e7eb`
- 背景色: `#f9fafb`

### 字体系统
- 主字体: `"Inter", "PingFang SC", "Helvetica Neue", sans-serif`
- 代码字体: `"JetBrains Mono", "Consolas", monospace`

### 间距系统
- 基础单位: 4px
- 小间距: 8px
- 中间距: 16px
- 大间距: 24px
- 特大间距: 32px

## 🔧 技术实现细节

### 组件设计

#### TabButton 组件
```vue
<template>
  <div class="tab-sidebar">
    <div 
      v-for="category in categories"
      :key="category.id"
      :class="['tab-button', { active: activeCategory === category.id }]"
      @click="selectCategory(category.id)"
    >
      <span class="tab-icon">{{ category.icon }}</span>
      <span class="tab-name">{{ category.name }}</span>
    </div>
  </div>
</template>
```

#### LinkCard 组件
```vue
<template>
  <div class="link-card" @click="openLink">
    <div class="card-header">
      <img :src="link.icon" :alt="link.title" class="site-icon">
      <h3 class="site-title">{{ link.title }}</h3>
    </div>
    <p class="site-description">{{ link.description }}</p>
    <div class="card-footer">
      <div class="tags">
        <span v-for="tag in link.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <div class="actions">
        <button @click.stop="editLink">编辑</button>
        <button @click.stop="deleteLink">删除</button>
      </div>
    </div>
  </div>
</template>
```

### 数据管理策略

#### LocalStorage 管理类
```javascript
class LinkDataManager {
  constructor() {
    this.STORAGE_KEY = 'jthelwl-toolbox-data';
    this.data = this.loadData();
  }

  loadData() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : this.getDefaultData();
  }

  saveData() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
  }

  addLink(categoryId, link) {
    const category = this.data.categories.find(c => c.id === categoryId);
    if (category) {
      link.id = this.generateId();
      link.addTime = new Date().toISOString();
      category.links.push(link);
      this.saveData();
    }
  }

  // ... 其他方法
}
```

## 📊 性能优化策略

### 加载优化
- **懒加载**: 图片懒加载
- **代码分割**: 按需加载组件
- **资源压缩**: 图片和代码压缩
- **CDN加速**: 静态资源CDN

### 运行时优化
- **虚拟滚动**: 大量数据时使用虚拟滚动
- **防抖节流**: 搜索输入防抖
- **缓存策略**: 合理使用缓存
- **内存管理**: 避免内存泄漏

## 🔒 安全考虑

### 数据安全
- 输入验证和过滤
- XSS攻击防护
- 数据备份机制

### 隐私保护
- 本地数据存储
- 无第三方数据收集
- 用户数据加密（可选）

## 🚀 未来扩展计划

### 功能扩展
- **多语言支持**: 国际化i18n
- **插件系统**: 支持自定义插件
- **数据同步**: 云端数据同步
- **团队协作**: 支持多人使用
- **API接口**: 提供REST API

### 技术升级
- **PWA支持**: 渐进式Web应用
- **离线功能**: 离线可用
- **桌面应用**: Electron桌面版
- **移动应用**: 原生移动应用

## 📝 开发规范

### 代码规范
- **命名规范**: 使用语义化命名
- **注释规范**: 关键逻辑必须注释
- **格式规范**: 使用Prettier格式化
- **提交规范**: 使用Conventional Commits

### 文件组织
```
src/
├── components/          # 公共组件
├── views/              # 页面组件
├── utils/              # 工具函数
├── stores/             # 状态管理
├── styles/             # 样式文件
├── assets/             # 静态资源
└── types/              # 类型定义
```

### Git工作流
- **主分支**: main (生产环境)
- **开发分支**: develop (开发环境)
- **功能分支**: feature/* (功能开发)
- **修复分支**: hotfix/* (紧急修复)