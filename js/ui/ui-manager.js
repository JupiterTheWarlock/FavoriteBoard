/**
 * UIManager - UI管理器
 * 负责协调各个UI组件，提供统一的UI管理接口
 */
class UIManager {
  constructor(eventBus, stateManager, bookmarkManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.bookmarkManager = bookmarkManager;
    
    // UI子组件管理器
    this.sidebarManager = null;
    this.dialogManager = null;
    this.contextMenuManager = null;
    this.notificationManager = null;
    
    // UI状态
    this.currentTheme = 'light';
    this.isInitialized = false;
    
    console.log('🎨 UIManager初始化开始...');
    
    // 初始化UI组件
    this.initUIComponents();
    
    // 设置事件监听
    this.setupEventListeners();
    
    console.log('✅ UIManager初始化完成');
  }
  
  /**
   * 初始化UI组件
   */
  initUIComponents() {
    try {
      console.log('📦 初始化UI子组件...');
      
      // 初始化通知管理器（优先级最高，其他组件可能需要用到）
      this.notificationManager = new NotificationManager(this.eventBus);
      
      // 初始化对话框管理器
      this.dialogManager = new DialogManager(this.eventBus, this.notificationManager);
      
      // 初始化右键菜单管理器
      this.contextMenuManager = new ContextMenuManager(this.eventBus, this.dialogManager);
      
      // 初始化侧边栏管理器
      this.sidebarManager = new SidebarManager(this.eventBus, this.stateManager, this.contextMenuManager, this.bookmarkManager);
      
      console.log('✅ UI子组件初始化完成');
      
    } catch (error) {
      console.error('❌ UI子组件初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    console.log('🔗 设置UIManager事件监听...');
    
    // 监听主题变更事件
    this.eventBus.on('theme-changed', (theme) => {
      this.handleThemeChange(theme);
    }, { unique: true });
    
    // 监听窗口大小变化事件
    this.eventBus.on('window-resized', () => {
      this.handleWindowResize();
    }, { unique: true });
    
    // 监听UI状态变更事件
    this.eventBus.on('ui-state-changed', (state) => {
      this.handleUIStateChange(state);
    }, { unique: true });
    
    // 监听加载状态变更
    this.stateManager.subscribe(['ui.loading'], ([loading]) => {
      this.handleLoadingStateChange(loading);
    });
    
    console.log('✅ UIManager事件监听设置完成');
  }
  
  /**
   * 获取侧边栏管理器
   * @returns {SidebarManager}
   */
  getSidebarManager() {
    return this.sidebarManager;
  }
  
  /**
   * 获取对话框管理器
   * @returns {DialogManager}
   */
  getDialogManager() {
    return this.dialogManager;
  }
  
  /**
   * 获取右键菜单管理器
   * @returns {ContextMenuManager}
   */
  getContextMenuManager() {
    return this.contextMenuManager;
  }
  
  /**
   * 获取通知管理器
   * @returns {NotificationManager}
   */
  getNotificationManager() {
    return this.notificationManager;
  }
  
  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型 ('info', 'success', 'warning', 'error')
   * @param {number} duration - 显示持续时间（毫秒）
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (this.notificationManager) {
      this.notificationManager.show(message, type, duration);
    } else {
      console.warn('⚠️ NotificationManager不可用，使用fallback通知');
      // Fallback到简单的alert（仅在开发阶段）
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
  
  /**
   * 创建对话框
   * @param {Object} options - 对话框选项
   * @returns {Object} 对话框对象
   */
  createDialog(options) {
    if (this.dialogManager) {
      return this.dialogManager.create(options);
    } else {
      throw new Error('DialogManager不可用');
    }
  }
  
  /**
   * 显示文件夹右键菜单
   * @param {Event} event - 鼠标事件
   * @param {string} folderId - 文件夹ID
   * @param {Object} folderData - 文件夹数据
   */
  showFolderContextMenu(event, folderId, folderData) {
    if (this.contextMenuManager) {
      this.contextMenuManager.showFolderMenu(event, folderId, folderData);
    } else {
      console.warn('⚠️ ContextMenuManager不可用');
    }
  }
  
  /**
   * 显示Tab右键菜单
   * @param {Event} event - 鼠标事件
   * @param {Object} tab - Tab对象
   */
  showTabContextMenu(event, tab) {
    if (this.contextMenuManager) {
      this.contextMenuManager.showTabMenu(event, tab);
    } else {
      console.warn('⚠️ ContextMenuManager不可用');
    }
  }
  
  /**
   * 渲染文件夹树
   */
  renderFolderTree() {
    if (this.sidebarManager) {
      this.sidebarManager.renderFolderTree();
    } else {
      console.warn('⚠️ SidebarManager不可用');
    }
  }
  
  /**
   * 更新文件夹树选择状态
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID
   */
  updateFolderTreeSelection(type, instanceId) {
    if (this.sidebarManager) {
      this.sidebarManager.updateSelection(type, instanceId);
    } else {
      console.warn('⚠️ SidebarManager不可用');
    }
  }
  
  /**
   * 更新搜索栏可见性
   * @param {boolean} visible - 是否可见
   */
  updateSearchBarVisibility(visible) {
    try {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        const searchContainer = searchInput.parentElement;
        searchContainer.style.display = visible ? 'flex' : 'none';
      }
    } catch (error) {
      console.warn('⚠️ 更新搜索栏可见性失败:', error);
    }
  }
  
  /**
   * 处理主题变更
   * @param {string} theme - 主题名称
   */
  handleThemeChange(theme) {
    console.log(`🎨 主题变更: ${this.currentTheme} -> ${theme}`);
    
    this.currentTheme = theme;
    
    // 应用主题到根元素
    document.documentElement.setAttribute('data-theme', theme);
    
    // 通知子组件主题变更
    this.sidebarManager?.onThemeChange(theme);
    this.dialogManager?.onThemeChange(theme);
    this.contextMenuManager?.onThemeChange(theme);
    this.notificationManager?.onThemeChange(theme);
  }
  
  /**
   * 处理窗口大小变化
   */
  handleWindowResize() {
    console.log('📏 处理窗口大小变化');
    
    // 通知子组件窗口大小变化
    this.sidebarManager?.onWindowResize();
    this.dialogManager?.onWindowResize();
    this.contextMenuManager?.onWindowResize();
  }
  
  /**
   * 处理UI状态变更
   * @param {Object} state - UI状态
   */
  handleUIStateChange(state) {
    console.log('🔄 UI状态变更:', state);
    
    // 根据状态更新UI
    if (state.loading !== undefined) {
      this.handleLoadingStateChange(state.loading);
    }
    
    if (state.theme !== undefined) {
      this.handleThemeChange(state.theme);
    }
  }
  
  /**
   * 处理加载状态变更
   * @param {boolean} loading - 是否加载中
   */
  handleLoadingStateChange(loading) {
    console.log(`⏳ 加载状态变更: ${loading ? '开始' : '结束'}`);
    
    const body = document.body;
    if (body) {
      if (loading) {
        body.classList.add('loading');
      } else {
        body.classList.remove('loading');
      }
    }
    
    // 通知子组件加载状态变更
    this.sidebarManager?.onLoadingStateChange(loading);
  }
  
  /**
   * 显示加载状态
   * @param {string} message - 加载消息
   */
  showLoadingState(message = '正在加载...') {
    // 可以在这里实现全局加载状态显示
    console.log(`⏳ ${message}`);
    this.stateManager.setUIState({ loading: true }, 'ui-manager');
  }
  
  /**
   * 隐藏加载状态
   */
  hideLoadingState() {
    console.log('✅ 加载完成');
    this.stateManager.setUIState({ loading: false }, 'ui-manager');
  }
  
  /**
   * 显示错误状态
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  showErrorState(error, context = 'unknown') {
    console.error(`❌ 错误状态 [${context}]:`, error);
    
    // 显示错误通知
    this.showNotification(
      `操作失败: ${error.message}`,
      'error',
      5000
    );
    
    // 发布错误事件
    this.eventBus.emit('error-occurred', {
      error,
      context,
      timestamp: Date.now()
    });
  }
  
  /**
   * 清理资源
   */
  destroy() {
    console.log('🧹 清理UIManager资源...');
    
    // 清理子组件
    this.sidebarManager?.destroy();
    this.dialogManager?.destroy();
    this.contextMenuManager?.destroy();
    this.notificationManager?.destroy();
    
    // 清理引用
    this.sidebarManager = null;
    this.dialogManager = null;
    this.contextMenuManager = null;
    this.notificationManager = null;
    
    this.isInitialized = false;
    
    console.log('✅ UIManager资源清理完成');
  }
}

// 导出UIManager类
window.UIManager = UIManager; 