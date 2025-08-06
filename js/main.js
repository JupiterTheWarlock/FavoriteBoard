// FavoriteBoard Plugin - 主应用程序
// 应用容器/协调器 - 重构后的模块化架构

/**
 * ToolboxApp - 主应用程序
 * 负责协调各个子系统，实现清晰的模块化架构
 * 符合SOLID原则，实现单一职责、松耦合的设计
 */
class ToolboxApp {
  constructor() {
    // 核心系统
    this.eventBus = window.eventBus;
    this.stateManager = null;  // 状态管理器
    this.uiManager = null;     // UI管理器
    
    // Tab管理相关
    this.tabContainer = null;  // Tab容器
    
    // 数据管理
    this.bookmarkManager = new BookmarkManager();
    this.frequentlyUsedManager = null; // 将在initStateManager后初始化
    
    // UI元素缓存
    this.searchInput = null;
    
    console.log('🐱 主应用初始化开始...');
    
    // 检查扩展环境
    this.checkExtensionEnvironment();
    
    // 初始化状态管理器
    this.initStateManager();
    
    // 初始化常用网页管理器
    this.initFrequentlyUsedManager();
    
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
   * 初始化常用网页管理器
   */
  initFrequentlyUsedManager() {
    try {
      if (!this.eventBus) {
        throw new Error('事件总线不可用');
      }
      
      this.frequentlyUsedManager = new FrequentlyUsedManager(this.eventBus);
      
      console.log('✅ 常用网页管理器初始化完成');
      
    } catch (error) {
      console.error('❌ 常用网页管理器初始化失败:', error);
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
    
    // UI状态变更已由UIManager处理
    
    // 监听Tab状态变更
    this.stateManager.subscribe(['tabs.active'], ([activeTab]) => {
      // Tab切换时的UI更新
      this.updateSearchBarVisibility();
      
      // 更新文件夹树选择状态
      if (activeTab && this.uiManager) {
        const [type, instanceId] = activeTab.split(':');
        this.uiManager.updateFolderTreeSelection(type, instanceId);
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
    
    // 监听Tab切换完成事件
    this.eventBus.on('tab-switched', (data) => {
      // 更新UI状态
      this.updateSearchBarVisibility();
    }, { unique: true });
    
    // 监听数据刷新请求事件
    this.eventBus.on('data-refresh-requested', () => {
      this.refreshFolderTree();
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
    
    // 监听常用网页相关事件
    this.eventBus.on('frequently-used-added', (data) => {
      console.log('⭐ 常用网页已添加:', data.url);
      this.showNotification('已添加到常用网页', 'success');
    }, { unique: true });
    
    this.eventBus.on('frequently-used-removed', (data) => {
      console.log('🗑️ 常用网页已移除:', data.url);
      this.showNotification('已从常用网页移除', 'info');
    }, { unique: true });
    
    this.eventBus.on('frequently-used-updated', (data) => {
      console.log('🔄 常用网页已更新:', data.url);
    }, { unique: true });
    
    this.eventBus.on('frequently-used-error', (error) => {
      console.error('❌ 常用网页操作失败:', error);
      this.showNotification('操作失败，请稍后重试', 'error');
    }, { unique: true });
    
    // 监听常用网页请求事件
    this.eventBus.on('frequently-used-add-requested', (data) => {
      this.addFrequentlyUsedWebsite(data.url, data.bookmarkData);
    }, { unique: true });
    
    this.eventBus.on('frequently-used-remove-requested', (data) => {
      this.removeFrequentlyUsedWebsite(data.url);
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
      // 错误状态显示已由UIManager处理
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
      // 发布窗口大小变化事件（UIManager会处理）
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
    
    // 清空按钮状态更新已由UIManager处理
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
   * 获取文件夹及其子文件夹的ID
   * @param {string} folderId - 文件夹ID
   * @returns {Array} 文件夹ID数组
   */
  getFolderAndSubfolderIds(folderId) {
    const folderMap = this.stateManager.getStateValue('data.folderMap') || new Map();
    return DataProcessor.getFolderAndSubfolderIds(folderId, folderMap);
  }
  
  // 文件夹树渲染和右键菜单功能已移至对应的Manager

  // ==================== 工具方法 ====================
  
  /**
   * 监听收藏夹更新
   */
  setupBookmarkListeners() {
    console.log('📡 设置收藏夹更新监听器...');
    
    // 监听BookmarkManager的更新事件
    this.bookmarkManager.on('bookmarks-updated', (eventData) => {
      console.log('📡 收到BookmarkManager更新事件:', eventData);
      this.handleBookmarkUpdate(eventData.action);
    });
    
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
  
  // 文件夹展开状态管理已移至SidebarManager
  
  /**
   * 处理收藏夹更新
   */
  async handleBookmarkUpdate(action) {
    console.log('📊 收藏夹数据更新:', action);
    
    try {
      // 保存当前状态
      const currentTab = this.stateManager.getStateValue('tabs.active');
      // 文件夹展开状态管理已移至SidebarManager
      
      // 重新加载并处理数据
      await this.loadAndProcessBookmarksData();
      
      // 文件夹状态恢复已移至SidebarManager
      
      // 恢复选中状态
      if (currentTab && this.uiManager) {
        const [type, instanceId] = currentTab.split(':');
        this.uiManager.updateFolderTreeSelection(type, instanceId);
      }
      
      // 通知当前Tab数据更新（已由事件总线处理）
      this.eventBus.emit('data-updated', {
        action,
        data: this.stateManager.getDataState()
      });
      
      console.log('✅ 文件夹树更新完成');
      
    } catch (error) {
      console.error('❌ 处理收藏夹更新失败:', error);
    }
  }
  // UI状态和通知管理已移至UIManager及其子组件
  
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
  
  // ==================== 常用网页操作API ====================
  
  /**
   * 添加常用网页
   * @param {string} url - 网页URL
   * @param {Object} bookmarkData - 收藏夹数据
   * @returns {Promise<Object>} 添加结果
   */
  async addFrequentlyUsedWebsite(url, bookmarkData) {
    try {
      console.log('⭐ 添加常用网页:', url);
      
      const result = await this.frequentlyUsedManager.addFrequentlyUsedWebsite(url, bookmarkData);
      
      // 触发事件通知其他组件
      this.eventBus.emit('frequently-used-data-changed', {
        action: 'added',
        url: url,
        data: result.data
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ 添加常用网页失败:', error);
      throw error;
    }
  }
  
  /**
   * 移除常用网页
   * @param {string} url - 网页URL
   * @returns {Promise<Object>} 移除结果
   */
  async removeFrequentlyUsedWebsite(url) {
    try {
      console.log('🗑️ 移除常用网页:', url);
      
      const result = await this.frequentlyUsedManager.removeFrequentlyUsedWebsite(url);
      
      // 触发事件通知其他组件
      this.eventBus.emit('frequently-used-data-changed', {
        action: 'removed',
        url: url,
        data: result.data
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ 移除常用网页失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取常用网页列表
   * @returns {Promise<Object>} 常用网页数据
   */
  async getFrequentlyUsedWebsites() {
    try {
      return await this.frequentlyUsedManager.getFrequentlyUsedWebsites();
    } catch (error) {
      console.error('❌ 获取常用网页失败:', error);
      throw error;
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
          // 确保父文件夹将被展开显示
          if (this.uiManager && this.uiManager.getSidebarManager()) {
            // 获取SidebarManager实例
            const sidebarManager = this.uiManager.getSidebarManager();
            // 将父文件夹添加到展开状态集合中
            sidebarManager.expandedFolders.add(parentId);
            console.log('✅ 已将父文件夹标记为展开状态:', parentId);
          }
          
          // 刷新文件夹树
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
      const activeTab = this.tabContainer.getActiveTab();
      
      if (activeTab && activeTab.folderId === folderId) {
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
      // 文件夹展开状态管理已移至SidebarManager
      
      console.log('💾 已保存当前状态:', { currentTab });
      
      // 强制刷新BookmarkManager缓存
      await this.bookmarkManager.refreshCache();
      console.log('✅ BookmarkManager缓存已刷新');
      
      // 重新加载并处理数据
      await this.loadAndProcessBookmarksData();
      console.log('✅ 数据已重新加载并处理');
      
      // 文件夹状态恢复已移至SidebarManager
      console.log('✅ 状态恢复已委托给SidebarManager');
      
      // 恢复选中状态
      if (currentTab && this.uiManager) {
        const [type, instanceId] = currentTab.split(':');
        this.uiManager.updateFolderTreeSelection(type, instanceId);
        console.log('✅ 选中状态已恢复');
      }
      
      // 通知当前Tab数据更新（已由事件总线处理）
      this.eventBus.emit('data-updated', {
        action: 'manual-refresh',
        data: this.stateManager.getDataState()
      });
      console.log('✅ 当前Tab已通知数据更新');
      
      console.log('🎉 文件夹树刷新完成！');
      
    } catch (error) {
      console.error('❌ 刷新文件夹树失败:', error);
      throw error;
    }
  }
  
  // ==================== 便捷访问方法 ====================
  
  /**
   * 获取对话框管理器
   * @returns {DialogManager|null}
   */
  get dialogManager() {
    return this.uiManager?.getDialogManager() || null;
  }
  
  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型
   */
  showNotification(message, type = 'info') {
    if (this.uiManager) {
      this.uiManager.showNotification(message, type);
    }
  }
}

// ==================== 应用启动 ====================

// 应用初始化由 js/core/init.js 负责，避免重复初始化

// 导出到全局作用域以便其他脚本使用
window.ToolboxApp = ToolboxApp; 