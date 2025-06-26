class ToolboxApp {
  constructor() {
    this.currentCategory = null; // 默认为null，表示显示Dashboard
    this.searchQuery = '';
    this.filteredLinks = [];
    this.allLinks = [];
    this.selectedTags = new Set(); // 添加选中的Tag集合
    this.bookmarkManager = new BookmarkManager(); // 添加收藏夹管理器
    this.categories = []; // 动态生成的分类
    this.isLoading = true; // 加载状态
    
    // 右键菜单相关状态
    this.currentContextMenu = null;
    this.currentBookmarkForContext = null;
    
    // 检查扩展环境
    this.checkExtensionEnvironment();
    
    this.init();
  }

  // 检查扩展环境
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

  async init() {
    try {
      console.log('🐱 正在初始化收藏夹面板...');
      
      // 显示加载状态
      this.showLoadingState();
      
      // 等待收藏夹数据加载
      await this.loadBookmarksData();
      
      // 生成文件夹树和链接数据
      this.generateFolderTreeFromBookmarks();
      this.generateAllLinks();
      
      // 渲染界面
      this.renderFolderTree();
      this.renderLinks();
      this.bindEvents();
      
      // 初始状态不选中任何分类，显示Dashboard
      this.updateCategoryInfo();
      
      // 监听收藏夹更新
      this.setupBookmarkListeners();
      
      // 隐藏加载状态
      this.hideLoadingState();
      
      console.log('✅ 收藏夹面板初始化完成');
      
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      this.showErrorState(error);
    }
  }
  
  // 显示加载状态
  showLoadingState() {
    const linksGrid = document.getElementById('linksGrid');
    const emptyState = document.getElementById('emptyState');
    
    hideElement(linksGrid);
    showElement(emptyState);
    emptyState.innerHTML = `
      <div class="loading-state">
        <div class="loading-icon">🐱</div>
        <div class="loading-text">正在加载收藏夹数据...</div>
      </div>
    `;
  }
  
  // 隐藏加载状态
  hideLoadingState() {
    this.isLoading = false;
    const linksGrid = document.getElementById('linksGrid');
    const emptyState = document.getElementById('emptyState');
    
    hideElement(emptyState);
    showElement(linksGrid, 'grid'); // 显示链接网格
  }
  
  // 显示错误状态
  showErrorState(error) {
    const linksGrid = document.getElementById('linksGrid');
    const emptyState = document.getElementById('emptyState');
    
    hideElement(linksGrid);
    showElement(emptyState);
    emptyState.innerHTML = `
      <div class="error-state">
        <div class="error-icon">😿</div>
        <div class="error-text">加载收藏夹数据失败</div>
        <div class="error-detail">${error.message}</div>
        <button class="retry-btn" id="retryBtn">重试</button>
      </div>
    `;
    
    // 添加重试按钮事件监听器
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => location.reload());
    }
  }
  
  // 加载收藏夹数据
  async loadBookmarksData() {
    try {
      await this.bookmarkManager.loadBookmarks();
      console.log('📚 收藏夹数据加载成功');
    } catch (error) {
      console.error('❌ 收藏夹数据加载失败:', error);
      throw error;
    }
  }
  
  // 从收藏夹数据生成文件夹树
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
    
    console.log('🌳 生成了文件夹树，根节点数量:', this.folderTree.length);
  }
  
  // 处理文件夹节点
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
  
  // 获取文件夹图标
  getFolderIcon(folderTitle, depth) {
    const title = folderTitle.toLowerCase();
    
    // 根据文件夹名称返回相应图标
    if (title.includes('工作') || title.includes('work')) return '💼';
    if (title.includes('学习') || title.includes('study')) return '📚';
    if (title.includes('娱乐') || title.includes('entertainment')) return '🎮';
    if (title.includes('开发') || title.includes('dev')) return '💻';
    if (title.includes('新闻') || title.includes('news')) return '📰';
    if (title.includes('购物') || title.includes('shop')) return '🛒';
    if (title.includes('社交') || title.includes('social')) return '👥';
    if (title.includes('工具') || title.includes('tool')) return '🔧';
    if (title.includes('设计') || title.includes('design')) return '🎨';
    if (title.includes('音乐') || title.includes('music')) return '🎵';
    if (title.includes('视频') || title.includes('video')) return '📹';
    
    // 根据深度返回默认图标
    const depthIcons = ['📂', '📁', '🗂️', '📄'];
    return depthIcons[Math.min(depth, depthIcons.length - 1)];
  }
  
  // 设置收藏夹事件监听
  setupBookmarkListeners() {
    this.bookmarkManager.on('bookmarks-updated', () => {
      console.log('🔄 收藏夹已更新，重新渲染...');
      this.generateFolderTreeFromBookmarks();
      this.generateAllLinks();
      this.renderFolderTree();
      this.renderLinks();
    });
  }

  // 生成所有链接数组
  generateAllLinks() {
    // 从收藏夹管理器获取所有收藏夹
    this.allLinks = this.bookmarkManager.getAllBookmarks().map(bookmark => ({
      id: bookmark.id, // 添加ID字段用于删除操作
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.domain || '收藏夹链接',
      icon: null, // 将由getFavicon方法处理
      tags: bookmark.tags? bookmark.tags : [], //(bookmark.tags && bookmark.tags.length > 0) ? bookmark.tags.slice(1) : [],
      categoryId: bookmark.parentId,
      categoryName: this.getCategoryName(bookmark.parentId),
      categoryIcon: this.getCategoryIcon(bookmark.parentId),
      dateAdded: bookmark.dateAdded,
      domain: bookmark.domain
    }));
    
    console.log('🔗 生成了', this.allLinks.length, '个链接');
  }
  
  // 获取分类名称
  getCategoryName(categoryId) {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : '未分类';
  }
  
  // 获取分类图标
  getCategoryIcon(categoryId) {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.icon : '📂';
  }

  // 渲染文件夹树
  renderFolderTree() {
    const folderTreeContainer = document.getElementById('folderTree');
    if (!folderTreeContainer) {
      console.error('❌ 找不到文件夹树容器元素');
      return;
    }
    
    folderTreeContainer.innerHTML = ''; // 清空现有内容
    
    if (!this.folderTree || this.folderTree.length === 0) {
      folderTreeContainer.innerHTML = '<div class="empty-tree">没有找到收藏夹</div>';
      return;
    }
    
    // 渲染文件夹树节点
    this.folderTree.forEach(node => {
      const nodeElement = this.createTreeNode(node);
      folderTreeContainer.appendChild(nodeElement);
    });
    
    console.log('🌳 文件夹树渲染完成');
  }
  
  // 创建树节点元素
  createTreeNode(node, depth = 0) {
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'tree-node';
    
    // 创建节点项
    const nodeItem = document.createElement('div');
    nodeItem.className = `tree-item ${node.isSpecial ? 'root-folder' : ''} ${node.bookmarkCount === 0 ? 'empty-folder' : ''}`;
    nodeItem.setAttribute('data-depth', depth);
    nodeItem.setAttribute('data-folder-id', node.id);
    
    // 展开/折叠箭头
    const hasChildren = node.children && node.children.length > 0;
    const expandIcon = hasChildren ? '▶' : '';
    const expandClass = hasChildren ? (node.isExpanded ? 'expanded' : '') : 'leaf';
    
    nodeItem.innerHTML = `
      <span class="tree-expand ${expandClass}" data-folder-id="${node.id}">
        ${expandIcon}
      </span>
      <span class="tree-icon">${node.icon}</span>
      <span class="tree-name">${node.title}</span>
      <span class="tree-count">${node.bookmarkCount}</span>
    `;
    
    nodeContainer.appendChild(nodeItem);
    
    // 创建子节点容器
    if (hasChildren) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = `tree-children ${node.isExpanded ? 'expanded' : 'collapsed'}`;
      
      node.children.forEach(child => {
        const childNode = this.createTreeNode(child, depth + 1);
        childrenContainer.appendChild(childNode);
      });
      
      nodeContainer.appendChild(childrenContainer);
    }
    
    return nodeContainer;
  }
  
  // 切换文件夹展开/折叠状态
  toggleFolder(folderId) {
    const folder = this.findFolderInTree(folderId);
    if (!folder) return;
    
    folder.isExpanded = !folder.isExpanded;
    
    // 更新UI
    const expandBtn = document.querySelector(`[data-folder-id="${folderId}"].tree-expand`);
    const childrenContainer = expandBtn?.closest('.tree-node')?.querySelector('.tree-children');
    
    if (expandBtn && childrenContainer) {
      if (folder.isExpanded) {
        expandBtn.classList.add('expanded');
        childrenContainer.classList.remove('collapsed');
        childrenContainer.classList.add('expanded');
      } else {
        expandBtn.classList.remove('expanded');
        childrenContainer.classList.remove('expanded');
        childrenContainer.classList.add('collapsed');
      }
    }
  }
  
  // 在树中查找文件夹
  findFolderInTree(folderId, tree = null) {
    const searchTree = tree || this.folderTree;
    
    for (const node of searchTree) {
      if (node.id === folderId) {
        return node;
      }
      
      if (node.children && node.children.length > 0) {
        const found = this.findFolderInTree(folderId, node.children);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  // 获取文件夹及其所有子文件夹的ID列表
  getFolderAndSubfolderIds(folderId) {
    const folder = this.findFolderInTree(folderId);
    if (!folder) return [folderId]; // 如果找不到文件夹，返回原ID（兼容性）
    
    const ids = [folderId];
    
    // 递归收集子文件夹IDs
    function collectChildIds(node) {
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          ids.push(child.id);
          collectChildIds(child);
        });
      }
    }
    
    collectChildIds(folder);
    return ids;
  }

  // 渲染链接
  async renderLinks() {
    const linksGrid = document.querySelector('.links-grid');
    
    // 添加调试信息
    console.log('🔍 renderLinks 调试信息:', {
      currentCategory: this.currentCategory,
      allLinksLength: this.allLinks ? this.allLinks.length : 0,
      searchQuery: this.searchQuery,
      selectedTags: Array.from(this.selectedTags || []),
      linksGridElement: !!linksGrid
    });
    
    try {
      // 首先显示加载状态
      this.showLoadingState();
      
      // Dashboard状态下优先渲染统计信息，不等待任何异步操作
      if (this.currentCategory === null /*|| this.currentCategory === 'dashboard'*/) {
        console.log('📊 渲染Dashboard模式');
        this.clearLinksGrid();
        this.hideLoadingState();
        
        // 立即渲染Dashboard统计，不等待任何异步操作
        this.renderDashboardStats();
        return;
      }
      
      // 获取当前分类的链接
      const links = this.getCurrentLinks();
      console.log('📝 获取到的链接数量:', links ? links.length : 0);
      
      // 清空当前内容
      this.clearLinksGrid();
      
      // 检查是否有链接
      if (!links || links.length === 0) {
        console.log('❌ 没有链接可显示');
        this.hideLoadingState();
        
        const emptyMessage = this.searchQuery 
          ? '没有找到匹配的链接 🔍' 
          : '该分类暂无链接 📝';
          
        linksGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>${emptyMessage}</h3>
            <p>尝试搜索其他关键词或查看其他分类</p>
          </div>
        `;
        
        // 确保链接网格容器可见
        showElement(linksGrid, 'grid');
        
        this.updateLinkCount(0);
        return;
      }
      
      console.log('✅ 开始渲染链接卡片...');
      
      // 立即渲染所有链接卡片（使用默认图标）
      const fragment = document.createDocumentFragment();
      links.forEach((link, index) => {
        const card = this.createLinkCard(link);
        // 为卡片添加渐进式动画延迟
        card.style.animationDelay = `${Math.min(index * 0.05, 0.4)}s`;
        fragment.appendChild(card);
      });
      
      linksGrid.appendChild(fragment);
      
      // 立即隐藏加载状态，显示内容
      this.hideLoadingState();
      
      // 更新链接数量
      this.updateLinkCount(links.length);
      
      // 更新分类信息
      this.updateCategoryInfo();
      
      // 渲染标签筛选器（如果需要）
      this.renderTagFilters();
      
      console.log(`✅ 已渲染 ${links.length} 个链接卡片`);
      
    } catch (error) {
      console.error('❌ 渲染链接时出错:', error);
      this.showErrorState(error);
    }
  }

  // 清理链接网格内容
  clearLinksGrid() {
    const linksGrid = document.querySelector('.links-grid');
    
    if (!linksGrid) {
      console.warn('⚠️ 找不到 .links-grid 元素');
      return;
    }
    
    // 直接清空所有内容，这样能确保移除所有子元素
    // 包括链接卡片、Dashboard统计、空状态消息等所有内容
    linksGrid.innerHTML = '';
    
    // Tag筛选器现在是独立的，不需要在这里清理
  }

  // 渲染Tag筛选器
  renderTagFilters() {
    const filterSection = document.getElementById('tagFilterSection');
    const tagList = document.getElementById('tagList');
    const clearTagsBtn = document.getElementById('clearTagsBtn');
    
    // 获取当前分类的所有Tag
    const currentTags = this.getCurrentCategoryTags();
    
    if (currentTags.length === 0) {
      // 没有Tag时隐藏筛选区域
      hideElement(filterSection);
      return;
    }
    
    // 显示筛选区域
    showElement(filterSection);
    
    // 更新清除按钮显示状态
    toggleElement(clearTagsBtn, this.selectedTags.size > 0, 'inline-block');
    
    // 渲染Tag按钮
    tagList.innerHTML = currentTags.map(tag => `
      <button class="tag-filter-btn ${this.selectedTags.has(tag) ? 'active' : ''}" 
              data-tag="${tag}">
        ${tag}
      </button>
    `).join('');
  }

  // 获取当前分类的所有Tag
  getCurrentCategoryTags() {
    // 如果是"全部"页面，返回所有分类的Tag
    if (this.currentCategory === 'all') {
      return this.getAllCategoriesTags();
    }
    
    // 获取当前分类的链接
    const categoryLinks = this.allLinks.filter(link => link.categoryId === this.currentCategory);
    const tagsSet = new Set();
    
    categoryLinks.forEach(link => {
      if (link.tags && Array.isArray(link.tags)) {
        link.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  }

  // 获取所有分类的Tag（用于"全部"页面）
  getAllCategoriesTags() {
    const tagsSet = new Set();
    
    // 遍历所有链接
    this.allLinks.forEach(link => {
      if (link.tags && Array.isArray(link.tags)) {
        // 过滤掉域名标签（通常是第一个，或者以.com/.org等结尾的）
        const filteredTags = link.tags.filter((tag, index) => {
          // 跳过第一个标签（通常是域名）
          if (index === 0) return false;
          // 跳过明显的域名标签
          return !this.isDomainTag(tag);
        });
        filteredTags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  }

  // 判断是否是域名标签
  isDomainTag(tag) {
    if (!tag || typeof tag !== 'string') return false;
    
    // 检查是否包含常见域名后缀
    const domainSuffixes = ['.com', '.org', '.net', '.cn', '.io', '.me', '.co', '.gov', '.edu'];
    return domainSuffixes.some(suffix => tag.toLowerCase().endsWith(suffix));
  }

  // 渲染DashBoard统计信息
  renderDashboardStats() {
    const linksGrid = document.querySelector('.links-grid');
    
    if (!linksGrid) {
      console.warn('⚠️ 找不到 .links-grid 元素');
      return;
    }
    
    // 计算统计数据
    const totalLinks = this.allLinks.length;
    const categoryStats = {};
    
    this.categories.forEach(cat => {
      if (cat.id !== 'all' /*&& cat.id !== 'dashboard'*/) {
        const count = this.allLinks.filter(link => link.categoryId === cat.id).length;
        if (count > 0) { // 只显示有链接的分类
          categoryStats[cat.id] = {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            count: count
          };
        }
      }
    });
    
    // 获取收藏夹统计信息
    const bookmarkStats = this.bookmarkManager.getStats();
    
    // 创建统计卡片
    const statsCard = document.createElement('div');
    statsCard.className = 'dashboard-stats';
    statsCard.innerHTML = `
      <div class="stats-header">
        <h3>📊 收藏夹统计</h3>
        <p>您的收藏夹概览</p>
      </div>
      <div class="stats-grid">
        <div class="stat-item total">
          <span class="stat-number">${totalLinks}</span>
          <span class="stat-label">总收藏夹</span>
        </div>
        <div class="stat-item categories">
          <span class="stat-number">${Object.keys(categoryStats).length}</span>
          <span class="stat-label">文件夹数量</span>
        </div>
        <div class="stat-item tags">
          <span class="stat-number">${bookmarkStats.totalTags || 0}</span>
          <span class="stat-label">标签数量</span>
        </div>
        <div class="stat-item domains">
          <span class="stat-number">${bookmarkStats.totalDomains || 0}</span>
          <span class="stat-label">不同域名</span>
        </div>
      </div>
      <div class="category-stats">
        ${Object.values(categoryStats).map(stat => `
          <div class="category-stat" style="border-left: 4px solid ${stat.color}">
            <span class="category-icon">${stat.icon}</span>
            <span class="category-name">${stat.name}</span>
            <span class="category-count">${stat.count}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    linksGrid.appendChild(statsCard);
    
    // 确保链接网格容器可见
    showElement(linksGrid, 'grid');
  }

  // 获取默认图标
  getDefaultIcon() {
    // 如果utils.js可用，使用工具函数，否则使用内置默认图标
    if (typeof getDefaultLinkIcon === 'function') {
      return getDefaultLinkIcon();
    }
    
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    `);
  }

  // 获取安全的图标URL
  getSafeIcon(iconUrl, websiteUrl = null) {
    // 1. 检查提供的图标URL是否有效
    if (iconUrl && typeof iconUrl === 'string' && iconUrl.trim() !== '') {
      const trimmedIcon = iconUrl.trim();
      
      // 检查是否是有效的URL或data URI
      if (this.isValidIconUrl(trimmedIcon)) {
        return trimmedIcon;
      }
    }
    
    // 2. 尝试从网站URL生成favicon URL
    if (websiteUrl && typeof getFaviconUrl === 'function') {
      try {
        const faviconUrl = getFaviconUrl(websiteUrl);
        if (faviconUrl && faviconUrl !== this.getDefaultIcon()) {
          return faviconUrl;
        }
      } catch (e) {
        console.log('无法生成favicon URL:', e);
      }
    }
    
    // 3. 返回默认图标
    return this.getDefaultIcon();
  }

  // 验证图标URL是否有效（本地方法，以防utils.js不可用）
  isValidIconUrl(iconUrl) {
    if (!iconUrl || typeof iconUrl !== 'string' || iconUrl.trim() === '') {
      return false;
    }
    
    // 检查是否是data URI
    if (iconUrl.startsWith('data:')) {
      return true;
    }
    
    // 简单的URL格式验证
    try {
      new URL(iconUrl);
      return true;
    } catch (e) {
      return false;
    }
  }

  // 创建链接卡片
  createLinkCard(link) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.dataset.bookmarkId = link.id || '';
    card.dataset.bookmarkUrl = link.url;
    card.dataset.bookmarkTitle = link.title;
    
    // 左键点击打开链接
    card.addEventListener('click', (e) => {
      // 如果是右键点击，不执行打开链接
      if (e.button === 2) return;
      window.open(link.url, '_blank');
    });
    
    // 右键菜单事件
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, link, card);
    });
    
    // 过滤掉域名标签（第一个标签通常是域名）
    const filteredTags = link.tags ? link.tags/*.slice(1)*/ : [];
    
    const tagsHTML = filteredTags.length > 0 ? 
      `<div class="card-tags">
        ${filteredTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>` : '';
    
    // 如果是dashboard页面、全部页面或全局搜索，显示分类信息
    const categoryBadge = (/*this.currentCategory === 'dashboard' ||*/ this.currentCategory === 'all' || this.searchQuery) && link.categoryName ? 
      `<div class="category-badge">
        <span class="category-badge-icon">${link.categoryIcon}</span>
        <span class="category-badge-name">${link.categoryName}</span>
      </div>` : '';
    
    // 先使用默认图标，然后异步加载真实图标
    const defaultIcon = this.getDefaultIcon();
    
    card.innerHTML = `
      <div class="card-header">
        <img class="card-icon" src="${defaultIcon}" alt="${link.title}" data-loading="true">
        <h3 class="card-title">${link.title}</h3>
      </div>
      ${categoryBadge}
      <p class="card-description">${link.description}</p>
      ${tagsHTML}
    `;
    
    // 异步加载真实图标，不阻塞页面渲染
    const iconImg = card.querySelector('.card-icon');
    this.loadIconAsync(iconImg, link.icon, link.url);
    
    return card;
  }

  // 异步加载图标
  async loadIconAsync(imgElement, iconUrl, websiteUrl) {
    try {
      // 如果有自定义图标，先尝试加载
      if (iconUrl && this.isValidIconUrl(iconUrl)) {
        await this.tryLoadIcon(imgElement, iconUrl);
        return;
      }
      
      // 否则尝试获取网站的favicon
      if (websiteUrl) {
        const faviconUrl = await this.getFaviconAsync(websiteUrl);
        if (faviconUrl) {
          await this.tryLoadIcon(imgElement, faviconUrl);
          return;
        }
      }
      
      // 如果都失败了，保持默认图标
      imgElement.removeAttribute('data-loading');
    } catch (error) {
      console.warn('⚠️ Failed to load icon for:', websiteUrl, error);
      imgElement.removeAttribute('data-loading');
    }
  }

  // 尝试加载图标
  async tryLoadIcon(imgElement, iconUrl) {
    return new Promise((resolve, reject) => {
      const testImg = new Image();
      
      testImg.onload = () => {
        imgElement.src = iconUrl;
        imgElement.removeAttribute('data-loading');
        resolve();
      };
      
      testImg.onerror = () => {
        reject(new Error('Failed to load icon'));
      };
      
      // 设置超时，避免长时间等待
      setTimeout(() => {
        reject(new Error('Icon load timeout'));
      }, 5000);
      
      testImg.src = iconUrl;
    });
  }

  // 异步获取favicon
  async getFaviconAsync(url) {
    try {
      if (this.bookmarkManager && typeof this.bookmarkManager.getFavicon === 'function') {
        return await this.bookmarkManager.getFavicon(url);
      }
      
      // 如果没有bookmarkManager，使用简单的域名favicon
      if (typeof getFaviconUrl === 'function') {
        return getFaviconUrl(url);
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Error getting favicon:', error);
      return null;
    }
  }

  // 获取当前分类的链接
  getCurrentLinks() {
    console.log('🔍 getCurrentLinks 调试信息:', {
      currentCategory: this.currentCategory,
      allLinksLength: this.allLinks ? this.allLinks.length : 0,
      searchQuery: this.searchQuery,
      selectedTagsSize: this.selectedTags ? this.selectedTags.size : 0
    });
    
    // Dashboard状态下不返回链接
    if (this.currentCategory === null) {
      console.log('🏠 Dashboard状态，返回空数组');
      return [];
    }
    
    let categoryLinks;
    
    // 如果有搜索查询，在all分类或当前分类中搜索
    if (this.searchQuery) {
      if (this.currentCategory === 'all') {
        // 在"全部"分类中，搜索所有链接
        categoryLinks = this.allLinks.filter(link => 
          link.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          link.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          link.categoryName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (link.tags && link.tags.some(tag => 
            tag.toLowerCase().includes(this.searchQuery.toLowerCase())
          ))
        );
      } else {
        // 在其他分类/文件夹中，只搜索当前分类/文件夹的链接
        const folderIds = this.getFolderAndSubfolderIds(this.currentCategory);
        const currentCategoryLinks = this.allLinks.filter(link => 
          folderIds.includes(link.categoryId)
        );
        categoryLinks = currentCategoryLinks.filter(link =>
          link.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          link.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (link.tags && link.tags.some(tag => 
            tag.toLowerCase().includes(this.searchQuery.toLowerCase())
          ))
        );
      }
    } else {
      // 否则返回当前分类的链接
      if (this.currentCategory === 'all') {
        categoryLinks = this.allLinks;
      } else {
        // 检查是否是文件夹，如果是则需要包含子文件夹的书签
        const folderIds = this.getFolderAndSubfolderIds(this.currentCategory);
        if (folderIds.length > 0) {
          categoryLinks = this.allLinks.filter(link => folderIds.includes(link.categoryId));
        } else {
          // 兼容旧版分类
          categoryLinks = this.allLinks.filter(link => link.categoryId === this.currentCategory);
        }
      }
    }
    
    console.log('📝 分类筛选后的链接数量:', categoryLinks ? categoryLinks.length : 0);
    
    // Tag筛选
    if (this.selectedTags.size > 0) {
      const beforeTagFilter = categoryLinks.length;
      categoryLinks = categoryLinks.filter(link => {
        if (!link.tags || !Array.isArray(link.tags)) return false;
        
        // 只要包含任一选中的tag即可显示
        return Array.from(this.selectedTags).some(selectedTag => 
          link.tags.includes(selectedTag)
        );
      });
      console.log(`🏷️ Tag筛选：${beforeTagFilter} -> ${categoryLinks.length}`);
    }
    
    console.log('🎯 最终返回的链接数量:', categoryLinks ? categoryLinks.length : 0);
    return categoryLinks;
  }

  // 更新分类信息
  updateCategoryInfo() {
    const categoryTitle = document.querySelector('.category-title');
    const categoryDesc = document.querySelector('.category-desc');
    const searchBar = document.getElementById('searchBar');
    
    if (this.currentCategory === null) {
      // Dashboard状态
      if (categoryTitle) categoryTitle.textContent = 'Dashboard';
      if (categoryDesc) categoryDesc.textContent = '数据统计和网站概览';
      // Dashboard状态下隐藏搜索栏
      if (searchBar) {
        hideElement(searchBar);
      }
    } else {
      // 检查是否是文件夹
      const folder = this.findFolderInTree(this.currentCategory);
      if (folder) {
        // 文件夹状态
        if (categoryTitle) categoryTitle.textContent = folder.title;
        if (categoryDesc) {
          let desc = `${folder.bookmarkCount} 个收藏链接`;
          if (folder.children && folder.children.length > 0) {
            desc += ` • ${folder.children.length} 个子文件夹`;
          }
          categoryDesc.textContent = desc;
        }
      } else {
        // 旧版分类状态（兼容性）
        const category = this.categories?.find(cat => cat.id === this.currentCategory);
        if (category) {
          if (categoryTitle) categoryTitle.textContent = category.name;
          if (categoryDesc) categoryDesc.textContent = category.description;
        } else {
          // 如果找不到分类和文件夹，显示默认信息
          if (categoryTitle) categoryTitle.textContent = '未知分类';
          if (categoryDesc) categoryDesc.textContent = '当前分类信息不可用';
        }
      }
      
      // 分类/文件夹页面显示搜索栏
      if (searchBar) {
        showElement(searchBar);
      }
    }
  }

  // 更新链接数量
  updateLinkCount(count) {
    const linkCountEl = document.getElementById('linkCount');
    if (linkCountEl) {
      linkCountEl.textContent = count;
    }
  }

  // 搜索功能
  handleSearch(query) {
    this.searchQuery = query.trim();
    this.renderLinks();
    
    // 显示/隐藏清除按钮
    const clearBtn = document.getElementById('clearSearch');
    toggleElement(clearBtn, this.searchQuery ? true : false);
  }

  // 清除搜索
  clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    this.handleSearch('');
  }

  // Tag筛选处理
  handleTagFilter(tag) {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    
    this.renderLinks();
  }

  // 清除Tag筛选
  clearTagFilters() {
    this.selectedTags.clear();
    this.renderLinks();
  }

  // 设置活跃分类（支持取消选择）
  setActiveCategory(categoryId) {
    // 清除当前Tag筛选
    this.selectedTags.clear();
    
    // 如果点击的是当前已选中的分类，则取消选择回到Dashboard
    if (this.currentCategory === categoryId) {
      this.currentCategory = null;
      // 取消所有按钮的active状态
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
      });
    } else {
      // 选择新的分类
      this.currentCategory = categoryId;
      
      // 更新按钮状态
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      const activeBtn = document.querySelector(`[data-category="${categoryId}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    }
    
    // 隐藏Tag筛选区域（只有Dashboard才隐藏）
    const filterSection = document.getElementById('tagFilterSection');
    if (this.currentCategory === null) {
      hideElement(filterSection);
    }
    
    // 更新分类信息
    this.updateCategoryInfo();
    
    // 重新渲染链接
    this.renderLinks();
  }

  // 设置活跃文件夹
  setActiveFolder(folderId) {
    console.log('🗂️ 切换到文件夹:', folderId);
    
    // 清除当前Tag筛选
    this.selectedTags.clear();
    
    // 如果点击的是当前已选中的文件夹，则取消选择回到Dashboard
    if (this.currentCategory === folderId) {
      this.currentCategory = null;
      // 取消所有文件夹的active状态
      document.querySelectorAll('.tree-item').forEach(item => {
        item.classList.remove('active');
      });
    } else {
      // 选择新的文件夹
      this.currentCategory = folderId;
      
      // 更新文件夹树的活跃状态
      document.querySelectorAll('.tree-item').forEach(item => {
        item.classList.remove('active');
      });
      
      const activeItem = document.querySelector(`[data-folder-id="${folderId}"]`);
      if (activeItem) {
        activeItem.classList.add('active');
      }
    }
    
    // 隐藏Tag筛选区域（只有Dashboard才隐藏）
    const filterSection = document.getElementById('tagFilterSection');
    if (this.currentCategory === null) {
      hideElement(filterSection);
    }
    
    // 更新分类信息
    this.updateCategoryInfo();
    
    // 重新渲染链接
    this.renderLinks();
  }

  // 回到Dashboard（取消所有分类选择）
  goToDashboard() {
    this.selectedTags.clear();
    this.currentCategory = null;
    
    // 取消所有按钮的active状态
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // 取消所有文件夹的active状态
    document.querySelectorAll('.tree-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 隐藏Tag筛选区域
    const filterSection = document.getElementById('tagFilterSection');
    hideElement(filterSection);
    
    // 更新分类信息
    this.updateCategoryInfo();
    
    // 重新渲染链接
    this.renderLinks();
  }

  // 显示右键菜单
  showContextMenu(event, link, card) {
    // 隐藏已存在的菜单
    this.hideContextMenu();
    
    // 设置当前上下文
    this.currentBookmarkForContext = link;
    
    // 创建菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
      <button class="context-menu-item" data-action="open">
        <span class="icon">🔗</span>
        打开链接
      </button>
      <button class="context-menu-item" data-action="copy">
        <span class="icon">📋</span>
        复制链接
      </button>
      <div class="context-menu-separator"></div>
      <button class="context-menu-item danger" data-action="delete">
        <span class="icon">🗑️</span>
        从收藏夹中删除
      </button>
    `;
    
    // 添加到页面
    document.body.appendChild(menu);
    this.currentContextMenu = menu;
    
    // 设置位置
    const x = event.clientX;
    const y = event.clientY;
    
    // 确保菜单不超出屏幕边界
    const menuRect = { width: 160, height: 120 }; // 预估菜单大小
    const adjustedX = Math.min(x, window.innerWidth - menuRect.width - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuRect.height - 10);
    
    menu.style.left = adjustedX + 'px';
    menu.style.top = adjustedY + 'px';
    
    // 添加卡片激活状态
    card.classList.add('context-active');
    
    // 显示菜单
    setTimeout(() => {
      menu.classList.add('show');
    }, 10);
    
    // 绑定菜单事件
    this.bindContextMenuEvents(menu, link, card);
  }
  
  // 绑定右键菜单事件
  bindContextMenuEvents(menu, link, card) {
    const handleMenuClick = (e) => {
      e.stopPropagation();
      const action = e.target.closest('.context-menu-item')?.dataset.action;
      
      switch (action) {
        case 'open':
          window.open(link.url, '_blank');
          break;
        case 'copy':
          this.copyToClipboard(link.url);
          break;
        case 'delete':
          this.showDeleteConfirmation(link, card);
          break;
      }
      
      this.hideContextMenu();
    };
    
    menu.addEventListener('click', handleMenuClick);
  }
  
  // 隐藏右键菜单
  hideContextMenu() {
    if (this.currentContextMenu) {
      this.currentContextMenu.classList.remove('show');
      setTimeout(() => {
        if (this.currentContextMenu && this.currentContextMenu.parentNode) {
          this.currentContextMenu.parentNode.removeChild(this.currentContextMenu);
        }
        this.currentContextMenu = null;
      }, 150);
    }
    
    // 移除所有卡片的激活状态
    document.querySelectorAll('.link-card.context-active').forEach(card => {
      card.classList.remove('context-active');
    });
    
    this.currentBookmarkForContext = null;
  }
  
  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('链接已复制到剪贴板 🐱', 'success');
    } catch (error) {
      console.warn('❌ 复制失败，使用备用方法:', error);
      
      // 备用方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        this.showNotification('链接已复制到剪贴板 🐱', 'success');
      } catch (err) {
        this.showNotification('复制失败 😿', 'error');
      }
      
      document.body.removeChild(textArea);
    }
  }
  
  // 显示删除确认对话框
  showDeleteConfirmation(link, card) {
    console.log('🔍 创建删除确认对话框...');
    
    // 创建确认对话框
    const overlay = document.createElement('div');
    overlay.className = 'delete-confirm-overlay';
    
    // 确保样式正确应用
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    overlay.innerHTML = `
      <div class="delete-confirm-dialog">
        <h3 class="delete-confirm-title">确认删除收藏</h3>
        <div class="delete-confirm-message">
          你确定要从收藏夹中删除 <strong>"${link.title}"</strong> 吗？<br>
          此操作无法撤销。
        </div>
        <div class="delete-confirm-actions">
          <button class="delete-confirm-btn cancel">取消</button>
          <button class="delete-confirm-btn confirm">删除</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    console.log('✅ 对话框已添加到页面');
    
    // 显示对话框
    setTimeout(() => {
      overlay.classList.add('show');
      console.log('✅ 对话框显示动画开始');
      
      // 备用居中方法：手动计算位置
      const dialog = overlay.querySelector('.delete-confirm-dialog');
      if (dialog) {
        const rect = dialog.getBoundingClientRect();
        console.log('📐 对话框尺寸和位置:', {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
        });
        
        // 如果对话框不在屏幕中央，手动调整
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        if (Math.abs(rect.left + rect.width / 2 - centerX) > 50 || 
            Math.abs(rect.top + rect.height / 2 - centerY) > 50) {
          console.log('⚠️ 对话框位置不正确，使用备用居中方法');
          
          // 使用绝对定位手动居中
          dialog.style.position = 'absolute';
          dialog.style.top = '50%';
          dialog.style.left = '50%';
          dialog.style.transform = 'translate(-50%, -50%) scale(1)';
          dialog.style.margin = '0';
        }
      }
    }, 10);
    
    // 绑定按钮事件
    const cancelBtn = overlay.querySelector('.cancel');
    const confirmBtn = overlay.querySelector('.confirm');
    
    const closeDialog = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    };
    
    cancelBtn.addEventListener('click', closeDialog);
    confirmBtn.addEventListener('click', () => {
      this.deleteBookmark(link, card);
      closeDialog();
    });
    
    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDialog();
      }
    });
  }
  
  // 删除收藏夹
  async deleteBookmark(link, card) {
    console.log('🔍 开始删除收藏夹流程:', {
      linkId: link.id,
      linkTitle: link.title,
      linkUrl: link.url
    });
    
    if (!link.id) {
      console.error('❌ 缺少收藏夹ID');
      this.showNotification('无法删除：缺少收藏夹ID 😿', 'error');
      return;
    }
    
    try {
      // 先给卡片添加删除动画
      card.style.transition = 'all 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.8)';
      
      console.log('📡 发送删除请求到后台脚本...');
      
      // 调用后台API删除收藏夹
      let response = await this.sendMessageToBackground({
        action: 'deleteBookmark',
        bookmarkId: link.id
      });
      
      console.log('📨 收到后台脚本响应:', response);
      
      // 如果后台脚本通信失败，尝试直接调用Chrome API
      if (!response.success && response.error && response.error.includes('message port closed')) {
        console.log('🔄 后台脚本通信失败，尝试直接调用Chrome API...');
        try {
          await chrome.bookmarks.remove(link.id);
          response = { success: true, directCall: true };
          console.log('✅ 直接调用Chrome API成功');
        } catch (directError) {
          console.error('❌ 直接调用Chrome API也失败:', directError);
          response = { success: false, error: `后台脚本和直接调用都失败: ${directError.message}` };
        }
      }
      
      if (response.success) {
        // 删除成功，移除卡片
        console.log('✅ 删除成功，移除卡片');
        setTimeout(() => {
          if (card.parentNode) {
            card.parentNode.removeChild(card);
          }
        }, 300);
        
        this.showNotification(`"${link.title}" 已从收藏夹中删除 🐱`, 'success');
        
        // 更新链接计数
        this.updateLinkCount(this.getCurrentLinks().length - 1);
      } else {
        // 删除失败，恢复卡片
        console.error('❌ 删除失败:', response.error);
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
        this.showNotification('删除失败：' + (response.error || '未知错误') + ' 😿', 'error');
      }
    } catch (error) {
      console.error('❌ 删除收藏夹时出错:', error);
      // 恢复卡片
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
      this.showNotification('删除失败：' + error.message + ' 😿', 'error');
    }
  }
  
  // 发送消息到后台脚本
  async sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        resolve({ success: false, error: 'Chrome runtime not available' });
        return;
      }

      // 设置超时机制
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timeout' });
      }, 10000); // 10秒超时

      try {
        chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            console.warn('❌ Chrome runtime error:', chrome.runtime.lastError.message);
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else if (!response) {
            console.warn('❌ No response from background script');
            resolve({ success: false, error: 'No response from background script' });
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Error sending message:', error);
        resolve({ success: false, error: error.message });
      }
    });
  }
  
  // 显示通知
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
      notification.classList.add('slide-out');
    }, 3000);
    
    // 移除通知
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3500);
  }

  // 测试扩展连接（调试用）
  async testExtensionConnection() {
    console.log('🔧 测试扩展连接...');
    
    try {
      const response = await this.sendMessageToBackground({
        action: 'getBookmarksCache'
      });
      
      if (response.success) {
        console.log('✅ 扩展连接正常');
        this.showNotification('扩展连接测试成功 🐱', 'success');
        return true;
      } else {
        console.error('❌ 扩展连接失败:', response.error);
        this.showNotification('扩展连接测试失败：' + response.error + ' 😿', 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ 测试连接时出错:', error);
      this.showNotification('扩展连接测试出错：' + error.message + ' 😿', 'error');
      return false;
    }
  }

  // 设置Tag横向滚动功能
  setupTagScrolling() {
    const tagScrollContainer = document.querySelector('.tag-scroll-container');
    if (!tagScrollContainer) return;

    // 鼠标滚轮横向滚动支持
    tagScrollContainer.addEventListener('wheel', (e) => {
      // 只有在Tag筛选区域内才启用横向滚动
      e.preventDefault();
      
      // 横向滚动
      const scrollAmount = e.deltaY * 0.8; // 调整滚动灵敏度
      tagScrollContainer.scrollLeft += scrollAmount;
    }, { passive: false });

    // 触摸滑动支持（移动端）
    let isDown = false;
    let startX;
    let scrollLeft;

    tagScrollContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      tagScrollContainer.style.cursor = 'grabbing';
      startX = e.pageX - tagScrollContainer.offsetLeft;
      scrollLeft = tagScrollContainer.scrollLeft;
    });

    tagScrollContainer.addEventListener('mouseleave', () => {
      isDown = false;
      tagScrollContainer.style.cursor = 'grab';
    });

    tagScrollContainer.addEventListener('mouseup', () => {
      isDown = false;
      tagScrollContainer.style.cursor = 'grab';
    });

    tagScrollContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - tagScrollContainer.offsetLeft;
      const walk = (x - startX) * 1.5; // 调整拖拽灵敏度
      tagScrollContainer.scrollLeft = scrollLeft - walk;
    });

    // 设置初始光标样式
    tagScrollContainer.style.cursor = 'grab';
  }

  // 绑定事件
  bindEvents() {
    // 文件夹树和其他点击事件
    document.addEventListener('click', (e) => {
      // 如果点击的不是右键菜单相关元素，隐藏右键菜单
      if (!e.target.closest('.context-menu') && !e.target.closest('.link-card')) {
        this.hideContextMenu();
      }
      
      // 文件夹展开/折叠
      if (e.target.closest('.tree-expand')) {
        e.stopPropagation(); // 防止触发文件夹选择
        const folderId = e.target.closest('.tree-expand').dataset.folderId;
        this.toggleFolder(folderId);
      }
      // 文件夹选择
      else if (e.target.closest('.tree-item')) {
        const folderId = e.target.closest('.tree-item').dataset.folderId;
        this.setActiveFolder(folderId);
      }
      
      // 旧的分类按钮（兼容性）
      if (e.target.closest('.category-btn')) {
        const categoryId = e.target.closest('.category-btn').dataset.category;
        this.setActiveCategory(categoryId);
      }
      
      // 点击logo回到Dashboard
      if (e.target.closest('.logo')) {
        this.goToDashboard();
      }
      
      // Tag筛选按钮
      if (e.target.closest('.tag-filter-btn')) {
        const tag = e.target.closest('.tag-filter-btn').dataset.tag;
        this.handleTagFilter(tag);
      }
      
      // 清除Tag筛选按钮
      if (e.target.closest('.clear-tags-btn') || e.target.closest('#clearTagsBtn')) {
        this.clearTagFilters();
      }
    });

    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Tag横向滚动支持
    this.setupTagScrolling();

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // ESC 清除搜索和Tag筛选
      if (e.key === 'Escape') {
        if (this.searchQuery) {
          this.clearSearch();
        } else if (this.selectedTags.size > 0) {
          this.clearTagFilters();
        }
      }
    });
  }
}

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
  const app = new ToolboxApp();
  
  // 将应用实例暴露到全局，方便调试
  window.linkBoardApp = app;
  console.log('🐱 LinkBoard应用已加载，可通过 window.linkBoardApp 访问');
  console.log('💡 调试提示：使用 window.linkBoardApp.testExtensionConnection() 测试扩展连接');
}); 