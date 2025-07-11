/**
 * FavoriteBoard - 通知组件
 * 负责：单个通知的显示和交互
 * 
 * @author JupiterTheWarlock
 * @description 单个通知组件，支持各种类型、动画、自动隐藏 🐱
 */

/**
 * 通知组件 - 单个通知的封装
 * 负责通知的渲染、显示、隐藏和交互处理
 */
class NotificationComponent {
  constructor(data, options = {}) {
    this.data = {
      id: data.id || `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type || 'info', // 'info', 'success', 'warning', 'error'
      title: data.title || '',
      message: data.message || '',
      icon: data.icon || null,
      duration: data.duration !== undefined ? data.duration : 3000,
      closable: data.closable !== false,
      clickable: data.clickable !== false,
      actions: data.actions || [],
      data: data.data || {},
      timestamp: data.timestamp || Date.now()
    };
    
    this.options = {
      animationDuration: 300,
      maxWidth: '400px',
      position: 'top-right',
      showProgress: true,
      enableSound: false,
      ...options
    };
    
    // 状态
    this.state = {
      isVisible: false,
      isDestroyed: false,
      isPaused: false,
      timeRemaining: this.data.duration
    };
    
    // DOM元素
    this.elements = {
      container: null,
      icon: null,
      content: null,
      title: null,
      message: null,
      actions: null,
      closeBtn: null,
      progress: null
    };
    
    // 定时器
    this.timers = {
      autoHide: null,
      progress: null
    };
    
    // 事件回调
    this.callbacks = {
      onShow: null,
      onHide: null,
      onClick: null,
      onActionClick: null
    };
    
    console.log(`🔔 通知组件创建: [${this.data.type}] ${this.data.message} 🐱`);
  }
  
  /**
   * 渲染通知
   * @returns {HTMLElement}
   */
  render() {
    if (this.state.isDestroyed) {
      throw new Error('通知已被销毁');
    }
    
    // 创建主容器
    this.elements.container = document.createElement('div');
    this.elements.container.className = this._getNotificationClasses();
    this.elements.container.dataset.notificationId = this.data.id;
    this.elements.container.dataset.notificationType = this.data.type;
    this.elements.container.style.maxWidth = this.options.maxWidth;
    this.elements.container.setAttribute('role', 'alert');
    this.elements.container.setAttribute('aria-live', 'polite');
    
    // 创建图标
    this._createIcon();
    
    // 创建内容
    this._createContent();
    
    // 创建操作按钮
    this._createActions();
    
    // 创建关闭按钮
    this._createCloseButton();
    
    // 创建进度条
    this._createProgressBar();
    
    // 绑定事件
    this._bindEvents();
    
    return this.elements.container;
  }
  
  /**
   * 获取通知CSS类
   * @private
   * @returns {string}
   */
  _getNotificationClasses() {
    const classes = ['notification', `notification-${this.data.type}`];
    
    if (this.data.clickable) {
      classes.push('clickable');
    }
    
    if (this.state.isPaused) {
      classes.push('paused');
    }
    
    return classes.join(' ');
  }
  
  /**
   * 创建图标
   * @private
   */
  _createIcon() {
    this.elements.icon = document.createElement('div');
    this.elements.icon.className = 'notification-icon';
    
    // 设置图标
    const icon = this.data.icon || this._getDefaultIcon();
    if (typeof icon === 'string') {
      this.elements.icon.textContent = icon;
    } else {
      this.elements.icon.appendChild(icon);
    }
    
    this.elements.container.appendChild(this.elements.icon);
  }
  
  /**
   * 获取默认图标
   * @private
   * @returns {string}
   */
  _getDefaultIcon() {
    const iconMap = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    return iconMap[this.data.type] || iconMap.info;
  }
  
  /**
   * 创建内容
   * @private
   */
  _createContent() {
    this.elements.content = document.createElement('div');
    this.elements.content.className = 'notification-content';
    
    // 创建标题
    if (this.data.title) {
      this.elements.title = document.createElement('div');
      this.elements.title.className = 'notification-title';
      this.elements.title.textContent = this.data.title;
      this.elements.content.appendChild(this.elements.title);
    }
    
    // 创建消息
    this.elements.message = document.createElement('div');
    this.elements.message.className = 'notification-message';
    this.elements.message.textContent = this.data.message;
    this.elements.content.appendChild(this.elements.message);
    
    this.elements.container.appendChild(this.elements.content);
  }
  
  /**
   * 创建操作按钮
   * @private
   */
  _createActions() {
    if (!this.data.actions || this.data.actions.length === 0) {
      return;
    }
    
    this.elements.actions = document.createElement('div');
    this.elements.actions.className = 'notification-actions';
    
    this.data.actions.forEach((action, index) => {
      const button = document.createElement('button');
      button.className = `notification-action ${action.className || ''}`;
      button.textContent = action.label;
      button.dataset.actionId = action.id;
      button.dataset.actionIndex = index;
      
      if (action.primary) {
        button.classList.add('primary');
      }
      
      // 绑定点击事件
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleActionClick(action, index);
      });
      
      this.elements.actions.appendChild(button);
    });
    
    this.elements.container.appendChild(this.elements.actions);
  }
  
  /**
   * 创建关闭按钮
   * @private
   */
  _createCloseButton() {
    if (!this.data.closable) {
      return;
    }
    
    this.elements.closeBtn = document.createElement('button');
    this.elements.closeBtn.className = 'notification-close';
    this.elements.closeBtn.innerHTML = '×';
    this.elements.closeBtn.setAttribute('aria-label', '关闭通知');
    
    this.elements.container.appendChild(this.elements.closeBtn);
  }
  
  /**
   * 创建进度条
   * @private
   */
  _createProgressBar() {
    if (!this.options.showProgress || this.data.duration <= 0) {
      return;
    }
    
    this.elements.progress = document.createElement('div');
    this.elements.progress.className = 'notification-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'notification-progress-bar';
    this.elements.progress.appendChild(progressBar);
    
    this.elements.container.appendChild(this.elements.progress);
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    // 关闭按钮事件
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });
    }
    
    // 点击事件
    if (this.data.clickable) {
      this.elements.container.addEventListener('click', () => {
        this._handleClick();
      });
    }
    
    // 鼠标悬停事件（暂停/恢复自动隐藏）
    this.elements.container.addEventListener('mouseenter', () => {
      this._pauseAutoHide();
    });
    
    this.elements.container.addEventListener('mouseleave', () => {
      this._resumeAutoHide();
    });
    
    // 阻止右键菜单
    this.elements.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  
  /**
   * 显示通知
   * @param {HTMLElement} container - 通知容器
   */
  show(container) {
    if (this.state.isVisible || this.state.isDestroyed) {
      return;
    }
    
    console.log(`🔔 显示通知: [${this.data.type}] ${this.data.message} 🐱`);
    
    // 添加到容器
    if (container) {
      container.appendChild(this.elements.container);
    } else {
      document.body.appendChild(this.elements.container);
    }
    
    // 设置初始样式
    this.elements.container.style.opacity = '0';
    this.elements.container.style.transform = this._getInitialTransform();
    
    // 触发显示动画
    requestAnimationFrame(() => {
      this.elements.container.style.transition = `opacity ${this.options.animationDuration}ms ease, transform ${this.options.animationDuration}ms ease`;
      this.elements.container.style.opacity = '1';
      this.elements.container.style.transform = 'translateX(0) scale(1)';
    });
    
    // 更新状态
    this.state.isVisible = true;
    this.state.timeRemaining = this.data.duration;
    
    // 播放声音
    if (this.options.enableSound) {
      this._playSound();
    }
    
    // 启动自动隐藏
    this._startAutoHide();
    
    // 启动进度条
    this._startProgress();
    
    // 执行回调
    if (this.callbacks.onShow) {
      this.callbacks.onShow(this);
    }
  }
  
  /**
   * 隐藏通知
   */
  hide() {
    if (!this.state.isVisible) {
      return;
    }
    
    console.log(`🔔 隐藏通知: [${this.data.type}] ${this.data.message} 🐱`);
    
    // 停止定时器
    this._stopTimers();
    
    // 隐藏动画
    this.elements.container.style.opacity = '0';
    this.elements.container.style.transform = this._getHideTransform();
    
    // 动画完成后移除
    setTimeout(() => {
      this._cleanup();
    }, this.options.animationDuration);
    
    // 更新状态
    this.state.isVisible = false;
    
    // 执行回调
    if (this.callbacks.onHide) {
      this.callbacks.onHide(this);
    }
  }
  
  /**
   * 获取初始变换
   * @private
   * @returns {string}
   */
  _getInitialTransform() {
    const position = this.options.position;
    
    if (position.includes('right')) {
      return 'translateX(100%) scale(0.95)';
    } else if (position.includes('left')) {
      return 'translateX(-100%) scale(0.95)';
    } else if (position.includes('top')) {
      return 'translateY(-100%) scale(0.95)';
    } else {
      return 'translateY(100%) scale(0.95)';
    }
  }
  
  /**
   * 获取隐藏变换
   * @private
   * @returns {string}
   */
  _getHideTransform() {
    const position = this.options.position;
    
    if (position.includes('right')) {
      return 'translateX(100%) scale(0.95)';
    } else if (position.includes('left')) {
      return 'translateX(-100%) scale(0.95)';
    } else {
      return 'translateY(-20px) scale(0.95)';
    }
  }
  
  /**
   * 启动自动隐藏
   * @private
   */
  _startAutoHide() {
    if (this.data.duration <= 0) {
      return;
    }
    
    this.timers.autoHide = setTimeout(() => {
      this.hide();
    }, this.data.duration);
  }
  
  /**
   * 暂停自动隐藏
   * @private
   */
  _pauseAutoHide() {
    if (this.data.duration <= 0 || this.state.isPaused) {
      return;
    }
    
    this.state.isPaused = true;
    
    // 清除定时器
    if (this.timers.autoHide) {
      clearTimeout(this.timers.autoHide);
      this.timers.autoHide = null;
    }
    
    // 暂停进度条
    this._pauseProgress();
  }
  
  /**
   * 恢复自动隐藏
   * @private
   */
  _resumeAutoHide() {
    if (this.data.duration <= 0 || !this.state.isPaused) {
      return;
    }
    
    this.state.isPaused = false;
    
    // 恢复定时器
    if (this.state.timeRemaining > 0) {
      this.timers.autoHide = setTimeout(() => {
        this.hide();
      }, this.state.timeRemaining);
    }
    
    // 恢复进度条
    this._resumeProgress();
  }
  
  /**
   * 启动进度条
   * @private
   */
  _startProgress() {
    if (!this.elements.progress || this.data.duration <= 0) {
      return;
    }
    
    const progressBar = this.elements.progress.querySelector('.notification-progress-bar');
    if (!progressBar) return;
    
    // 设置动画
    progressBar.style.transition = `width ${this.data.duration}ms linear`;
    progressBar.style.width = '0%';
    
    // 更新剩余时间
    const startTime = Date.now();
    this.timers.progress = setInterval(() => {
      if (this.state.isPaused) return;
      
      const elapsed = Date.now() - startTime;
      this.state.timeRemaining = Math.max(0, this.data.duration - elapsed);
      
      if (this.state.timeRemaining <= 0) {
        clearInterval(this.timers.progress);
        this.timers.progress = null;
      }
    }, 100);
  }
  
  /**
   * 暂停进度条
   * @private
   */
  _pauseProgress() {
    const progressBar = this.elements.progress?.querySelector('.notification-progress-bar');
    if (progressBar) {
      // 获取当前进度
      const computedStyle = window.getComputedStyle(progressBar);
      const currentWidth = computedStyle.width;
      
      // 停止动画
      progressBar.style.transition = 'none';
      progressBar.style.width = currentWidth;
    }
  }
  
  /**
   * 恢复进度条
   * @private
   */
  _resumeProgress() {
    const progressBar = this.elements.progress?.querySelector('.notification-progress-bar');
    if (progressBar && this.state.timeRemaining > 0) {
      // 恢复动画
      progressBar.style.transition = `width ${this.state.timeRemaining}ms linear`;
      progressBar.style.width = '0%';
    }
  }
  
  /**
   * 处理点击事件
   * @private
   */
  _handleClick() {
    console.log(`🔔 通知点击: [${this.data.type}] ${this.data.message} 🐱`);
    
    if (this.callbacks.onClick) {
      this.callbacks.onClick(this);
    }
  }
  
  /**
   * 处理操作按钮点击
   * @private
   * @param {Object} action
   * @param {number} index
   */
  _handleActionClick(action, index) {
    console.log(`🔔 通知操作点击: ${action.id} 🐱`);
    
    if (this.callbacks.onActionClick) {
      this.callbacks.onActionClick(action, index, this);
    }
    
    // 执行操作回调
    if (typeof action.handler === 'function') {
      try {
        const result = action.handler(this, action);
        
        // 如果返回false，不自动隐藏
        if (result !== false && action.autoClose !== false) {
          this.hide();
        }
      } catch (error) {
        console.error('❌ 通知操作处理失败:', error);
      }
    } else if (action.autoClose !== false) {
      this.hide();
    }
  }
  
  /**
   * 播放通知声音
   * @private
   */
  _playSound() {
    // 这里可以根据通知类型播放不同的声音
    try {
      // 创建音频上下文（如果支持）
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioCtx = AudioContext || webkitAudioContext;
        const audioCtx = new AudioCtx();
        
        // 生成简单的提示音
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (error) {
      console.warn('⚠️ 播放通知声音失败:', error);
    }
  }
  
  /**
   * 停止所有定时器
   * @private
   */
  _stopTimers() {
    if (this.timers.autoHide) {
      clearTimeout(this.timers.autoHide);
      this.timers.autoHide = null;
    }
    
    if (this.timers.progress) {
      clearInterval(this.timers.progress);
      this.timers.progress = null;
    }
  }
  
  /**
   * 清理资源
   * @private
   */
  _cleanup() {
    // 停止定时器
    this._stopTimers();
    
    // 移除DOM元素
    if (this.elements.container && this.elements.container.parentNode) {
      this.elements.container.parentNode.removeChild(this.elements.container);
    }
    
    // 清理引用
    Object.keys(this.elements).forEach(key => {
      this.elements[key] = null;
    });
  }
  
  /**
   * 更新通知内容
   * @param {Object} updates
   */
  updateContent(updates) {
    if (this.state.isDestroyed) return;
    
    // 更新数据
    Object.assign(this.data, updates);
    
    // 更新标题
    if (updates.title !== undefined && this.elements.title) {
      this.elements.title.textContent = updates.title;
    }
    
    // 更新消息
    if (updates.message !== undefined && this.elements.message) {
      this.elements.message.textContent = updates.message;
    }
    
    // 更新图标
    if (updates.icon !== undefined && this.elements.icon) {
      const icon = updates.icon || this._getDefaultIcon();
      if (typeof icon === 'string') {
        this.elements.icon.textContent = icon;
      } else {
        this.elements.icon.innerHTML = '';
        this.elements.icon.appendChild(icon);
      }
    }
    
    // 更新类型
    if (updates.type !== undefined) {
      this.elements.container.className = this._getNotificationClasses();
      this.elements.container.dataset.notificationType = updates.type;
    }
  }
  
  /**
   * 延长显示时间
   * @param {number} additionalTime - 额外时间（毫秒）
   */
  extendDuration(additionalTime) {
    if (this.data.duration <= 0) return;
    
    this.state.timeRemaining += additionalTime;
    
    // 重新启动定时器
    if (this.timers.autoHide) {
      clearTimeout(this.timers.autoHide);
      this.timers.autoHide = setTimeout(() => {
        this.hide();
      }, this.state.timeRemaining);
    }
  }
  
  /**
   * 设置事件回调
   * @param {string} eventName
   * @param {Function} callback
   */
  on(eventName, callback) {
    if (this.callbacks.hasOwnProperty(`on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`)) {
      this.callbacks[`on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`] = callback;
    }
  }
  
  /**
   * 获取通知数据
   * @returns {Object}
   */
  getData() {
    return { ...this.data };
  }
  
  /**
   * 获取DOM元素
   * @returns {HTMLElement}
   */
  getElement() {
    return this.elements.container;
  }
  
  /**
   * 检查是否可见
   * @returns {boolean}
   */
  isVisible() {
    return this.state.isVisible;
  }
  
  /**
   * 检查是否暂停
   * @returns {boolean}
   */
  isPaused() {
    return this.state.isPaused;
  }
  
  /**
   * 获取剩余时间
   * @returns {number}
   */
  getTimeRemaining() {
    return this.state.timeRemaining;
  }
  
  /**
   * 销毁通知
   */
  destroy() {
    if (this.state.isDestroyed) return;
    
    console.log(`🗑️ 销毁通知组件: [${this.data.type}] ${this.data.message} 🐱`);
    
    // 如果正在显示，先隐藏
    if (this.state.isVisible) {
      this.hide();
    } else {
      this._cleanup();
    }
    
    // 标记为已销毁
    this.state.isDestroyed = true;
    
    // 清理回调
    this.callbacks = {};
    
    console.log('✅ 通知组件已销毁 🐱');
  }
} 