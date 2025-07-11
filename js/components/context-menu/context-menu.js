/**
 * FavoriteBoard - 右键菜单组件
 * 负责：右键菜单的显示、隐藏、交互处理
 * 
 * @author JupiterTheWarlock
 * @description 可复用的右键菜单组件，支持动态菜单项、智能定位、键盘操作 🐱
 */

/**
 * 右键菜单组件 - 通用的右键菜单实现
 * 负责菜单的创建、显示、隐藏和交互处理
 */
class ContextMenuComponent {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.uiManager = null;
    this.appConfig = null;
    
    // 菜单状态
    this.state = {
      isVisible: false,
      currentMenu: null,
      menuData: null,
      position: { x: 0, y: 0 }
    };
    
    // DOM元素
    this.elements = {
      menu: null,
      overlay: null
    };
    
    // 配置选项
    this.config = {
      position: 'smart', // 'smart', 'fixed', 'follow'
      hideOnScroll: true,
      hideOnResize: true,
      animation: true,
      animationDuration: 200,
      marginFromEdge: 10,
      preferRight: true,
      preferBottom: true,
      zIndex: 10000,
      className: 'context-menu',
      overlayClassName: 'context-menu-overlay',
      itemClassName: 'context-menu-item',
      separatorClassName: 'context-menu-separator'
    };
    
    // 事件监听器
    this.eventListeners = [];
    
    // 键盘导航
    this.keyboardNavigation = {
      enabled: true,
      selectedIndex: -1,
      focusableItems: []
    };
    
    console.log('📝 右键菜单组件初始化 🐱');
  }
  
  /**
   * 初始化组件
   */
  async init() {
    try {
      console.log('🚀 右键菜单组件开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.uiManager = this.container.get('uiManager');
      this.appConfig = this.container.get('appConfig');
      
      // 应用配置
      this._applyConfig();
      
      // 绑定全局事件
      this._bindGlobalEvents();
      
      console.log('✅ 右键菜单组件初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ 右键菜单组件初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 应用配置
   * @private
   */
  _applyConfig() {
    if (this.appConfig?.contextMenu) {
      Object.assign(this.config, this.appConfig.contextMenu);
    }
  }
  
  /**
   * 绑定全局事件
   * @private
   */
  _bindGlobalEvents() {
    // 点击空白处隐藏菜单
    this._addEventListener(document, 'click', (e) => {
      if (!e.target.closest(`.${this.config.className}`)) {
        this.hide();
      }
    });
    
    // ESC键隐藏菜单
    this._addEventListener(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      } else if (this.state.isVisible && this.keyboardNavigation.enabled) {
        this._handleKeyboardNavigation(e);
      }
    });
    
    // 窗口大小变化时隐藏菜单
    if (this.config.hideOnResize) {
      this._addEventListener(window, 'resize', () => {
        this.hide();
      });
    }
    
    // 滚动时隐藏菜单
    if (this.config.hideOnScroll) {
      this._addEventListener(window, 'scroll', () => {
        this.hide();
      }, { passive: true });
    }
  }
  
  /**
   * 显示菜单
   * @param {Event} event - 触发事件
   * @param {Array} menuItems - 菜单项数组
   * @param {Object} options - 显示选项
   */
  show(event, menuItems, options = {}) {
    try {
      // 隐藏当前菜单
      this.hide();
      
      // 验证参数
      if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
        console.warn('⚠️ 菜单项为空，无法显示菜单 🐱');
        return;
      }
      
      console.log('📝 显示右键菜单 🐱', { itemCount: menuItems.length });
      
      // 保存菜单数据
      this.state.menuData = {
        event,
        items: menuItems,
        options
      };
      
      // 创建菜单元素
      this._createMenuElement(menuItems, options);
      
      // 计算位置
      const position = this._calculatePosition(event, this.elements.menu, options);
      this.state.position = position;
      
      // 设置菜单位置和样式
      this._positionMenu(position);
      
      // 添加到DOM
      document.body.appendChild(this.elements.menu);
      
      // 显示动画
      this._showAnimation();
      
      // 更新状态
      this.state.isVisible = true;
      this.state.currentMenu = this.elements.menu;
      
      // 初始化键盘导航
      this._initKeyboardNavigation();
      
      // 发布事件
      this.eventManager?.emit('contextMenu:shown', {
        position,
        itemCount: menuItems.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ 显示右键菜单失败:', error);
      this.hide();
    }
  }
  
  /**
   * 隐藏菜单
   */
  hide() {
    if (!this.state.isVisible || !this.elements.menu) {
      return;
    }
    
    console.log('📝 隐藏右键菜单 🐱');
    
    // 隐藏动画
    this._hideAnimation(() => {
      // 清理DOM
      if (this.elements.menu && this.elements.menu.parentNode) {
        this.elements.menu.parentNode.removeChild(this.elements.menu);
      }
      
      // 清理状态
      this.state.isVisible = false;
      this.state.currentMenu = null;
      this.state.menuData = null;
      this.elements.menu = null;
      
      // 重置键盘导航
      this.keyboardNavigation.selectedIndex = -1;
      this.keyboardNavigation.focusableItems = [];
    });
    
    // 发布事件
    this.eventManager?.emit('contextMenu:hidden', {
      timestamp: Date.now()
    });
  }
  
  /**
   * 创建菜单元素
   * @private
   * @param {Array} menuItems
   * @param {Object} options
   */
  _createMenuElement(menuItems, options) {
    // 创建菜单容器
    this.elements.menu = document.createElement('div');
    this.elements.menu.className = `${this.config.className} ${options.className || ''}`;
    this.elements.menu.style.position = 'fixed';
    this.elements.menu.style.zIndex = this.config.zIndex;
    
    // 创建菜单项
    menuItems.forEach((item, index) => {
      const itemElement = this._createMenuItemElement(item, index);
      this.elements.menu.appendChild(itemElement);
    });
  }
  
  /**
   * 创建菜单项元素
   * @private
   * @param {Object} item
   * @param {number} index
   * @returns {HTMLElement}
   */
  _createMenuItemElement(item, index) {
    if (item.type === 'separator') {
      return this._createSeparatorElement();
    }
    
    const itemElement = document.createElement('div');
    itemElement.className = `${this.config.itemClassName} ${item.className || ''}`;
    itemElement.dataset.action = item.action || '';
    itemElement.dataset.index = index;
    
    // 设置禁用状态
    if (item.disabled) {
      itemElement.classList.add('disabled');
      itemElement.setAttribute('aria-disabled', 'true');
    }
    
    // 设置危险状态
    if (item.danger) {
      itemElement.classList.add('danger');
    }
    
    // 创建内容
    const content = this._createMenuItemContent(item);
    itemElement.appendChild(content);
    
    // 绑定事件
    this._bindMenuItemEvents(itemElement, item, index);
    
    return itemElement;
  }
  
  /**
   * 创建分隔符元素
   * @private
   * @returns {HTMLElement}
   */
  _createSeparatorElement() {
    const separator = document.createElement('div');
    separator.className = this.config.separatorClassName;
    separator.setAttribute('role', 'separator');
    return separator;
  }
  
  /**
   * 创建菜单项内容
   * @private
   * @param {Object} item
   * @returns {HTMLElement}
   */
  _createMenuItemContent(item) {
    const content = document.createElement('div');
    content.className = 'context-menu-content';
    
    // 图标
    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = 'context-menu-icon';
      icon.textContent = item.icon;
      content.appendChild(icon);
    }
    
    // 文本
    const text = document.createElement('span');
    text.className = 'context-menu-text';
    text.textContent = item.text || item.label || '未知项目';
    content.appendChild(text);
    
    // 快捷键
    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'context-menu-shortcut';
      shortcut.textContent = item.shortcut;
      content.appendChild(shortcut);
    }
    
    // 子菜单箭头
    if (item.submenu && item.submenu.length > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'context-menu-arrow';
      arrow.textContent = '▶';
      content.appendChild(arrow);
    }
    
    return content;
  }
  
  /**
   * 绑定菜单项事件
   * @private
   * @param {HTMLElement} itemElement
   * @param {Object} item
   * @param {number} index
   */
  _bindMenuItemEvents(itemElement, item, index) {
    // 点击事件
    itemElement.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (item.disabled) {
        return;
      }
      
      this._handleMenuItemClick(item, index, e);
    });
    
    // 鼠标悬停事件
    itemElement.addEventListener('mouseenter', () => {
      if (this.keyboardNavigation.enabled) {
        this.keyboardNavigation.selectedIndex = index;
        this._updateKeyboardSelection();
      }
    });
    
    // 右键事件（阻止冒泡）
    itemElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }
  
  /**
   * 处理菜单项点击
   * @private
   * @param {Object} item
   * @param {number} index
   * @param {Event} event
   */
  _handleMenuItemClick(item, index, event) {
    console.log(`📝 菜单项点击: ${item.action} 🐱`);
    
    // 执行回调
    if (typeof item.callback === 'function') {
      try {
        const result = item.callback(item, index, event);
        
        // 如果返回 false，不隐藏菜单
        if (result === false) {
          return;
        }
      } catch (error) {
        console.error('❌ 菜单项回调执行失败:', error);
      }
    }
    
    // 发布事件
    this.eventManager?.emit('contextMenu:itemClicked', {
      item,
      index,
      action: item.action,
      timestamp: Date.now()
    });
    
    // 隐藏菜单
    this.hide();
  }
  
  /**
   * 计算菜单位置
   * @private
   * @param {Event} event
   * @param {HTMLElement} menu
   * @param {Object} options
   * @returns {Object}
   */
  _calculatePosition(event, menu, options) {
    // 获取菜单尺寸
    const menuRect = this._getMenuSize(menu);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 鼠标位置
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    let left = mouseX;
    let top = mouseY;
    
    // 智能定位逻辑
    if (this.config.position === 'smart') {
      // 水平位置调整
      if (this.config.preferRight && left + menuRect.width <= viewportWidth - this.config.marginFromEdge) {
        // 右侧有足够空间
        left = mouseX;
      } else if (left - menuRect.width >= this.config.marginFromEdge) {
        // 左侧有足够空间
        left = mouseX - menuRect.width;
      } else {
        // 两侧都不够，贴边显示
        left = Math.max(this.config.marginFromEdge, viewportWidth - menuRect.width - this.config.marginFromEdge);
      }
      
      // 垂直位置调整
      if (this.config.preferBottom && top + menuRect.height <= viewportHeight - this.config.marginFromEdge) {
        // 下方有足够空间
        top = mouseY;
      } else if (top - menuRect.height >= this.config.marginFromEdge) {
        // 上方有足够空间
        top = mouseY - menuRect.height;
      } else {
        // 上下都不够，贴边显示
        top = Math.max(this.config.marginFromEdge, viewportHeight - menuRect.height - this.config.marginFromEdge);
      }
    }
    
    // 确保位置在有效范围内
    left = Math.max(this.config.marginFromEdge, Math.min(left, viewportWidth - menuRect.width - this.config.marginFromEdge));
    top = Math.max(this.config.marginFromEdge, Math.min(top, viewportHeight - menuRect.height - this.config.marginFromEdge));
    
    return { left, top };
  }
  
  /**
   * 获取菜单尺寸
   * @private
   * @param {HTMLElement} menu
   * @returns {Object}
   */
  _getMenuSize(menu) {
    // 临时添加到DOM以获取尺寸
    const originalStyle = {
      visibility: menu.style.visibility,
      position: menu.style.position,
      left: menu.style.left,
      top: menu.style.top
    };
    
    menu.style.visibility = 'hidden';
    menu.style.position = 'fixed';
    menu.style.left = '0px';
    menu.style.top = '0px';
    
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    document.body.removeChild(menu);
    
    // 恢复样式
    Object.assign(menu.style, originalStyle);
    
    return {
      width: rect.width,
      height: rect.height
    };
  }
  
  /**
   * 设置菜单位置
   * @private
   * @param {Object} position
   */
  _positionMenu(position) {
    if (this.elements.menu) {
      this.elements.menu.style.left = position.left + 'px';
      this.elements.menu.style.top = position.top + 'px';
    }
  }
  
  /**
   * 显示动画
   * @private
   */
  _showAnimation() {
    if (!this.config.animation || !this.elements.menu) {
      return;
    }
    
    // 初始状态
    this.elements.menu.style.opacity = '0';
    this.elements.menu.style.transform = 'scale(0.95) translateY(-10px)';
    this.elements.menu.style.transition = `opacity ${this.config.animationDuration}ms ease, transform ${this.config.animationDuration}ms ease`;
    
    // 触发动画
    requestAnimationFrame(() => {
      if (this.elements.menu) {
        this.elements.menu.style.opacity = '1';
        this.elements.menu.style.transform = 'scale(1) translateY(0)';
      }
    });
  }
  
  /**
   * 隐藏动画
   * @private
   * @param {Function} callback
   */
  _hideAnimation(callback) {
    if (!this.config.animation || !this.elements.menu) {
      callback && callback();
      return;
    }
    
    // 隐藏动画
    this.elements.menu.style.opacity = '0';
    this.elements.menu.style.transform = 'scale(0.95) translateY(-10px)';
    
    // 动画完成后执行回调
    setTimeout(() => {
      callback && callback();
    }, this.config.animationDuration);
  }
  
  /**
   * 初始化键盘导航
   * @private
   */
  _initKeyboardNavigation() {
    if (!this.keyboardNavigation.enabled || !this.elements.menu) {
      return;
    }
    
    // 获取可聚焦的菜单项
    this.keyboardNavigation.focusableItems = Array.from(
      this.elements.menu.querySelectorAll(`.${this.config.itemClassName}:not(.disabled)`)
    );
    
    this.keyboardNavigation.selectedIndex = -1;
  }
  
  /**
   * 处理键盘导航
   * @private
   * @param {KeyboardEvent} event
   */
  _handleKeyboardNavigation(event) {
    const { focusableItems } = this.keyboardNavigation;
    
    if (focusableItems.length === 0) {
      return;
    }
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.keyboardNavigation.selectedIndex = 
          (this.keyboardNavigation.selectedIndex + 1) % focusableItems.length;
        this._updateKeyboardSelection();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.keyboardNavigation.selectedIndex = 
          this.keyboardNavigation.selectedIndex <= 0 
            ? focusableItems.length - 1 
            : this.keyboardNavigation.selectedIndex - 1;
        this._updateKeyboardSelection();
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.keyboardNavigation.selectedIndex >= 0) {
          const selectedItem = focusableItems[this.keyboardNavigation.selectedIndex];
          selectedItem.click();
        }
        break;
    }
  }
  
  /**
   * 更新键盘选择状态
   * @private
   */
  _updateKeyboardSelection() {
    const { focusableItems, selectedIndex } = this.keyboardNavigation;
    
    // 清除所有选中状态
    focusableItems.forEach(item => {
      item.classList.remove('keyboard-selected');
    });
    
    // 设置当前选中项
    if (selectedIndex >= 0 && selectedIndex < focusableItems.length) {
      const selectedItem = focusableItems[selectedIndex];
      selectedItem.classList.add('keyboard-selected');
      
      // 确保选中项可见
      selectedItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }
  
  /**
   * 添加事件监听器（用于清理）
   * @private
   * @param {EventTarget} target
   * @param {string} event
   * @param {Function} handler
   * @param {Object} options
   */
  _addEventListener(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.eventListeners.push({
      target,
      event,
      handler,
      options
    });
  }
  
  /**
   * 检查菜单是否可见
   * @returns {boolean}
   */
  isVisible() {
    return this.state.isVisible;
  }
  
  /**
   * 获取当前菜单数据
   * @returns {Object|null}
   */
  getCurrentMenuData() {
    return this.state.menuData;
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    console.log('🗑️ 销毁右键菜单组件 🐱');
    
    // 隐藏菜单
    this.hide();
    
    // 清理事件监听器
    this.eventListeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
    this.eventListeners = [];
    
    // 清理状态
    this.state = {
      isVisible: false,
      currentMenu: null,
      menuData: null,
      position: { x: 0, y: 0 }
    };
    
    console.log('✅ 右键菜单组件已销毁 🐱');
  }
} 