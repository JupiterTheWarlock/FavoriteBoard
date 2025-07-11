/**
 * FavoriteBoard - 通知服务
 * 负责：统一通知管理、通知队列、通知历史
 * 
 * @author JupiterTheWarlock
 * @description 提供统一的通知管理，支持各种通知类型和通知队列 🐱
 */

/**
 * 通知服务 - 通知管理中心
 * 提供统一的通知接口和高级通知功能
 */
class NotificationService {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.appConfig = null;
    this.uiManager = null;
    
    // 通知配置
    this.config = {
      enabled: true,
      defaultDuration: 3000,
      maxVisible: 5,
      position: 'top-right',
      animations: true,
      sound: false,
      enableHistory: true,
      maxHistorySize: 100,
      enableGrouping: true,
      groupTimeout: 5000
    };
    
    // 通知队列和状态
    this.notifications = new Map(); // Map<id, notification>
    this.notificationQueue = [];
    this.visibleNotifications = [];
    this.notificationHistory = [];
    
    // 通知容器
    this.container = null;
    
    // 通知类型配置
    this.notificationTypes = {
      info: {
        icon: 'ℹ️',
        className: 'notification-info',
        defaultDuration: 3000,
        sound: null
      },
      success: {
        icon: '✅',
        className: 'notification-success',
        defaultDuration: 3000,
        sound: null
      },
      warning: {
        icon: '⚠️',
        className: 'notification-warning',
        defaultDuration: 5000,
        sound: null
      },
      error: {
        icon: '❌',
        className: 'notification-error',
        defaultDuration: 0, // 错误通知默认不自动消失
        sound: null
      },
      loading: {
        icon: '⏳',
        className: 'notification-loading',
        defaultDuration: 0, // 加载通知需要手动关闭
        sound: null
      }
    };
    
    // 分组通知
    this.notificationGroups = new Map();
    
    // 通知计数器
    this.notificationCounter = 0;
    
    console.log('🔔 通知服务初始化 🐱');
  }
  
  /**
   * 初始化通知服务
   */
  async init() {
    try {
      console.log('🚀 通知服务开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.appConfig = this.container.get('appConfig');
      this.uiManager = this.container.get('uiManager');
      
      // 应用配置
      this._applyConfig();
      
      // 创建通知容器
      this._createNotificationContainer();
      
      // 加载通知历史
      this._loadNotificationHistory();
      
      // 绑定事件
      this._bindEvents();
      
      console.log('✅ 通知服务初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ 通知服务初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 应用配置
   * @private
   */
  _applyConfig() {
    if (this.appConfig && this.appConfig.notifications) {
      this.config = { ...this.config, ...this.appConfig.notifications };
    }
  }
  
  /**
   * 创建通知容器
   * @private
   */
  _createNotificationContainer() {
    // 检查是否已存在
    this.notificationContainer = document.getElementById('notificationContainer');
    
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notificationContainer';
      this.notificationContainer.className = `notification-container position-${this.config.position}`;
      
      document.body.appendChild(this.notificationContainer);
      console.log('🔔 通知容器创建完成 🐱');
    }
    
    this._updateContainerPosition();
  }
  
  /**
   * 更新容器位置
   * @private
   */
  _updateContainerPosition() {
    if (this.notificationContainer) {
      this.notificationContainer.className = `notification-container position-${this.config.position}`;
    }
  }
  
  /**
   * 加载通知历史
   * @private
   */
  _loadNotificationHistory() {
    try {
      if (this.config.enableHistory && typeof localStorage !== 'undefined') {
        const historyData = localStorage.getItem('favoriteBoard_notificationHistory');
        if (historyData) {
          this.notificationHistory = JSON.parse(historyData);
          console.log(`🔔 通知历史加载成功: ${this.notificationHistory.length} 条 🐱`);
        }
      }
    } catch (error) {
      console.warn('⚠️ 通知历史加载失败:', error);
      this.notificationHistory = [];
    }
  }
  
  /**
   * 保存通知历史
   * @private
   */
  _saveNotificationHistory() {
    try {
      if (this.config.enableHistory && typeof localStorage !== 'undefined') {
        localStorage.setItem('favoriteBoard_notificationHistory', JSON.stringify(this.notificationHistory));
      }
    } catch (error) {
      console.warn('⚠️ 通知历史保存失败:', error);
    }
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.eventManager) return;
    
    // 监听通知显示请求
    this.eventManager.on('notification:show', (data) => {
      console.log('🔔 接收到通知显示请求 🐱', data);
      this.show(data.message, data.type, data.duration, data.options);
    });
    
    // 监听通知隐藏请求
    this.eventManager.on('notification:hide', (data) => {
      console.log('🔔 接收到通知隐藏请求 🐱', data);
      this.hide(data.id);
    });
    
    // 监听通知清空请求
    this.eventManager.on('notification:clear', () => {
      console.log('🔔 接收到通知清空请求 🐱');
      this.clearAll();
    });
    
    // 监听配置更改
    this.eventManager.on('config:changed', (data) => {
      if (data.path && data.path.startsWith('notifications.')) {
        console.log('⚙️ 通知相关配置更改，重新应用配置 🐱');
        this._applyConfig();
        this._updateContainerPosition();
      }
    });
  }
  
  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型
   * @param {number} duration - 显示时长（毫秒），0表示不自动隐藏
   * @param {Object} options - 额外选项
   * @returns {string} 通知ID
   */
  show(message, type = 'info', duration = null, options = {}) {
    if (!this.config.enabled) {
      console.log('🔔 通知已禁用，跳过显示 🐱');
      return null;
    }
    
    // 创建通知对象
    const notification = this._createNotification(message, type, duration, options);
    
    // 检查分组
    if (this.config.enableGrouping && options.group) {
      const grouped = this._handleGroupedNotification(notification, options);
      if (grouped) return grouped.id;
    }
    
    // 添加到队列
    this.notifications.set(notification.id, notification);
    this.notificationQueue.push(notification);
    
    // 处理队列
    this._processQueue();
    
    // 添加到历史
    this._addToHistory(notification);
    
    // 发布通知显示事件
    this.eventManager.emit('notification:shown', {
      id: notification.id,
      message,
      type,
      timestamp: Date.now()
    });
    
    console.log(`🔔 显示通知: [${type}] ${message} 🐱`);
    
    return notification.id;
  }
  
  /**
   * 创建通知对象
   * @private
   * @param {string} message
   * @param {string} type
   * @param {number} duration
   * @param {Object} options
   * @returns {Object}
   */
  _createNotification(message, type, duration, options) {
    const typeConfig = this.notificationTypes[type] || this.notificationTypes.info;
    const id = `notification_${++this.notificationCounter}`;
    
    return {
      id,
      message: this._sanitizeMessage(message),
      type,
      duration: duration !== null ? duration : (options.duration || typeConfig.defaultDuration || this.config.defaultDuration),
      icon: options.icon || typeConfig.icon,
      className: options.className || typeConfig.className,
      timestamp: Date.now(),
      element: null,
      timeoutId: null,
      clickable: options.clickable !== false,
      closable: options.closable !== false,
      persistent: options.persistent || false,
      actions: options.actions || [],
      data: options.data || {}
    };
  }
  
  /**
   * 处理分组通知
   * @private
   * @param {Object} notification
   * @param {Object} options
   * @returns {Object|null}
   */
  _handleGroupedNotification(notification, options) {
    const groupKey = options.group;
    const existingGroup = this.notificationGroups.get(groupKey);
    
    if (existingGroup) {
      // 更新现有分组通知
      existingGroup.count++;
      existingGroup.lastMessage = notification.message;
      existingGroup.timestamp = notification.timestamp;
      
      // 更新显示
      this._updateGroupedNotificationElement(existingGroup);
      
      return existingGroup;
    } else {
      // 创建新的分组通知
      const groupedNotification = {
        ...notification,
        isGroup: true,
        groupKey,
        count: 1,
        lastMessage: notification.message
      };
      
      this.notificationGroups.set(groupKey, groupedNotification);
      
      // 设置分组超时
      setTimeout(() => {
        this.notificationGroups.delete(groupKey);
      }, this.config.groupTimeout);
      
      return null; // 让正常流程处理
    }
  }
  
  /**
   * 更新分组通知元素
   * @private
   * @param {Object} groupedNotification
   */
  _updateGroupedNotificationElement(groupedNotification) {
    if (groupedNotification.element) {
      const messageElement = groupedNotification.element.querySelector('.notification-message');
      if (messageElement) {
        const countText = groupedNotification.count > 1 ? ` (${groupedNotification.count})` : '';
        messageElement.textContent = `${groupedNotification.lastMessage}${countText}`;
      }
    }
  }
  
  /**
   * 处理通知队列
   * @private
   */
  _processQueue() {
    // 移除已经不可见的通知
    this.visibleNotifications = this.visibleNotifications.filter(n => 
      n.element && n.element.parentNode
    );
    
    // 检查是否有空间显示新通知
    while (this.notificationQueue.length > 0 && this.visibleNotifications.length < this.config.maxVisible) {
      const notification = this.notificationQueue.shift();
      this._displayNotification(notification);
    }
  }
  
  /**
   * 显示通知
   * @private
   * @param {Object} notification
   */
  _displayNotification(notification) {
    // 创建通知元素
    const element = this._createNotificationElement(notification);
    notification.element = element;
    
    // 添加到容器
    if (this.notificationContainer) {
      this.notificationContainer.appendChild(element);
    }
    
    // 添加到可见列表
    this.visibleNotifications.push(notification);
    
    // 显示动画
    setTimeout(() => {
      element.classList.add('show');
    }, 10);
    
    // 设置自动隐藏
    if (notification.duration > 0 && !notification.persistent) {
      notification.timeoutId = setTimeout(() => {
        this.hide(notification.id);
      }, notification.duration);
    }
    
    // 播放声音
    if (this.config.sound) {
      this._playNotificationSound(notification.type);
    }
  }
  
  /**
   * 创建通知元素
   * @private
   * @param {Object} notification
   * @returns {HTMLElement}
   */
  _createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = `notification ${notification.className}`;
    element.dataset.notificationId = notification.id;
    element.dataset.notificationType = notification.type;
    
    // 创建内容
    let innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${notification.icon}</span>
        <span class="notification-message">${notification.message}</span>
        ${notification.closable ? '<button class="notification-close" aria-label="关闭">×</button>' : ''}
      </div>
    `;
    
    // 添加操作按钮
    if (notification.actions && notification.actions.length > 0) {
      innerHTML += '<div class="notification-actions">';
      for (const action of notification.actions) {
        innerHTML += `<button class="notification-action" data-action="${action.id}">${action.label}</button>`;
      }
      innerHTML += '</div>';
    }
    
    element.innerHTML = innerHTML;
    
    // 绑定事件
    this._bindNotificationEvents(element, notification);
    
    return element;
  }
  
  /**
   * 绑定通知事件
   * @private
   * @param {HTMLElement} element
   * @param {Object} notification
   */
  _bindNotificationEvents(element, notification) {
    // 关闭按钮事件
    const closeBtn = element.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide(notification.id);
      });
    }
    
    // 点击事件
    if (notification.clickable) {
      element.addEventListener('click', () => {
        this.eventManager.emit('notification:clicked', {
          id: notification.id,
          data: notification.data,
          timestamp: Date.now()
        });
      });
    }
    
    // 操作按钮事件
    const actionButtons = element.querySelectorAll('.notification-action');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionId = button.dataset.action;
        
        this.eventManager.emit('notification:actionClicked', {
          notificationId: notification.id,
          actionId,
          data: notification.data,
          timestamp: Date.now()
        });
        
        // 执行操作后隐藏通知
        this.hide(notification.id);
      });
    });
    
    // 鼠标悬停事件（暂停自动隐藏）
    element.addEventListener('mouseenter', () => {
      if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
        notification.timeoutId = null;
      }
    });
    
    element.addEventListener('mouseleave', () => {
      if (notification.duration > 0 && !notification.persistent && !notification.timeoutId) {
        notification.timeoutId = setTimeout(() => {
          this.hide(notification.id);
        }, 1000); // 延迟1秒后隐藏
      }
    });
  }
  
  /**
   * 隐藏通知
   * @param {string} id - 通知ID
   */
  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    // 清除定时器
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
    }
    
    // 隐藏动画
    if (notification.element) {
      notification.element.classList.remove('show');
      notification.element.classList.add('hide');
      
      setTimeout(() => {
        if (notification.element && notification.element.parentNode) {
          notification.element.parentNode.removeChild(notification.element);
        }
      }, 300);
    }
    
    // 从列表中移除
    this.notifications.delete(id);
    this.visibleNotifications = this.visibleNotifications.filter(n => n.id !== id);
    
    // 处理队列
    this._processQueue();
    
    // 发布隐藏事件
    this.eventManager.emit('notification:hidden', {
      id,
      timestamp: Date.now()
    });
    
    console.log(`🔔 隐藏通知: ${id} 🐱`);
  }
  
  /**
   * 清空所有通知
   */
  clearAll() {
    // 隐藏所有可见通知
    for (const notification of this.visibleNotifications) {
      this.hide(notification.id);
    }
    
    // 清空队列
    this.notificationQueue.length = 0;
    
    // 发布清空事件
    this.eventManager.emit('notification:allCleared', {
      timestamp: Date.now()
    });
    
    console.log('🔔 清空所有通知 🐱');
  }
  
  /**
   * 添加到历史
   * @private
   * @param {Object} notification
   */
  _addToHistory(notification) {
    if (!this.config.enableHistory) return;
    
    const historyItem = {
      id: notification.id,
      message: notification.message,
      type: notification.type,
      timestamp: notification.timestamp
    };
    
    this.notificationHistory.unshift(historyItem);
    
    // 限制历史大小
    if (this.notificationHistory.length > this.config.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.config.maxHistorySize);
    }
    
    // 保存历史
    this._saveNotificationHistory();
  }
  
  /**
   * 播放通知声音
   * @private
   * @param {string} type
   */
  _playNotificationSound(type) {
    // 如果浏览器支持音频且用户允许
    if (typeof Audio !== 'undefined') {
      try {
        const typeConfig = this.notificationTypes[type];
        if (typeConfig && typeConfig.sound) {
          const audio = new Audio(typeConfig.sound);
          audio.volume = 0.3;
          audio.play().catch(error => {
            console.warn('⚠️ 通知声音播放失败:', error);
          });
        }
      } catch (error) {
        console.warn('⚠️ 通知声音播放失败:', error);
      }
    }
  }
  
  /**
   * 清理消息内容
   * @private
   * @param {string} message
   * @returns {string}
   */
  _sanitizeMessage(message) {
    // 简单的HTML转义
    const div = document.createElement('div');
    div.textContent = message;
    return div.innerHTML;
  }
  
  // ==================== 公共API ====================
  
  /**
   * 显示成功通知
   * @param {string} message
   * @param {number} duration
   * @param {Object} options
   * @returns {string}
   */
  success(message, duration = null, options = {}) {
    return this.show(message, 'success', duration, options);
  }
  
  /**
   * 显示错误通知
   * @param {string} message
   * @param {number} duration
   * @param {Object} options
   * @returns {string}
   */
  error(message, duration = 0, options = {}) {
    return this.show(message, 'error', duration, options);
  }
  
  /**
   * 显示警告通知
   * @param {string} message
   * @param {number} duration
   * @param {Object} options
   * @returns {string}
   */
  warning(message, duration = null, options = {}) {
    return this.show(message, 'warning', duration, options);
  }
  
  /**
   * 显示信息通知
   * @param {string} message
   * @param {number} duration
   * @param {Object} options
   * @returns {string}
   */
  info(message, duration = null, options = {}) {
    return this.show(message, 'info', duration, options);
  }
  
  /**
   * 显示加载通知
   * @param {string} message
   * @param {Object} options
   * @returns {string}
   */
  loading(message, options = {}) {
    return this.show(message, 'loading', 0, { ...options, persistent: true });
  }
  
  /**
   * 获取通知历史
   * @returns {Array}
   */
  getHistory() {
    return [...this.notificationHistory];
  }
  
  /**
   * 清空通知历史
   */
  clearHistory() {
    this.notificationHistory = [];
    this._saveNotificationHistory();
    
    this.eventManager.emit('notification:historyCleared', {
      timestamp: Date.now()
    });
    
    console.log('🔔 通知历史已清空 🐱');
  }
  
  /**
   * 获取当前可见通知
   * @returns {Array}
   */
  getVisibleNotifications() {
    return [...this.visibleNotifications];
  }
  
  /**
   * 获取通知队列
   * @returns {Array}
   */
  getQueue() {
    return [...this.notificationQueue];
  }
  
  /**
   * 获取配置
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   * @param {Object} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._updateContainerPosition();
    
    this.eventManager.emit('notification:configUpdated', {
      config: this.config,
      timestamp: Date.now()
    });
    
    console.log('🔔 通知配置已更新 🐱');
  }
  
  /**
   * 启用/禁用通知
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.clearAll();
    }
    
    this.eventManager.emit('notification:enabledChanged', {
      enabled,
      timestamp: Date.now()
    });
    
    console.log(`🔔 通知${enabled ? '启用' : '禁用'} 🐱`);
  }
  
  /**
   * 注册通知类型
   * @param {string} type
   * @param {Object} config
   */
  registerType(type, config) {
    this.notificationTypes[type] = {
      ...this.notificationTypes.info,
      ...config
    };
    
    console.log(`🔔 注册通知类型: ${type} 🐱`);
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('🔔 通知服务开始销毁 🐱');
    
    // 清空所有通知
    this.clearAll();
    
    // 移除通知容器
    if (this.notificationContainer && this.notificationContainer.parentNode) {
      this.notificationContainer.parentNode.removeChild(this.notificationContainer);
    }
    
    // 保存历史
    this._saveNotificationHistory();
    
    // 清理状态
    this.notifications.clear();
    this.notificationQueue.length = 0;
    this.visibleNotifications.length = 0;
    this.notificationGroups.clear();
    
    console.log('🔔 通知服务销毁完成 🐱');
  }
}

// 导出通知服务类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = NotificationService;
} else {
  // 浏览器环境
  window.NotificationService = NotificationService;
} 