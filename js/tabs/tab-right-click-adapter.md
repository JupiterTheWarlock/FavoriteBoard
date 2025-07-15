# Tab右键菜单适配方案

## 问题描述

在重构第三阶段（状态管理重构）后，Tab右键菜单功能失效。经过分析，这是由于Tab右键菜单相关代码在重构过程中被移除或未正确迁移所导致的。

## 第二阶段（事件系统重构）的Tab右键菜单实现

在第二阶段完成时，Tab右键菜单的实现主要包含以下组件：

### 1. HTML结构

```html
<!-- 当前分类信息 -->
<div class="category-info" id="categoryInfo">
    <h2 class="category-title" id="categoryTitle">总览</h2>
    <p class="category-desc" id="categoryDesc">数据统计和网站概览</p>
    <div class="link-count">共 <span id="linkCount">0</span> 个链接</div>
</div>
```

### 2. 事件绑定

在主应用中，通过以下方法为Tab标题区域（`categoryInfo`元素）绑定右键菜单事件：

```javascript
/**
 * 绑定Tab右键菜单事件
 */
bindTabContextMenuEvents() {
  // 获取Tab标题区域
  const categoryInfo = document.getElementById('categoryInfo');
  if (!categoryInfo) return;
  
  // 绑定右键菜单事件
  categoryInfo.addEventListener('contextmenu', (e) => {
    // 获取当前激活的Tab
    const activeTab = this.tabContainer.getActiveTab();
    if (!activeTab) return;
    
    // 发布Tab右键菜单请求事件
    this.eventBus.emit('tab-context-menu-requested', {
      event: e,
      tab: activeTab
    });
  });
  
  console.log('✅ Tab右键菜单事件绑定完成');
}
```

### 3. 样式定义

```css
/* Tab右键菜单特定样式 */
.tab-context-menu {
  position: fixed;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 0.5rem 0;
  min-width: 160px;
  max-width: 250px;
  z-index: 99999;
  opacity: 1;
  visibility: visible;
  transform: scale(1);
  animation: fadeIn 0.2s ease-in-out;
  /* 确保菜单始终可见 */
  pointer-events: auto;
  box-sizing: border-box;
}

.context-menu-item .icon,
.context-menu-icon {
  margin-right: 0.75rem;
  font-size: 1rem;
  width: 16px;
  text-align: center;
}

.context-menu-text {
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 第四阶段（UI管理重构）的适配方案

为了在第四阶段重构中恢复Tab右键菜单功能，需要实施以下适配方案：

### 1. 创建TabContextMenu类

在`js/ui/tab-context-menu.js`中创建专门的Tab右键菜单管理类：

```javascript
/**
 * Tab右键菜单管理器
 * 负责Tab右键菜单的创建、显示和事件处理
 */
class TabContextMenu {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentMenu = null;
    
    // 绑定方法上下文
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    
    // 初始化事件监听
    this.initEventListeners();
    
    console.log('🐱 Tab右键菜单管理器初始化完成');
  }
  
  /**
   * 初始化事件监听
   */
  initEventListeners() {
    // 监听Tab右键菜单请求事件
    this.eventBus.on('tab-context-menu-requested', (data) => {
      this.showContextMenu(data.event, data.tab);
    });
    
    // 监听全局点击事件以隐藏菜单
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('contextmenu', this.handleDocumentClick);
  }
  
  /**
   * 显示Tab右键菜单
   * @param {Event} event - 鼠标事件
   * @param {BaseTab} tab - 当前Tab
   */
  showContextMenu(event, tab) {
    // 阻止默认右键菜单
    event.preventDefault();
    
    // 隐藏之前的菜单
    this.hideContextMenu();
    
    // 创建菜单
    const menu = document.createElement('div');
    menu.className = 'tab-context-menu';
    
    // 根据Tab类型生成不同的菜单项
    let menuItems = '';
    
    if (tab.id === 'dashboard') {
      // Dashboard Tab菜单
      menuItems = `
        <div class="context-menu-item" data-action="refresh">
          <span class="context-menu-icon">🔄</span>
          <span class="context-menu-text">刷新数据</span>
        </div>
      `;
    } else if (tab.id === 'bookmark') {
      // Bookmark Tab菜单
      menuItems = `
        <div class="context-menu-item" data-action="refresh">
          <span class="context-menu-icon">🔄</span>
          <span class="context-menu-text">刷新数据</span>
        </div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" data-action="openAll">
          <span class="context-menu-icon">🔗</span>
          <span class="context-menu-text">打开所有链接</span>
        </div>
        <div class="context-menu-item" data-action="export">
          <span class="context-menu-icon">📤</span>
          <span class="context-menu-text">导出链接</span>
        </div>
      `;
    }
    
    menu.innerHTML = menuItems;
    
    // 计算菜单位置
    const position = this.calculateMenuPosition(event);
    
    // 设置菜单位置
    menu.style.left = `${position.left}px`;
    menu.style.top = `${position.top}px`;
    
    // 添加到文档
    document.body.appendChild(menu);
    this.currentMenu = menu;
    
    // 绑定菜单项点击事件
    this.bindMenuEvents(menu, tab);
  }
  
  /**
   * 隐藏Tab右键菜单
   */
  hideContextMenu() {
    if (this.currentMenu) {
      document.body.removeChild(this.currentMenu);
      this.currentMenu = null;
    }
  }
  
  /**
   * 处理文档点击事件
   * @param {Event} event - 点击事件
   */
  handleDocumentClick(event) {
    // 如果点击的不是菜单内部元素，则隐藏菜单
    if (this.currentMenu && !this.currentMenu.contains(event.target)) {
      this.hideContextMenu();
    }
  }
  
  /**
   * 绑定菜单项点击事件
   * @param {HTMLElement} menu - 菜单元素
   * @param {BaseTab} tab - 当前Tab
   */
  bindMenuEvents(menu, tab) {
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.context-menu-item');
      if (!item) return;
      
      const action = item.dataset.action;
      
      // 发布菜单项点击事件
      this.eventBus.emit('tab-context-menu-action', {
        action,
        tab
      });
      
      // 隐藏菜单
      this.hideContextMenu();
    });
  }
  
  /**
   * 计算菜单位置
   * @param {Event} event - 鼠标事件
   * @returns {Object} 位置对象
   */
  calculateMenuPosition(event) {
    const x = event.clientX;
    const y = event.clientY;
    
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 假设菜单尺寸
    const menuWidth = 200;
    const menuHeight = 200;
    
    // 计算最佳位置
    let left = x;
    let top = y;
    
    // 确保菜单不超出右边界
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - 10;
    }
    
    // 确保菜单不超出下边界
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight - 10;
    }
    
    return { left, top };
  }
  
  /**
   * 清理资源
   */
  destroy() {
    // 移除事件监听
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('contextmenu', this.handleDocumentClick);
    
    // 隐藏菜单
    this.hideContextMenu();
    
    // 移除事件总线监听
    if (this.eventBus) {
      this.eventBus.off('tab-context-menu-requested');
    }
  }
}
```

### 2. 在ToolboxApp中集成Tab右键菜单

在`js/main.js`中添加以下代码：

```javascript
/**
 * 绑定Tab右键菜单事件
 */
bindTabContextMenuEvents() {
  // 获取Tab标题区域
  const categoryInfo = document.getElementById('categoryInfo');
  if (!categoryInfo) return;
  
  // 绑定右键菜单事件
  categoryInfo.addEventListener('contextmenu', (e) => {
    if (!this.currentTab) return;
    
    // 发布Tab右键菜单请求事件
    this.eventBus.emit('tab-context-menu-requested', {
      event: e,
      tab: this.currentTab
    });
  });
  
  console.log('✅ Tab右键菜单事件绑定完成');
}
```

并在`bindEvents()`方法中添加调用：

```javascript
/**
 * 绑定事件处理器
 */
bindEvents() {
  // 文件夹树展开/折叠事件
  this.bindTreeToggleEvents();
  
  // Tab右键菜单事件
  this.bindTabContextMenuEvents();
  
  // 窗口大小变化事件
  this.bindWindowEvents();
  
  console.log('✅ 事件绑定完成');
}
```

### 3. 添加CSS样式

在`css/style.css`中添加以下样式：

```css
/* Tab右键菜单特定样式 */
.tab-context-menu {
  position: fixed;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 0.5rem 0;
  min-width: 160px;
  max-width: 250px;
  z-index: 99999;
  opacity: 1;
  visibility: visible;
  transform: scale(1);
  animation: fadeIn 0.2s ease-in-out;
  /* 确保菜单始终可见 */
  pointer-events: auto;
  box-sizing: border-box;
}

.context-menu-icon {
  margin-right: 0.75rem;
  font-size: 1rem;
  width: 16px;
  text-align: center;
}

.context-menu-text {
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 4. 处理Tab右键菜单动作

在`js/main.js`中添加事件监听器来处理Tab右键菜单动作：

```javascript
// 监听Tab右键菜单动作
this.eventBus.on('tab-context-menu-action', (data) => {
  const { action, tab } = data;
  
  switch (action) {
    case 'refresh':
      this.refreshBookmarkData('manual-refresh');
      break;
    case 'openAll':
      if (tab.id === 'bookmark' && tab.currentLinks) {
        this.openAllLinks(tab.currentLinks);
      }
      break;
    case 'export':
      if (tab.id === 'bookmark' && tab.currentLinks) {
        this.exportLinks(tab.currentLinks);
      }
      break;
  }
});
```

### 5. 创建辅助方法

添加以下辅助方法到`js/main.js`：

```javascript
/**
 * 打开所有链接
 * @param {Array} links - 链接数组
 */
openAllLinks(links) {
  if (!links || links.length === 0) {
    this.showNotification('没有可打开的链接', 'info');
    return;
  }
  
  // 限制同时打开的链接数量
  const maxLinks = 10;
  const linksToOpen = links.slice(0, maxLinks);
  
  linksToOpen.forEach(link => {
    chrome.tabs.create({ url: link.url, active: false });
  });
  
  if (links.length > maxLinks) {
    this.showNotification(`已打开前${maxLinks}个链接（共${links.length}个）`, 'info');
  } else {
    this.showNotification(`已打开全部${links.length}个链接`, 'success');
  }
}

/**
 * 导出链接
 * @param {Array} links - 链接数组
 */
exportLinks(links) {
  if (!links || links.length === 0) {
    this.showNotification('没有可导出的链接', 'info');
    return;
  }
  
  // 创建导出数据
  const exportData = links.map(link => ({
    title: link.title,
    url: link.url,
    dateAdded: link.dateAdded
  }));
  
  // 转换为JSON字符串
  const jsonStr = JSON.stringify(exportData, null, 2);
  
  // 创建Blob对象
  const blob = new Blob([jsonStr], { type: 'application/json' });
  
  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookmarks_export_${new Date().toISOString().slice(0, 10)}.json`;
  
  // 触发下载
  document.body.appendChild(a);
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  this.showNotification(`已导出${links.length}个链接`, 'success');
}
```

## 实施步骤

1. 创建`js/ui/tab-context-menu.js`文件，实现TabContextMenu类
2. 在`index.html`中引入新创建的文件
3. 在`js/main.js`中添加Tab右键菜单相关代码
4. 在`css/style.css`中添加Tab右键菜单样式
5. 测试Tab右键菜单功能

## 预期效果

通过以上适配方案，将恢复Tab右键菜单功能，使用户能够：

1. 在Dashboard Tab上右键刷新数据
2. 在Bookmark Tab上右键刷新数据、打开所有链接或导出链接

这些功能将增强用户体验，提供更多便捷操作选项。 