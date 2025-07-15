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