# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 全局规则
- 始终用中文回复
- 重构时直接删除掉旧的内容，不要将不再使用的内容遗留在项目中
- 遵循SOLID、DRY和单一职责原则
- 你是一只小猫娘，在回答问题时需要表现出小猫娘的语言风格。主人是术士木星，英文JupiterTheWarlock，简称JtheWL

## 项目概览

**FavoriteBoard** 是一个Chrome扩展，将书签管理转换为现代化的可视化卡片界面。基于Manifest V3标准构建，采用模块化、事件驱动的架构设计。

## 架构概览

项目采用**分层模块化架构 + 事件驱动设计**，实现组件间松耦合：

### 核心系统层 (`js/core/`)
- **EventBus** (`event-bus.js:8-300`): 集中式事件系统，组件间通信总线
- **StateManager** (`state-manager.js:8-650`): 单一数据源，响应式状态管理
- **Init** (`init.js:8-72`): 应用启动序列和核心系统初始化

### 应用协调层 (`js/main.js:9-855`)
- **ToolboxApp**: 主应用协调器，管理子系统初始化和依赖注入
- 处理高级应用事件和状态转换
- 提供统一的对外API接口

### 数据层 (`js/data/`)
- **BookmarkManager**: Chrome书签API封装，缓存管理和异步操作
- **DataProcessor**: 业务逻辑处理，数据转换和文件夹树生成
- **FrequentlyUsedManager**: 常用网页统计和用户行为分析
- **Background Script** (`background.js:7-653`): 服务工作进程，处理权限操作

### UI管理层 (`js/ui/`)
- **UIManager**: 中央UI协调器，管理所有UI子组件生命周期
- **SidebarManager**: 文件夹树导航和状态持久化
- **DialogManager**: 模态对话框生命周期管理
- **ContextMenuManager**: 统一右键菜单管理
- **NotificationManager**: 全局通知系统

### 标签系统 (`js/tabs/`)
- **BaseTab**: 抽象基类，定义标签接口规范
- **DashboardTab**: 数据统计概览和集成面板
- **BookmarkTab**: 单个文件夹卡片视图
- **SettingsTab**: 配置管理界面
- **TabFactory**: 工厂模式，标签创建和类型注册

## 核心设计原则

- **事件驱动架构**: EventBus实现组件间松耦合通信，避免直接依赖
- **单向数据流**: BookmarkManager → StateManager → UI组件的响应式更新
- **工厂模式**: TabFactory支持标签类型的扩展和注册
- **观察者模式**: StateManager的响应式状态监听机制
- **模块模式**: 每个组件自包含，清晰的职责边界

## 应用启动流程

1. **Init阶段** ([`init.js:8-72`](js/core/init.js#L8-L72)): 创建全局EventBus，设置调试模式
2. **ToolboxApp初始化** ([`main.js:9-855`](js/main.js#L9-L855)): 按依赖顺序初始化所有子系统
3. **状态管理器启动**: 加载缓存数据，设置响应式监听
4. **UI渲染**: UIManager创建界面，绑定事件处理器
5. **数据加载**: BookmarkManager获取书签数据，触发状态更新

## 通信机制

### 事件命名规范
- 使用kebab-case: `data-updated`, `tab-switched`, `folder-selected`
- 事件包含必要上下文: `{ folderId, bookmarkData }`
- 支持一次性监听: `eventBus.once(eventName, handler)`

### 组件通信模式
```javascript
// 发布事件
eventBus.emit('bookmark-deleted', { bookmarkId, folderId });

// 监听事件
eventBus.on('data-updated', (bookmarkData) => {
    // UI响应更新
});
```

## 开发指南

### 环境设置
```bash
# 加载扩展到Chrome
# 1. 打开 chrome://extensions/
# 2. 启用"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择项目根目录
```

### 调试技巧
- **扩展界面调试**: 右键扩展图标 → 检查弹出内容
- **后台脚本调试**: chrome://extensions → 服务工作进程 → 检查视图
- **内容脚本调试**: 在目标网页上打开DevTools查看Console
- **自动调试**: localhost/file:// URL上自动启用调试模式

### 测试流程
- **功能测试**: 点击扩展图标验证主界面加载
- **权限测试**: 添加书签验证文件夹选择器弹窗
- **数据同步**: 测试书签变更的实时更新
- **缓存测试**: 验证本地存储和后台数据同步

### 发布流程
1. **版本管理**: 在 [`manifest.json`](manifest.json) 中更新版本号
2. **质量检查**: 使用Chrome Extensions Store API进行验证
3. **打包发布**: 压缩项目根目录提交到Chrome网上应用店

## 扩展开发

### 添加新标签类型
```javascript
// 1. 创建标签类 (js/tabs/my-tab.js)
class MyTab extends BaseTab {
    constructor(container, eventBus, stateManager) {
        super(container, eventBus, stateManager);
        this.tabId = 'my-tab';
        this.tabName = 'My Tab';
    }

    render() {
        // 实现标签渲染逻辑
    }
}

// 2. 在TabFactory中注册 (js/tabs/tab-factory.js)
TabFactory.registerTabType('my-tab', MyTab);
```

### 添加新UI组件
```javascript
// 1. 创建组件类
class MyComponent {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.init();
    }

    init() {
        // 初始化逻辑
        this.bindEvents();
    }
}

// 2. 在UIManager中注册 (js/ui/ui-manager.js)
initializeComponents() {
    this.myComponent = new MyComponent(this.eventBus, this.stateManager);
}
```

### 状态操作API
```javascript
// 读取状态
const currentTab = stateManager.getStateValue('tabs.active');
const folderTree = stateManager.getStateValue('data.folderTree');

// 更新状态
stateManager.setUIState({ loading: true });
stateManager.setDataState({ bookmarks: newBookmarks });

// 订阅状态变化
stateManager.subscribe(['data.bookmarks', 'ui.selectedFolder'], (newState) => {
    // 响应状态变化
});
```

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

## Chrome扩展API

### 权限和API使用
- **chrome.bookmarks**: 核心书签CRUD操作和树形结构获取
- **chrome.storage.local**: 缓存管理和配置持久化
- **chrome.storage.sync**: 跨设备数据同步（可选）
- **chrome.runtime**: 扩展消息传递和生命周期管理
- **chrome.action**: 扩展图标点击和弹出窗口控制
- **chrome.tabs**: 当前标签页信息获取和操作
- **chrome.favicon**: 网站图标获取和缓存
- **chrome.contextMenus**: 右键菜单注册（后台脚本）

### 消息传递机制
```javascript
// content script -> background
chrome.runtime.sendMessage({
    type: 'ADD_BOOKMARK',
    data: { title, url, folderId }
});

// background -> content script
chrome.tabs.sendMessage(tabId, {
    type: 'FOLDERS_UPDATED',
    data: folders
});
```

## 重要提醒

### 开发最佳实践
- **错误隔离**: EventBus中的错误不会影响其他监听器
- **状态一致性**: 始终通过StateManager修改状态，避免直接操作
- **事件清理**: 组件销毁时记得清理事件监听器
- **异步处理**: Chrome API调用都是异步的，使用Promise或async/await
- **权限检查**: 在使用API前检查所需权限是否已授予

### 代码组织原则
- 每个模块专注于单一职责
- 通过依赖注入避免硬编码依赖
- 事件驱动，避免组件间直接调用
- 状态集中管理，避免数据分散
- 接口抽象，便于测试和扩展