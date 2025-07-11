/**
 * FavoriteBoard - 文件夹节点组件
 * 负责：单个文件夹节点的渲染和状态管理
 * 
 * @author JupiterTheWarlock
 * @description 文件夹树中单个节点的封装，支持展开/折叠、选中、图标等 🐱
 */

/**
 * 文件夹节点组件 - 单个文件夹节点的封装
 * 负责节点的渲染、状态管理和交互处理
 */
class FolderNodeComponent {
  constructor(nodeData, options = {}) {
    this.nodeData = nodeData;
    this.options = {
      depth: 0,
      showToggle: true,
      showIcon: true,
      showCount: true,
      isExpandable: false,
      isExpanded: false,
      isSelected: false,
      enableContextMenu: true,
      ...options
    };
    
    // DOM元素
    this.element = null;
    this.contentElement = null;
    this.toggleElement = null;
    this.iconElement = null;
    this.titleElement = null;
    this.countElement = null;
    
    // 事件回调
    this.callbacks = {
      onClick: null,
      onToggle: null,
      onContextMenu: null,
      onDoubleClick: null
    };
    
    // 状态
    this.isDestroyed = false;
    
    console.log(`🌲 文件夹节点组件创建: ${nodeData.title} 🐱`);
  }
  
  /**
   * 渲染节点
   * @returns {HTMLElement}
   */
  render() {
    if (this.isDestroyed) {
      throw new Error('节点已被销毁');
    }
    
    // 创建主容器
    this.element = document.createElement('div');
    this.element.className = this._getNodeClasses();
    this.element.dataset.folderId = this.nodeData.id;
    this.element.dataset.depth = this.options.depth;
    this.element.style.paddingLeft = `${this.options.depth * 20 + 12}px`;
    
    // 创建内容容器
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'tree-content';
    
    // 创建子元素
    this._createToggleElement();
    this._createIconElement();
    this._createTitleElement();
    this._createCountElement();
    
    // 组装元素
    this.element.appendChild(this.contentElement);
    
    // 绑定事件
    this._bindEvents();
    
    return this.element;
  }
  
  /**
   * 获取节点CSS类
   * @private
   * @returns {string}
   */
  _getNodeClasses() {
    const classes = ['tree-item'];
    
    if (this.nodeData.isSpecial) {
      classes.push('special-item');
    }
    
    if (this.nodeData.id === 'dashboard') {
      classes.push('dashboard-item');
    }
    
    if (this.options.isSelected) {
      classes.push('active');
    }
    
    if (this.options.isExpandable) {
      classes.push('expandable');
    }
    
    if (this.options.isExpanded) {
      classes.push('expanded');
    }
    
    return classes.join(' ');
  }
  
  /**
   * 创建展开/折叠按钮
   * @private
   */
  _createToggleElement() {
    if (this.options.showToggle && this.options.isExpandable) {
      this.toggleElement = document.createElement('span');
      this.toggleElement.className = `tree-toggle ${this.options.isExpanded ? 'expanded' : ''}`;
      this.toggleElement.dataset.folderId = this.nodeData.id;
      this.toggleElement.textContent = '▶';
      this.contentElement.appendChild(this.toggleElement);
    } else {
      // 添加占位符
      const spacer = document.createElement('span');
      spacer.className = 'tree-spacer';
      spacer.style.width = '20px';
      spacer.style.display = 'inline-block';
      this.contentElement.appendChild(spacer);
    }
  }
  
  /**
   * 创建图标元素
   * @private
   */
  _createIconElement() {
    if (this.options.showIcon) {
      this.iconElement = document.createElement('span');
      this.iconElement.className = 'tree-icon';
      this.iconElement.textContent = this.nodeData.icon || this._getDefaultIcon();
      this.contentElement.appendChild(this.iconElement);
    }
  }
  
  /**
   * 创建标题元素
   * @private
   */
  _createTitleElement() {
    this.titleElement = document.createElement('span');
    this.titleElement.className = 'tree-title';
    this.titleElement.textContent = this.nodeData.title;
    this.titleElement.title = this.nodeData.title; // 添加提示
    this.contentElement.appendChild(this.titleElement);
  }
  
  /**
   * 创建计数元素
   * @private
   */
  _createCountElement() {
    if (this.options.showCount) {
      this.countElement = document.createElement('span');
      this.countElement.className = 'bookmark-count';
      this.countElement.textContent = this._getCountText();
      this.contentElement.appendChild(this.countElement);
    }
  }
  
  /**
   * 获取默认图标
   * @private
   * @returns {string}
   */
  _getDefaultIcon() {
    if (this.nodeData.id === 'dashboard') {
      return '🏠';
    } else if (this.nodeData.id === 'all') {
      return '🗂️';
    } else if (this.nodeData.isSpecial) {
      return '⭐';
    } else {
      return '📁';
    }
  }
  
  /**
   * 获取计数文本
   * @private
   * @returns {string}
   */
  _getCountText() {
    if (this.nodeData.id === 'dashboard') {
      return '-';
    } else if (typeof this.nodeData.bookmarkCount === 'number') {
      return this.nodeData.bookmarkCount.toString();
    } else {
      return '0';
    }
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.element) return;
    
    // 点击事件
    this.element.addEventListener('click', (e) => {
      // 如果点击的是展开按钮，不触发节点点击
      if (e.target.closest('.tree-toggle')) {
        return;
      }
      
      if (this.callbacks.onClick) {
        this.callbacks.onClick(this.nodeData, e);
      }
    });
    
    // 双击事件
    this.element.addEventListener('dblclick', (e) => {
      if (this.callbacks.onDoubleClick) {
        this.callbacks.onDoubleClick(this.nodeData, e);
      }
    });
    
    // 右键菜单事件
    if (this.options.enableContextMenu) {
      this.element.addEventListener('contextmenu', (e) => {
        if (this.callbacks.onContextMenu) {
          this.callbacks.onContextMenu(this.nodeData, e);
        }
      });
    }
    
    // 展开按钮事件
    if (this.toggleElement) {
      this.toggleElement.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (this.callbacks.onToggle) {
          this.callbacks.onToggle(this.nodeData, !this.options.isExpanded);
        }
      });
    }
  }
  
  /**
   * 更新节点数据
   * @param {Object} newData
   */
  updateData(newData) {
    if (this.isDestroyed) return;
    
    this.nodeData = { ...this.nodeData, ...newData };
    
    // 更新标题
    if (this.titleElement && newData.title !== undefined) {
      this.titleElement.textContent = newData.title;
      this.titleElement.title = newData.title;
    }
    
    // 更新图标
    if (this.iconElement && newData.icon !== undefined) {
      this.iconElement.textContent = newData.icon || this._getDefaultIcon();
    }
    
    // 更新计数
    if (this.countElement && newData.bookmarkCount !== undefined) {
      this.countElement.textContent = this._getCountText();
    }
  }
  
  /**
   * 更新选中状态
   * @param {boolean} isSelected
   */
  setSelected(isSelected) {
    if (this.isDestroyed) return;
    
    this.options.isSelected = isSelected;
    
    if (this.element) {
      if (isSelected) {
        this.element.classList.add('active');
      } else {
        this.element.classList.remove('active');
      }
    }
  }
  
  /**
   * 更新展开状态
   * @param {boolean} isExpanded
   */
  setExpanded(isExpanded) {
    if (this.isDestroyed) return;
    
    this.options.isExpanded = isExpanded;
    
    if (this.element) {
      if (isExpanded) {
        this.element.classList.add('expanded');
      } else {
        this.element.classList.remove('expanded');
      }
    }
    
    if (this.toggleElement) {
      if (isExpanded) {
        this.toggleElement.classList.add('expanded');
      } else {
        this.toggleElement.classList.remove('expanded');
      }
    }
  }
  
  /**
   * 设置展开能力
   * @param {boolean} isExpandable
   */
  setExpandable(isExpandable) {
    if (this.isDestroyed) return;
    
    this.options.isExpandable = isExpandable;
    
    if (this.element) {
      if (isExpandable) {
        this.element.classList.add('expandable');
      } else {
        this.element.classList.remove('expandable');
      }
    }
    
    // 重新创建展开按钮
    if (this.contentElement) {
      const oldToggle = this.contentElement.querySelector('.tree-toggle, .tree-spacer');
      if (oldToggle) {
        oldToggle.remove();
      }
      
      this._createToggleElement();
      this.contentElement.insertBefore(
        this.toggleElement || this.contentElement.querySelector('.tree-spacer'),
        this.contentElement.firstChild
      );
    }
  }
  
  /**
   * 高亮节点（用于搜索结果等）
   * @param {boolean} highlight
   */
  setHighlight(highlight) {
    if (this.isDestroyed) return;
    
    if (this.element) {
      if (highlight) {
        this.element.classList.add('highlighted');
      } else {
        this.element.classList.remove('highlighted');
      }
    }
  }
  
  /**
   * 设置加载状态
   * @param {boolean} isLoading
   */
  setLoading(isLoading) {
    if (this.isDestroyed) return;
    
    if (this.element) {
      if (isLoading) {
        this.element.classList.add('loading');
      } else {
        this.element.classList.remove('loading');
      }
    }
    
    if (this.iconElement) {
      if (isLoading) {
        this.iconElement.textContent = '⏳';
      } else {
        this.iconElement.textContent = this.nodeData.icon || this._getDefaultIcon();
      }
    }
  }
  
  /**
   * 设置事件回调
   * @param {string} eventName
   * @param {Function} callback
   */
  on(eventName, callback) {
    if (this.callbacks.hasOwnProperty('on' + eventName.charAt(0).toUpperCase() + eventName.slice(1))) {
      this.callbacks['on' + eventName.charAt(0).toUpperCase() + eventName.slice(1)] = callback;
    }
  }
  
  /**
   * 获取节点数据
   * @returns {Object}
   */
  getData() {
    return { ...this.nodeData };
  }
  
  /**
   * 获取节点选项
   * @returns {Object}
   */
  getOptions() {
    return { ...this.options };
  }
  
  /**
   * 获取DOM元素
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element;
  }
  
  /**
   * 检查节点是否可见
   * @returns {boolean}
   */
  isVisible() {
    if (!this.element || this.isDestroyed) return false;
    
    const rect = this.element.getBoundingClientRect();
    return rect.height > 0 && rect.width > 0;
  }
  
  /**
   * 滚动到节点
   * @param {Object} options
   */
  scrollIntoView(options = {}) {
    if (this.element && !this.isDestroyed) {
      this.element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        ...options
      });
    }
  }
  
  /**
   * 销毁节点
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
    this.toggleElement = null;
    this.iconElement = null;
    this.titleElement = null;
    this.countElement = null;
    
    // 清理回调
    this.callbacks = {};
    
    // 标记为已销毁
    this.isDestroyed = true;
    
    console.log(`🗑️ 文件夹节点组件已销毁: ${this.nodeData.title} 🐱`);
  }
} 