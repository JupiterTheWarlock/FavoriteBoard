/**
 * FavoriteBoard - 应用配置
 * 负责：系统配置管理、环境变量、功能开关
 * 
 * @author JupiterTheWarlock
 * @description 集中管理应用的所有配置项 🐱
 */

/**
 * 应用配置类
 * 提供配置管理、环境检测、功能开关等功能
 */
class AppConfig {
  constructor() {
    // 应用基本信息
    this.appInfo = {
      name: 'FavoriteBoard',
      version: '2.0.0',
      author: 'JupiterTheWarlock',
      description: '收藏夹管理工具 🐱',
      buildTime: Date.now()
    };
    
    // 环境配置
    this.environment = this._detectEnvironment();
    
    // 开发配置
    this.development = {
      debugMode: this.environment.isDevelopment,
      logLevel: this.environment.isDevelopment ? 'debug' : 'info',
      mockData: false,
      enablePerformanceMonitoring: true,
      enableEventHistory: true
    };
    
    // UI配置
    this.ui = {
      theme: 'auto', // 'light', 'dark', 'auto'
      animations: true,
      compactMode: false,
      showTooltips: true,
      responsiveBreakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      }
    };
    
    // 文件夹树配置
    this.folderTree = {
      maxDepth: 10,
      autoExpand: true,
      expandedStateStorage: true,
      dragAndDrop: true,
      virtualScrolling: false,
      lazyLoading: false
    };
    
    // 搜索配置
    this.search = {
      minQueryLength: 1,
      debounceDelay: 300,
      maxResults: 100,
      highlightMatches: true,
      searchInUrl: true,
      searchInDescription: true,
      fuzzySearch: false
    };
    
    // 通知配置
    this.notifications = {
      enabled: true,
      duration: 3000,
      position: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      maxVisible: 5,
      animations: true,
      sound: false
    };
    
    // 性能配置
    this.performance = {
      virtualScrolling: false,
      lazyLoadImages: true,
      batchSize: 50,
      debounceDelay: 16,
      cacheTimeout: 300000, // 5分钟
      maxCacheSize: 100
    };
    
    // 事件配置
    this.events = {
      maxHistorySize: 100,
      debugMode: this.development.debugMode,
      asyncExecution: false,
      errorHandling: 'log' // 'log', 'throw', 'silent'
    };
    
    // 数据管理配置
    this.data = {
      autoRefresh: true,
      refreshInterval: 60000, // 1分钟
      cacheEnabled: true,
      compressionEnabled: false,
      backupEnabled: true,
      maxBackups: 5
    };
    
    // 扩展配置
    this.extension = {
      permissions: ['bookmarks', 'storage'],
      contextMenus: true,
      backgroundSync: true,
      notifications: true
    };
    
    // 实验性功能
    this.experimental = {
      aiSuggestions: false,
      smartFolders: false,
      bulkOperations: false,
      advancedSearch: false,
      exportImport: false
    };
    
    // 初始化配置
    this._initializeConfig();
    
    console.log('⚙️ 应用配置初始化完成 🐱', this.getAppInfo());
  }
  
  /**
   * 检测运行环境
   * @private
   * @returns {Object}
   */
  _detectEnvironment() {
    const userAgent = navigator.userAgent.toLowerCase();
    const url = window.location.href;
    
    return {
      // 浏览器信息
      isChrome: userAgent.includes('chrome'),
      isFirefox: userAgent.includes('firefox'),
      isEdge: userAgent.includes('edge'),
      isSafari: userAgent.includes('safari') && !userAgent.includes('chrome'),
      
      // 平台信息
      isWindows: userAgent.includes('windows'),
      isMac: userAgent.includes('mac'),
      isLinux: userAgent.includes('linux'),
      
      // 设备信息
      isMobile: /mobile|android|ios/.test(userAgent),
      isTablet: /tablet|ipad/.test(userAgent),
      isDesktop: !/mobile|tablet|android|ios|ipad/.test(userAgent),
      
      // 运行环境
      isExtension: typeof chrome !== 'undefined' && chrome.runtime,
      isWebApp: !window.chrome || !window.chrome.runtime,
      isDevelopment: url.includes('localhost') || url.includes('127.0.0.1') || url.includes('file://'),
      isProduction: !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('file://'),
      
      // 功能支持
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsLocalStorage: typeof localStorage !== 'undefined',
      supportsIndexedDB: 'indexedDB' in window,
      supportsNotifications: 'Notification' in window
    };
  }
  
  /**
   * 初始化配置
   * @private
   */
  _initializeConfig() {
    // 根据环境调整配置
    if (this.environment.isMobile) {
      this.ui.compactMode = true;
      this.ui.animations = false;
      this.performance.virtualScrolling = true;
      this.performance.lazyLoadImages = true;
    }
    
    // 根据浏览器调整配置
    if (this.environment.isFirefox) {
      this.performance.virtualScrolling = false; // Firefox兼容性
    }
    
    // 开发环境特殊配置
    if (this.environment.isDevelopment) {
      this.events.debugMode = true;
      this.development.mockData = true;
      this.experimental.aiSuggestions = true;
      this.experimental.smartFolders = true;
    }
    
    // 加载用户设置
    this._loadUserSettings();
  }
  
  /**
   * 加载用户设置
   * @private
   */
  _loadUserSettings() {
    try {
      if (this.environment.supportsLocalStorage) {
        const userSettings = localStorage.getItem('favoriteBoard_userSettings');
        if (userSettings) {
          const settings = JSON.parse(userSettings);
          this._mergeSettings(settings);
          console.log('⚙️ 用户设置加载成功 🐱');
        }
      }
    } catch (error) {
      console.warn('⚙️ 用户设置加载失败:', error);
    }
  }
  
  /**
   * 合并用户设置
   * @private
   * @param {Object} settings 
   */
  _mergeSettings(settings) {
    // 安全地合并设置，只覆盖已存在的配置项
    const merge = (target, source) => {
      for (const key in source) {
        if (target.hasOwnProperty(key)) {
          if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
            merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
    };
    
    // 合并各个配置区域
    if (settings.ui) merge(this.ui, settings.ui);
    if (settings.search) merge(this.search, settings.search);
    if (settings.notifications) merge(this.notifications, settings.notifications);
    if (settings.performance) merge(this.performance, settings.performance);
    if (settings.folderTree) merge(this.folderTree, settings.folderTree);
    if (settings.experimental) merge(this.experimental, settings.experimental);
  }
  
  /**
   * 保存用户设置
   */
  saveUserSettings() {
    try {
      if (this.environment.supportsLocalStorage) {
        const userSettings = {
          ui: this.ui,
          search: this.search,
          notifications: this.notifications,
          performance: this.performance,
          folderTree: this.folderTree,
          experimental: this.experimental,
          savedAt: Date.now()
        };
        
        localStorage.setItem('favoriteBoard_userSettings', JSON.stringify(userSettings));
        console.log('⚙️ 用户设置保存成功 🐱');
        return true;
      }
    } catch (error) {
      console.error('⚙️ 用户设置保存失败:', error);
      return false;
    }
  }
  
  /**
   * 获取配置项
   * @param {string} path - 配置路径，如 'ui.theme' 或 'search.minQueryLength'
   * @param {*} defaultValue - 默认值
   * @returns {*}
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let current = this;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }
  
  /**
   * 设置配置项
   * @param {string} path - 配置路径
   * @param {*} value - 配置值
   * @returns {boolean}
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this;
    
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    
    // 触发配置更新事件
    this._emitConfigChange(path, value);
    
    return true;
  }
  
  /**
   * 检查功能是否启用
   * @param {string} feature - 功能名称
   * @returns {boolean}
   */
  isFeatureEnabled(feature) {
    // 检查实验性功能
    if (this.experimental.hasOwnProperty(feature)) {
      return this.experimental[feature];
    }
    
    // 检查其他功能开关
    const switches = {
      'debugMode': this.development.debugMode,
      'animations': this.ui.animations,
      'notifications': this.notifications.enabled,
      'virtualScrolling': this.performance.virtualScrolling,
      'autoRefresh': this.data.autoRefresh,
      'dragAndDrop': this.folderTree.dragAndDrop
    };
    
    return switches[feature] || false;
  }
  
  /**
   * 获取应用信息
   * @returns {Object}
   */
  getAppInfo() {
    return {
      ...this.appInfo,
      environment: this.environment,
      buildMode: this.environment.isDevelopment ? 'development' : 'production'
    };
  }
  
  /**
   * 获取环境信息
   * @returns {Object}
   */
  getEnvironment() {
    return { ...this.environment };
  }
  
  /**
   * 重置配置到默认值
   * @param {string} section - 要重置的配置区域，如 'ui', 'search' 等
   */
  resetToDefaults(section = null) {
    if (section) {
      // 重置特定区域（需要重新实例化默认值）
      const tempConfig = new AppConfig();
      this[section] = tempConfig[section];
    } else {
      // 重置所有配置
      const tempConfig = new AppConfig();
      Object.assign(this, tempConfig);
    }
    
    console.log(`⚙️ 配置重置完成: ${section || '全部'} 🐱`);
  }
  
  /**
   * 导出配置
   * @returns {Object}
   */
  exportConfig() {
    return {
      ui: this.ui,
      search: this.search,
      notifications: this.notifications,
      performance: this.performance,
      folderTree: this.folderTree,
      experimental: this.experimental,
      exportedAt: Date.now(),
      version: this.appInfo.version
    };
  }
  
  /**
   * 导入配置
   * @param {Object} config 
   * @returns {boolean}
   */
  importConfig(config) {
    try {
      if (config && typeof config === 'object') {
        this._mergeSettings(config);
        this.saveUserSettings();
        console.log('⚙️ 配置导入成功 🐱');
        return true;
      }
    } catch (error) {
      console.error('⚙️ 配置导入失败:', error);
    }
    return false;
  }
  
  /**
   * 发出配置更改事件
   * @private
   * @param {string} path 
   * @param {*} value 
   */
  _emitConfigChange(path, value) {
    // 如果事件管理器可用，发出配置更改事件
    if (window.eventManager) {
      window.eventManager.emit('config:changed', {
        path,
        value,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * 初始化方法（供容器调用）
   */
  init() {
    console.log('⚙️ 应用配置初始化完成 🐱');
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('⚙️ 应用配置开始销毁 🐱');
    // 保存当前设置
    this.saveUserSettings();
    console.log('⚙️ 应用配置销毁完成 🐱');
  }
}

// 导出配置类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = AppConfig;
} else {
  // 浏览器环境
  window.AppConfig = AppConfig;
} 