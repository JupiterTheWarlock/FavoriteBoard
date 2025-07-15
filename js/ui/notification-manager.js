/**
 * NotificationManager - 通知管理器
 * 负责通知系统的创建、管理和生命周期
 */
class NotificationManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    
    // 通知管理
    this.activeNotifications = new Set();
    this.notificationCounter = 0;
    this.maxNotifications = 5; // 同时显示的最大通知数
    this.notificationQueue = []; // 等待显示的通知队列
    
    // 通知容器
    this.container = null;
    
    // 默认配置
    this.defaultConfig = {
      duration: 3000,
      position: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      showIcon: true,
      allowClose: true,
      autoHide: true
    };
    
    // 通知类型配置
    this.typeConfig = {
      info: {
        icon: 'ℹ️',
        className: 'notification-info'
      },
      success: {
        icon: '✅',
        className: 'notification-success'
      },
      warning: {
        icon: '⚠️',
        className: 'notification-warning'
      },
      error: {
        icon: '❌',
        className: 'notification-error'
      }
    };
    
    console.log('📢 NotificationManager初始化开始...');
    
    // 初始化
    this.init();
    
    console.log('✅ NotificationManager初始化完成');
  }
  
  /**
   * 初始化通知管理器
   */
  init() {
    try {
      // 创建通知容器
      this.createContainer();
      
      // 监听通知请求事件
      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ NotificationManager初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建通知容器
   */
  createContainer() {
    // 检查是否已存在容器
    let existingContainer = document.getElementById('notification-container');
    if (existingContainer) {
      this.container = existingContainer;
      return;
    }
    
    // 创建新容器
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = `notification-container ${this.defaultConfig.position}`;
    
    // 添加到页面
    document.body.appendChild(this.container);
    
    console.log('📢 通知容器已创建');
  }
  
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    if (!this.eventBus) {
      console.warn('⚠️ EventBus不可用，跳过事件监听设置');
      return;
    }
    
    // 监听通知请求事件
    this.eventBus.on('notification-requested', (data) => {
      this.show(data.message, data.type, data.duration);
    }, { unique: true });
    
    console.log('🔗 NotificationManager事件监听设置完成');
  }
  
  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型 ('info', 'success', 'warning', 'error')
   * @param {number} duration - 显示持续时间（毫秒）
   * @param {Object} options - 额外配置选项
   * @returns {Object} 通知对象
   */
  show(message, type = 'info', duration = null, options = {}) {
    try {
      console.log(`📢 显示通知: [${type.toUpperCase()}] ${message}`);
      
      // 合并配置
      const config = {
        ...this.defaultConfig,
        ...options,
        message,
        type,
        duration: duration !== null ? duration : this.defaultConfig.duration
      };
      
      // 创建通知对象
      const notification = this.createNotification(config);
      
      // 如果当前通知数量已满，加入队列
      if (this.activeNotifications.size >= this.maxNotifications) {
        this.notificationQueue.push(notification);
        console.log(`📢 通知已加入队列，当前队列长度: ${this.notificationQueue.length}`);
        return notification;
      }
      
      // 立即显示通知
      this.displayNotification(notification);
      
      return notification;
      
    } catch (error) {
      console.error('❌ 显示通知失败:', error);
      // Fallback到简单的console输出
      console.log(`[${type.toUpperCase()}] ${message}`);
      return null;
    }
  }
  
  /**
   * 创建通知对象
   * @param {Object} config - 通知配置
   * @returns {Object} 通知对象
   */
  createNotification(config) {
    const notificationId = `notification-${++this.notificationCounter}`;
    const typeConfig = this.typeConfig[config.type] || this.typeConfig.info;
    
    // 创建通知元素
    const element = document.createElement('div');
    element.className = `notification ${typeConfig.className}`;
    element.id = notificationId;
    
    // 构建通知HTML
    element.innerHTML = `
      <div class="notification-content">
        ${config.showIcon ? `<span class="notification-icon">${typeConfig.icon}</span>` : ''}
        <span class="notification-message">${config.message}</span>
        ${config.allowClose ? '<button class="notification-close" title="关闭">×</button>' : ''}
      </div>
      <div class="notification-progress"></div>
    `;
    
    // 创建通知对象
    const notification = {
      id: notificationId,
      element: element,
      config: config,
      isVisible: false,
      timer: null,
      progressTimer: null,
      startTime: null,
      
      /**
       * 显示通知
       */
      show: () => {
        try {
          if (!this.container) {
            console.warn('⚠️ 通知容器不可用');
            return;
          }
          
          // 添加到容器
          this.container.appendChild(element);
          
          // 触发显示动画
          setTimeout(() => {
            element.classList.add('show');
          }, 10);
          
          notification.isVisible = true;
          notification.startTime = Date.now();
          
          // 设置自动隐藏
          if (config.autoHide && config.duration > 0) {
            notification.timer = setTimeout(() => {
              notification.hide();
            }, config.duration);
            
            // 启动进度条动画
            notification.startProgress();
          }
          
          console.log(`📢 通知显示完成: ${notificationId}`);
          
        } catch (error) {
          console.error(`❌ 显示通知失败: ${notificationId}`, error);
        }
      },
      
      /**
       * 隐藏通知
       */
      hide: () => {
        try {
          if (!notification.isVisible) return;
          
          console.log(`📢 隐藏通知: ${notificationId}`);
          
          // 清除定时器
          if (notification.timer) {
            clearTimeout(notification.timer);
            notification.timer = null;
          }
          
          if (notification.progressTimer) {
            clearInterval(notification.progressTimer);
            notification.progressTimer = null;
          }
          
          // 隐藏动画
          element.classList.remove('show');
          element.classList.add('hide');
          
          // 延迟移除DOM元素
          setTimeout(() => {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          }, 300);
          
          notification.isVisible = false;
          
          // 从活动通知列表中移除
          this.activeNotifications.delete(notification);
          
          // 处理队列中的通知
          this.processQueue();
          
          // 发布通知隐藏事件
          if (this.eventBus) {
            this.eventBus.emit('notification-hidden', { notificationId, config });
          }
          
        } catch (error) {
          console.error(`❌ 隐藏通知失败: ${notificationId}`, error);
        }
      },
      
      /**
       * 启动进度条动画
       */
      startProgress: () => {
        const progressBar = element.querySelector('.notification-progress');
        if (!progressBar || !config.duration) return;
        
        let elapsed = 0;
        const interval = 50; // 更新间隔
        
        notification.progressTimer = setInterval(() => {
          elapsed += interval;
          const progress = (elapsed / config.duration) * 100;
          
          if (progress >= 100) {
            progressBar.style.width = '100%';
            clearInterval(notification.progressTimer);
            notification.progressTimer = null;
          } else {
            progressBar.style.width = progress + '%';
          }
        }, interval);
      },
      
      /**
       * 暂停自动隐藏
       */
      pause: () => {
        if (notification.timer) {
          clearTimeout(notification.timer);
          notification.timer = null;
        }
        
        if (notification.progressTimer) {
          clearInterval(notification.progressTimer);
          notification.progressTimer = null;
        }
        
        element.classList.add('paused');
      },
      
      /**
       * 恢复自动隐藏
       */
      resume: () => {
        if (!config.autoHide || !notification.isVisible) return;
        
        const elapsed = Date.now() - notification.startTime;
        const remaining = Math.max(0, config.duration - elapsed);
        
        if (remaining > 0) {
          notification.timer = setTimeout(() => {
            notification.hide();
          }, remaining);
          
          notification.startProgress();
        } else {
          notification.hide();
        }
        
        element.classList.remove('paused');
      }
    };
    
    // 绑定通知事件
    this.bindNotificationEvents(notification);
    
    return notification;
  }
  
  /**
   * 显示通知
   * @param {Object} notification - 通知对象
   */
  displayNotification(notification) {
    // 添加到活动通知列表
    this.activeNotifications.add(notification);
    
    // 显示通知
    notification.show();
    
    // 发布通知显示事件
    if (this.eventBus) {
      this.eventBus.emit('notification-shown', {
        notificationId: notification.id,
        config: notification.config
      });
    }
  }
  
  /**
   * 绑定通知事件
   * @param {Object} notification - 通知对象
   */
  bindNotificationEvents(notification) {
    const { element, config } = notification;
    
    // 关闭按钮事件
    if (config.allowClose) {
      const closeBtn = element.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          notification.hide();
        });
      }
    }
    
    // 鼠标悬停暂停自动隐藏
    element.addEventListener('mouseenter', () => {
      if (config.autoHide) {
        notification.pause();
      }
    });
    
    element.addEventListener('mouseleave', () => {
      if (config.autoHide) {
        notification.resume();
      }
    });
    
    // 点击通知
    element.addEventListener('click', () => {
      if (this.eventBus) {
        this.eventBus.emit('notification-clicked', {
          notificationId: notification.id,
          config: notification.config
        });
      }
    });
  }
  
  /**
   * 处理队列中的通知
   */
  processQueue() {
    if (this.notificationQueue.length === 0) return;
    
    while (this.notificationQueue.length > 0 && this.activeNotifications.size < this.maxNotifications) {
      const notification = this.notificationQueue.shift();
      this.displayNotification(notification);
    }
  }
  
  /**
   * 隐藏所有通知
   */
  hideAll() {
    console.log('📢 隐藏所有通知...');
    
    const notificationsToHide = Array.from(this.activeNotifications);
    for (const notification of notificationsToHide) {
      notification.hide();
    }
    
    // 清空队列
    this.notificationQueue.length = 0;
    
    console.log('✅ 所有通知已隐藏');
  }
  
  /**
   * 按类型隐藏通知
   * @param {string} type - 通知类型
   */
  hideByType(type) {
    console.log(`📢 隐藏类型为 ${type} 的通知...`);
    
    const notificationsToHide = Array.from(this.activeNotifications)
      .filter(notification => notification.config.type === type);
    
    for (const notification of notificationsToHide) {
      notification.hide();
    }
    
    // 从队列中移除相同类型的通知
    this.notificationQueue = this.notificationQueue
      .filter(notification => notification.config.type !== type);
  }
  
  /**
   * 获取活动通知数量
   * @returns {number} 活动通知数量
   */
  getActiveCount() {
    return this.activeNotifications.size;
  }
  
  /**
   * 获取队列中的通知数量
   * @returns {number} 队列中的通知数量
   */
  getQueueCount() {
    return this.notificationQueue.length;
  }
  
  /**
   * 设置最大通知数量
   * @param {number} max - 最大通知数量
   */
  setMaxNotifications(max) {
    this.maxNotifications = Math.max(1, max);
    console.log(`📢 设置最大通知数量: ${this.maxNotifications}`);
  }
  
  /**
   * 更新通知位置
   * @param {string} position - 位置 ('top-right', 'top-left', 'bottom-right', 'bottom-left')
   */
  setPosition(position) {
    if (!this.container) return;
    
    // 移除旧的位置类
    this.container.className = this.container.className.replace(/notification-container-\w+-\w+/g, '');
    
    // 添加新的位置类
    this.container.className = `notification-container ${position}`;
    this.defaultConfig.position = position;
    
    console.log(`📢 通知位置已更新: ${position}`);
  }
  
  /**
   * 创建快捷方法
   */
  
  /**
   * 显示信息通知
   * @param {string} message - 消息
   * @param {number} duration - 持续时间
   * @param {Object} options - 选项
   */
  info(message, duration = null, options = {}) {
    return this.show(message, 'info', duration, options);
  }
  
  /**
   * 显示成功通知
   * @param {string} message - 消息
   * @param {number} duration - 持续时间
   * @param {Object} options - 选项
   */
  success(message, duration = null, options = {}) {
    return this.show(message, 'success', duration, options);
  }
  
  /**
   * 显示警告通知
   * @param {string} message - 消息
   * @param {number} duration - 持续时间
   * @param {Object} options - 选项
   */
  warning(message, duration = null, options = {}) {
    return this.show(message, 'warning', duration, options);
  }
  
  /**
   * 显示错误通知
   * @param {string} message - 消息
   * @param {number} duration - 持续时间
   * @param {Object} options - 选项
   */
  error(message, duration = null, options = {}) {
    return this.show(message, 'error', duration || 5000, options);
  }
  
  /**
   * 主题变更处理
   * @param {string} theme - 主题名称
   */
  onThemeChange(theme) {
    console.log(`🎨 NotificationManager主题变更: ${theme}`);
    
    if (this.container) {
      this.container.setAttribute('data-theme', theme);
    }
    
    // 应用主题到所有活动通知
    for (const notification of this.activeNotifications) {
      if (notification.element) {
        notification.element.setAttribute('data-theme', theme);
      }
    }
  }
  
  /**
   * 清理资源
   */
  destroy() {
    console.log('🧹 清理NotificationManager资源...');
    
    // 隐藏所有通知
    this.hideAll();
    
    // 移除容器
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
    
    // 清理引用
    this.activeNotifications.clear();
    this.notificationQueue.length = 0;
    this.notificationCounter = 0;
    
    console.log('✅ NotificationManager资源清理完成');
  }
}

// 导出NotificationManager类
window.NotificationManager = NotificationManager; 