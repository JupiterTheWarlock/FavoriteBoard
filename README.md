# FavoriteBoard

![FavoriteBoard 截图](assets/images/image.png)

> ⚠️ 当前版本仅适配 Microsoft Edge 浏览器，暂不支持 Chrome、Firefox 等其他浏览器。

基于 Manifest V3 的现代化收藏夹管理扩展，采用模块化 Tab 架构，将浏览器收藏夹转换为美观的卡片式管理界面。

## ✨ 功能特性

### 🏗️ 核心架构
- **📋 模块化 Tab 系统**：基于 BaseTab 抽象类的可扩展 Tab 架构
- **🏭 Tab 工厂模式**：统一管理 Tab 创建和生命周期
- **🔄 实时数据同步**：自动检测收藏夹变更并同步更新界面

### 📊 Dashboard 功能
- **统计概览**：收藏夹总数、文件夹数量等核心指标
- **数据可视化**：收藏夹分布和使用情况图表
- **最近活动**：新增收藏和访问记录

### 📁 收藏夹管理
- **层级展示**：完整的文件夹树形结构，支持多级嵌套
- **智能展开**：记住文件夹展开状态，重启后自动恢复
- **卡片式界面**：美观的收藏链接卡片展示
- **实时搜索**：支持标题、URL 多维度快速搜索
- **右键菜单**：完整的收藏夹操作功能

### 🎯 交互体验
- **响应式设计**：适配各种屏幕尺寸，移动端友好
- **现代化 UI**：基于 CSS Grid & Flexbox 的流畅布局
- **动画效果**：平滑的页面切换和状态反馈
- **智能图标**：自动获取网站 favicon，支持多种后备方案

## 🚀 使用方法

1. **安装扩展**：在 Edge 浏览器扩展管理页面加载解压缩扩展（开发者模式）
2. **打开面板**：点击工具栏中的 FavoriteBoard 扩展图标
3. **管理收藏**：在新打开的标签页中高效管理你的收藏夹

### 基本操作
- **查看 Dashboard**：点击侧边栏的 "Dashboard" 查看收藏夹统计
- **浏览文件夹**：点击侧边栏的文件夹切换到对应的收藏夹内容
- **搜索收藏**：在搜索框中输入关键词快速定位收藏
- **管理文件夹**：右键文件夹进行重命名、删除、创建子文件夹等操作
- **管理收藏**：右键收藏链接进行移动、删除等操作

## 📁 项目结构

```
FavoriteBoard/
├── manifest.json               # 扩展配置文件（Manifest V3）
├── background.js              # 后台服务脚本（Service Worker）
├── index.html                 # 主界面页面
├── css/                       # 样式文件
│   ├── reset.css             # CSS 重置样式
│   ├── style.css             # 主要样式文件
│   └── responsive.css        # 响应式样式
├── js/                       # JavaScript 业务逻辑
│   ├── main.js               # 主应用程序（Tab 容器管理器）
│   ├── bookmarks.js          # 收藏夹数据管理器
│   ├── tab-factory.js        # Tab 工厂类
│   ├── utils.js              # 工具函数库
│   ├── config.js             # 配置管理
│   └── tabs/                 # Tab 实现模块
│       ├── base-tab.js       # Tab 基类
│       ├── dashboard-tab.js  # Dashboard Tab 实现
│       └── bookmark-tab.js   # 收藏夹 Tab 实现
├── assets/                   # 资源文件
│   ├── icons/                # 扩展图标
│   │   ├── favicon.png
│   │   ├── favicon.svg
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── images/               # 截图和示意图
│       └── image.png
└── README.md                 # 项目说明文档
```

## 🏗️ 技术架构

### 核心技术栈
- **Manifest V3**：Edge 最新扩展规范
- **Service Worker**：基于事件驱动的后台脚本
- **Edge Bookmarks API**：收藏夹数据获取与管理
- **Vanilla JavaScript**：无依赖纯 JS 实现
- **CSS Grid & Flexbox**：现代响应式布局
- **CSS Variables**：主题化设计支持

### 架构设计模式
- **工厂模式**：Tab 创建和管理
- **观察者模式**：数据变更通知
- **模板方法模式**：Tab 生命周期管理
- **单例模式**：应用状态管理

### 主要组件

#### 1. ToolboxApp（主应用）
- **职责**：Tab 容器管理，应用初始化，数据协调
- **特性**：Tab 生命周期管理，UI 状态同步，事件处理

#### 2. TabFactory（Tab 工厂）
- **职责**：统一创建和管理各种类型的 Tab
- **支持的 Tab 类型**：
  - `dashboard`：数据统计和概览
  - `bookmark`：收藏夹内容管理
  - `settings`：应用设置（待实现）

#### 3. BaseTab（Tab 基类）
- **职责**：定义 Tab 统一接口和公共行为
- **生命周期**：`render()` → `onActivate()` → `onDeactivate()` → `destroy()`
- **可配置选项**：搜索支持、缓存策略、延迟渲染等

#### 4. BookmarkManager（收藏夹管理器）
- **职责**：收藏夹数据获取、缓存、同步
- **特性**：自动缓存、增量更新、事件通知

### 扩展权限说明
- `bookmarks`：读取和管理 Edge 收藏夹
- `favicon`：获取网站图标
- `storage`：本地数据缓存与同步
- `tabs`：标签页管理

## 🔧 开发说明

### 代码规范
- **模块化设计**：功能解耦，职责分离
- **SOLID 原则**：面向对象设计最佳实践
- **DRY 原则**：避免重复代码，提高复用性
- **数据与逻辑分离**：数据定义中使用 Getter 而非方法

### 扩展开发
添加新的 Tab 类型：

1. **创建 Tab 类**：继承 `BaseTab`，实现必要方法
```javascript
class MyTab extends BaseTab {
  constructor() {
    super('my-tab', '我的 Tab', '🔧');
  }
  
  async render(container) {
    // 实现渲染逻辑
  }
  
  getDescription() {
    return '我的 Tab 描述';
  }
}
```

2. **注册 Tab 类型**：在 `TabFactory` 中注册
```javascript
this.registerTabType('my-tab', {
  name: '我的 Tab',
  className: 'MyTab',
  singleton: true
});
```

3. **实现创建方法**：添加对应的创建方法
```javascript
createMyTab() {
  return new MyTab();
}
```

### 项目特色

#### 📱 响应式设计
- **自适应布局**：支持桌面和移动设备
- **流畅动画**：CSS 动画和过渡效果
- **触摸友好**：优化移动端交互体验

#### 🎨 现代化界面
- **卡片式设计**：清晰的信息层级
- **色彩系统**：基于 CSS 变量的主题化设计
- **图标系统**：Emoji 图标 + 自动 Favicon 获取

#### ⚡ 性能优化
- **智能缓存**：减少重复数据请求
- **延迟加载**：按需渲染内容
- **事件防抖**：优化搜索和滚动性能

## 📝 更新日志

### v1.0.0
- ✅ 基于 Manifest V3 的现代化架构
- ✅ 模块化 Tab 系统设计
- ✅ Dashboard 数据统计功能
- ✅ 完整的收藏夹管理界面
- ✅ 响应式设计，支持多设备
- ✅ 实时数据同步
- ✅ 文件夹树形结构展示
- ✅ 智能搜索和筛选
- ✅ 右键菜单操作支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！如有建议或发现问题，欢迎在 GitHub 反馈。

### 贡献指南
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

> 💡 **开发者**：JupiterTheWarlock (JtheWL)  
> 🏷️ **版本**：v1.0.0  
> 📅 **最后更新**：2024年 