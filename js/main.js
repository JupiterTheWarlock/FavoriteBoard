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
    
    this.init();
  }

  async init() {
    try {
      console.log('🐱 正在初始化收藏夹面板...');
      
      // 显示加载状态
      this.showLoadingState();
      
      // 等待收藏夹数据加载
      await this.loadBookmarksData();
      
      // 生成分类和链接数据
      this.generateCategoriesFromBookmarks();
      this.generateAllLinks();
      
      // 渲染界面
      this.renderCategories();
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
  
  // 从收藏夹数据生成分类
  generateCategoriesFromBookmarks() {
    // 基础分类
    this.categories = [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: '📊',
        color: '#3498db',
        description: '收藏夹概览统计'
      },
      {
        id: 'all',
        name: '全部',
        icon: '🗂️',
        color: '#95a5a6',
        description: '所有收藏夹'
      }
    ];
    
    // 从收藏夹文件夹生成分类
    const folderTree = this.bookmarkManager.getFolderTree();
    folderTree.forEach((folder, index) => {
      const colors = ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
      const icons = ['📁', '🔖', '⭐', '📌', '🎯', '📝'];
      
      this.categories.push({
        id: folder.id,
        name: folder.title,
        icon: icons[index % icons.length],
        color: colors[index % colors.length],
        description: `${folder.bookmarkCount} 个收藏夹`,
        isFolder: true
      });
    });
    
    console.log('📂 生成了', this.categories.length, '个分类');
  }
  
  // 设置收藏夹事件监听
  setupBookmarkListeners() {
    this.bookmarkManager.on('bookmarks-updated', () => {
      console.log('🔄 收藏夹已更新，重新渲染...');
      this.generateCategoriesFromBookmarks();
      this.generateAllLinks();
      this.renderCategories();
      this.renderLinks();
    });
  }

  // 生成所有链接数组
  generateAllLinks() {
    // 从收藏夹管理器获取所有收藏夹
    this.allLinks = this.bookmarkManager.getAllBookmarks().map(bookmark => ({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.domain || '收藏夹链接',
      icon: null, // 将由getFavicon方法处理
      tags: bookmark.tags || [],
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

  // 渲染分类列表
  renderCategories() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = ''; // 清空现有内容
    
    this.categories.forEach(category => {
      const li = document.createElement('li');
      li.className = 'category-item';
      
      // 计算链接数量
      let linkCount = 0;
      if (category.id === 'all') {
        linkCount = this.allLinks.length;
      } else if (category.id === 'dashboard') {
        linkCount = this.allLinks.length; // Dashboard显示总数
      } else {
        linkCount = this.allLinks.filter(link => link.categoryId === category.id).length;
      }
      
      li.innerHTML = `
        <button class="category-btn" data-category="${category.id}">
          <span class="category-color-indicator" style="background-color: ${category.color}"></span>
          <span class="category-icon">${category.icon}</span>
          <span class="category-name">${category.name}</span>
          <span class="category-count">${linkCount}</span>
        </button>
      `;
      
      categoryList.appendChild(li);
    });
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
      if (this.currentCategory === null || this.currentCategory === 'dashboard') {
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
    
    // 移除链接卡片和Dashboard统计
    const existingCards = linksGrid.querySelectorAll('.link-card');
    const existingStats = linksGrid.querySelector('.dashboard-stats');
    
    existingCards.forEach(card => card.remove());
    if (existingStats) existingStats.remove();
    
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
        link.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
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
      if (cat.id !== 'all' && cat.id !== 'dashboard') {
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
    card.addEventListener('click', () => window.open(link.url, '_blank'));
    
    // 过滤掉域名标签（第一个标签通常是域名）
    const filteredTags = link.tags ? link.tags.slice(1) : [];
    
    const tagsHTML = filteredTags.length > 0 ? 
      `<div class="card-tags">
        ${filteredTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>` : '';
    
    // 如果是dashboard页面、全部页面或全局搜索，显示分类信息
    const categoryBadge = (this.currentCategory === 'dashboard' || this.currentCategory === 'all' || this.searchQuery) && link.categoryName ? 
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
        // 在其他分类中，只搜索当前分类的链接
        const currentCategoryLinks = this.allLinks.filter(link => 
          link.categoryId === this.currentCategory
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
        categoryLinks = this.allLinks.filter(link => link.categoryId === this.currentCategory);
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
      // 具体分类状态
      const category = this.categories.find(cat => cat.id === this.currentCategory);
      if (category) {
        if (categoryTitle) categoryTitle.textContent = category.name;
        if (categoryDesc) categoryDesc.textContent = category.description;
      }
      // 分类页面显示搜索栏
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

  // 回到Dashboard（取消所有分类选择）
  goToDashboard() {
    this.selectedTags.clear();
    this.currentCategory = null;
    
    // 取消所有按钮的active状态
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // 隐藏Tag筛选区域
    const filterSection = document.getElementById('tagFilterSection');
    hideElement(filterSection);
    
    // 更新分类信息
    this.updateCategoryInfo();
    
    // 重新渲染链接
    this.renderLinks();
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
    // 分类切换和logo点击
    document.addEventListener('click', (e) => {
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
  new ToolboxApp();
}); 