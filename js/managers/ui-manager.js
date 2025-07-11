/**
 * FavoriteBoard - UI管理器
 * 负责：UI状态管理、布局管理、响应式逻辑
 * 
 * @author JupiterTheWarlock
 * @description 管理应用的UI状态、加载状态、错误状态和通知系统 🐱
 */

/**
 * UI管理器 - UI状态管理中心
 * 提供UI状态管理、布局控制、响应式处理等功能
 */
class UIManager {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.appConfig = null;
    
    // UI状态
    this.state = this.createInitialState();
    
    // UI元素缓存
    this.elements = {
      // 主容器
      app: null,
      sidebar: null,
      mainContent: null,
      
      // 加载相关
      loadingOverlay: null,
      loadingSpinner: null,
      loadingText: null,
      
      // 搜索相关
      searchBar: null,
      searchInput: null,
      searchClearBtn: null,
      
      // 文件夹树
      folderTree: null,
      categoryInfo: null,
      
      // 内容区域
      linksGrid: null,
      emptyState: null,
      
      // 通知容器
      notificationContainer: null
    };
    
    // 通知队列
    this.notifications = [];
    this.maxNotifications = 5;
    
    // 响应式断点
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    };
    
    // 当前设备类型
    this.currentDevice = 'desktop';
    
    // 状态监听器
    this.stateListeners = [];
    
    console.log('🎨 UI管理器初始化 🐱');
  }
  
  /**
   * 创建初始UI状态
   * @private
   * @returns {Object}
   */
  createInitialState() {
    return {
      // 加载状态
      isLoading: false,
      loadingText: '加载中...',
      loadingProgress: 0,
      
      // 错误状态
      hasError: false,
      errorMessage: null,
      errorDetails: null,
      
      // UI显示状态
      sidebarVisible: true,
      searchBarVisible: true,
      folderTreeVisible: true,
      
      // 主题和外观
      theme: 'auto',
      compactMode: false,
      animations: true,
      
      // 响应式状态
      deviceType: 'desktop',
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      
      // 通知状态
      notificationsEnabled: true,
      notificationPosition: 'top-right',
      
      // 其他UI状态
      lastInteraction: Date.now(),
      isInitialized: false
    };
  }
  
  /**
   * 初始化UI管理器
   */
  async init() {
    try {
      console.log('🚀 UI管理器开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.appConfig = this.container.get('appConfig');
      
      // 应用配置
      this._applyConfig();
      
      // 缓存UI元素
      this._cacheUIElements();
      
      // 检测设备类型
      this._detectDevice();
      
      // 创建通知容器
      this._createNotificationContainer();
      
      // 绑定事件
      this._bindEvents();
      
      // 设置初始UI状态
      this._setInitialUIState();
      
      // 标记为已初始化
      this._updateState({ isInitialized: true });
      
      console.log('✅ UI管理器初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ UI管理器初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 应用配置
   * @private
   */
  _applyConfig() {
    if (this.appConfig) {
      // 获取UI配置
      const uiConfig = this.appConfig.ui || {};
      const notificationConfig = this.appConfig.notifications || {};
      
      // 更新断点
      if (uiConfig.responsiveBreakpoints) {
        this.breakpoints = { ...this.breakpoints, ...uiConfig.responsiveBreakpoints };
      }
      
      // 更新通知配置
      this.maxNotifications = notificationConfig.maxVisible || 5;
      
      // 更新状态
      this._updateState({
        theme: uiConfig.theme || 'auto',
        compactMode: uiConfig.compactMode || false,
        animations: uiConfig.animations !== false,
        notificationsEnabled: notificationConfig.enabled !== false,
        notificationPosition: notificationConfig.position || 'top-right'
      });
    }
  }
  
  /**
   * 缓存UI元素
   * @private
   */
  _cacheUIElements() {
    this.elements = {
      // 主容器
      app: document.querySelector('.app') || document.body,
      sidebar: document.querySelector('.sidebar'),
      mainContent: document.querySelector('.main-content'),
      
      // 加载相关
      loadingOverlay: document.getElementById('loadingOverlay'),
      loadingSpinner: document.querySelector('.loading-spinner'),
      loadingText: document.querySelector('.loading-text'),
      
      // 搜索相关
      searchBar: document.getElementById('searchBar'),
      searchInput: document.getElementById('searchInput'),
      searchClearBtn: document.querySelector('.search-clear'),
      
      // 文件夹树
      folderTree: document.getElementById('folderTree'),
      categoryInfo: document.getElementById('categoryInfo'),
      
      // 内容区域
      linksGrid: document.getElementById('linksGrid'),
      emptyState: document.getElementById('emptyState'),
      
      // 通知容器（将创建）
      notificationContainer: null
    };
    
    console.log('📋 UI元素缓存完成 🐱');
  }
  
  /**
   * 检测设备类型
   * @private
   */
  _detectDevice() {
    const width = window.innerWidth;
    let deviceType = 'desktop';
    
    if (width <= this.breakpoints.mobile) {
      deviceType = 'mobile';
    } else if (width <= this.breakpoints.tablet) {
      deviceType = 'tablet';
    }
    
    if (deviceType !== this.currentDevice) {
      this.currentDevice = deviceType;
      this._updateState({ 
        deviceType,
        screenWidth: width,
        screenHeight: window.innerHeight
      });
      
      // 应用响应式样式
      this._applyResponsiveStyles();
      
      // 发布设备类型变化事件
      this.eventManager?.emit('ui:deviceChanged', {
        deviceType,
        previousDevice: this.currentDevice,
        width,
        height: window.innerHeight
      });
    }
  }
  
  /**
   * 应用响应式样式
   * @private
   */
  _applyResponsiveStyles() {
    const { app } = this.elements;
    if (!app) return;
    
    // 移除旧的设备类名
    app.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
    
    // 添加新的设备类名
    app.classList.add(`device-${this.currentDevice}`);
    
    // 根据设备类型调整UI
    if (this.currentDevice === 'mobile') {
      this._updateState({ 
        sidebarVisible: false,
        compactMode: true
      });
    } else if (this.currentDevice === 'tablet') {
      this._updateState({ 
        sidebarVisible: true,
        compactMode: true
      });
    } else {
      this._updateState({ 
        sidebarVisible: true,
        compactMode: this.appConfig?.get('ui.compactMode', false)
      });
    }
  }
  
  /**
   * 创建通知容器
   * @private
   */
  _createNotificationContainer() {
    if (this.elements.notificationContainer) return;
    
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = `notification-container position-${this.state.notificationPosition}`;
    
    document.body.appendChild(container);
    this.elements.notificationContainer = container;
    
    console.log('🔔 通知容器创建完成 🐱');
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.eventManager) return;
    
    // 监听加载状态事件
    this.eventManager.on('ui:showLoading', (data) => {
      this.showLoadingState(data.text, data.progress);
    });
    
    this.eventManager.on('ui:hideLoading', () => {
      this.hideLoadingState();
    });
    
    // 监听错误状态事件
    this.eventManager.on('ui:showError', (data) => {
      this.showErrorState(data.error, data.details);
    });
    
    this.eventManager.on('ui:hideError', () => {
      this.hideErrorState();
    });
    
    // 监听通知事件
    this.eventManager.on('notification:show', (data) => {
      this.showNotification(data.message, data.type, data.duration);
    });
    
    // 监听配置更改
    this.eventManager.on('config:changed', (data) => {
      if (data.path && data.path.startsWith('ui.')) {
        this._handleConfigChange(data);
      }
    });
    
    // 监听窗口大小变化
    window.addEventListener('resize', this._handleWindowResize.bind(this));
    
    // 监听用户交互
    this._bindInteractionEvents();
  }
  
  /**
   * 绑定用户交互事件
   * @private
   */
  _bindInteractionEvents() {
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    
    for (const event of events) {
      document.addEventListener(event, () => {
        this._updateState({ lastInteraction: Date.now() });
      }, { passive: true });
    }
  }
  
  /**
   * 处理窗口大小变化
   * @private
   */
  _handleWindowResize() {
    // 防抖处理
    clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(() => {
      this._detectDevice();
    }, 100);
  }
  
  /**
   * 处理配置更改
   * @private
   * @param {Object} data
   */
  _handleConfigChange(data) {
    const { path, value } = data;
    
    switch (path) {
      case 'ui.theme':
        this._updateState({ theme: value });
        this._applyTheme();
        break;
      case 'ui.compactMode':
        this._updateState({ compactMode: value });
        this._applyCompactMode();
        break;
      case 'ui.animations':
        this._updateState({ animations: value });
        this._applyAnimations();
        break;
      case 'notifications.enabled':
        this._updateState({ notificationsEnabled: value });
        break;
      case 'notifications.position':
        this._updateState({ notificationPosition: value });
        this._updateNotificationPosition();
        break;
    }
  }
  
  /**
   * 设置初始UI状态
   * @private
   */
  _setInitialUIState() {
    this._applyTheme();
    this._applyCompactMode();
    this._applyAnimations();
  }
  
  /**
   * 应用主题
   * @private
   */
  _applyTheme() {
    const { app } = this.elements;
    if (!app) return;
    
    // 移除旧主题类
    app.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    // 添加新主题类
    app.classList.add(`theme-${this.state.theme}`);
    
    // 如果是自动主题，检测系统偏好
    if (this.state.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      app.classList.toggle('dark-mode', prefersDark);
    }
  }
  
  /**
   * 应用紧凑模式
   * @private
   */
  _applyCompactMode() {
    const { app } = this.elements;
    if (!app) return;
    
    app.classList.toggle('compact-mode', this.state.compactMode);
  }
  
  /**
   * 应用动画设置
   * @private
   */
  _applyAnimations() {
    const { app } = this.elements;
    if (!app) return;
    
    app.classList.toggle('no-animations', !this.state.animations);
  }
  
  /**
   * 更新通知容器位置
   * @private
   */
  _updateNotificationPosition() {
    const { notificationContainer } = this.elements;
    if (!notificationContainer) return;
    
    notificationContainer.className = `notification-container position-${this.state.notificationPosition}`;
  }
  
  /**
   * 显示加载状态
   * @param {string} text - 加载文本
   * @param {number} progress - 加载进度(0-100)
   */
  showLoadingState(text = '加载中...', progress = 0) {
    this._updateState({
      isLoading: true,
      loadingText: text,
      loadingProgress: progress
    });
    
    const { loadingOverlay, loadingText: textElement } = this.elements;
    
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
      loadingOverlay.classList.add('active');
    }
    
    if (textElement) {
      textElement.textContent = text;
    }
    
    // 发布加载状态事件
    this.eventManager?.emit('ui:loadingStateChanged', {
      isLoading: true,
      text,
      progress
    });
    
    console.log(`⏳ 显示加载状态: ${text} (${progress}%) 🐱`);
  }
  
  /**
   * 隐藏加载状态
   */
  hideLoadingState() {
    this._updateState({
      isLoading: false,
      loadingProgress: 100
    });
    
    const { loadingOverlay } = this.elements;
    
    if (loadingOverlay) {
      loadingOverlay.classList.remove('active');
      
      // 延迟隐藏，等待动画完成
      setTimeout(() => {
        if (!this.state.isLoading) {
          loadingOverlay.style.display = 'none';
        }
      }, 300);
    }
    
    // 发布加载状态事件
    this.eventManager?.emit('ui:loadingStateChanged', {
      isLoading: false,
      progress: 100
    });
    
    console.log('✅ 隐藏加载状态 🐱');
  }
  
  /**
   * 显示错误状态
   * @param {Error|string} error - 错误对象或错误消息
   * @param {Object} details - 错误详情
   */
  showErrorState(error, details = null) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    this._updateState({
      hasError: true,
      errorMessage,
      errorDetails: details
    });
    
    // 显示错误通知
    this.showNotification(errorMessage, 'error', 0); // 持续显示
    
    // 发布错误状态事件
    this.eventManager?.emit('ui:errorStateChanged', {
      hasError: true,
      errorMessage,
      errorDetails: details
    });
    
    console.error('❌ 显示错误状态:', errorMessage, '🐱');
  }
  
  /**
   * 隐藏错误状态
   */
  hideErrorState() {
    this._updateState({
      hasError: false,
      errorMessage: null,
      errorDetails: null
    });
    
    // 发布错误状态事件
    this.eventManager?.emit('ui:errorStateChanged', {
      hasError: false
    });
    
    console.log('✅ 隐藏错误状态 🐱');
  }
  
  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型 ('info', 'success', 'warning', 'error')
   * @param {number} duration - 显示时长(毫秒)，0表示不自动隐藏
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (!this.state.notificationsEnabled) {
      console.log('🔔 通知已禁用，跳过显示 🐱');
      return;
    }
    
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration,
      timestamp: Date.now(),
      element: null
    };
    
    // 创建通知元素
    const element = this._createNotificationElement(notification);
    notification.element = element;
    
    // 添加到队列
    this.notifications.push(notification);
    
    // 限制通知数量
    while (this.notifications.length > this.maxNotifications) {
      const oldNotification = this.notifications.shift();
      if (oldNotification.element) {
        this._removeNotificationElement(oldNotification.element);
      }
    }
    
    // 添加到容器
    if (this.elements.notificationContainer) {
      this.elements.notificationContainer.appendChild(element);
    }
    
    // 设置自动隐藏
    if (duration > 0) {
      setTimeout(() => {
        this._hideNotification(notification.id);
      }, duration);
    }
    
    // 发布通知事件
    this.eventManager?.emit('ui:notificationShown', {
      id: notification.id,
      message,
      type,
      duration
    });
    
    console.log(`🔔 显示通知: [${type}] ${message} 🐱`);
  }
  
  /**
   * 创建通知元素
   * @private
   * @param {Object} notification
   * @returns {HTMLElement}
   */
  _createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    element.dataset.notificationId = notification.id;
    
    // 创建内容
    element.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this._getNotificationIcon(notification.type)}</span>
        <span class="notification-message">${this._escapeHtml(notification.message)}</span>
        <button class="notification-close" aria-label="关闭">×</button>
      </div>
    `;
    
    // 绑定关闭事件
    const closeBtn = element.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this._hideNotification(notification.id);
    });
    
    // 添加动画类
    setTimeout(() => {
      element.classList.add('show');
    }, 10);
    
    return element;
  }
  
  /**
   * 获取通知图标
   * @private
   * @param {string} type
   * @returns {string}
   */
  _getNotificationIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || icons.info;
  }
  
  /**
   * 转义HTML
   * @private
   * @param {string} str
   * @returns {string}
   */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  /**
   * 隐藏通知
   * @private
   * @param {string} notificationId
   */
  _hideNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return;
    
    const notification = this.notifications[index];
    if (notification.element) {
      this._removeNotificationElement(notification.element);
    }
    
    this.notifications.splice(index, 1);
    
    // 发布通知隐藏事件
    this.eventManager?.emit('ui:notificationHidden', {
      id: notificationId
    });
  }
  
  /**
   * 移除通知元素
   * @private
   * @param {HTMLElement} element
   */
  _removeNotificationElement(element) {
    element.classList.remove('show');
    element.classList.add('hide');
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }
  
  /**
   * 更新状态
   * @private
   * @param {Object} updates
   */
  _updateState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // 通知状态监听器
    for (const listener of this.stateListeners) {
      try {
        listener(this.state, oldState, updates);
      } catch (error) {
        console.error('❌ UI状态监听器错误:', error);
      }
    }
    
    // 发布状态更新事件
    if (this.eventManager) {
      this.eventManager.emit('ui:stateChanged', {
        newState: this.state,
        oldState,
        updates,
        timestamp: Date.now()
      });
    }
  }
  
  // ==================== 公共API ====================
  
  /**
   * 获取当前UI状态
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * 切换侧边栏显示状态
   * @returns {boolean} 新的显示状态
   */
  toggleSidebar() {
    const newState = !this.state.sidebarVisible;
    this._updateState({ sidebarVisible: newState });
    
    const { sidebar } = this.elements;
    if (sidebar) {
      sidebar.classList.toggle('hidden', !newState);
    }
    
    this.eventManager?.emit('ui:sidebarToggled', { visible: newState });
    
    return newState;
  }
  
  /**
   * 设置主题
   * @param {string} theme - 主题名称 ('light', 'dark', 'auto')
   */
  setTheme(theme) {
    if (['light', 'dark', 'auto'].includes(theme)) {
      this._updateState({ theme });
      this._applyTheme();
      
      // 保存配置
      this.appConfig?.set('ui.theme', theme);
    }
  }
  
  /**
   * 设置紧凑模式
   * @param {boolean} enabled
   */
  setCompactMode(enabled) {
    this._updateState({ compactMode: enabled });
    this._applyCompactMode();
    
    // 保存配置
    this.appConfig?.set('ui.compactMode', enabled);
  }
  
  /**
   * 获取当前设备类型
   * @returns {string}
   */
  getDeviceType() {
    return this.currentDevice;
  }
  
  /**
   * 添加状态监听器
   * @param {Function} listener
   * @returns {Function} 取消监听的函数
   */
  addStateListener(listener) {
    if (typeof listener === 'function') {
      this.stateListeners.push(listener);
      
      return () => {
        const index = this.stateListeners.indexOf(listener);
        if (index !== -1) {
          this.stateListeners.splice(index, 1);
        }
      };
    }
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('🎨 UI管理器开始销毁 🐱');
    
    // 清理事件监听器
    window.removeEventListener('resize', this._handleWindowResize);
    
    // 清理通知
    this.notifications.length = 0;
    if (this.elements.notificationContainer) {
      this.elements.notificationContainer.remove();
    }
    
    // 清理状态监听器
    this.stateListeners.length = 0;
    
    // 重置状态
    this.state = this.createInitialState();
    
    console.log('🎨 UI管理器销毁完成 🐱');
  }
}

// 导出UI管理器类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = UIManager;
} else {
  // 浏览器环境
  window.UIManager = UIManager;
} 