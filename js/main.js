// FavoriteBoard Plugin - 主应用程序
// Tab容器管理器 - 重构后的简化版本

/**
 * ToolboxApp - Tab容器管理器
 * 负责Tab的创建、切换和生命周期管理
 */
class ToolboxApp {
  constructor() {
    // Tab管理相关
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
    this.categoryInfo = null;
    this.mainContent = null;
    
    console.log('🐱 Tab管理器初始化开始...');
    
    // 检查扩展环境
    this.checkExtensionEnvironment();
    
    // 初始化应用
    this.init();
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
      console.log('🚀 初始化Tab管理器...');
      
      // 显示加载状态
      this.showLoadingState();
      
      // 初始化Tab系统
      this.initTabSystem();
      
      // 缓存UI元素
      this.cacheUIElements();
      
      // 加载收藏夹数据
      await this.loadBookmarksData();
      
      // 生成文件夹树和链接数据
      this.generateFolderTreeFromBookmarks();
      this.generateAllLinks();
      
      // 渲染文件夹树
      this.renderFolderTree();
      
      // 注册默认Tab
      this.registerDefaultTabs();
      
      // 切换到默认Tab (Dashboard)
      this.switchToTab('dashboard');
      
      // 绑定事件
      this.bindEvents();
      
      // 监听收藏夹更新
      this.setupBookmarkListeners();
      
      // 隐藏加载状态
      this.hideLoadingState();
      
      console.log('✅ Tab管理器初始化完成');
      
    } catch (error) {
      console.error('❌ Tab管理器初始化失败:', error);
      this.showErrorState(error);
    }
  }
  
  /**
   * 初始化Tab系统
   */
  initTabSystem() {
    // 创建Tab工厂
    this.tabFactory = new TabFactory();
    
    console.log('🏭 Tab工厂创建完成');
  }
  
  /**
   * 缓存UI元素
   */
  cacheUIElements() {
    this.searchInput = document.getElementById('searchInput');
    this.categoryInfo = document.getElementById('categoryInfo');
    this.mainContent = document.querySelector('.main-content');
    this.linksGrid = document.getElementById('linksGrid');
    this.emptyState = document.getElementById('emptyState');
    
    console.log('📋 UI元素缓存完成');
  }
  
  /**
   * 注册默认Tab
   */
  registerDefaultTabs() {
    console.log('📋 注册默认Tab...');
    console.log(`📊 当前链接总数: ${this.allLinks.length}`);
    
    // 注册Dashboard Tab
    this.registerTab('dashboard', 'default');
    
    // 注册全部书签Tab
    this.registerTab('bookmark', 'all', { 
      id: 'all', 
      title: '全部书签', 
      icon: '🗂️',
      bookmarkCount: this.allLinks.length 
    });
    
    console.log('✅ 默认Tab注册完成');
  }
  
  /**
   * 注册Tab
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID  
   * @param {Object} data - Tab数据
   */
  registerTab(type, instanceId = 'default', data = null) {
    const tabKey = `${type}:${instanceId}`;
    
    if (this.registeredTabs.has(tabKey)) {
      console.log(`🔄 Tab已存在: ${tabKey}`);
      return this.registeredTabs.get(tabKey);
    }
    
    let tab = null;
    
    try {
      // 根据类型创建Tab
      switch (type) {
        case 'dashboard':
          tab = this.tabFactory.createDashboardTab();
          break;
        case 'bookmark':
          tab = this.tabFactory.createBookmarkTab(instanceId, data);
          break;
        default:
          console.warn(`⚠️ 未知的Tab类型: ${type}`);
          return null;
      }
      
      if (tab) {
        this.registeredTabs.set(tabKey, tab);
        console.log(`✅ Tab注册成功: ${tabKey} - ${tab.getTitle()}`);
      }
      
      return tab;
      
    } catch (error) {
      console.error(`❌ Tab注册失败: ${tabKey}`, error);
      return null;
    }
  }
  
  /**
   * 切换到指定Tab
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID
   * @param {Object} data - Tab数据（可选）
   */
  async switchToTab(type, instanceId = 'default', data = null) {
    const tabKey = `${type}:${instanceId}`;
    
    try {
      console.log(`🔄 切换到Tab: ${tabKey}`);
      
      // 失活当前Tab
      if (this.currentTab) {
        this.currentTab.onDeactivate();
      }
      
      // 获取或创建目标Tab
      let targetTab = this.registeredTabs.get(tabKey);
      if (!targetTab) {
        targetTab = this.registerTab(type, instanceId, data);
        if (!targetTab) {
          throw new Error(`无法创建Tab: ${tabKey}`);
        }
      }
      
      // 渲染Tab内容
      await this.renderTab(targetTab);
      
      // 激活新Tab
      targetTab.onActivate();
      this.currentTab = targetTab;
      
      // 更新文件夹树选中状态
      this.updateFolderTreeSelection(type, instanceId);
      
      // 更新搜索栏显示状态
      this.updateSearchBarVisibility();
      
      console.log(`✅ Tab切换完成: ${tabKey} - ${targetTab.getTitle()}`);
      
    } catch (error) {
      console.error(`❌ Tab切换失败: ${tabKey}`, error);
      this.showNotification('Tab切换失败', 'error');
    }
  }
  
  /**
   * 渲染Tab内容
   * @param {BaseTab} tab - Tab实例
   */
  async renderTab(tab) {
    try {
      // 获取内容容器
      const container = this.getTabContentContainer();
      
      // 使用安全渲染方法
      const success = await tab.safeRender(container);
      
      if (!success) {
        throw new Error('Tab渲染失败');
      }
      
    } catch (error) {
      console.error('❌ Tab渲染失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取Tab内容容器
   * @returns {HTMLElement}
   */
  getTabContentContainer() {
    // 重用现有的链接网格容器
    const container = this.linksGrid;
    if (container) {
      container.innerHTML = '';
      container.className = 'tab-content-container';
      return container;
    }
    
    throw new Error('找不到Tab内容容器');
  }
  
  /**
   * 更新文件夹树选中状态
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID
   */
  updateFolderTreeSelection(type, instanceId) {
    // 清除所有选中状态
    const allItems = document.querySelectorAll('.tree-item');
    allItems.forEach(item => item.classList.remove('active'));
    
    // 设置新的选中状态
    let targetId = null;
    if (type === 'dashboard') {
      targetId = 'dashboard';
    } else if (type === 'bookmark') {
      targetId = instanceId;
    }
    
    if (targetId) {
      const targetItem = document.querySelector(`[data-folder-id="${targetId}"]`);
      if (targetItem) {
        targetItem.classList.add('active');
      }
    }
  }
  
  /**
   * 更新搜索栏显示状态
   */
  updateSearchBarVisibility() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar && this.currentTab) {
      const shouldShow = this.currentTab.supports('search');
      searchBar.style.display = shouldShow ? 'block' : 'none';
      
      // 如果隐藏搜索栏，清空搜索内容
      if (!shouldShow && this.searchInput) {
        this.searchInput.value = '';
      }
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
        const folderData = this.folderMap.get(folderId);
        console.log(`📁 文件夹数据:`, folderData);
        console.log(`🗂️ 文件夹映射表大小: ${this.folderMap.size}`);
        console.log(`📊 所有链接数量: ${this.allLinks.length}`);
        this.switchToTab('bookmark', folderId, folderData);
      }
    });
  }
  
  /**
   * 绑定窗口事件
   */
  bindWindowEvents() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
      if (this.currentTab) {
        this.currentTab.onResize();
      }
    });
  }
  
  /**
   * 处理搜索
   * @param {string} query - 搜索查询
   */
  handleSearch(query) {
    if (!this.currentTab || !this.currentTab.supports('search')) {
      return;
    }
    
    // 转发搜索事件到当前Tab
    this.currentTab.onSearch(query);
    
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
  async loadBookmarksData() {
    try {
      await this.bookmarkManager.loadBookmarks();
      console.log('📚 收藏夹数据加载成功');
    } catch (error) {
      console.error('❌ 收藏夹数据加载失败:', error);
      throw error;
    }
  }
  
  /**
   * 从收藏夹数据生成文件夹树
   */
  generateFolderTreeFromBookmarks() {
    // 获取原始收藏夹树结构
    const rawTree = this.bookmarkManager.cache?.tree || [];
    this.folderTree = [];
    
    // 处理根节点，通常包含 "书签栏"、"其他书签" 等
    rawTree.forEach(rootNode => {
      if (rootNode.children) {
        // 添加一个"全部"节点
        if (this.folderTree.length === 0) {
          this.folderTree.push({
            id: 'all',
            title: '全部书签',
            icon: '🗂️',
            bookmarkCount: this.bookmarkManager.cache?.totalBookmarks || 0,
            isSpecial: true,
            isExpanded: true,
            children: []
          });
        }
        
        // 处理每个根节点的子节点
        rootNode.children.forEach(child => {
          if (child.children !== undefined) { // 这是一个文件夹
            const processedFolder = this.processFolderNode(child, 0);
            if (processedFolder) {
              this.folderTree.push(processedFolder);
            }
          }
        });
      }
    });
    
    // 构建文件夹扁平映射表以便快速查找
    this.folderMap = this.buildFolderMap();
    
    console.log('🌳 生成了文件夹树，根节点数量:', this.folderTree.length);
    console.log('🗂️ 构建了文件夹映射表，包含', this.folderMap.size, '个文件夹');
  }
  
  /**
   * 处理文件夹节点
   */
  processFolderNode(node, depth) {
    const folderInfo = this.bookmarkManager.cache?.folderMap[node.id] || {};
    
    const folderNode = {
      id: node.id,
      title: node.title,
      parentId: node.parentId,
      icon: this.getFolderIcon(node.title, depth),
      bookmarkCount: folderInfo.bookmarkCount || 0,
      depth: depth,
      isExpanded: depth < 2, // 前两层默认展开
      children: []
    };
    
    // 递归处理子文件夹
    if (node.children) {
      node.children.forEach(child => {
        if (child.children !== undefined) { // 这是一个文件夹
          const childFolder = this.processFolderNode(child, depth + 1);
          if (childFolder) {
            folderNode.children.push(childFolder);
          }
        }
      });
    }
    
    return folderNode;
  }
  
  /**
   * 生成所有链接数据
   */
  generateAllLinks() {
    const allBookmarks = this.bookmarkManager.cache?.flatBookmarks || [];
    
    console.log('📚 原始书签数据:', allBookmarks.length, '个');
    if (allBookmarks.length > 0) {
      console.log('📄 前几个原始书签:');
      allBookmarks.slice(0, 3).forEach((bookmark, index) => {
        console.log(`  ${index + 1}. "${bookmark.title}" - parentId: "${bookmark.parentId}"(${typeof bookmark.parentId})`);
      });
    }
    
    this.allLinks = allBookmarks.map(bookmark => ({
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      parentId: bookmark.parentId,
      folderId: bookmark.parentId,
      iconUrl: bookmark.iconUrl || this.generateFaviconUrl(bookmark.url),
      dateAdded: bookmark.dateAdded,
      dateGrouped: bookmark.dateGrouped
    }));
    
    console.log('🔗 生成了所有链接数据，共', this.allLinks.length, '个链接');
    if (this.allLinks.length > 0) {
      console.log('🔗 前几个生成的链接:');
      this.allLinks.slice(0, 3).forEach((link, index) => {
        console.log(`  ${index + 1}. "${link.title}" - parentId: "${link.parentId}"(${typeof link.parentId}), folderId: "${link.folderId}"(${typeof link.folderId})`);
      });
    }
  }
  
  /**
   * 构建文件夹映射表
   */
  buildFolderMap() {
    const map = new Map();
    
    const traverseTree = (nodes) => {
      nodes.forEach(node => {
        map.set(node.id, node);
        if (node.children && node.children.length > 0) {
          traverseTree(node.children);
        }
      });
    };
    
    traverseTree(this.folderTree);
    return map;
  }
  
  /**
   * 获取文件夹及其子文件夹的ID
   * @param {string} folderId - 文件夹ID
   * @returns {Array} 文件夹ID数组
   */
  getFolderAndSubfolderIds(folderId) {
    const ids = [folderId];
    
    function collectChildIds(node) {
      if (node.children) {
        node.children.forEach(child => {
          ids.push(child.id);
          collectChildIds(child);
        });
      }
    }
    
    const folder = this.folderMap.get(folderId);
    if (folder) {
      collectChildIds(folder);
    }
    
    return ids;
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
    
    // 渲染文件夹树
    this.folderTree.forEach(node => {
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
    const folder = this.folderMap.get(folderId);
    if (!folder || !folder.children || folder.children.length === 0) return;
    
    // 保存当前的Tab选中状态
    const currentTabType = this.currentTab?.type;
    const currentInstanceId = this.currentTab?.instanceId;
    
    // 切换展开状态
    folder.isExpanded = !folder.isExpanded;
    
    // 重新渲染文件夹树（但不重新绑定事件）
    this.renderFolderTree();
    
    // 恢复Tab选中状态
    if (currentTabType && currentInstanceId) {
      this.updateFolderTreeSelection(currentTabType, currentInstanceId);
    }
    
    console.log(`🔄 切换文件夹展开状态: ${folder.title} -> ${folder.isExpanded ? '展开' : '折叠'}`);
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
  

  
  // ==================== 工具方法 ====================
  
  /**
   * 获取文件夹图标
   */
  getFolderIcon(folderTitle, depth) {
    if (!folderTitle) return '📁';
    
    const titleLower = folderTitle.toLowerCase();
    const iconMap = {
      '工作': '💼', 'work': '💼',
      '学习': '📚', 'study': '📚', 'education': '📚',
      '娱乐': '🎮', 'entertainment': '🎮', 'games': '🎮',
      '社交': '💬', 'social': '💬', 'communication': '💬',
      '购物': '🛒', 'shopping': '🛒',
      '新闻': '📰', 'news': '📰',
      '技术': '⚙️', 'tech': '⚙️', 'technology': '⚙️',
      '设计': '🎨', 'design': '🎨'
    };
    
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (titleLower.includes(keyword)) {
        return icon;
      }
    }
    
    return '📁';
  }
  
  /**
   * 生成Favicon URL
   */
  generateFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return '';
    }
  }
  
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
   * 处理收藏夹更新
   */
  async handleBookmarkUpdate(action) {
    console.log('📊 收藏夹数据更新:', action);
    
    try {
      // 重新加载数据
      await this.loadBookmarksData();
      this.generateFolderTreeFromBookmarks();
      this.generateAllLinks();
      
      // 重新渲染文件夹树
      this.renderFolderTree();
      
      // 通知当前Tab数据更新
      if (this.currentTab) {
        this.currentTab.onDataUpdate(action, {
          allLinks: this.allLinks,
          folderTree: this.folderTree
        });
      }
      
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
          <button class="retry-btn" onclick="location.reload()">重试</button>
        </div>
      `;
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