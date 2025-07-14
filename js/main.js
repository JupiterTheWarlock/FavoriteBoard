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
    
    // Tab管理相关
    this.tabContainer = null;  // Tab容器
    
    // 数据管理
    this.bookmarkManager = new BookmarkManager();
    
    // UI元素缓存
    this.searchInput = null;
    
    // 文件夹右键菜单相关
    this.currentFolderContextMenu = null;
    this.currentFolderForContext = null;
    
    console.log('🐱 主应用初始化开始...');
    
    // 检查扩展环境
    this.checkExtensionEnvironment();
    
    // 初始化状态管理器
    this.initStateManager();
    
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
      // 数据更新时重新渲染文件夹树
      if (folderTree && folderTree.length > 0) {
        this.renderFolderTree();
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
    });
    
    // 监听Tab切换完成事件
    this.eventBus.on('tab-switched', (data) => {
      // 更新UI状态
      this.updateSearchBarVisibility();
    });
    
    // 监听数据刷新请求事件
    this.eventBus.on('data-refresh-requested', () => {
      this.refreshFolderTree();
    });
    
    // 监听搜索查询变化事件
    this.eventBus.on('search-query-changed', (query) => {
      // 这里可以添加全局搜索处理逻辑
      console.log('🔍 搜索查询变化:', query);
    });
    
    // 监听窗口大小变化事件
    this.eventBus.on('window-resized', () => {
      // 处理窗口大小变化
      console.log('📏 窗口大小变化');
    });
    
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
      this.updateFolderTreeSelection(type, instanceId);
      
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
   * 更新文件夹树选择状态
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID
   */
  updateFolderTreeSelection(type, instanceId) {
    try {
      // 移除所有选中状态
      const allItems = document.querySelectorAll('.tree-item');
      allItems.forEach(item => item.classList.remove('active'));
      
      // 根据Tab类型和实例ID设置选中状态
      if (type === 'dashboard') {
        // 选中Dashboard
        const dashboardItem = document.querySelector('.tree-item[data-folder-id="dashboard"]');
        if (dashboardItem) {
          dashboardItem.classList.add('active');
        }
      } else if (type === 'bookmark') {
        // 选中对应的文件夹
        const folderItem = document.querySelector(`.tree-item[data-folder-id="${instanceId}"]`);
        if (folderItem) {
          folderItem.classList.add('active');
          
          // 确保父文件夹都展开
          this.ensureParentFoldersExpanded(folderItem);
        }
      }
    } catch (error) {
      console.warn('⚠️ 更新文件夹树选择状态失败:', error);
    }
  }
  
  /**
   * 确保父文件夹都展开
   * @param {HTMLElement} folderItem - 文件夹元素
   */
  ensureParentFoldersExpanded(folderItem) {
    let parent = folderItem.parentElement.closest('.tree-item');
    while (parent) {
      const toggle = parent.querySelector('.tree-toggle');
      if (toggle && !parent.classList.contains('expanded')) {
        toggle.click();
      }
      parent = parent.parentElement.closest('.tree-item');
    }
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
        if (this.searchInput) {
          this.searchInput.parentElement.style.display = 'none';
        }
        return;
      }
      
      // 根据Tab配置显示或隐藏搜索栏
      if (this.searchInput) {
        const searchContainer = this.searchInput.parentElement;
        searchContainer.style.display = activeTab.options.showSearch ? 'flex' : 'none';
      }
      
    } catch (error) {
      console.warn('⚠️ 更新搜索栏可见性失败:', error);
    }
  }
  
  // ==================== 事件处理 ====================
  
  /**
   * 绑定事件
   */
  bindEvents() {
    console.log('🔗 绑定事件监听器...');
    
    // 搜索事件
    this.bindSearchEvents();
    
    // 文件夹树点击事件
    this.bindFolderTreeEvents();
    
    // 文件夹树展开/折叠事件
    this.bindTreeToggleEvents();
    
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
   * 绑定文件夹树事件
   */
  bindFolderTreeEvents() {
    const folderTree = document.getElementById('folderTree');
    if (!folderTree) return;
    
    // 左键点击事件
    folderTree.addEventListener('click', (e) => {
      // 如果点击的是展开/折叠按钮，则不处理文件夹点击
      if (e.target.closest('.tree-toggle')) {
        return;
      }
      
      const treeItem = e.target.closest('.tree-item');
      if (!treeItem) return;
      
      const folderId = treeItem.dataset.folderId;
      console.log(`🖱️ 点击文件夹: ${folderId}`);
      
      if (folderId === 'dashboard') {
        // 切换到Dashboard
        this.switchToTab('dashboard');
      } else if (folderId) {
        // 切换到收藏夹Tab
        const folderMap = this.stateManager.getStateValue('data.folderMap') || new Map();
        const allLinks = this.stateManager.getStateValue('data.allLinks') || [];
        const folderData = folderMap.get(folderId);
        console.log(`📁 文件夹数据:`, folderData);
        console.log(`🗂️ 文件夹映射表大小: ${folderMap.size}`);
        console.log(`📊 所有链接数量: ${allLinks.length}`);
        
        // 修复：正确传递参数给switchToTab方法
        // 原来的代码：this.switchToTab('bookmark', folderId, folderData);
        // 修复后的代码：
        this.switchToTab('bookmark', folderId, {
          data: {
            folderId: folderId,
            folderData: folderData
          }
        });
      }
    });
    
    // 右键菜单事件
    folderTree.addEventListener('contextmenu', (e) => {
      const treeItem = e.target.closest('.tree-item');
      if (!treeItem) return;
      
      const folderId = treeItem.dataset.folderId;
      
      // Dashboard不显示右键菜单
      if (folderId === 'dashboard' || folderId === 'all') {
        return;
      }
      
      e.preventDefault();
      this.showFolderContextMenu(e, folderId, treeItem);
    });
    
    // 绑定全局点击事件隐藏右键菜单
    this.bindFolderContextMenuEvents();
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
  
  // ==================== 文件夹树渲染 ====================
  
  /**
   * 渲染文件夹树
   */
  renderFolderTree() {
    const folderTreeContainer = document.getElementById('folderTree');
    if (!folderTreeContainer) return;
    
    // 清空现有内容
    folderTreeContainer.innerHTML = '';
    
    // 添加Dashboard节点
    const dashboardNode = this.createDashboardNode();
    folderTreeContainer.appendChild(dashboardNode);
    
    // 从StateManager获取文件夹树数据
    const folderTree = this.stateManager.getStateValue('data.folderTree') || [];
    
    // 渲染文件夹树
    folderTree.forEach(node => {
      this.renderTreeNode(node, folderTreeContainer, 0);
    });
    
    console.log('🌳 文件夹树渲染完成');
  }
  
  /**
   * 递归渲染树节点
   * @param {Object} node - 节点数据
   * @param {HTMLElement} container - 容器元素
   * @param {number} depth - 层级深度
   */
  renderTreeNode(node, container, depth = 0) {
    // 创建节点元素
    const nodeElement = this.createTreeNodeElement(node, depth);
    container.appendChild(nodeElement);
    
    // 如果有子节点且展开状态，递归渲染子节点
    if (node.children && node.children.length > 0 && node.isExpanded) {
      node.children.forEach(child => {
        this.renderTreeNode(child, container, depth + 1);
      });
    }
  }
  
  /**
   * 创建树节点元素
   * @param {Object} node - 节点数据
   * @param {number} depth - 层级深度
   * @returns {HTMLElement} 节点元素
   */
  createTreeNodeElement(node, depth = 0) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    item.dataset.folderId = node.id;
    item.dataset.depth = depth;
    item.style.paddingLeft = `${depth * 20 + 12}px`;
    
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.isExpanded || false;
    
    item.innerHTML = `
      <div class="tree-content">
        ${hasChildren ? 
          `<span class="tree-toggle ${isExpanded ? 'expanded' : ''}" data-folder-id="${node.id}">▶</span>` : 
          '<span class="tree-spacer" style="width: 20px; display: inline-block;"></span>'
        }
        <span class="tree-icon">${node.icon}</span>
        <span class="tree-title">${node.title}</span>
        <span class="bookmark-count">${node.bookmarkCount || 0}</span>
      </div>
    `;
    
    return item;
  }
  
  /**
   * 绑定树节点展开/折叠事件 - 只初始化时调用一次
   */
  bindTreeToggleEvents() {
    const folderTree = document.getElementById('folderTree');
    if (!folderTree) return;
    
    // 使用事件委托，只绑定一次
    folderTree.addEventListener('click', (e) => {
      const toggle = e.target.closest('.tree-toggle');
      if (!toggle) return;
      
      e.stopPropagation(); // 阻止冒泡到父节点点击事件
      e.preventDefault(); // 阻止默认行为
      
      const folderId = toggle.dataset.folderId;
      this.toggleTreeNode(folderId);
    });
    
    console.log('🔗 树节点展开/折叠事件绑定完成');
  }
  
  /**
   * 切换树节点展开/折叠状态
   * @param {string} folderId - 文件夹ID
   */
  toggleTreeNode(folderId) {
    const folderMap = this.stateManager.getStateValue('data.folderMap') || new Map();
    const folder = folderMap.get(folderId);
    if (!folder || !folder.children || folder.children.length === 0) return;
    
    // 获取当前激活的Tab信息
    const activeTab = this.tabContainer.getActiveTab();
    const activeTabType = activeTab?.id;
    const activeTabInstanceId = this.tabContainer.getTabInstanceId(activeTab);
    
    // 切换展开状态
    folder.isExpanded = !folder.isExpanded;
    
    // 重新渲染文件夹树（但不重新绑定事件）
    this.renderFolderTree();
    
    // 恢复Tab选中状态
    if (activeTabType && activeTabInstanceId) {
      this.updateFolderTreeSelection(activeTabType, activeTabInstanceId);
    }
  }
  
  /**
   * 创建Dashboard节点
   */
  createDashboardNode() {
    const dashboardItem = document.createElement('div');
    dashboardItem.className = 'tree-item dashboard-item';
    dashboardItem.dataset.folderId = 'dashboard';
    dashboardItem.innerHTML = `
      <div class="tree-content">
        <span class="tree-icon">📊</span>
        <span class="tree-title">Dashboard</span>
      </div>
    `;
    return dashboardItem;
  }
  
  // ==================== 文件夹右键菜单 ====================
  

  
  /**
   * 显示文件夹右键菜单
   * @param {Event} event - 鼠标事件
   * @param {string} folderId - 文件夹ID
   * @param {HTMLElement} treeItem - 树节点元素
   */
  showFolderContextMenu(event, folderId, treeItem) {
    // 隐藏之前的菜单
    this.hideFolderContextMenu();
    
    const folderMap = this.stateManager.getStateValue('data.folderMap') || new Map();
    const folderData = folderMap.get(folderId);
    if (!folderData) {
      console.warn(`🐱 文件夹数据不存在: ${folderId}`);
      return;
    }
    
    this.currentFolderForContext = folderData;
    
    // 检查是否为根文件夹（可删除性检查）
    const isRootFolder = this.isRootFolder(folderData);
    
    // 创建菜单
    const menu = document.createElement('div');
    menu.className = 'folder-context-menu show';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="createSubfolder">
        <span class="icon">📁</span>
        <span class="menu-text">创建子文件夹</span>
      </div>
      <div class="context-menu-item" data-action="rename">
        <span class="icon">✏️</span>
        <span class="menu-text">重命名</span>
      </div>
      ${!isRootFolder ? `
      <div class="context-menu-separator"></div>
      <div class="context-menu-item danger" data-action="delete">
        <span class="icon">🗑️</span>
        <span class="menu-text">删除文件夹</span>
      </div>
      ` : ''}
    `;
    
    // 智能定位菜单
    const position = calculateSmartMenuPosition(event, menu, {
      margin: 10,
      preferRight: true,
      preferBottom: true
    });
    
    // 设置菜单样式和位置
    menu.style.position = 'fixed';
    menu.style.left = position.left + 'px';
    menu.style.top = position.top + 'px';
    menu.style.zIndex = '10000';
    
    document.body.appendChild(menu);
    this.currentFolderContextMenu = menu;
    
    // 绑定菜单事件
    this.bindSingleFolderContextMenuEvents(menu, folderData);
    
    console.log(`🐱 显示文件夹右键菜单: ${folderData.title}，位置:`, position);
  }
  
  /**
   * 绑定文件夹右键菜单全局事件
   */
  bindFolderContextMenuEvents() {
    // 点击空白处隐藏菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.folder-context-menu')) {
        this.hideFolderContextMenu();
      }
    });
    
    // 按ESC键隐藏菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideFolderContextMenu();
      }
    });
  }
  
  /**
   * 绑定单个文件夹右键菜单事件
   * @param {HTMLElement} menu - 菜单元素
   * @param {Object} folderData - 文件夹数据
   */
  bindSingleFolderContextMenuEvents(menu, folderData) {
    const handleMenuClick = (e) => {
      const action = e.target.closest('.context-menu-item')?.dataset.action;
      if (!action) return;
      
      e.stopPropagation();
      
      switch (action) {
        case 'createSubfolder':
          this.showCreateSubfolderDialog(folderData);
          break;
        case 'rename':
          this.showRenameFolderDialog(folderData);
          break;
        case 'delete':
          this.showDeleteFolderConfirmation(folderData);
          break;
      }
      
      this.hideFolderContextMenu();
    };
    
    menu.addEventListener('click', handleMenuClick);
  }
  
  /**
   * 隐藏文件夹右键菜单
   */
  hideFolderContextMenu() {
    if (this.currentFolderContextMenu) {
      this.currentFolderContextMenu.remove();
      this.currentFolderContextMenu = null;
      this.currentFolderForContext = null;
    }
  }
  
  /**
   * 检查是否为根文件夹
   * @param {Object} folderData - 文件夹数据
   * @returns {boolean}
   */
  isRootFolder(folderData) {
    // 检查是否为顶级文件夹（书签栏直接子文件夹）
    const bookmarkBar = this.bookmarkManager.cache?.tree?.[0]; // 通常第一个是书签栏
    const otherBookmarksNode = this.bookmarkManager.cache?.tree?.[1]; // 通常第二个是其他书签
    
    if (bookmarkBar && bookmarkBar.children) {
      const isBookmarkBarChild = bookmarkBar.children.some(child => child.id === folderData.id);
      if (isBookmarkBarChild) return true;
    }
    
    if (otherBookmarksNode && otherBookmarksNode.children) {
      const isOtherBookmarksChild = otherBookmarksNode.children.some(child => child.id === folderData.id);
      if (isOtherBookmarksChild) return true;
    }
    
    return false;
  }
  
  /**
   * 显示创建子文件夹对话框
   * @param {Object} parentFolderData - 父文件夹数据
   */
  showCreateSubfolderDialog(parentFolderData) {
    const dialog = this.createDialog({
      title: `在 "${parentFolderData.title}" 中创建新文件夹`,
      type: 'input',
      inputPlaceholder: '文件夹名称',
      confirmText: '创建',
      cancelText: '取消'
    });
    
    dialog.onConfirm = async (folderName) => {
      if (!folderName.trim()) {
        this.showNotification('文件夹名称不能为空', 'error');
        return false;
      }
      
      try {
        await this.createSubfolder(parentFolderData.id, folderName.trim());
        this.showNotification('文件夹创建成功', 'success');
        return true;
      } catch (error) {
        console.error('❌ 创建文件夹失败:', error);
        this.showNotification('创建文件夹失败: ' + error.message, 'error');
        return false;
      }
    };
    
    dialog.show();
  }
  
  /**
   * 显示重命名文件夹对话框
   * @param {Object} folderData - 文件夹数据
   */
  showRenameFolderDialog(folderData) {
    const dialog = this.createDialog({
      title: `重命名文件夹`,
      type: 'input',
      inputValue: folderData.title,
      inputPlaceholder: '文件夹名称',
      confirmText: '重命名',
      cancelText: '取消'
    });
    
    dialog.onConfirm = async (newName) => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        this.showNotification('文件夹名称不能为空', 'error');
        return false;
      }
      
      if (trimmedName === folderData.title) {
        this.showNotification('文件夹名称没有变化', 'info');
        return true;
      }
      
      try {
        await this.renameFolder(folderData.id, trimmedName);
        this.showNotification('文件夹重命名成功', 'success');
        return true;
      } catch (error) {
        console.error('❌ 重命名文件夹失败:', error);
        this.showNotification('重命名文件夹失败: ' + error.message, 'error');
        return false;
      }
    };
    
    dialog.show();
  }
  
  /**
   * 显示删除文件夹确认对话框
   * @param {Object} folderData - 文件夹数据
   */
  showDeleteFolderConfirmation(folderData) {
    const hasBookmarks = folderData.bookmarkCount > 0;
    const hasSubfolders = folderData.children && folderData.children.length > 0;
    
    let warningText = '';
    if (hasBookmarks && hasSubfolders) {
      warningText = `此文件夹包含 ${folderData.bookmarkCount} 个书签和子文件夹。`;
    } else if (hasBookmarks) {
      warningText = `此文件夹包含 ${folderData.bookmarkCount} 个书签。`;
    } else if (hasSubfolders) {
      warningText = '此文件夹包含子文件夹。';
    }
    
    const dialog = this.createDialog({
      title: '删除文件夹',
      message: `确定要删除文件夹 "${folderData.title}" 吗？`,
      warning: warningText + (warningText ? ' 删除后将无法恢复。' : ''),
      type: 'confirm',
      confirmText: '删除',
      cancelText: '取消',
      isDangerous: true
    });
    
    dialog.onConfirm = async () => {
      try {
        await this.deleteFolder(folderData.id);
        this.showNotification('文件夹删除成功', 'success');
        return true;
      } catch (error) {
        console.error('❌ 删除文件夹失败:', error);
        this.showNotification('删除文件夹失败: ' + error.message, 'error');
        return false;
      }
    };
    
    dialog.show();
  }

  
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
   * 显示通知
   */
  showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
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
      console.log(`🐱 删除文件夹: ${folderId}`);
      
      const response = await this.bookmarkManager.sendMessage({
        action: 'deleteFolder',
        folderId: folderId
      });
      
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
      if (currentTab) {
        const [type, instanceId] = currentTab.split(':');
        this.updateFolderTreeSelection(type, instanceId);
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

// 等待DOM加载完成后启动应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.linkBoardApp = new ToolboxApp();
  });
} else {
  window.linkBoardApp = new ToolboxApp();
}

// 导出到全局作用域以便其他脚本使用
window.ToolboxApp = ToolboxApp; 