# CLAUDE.md

这份文件为Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 全局规则
- 始终用中文回复
- 重构时直接删除掉旧的内容，不要将不再使用的内容遗留在项目中
- 遵循SOLID、DRY和单一职责原则
- 你是一只小猫娘，在回答问题时需要表现出小猫娘的语言风格。主人是术士木星，英文JupiterTheWarlock，简称JtheWL
- 有任何问题随时问我

## 项目概览

**FavoriteBoard** 是一个Chrome扩展，将书签管理转换为现代化的可视化卡片界面。基于Manifest V3标准构建，采用模块化、事件驱动的架构设计。

## 系统架构

项目采用分层模块化架构，职责分离清晰：
### 核心系统层 (`js/core/`)
- **EventBus** (`event-bus.js:8-300`): 组件间通信的集中式事件系统
- **StateManager** (`state-manager.js:8-650`): 响应式状态管理的单一数据源
- **Init** (`init.js:8-72`): 应用启动和核心系统初始化

### 应用层 (`js/main.js:9-855`)
- **ToolboxApp**: 主应用协调器，统筹所有子系统
- 管理初始化顺序和依赖注入
- 处理高级应用事件和状态转换

### 数据层 (`js/data/`)
- **BookmarkManager** (`bookmark-manager.js`): Chrome书签API集成
- **DataProcessor** (`data-processor.js`): 数据转换和业务逻辑处理
- Background script (`background.js:7-653`) 处理服务工作进程操作

### UI层 (`js/ui/`)
- **UIManager** (`ui-manager.js`): 中央UI协调
- **TabContainer** (`tab-container.js`): 标签生命周期管理
- **SidebarManager** (`sidebar-manager.js`): 文件夹树导航
- **DialogManager** (`dialog-manager.js`): 模态对话框
- **ContextMenuManager** (`context-menu-manager.js`): 右键菜单

### 标签系统 (`js/tabs/`)
- **BaseTab** (`base-tab.js`): 抽象标签接口
- **DashboardTab** (`dashboard-tab.js`): 分析和概览
- **BookmarkTab** (`bookmark-tab.js`): 单个文件夹视图
- **TabFactory** (`tab-factory.js`): 标签创建和管理

## 核心设计模式

1. **事件驱动架构**: 通过EventBus实现组件间的发布-订阅通信
2. **状态管理**: 通过StateManager实现单一数据源
3. **工厂模式**: 通过TabFactory创建标签
4. **观察者模式**: 响应式状态更新
5. **模块模式**: 自包含、可复用的组件

## 开发命令

### 开发环境
- **加载扩展**: 在Chrome中从项目根目录加载未打包的扩展
- **调试模式**: 在localhost/file:// URL上自动启用
- **后台日志**: 查看 chrome://extensions → 服务工作进程日志

### 测试
- **手动测试**: 点击扩展图标打开主界面
- **内容脚本测试**: 添加书签触发文件夹选择器弹窗
- **后台测试**: 使用Chrome DevTools → 应用 → 服务工作进程

### 构建与部署
- **无需构建步骤**: 纯JavaScript/CSS扩展，无需打包
- **打包**: 压缩项目根目录用于Chrome网上应用店提交
- **版本更新**: 在 `manifest.json` 中递增版本号

## 常见开发任务

### 添加新标签类型
1. 创建继承 `BaseTab` 的标签类
2. 在 `TabFactory` 中注册
3. 添加标签特定的渲染逻辑

### 添加新事件
1. 定义事件名称常量
2. 通过 `eventBus.emit('事件名', 数据)` 触发
3. 通过 `eventBus.on('事件名', 处理器)` 监听

### 状态管理
- **读取状态**: `stateManager.getStateValue('ui.currentTab')`
- **更新状态**: `stateManager.setUIState({ loading: true })`
- **订阅**: `stateManager.subscribe(['data.folderTree'], 回调)`

## 扩展结构

```
FavoriteBoard/
├── js/
│   ├── core/           # 核心系统组件
│   ├── data/           # 数据管理
│   ├── ui/             # UI组件
│   ├── tabs/           # 标签实现
│   ├── utils/          # 工具函数
│   ├── config/         # 配置
│   ├── floatWindow/    # 内容脚本组件
│   └── main.js         # 应用入口
├── css/                # 样式表
├── assets/             # 图标和图片
├── background.js       # 服务工作进程
├── manifest.json       # 扩展清单
└── index.html          # 主界面
```

## 关键文件说明

- **manifest.json:2-62**: 扩展配置和权限
- **background.js:7-653**: 后台操作的服务工作进程
- **js/core/init.js:8-72**: 应用初始化序列
- **js/main.js:9-855**: 主应用协调器
- **js/core/event-bus.js:8-300**: 全局事件系统
- **js/core/state-manager.js:8-650**: 集中式状态管理

## 使用的浏览器API

- **chrome.bookmarks**: 书签管理
- **chrome.storage**: 本地存储缓存
- **chrome.runtime**: 扩展生命周期和消息传递
- **chrome.action**: 扩展图标交互
- **chrome.tabs**: 标签管理
- **chrome.favicon**: 网站图标

## 开发环境

- **浏览器**: 启用开发者模式的Chrome/Edge
- **调试模式**: 自动为localhost/file:// URL启用
- **热重载**: 文件更改后手动刷新
- **测试**: 通过chrome://extensions进行扩展测试