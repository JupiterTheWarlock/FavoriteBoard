// FavoriteBoard Plugin - 状态管理器
// 实现集中状态管理和单向数据流

/**
 * 状态管理器 - 集中管理应用状态
 * 实现单向数据流和响应式状态更新
 */
class StateManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    
    // 应用状态结构
    this.state = {
      // 数据状态
      data: {
        bookmarks: null,           // 原始收藏夹数据缓存
        folderTree: [],            // 文件夹树结构
        allLinks: [],              // 所有链接数据
        folderMap: new Map(),      // 文件夹映射表
        lastSync: null             // 最后同步时间
      },
      
      // UI状态
      ui: {
        loading: false,            // 全局加载状态
        selectedFolder: null,      // 当前选中的文件夹
        expandedFolders: new Set(), // 展开的文件夹ID集合
        searchQuery: '',           // 搜索查询字符串
        currentTab: null,          // 当前激活的Tab
        sidebarCollapsed: false,   // 侧边栏是否折叠
        theme: 'light'             // 主题模式
      },
      
      // Tab状态
      tabs: {
        registered: new Map(),     // 已注册的Tab
        active: null,              // 当前激活的Tab实例
        history: []                // Tab切换历史
      },
      
      // 应用配置
      config: {
        maxHistorySize: 50,        // 最大历史记录数
        autoSave: true,            // 自动保存设置
        debugMode: false           // 调试模式
      }
    };
    
    // 状态变更监听器
    this.stateListeners = new Map();
    
    // 状态变更历史
    this.stateHistory = [];
    
    // 防抖更新定时器
    this.updateTimer = null;
    
    console.log('🐱 状态管理器初始化完成');
    
    // 设置事件监听
    this.setupEventListeners();
  }
  
  // ==================== 状态获取方法 ====================
  
  /**
   * 获取完整状态（只读副本）
   * @returns {Object} 状态副本
   */
  getState() {
    return this.deepClone(this.state);
  }
  
  /**
   * 获取指定路径的状态值
   * @param {string} path - 状态路径，如 'data.folderTree' 或 'ui.loading'
   * @returns {any} 状态值
   */
  getStateValue(path) {
    return this.getValueByPath(this.state, path);
  }
  
  /**
   * 获取数据状态
   * @returns {Object} 数据状态
   */
  getDataState() {
    return this.deepClone(this.state.data);
  }
  
  /**
   * 获取UI状态
   * @returns {Object} UI状态
   */
  getUIState() {
    return this.deepClone(this.state.ui);
  }
  
  /**
   * 获取Tab状态
   * @returns {Object} Tab状态
   */
  getTabState() {
    return this.deepClone(this.state.tabs);
  }
  
  // ==================== 状态更新方法 ====================
  
  /**
   * 更新状态（支持部分更新）
   * @param {Object} updates - 状态更新对象
   * @param {Object} options - 更新选项
   */
  setState(updates, options = {}) {
    const {
      silent = false,        // 是否静默更新（不触发事件）
      merge = true,          // 是否合并更新（false为替换）
      source = 'unknown'     // 更新来源标识
    } = options;
    
    try {
      // 保存旧状态
      const oldState = this.deepClone(this.state);
      
      // 执行状态更新
      if (merge) {
        this.state = this.deepMerge(this.state, updates);
      } else {
        Object.assign(this.state, updates);
      }
      
      // 记录状态变更历史
      this.recordStateChange(oldState, updates, source);
      
      // 触发状态变更事件
      if (!silent) {
        this.emitStateChange(oldState, this.state, updates, source);
      }
      
      console.log(`🔄 [StateManager] 状态已更新 (${source})`, updates);
      
    } catch (error) {
      console.error('❌ 状态更新失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新数据状态
   * @param {Object} dataUpdates - 数据状态更新
   * @param {string} source - 更新来源
   */
  setDataState(dataUpdates, source = 'data-update') {
    this.setState({ data: dataUpdates }, { source, merge: true });
  }
  
  /**
   * 更新UI状态
   * @param {Object} uiUpdates - UI状态更新
   * @param {string} source - 更新来源
   */
  setUIState(uiUpdates, source = 'ui-update') {
    this.setState({ ui: uiUpdates }, { source, merge: true });
  }
  
  /**
   * 更新Tab状态
   * @param {Object} tabUpdates - Tab状态更新
   * @param {string} source - 更新来源
   */
  setTabState(tabUpdates, source = 'tab-update') {
    this.setState({ tabs: tabUpdates }, { source, merge: true });
  }
  
  // ==================== 数据处理集成 ====================
  
  /**
   * 处理收藏夹数据更新
   * @param {Object} bookmarksData - 收藏夹数据
   * @param {string} source - 数据来源
   */
  async processBookmarksData(bookmarksData, source = 'bookmark-manager') {
    try {
      console.log('📊 [StateManager] 开始处理收藏夹数据...');
      
      // 更新加载状态
      this.setUIState({ loading: true }, 'data-processing');
      
      // 使用DataProcessor处理数据
      const folderTree = DataProcessor.generateFolderTree(bookmarksData);
      const allLinks = DataProcessor.generateAllLinks(bookmarksData);
      
      // 传入原始的folderMap数据来构建映射表
      const originalFolderMap = bookmarksData?.folderMap || {};
      const folderMap = DataProcessor.buildFolderMap(folderTree, originalFolderMap);
      
      // 更新数据状态
      this.setDataState({
        bookmarks: bookmarksData,
        folderTree: folderTree,
        allLinks: allLinks,
        folderMap: folderMap,
        lastSync: Date.now()
      }, source);
      
      // 完成加载
      this.setUIState({ loading: false }, 'data-processing');
      
      console.log(`✅ [StateManager] 数据处理完成 - 文件夹: ${folderTree.length}, 链接: ${allLinks.length}`);
      
      return {
        folderTree,
        allLinks,
        folderMap
      };
      
    } catch (error) {
      console.error('❌ 数据处理失败:', error);
      this.setUIState({ loading: false }, 'data-processing');
      throw error;
    }
  }
  
  // ==================== 状态监听方法 ====================
  
  /**
   * 订阅状态变更
   * @param {string|Array} paths - 监听的状态路径
   * @param {Function} listener - 监听器函数
   * @param {Object} options - 监听选项
   * @returns {Function} 取消订阅函数
   */
  subscribe(paths, listener, options = {}) {
    const {
      immediate = false,     // 是否立即执行一次
      deep = false          // 是否深度监听
    } = options;
    
    // 标准化路径
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const listenerId = this.generateListenerId();
    
    // 存储监听器
    this.stateListeners.set(listenerId, {
      paths: pathArray,
      listener,
      options
    });
    
    // 立即执行
    if (immediate) {
      const currentValues = pathArray.map(path => this.getStateValue(path));
      listener(currentValues, pathArray);
    }
    
    // 返回取消订阅函数
    return () => {
      this.stateListeners.delete(listenerId);
    };
  }
  
  /**
   * 一次性监听状态变更
   * @param {string|Array} paths - 监听的状态路径
   * @param {Function} listener - 监听器函数
   */
  once(paths, listener) {
    const unsubscribe = this.subscribe(paths, (...args) => {
      listener(...args);
      unsubscribe();
    });
    return unsubscribe;
  }
  
  // ==================== 事件处理方法 ====================
  
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    if (!this.eventBus) return;
    
    // 监听数据更新事件
    this.eventBus.on('data-updated', (data) => {
      this.handleDataUpdate(data);
    });
    
    // 监听Tab切换事件
    this.eventBus.on('tab-switched', (data) => {
      this.handleTabSwitch(data);
    });
    
    // 监听UI状态变更事件
    this.eventBus.on('ui-state-changed', (data) => {
      this.handleUIStateChange(data);
    });
    
    console.log('🔗 [StateManager] 事件监听器已设置');
  }
  
  /**
   * 处理数据更新事件
   * @param {Object} data - 数据更新信息
   */
  handleDataUpdate(data) {
    this.setDataState({
      folderTree: data.data.folderTree,
      allLinks: data.data.allLinks,
      folderMap: data.data.folderMap
    }, 'event-bus');
  }
  
  /**
   * 处理Tab切换事件
   * @param {Object} data - Tab切换信息
   */
  handleTabSwitch(data) {
    // 更新当前Tab状态
    this.setUIState({
      currentTab: data.tabId
    }, 'tab-switch');
    
    // 记录Tab历史
    const history = [...this.state.tabs.history];
    history.push({
      tabId: data.tabId,
      timestamp: Date.now(),
      title: data.title
    });
    
    // 限制历史记录大小
    if (history.length > this.state.config.maxHistorySize) {
      history.shift();
    }
    
    this.setTabState({
      active: data.tabId,
      history: history
    }, 'tab-switch');
  }
  
  /**
   * 处理UI状态变更事件
   * @param {Object} data - UI状态变更信息
   */
  handleUIStateChange(data) {
    this.setUIState(data, 'ui-event');
  }
  
  // ==================== 私有辅助方法 ====================
  
  /**
   * 触发状态变更事件
   */
  emitStateChange(oldState, newState, updates, source) {
    if (!this.eventBus) return;
    
    // 通知状态监听器
    this.notifyStateListeners(oldState, newState, updates);
    
    // 发布全局状态变更事件
    this.eventBus.emit('state-changed', {
      oldState,
      newState,
      updates,
      source,
      timestamp: Date.now()
    });
  }
  
  /**
   * 通知状态监听器
   */
  notifyStateListeners(oldState, newState, updates) {
    for (const [listenerId, { paths, listener, options }] of this.stateListeners) {
      try {
        // 检查监听的路径是否发生变化
        const hasChanged = paths.some(path => {
          const oldValue = this.getValueByPath(oldState, path);
          const newValue = this.getValueByPath(newState, path);
          return !this.deepEqual(oldValue, newValue);
        });
        
        if (hasChanged) {
          const currentValues = paths.map(path => this.getValueByPath(newState, path));
          listener(currentValues, paths, { oldState, newState, updates });
        }
      } catch (error) {
        console.error(`❌ 状态监听器执行失败 (${listenerId}):`, error);
      }
    }
  }
  
  /**
   * 记录状态变更历史
   */
  recordStateChange(oldState, updates, source) {
    this.stateHistory.push({
      timestamp: Date.now(),
      oldState: this.deepClone(oldState),
      updates: this.deepClone(updates),
      source
    });
    
    // 限制历史记录大小
    if (this.stateHistory.length > this.state.config.maxHistorySize) {
      this.stateHistory.shift();
    }
  }
  
  /**
   * 深度合并对象
   */
  deepMerge(target, source) {
    const result = this.deepClone(target);
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (this.isObject(source[key]) && this.isObject(result[key])) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }
  
  /**
   * 深度克隆对象（支持循环引用检测）
   */
  deepClone(obj, visited = new WeakMap()) {
    // 处理基本类型
    if (obj === null || typeof obj !== 'object') return obj;
    
    // 检查循环引用
    if (visited.has(obj)) {
      console.warn('🔄 [StateManager] 检测到循环引用，返回引用标记');
      return '[Circular Reference]';
    }
    
    // 处理特殊对象类型
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);
    if (obj instanceof Function) {
      console.warn('🔄 [StateManager] 函数对象不会被克隆，返回引用');
      return obj; // 函数不克隆，直接返回引用
    }
    
    // 标记当前对象为已访问
    visited.set(obj, true);
    
    try {
      // 处理数组
      if (Array.isArray(obj)) {
        const cloned = obj.map(item => this.deepClone(item, visited));
        visited.delete(obj); // 克隆完成后移除标记
        return cloned;
      }
      
      // 处理Map
      if (obj instanceof Map) {
        const cloned = new Map();
        for (const [key, value] of obj.entries()) {
          cloned.set(key, this.deepClone(value, visited));
        }
        visited.delete(obj);
        return cloned;
      }
      
      // 处理Set
      if (obj instanceof Set) {
        const cloned = new Set();
        for (const value of obj) {
          cloned.add(this.deepClone(value, visited));
        }
        visited.delete(obj);
        return cloned;
      }
      
      // 处理普通对象
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // 跳过某些可能导致循环引用的属性
          if (this.shouldSkipProperty(key, obj[key])) {
            console.warn(`🔄 [StateManager] 跳过属性: ${key}`);
            continue;
          }
          cloned[key] = this.deepClone(obj[key], visited);
        }
      }
      
      visited.delete(obj); // 克隆完成后移除标记
      return cloned;
      
    } catch (error) {
      visited.delete(obj); // 确保在错误情况下也移除标记
      console.error('❌ [StateManager] 深度克隆失败:', error);
      return '[Clone Error]';
    }
  }
  
  /**
   * 判断是否应该跳过某个属性
   */
  shouldSkipProperty(key, value) {
    // 跳过可能导致循环引用的属性
    const skipPatterns = [
      'eventBus',
      'stateManager',
      'tabFactory',
      'bookmarkManager',
      'container',
      'parent',
      'app'
    ];
    
    // 跳过函数属性
    if (typeof value === 'function') {
      return true;
    }
    
    // 跳过DOM元素
    if (value instanceof HTMLElement) {
      return true;
    }
    
    // 跳过指定的属性（精确匹配，避免误跳过如parentId等属性）
    return skipPatterns.includes(key);
  }
  
  /**
   * 深度比较对象
   */
  deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }
    
    return false;
  }
  
  /**
   * 根据路径获取对象值
   */
  getValueByPath(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
  
  /**
   * 检查是否为对象
   */
  isObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }
  
  /**
   * 生成监听器ID
   */
  generateListenerId() {
    return `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // ==================== 调试和工具方法 ====================
  
  /**
   * 打印状态信息
   */
  printState() {
    console.group('🔍 [StateManager] 当前状态');
    console.log('📊 数据状态:', this.state.data);
    console.log('🎨 UI状态:', this.state.ui);
    console.log('📋 Tab状态:', this.state.tabs);
    console.log('⚙️ 配置状态:', this.state.config);
    console.log('👥 监听器数量:', this.stateListeners.size);
    console.log('📜 历史记录数量:', this.stateHistory.length);
    console.groupEnd();
  }
  
  /**
   * 获取状态变更历史
   * @param {number} limit - 返回记录数量限制
   * @returns {Array} 历史记录
   */
  getStateHistory(limit = 10) {
    return this.stateHistory.slice(-limit);
  }
  
  /**
   * 清空状态历史
   */
  clearHistory() {
    this.stateHistory = [];
    console.log('🗑️ [StateManager] 状态历史已清空');
  }
  
  /**
   * 重置状态到初始值
   */
  reset() {
    const oldState = this.deepClone(this.state);
    
    // 重置状态但保留配置
    this.state = {
      data: {
        bookmarks: null,
        folderTree: [],
        allLinks: [],
        folderMap: new Map(),
        lastSync: null
      },
      ui: {
        loading: false,
        selectedFolder: null,
        expandedFolders: new Set(),
        searchQuery: '',
        currentTab: null,
        sidebarCollapsed: false,
        theme: 'light'
      },
      tabs: {
        registered: new Map(),
        active: null,
        history: []
      },
      config: this.state.config  // 保留配置
    };
    
    // 通知状态重置
    this.emitStateChange(oldState, this.state, this.state, 'reset');
    
    console.log('🔄 [StateManager] 状态已重置');
  }
}

// 导出状态管理器类
window.StateManager = StateManager; 