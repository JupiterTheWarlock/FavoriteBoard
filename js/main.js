// FavoriteBoard Plugin - 主应用程序
// Tab容器管理器 - 重构后的简化版本

/**
 * ToolboxApp - 主应用程序
 * 负责协调各个子系统，实现更清晰的职责划分
 */
class ToolboxApp {
  constructor() {
    // 核心系统
    this.eventBus = window.eventBus;
    this.stateManager = null;  // 状态管理器
    this.uiManager = null;     // UI管理器
    
    // Tab管理相关
    this.tabContainer = null;  // Tab容器
    this.tabFactory = null;
    this.currentTab = null;
    this.registeredTabs = new Map();
    
    // 数据管理
    this.bookmarkManager = new BookmarkManager();
    this.allLinks = [];
    this.folderTree = [];
    this.folderMap = new Map();
    this.isLoading = true;
    
    // UI元素缓存
    this.searchInput = null;
    
    console.log('🐱 主应用初始化开始...');
    
    // 检查扩展环境
    this.checkExtensionEnvironment();
    
    // 初始化状态管理器
    this.initStateManager();
    
    // 初始化UI管理器
    this.initUIManager();
    
    // 初始化Tab容器
    this.initTabContainer();
    
    // 初始化事件监听
    this.initEventListeners();
    
    // 初始化应用
    this.init();
  }
  
  /**
   * 初始化状态管理器
   */
  initStateManager() {
    try {
      if (!this.eventBus) {
        throw new Error('事件总线不可用');
      }
      
      this.stateManager = new StateManager(this.eventBus);
      
      // 订阅状态变更
      this.setupStateSubscriptions();
      
      console.log('✅ 状态管理器初始化完成');
      
    } catch (error) {
      console.error('❌ 状态管理器初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 初始化UI管理器
   */
  initUIManager() {
    try {
      if (!this.eventBus || !this.stateManager) {
        throw new Error('核心系统不可用');
      }
      
      // 创建UI管理器实例
      this.uiManager = new UIManager(this.eventBus, this.stateManager, this.bookmarkManager);
      
      console.log('✅ UI管理器初始化完成');
      
    } catch (error) {
      console.error('❌ UI管理器初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 初始化Tab容器
   */
  initTabContainer() {
    try {
      if (!this.eventBus || !this.stateManager) {
        throw new Error('核心系统不可用');
      }
      
      // 创建Tab容器实例
      this.tabContainer = new TabContainer(this.eventBus, this.stateManager);
      
      console.log('✅ Tab容器初始化完成');
      
    } catch (error) {
      console.error('❌ Tab容器初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 设置状态订阅
   */
  setupStateSubscriptions() {
    // 监听数据状态变更
    this.stateManager.subscribe(['data.folderTree', 'data.allLinks'], ([folderTree, allLinks]) => {
      // 数据更新时通过UIManager重新渲染文件夹树
      if (folderTree && folderTree.length > 0 && this.uiManager) {
        this.uiManager.renderFolderTree();
      }
    });
    
    // 监听UI状态变更
    this.stateManager.subscribe(['ui.loading'], ([loading]) => {
      if (loading) {
        this.showLoadingState();
      } else {
        this.hideLoadingState();
      }
    });
    
    // 监听Tab状态变更
    this.stateManager.subscribe(['tabs.active'], ([activeTab]) => {
      // Tab切换时的UI更新
      this.updateSearchBarVisibility();
      
      // 更新文件夹树选择状态
      if (activeTab) {
        const [type, instanceId] = activeTab.split(':');
        this.updateFolderTreeSelection(type, instanceId);
      }
    });
    
    console.log('🔗 状态订阅已设置');
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    if (!this.eventBus) {
      console.warn('⚠️ 事件总线不可用，将使用传统事件处理方式');
      return;
    }
    
    console.log('🔗 初始化事件总线监听器...');
    
    // 监听通知请求事件
    this.eventBus.on('notification-requested', (data) => {
      this.showNotification(data.message, data.type);
    }, { unique: true });
    
    // 监听Tab切换完成事件
    this.eventBus.on('tab-switched', (data) => {
      // 更新UI状态
      this.updateSearchBarVisibility();
    }, { unique: true });
    
    // 监听数据刷新请求事件
    this.eventBus.on('data-refresh-requested', () => {
      this.refreshFolderTree();
    }, { unique: true });
    
    // 监听搜索查询变化事件
    this.eventBus.on('search-query-changed', (query) => {
      // 这里可以添加全局搜索处理逻辑
      console.log('🔍 搜索查询变化:', query);
    }, { unique: true });
    
    // 监听窗口大小变化事件
    this.eventBus.on('window-resized', () => {
      // 处理窗口大小变化
      console.log('📏 窗口大小变化');
    }, { unique: true });
    
    // 监听文件夹点击事件
    this.eventBus.on('folder-clicked', (data) => {
      this.handleFolderClick(data.folderId, data.folderData);
    }, { unique: true });
    
    // 监听文件夹操作请求事件
    this.eventBus.on('folder-create-requested', (data) => {
      this.createSubfolder(data.parentId, data.folderName);
    }, { unique: true });
    
    this.eventBus.on('folder-rename-requested', (data) => {
      this.renameFolder(data.folderId, data.newName);
    }, { unique: true });
    
    this.eventBus.on('folder-delete-requested', (data) => {
      this.deleteFolder(data.folderId);
    }, { unique: true });
    
    console.log('✅ 事件总线监听器初始化完成');
  }
  
  /**
   * 检查扩展环境
   */
  checkExtensionEnvironment() {
    console.log('🔍 检查扩展环境...');
    console.log('Chrome对象:', typeof chrome);
    console.log('Chrome runtime:', chrome?.runtime ? '可用' : '不可用');
    console.log('Chrome bookmarks:', chrome?.bookmarks ? '可用' : '不可用');
    console.log('当前URL:', window.location.href);
    console.log('扩展ID:', chrome?.runtime?.id);
    
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      console.warn('⚠️ 扩展环境不可用，某些功能可能无法正常工作');
    }
  }
  
  /**
   * 初始化应用
   */
  async init() {
    try {
      console.log('🚀 初始化主应用...');
      
      // 设置初始加载状态
      this.stateManager.setUIState({ loading: true }, 'app-init');
      
      // 缓存UI元素
      this.cacheUIElements();
      
      // 设置Tab容器的内容容器
      const tabContentContainer = document.getElementById('tabContent');
      this.tabContainer.setContentContainer(tabContentContainer);
      
      // 加载收藏夹数据并处理
      await this.loadAndProcessBookmarksData();
      
      // 注册默认Tab
      this.registerDefaultTabs();
      
      // 切换到默认Tab (Dashboard)
      this.switchToTab('dashboard');
      
      // 绑定事件
      this.bindEvents();
      
      // 监听收藏夹更新
      this.setupBookmarkListeners();
      
      // 完成初始化
      this.stateManager.setUIState({ loading: false }, 'app-init');
      
      console.log('✅ 主应用初始化完成');
      
    } catch (error) {
      console.error('❌ 主应用初始化失败:', error);
      this.stateManager.setUIState({ loading: false }, 'app-init');
      this.showErrorState(error);
    }
  }
  
  /**
   * 缓存UI元素
   */
  cacheUIElements() {
    // 缓存常用UI元素，提高性能
    this.searchInput = document.getElementById('searchInput');
    
    console.log('📦 UI元素缓存完成');
  }
  
  /**
   * 注册默认Tab
   */
  registerDefaultTabs() {
    try {
      console.log('📝 注册默认Tab...');
      
      // 注册Dashboard Tab
      this.tabContainer.registerTab('dashboard');
      
      // 注册"全部"收藏夹Tab
      const allFolderData = {
        id: 'all',
        title: '全部收藏',
        parentId: '0'
      };
      this.tabContainer.registerTab('bookmark', 'all', { folderId: 'all', folderData: allFolderData });
      
      console.log('✅ 默认Tab注册完成');
      
    } catch (error) {
      console.error('❌ 注册默认Tab失败:', error);
    }
  }
  
  /**
   * 注册Tab - 委托给TabContainer
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID（可选，默认为'default'）
   * @param {Object} data - Tab数据（可选）
   * @returns {BaseTab} 注册的Tab实例
   */
  registerTab(type, instanceId = 'default', data = null) {
    return this.tabContainer.registerTab(type, instanceId, data);
  }
  
  /**
   * 切换到指定Tab - 委托给TabContainer
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID（可选，默认为'default'）
   * @param {Object} options - 切换选项（可选）
   * @returns {Promise<BaseTab>} 激活的Tab实例
   */
  async switchToTab(type, instanceId = 'default', options = {}) {
    try {
      const tab = await this.tabContainer.switchToTab(type, instanceId, options);
      
      // 更新文件夹树选择状态
      if (this.uiManager) {
        this.uiManager.updateFolderTreeSelection(type, instanceId);
      }
      
      return tab;
    } catch (error) {
      console.error(`❌ 切换Tab失败: ${type} (${instanceId})`, error);
      throw error;
    }
  }
  
  /**
   * 获取Tab内容容器
   * @returns {HTMLElement} Tab内容容器
   */
  getTabContentContainer() {
    return document.getElementById('tabContent');
  }
  

  
  /**
   * 更新搜索栏可见性
   */
  updateSearchBarVisibility() {
    try {
      // 获取当前激活的Tab
      const activeTab = this.tabContainer.getActiveTab();
      
      if (!activeTab) {
        // 没有激活的Tab，隐藏搜索栏
        if (this.uiManager) {
          this.uiManager.updateSearchBarVisibility(false);
        }
        return;
      }
      
      // 根据Tab配置显示或隐藏搜索栏
      if (this.uiManager) {
        this.uiManager.updateSearchBarVisibility(activeTab.options.showSearch);
      }
      
    } catch (error) {
      console.warn('⚠️ 更新搜索栏可见性失败:', error);
    }
  }
  
  // ==================== 事件处理 ====================
  
  /**
   * 处理文件夹点击事件
   * @param {string} folderId - 文件夹ID
   * @param {Object} folderData - 文件夹数据
   */
  handleFolderClick(folderId, folderData) {
    console.log(`🖱️ 处理文件夹点击: ${folderId}`);
    
    if (folderId === 'dashboard') {
      // 切换到Dashboard
      this.switchToTab('dashboard');
    } else if (folderId) {
      try {
        // 切换到收藏夹Tab
        this.switchToTab('bookmark', folderId, {
          data: {
            folderId: folderId,
            folderData: folderData
          }
        });
      } catch (error) {
        console.error('❌ 切换到文件夹失败:', error);
        if (this.uiManager) {
          this.uiManager.showNotification('切换文件夹时发生错误', 'error');
        }
      }
    }
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    console.log('🔗 绑定事件监听器...');
    
    // 搜索事件
    this.bindSearchEvents();
    
    // 文件夹树事件已移至SidebarManager处理
    
    // Tab右键菜单事件
    this.bindTabContextMenuEvents();
    
    // 窗口大小变化事件
    this.bindWindowEvents();
    
    console.log('✅ 事件绑定完成');
  }
  
  /**
   * 绑定搜索事件
   */
  bindSearchEvents() {
    if (!this.searchInput) return;
    
    // 搜索输入事件
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      this.handleSearch(query);
    });
    
    // 清空搜索按钮
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }
  }
  

  
  /**
   * 绑定Tab右键菜单事件
   */
  bindTabContextMenuEvents() {
    // 获取Tab标题区域
    const categoryInfo = document.getElementById('categoryInfo');
    if (!categoryInfo) {
      console.warn('⚠️ 找不到Tab标题区域元素');
      return;
    }
    
    // 绑定右键菜单事件
    categoryInfo.addEventListener('contextmenu', (e) => {
      // 获取当前激活的Tab
      const activeTab = this.tabContainer.getActiveTab();
      if (!activeTab) return;
      
      // 发布Tab右键菜单请求事件
      this.eventBus.emit('tab-context-menu-requested', {
        event: e,
        tab: activeTab
      });
      
      // 阻止默认右键菜单
      e.preventDefault();
    });
    
    // 创建Tab右键菜单管理器（如果尚未创建）
    if (!this.tabContextMenu) {
      this.tabContextMenu = new TabContextMenu(this.eventBus);
    }
    
    // 监听Tab右键菜单动作
    this.eventBus.on('tab-context-menu-action', (data) => {
      const { action, tab } = data;
      
      switch (action) {
        case 'refresh':
          this.refreshBookmarkData('manual-refresh');
          break;
        case 'openAll':
          if (tab.id === 'bookmark' && tab.currentLinks) {
            this.openAllLinks(tab.currentLinks);
          }
          break;
        case 'export':
          if (tab.id === 'bookmark' && tab.currentLinks) {
            this.exportLinks(tab.currentLinks);
          }
          break;
      }
    }, { unique: true });
    
    console.log('✅ Tab右键菜单事件绑定完成');
  }
  
  /**
   * 绑定窗口事件
   */
  bindWindowEvents() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
      // 发布窗口大小变化事件
      if (this.eventBus) {
        this.eventBus.emit('window-resized');
      }
      
      // 直接通知当前Tab
      const activeTab = this.tabContainer.getActiveTab();
      if (activeTab) {
        activeTab.onResize();
      }
    });
  }
  
  /**
   * 加载并处理收藏夹数据
   */
  async loadAndProcessBookmarksData() {
    try {
      console.log('📊 开始加载收藏夹数据...');
      
      // 从BookmarkManager加载数据
      const bookmarksData = await this.bookmarkManager.loadBookmarks();
      
      if (!bookmarksData) {
        throw new Error('收藏夹数据加载失败');
      }
      
      // 使用StateManager处理数据
      await this.stateManager.processBookmarksData(bookmarksData, 'app-init');
      
      console.log('✅ 收藏夹数据加载并处理完成');
      
    } catch (error) {
      console.error('❌ 收藏夹数据处理失败:', error);
      throw error;
    }
  }
  
  /**
   * 处理搜索
   * @param {string} query - 搜索查询
   */
  handleSearch(query) {
    // 通过事件总线发布搜索查询变化事件
    if (this.eventBus) {
      this.eventBus.emit('search-query-changed', query);
    }
    
    // 获取当前激活的Tab
    const activeTab = this.tabContainer.getActiveTab();
    
    if (!activeTab || !activeTab.supports('search')) {
      return;
    }
    
    // 转发搜索事件到当前Tab
    activeTab.onSearch(query);
    
    // 更新清空按钮显示状态
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }
  }
  
  /**
   * 清空搜索
   */
  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.handleSearch('');
    }
  }
  
  // ==================== 数据管理方法 ====================
  
  /**
   * 加载收藏夹数据
   */

  
  /**
   * 从收藏夹数据生成文件夹树
   */
  /**
   * 获取文件夹及其子文件夹的ID
   * @param {string} folderId - 文件夹ID
   * @returns {Array} 文件夹ID数组
   */
  getFolderAndSubfolderIds(folderId) {
    const folderMap = this.stateManager.getStateValue('data.folderMap') || new Map();
    return DataProcessor.getFolderAndSubfolderIds(folderId, folderMap);
  }
  
  // ==================== 文件夹树渲染 (已移至SidebarManager) ====================
  
  // ==================== 文件夹右键菜单 (已移至ContextMenuManager) ====================
  
  // 旧的文件夹右键菜单处理代码已移除，现在使用 SidebarManager + ContextMenuManager 架构

  // ==================== 工具方法 ====================
  
  /**
   * 监听收藏夹更新
   */
  setupBookmarkListeners() {
    console.log('📡 设置收藏夹更新监听器...');
    
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      // 监听收藏夹变化
      chrome.bookmarks.onCreated.addListener(() => this.handleBookmarkUpdate('created'));
      chrome.bookmarks.onRemoved.addListener(() => this.handleBookmarkUpdate('removed'));
      chrome.bookmarks.onChanged.addListener(() => this.handleBookmarkUpdate('changed'));
      chrome.bookmarks.onMoved.addListener(() => this.handleBookmarkUpdate('moved'));
      
      console.log('✅ 收藏夹监听器设置完成');
    } else {
      console.warn('⚠️ Chrome书签API不可用，跳过监听器设置');
    }
  }
  
  /**
   * 保存文件夹展开状态
   * @returns {Set} 展开的文件夹ID集合
   */
  saveFolderExpandedStates() {
    const expandedIds = new Set();
    
    const traverseTree = (nodes) => {
      nodes.forEach(node => {
        if (node.isExpanded) {
          expandedIds.add(node.id);
        }
        if (node.children && node.children.length > 0) {
          traverseTree(node.children);
        }
      });
    };
    
    traverseTree(this.folderTree);
    return expandedIds;
  }
  
  /**
   * 恢复文件夹展开状态
   * @param {Set} expandedIds - 展开的文件夹ID集合
   */
  restoreFolderExpandedStates(expandedIds) {
    const traverseTree = (nodes) => {
      nodes.forEach(node => {
        if (expandedIds.has(node.id)) {
          node.isExpanded = true;
        }
        if (node.children && node.children.length > 0) {
          traverseTree(node.children);
        }
      });
    };
    
    traverseTree(this.folderTree);
  }
  
  /**
   * 处理收藏夹更新
   */
  async handleBookmarkUpdate(action) {
    console.log('📊 收藏夹数据更新:', action);
    
    try {
      // 保存当前状态
      const currentTab = this.stateManager.getStateValue('tabs.active');
      const expandedIds = this.saveFolderExpandedStates();
      
      // 重新加载并处理数据
      await this.loadAndProcessBookmarksData();
      
      // 恢复展开状态
      this.restoreFolderExpandedStates(expandedIds);
      
      // 恢复选中状态
      if (currentTab) {
        const [type, instanceId] = currentTab.split(':');
        this.updateFolderTreeSelection(type, instanceId);
      }
      
      // 通知当前Tab数据更新
      const currentTabInstance = currentTab ? this.localRegisteredTabs?.get(currentTab) : null;
      
      if (currentTabInstance && currentTabInstance.onDataUpdate) {
        const dataState = this.stateManager.getDataState();
        currentTabInstance.onDataUpdate(action, {
          allLinks: dataState.allLinks,
          folderTree: dataState.folderTree
        });
      }
      
      console.log('✅ 文件夹树更新完成');
      
    } catch (error) {
      console.error('❌ 处理收藏夹更新失败:', error);
    }
  }
  
  // ==================== 状态管理 ====================
  
  /**
   * 显示加载状态
   */
  showLoadingState() {
    const emptyState = this.emptyState;
    const linksGrid = this.linksGrid;
    
    if (emptyState && linksGrid) {
      linksGrid.style.display = 'none';
      emptyState.style.display = 'flex';
      emptyState.innerHTML = `
        <div class="loading-state">
          <div class="loading-icon">🐱</div>
          <div class="loading-text">正在初始化Tab系统...</div>
        </div>
      `;
    }
  }
  
  /**
   * 隐藏加载状态
   */
  hideLoadingState() {
    this.isLoading = false;
    const emptyState = this.emptyState;
    
    if (emptyState) {
      emptyState.style.display = 'none';
    }
  }
  
  /**
   * 显示错误状态
   */
  showErrorState(error) {
    const emptyState = this.emptyState;
    const linksGrid = this.linksGrid;
    
    if (emptyState && linksGrid) {
      linksGrid.style.display = 'none';
      emptyState.style.display = 'flex';
      emptyState.innerHTML = `
        <div class="error-state">
          <div class="error-icon">😿</div>
          <div class="error-text">Tab系统初始化失败</div>
          <div class="error-detail">${error.message}</div>
          <button class="retry-btn" data-action="reload">重试</button>
        </div>
      `;
      
      // 绑定重试按钮事件
      const retryBtn = emptyState.querySelector('.retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          location.reload();
        });
      }
    }
  }
  
  /**
   * 显示通知 - 委托给UIManager
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (this.uiManager) {
      this.uiManager.showNotification(message, type, duration);
    } else {
      // Fallback到console输出
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
  
  // ==================== 文件夹操作API ====================
  
  /**
   * 创建子文件夹
   * @param {string} parentId - 父文件夹ID
   * @param {string} title - 文件夹名称
   */
  async createSubfolder(parentId, title) {
    try {
      console.log(`🐱 创建子文件夹: ${title} in ${parentId}`);
      
      const response = await this.bookmarkManager.sendMessage({
        action: 'createFolder',
        parentId: parentId,
        title: title
      });
      
      if (!response.success) {
        throw new Error(response.error || '创建文件夹失败');
      }
      
      console.log('✅ 文件夹创建成功:', response.folder);
      console.log('🔄 开始刷新界面...');
      
      // 延迟一点时间让Chrome更新缓存
      setTimeout(async () => {
        try {
          await this.refreshFolderTree();
          console.log('✅ 界面刷新完成');
        } catch (error) {
          console.error('❌ 界面刷新失败:', error);
        }
      }, 100);
      
      return response.folder;
      
    } catch (error) {
      console.error('❌ 创建文件夹失败:', error);
      throw error;
    }
  }
  
  /**
   * 重命名文件夹
   * @param {string} folderId - 文件夹ID
   * @param {string} newTitle - 新名称
   */
  async renameFolder(folderId, newTitle) {
    try {
      console.log(`🐱 重命名文件夹: ${folderId} -> ${newTitle}`);
      
      const response = await this.bookmarkManager.sendMessage({
        action: 'renameFolder',
        folderId: folderId,
        title: newTitle
      });
      
      if (!response.success) {
        throw new Error(response.error || '重命名文件夹失败');
      }
      
      console.log('✅ 文件夹重命名成功');
      console.log('🔄 开始刷新界面...');
      
      // 延迟一点时间让Chrome更新缓存
      setTimeout(async () => {
        try {
          await this.refreshFolderTree();
          console.log('✅ 界面刷新完成');
        } catch (error) {
          console.error('❌ 界面刷新失败:', error);
        }
      }, 100);
      
      return response;
      
    } catch (error) {
      console.error('❌ 重命名文件夹失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除文件夹
   * @param {string} folderId - 文件夹ID
   */
  async deleteFolder(folderId) {
    try {
      console.log(`🐱 [ToolboxApp] 删除文件夹开始:`, {
        folderId: folderId,
        folderIdType: typeof folderId,
        folderIdLength: folderId?.length
      });
      
      const response = await this.bookmarkManager.sendMessage({
        action: 'deleteFolder',
        folderId: folderId
      });
      
      console.log(`📨 [ToolboxApp] 后台脚本响应:`, response);
      
      if (!response.success) {
        throw new Error(response.error || '删除文件夹失败');
      }
      
      console.log('✅ 文件夹删除成功');
      
      // 如果当前显示的是被删除的文件夹，切换到Dashboard
      const currentTabKey = this.stateManager.getStateValue('tabs.active');
      const currentTab = currentTabKey ? this.localRegisteredTabs?.get(currentTabKey) : null;
      
      if (currentTab && currentTab.folderId === folderId) {
        console.log('🔄 切换到Dashboard（删除的是当前文件夹）');
        this.switchToTab('dashboard');
      }
      
      console.log('🔄 开始刷新界面...');
      
      // 延迟一点时间让Chrome更新缓存
      setTimeout(async () => {
        try {
          await this.refreshFolderTree();
          console.log('✅ 界面刷新完成');
        } catch (error) {
          console.error('❌ 界面刷新失败:', error);
        }
      }, 100);
      
      return response;
      
    } catch (error) {
      console.error('❌ 删除文件夹失败:', error);
      throw error;
    }
  }
  
  /**
   * 刷新文件夹树 - 简化版本
   */
  async refreshFolderTree() {
    try {
      console.log('📊 开始刷新文件夹树数据...');
      
      // 保存当前状态
      const currentTab = this.stateManager.getStateValue('tabs.active');
      const expandedIds = this.saveFolderExpandedStates();
      
      console.log('💾 已保存当前状态:', { currentTab, expandedCount: expandedIds.size });
      
      // 强制刷新BookmarkManager缓存
      await this.bookmarkManager.refreshCache();
      console.log('✅ BookmarkManager缓存已刷新');
      
      // 重新加载并处理数据
      await this.loadAndProcessBookmarksData();
      console.log('✅ 数据已重新加载并处理');
      
      // 恢复展开状态
      this.restoreFolderExpandedStates(expandedIds);
      console.log('✅ 展开状态已恢复');
      
      // 恢复选中状态
      if (currentTab && this.uiManager) {
        const [type, instanceId] = currentTab.split(':');
        this.uiManager.updateFolderTreeSelection(type, instanceId);
        console.log('✅ 选中状态已恢复');
      }
      
      // 通知当前Tab数据更新
      const currentTabInstance = currentTab ? this.localRegisteredTabs?.get(currentTab) : null;
      
      if (currentTabInstance && currentTabInstance.onDataUpdate) {
        const dataState = this.stateManager.getDataState();
        currentTabInstance.onDataUpdate('manual-refresh', {
          allLinks: dataState.allLinks,
          folderTree: dataState.folderTree
        });
        console.log('✅ 当前Tab已通知数据更新');
      }
      
      console.log('🎉 文件夹树刷新完成！');
      
    } catch (error) {
      console.error('❌ 刷新文件夹树失败:', error);
      throw error;
    }
  }
  
  // ==================== 对话框工具类 ====================
  
  /**
   * 创建对话框
   * @param {Object} options - 对话框选项
   * @returns {Object} 对话框对象
   */
  createDialog(options) {
    const {
      title = '确认',
      message = '',
      warning = '',
      type = 'confirm', // 'confirm', 'input'
      inputValue = '',
      inputPlaceholder = '',
      confirmText = '确认',
      cancelText = '取消',
      isDangerous = false
    } = options;
    
    // 创建对话框容器
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = `dialog ${isDangerous ? 'dialog-danger' : ''}`;
    
    let inputElement = null;
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3 class="dialog-title">${title}</h3>
      </div>
      <div class="dialog-body">
        ${message ? `<p class="dialog-message">${message}</p>` : ''}
        ${warning ? `<p class="dialog-warning">${warning}</p>` : ''}
        ${type === 'input' ? `
          <div class="dialog-input-group">
            <input type="text" class="dialog-input" value="${inputValue}" placeholder="${inputPlaceholder}" />
          </div>
        ` : ''}
      </div>
      <div class="dialog-footer">
        <button class="dialog-btn dialog-btn-cancel">${cancelText}</button>
        <button class="dialog-btn dialog-btn-confirm ${isDangerous ? 'btn-danger' : ''}">${confirmText}</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    
    if (type === 'input') {
      inputElement = dialog.querySelector('.dialog-input');
    }
    
    // 对话框对象
    const dialogObj = {
      element: overlay,
      onConfirm: null,
      onCancel: null,
      
      show() {
        document.body.appendChild(overlay);
        
        // 显示动画
        setTimeout(() => {
          overlay.classList.add('show');
        }, 10);
        
        // 聚焦输入框
        if (inputElement) {
          setTimeout(() => {
            inputElement.focus();
            inputElement.select();
          }, 100);
        }
        
        // 绑定事件
        this.bindEvents();
      },
      
      hide() {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      },
      
      bindEvents() {
        // 取消按钮
        const cancelBtn = dialog.querySelector('.dialog-btn-cancel');
        cancelBtn.addEventListener('click', () => {
          if (this.onCancel) {
            this.onCancel();
          }
          this.hide();
        });
        
        // 确认按钮
        const confirmBtn = dialog.querySelector('.dialog-btn-confirm');
        const handleConfirm = async () => {
          if (this.onConfirm) {
            const inputValue = inputElement ? inputElement.value : null;
            const result = await this.onConfirm(inputValue);
            
            // 如果返回true，关闭对话框
            if (result !== false) {
              this.hide();
            }
          } else {
            this.hide();
          }
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        
        // 回车键确认
        if (inputElement) {
          inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
            }
          });
        }
        
        // ESC键取消
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            if (this.onCancel) {
              this.onCancel();
            }
            this.hide();
          }
        });
        
        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            if (this.onCancel) {
              this.onCancel();
            }
            this.hide();
          }
        });
      }
    };
    
    return dialogObj;
  }
}

// ==================== 应用启动 ====================

// 应用初始化由 js/core/init.js 负责，避免重复初始化

// 导出到全局作用域以便其他脚本使用
window.ToolboxApp = ToolboxApp; 