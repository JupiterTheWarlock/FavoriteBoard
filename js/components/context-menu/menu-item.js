/**
 * FavoriteBoard - 菜单项组件
 * 负责：单个菜单项的渲染和交互
 * 
 * @author JupiterTheWarlock
 * @description 可复用的菜单项组件，支持图标、快捷键、子菜单 🐱
 */

/**
 * 菜单项组件 - 单个菜单项的封装
 * 负责菜单项的渲染、状态管理和交互处理
 */
class MenuItemComponent {
  constructor(itemData, options = {}) {
    this.itemData = itemData;
    this.options = {
      enableKeyboard: true,
      enableHover: true,
      enableSubmenu: true,
      showIcon: true,
      showShortcut: true,
      animationDuration: 150,
      ...options
    };
    
    // DOM元素
    this.element = null;
    this.contentElement = null;
    this.iconElement = null;
    this.textElement = null;
    this.shortcutElement = null;
    this.arrowElement = null;
    
    // 状态
    this.isDisabled = false;
    this.isSelected = false;
    this.isHovered = false;
    this.isDestroyed = false;
    
    // 事件回调
    this.callbacks = {
      onClick: null,
      onHover: null,
      onLeave: null,
      onKeyDown: null
    };
    
    console.log(`📋 菜单项组件创建: ${itemData.text || itemData.action} 🐱`);
  }
  
  /**
   * 渲染菜单项
   * @returns {HTMLElement}
   */
  render() {
    if (this.isDestroyed) {
      throw new Error('菜单项已被销毁');
    }
    
    // 创建主容器
    this.element = document.createElement('div');
    this.element.className = this._getItemClasses();
    this.element.dataset.action = this.itemData.action || '';
    this.element.setAttribute('role', 'menuitem');
    
    // 设置可访问性属性
    this._setAccessibilityAttributes();
    
    // 创建内容
    this._createContent();
    
    // 绑定事件
    this._bindEvents();
    
    return this.element;
  }
  
  /**
   * 获取菜单项CSS类
   * @private
   * @returns {string}
   */
  _getItemClasses() {
    const classes = ['context-menu-item'];
    
    if (this.itemData.className) {
      classes.push(this.itemData.className);
    }
    
    if (this.itemData.disabled || this.isDisabled) {
      classes.push('disabled');
    }
    
    if (this.itemData.danger) {
      classes.push('danger');
    }
    
    if (this.itemData.type === 'separator') {
      classes.push('separator');
    }
    
    if (this.itemData.submenu && this.itemData.submenu.length > 0) {
      classes.push('has-submenu');
    }
    
    if (this.isSelected) {
      classes.push('selected');
    }
    
    if (this.isHovered) {
      classes.push('hovered');
    }
    
    return classes.join(' ');
  }
  
  /**
   * 设置可访问性属性
   * @private
   */
  _setAccessibilityAttributes() {
    if (this.itemData.disabled || this.isDisabled) {
      this.element.setAttribute('aria-disabled', 'true');
      this.element.setAttribute('tabindex', '-1');
    } else {
      this.element.setAttribute('aria-disabled', 'false');
      this.element.setAttribute('tabindex', '0');
    }
    
    if (this.itemData.submenu && this.itemData.submenu.length > 0) {
      this.element.setAttribute('aria-haspopup', 'true');
      this.element.setAttribute('aria-expanded', 'false');
    }
    
    if (this.itemData.shortcut) {
      this.element.setAttribute('aria-keyshortcuts', this.itemData.shortcut);
    }
    
    // 设置描述
    const description = this.itemData.description || this.itemData.tooltip;
    if (description) {
      this.element.setAttribute('aria-describedby', `menuitem-desc-${this.itemData.action}`);
    }
  }
  
  /**
   * 创建内容
   * @private
   */
  _createContent() {
    if (this.itemData.type === 'separator') {
      this._createSeparator();
      return;
    }
    
    // 创建内容容器
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'context-menu-content';
    
    // 创建图标
    if (this.options.showIcon && this.itemData.icon) {
      this._createIcon();
    }
    
    // 创建文本
    this._createText();
    
    // 创建快捷键
    if (this.options.showShortcut && this.itemData.shortcut) {
      this._createShortcut();
    }
    
    // 创建子菜单箭头
    if (this.options.enableSubmenu && this.itemData.submenu && this.itemData.submenu.length > 0) {
      this._createArrow();
    }
    
    // 添加到主元素
    this.element.appendChild(this.contentElement);
    
    // 创建描述（如果有）
    if (this.itemData.description || this.itemData.tooltip) {
      this._createDescription();
    }
  }
  
  /**
   * 创建分隔符
   * @private
   */
  _createSeparator() {
    this.element.className = 'context-menu-separator';
    this.element.setAttribute('role', 'separator');
    this.element.removeAttribute('tabindex');
  }
  
  /**
   * 创建图标
   * @private
   */
  _createIcon() {
    this.iconElement = document.createElement('span');
    this.iconElement.className = 'context-menu-icon';
    
    if (typeof this.itemData.icon === 'string') {
      // 文本图标（emoji或图标字体）
      this.iconElement.textContent = this.itemData.icon;
    } else if (this.itemData.icon.type === 'image') {
      // 图片图标
      const img = document.createElement('img');
      img.src = this.itemData.icon.src;
      img.alt = this.itemData.icon.alt || '';
      this.iconElement.appendChild(img);
    } else if (this.itemData.icon.type === 'svg') {
      // SVG图标
      this.iconElement.innerHTML = this.itemData.icon.content;
    }
    
    this.contentElement.appendChild(this.iconElement);
  }
  
  /**
   * 创建文本
   * @private
   */
  _createText() {
    this.textElement = document.createElement('span');
    this.textElement.className = 'context-menu-text';
    this.textElement.textContent = this.itemData.text || this.itemData.label || '未知项目';
    
    // 添加高亮支持
    if (this.itemData.highlight) {
      this._highlightText(this.itemData.highlight);
    }
    
    this.contentElement.appendChild(this.textElement);
  }
  
  /**
   * 创建快捷键
   * @private
   */
  _createShortcut() {
    this.shortcutElement = document.createElement('span');
    this.shortcutElement.className = 'context-menu-shortcut';
    this.shortcutElement.textContent = this.itemData.shortcut;
    this.contentElement.appendChild(this.shortcutElement);
  }
  
  /**
   * 创建子菜单箭头
   * @private
   */
  _createArrow() {
    this.arrowElement = document.createElement('span');
    this.arrowElement.className = 'context-menu-arrow';
    this.arrowElement.textContent = '▶';
    this.arrowElement.setAttribute('aria-hidden', 'true');
    this.contentElement.appendChild(this.arrowElement);
  }
  
  /**
   * 创建描述
   * @private
   */
  _createDescription() {
    const description = document.createElement('div');
    description.id = `menuitem-desc-${this.itemData.action}`;
    description.className = 'context-menu-description';
    description.textContent = this.itemData.description || this.itemData.tooltip;
    description.style.display = 'none'; // 隐藏，仅用于可访问性
    
    this.element.appendChild(description);
  }
  
  /**
   * 高亮文本
   * @private
   * @param {string|RegExp} highlight
   */
  _highlightText(highlight) {
    const text = this.textElement.textContent;
    let highlightedText;
    
    if (highlight instanceof RegExp) {
      highlightedText = text.replace(highlight, '<mark>$&</mark>');
    } else if (typeof highlight === 'string') {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedText = text.replace(regex, '<mark>$1</mark>');
    }
    
    if (highlightedText && highlightedText !== text) {
      this.textElement.innerHTML = highlightedText;
    }
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.element || this.itemData.type === 'separator') return;
    
    // 点击事件
    this.element.addEventListener('click', (e) => {
      this._handleClick(e);
    });
    
    // 鼠标悬停事件
    if (this.options.enableHover) {
      this.element.addEventListener('mouseenter', (e) => {
        this._handleHover(e);
      });
      
      this.element.addEventListener('mouseleave', (e) => {
        this._handleLeave(e);
      });
    }
    
    // 键盘事件
    if (this.options.enableKeyboard) {
      this.element.addEventListener('keydown', (e) => {
        this._handleKeyDown(e);
      });
    }
    
    // 右键事件（阻止默认）
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    // 阻止文本选择
    this.element.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });
  }
  
  /**
   * 处理点击事件
   * @private
   * @param {Event} event
   */
  _handleClick(event) {
    if (this.itemData.disabled || this.isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    console.log(`📋 菜单项点击: ${this.itemData.action} 🐱`);
    
    // 添加点击动画
    this._addClickAnimation();
    
    // 执行回调
    if (this.callbacks.onClick) {
      this.callbacks.onClick(this.itemData, event);
    }
    
    // 如果有自定义处理函数
    if (typeof this.itemData.handler === 'function') {
      try {
        this.itemData.handler(this.itemData, event);
      } catch (error) {
        console.error('❌ 菜单项处理函数执行失败:', error);
      }
    }
  }
  
  /**
   * 处理悬停事件
   * @private
   * @param {Event} event
   */
  _handleHover(event) {
    if (this.itemData.disabled || this.isDisabled) {
      return;
    }
    
    this.isHovered = true;
    this.element.classList.add('hovered');
    
    // 执行回调
    if (this.callbacks.onHover) {
      this.callbacks.onHover(this.itemData, event);
    }
  }
  
  /**
   * 处理离开悬停事件
   * @private
   * @param {Event} event
   */
  _handleLeave(event) {
    this.isHovered = false;
    this.element.classList.remove('hovered');
    
    // 执行回调
    if (this.callbacks.onLeave) {
      this.callbacks.onLeave(this.itemData, event);
    }
  }
  
  /**
   * 处理键盘事件
   * @private
   * @param {Event} event
   */
  _handleKeyDown(event) {
    if (this.itemData.disabled || this.isDisabled) {
      return;
    }
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this._handleClick(event);
        break;
        
      case 'ArrowRight':
        if (this.itemData.submenu && this.itemData.submenu.length > 0) {
          event.preventDefault();
          // 触发子菜单显示
          if (this.callbacks.onKeyDown) {
            this.callbacks.onKeyDown('submenu', this.itemData, event);
          }
        }
        break;
    }
    
    // 执行通用键盘回调
    if (this.callbacks.onKeyDown) {
      this.callbacks.onKeyDown(event.key, this.itemData, event);
    }
  }
  
  /**
   * 添加点击动画
   * @private
   */
  _addClickAnimation() {
    if (!this.element || this.options.animationDuration <= 0) {
      return;
    }
    
    // 添加点击效果类
    this.element.classList.add('clicking');
    
    // 移除点击效果
    setTimeout(() => {
      if (this.element) {
        this.element.classList.remove('clicking');
      }
    }, this.options.animationDuration);
  }
  
  /**
   * 更新菜单项数据
   * @param {Object} newData
   */
  updateData(newData) {
    if (this.isDestroyed) return;
    
    this.itemData = { ...this.itemData, ...newData };
    
    // 更新文本
    if (this.textElement && newData.text !== undefined) {
      this.textElement.textContent = newData.text;
      
      // 重新应用高亮
      if (this.itemData.highlight) {
        this._highlightText(this.itemData.highlight);
      }
    }
    
    // 更新图标
    if (this.iconElement && newData.icon !== undefined) {
      if (typeof newData.icon === 'string') {
        this.iconElement.textContent = newData.icon;
      }
    }
    
    // 更新快捷键
    if (this.shortcutElement && newData.shortcut !== undefined) {
      this.shortcutElement.textContent = newData.shortcut;
    }
    
    // 更新禁用状态
    if (newData.disabled !== undefined) {
      this.setDisabled(newData.disabled);
    }
    
    // 更新CSS类
    if (this.element) {
      this.element.className = this._getItemClasses();
    }
    
    // 更新可访问性属性
    this._setAccessibilityAttributes();
  }
  
  /**
   * 设置禁用状态
   * @param {boolean} disabled
   */
  setDisabled(disabled) {
    if (this.isDestroyed) return;
    
    this.isDisabled = disabled;
    this.itemData.disabled = disabled;
    
    if (this.element) {
      if (disabled) {
        this.element.classList.add('disabled');
        this.element.setAttribute('aria-disabled', 'true');
        this.element.setAttribute('tabindex', '-1');
      } else {
        this.element.classList.remove('disabled');
        this.element.setAttribute('aria-disabled', 'false');
        this.element.setAttribute('tabindex', '0');
      }
    }
  }
  
  /**
   * 设置选中状态
   * @param {boolean} selected
   */
  setSelected(selected) {
    if (this.isDestroyed) return;
    
    this.isSelected = selected;
    
    if (this.element) {
      if (selected) {
        this.element.classList.add('selected');
        this.element.setAttribute('aria-selected', 'true');
      } else {
        this.element.classList.remove('selected');
        this.element.setAttribute('aria-selected', 'false');
      }
    }
  }
  
  /**
   * 高亮菜单项
   * @param {string|RegExp} highlight
   */
  setHighlight(highlight) {
    if (this.isDestroyed) return;
    
    this.itemData.highlight = highlight;
    
    if (this.textElement) {
      this._highlightText(highlight);
    }
  }
  
  /**
   * 清除高亮
   */
  clearHighlight() {
    if (this.isDestroyed) return;
    
    this.itemData.highlight = null;
    
    if (this.textElement) {
      this.textElement.textContent = this.itemData.text || this.itemData.label || '未知项目';
    }
  }
  
  /**
   * 聚焦菜单项
   */
  focus() {
    if (this.element && !this.isDestroyed && !this.isDisabled) {
      this.element.focus();
    }
  }
  
  /**
   * 失焦菜单项
   */
  blur() {
    if (this.element && !this.isDestroyed) {
      this.element.blur();
    }
  }
  
  /**
   * 设置事件回调
   * @param {string} eventName
   * @param {Function} callback
   */
  on(eventName, callback) {
    const callbackKey = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
    if (this.callbacks.hasOwnProperty(callbackKey)) {
      this.callbacks[callbackKey] = callback;
    }
  }
  
  /**
   * 获取菜单项数据
   * @returns {Object}
   */
  getData() {
    return { ...this.itemData };
  }
  
  /**
   * 获取DOM元素
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element;
  }
  
  /**
   * 检查是否禁用
   * @returns {boolean}
   */
  isDisabledState() {
    return this.isDisabled || this.itemData.disabled;
  }
  
  /**
   * 检查是否选中
   * @returns {boolean}
   */
  isSelectedState() {
    return this.isSelected;
  }
  
  /**
   * 销毁菜单项
   */
  destroy() {
    if (this.isDestroyed) return;
    
    // 清理DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // 清理引用
    this.element = null;
    this.contentElement = null;
    this.iconElement = null;
    this.textElement = null;
    this.shortcutElement = null;
    this.arrowElement = null;
    
    // 清理回调
    this.callbacks = {};
    
    // 标记为已销毁
    this.isDestroyed = true;
    
    console.log(`🗑️ 菜单项组件已销毁: ${this.itemData.text || this.itemData.action} 🐱`);
  }
} 