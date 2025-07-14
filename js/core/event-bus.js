// FavoriteBoard Plugin - 事件总线系统
// 实现组件间的松耦合通信机制

/**
 * 事件总线 - 实现发布/订阅模式
 * 用于组件间的松耦合通信，避免直接依赖
 */
class EventBus {
  constructor() {
    // 存储事件监听器的Map
    this.events = new Map();
    
    // 存储一次性事件监听器的Map
    this.onceEvents = new Map();
    
    // 事件历史记录（用于调试）
    this.eventHistory = [];
    
    // 是否启用调试模式
    this.debug = false;
    
    console.log('🐱 事件总线初始化完成');
  }
  
  // ==================== 核心方法 ====================
  
  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   * @param {Object} options - 选项
   */
  emit(event, data = null, options = {}) {
    const eventInfo = {
      event,
      data,
      timestamp: Date.now(),
      options
    };
    
    // 记录事件历史
    this.eventHistory.push(eventInfo);
    
    // 调试输出
    if (this.debug) {
      console.log(`📢 [EventBus] 发布事件: ${event}`, data);
    }
    
    // 触发普通监听器
    const handlers = this.events.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data, eventInfo);
      } catch (error) {
        console.error(`❌ [EventBus] 事件处理器错误 (${event}):`, error);
      }
    });
    
    // 触发一次性监听器
    const onceHandlers = this.onceEvents.get(event) || [];
    if (onceHandlers.length > 0) {
      onceHandlers.forEach(handler => {
        try {
          handler(data, eventInfo);
        } catch (error) {
          console.error(`❌ [EventBus] 一次性事件处理器错误 (${event}):`, error);
        }
      });
      // 清除一次性监听器
      this.onceEvents.delete(event);
    }
    
    // 限制历史记录长度
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500);
    }
    
    return this;
  }
  
  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理器
   * @param {Object} options - 选项
   */
  on(event, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('事件处理器必须是函数');
    }
    
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const handlers = this.events.get(event);
    
    // 检查是否已经存在相同的处理器
    if (options.unique && handlers.includes(handler)) {
      if (this.debug) {
        console.warn(`⚠️ [EventBus] 重复的事件处理器: ${event}`);
      }
      return this;
    }
    
    handlers.push(handler);
    
    if (this.debug) {
      console.log(`📝 [EventBus] 订阅事件: ${event} (处理器数量: ${handlers.length})`);
    }
    
    return this;
  }
  
  /**
   * 订阅一次性事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理器
   */
  once(event, handler) {
    if (typeof handler !== 'function') {
      throw new Error('事件处理器必须是函数');
    }
    
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, []);
    }
    
    this.onceEvents.get(event).push(handler);
    
    if (this.debug) {
      console.log(`📝 [EventBus] 订阅一次性事件: ${event}`);
    }
    
    return this;
  }
  
  /**
   * 取消订阅事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理器（可选）
   */
  off(event, handler = null) {
    if (handler) {
      // 取消特定处理器
      const handlers = this.events.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        if (this.debug) {
          console.log(`🗑️ [EventBus] 取消订阅事件: ${event} (剩余处理器: ${handlers.length})`);
        }
      }
      
      // 如果没有处理器了，删除事件
      if (handlers.length === 0) {
        this.events.delete(event);
      }
    } else {
      // 取消所有处理器
      this.events.delete(event);
      this.onceEvents.delete(event);
      if (this.debug) {
        console.log(`🗑️ [EventBus] 取消所有订阅: ${event}`);
      }
    }
    
    return this;
  }
  
  // ==================== 高级功能 ====================
  
  /**
   * 检查是否有事件监听器
   * @param {string} event - 事件名称
   * @returns {boolean}
   */
  hasListeners(event) {
    const normalListeners = (this.events.get(event) || []).length;
    const onceListeners = (this.onceEvents.get(event) || []).length;
    return normalListeners > 0 || onceListeners > 0;
  }
  
  /**
   * 获取事件监听器数量
   * @param {string} event - 事件名称
   * @returns {number}
   */
  getListenerCount(event) {
    const normalListeners = (this.events.get(event) || []).length;
    const onceListeners = (this.onceEvents.get(event) || []).length;
    return normalListeners + onceListeners;
  }
  
  /**
   * 获取所有事件名称
   * @returns {Array<string>}
   */
  getEventNames() {
    const normalEvents = Array.from(this.events.keys());
    const onceEvents = Array.from(this.onceEvents.keys());
    return [...new Set([...normalEvents, ...onceEvents])];
  }
  
  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events.clear();
    this.onceEvents.clear();
    this.eventHistory = [];
    
    if (this.debug) {
      console.log('🧹 [EventBus] 清除所有事件监听器');
    }
    
    return this;
  }
  
  /**
   * 启用/禁用调试模式
   * @param {boolean} enabled - 是否启用
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`🐛 [EventBus] 调试模式: ${enabled ? '启用' : '禁用'}`);
    return this;
  }
  
  /**
   * 获取事件历史记录
   * @param {number} limit - 限制数量
   * @returns {Array}
   */
  getEventHistory(limit = 50) {
    return this.eventHistory.slice(-limit);
  }
  
  /**
   * 等待事件发生
   * @param {string} event - 事件名称
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise}
   */
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler);
        reject(new Error(`等待事件 ${event} 超时`));
      }, timeout);
      
      const handler = (data) => {
        clearTimeout(timer);
        resolve(data);
      };
      
      this.once(event, handler);
    });
  }
  
  // ==================== 调试方法 ====================
  
  /**
   * 打印事件总线状态
   */
  printStatus() {
    console.group('📊 [EventBus] 状态信息');
    console.log('普通事件监听器:', this.events.size);
    console.log('一次性事件监听器:', this.onceEvents.size);
    console.log('事件历史记录:', this.eventHistory.length);
    console.log('调试模式:', this.debug);
    
    if (this.events.size > 0) {
      console.group('📋 事件列表:');
      for (const [event, handlers] of this.events) {
        console.log(`  ${event}: ${handlers.length} 个处理器`);
      }
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// 创建全局事件总线实例
const eventBus = new EventBus();

// 在开发环境下启用调试
if (typeof window !== 'undefined' && window.location && 
    (window.location.hostname === 'localhost' || window.location.protocol === 'file:')) {
  eventBus.setDebug(true);
}

// 导出事件总线实例
if (typeof window !== 'undefined') {
  window.EventBus = EventBus;
  window.eventBus = eventBus;
} else if (typeof global !== 'undefined') {
  global.EventBus = EventBus;
  global.eventBus = eventBus;
} 