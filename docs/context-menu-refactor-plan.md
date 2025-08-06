# 右键菜单重构规划

## 🎯 问题分析

### 当前架构问题
1. **职责混乱**：`card-interaction-utils.js` 中包含了UI逻辑，违反了工具函数的原则
2. **实现不统一**：卡片右键菜单在utils中实现，常用网页右键菜单在context-menu-manager中实现
3. **维护困难**：右键菜单逻辑分散在多个文件中，难以统一维护

### 重构目标
- 将所有右键菜单UI逻辑统一到 `context-menu-manager.js`
- utils文件夹只保留纯功能函数
- 实现统一的右键菜单管理架构

## 🏗️ 重构方案

### 1. 文件结构调整

**当前结构：**
```
js/
├── utils/
│   └── card-interaction-utils.js  # 包含UI逻辑 ❌
└── ui/
    └── context-menu-manager.js     # 部分右键菜单逻辑
```

**重构后结构：**
```
js/
├── utils/
│   └── card-interaction-utils.js  # 只保留纯功能函数 ✅
└── ui/
    ├── context-menu-manager.js     # 统一管理所有右键菜单 ✅
    └── card-context-menu.js        # 卡片右键菜单UI逻辑 ✅
```

### 2. 职责分离

#### utils/card-interaction-utils.js (纯功能)
```javascript
// 只保留纯功能函数
class CardInteractionUtils {
  // 计算菜单位置
  static calculateMenuPosition(event, menu) {}
  
  // 复制链接到剪贴板
  static async copyLinkToClipboard(url) {}
  
  // 验证链接有效性
  static isValidUrl(url) {}
  
  // 获取安全的图标URL
  static getSafeIconUrl(url, fallbackUrl) {}
}
```

#### ui/card-context-menu.js (UI逻辑)
```javascript
// 卡片右键菜单UI逻辑
class CardContextMenu {
  constructor(contextMenuManager) {
    this.contextMenuManager = contextMenuManager;
  }
  
  // 显示卡片右键菜单
  showCardContextMenu(event, link, card, config = {}) {}
  
  // 创建移动对话框
  createMoveDialog(link, card) {}
  
  // 处理菜单动作
  handleMenuAction(action, link, card) {}
}
```

#### ui/context-menu-manager.js (统一管理)
```javascript
// 统一管理所有右键菜单
class ContextMenuManager {
  constructor() {
    this.cardContextMenu = new CardContextMenu(this);
    this.frequentlyUsedContextMenu = new FrequentlyUsedContextMenu(this);
  }
  
  // 显示卡片右键菜单
  showCardMenu(event, link, card, config) {
    return this.cardContextMenu.showCardContextMenu(event, link, card, config);
  }
  
  // 显示常用网页右键菜单
  showFrequentlyUsedMenu(event, url, title) {
    return this.frequentlyUsedContextMenu.showMenu(event, url, title);
  }
}
```

## 🔄 重构步骤

### 阶段1：创建新的UI组件

1. **创建 `js/ui/card-context-menu.js`**
   - 迁移卡片右键菜单的UI逻辑
   - 实现菜单渲染和事件处理
   - 集成到context-menu-manager

2. **创建 `js/ui/frequently-used-context-menu.js`**
   - 迁移常用网页右键菜单的UI逻辑
   - 实现菜单渲染和事件处理
   - 集成到context-menu-manager

### 阶段2：重构context-menu-manager

3. **修改 `js/ui/context-menu-manager.js`**
   - 统一管理所有右键菜单类型
   - 提供统一的菜单显示接口
   - 实现菜单类型路由

### 阶段3：清理utils

4. **重构 `js/utils/card-interaction-utils.js`**
   - 移除所有UI相关代码
   - 只保留纯功能函数
   - 更新API接口

### 阶段4：更新调用方

5. **更新所有调用方**
   - 更新bookmark-tab.js中的调用
   - 更新dashboard-tab.js中的调用
   - 确保向后兼容

## 📋 具体实现

### 1. 新的CardContextMenu类

```javascript
// js/ui/card-context-menu.js
class CardContextMenu {
  constructor(contextMenuManager) {
    this.contextMenuManager = contextMenuManager;
    this.currentMenu = null;
  }
  
  showCardContextMenu(event, link, card, config = {}) {
    const {
      enableMove = true,
      enableDelete = true,
      enableCopy = true,
      enableNewWindow = true,
      enableFrequentlyUsed = true,
      customMenuItems = []
    } = config;
    
    // 构建菜单项
    const menuItems = this.buildMenuItems(config);
    
    // 通过context-menu-manager显示菜单
    return this.contextMenuManager.showMenu(event, menuItems, 'card', {
      link,
      card,
      config
    });
  }
  
  buildMenuItems(config) {
    const items = [];
    
    // 标准菜单项
    if (config.enableNewWindow) {
      items.push({
        icon: '📄',
        text: '在新窗口打开',
        action: 'openNewWindow'
      });
    }
    
    if (config.enableCopy) {
      items.push({
        icon: '📋',
        text: '复制链接',
        action: 'copy'
      });
    }
    
    // 常用网页菜单项
    if (config.enableFrequentlyUsed) {
      items.push({
        icon: '⭐',
        text: '设为常用网页',
        action: 'setFrequentlyUsed'
      });
    }
    
    // 管理菜单项
    if (config.enableMove) {
      items.push({
        icon: '📁',
        text: '移动到文件夹',
        action: 'move'
      });
    }
    
    if (config.enableDelete) {
      items.push({
        icon: '🗑️',
        text: '删除收藏',
        action: 'delete',
        danger: true
      });
    }
    
    return items;
  }
  
  handleMenuAction(action, context) {
    const { link, card, config } = context;
    
    switch (action) {
      case 'openNewWindow':
        chrome.windows.create({ url: link.url });
        break;
        
      case 'copy':
        CardInteractionUtils.copyLinkToClipboard(link.url);
        break;
        
      case 'setFrequentlyUsed':
        this.handleSetFrequentlyUsed(link, card);
        break;
        
      case 'move':
        this.showMoveDialog(link, card);
        break;
        
      case 'delete':
        this.showDeleteConfirmation(link, card);
        break;
    }
  }
}
```

### 2. 重构后的ContextMenuManager

```javascript
// js/ui/context-menu-manager.js
class ContextMenuManager {
  constructor(eventBus, dialogManager) {
    this.eventBus = eventBus;
    this.dialogManager = dialogManager;
    
    // 初始化子菜单管理器
    this.cardContextMenu = new CardContextMenu(this);
    this.frequentlyUsedContextMenu = new FrequentlyUsedContextMenu(this);
    
    // 菜单管理
    this.activeMenus = new Set();
    this.menuCounter = 0;
  }
  
  // 统一的菜单显示接口
  showMenu(event, menuItems, menuType, contextData = null) {
    // 隐藏现有菜单
    this.hideAllMenus();
    
    // 创建菜单
    const menu = this.createMenu(event, menuItems, menuType, contextData);
    
    // 显示菜单
    this.showMenu(menu, event);
    
    return menu;
  }
  
  // 显示卡片右键菜单
  showCardMenu(event, link, card, config = {}) {
    return this.cardContextMenu.showCardContextMenu(event, link, card, config);
  }
  
  // 显示常用网页右键菜单
  showFrequentlyUsedMenu(event, url, title) {
    return this.frequentlyUsedContextMenu.showMenu(event, url, title);
  }
  
  // 处理菜单动作
  handleMenuAction(menuType, action, contextData) {
    switch (menuType) {
      case 'card':
        this.cardContextMenu.handleMenuAction(action, contextData);
        break;
      case 'frequently-used':
        this.frequentlyUsedContextMenu.handleMenuAction(action, contextData);
        break;
      case 'folder':
        this.handleFolderMenuAction(action);
        break;
      case 'tab':
        this.handleTabMenuAction(action);
        break;
    }
  }
}
```

### 3. 重构后的CardInteractionUtils

```javascript
// js/utils/card-interaction-utils.js
class CardInteractionUtils {
  /**
   * 计算菜单位置
   * @param {Event} event - 鼠标事件
   * @param {HTMLElement} menu - 菜单元素
   * @returns {Object} 位置坐标
   */
  static calculateMenuPosition(event, menu) {
    // 实现菜单位置计算逻辑
  }
  
  /**
   * 复制链接到剪贴板
   * @param {string} url - 链接URL
   * @returns {Promise<void>}
   */
  static async copyLinkToClipboard(url) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('复制链接失败:', error);
      return false;
    }
  }
  
  /**
   * 验证URL有效性
   * @param {string} url - URL字符串
   * @returns {boolean}
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 获取安全的图标URL
   * @param {string} iconUrl - 图标URL
   * @param {string} fallbackUrl - 备用URL
   * @returns {string}
   */
  static getSafeIconUrl(iconUrl, fallbackUrl) {
    if (iconUrl && CardInteractionUtils.isValidUrl(iconUrl)) {
      return iconUrl;
    }
    return fallbackUrl || 'default-icon.png';
  }
}

// 导出工具函数
window.CardInteractionUtils = CardInteractionUtils;
```

## 🎯 重构优势

### 1. 架构清晰
- **职责分离**：UI逻辑在ui文件夹，功能逻辑在utils文件夹
- **统一管理**：所有右键菜单通过context-menu-manager统一管理
- **易于维护**：相关功能集中在一个文件中

### 2. 代码复用
- **共享组件**：不同菜单类型可以共享相同的UI组件
- **统一接口**：所有菜单都使用相同的显示和处理接口
- **减少重复**：避免在不同文件中重复实现相同的菜单逻辑

### 3. 扩展性好
- **易于添加**：新增菜单类型只需要实现对应的ContextMenu类
- **配置灵活**：通过配置可以灵活控制菜单项的显示
- **事件驱动**：通过事件总线实现松耦合的组件通信

## 🚀 实施计划

### 阶段1：准备工作 (1天)
1. 创建新的UI组件文件
2. 设计统一的菜单接口
3. 制定迁移计划

### 阶段2：核心重构 (2天)
1. 实现CardContextMenu类
2. 重构ContextMenuManager
3. 清理CardInteractionUtils

### 阶段3：集成测试 (1天)
1. 更新所有调用方
2. 测试所有菜单功能
3. 修复发现的问题

### 阶段4：优化完善 (1天)
1. 性能优化
2. 代码审查
3. 文档更新

## 📝 注意事项

### 1. 向后兼容
- 保持现有API接口不变
- 逐步迁移，避免一次性大改动
- 提供迁移指南

### 2. 错误处理
- 完善的错误处理机制
- 优雅降级处理
- 用户友好的错误提示

### 3. 性能考虑
- 避免不必要的DOM操作
- 合理使用事件委托
- 及时清理资源

---

**预计重构时间：** 4-5天  
**影响范围：** 右键菜单相关功能  
**风险等级：** 中等（需要仔细测试）
