/**
 * FavoriteBoard - 事件管理器
 * 负责：事件注册、事件发布、事件清理
 * 
 * @author JupiterTheWarlock
 * @description 实现发布订阅模式，作为模块间通信的事件总线 🐱
 */

/**
 * 生成唯一ID
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 事件管理器 - 实现发布订阅模式
 * 提供事件注册、发布、取消监听等功能
 */
class EventManager {
  constructor() {
    // 普通事件监听器 Map<eventName, Array<ListenerInfo>>
    this.listeners = new Map();
    
    // 一次性事件监听器 Map<eventName, Array<ListenerInfo>>
    this.onceListeners = new Map();
    
    // 通配符监听器 Array<ListenerInfo>
    this.wildcardListeners = [];
    
    // 事件历史记录 (可选，用于调试)
    this.eventHistory = [];
    this.maxHistorySize = 100;
    
    // 调试模式
    this.debugMode = false;
    
    // 统计信息
    this.stats = {
      emittedEvents: 0,
      registeredListeners: 0,
      maxListenersPerEvent: 0
    };
    
    console.log('📡 事件管理器初始化 🐱');
  }
  
  /**
   * 监听事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @param {Object} options - 监听选项
   * @param {Object} options.context - 回调函数的this上下文
   * @param {number} options.priority - 优先级 (数字越大优先级越高)
   * @param {string} options.namespace - 命名空间
   * @returns {Function} 取消监听的函数
   */
  on(event, callback, options = {}) {
    if (typeof event !== 'string' || !event.trim()) {
      throw new Error('喵~ 事件名称必须是非空字符串');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('喵~ 回调必须是函数');
    }
    
    const listeners = this.listeners.get(event) || [];
    const listenerInfo = {
      callback,
      context: options.context || null,
      priority: options.priority || 0,
      namespace: options.namespace || null,
      id: generateId(),
      createdAt: Date.now()
    };
    
    listeners.push(listenerInfo);
    
    // 按优先级排序 (优先级高的先执行)
    listeners.sort((a, b) => b.priority - a.priority);
    
    this.listeners.set(event, listeners);
    this.stats.registeredListeners++;
    
    // 更新最大监听器统计
    if (listeners.length > this.stats.maxListenersPerEvent) {
      this.stats.maxListenersPerEvent = listeners.length;
    }
    
    if (this.debugMode) {
      console.log(`📡 注册事件监听: ${event} [${listenerInfo.id}] 🐱`, {
        priority: listenerInfo.priority,
        namespace: listenerInfo.namespace
      });
    }
    
    // 返回取消监听的函数
    return () => this.off(event, callback);
  }
  
  /**
   * 一次性监听事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @param {Object} options - 监听选项
   * @returns {Function} 取消监听的函数
   */
  once(event, callback, options = {}) {
    if (typeof event !== 'string' || !event.trim()) {
      throw new Error('喵~ 事件名称必须是非空字符串');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('喵~ 回调必须是函数');
    }
    
    const listeners = this.onceListeners.get(event) || [];
    const listenerInfo = {
      callback,
      context: options.context || null,
      namespace: options.namespace || null,
      id: generateId(),
      createdAt: Date.now()
    };
    
    listeners.push(listenerInfo);
    this.onceListeners.set(event, listeners);
    
    if (this.debugMode) {
      console.log(`📡 注册一次性事件监听: ${event} [${listenerInfo.id}] 🐱`);
    }
    
    // 返回取消监听的函数
    return () => {
      const currentListeners = this.onceListeners.get(event) || [];
      const filtered = currentListeners.filter(l => l.id !== listenerInfo.id);
      if (filtered.length === 0) {
        this.onceListeners.delete(event);
      } else {
        this.onceListeners.set(event, filtered);
      }
    };
  }
  
  /**
   * 监听所有事件 (通配符监听)
   * @param {Function} callback - 回调函数，接收 (eventName, data) 参数
   * @param {Object} options - 监听选项
   * @returns {Function} 取消监听的函数
   */
  onAny(callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('喵~ 回调必须是函数');
    }
    
    const listenerInfo = {
      callback,
      context: options.context || null,
      namespace: options.namespace || null,
      id: generateId(),
      createdAt: Date.now()
    };
    
    this.wildcardListeners.push(listenerInfo);
    
    if (this.debugMode) {
      console.log(`📡 注册通配符事件监听 [${listenerInfo.id}] 🐱`);
    }
    
    // 返回取消监听的函数
    return () => {
      const index = this.wildcardListeners.findIndex(l => l.id === listenerInfo.id);
      if (index !== -1) {
        this.wildcardListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   * @param {Object} options - 发布选项
   * @param {boolean} options.async - 是否异步执行 (默认false)
   * @returns {Array} 监听器执行结果数组
   */
  emit(event, data, options = {}) {
    if (typeof event !== 'string' || !event.trim()) {
      throw new Error('喵~ 事件名称必须是非空字符串');
    }
    
    this.stats.emittedEvents++;
    
    if (this.debugMode) {
      console.log(`📢 发布事件: ${event} 🐱`, data);
    }
    
    // 记录事件历史
    this._recordEvent(event, data);
    
    const results = [];
    const errors = [];
    
    // 异步执行选项
    const executeListener = (listener, eventData) => {
      try {
        const result = listener.context 
          ? listener.callback.call(listener.context, eventData)
          : listener.callback(eventData);
        return result;
      } catch (error) {
        console.error(`❌ 事件监听器执行错误 ${event} [${listener.id}]:`, error);
        errors.push({ listener, error });
        return null;
      }
    };
    
    if (options.async) {
      // 异步执行
      setTimeout(() => {
        this._executeListeners(event, data, executeListener);
      }, 0);
      return [];
    } else {
      // 同步执行
      return this._executeListeners(event, data, executeListener);
    }
  }
  
  /**
   * 执行监听器
   * @private
   */
  _executeListeners(event, data, executeListener) {
    const results = [];
    
    // 执行普通监听器
    const listeners = this.listeners.get(event) || [];
    for (const listener of listeners) {
      const result = executeListener(listener, data);
      results.push(result);
    }
    
    // 执行一次性监听器
    const onceListeners = this.onceListeners.get(event) || [];
    if (onceListeners.length > 0) {
      for (const listener of onceListeners) {
        const result = executeListener(listener, data);
        results.push(result);
      }
      // 清理一次性监听器
      this.onceListeners.delete(event);
    }
    
    // 执行通配符监听器
    for (const listener of this.wildcardListeners) {
      try {
        const result = listener.context 
          ? listener.callback.call(listener.context, event, data)
          : listener.callback(event, data);
        results.push(result);
      } catch (error) {
        console.error(`❌ 通配符事件监听器执行错误 [${listener.id}]:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * 取消事件监听
   * @param {string} event - 事件名称
   * @param {Function} callback - 要取消的回调函数
   */
  off(event, callback) {
    if (callback) {
      // 取消特定回调
      const listeners = this.listeners.get(event);
      if (listeners) {
        const filtered = listeners.filter(l => l.callback !== callback);
        if (filtered.length === 0) {
          this.listeners.delete(event);
        } else {
          this.listeners.set(event, filtered);
        }
        this.stats.registeredListeners -= (listeners.length - filtered.length);
      }
      
      // 同时处理一次性监听器
      const onceListeners = this.onceListeners.get(event);
      if (onceListeners) {
        const filtered = onceListeners.filter(l => l.callback !== callback);
        if (filtered.length === 0) {
          this.onceListeners.delete(event);
        } else {
          this.onceListeners.set(event, filtered);
        }
      }
    } else {
      // 取消事件的所有监听器
      const listeners = this.listeners.get(event);
      if (listeners) {
        this.stats.registeredListeners -= listeners.length;
        this.listeners.delete(event);
      }
      this.onceListeners.delete(event);
    }
    
    if (this.debugMode) {
      console.log(`📡 取消事件监听: ${event} 🐱`);
    }
  }
  
  /**
   * 根据命名空间取消监听
   * @param {string} namespace - 命名空间
   */
  offNamespace(namespace) {
    if (!namespace) return;
    
    let removedCount = 0;
    
    // 清理普通监听器
    for (const [event, listeners] of this.listeners.entries()) {
      const filtered = listeners.filter(l => l.namespace !== namespace);
      removedCount += listeners.length - filtered.length;
      
      if (filtered.length === 0) {
        this.listeners.delete(event);
      } else {
        this.listeners.set(event, filtered);
      }
    }
    
    // 清理一次性监听器
    for (const [event, listeners] of this.onceListeners.entries()) {
      const filtered = listeners.filter(l => l.namespace !== namespace);
      
      if (filtered.length === 0) {
        this.onceListeners.delete(event);
      } else {
        this.onceListeners.set(event, filtered);
      }
    }
    
    // 清理通配符监听器
    const originalWildcardCount = this.wildcardListeners.length;
    this.wildcardListeners = this.wildcardListeners.filter(l => l.namespace !== namespace);
    removedCount += originalWildcardCount - this.wildcardListeners.length;
    
    this.stats.registeredListeners -= removedCount;
    
    if (this.debugMode) {
      console.log(`📡 取消命名空间监听: ${namespace}, 移除 ${removedCount} 个监听器 🐱`);
    }
  }
  
  /**
   * 清理所有监听器
   */
  clear() {
    const totalListeners = this.stats.registeredListeners;
    
    this.listeners.clear();
    this.onceListeners.clear();
    this.wildcardListeners.length = 0;
    this.eventHistory.length = 0;
    
    this.stats.registeredListeners = 0;
    this.stats.maxListenersPerEvent = 0;
    
    console.log(`📡 清理所有监听器: ${totalListeners} 个 🐱`);
  }
  
  /**
   * 获取事件的监听器数量
   * @param {string} event - 事件名称
   * @returns {number}
   */
  listenerCount(event) {
    const normalCount = (this.listeners.get(event) || []).length;
    const onceCount = (this.onceListeners.get(event) || []).length;
    return normalCount + onceCount;
  }
  
  /**
   * 获取所有事件名称
   * @returns {Array<string>}
   */
  eventNames() {
    const normalEvents = Array.from(this.listeners.keys());
    const onceEvents = Array.from(this.onceListeners.keys());
    return [...new Set([...normalEvents, ...onceEvents])];
  }
  
  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      activeEvents: this.eventNames().length,
      wildcardListeners: this.wildcardListeners.length,
      eventHistorySize: this.eventHistory.length
    };
  }
  
  /**
   * 开启/关闭调试模式
   * @param {boolean} enabled - 是否开启
   */
  setDebugMode(enabled) {
    this.debugMode = !!enabled;
    console.log(`📡 事件管理器调试模式: ${enabled ? '开启' : '关闭'} 🐱`);
  }
  
  /**
   * 获取事件历史
   * @returns {Array}
   */
  getEventHistory() {
    return [...this.eventHistory];
  }
  
  /**
   * 记录事件历史
   * @private
   */
  _recordEvent(event, data) {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
  
  /**
   * 初始化方法（供容器调用）
   */
  init() {
    console.log('📡 事件管理器初始化完成 🐱');
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('📡 事件管理器开始销毁 🐱');
    this.clear();
    console.log('📡 事件管理器销毁完成 🐱');
  }
}

// 导出事件管理器类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = EventManager;
} else {
  // 浏览器环境
  window.EventManager = EventManager;
} 