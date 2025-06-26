# FavoriteBoard Plugin

基于 Edge/Chrome 扩展的现代化收藏夹管理面板，将浏览器收藏夹转换为美观的卡片式界面。

## ✨ 功能特性

- 🔗 **智能收藏夹管理**: 自动同步浏览器收藏夹数据
- 📊 **可视化统计**: 收藏夹数量、文件夹、标签等统计信息
- 🏷️ **自动标签生成**: 根据域名和URL自动生成标签
- 🔍 **强大搜索功能**: 支持标题、URL、标签搜索
- 📱 **响应式设计**: 适配各种屏幕尺寸
- 🎨 **现代化界面**: 卡片式设计，美观易用
- ⚡ **实时同步**: 收藏夹变更时自动更新

## 🚀 使用方法

1. **安装扩展**: 加载解压缩扩展到 Edge/Chrome
2. **点击图标**: 点击工具栏中的扩展图标
3. **浏览收藏夹**: 在新打开的标签页中管理收藏夹

## 📁 项目结构

```
FavoriteBoardPlugin/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台服务脚本
├── index.html            # 主界面页面
├── css/                  # 样式文件
│   ├── reset.css
│   ├── style.css
│   └── responsive.css
├── js/                   # JavaScript 文件
│   ├── main.js          # 主应用逻辑
│   ├── bookmarks.js     # 收藏夹管理器
│   ├── utils.js         # 工具函数
│   └── tag-manager.js   # 标签管理器
└── assets/              # 资源文件
    └── icons/           # 图标文件
```

## 🛠️ 技术栈

- **Manifest V3**: 最新的扩展规范
- **Chrome Bookmarks API**: 收藏夹数据获取
- **Vanilla JavaScript**: 无依赖纯 JS 实现
- **CSS Grid & Flexbox**: 现代布局技术
- **SVG Icons**: 矢量图标支持

## 🔧 开发说明

### 权限说明
- `bookmarks`: 读取浏览器收藏夹
- `storage`: 本地数据缓存
- `tabs`: 标签页管理
- `favicon`: 网站图标获取

### 主要组件
- **BookmarkManager**: 收藏夹数据管理
- **ToolboxApp**: 主应用界面逻辑
- **TagManager**: 标签系统管理

## 📝 更新日志

### v1.0.0
- ✅ 点击扩展图标打开收藏夹面板
- ✅ 动态收藏夹文件夹分类
- ✅ 自动标签生成和筛选
- ✅ 实时数据同步
- ✅ 响应式界面设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 许可证

MIT License 