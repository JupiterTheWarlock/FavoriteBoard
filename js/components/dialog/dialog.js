/**
 * FavoriteBoard - 对话框组件
 * 负责：对话框的显示、隐藏、交互处理
 * 
 * @author JupiterTheWarlock
 * @description 可复用的对话框基类，支持各种类型的对话框、动画、键盘操作 🐱
 */

/**
 * 对话框组件 - 通用的对话框实现基类
 * 负责对话框的创建、显示、隐藏和交互处理
 */
class DialogComponent {
  constructor(options = {}) {
    // 配置选项
    this.config = {
      type: 'confirm', // 'confirm', 'alert', 'prompt', 'custom'
      title: '确认',
      message: '',
      icon: null,
      confirmText: '确认',
      cancelText: '取消',
      showCancel: true,
      showClose: true,
      closeOnEscape: true,
      closeOnOverlay: true,
      animation: true,
      animationDuration: 300,
      zIndex: 10000,
      maxWidth: '400px',
      maxHeight: '80vh',
      className: '',
      overlayClassName: '',
      allowHtml: false,
      ...options
    };
    
    // 状态
    this.state = {
      isVisible: false,
      isDestroyed: false,
      result: null
    };
    
    // DOM元素
    this.elements = {
      overlay: null,
      dialog: null,
      header: null,
      title: null,
      closeBtn: null,
      body: null,
      content: null,
      footer: null,
      confirmBtn: null,
      cancelBtn: null
    };
    
    // 事件监听器
    this.eventListeners = [];
    
    // Promise解析器
    this.resolvers = {
      resolve: null,
      reject: null
    };
    
    console.log(`💬 对话框组件创建: ${this.config.type} 🐱`);
  }
  
  /**
   * 显示对话框
   * @returns {Promise} 返回用户操作结果的Promise
   */
  show() {
    if (this.state.isVisible || this.state.isDestroyed) {
      return Promise.reject(new Error('对话框已显示或已销毁'));
    }
    
    return new Promise((resolve, reject) => {
      this.resolvers.resolve = resolve;
      this.resolvers.reject = reject;
      
      try {
        this._createDialog();
        this._bindEvents();
        this._showDialog();
        
        this.state.isVisible = true;
        
        console.log(`💬 显示对话框: ${this.config.type} 🐱`);
        
      } catch (error) {
        console.error('❌ 显示对话框失败:', error);
        this._cleanup();
        reject(error);
      }
    });
  }
  
  /**
   * 隐藏对话框
   * @param {*} result - 操作结果
   * @param {boolean} isConfirm - 是否为确认操作
   */
  hide(result = null, isConfirm = false) {
    if (!this.state.isVisible) {
      return;
    }
    
    console.log(`💬 隐藏对话框: ${this.config.type}，结果: ${result} 🐱`);
    
    this.state.result = result;
    this.state.isVisible = false;
    
    // 隐藏动画
    this._hideDialog(() => {
      this._cleanup();
      
      // 解析Promise
      if (this.resolvers.resolve) {
        this.resolvers.resolve({
          result,
          isConfirm,
          cancelled: !isConfirm && result === null
        });
      }
    });
  }
  
  /**
   * 创建对话框DOM结构
   * @private
   */
  _createDialog() {
    // 创建遮罩层
    this.elements.overlay = document.createElement('div');
    this.elements.overlay.className = `dialog-overlay ${this.config.overlayClassName}`;
    this.elements.overlay.style.position = 'fixed';
    this.elements.overlay.style.top = '0';
    this.elements.overlay.style.left = '0';
    this.elements.overlay.style.width = '100%';
    this.elements.overlay.style.height = '100%';
    this.elements.overlay.style.zIndex = this.config.zIndex;
    this.elements.overlay.style.display = 'flex';
    this.elements.overlay.style.alignItems = 'center';
    this.elements.overlay.style.justifyContent = 'center';
    
    // 创建对话框
    this.elements.dialog = document.createElement('div');
    this.elements.dialog.className = `dialog ${this.config.className}`;
    this.elements.dialog.style.maxWidth = this.config.maxWidth;
    this.elements.dialog.style.maxHeight = this.config.maxHeight;
    this.elements.dialog.setAttribute('role', 'dialog');
    this.elements.dialog.setAttribute('aria-modal', 'true');
    
    // 创建头部
    this._createHeader();
    
    // 创建主体
    this._createBody();
    
    // 创建底部
    this._createFooter();
    
    // 组装结构
    this.elements.overlay.appendChild(this.elements.dialog);
  }
  
  /**
   * 创建对话框头部
   * @private
   */
  _createHeader() {
    this.elements.header = document.createElement('div');
    this.elements.header.className = 'dialog-header';
    
    // 创建标题
    this.elements.title = document.createElement('h3');
    this.elements.title.className = 'dialog-title';
    this.elements.title.textContent = this.config.title;
    this.elements.header.appendChild(this.elements.title);
    
    // 创建关闭按钮
    if (this.config.showClose) {
      this.elements.closeBtn = document.createElement('button');
      this.elements.closeBtn.className = 'dialog-close';
      this.elements.closeBtn.innerHTML = '×';
      this.elements.closeBtn.setAttribute('aria-label', '关闭');
      this.elements.header.appendChild(this.elements.closeBtn);
    }
    
    this.elements.dialog.appendChild(this.elements.header);
  }
  
  /**
   * 创建对话框主体
   * @private
   */
  _createBody() {
    this.elements.body = document.createElement('div');
    this.elements.body.className = 'dialog-body';
    
    // 创建图标（如果有）
    if (this.config.icon) {
      const iconElement = document.createElement('div');
      iconElement.className = 'dialog-icon';
      
      if (typeof this.config.icon === 'string') {
        iconElement.textContent = this.config.icon;
      } else {
        iconElement.appendChild(this.config.icon);
      }
      
      this.elements.body.appendChild(iconElement);
    }
    
    // 创建内容
    this.elements.content = document.createElement('div');
    this.elements.content.className = 'dialog-content';
    
    if (this.config.message) {
      if (this.config.allowHtml) {
        this.elements.content.innerHTML = this.config.message;
      } else {
        this.elements.content.textContent = this.config.message;
      }
    }
    
    this.elements.body.appendChild(this.elements.content);
    
    // 子类可以重写此方法来添加自定义内容
    this._createCustomContent();
    
    this.elements.dialog.appendChild(this.elements.body);
  }
  
  /**
   * 创建自定义内容（子类重写）
   * @protected
   */
  _createCustomContent() {
    // 由子类实现
  }
  
  /**
   * 创建对话框底部
   * @private
   */
  _createFooter() {
    this.elements.footer = document.createElement('div');
    this.elements.footer.className = 'dialog-footer';
    
    // 创建取消按钮
    if (this.config.showCancel) {
      this.elements.cancelBtn = document.createElement('button');
      this.elements.cancelBtn.className = 'dialog-btn dialog-btn-cancel';
      this.elements.cancelBtn.textContent = this.config.cancelText;
      this.elements.footer.appendChild(this.elements.cancelBtn);
    }
    
    // 创建确认按钮
    this.elements.confirmBtn = document.createElement('button');
    this.elements.confirmBtn.className = 'dialog-btn dialog-btn-confirm';
    this.elements.confirmBtn.textContent = this.config.confirmText;
    
    // 根据类型设置按钮样式
    if (this.config.type === 'confirm' && this.config.danger) {
      this.elements.confirmBtn.classList.add('btn-danger');
    }
    
    this.elements.footer.appendChild(this.elements.confirmBtn);
    
    this.elements.dialog.appendChild(this.elements.footer);
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    // 确认按钮事件
    if (this.elements.confirmBtn) {
      this._addEventListener(this.elements.confirmBtn, 'click', () => {
        this._handleConfirm();
      });
    }
    
    // 取消按钮事件
    if (this.elements.cancelBtn) {
      this._addEventListener(this.elements.cancelBtn, 'click', () => {
        this._handleCancel();
      });
    }
    
    // 关闭按钮事件
    if (this.elements.closeBtn) {
      this._addEventListener(this.elements.closeBtn, 'click', () => {
        this._handleCancel();
      });
    }
    
    // 遮罩层点击事件
    if (this.config.closeOnOverlay) {
      this._addEventListener(this.elements.overlay, 'click', (e) => {
        if (e.target === this.elements.overlay) {
          this._handleCancel();
        }
      });
    }
    
    // 键盘事件
    this._addEventListener(document, 'keydown', (e) => {
      this._handleKeyDown(e);
    });
    
    // 阻止对话框内的点击事件冒泡
    this._addEventListener(this.elements.dialog, 'click', (e) => {
      e.stopPropagation();
    });
  }
  
  /**
   * 处理确认操作
   * @protected
   */
  _handleConfirm() {
    const result = this._getResult();
    
    // 验证结果（子类可重写）
    if (!this._validateResult(result)) {
      return;
    }
    
    this.hide(result, true);
  }
  
  /**
   * 处理取消操作
   * @protected
   */
  _handleCancel() {
    this.hide(null, false);
  }
  
  /**
   * 获取对话框结果（子类重写）
   * @protected
   * @returns {*}
   */
  _getResult() {
    return null;
  }
  
  /**
   * 验证结果（子类可重写）
   * @protected
   * @param {*} result
   * @returns {boolean}
   */
  _validateResult(result) {
    return true;
  }
  
  /**
   * 处理键盘事件
   * @private
   * @param {KeyboardEvent} event
   */
  _handleKeyDown(event) {
    switch (event.key) {
      case 'Escape':
        if (this.config.closeOnEscape) {
          event.preventDefault();
          this._handleCancel();
        }
        break;
        
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this._handleConfirm();
        }
        break;
        
      case 'Tab':
        this._handleTabNavigation(event);
        break;
    }
  }
  
  /**
   * 处理Tab导航
   * @private
   * @param {KeyboardEvent} event
   */
  _handleTabNavigation(event) {
    const focusableElements = this.elements.dialog.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      // Shift+Tab: 向前导航
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: 向后导航
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  /**
   * 显示对话框
   * @private
   */
  _showDialog() {
    // 添加到DOM
    document.body.appendChild(this.elements.overlay);
    
    // 设置初始样式
    if (this.config.animation) {
      this.elements.overlay.style.opacity = '0';
      this.elements.dialog.style.transform = 'scale(0.9) translateY(-20px)';
      this.elements.dialog.style.opacity = '0';
    }
    
    // 聚焦第一个可聚焦元素
    this._focusFirstElement();
    
    // 触发显示动画
    if (this.config.animation) {
      requestAnimationFrame(() => {
        this.elements.overlay.style.transition = `opacity ${this.config.animationDuration}ms ease`;
        this.elements.dialog.style.transition = `transform ${this.config.animationDuration}ms ease, opacity ${this.config.animationDuration}ms ease`;
        
        this.elements.overlay.style.opacity = '1';
        this.elements.dialog.style.transform = 'scale(1) translateY(0)';
        this.elements.dialog.style.opacity = '1';
      });
    }
  }
  
  /**
   * 隐藏对话框
   * @private
   * @param {Function} callback
   */
  _hideDialog(callback) {
    if (this.config.animation) {
      this.elements.overlay.style.opacity = '0';
      this.elements.dialog.style.transform = 'scale(0.9) translateY(-20px)';
      this.elements.dialog.style.opacity = '0';
      
      setTimeout(() => {
        callback && callback();
      }, this.config.animationDuration);
    } else {
      callback && callback();
    }
  }
  
  /**
   * 聚焦第一个可聚焦元素
   * @private
   */
  _focusFirstElement() {
    // 尝试聚焦第一个输入元素
    const firstInput = this.elements.dialog.querySelector('input, select, textarea');
    if (firstInput) {
      firstInput.focus();
      return;
    }
    
    // 否则聚焦确认按钮
    if (this.elements.confirmBtn) {
      this.elements.confirmBtn.focus();
    }
  }
  
  /**
   * 添加事件监听器
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
   * 清理资源
   * @private
   */
  _cleanup() {
    // 移除事件监听器
    this.eventListeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
    this.eventListeners = [];
    
    // 移除DOM元素
    if (this.elements.overlay && this.elements.overlay.parentNode) {
      this.elements.overlay.parentNode.removeChild(this.elements.overlay);
    }
    
    // 清理引用
    Object.keys(this.elements).forEach(key => {
      this.elements[key] = null;
    });
  }
  
  /**
   * 更新对话框内容
   * @param {Object} updates
   */
  updateContent(updates) {
    if (this.state.isDestroyed) return;
    
    // 更新标题
    if (updates.title !== undefined && this.elements.title) {
      this.elements.title.textContent = updates.title;
      this.config.title = updates.title;
    }
    
    // 更新消息
    if (updates.message !== undefined && this.elements.content) {
      if (this.config.allowHtml) {
        this.elements.content.innerHTML = updates.message;
      } else {
        this.elements.content.textContent = updates.message;
      }
      this.config.message = updates.message;
    }
    
    // 更新按钮文本
    if (updates.confirmText !== undefined && this.elements.confirmBtn) {
      this.elements.confirmBtn.textContent = updates.confirmText;
      this.config.confirmText = updates.confirmText;
    }
    
    if (updates.cancelText !== undefined && this.elements.cancelBtn) {
      this.elements.cancelBtn.textContent = updates.cancelText;
      this.config.cancelText = updates.cancelText;
    }
  }
  
  /**
   * 设置按钮状态
   * @param {string} buttonType - 'confirm' 或 'cancel'
   * @param {Object} state - 状态对象 {disabled, loading, text}
   */
  setButtonState(buttonType, state) {
    const button = buttonType === 'confirm' ? this.elements.confirmBtn : this.elements.cancelBtn;
    if (!button) return;
    
    // 设置禁用状态
    if (state.disabled !== undefined) {
      button.disabled = state.disabled;
    }
    
    // 设置加载状态
    if (state.loading !== undefined) {
      if (state.loading) {
        button.classList.add('loading');
        button.disabled = true;
      } else {
        button.classList.remove('loading');
        button.disabled = state.disabled || false;
      }
    }
    
    // 设置文本
    if (state.text !== undefined) {
      button.textContent = state.text;
    }
  }
  
  /**
   * 检查对话框是否可见
   * @returns {boolean}
   */
  isVisible() {
    return this.state.isVisible;
  }
  
  /**
   * 获取对话框结果
   * @returns {*}
   */
  getResult() {
    return this.state.result;
  }
  
  /**
   * 销毁对话框
   */
  destroy() {
    if (this.state.isDestroyed) return;
    
    console.log(`🗑️ 销毁对话框组件: ${this.config.type} 🐱`);
    
    // 如果正在显示，先隐藏
    if (this.state.isVisible) {
      this.hide(null, false);
    }
    
    // 清理资源
    this._cleanup();
    
    // 拒绝未解析的Promise
    if (this.resolvers.reject) {
      this.resolvers.reject(new Error('对话框已销毁'));
    }
    
    // 清理状态
    this.state.isDestroyed = true;
    this.resolvers = { resolve: null, reject: null };
    
    console.log('✅ 对话框组件已销毁 🐱');
  }
}

/**
 * 对话框工厂函数 - 快速创建常用对话框
 */
class DialogFactory {
  
  /**
   * 创建确认对话框
   * @param {Object} options
   * @returns {Promise}
   */
  static confirm(options = {}) {
    const dialog = new DialogComponent({
      type: 'confirm',
      title: '确认操作',
      icon: '❓',
      ...options
    });
    
    return dialog.show();
  }
  
  /**
   * 创建警告对话框
   * @param {Object} options
   * @returns {Promise}
   */
  static alert(options = {}) {
    const dialog = new DialogComponent({
      type: 'alert',
      title: '提示',
      icon: 'ℹ️',
      showCancel: false,
      confirmText: '确定',
      ...options
    });
    
    return dialog.show();
  }
  
  /**
   * 创建危险操作确认对话框
   * @param {Object} options
   * @returns {Promise}
   */
  static danger(options = {}) {
    const dialog = new DialogComponent({
      type: 'confirm',
      title: '危险操作',
      icon: '⚠️',
      danger: true,
      confirmText: '确认删除',
      ...options
    });
    
    return dialog.show();
  }
} 