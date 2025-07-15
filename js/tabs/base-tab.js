// FavoriteBoard Plugin - Tab基类
// 定义所有Tab的统一接口和公共方法

/**
 * Tab基类 - 所有Tab的基础类
 * 提供统一的接口规范和公共方法实现
 */
class BaseTab {
  /**
   * 构造函数
   * @param {string} id - Tab的唯一标识
   * @param {string} title - Tab的显示标题
   * @param {string} icon - Tab的图标(emoji或class名)
   * @param {Object} options - 其他配置选项
   */
  constructor(id, title, icon, options = {}) {
    this.id = id;
    this.title = title;
    this.icon = icon;
    this.isActive = false;
    this.isInitialized = false;
    this.container = null;
    
    // 可配置选项
    this.options = {
      showSearch: true,           // 是否显示搜索栏
      supportSearch: true,        // 是否支持搜索功能
      lazyRender: false,         // 是否延迟渲染
      cache: true,               // 是否缓存渲染结果
      ...options
    };
    
    // 事件总线引用
    this.eventBus = window.eventBus;
    
    // 绑定方法上下文
    this.handleSearch = this.handleSearch.bind(this);
    this.handleResize = this.handleResize.bind(this);
    
    // 初始化事件监听
    this.initEventListeners();
    
    console.log(`🐱 Tab创建: ${this.id} - ${this.title}`);
  }
  
  // ==================== 事件系统 ====================
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    if (!this.eventBus) {
      console.warn(`⚠️ [${this.id}] 事件总线不可用`);
      return;
    }
    
    // 监听搜索事件
    this.eventBus.on('search-query-changed', this.handleSearch, { unique: true });
    
    // 监听窗口大小变化事件
    this.eventBus.on('window-resized', this.handleResize, { unique: true });
    
    // 监听数据更新事件
    this.eventBus.on('data-updated', (data) => {
      this.onDataUpdate(data.action, data.data);
    }, { unique: true });
    
    // 监听状态管理器的状态变更事件
    this.eventBus.on('state-changed', (data) => {
      this.onStateChanged(data);
    }, { unique: true });
    
    // 注意：Tab的激活/失活事件由外部控制，这里不需要监听自己的激活事件
    // 避免无限递归调用
  }
  
  /**
   * 清理事件监听器
   */
  cleanupEventListeners() {
    if (!this.eventBus) return;
    
    this.eventBus.off('search-query-changed', this.handleSearch);
    this.eventBus.off('window-resized', this.handleResize);
    this.eventBus.off('data-updated');
  }
  
  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  emitEvent(event, data = null) {
    if (this.eventBus) {
      this.eventBus.emit(event, data);
    }
  }
  
  // ==================== 必须实现的抽象方法 ====================
  
  /**
   * 渲染Tab内容 - 子类必须实现
   * @param {HTMLElement} container - 容器元素
   * @returns {Promise<void>}
   */
  async render(container) {
    throw new Error(`Tab ${this.id} 必须实现 render 方法`);
  }
  
  /**
   * 获取Tab的描述信息 - 子类必须实现
   * @returns {string}
   */
  getDescription() {
    throw new Error(`Tab ${this.id} 必须实现 getDescription 方法`);
  }
  
  // ==================== 生命周期钩子方法 ====================
  
  /**
   * Tab激活时调用
   */
  onActivate() {
    console.log(`🐱 Tab激活: ${this.id}`);
    this.isActive = true;
    
    // 更新UI状态
    this.updateTabUI(true);
    
    // 更新页面标题和描述
    this.updatePageInfo();
    
    // 更新搜索栏显示状态
    this.updateSearchBarVisibility();
    
    // 发布Tab内部激活事件
    this.emitEvent('tab-internal-activated', {
      tabId: this.id,
      title: this.title,
      icon: this.icon
    });
  }
  
  /**
   * Tab失活时调用
   */
  onDeactivate() {
    console.log(`🐱 Tab失活: ${this.id}`);
    this.isActive = false;
    
    // 更新UI状态
    this.updateTabUI(false);
    
    // 清理搜索状态
    this.clearSearch();
    
    // 发布Tab内部失活事件
    this.emitEvent('tab-internal-deactivated', {
      tabId: this.id,
      title: this.title
    });
  }
  
  /**
   * Tab销毁时调用
   */
  destroy() {
    console.log(`🐱 Tab销毁: ${this.id}`);
    
    // 清理事件监听器
    this.cleanupEventListeners();
    
    // 清理容器
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    
    // 重置状态
    this.isActive = false;
    this.isInitialized = false;
    
    // 发布Tab销毁事件
    this.emitEvent('tab-destroyed', {
      tabId: this.id,
      title: this.title
    });
  }
  
  // ==================== 可选的事件处理方法 ====================
  
  /**
   * 处理搜索事件 - 子类可重写
   * @param {string} query - 搜索查询
   */
  onSearch(query) {
    console.log(`🔍 Tab ${this.id} 搜索: "${query}"`);
    // 默认实现为空，子类可重写
  }
  
  /**
   * 处理窗口大小变化 - 子类可重写
   */
  onResize() {
    console.log(`📏 Tab ${this.id} 窗口大小变化`);
    // 默认实现为空，子类可重写
  }
  
  /**
   * 处理数据更新事件 - 子类可重写
   * @param {string} action - 更新动作
   * @param {Object} data - 更新数据
   */
  onDataUpdate(action, data) {
    console.log(`📊 Tab ${this.id} 数据更新: ${action}`, data);
    // 默认实现为空，子类可重写
  }
  
  /**
   * 处理状态变更 - 子类可重写此方法
   * @param {Object} stateChangeData - 状态变更数据
   */
  onStateChanged(stateChangeData) {
    console.log(`🔄 [${this.id}] 状态变更: ${stateChangeData.source}`);
    
    // 如果是数据相关的状态变更且当前Tab是激活状态，触发数据更新
    if (this.isActive && stateChangeData.updates && stateChangeData.updates.data) {
      this.onDataUpdate('state-changed', stateChangeData.updates.data);
    }
  }
  
  // ==================== 公共方法 ====================
  
  /**
   * 获取Tab标题
   * @returns {string}
   */
  getTitle() {
    return this.title;
  }
  
  /**
   * 获取Tab图标
   * @returns {string}
   */
  getIcon() {
    return this.icon;
  }
  
  /**
   * 检查是否支持某个功能
   * @param {string} feature - 功能名称
   * @returns {boolean}
   */
  supports(feature) {
    switch (feature) {
      case 'search':
        return this.options.supportSearch;
      default:
        return false;
    }
  }
  
  /**
   * 安全渲染 - 带错误处理的渲染方法
   * @param {HTMLElement} container - 容器元素
   * @returns {Promise<boolean>} 渲染是否成功
   */
  async safeRender(container) {
    try {
      console.log(`🎨 开始渲染Tab: ${this.id}`);
      
      this.container = container;
      
      // 如果已经初始化且支持缓存，跳过重复渲染
      if (this.isInitialized && this.options.cache) {
        console.log(`📋 使用缓存渲染Tab: ${this.id}`);
        return true;
      }
      
      // 显示加载状态
      this.showLoadingState();
      
      // 调用子类的渲染方法
      await this.render(container);
      
      // 隐藏加载状态
      this.hideLoadingState();
      
      // 标记为已初始化
      this.isInitialized = true;
      
      console.log(`✅ Tab渲染完成: ${this.id}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Tab渲染失败: ${this.id}`, error);
      this.showErrorState(error);
      return false;
    }
  }
  
  // ==================== UI辅助方法 ====================
  
  /**
   * 更新Tab UI状态
   * @param {boolean} isActive - 是否激活
   */
  updateTabUI(isActive) {
    // 更新侧边栏中对应的Tab项
    const tabElement = document.querySelector(`[data-tab-id="${this.id}"]`);
    if (tabElement) {
      if (isActive) {
        tabElement.classList.add('active');
      } else {
        tabElement.classList.remove('active');
      }
    }
  }
  
  /**
   * 更新页面信息（标题和描述）
   */
  updatePageInfo() {
    const titleElement = document.getElementById('categoryTitle');
    const descElement = document.getElementById('categoryDesc');
    
    if (titleElement) {
      titleElement.textContent = this.getTitle();
    }
    
    if (descElement) {
      descElement.textContent = this.getDescription();
    }
  }
  
  /**
   * 更新搜索栏可见性
   */
  updateSearchBarVisibility() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
      if (this.options.showSearch) {
        showElement(searchBar);
      } else {
        hideElement(searchBar);
      }
    }
  }
  
  /**
   * 显示加载状态
   */
  showLoadingState() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载 ${this.title}...</p>
        </div>
      `;
    }
  }
  
  /**
   * 隐藏加载状态
   */
  hideLoadingState() {
    const loadingElement = this.container?.querySelector('.loading-state');
    if (loadingElement) {
      loadingElement.remove();
    }
  }
  
  /**
   * 显示错误状态
   * @param {Error} error - 错误对象
   */
  showErrorState(error) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="error-state">
          <div class="error-icon">❌</div>
          <h3>加载失败</h3>
          <p>Tab "${this.title}" 加载时出现错误</p>
          <details>
            <summary>错误详情</summary>
            <pre>${error.message}\n${error.stack}</pre>
          </details>
          <button class="retry-btn" data-tab-id="${this.id}">
            重试
          </button>
        </div>
      `;
      
      // 绑定重试按钮事件
      const retryBtn = this.container.querySelector('.retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          // 通过事件系统请求Tab切换
          this.emitEvent('tab-switch-requested', {
            type: 'bookmark',
            instanceId: 'default',
            data: null
          });
        });
      }
    }
  }
  
  /**
   * 清空容器内容
   */
  clearContainer() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
  
  /**
   * 清理搜索状态
   */
  clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
    }
  }
  
  // ==================== 工具方法 ====================
  
  /**
   * 处理搜索输入 - 统一的搜索处理逻辑
   * @param {string} query - 搜索查询
   */
  handleSearch(query) {
    if (this.supports('search')) {
      this.onSearch(query);
      
      // 发布搜索处理事件
      this.emitEvent('tab-search-handled', {
        tabId: this.id,
        query: query
      });
    }
  }
  
  /**
   * 处理窗口大小变化 - 统一的resize处理逻辑
   */
  handleResize() {
    if (this.isActive) {
      this.onResize();
    }
  }
  
  /**
   * 创建空状态提示
   * @param {string} message - 提示信息
   * @param {string} icon - 图标
   * @returns {HTMLElement} DOM元素
   */
  createEmptyState(message, icon = '📭') {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon">${icon}</div>
      <h3>${message}</h3>
      <p>暂无相关内容</p>
    `;
    return emptyState;
  }
  
  /**
   * 显示通知消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 (info/success/warning/error)
   */
  showNotification(message, type = 'info') {
    // 通过事件系统发布通知
    this.emitEvent('notification-requested', {
      message: message,
      type: type,
      source: this.id
    });
    
    // 备用方案：直接调用全局通知方法
    if (window.linkBoardApp && window.linkBoardApp.showNotification) {
      window.linkBoardApp.showNotification(message, type);
    } else {
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
  }
}

// 导出基类
window.BaseTab = BaseTab; 