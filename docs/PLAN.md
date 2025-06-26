# FavoriteBoardPlugin 项目重构规划

[![Edge Extension](https://img.shields.io/badge/Edge-Extension-blue.svg)](https://microsoftedge.microsoft.com/addons)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 项目概述

FavoriteBoardPlugin 是一个基于原有 LinkBoard 静态网页项目重构的 Microsoft Edge 浏览器扩展，旨在将浏览器收藏夹信息可视化为现代化的链接卡片界面。该项目参考了开源项目 TabMark，将收藏夹的文件夹结构映射为侧边栏的树形导航，提供更直观的收藏夹管理体验。

## 🎯 项目目标

### 核心功能目标
- 🔖 **收藏夹集成**: 实时读取并展示浏览器收藏夹内容
- 🌳 **文件夹树结构**: 将收藏夹文件夹层级映射为左侧导航树
- 🎨 **LinkBoard 样式**: 保持原有的现代化链接卡片设计风格
- 🔍 **搜索和筛选**: 提供强大的收藏夹搜索和标签筛选功能
- 📱 **响应式设计**: 适配不同设备和窗口大小

### 技术架构目标
- ⚡ **Manifest V3**: 使用最新的扩展规范
- 🔒 **权限最小化**: 仅申请必要的浏览器权限
- 🎛️ **实时同步**: 收藏夹变更实时反映到界面
- 💾 **离线缓存**: 优化图标和数据缓存策略

## 🏗️ 技术架构设计

### 扩展架构
```
FavoriteBoardPlugin/
├── manifest.json           # 扩展清单 (Manifest V3)
├── background.js           # 后台服务脚本
├── popup/                  # 扩展弹窗 (可选)
│   ├── popup.html
│   └── popup.js
├── newtab/                 # 新标签页替换
│   ├── newtab.html         # 基于原 index.html 改造
│   ├── newtab.js           # 基于原 main.js 改造
│   └── newtab.css          # 基于原样式文件改造
├── content/                # 内容脚本 (如需要)
│   └── content.js
├── assets/                 # 静态资源
│   ├── icons/             # 扩展图标
│   └── images/            # 界面图片
├── css/                    # 样式文件
│   ├── reset.css          # 保持原有
│   ├── style.css          # 保持原有并扩展
│   └── responsive.css     # 保持原有
└── js/                     # JavaScript 模块
    ├── bookmarks.js       # 收藏夹数据处理
    ├── ui-manager.js      # 界面管理器
    ├── search-manager.js  # 搜索管理器
    └── utils.js           # 工具函数
```

### 核心组件

#### 1. 收藏夹数据管理器 (BookmarkManager)
```javascript
class BookmarkManager {
  // 获取收藏夹树结构
  async getBookmarkTree()
  
  // 监听收藏夹变更
  watchBookmarkChanges()
  
  // 格式化收藏夹数据为 LinkBoard 格式
  formatBookmarksForDisplay()
  
  // 获取收藏夹图标
  async getBookmarkFavicon(url)
}
```

#### 2. 界面管理器 (UIManager)
```javascript
class UIManager {
  // 渲染收藏夹文件夹树
  renderBookmarkFolders()
  
  // 渲染链接卡片
  renderBookmarkCards()
  
  // 更新文件夹统计信息
  updateFolderStats()
  
  // 处理文件夹展开/折叠
  handleFolderToggle()
}
```

#### 3. 搜索管理器 (SearchManager)
```javascript
class SearchManager {
  // 搜索收藏夹
  searchBookmarks(query)
  
  // 标签筛选
  filterByTags(tags)
  
  // 自动标签生成 (基于网站域名/分类)
  generateAutoTags()
}
```

## 🔧 技术实现方案

### 1. Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "FavoriteBoard Plugin",
  "version": "1.0.0",
  "description": "将收藏夹可视化为现代化链接卡片界面",
  
  "permissions": [
    "bookmarks",      // 访问收藏夹
    "favicon",        // 获取网站图标
    "storage",        // 本地存储
    "tabs"           // 标签管理 (可选)
  ],
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "chrome_url_overrides": {
    "newtab": "newtab/newtab.html"  // 替换新标签页
  },
  
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    }
  },
  
  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  }
}
```

### 2. 收藏夹 API 集成

参考 TabMark 项目的实现方式，使用 Chrome Bookmarks API：

```javascript
// 获取收藏夹树结构
const bookmarkTree = await chrome.bookmarks.getTree();

// 监听收藏夹变化
chrome.bookmarks.onCreated.addListener(handleBookmarkCreated);
chrome.bookmarks.onRemoved.addListener(handleBookmarkRemoved);
chrome.bookmarks.onChanged.addListener(handleBookmarkChanged);
chrome.bookmarks.onMoved.addListener(handleBookmarkMoved);

// 数据格式转换示例
function convertBookmarkToLinkCard(bookmark) {
  return {
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    icon: `chrome://favicon/${bookmark.url}`,
    description: generateDescription(bookmark.url),
    tags: generateTags(bookmark.url),
    dateAdded: new Date(bookmark.dateAdded),
    parentId: bookmark.parentId
  };
}
```

### 3. 界面适配方案

#### 左侧导航栏改造
- 将原有的静态分类改为动态收藏夹文件夹树
- 支持文件夹的展开/折叠
- 显示每个文件夹内的收藏夹数量
- 支持多级嵌套文件夹

#### 主内容区保持原有设计
- 保持 LinkBoard 的卡片式设计风格
- 保持现有的搜索功能
- 扩展标签筛选功能 (自动从URL生成标签)
- 保持响应式设计

### 4. 数据缓存策略

```javascript
class CacheManager {
  // 缓存收藏夹数据
  async cacheBookmarks(bookmarks) {
    await chrome.storage.local.set({
      bookmarksCache: bookmarks,
      lastUpdate: Date.now()
    });
  }
  
  // 缓存网站图标
  async cacheFavicon(url, iconData) {
    const domain = new URL(url).hostname;
    await chrome.storage.local.set({
      [`favicon_${domain}`]: iconData
    });
  }
  
  // 检查缓存有效性
  async isCacheValid() {
    const { lastUpdate } = await chrome.storage.local.get('lastUpdate');
    return Date.now() - lastUpdate < 5 * 60 * 1000; // 5分钟缓存
  }
}
```

## 📊 功能特性规划

### 核心功能
- ✅ **收藏夹同步**: 实时同步浏览器收藏夹变更
- ✅ **文件夹导航**: 树形文件夹结构导航
- ✅ **链接卡片**: 现代化的收藏夹卡片展示
- ✅ **搜索功能**: 支持标题、URL、描述搜索
- ✅ **标签筛选**: 基于自动生成或自定义标签筛选

### 增强功能
- 🔄 **自动标签**: 基于网站域名自动生成标签
- 📈 **访问统计**: 显示收藏夹使用频率
- 🎨 **主题定制**: 支持多种主题配色
- 📱 **移动适配**: 完美支持移动端访问
- 🔍 **智能搜索**: 支持模糊搜索和历史记录

### 高级功能 (后期扩展)
- 🌐 **多设备同步**: 跨设备收藏夹同步
- 🏷️ **自定义标签**: 支持为收藏夹添加自定义标签
- 📊 **数据分析**: 收藏夹使用情况分析
- 🔖 **快速收藏**: 快速添加当前页面到收藏夹
- 🎯 **智能推荐**: 基于浏览习惯推荐相关收藏夹

## 🛠️ 开发阶段规划

### 阶段 1: 基础架构搭建 (预计 3-5 天)
- [x] 创建 Manifest V3 配置文件
- [ ] 搭建基础的扩展目录结构
- [ ] 实现基础的收藏夹数据读取
- [ ] 创建基础的新标签页界面

### 阶段 2: 核心功能开发 (预计 7-10 天)
- [ ] 实现收藏夹树形导航
- [ ] 适配原有的链接卡片样式
- [ ] 实现收藏夹数据格式转换
- [ ] 实现基础的搜索功能

### 阶段 3: 增强功能开发 (预计 5-7 天)
- [ ] 实现标签系统和筛选
- [ ] 添加收藏夹实时同步
- [ ] 优化图标缓存策略
- [ ] 完善响应式设计

### 阶段 4: 优化和测试 (预计 3-5 天)
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 兼容性测试
- [ ] 准备发布到 Edge 扩展商店

## 🎨 设计规范

### 界面设计原则
- **保持一致性**: 与原 LinkBoard 设计风格保持一致
- **用户友好**: 直观的文件夹导航和链接展示
- **性能优先**: 快速响应的用户交互
- **可访问性**: 支持键盘导航和屏幕阅读器

### 色彩规范
- 保持原有的配色方案
- 为收藏夹文件夹添加可区分的颜色标识
- 支持暗色主题切换

### 交互规范
- 文件夹点击展开/折叠
- 链接卡片悬停效果
- 平滑的动画过渡效果

## 🔒 权限和安全

### 权限申请
- `bookmarks`: 访问收藏夹数据 (核心功能)
- `favicon`: 获取网站图标 (界面美化)
- `storage`: 缓存数据 (性能优化)
- `tabs`: 标签管理 (可选功能)

### 隐私保护
- 所有收藏夹数据仅在本地处理
- 不向任何第三方服务器发送用户数据
- 图标缓存仅存储在本地
- 遵循最小权限原则

## 🚀 部署和发布

### 开发环境配置
```bash
# 克隆项目
git clone [项目地址]
cd FavoriteBoardPlugin

# 在 Edge 中加载未打包的扩展
# 1. 打开 edge://extensions/
# 2. 开启开发者模式
# 3. 点击"加载已解压的扩展"
# 4. 选择项目根目录
```

### 打包发布
- 压缩项目文件为 .zip 格式
- 提交到 Microsoft Edge 开发者中心
- 通过 Edge 扩展商店审核流程

## 📚 参考资料

### 技术文档
- [Microsoft Edge Extensions 开发文档](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/)
- [Chrome Bookmarks API 文档](https://developer.chrome.com/docs/extensions/reference/bookmarks/)
- [Manifest V3 指南](https://developer.chrome.com/docs/extensions/mv3/)

### 参考项目
- **TabMark**: 收藏夹新标签页扩展，提供了完整的收藏夹管理功能实现
- **LinkBoard**: 原有的静态链接管理面板，提供了优秀的界面设计参考

## 📝 开发注意事项

### 从 TabMark 学习的关键点
1. **收藏夹数据处理**: 如何正确读取和格式化收藏夹树结构
2. **实时监听机制**: 如何监听收藏夹变更并实时更新界面
3. **图标缓存策略**: 如何高效地缓存和使用网站图标
4. **性能优化**: 大量收藏夹数据的虚拟滚动和分页加载

### 保持 LinkBoard 特色
1. **卡片式设计**: 保持现有的链接卡片美观设计
2. **搜索体验**: 保持强大的搜索和筛选功能
3. **响应式布局**: 保持对移动设备的良好支持
4. **用户体验**: 保持简洁直观的用户界面

### 技术挑战和解决方案
1. **数据格式转换**: 将收藏夹数据映射为 LinkBoard 的数据结构
2. **权限管理**: 在最小权限原则下实现所有功能
3. **性能优化**: 处理大量收藏夹数据时的性能问题
4. **兼容性**: 确保在不同版本的 Edge 浏览器中正常工作

---

*本文档将根据开发进度持续更新，确保项目按计划顺利推进～ 🐱*