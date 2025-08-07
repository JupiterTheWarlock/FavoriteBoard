# FavoriteBoard

![FavoriteBoard 截图](assets/images/image.png)

## ✨ 功能特性

### 🏗️ 核心架构
- **📋 模块化分层系统**：采用事件驱动和状态管理的现代化架构
- **🔄 事件总线**：组件间松耦合通信机制
- **📊 状态管理**：集中式状态管理，单向数据流

### 📊 数据面板
- **数据可视化**：直观展示收藏夹使用情况
- **收藏统计**：了解你的收藏习惯
- **活动记录**：查看最近的收藏操作

### 📁 收藏管理
- **层级展示**：完整的树形结构展示
- **智能展开**：记住文件夹展开状态
- **卡片界面**：美观的链接卡片
- **快速搜索**：多维度搜索功能
- **右键菜单**：完整的操作支持
- **常用网页**：智能识别和管理常用网站

### 🎯 用户体验
- **响应式设计**：适配各种屏幕尺寸
- **现代化界面**：流畅动画和交互
- **智能图标**：自动获取网站图标
- **跨浏览器支持**：支持 Chrome 和 Edge 浏览器
- **智能存储兼容**：自动检测浏览器类型，优化存储策略

## 🚀 使用方法

1. **安装扩展**：在 Chrome 或 Edge 浏览器扩展管理页面加载解压缩扩展（开发者模式）
2. **打开面板**：点击工具栏中的扩展图标
3. **开始管理**：在新标签页中管理你的收藏夹

### 🌐 Edge浏览器特别说明

Edge浏览器用户请注意：
- **自动兼容性检测**：扩展会自动检测Edge浏览器并优化存储策略
- **数据迁移功能**：如果检测到同步存储数据，会自动迁移到本地存储
- **存储状态通知**：会显示当前存储状态和兼容性信息
- **测试工具**：可使用 `test-edge-compatibility.html` 测试兼容性

## 📁 项目结构

```
FavoriteBoard/
├── js/
│   ├── main.js               # 应用容器
│   ├── core/                 # 核心系统
│   │   ├── event-bus.js      # 事件总线
│   │   ├── state-manager.js  # 状态管理
│   │   └── init.js           # 初始化脚本
│   ├── data/                 # 数据层
│   │   ├── bookmark-manager.js # 收藏夹数据管理
│   │   ├── data-processor.js # 数据处理
│   │   └── frequently-used-manager.js # 常用网页管理（支持Edge兼容性）
│   ├── ui/                   # UI管理层
│   │   ├── ui-manager.js     # UI总管理器
│   │   ├── sidebar-manager.js # 侧边栏
│   │   ├── dialog-manager.js # 对话框
│   │   ├── context-menu-manager.js # 右键菜单管理器
│   │   ├── card-context-menu.js # 卡片右键菜单
│   │   ├── frequently-used-context-menu.js # 常用网页右键菜单
│   │   ├── frequently-used-panel.js # 常用网页面板
│   │   ├── notification-manager.js # 通知
│   │   ├── tab-container.js  # Tab容器
│   │   ├── tab-context-menu.js # Tab右键菜单
│   │   └── folder-selector.js # 文件夹选择器
│   ├── tabs/                 # Tab实现
│   │   ├── base-tab.js       # Tab基类
│   │   ├── tab-factory.js    # Tab工厂
│   │   ├── dashboard-tab.js  # 仪表板Tab
│   │   ├── bookmark-tab.js   # 收藏夹Tab
│   │   └── settings-tab.js   # 设置Tab
│   ├── utils/                # 工具函数
│   │   ├── dom-utils.js      # DOM操作
│   │   ├── data-utils.js     # 数据处理
│   │   ├── ui-utils.js       # UI工具
│   │   ├── tab-utils.js      # Tab工具
│   │   └── card-interaction-utils.js # 卡片交互工具
│   └── config/               # 配置
│       └── app-config.js     # 应用配置
├── css/                     # 样式文件
│   ├── reset.css            # CSS重置
│   ├── style.css            # 主样式
│   ├── responsive.css       # 响应式样式
│   ├── frequently-used.css  # 常用网页样式
│   └── folder-selector-popup.css # 文件夹选择器样式
├── assets/                  # 资源文件
│   ├── icons/               # 扩展图标
│   └── images/              # 截图和示意图
├── background.js            # 后台服务脚本
├── index.html              # 主界面页面
├── test-edge-compatibility.html # Edge兼容性测试页面
└── manifest.json           # 扩展配置文件
```

## 🏗️ 技术架构

### 核心技术
- **Manifest V3**：最新浏览器扩展标准
- **事件驱动架构**：基于EventBus的组件通信
- **状态管理**：集中式状态管理系统
- **模块化设计**：高内聚低耦合的组件结构

### 设计模式
- **工厂模式**：Tab创建和管理
- **观察者模式**：事件通知系统
- **模板方法模式**：Tab生命周期
- **单例模式**：状态管理和UI管理器

### 主要组件

#### 核心系统
- **EventBus**：事件总线，实现组件间松耦合通信
- **StateManager**：状态管理器，集中管理应用状态
- **ToolboxApp**：应用容器，协调各个子系统

#### 数据层
- **BookmarkManager**：收藏夹数据管理，API交互
- **DataProcessor**：数据处理器，业务逻辑处理
- **FrequentlyUsedManager**：常用网页数据管理

#### UI层
- **UIManager**：UI总管理器，协调各UI组件
- **TabContainer**：Tab容器，管理Tab生命周期
- **SidebarManager**：侧边栏管理器
- **DialogManager**：对话框管理器
- **ContextMenuManager**：右键菜单管理器
- **CardContextMenu**：卡片右键菜单
- **FrequentlyUsedContextMenu**：常用网页右键菜单
- **FrequentlyUsedPanel**：常用网页面板
- **NotificationManager**：通知管理器

#### Tab系统
- **TabFactory**：Tab工厂，创建各种类型的Tab
- **BaseTab**：Tab基类，定义Tab统一接口
- **DashboardTab**：仪表板Tab实现
- **BookmarkTab**：收藏夹Tab实现
- **SettingsTab**：设置Tab实现

## 🔧 开发指南

### 添加新Tab类型

1. **创建Tab类**：继承 `BaseTab`
```javascript
class MyTab extends BaseTab {
  constructor() {
    super('my-tab', '我的Tab', '🔧');
  }
  
  async render(container) {
    // 实现渲染逻辑
  }
}
```

2. **注册到工厂**：在 `TabFactory` 中注册
```javascript
createMyTab() {
  return new MyTab();
}
```

### 使用事件系统

```javascript
// 发送事件
eventBus.emit('bookmark-updated', { folderId: 123 });

// 监听事件
eventBus.on('bookmark-updated', (data) => {
  console.log('收藏夹更新:', data);
});
```

### 状态管理

```javascript
// 更新状态
stateManager.setState({
  currentFolder: newFolder
});

// 获取状态
const currentState = stateManager.getState();
```

## 🤝 贡献

喵～主人如果想要为项目做贡献，可以按照以下步骤进行喵：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码规范
- 遵循 SOLID 原则
- 保持 DRY（Don't Repeat Yourself）
- 单一职责原则（SRP）
- 模块化设计，避免循环依赖

## 📝 更新日志

### v2.1.1
- ✅ 增强Edge浏览器兼容性支持
- ✅ 智能存储策略：自动检测浏览器类型，优先使用本地存储
- ✅ 数据迁移功能：自动从同步存储迁移到本地存储
- ✅ 存储状态通知：显示当前存储状态和兼容性信息
- ✅ 兼容性测试工具：新增 `test-edge-compatibility.html` 测试页面
- ✅ 降级策略：同步存储失败时自动降级到本地存储
- ✅ 双重备份：同时保存到同步和本地存储确保数据安全

### v2.1.0
- ✅ 新增常用网页管理功能
- ✅ 重构右键菜单系统，完全分离UI和工具函数
- ✅ 优化卡片交互体验
- ✅ 增强跨浏览器兼容性（Chrome + Edge）
- ✅ 清理废弃代码，提升代码质量

### v2.0.0
- ✅ 全新的模块化分层架构
- ✅ 事件驱动的组件通信系统
- ✅ 集中式状态管理
- ✅ 完全分离的UI管理层
- ✅ 优化的Tab系统
- ✅ 更好的性能和可维护性

### v1.0.0
- ✅ 基础收藏夹管理功能
- ✅ Tab系统架构
- ✅ 响应式设计

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

> 💡 **开发者**：JupiterTheWarlock (JtheWL)  