class ToolboxApp {
  constructor() {
    this.currentCategory = null; // 默认为null，表示显示Dashboard
    this.searchQuery = '';
    this.filteredLinks = [];
    this.allLinks = [];
    this.selectedTags = new Set(); // 添加选中的Tag集合
    
    this.init();
  }

  init() {
    this.generateAllLinks();
    this.renderCategories();
    this.renderLinks();
    this.bindEvents();
    // 初始状态不选中任何分类，显示Dashboard
    this.updateCategoryInfo();
  }

  // 生成所有链接数组
  generateAllLinks() {
    this.allLinks = [];
    Object.keys(links).forEach(categoryId => {
      if (categoryId !== 'dashboard' && categoryId !== 'all') {
        const categoryData = categories.find(cat => cat.id === categoryId);
        links[categoryId].forEach(link => {
          this.allLinks.push({
            ...link,
            categoryId: categoryId,
            categoryName: categoryData ? categoryData.name : categoryId,
            categoryIcon: categoryData ? categoryData.icon : '📂'
          });
        });
      }
    });
    
    // 将所有链接赋值给'all'分类，dashboard保持空数组
    links['all'] = this.allLinks;
    links['dashboard'] = [];
  }

  // 渲染分类列表
  renderCategories() {
    const categoryList = document.getElementById('categoryList');
    
    categories.forEach(category => {
      const li = document.createElement('li');
      li.className = 'category-item';
      
      const linkCount = links[category.id] ? links[category.id].length : 0;
      
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
  renderLinks() {
    const currentLinks = this.getCurrentLinks();
    const linksGrid = document.getElementById('linksGrid');
    const emptyState = document.getElementById('emptyState');
    
    // 先清理所有现有内容
    this.clearLinksGrid();
    
    // 如果没有选中分类（currentCategory为null），显示Dashboard
    if (this.currentCategory === null) {
      this.renderDashboardStats();
      // Dashboard不显示链接卡片，直接返回
      this.updateLinkCount(this.allLinks.length); // 显示总链接数
      return;
    }
    
    // 渲染Tag筛选器（所有分类页面都显示，包括"全部"页面）
    this.renderTagFilters();
    
    if (currentLinks.length === 0) {
      linksGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    linksGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    // 渲染链接卡片
    currentLinks.forEach(link => {
      const card = this.createLinkCard(link);
      linksGrid.appendChild(card);
    });
    
    this.updateLinkCount(currentLinks.length);
  }

  // 清理链接网格内容
  clearLinksGrid() {
    const linksGrid = document.getElementById('linksGrid');
    
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
      filterSection.style.display = 'none';
      return;
    }
    
    // 显示筛选区域
    filterSection.style.display = 'block';
    
    // 更新清除按钮显示状态
    clearTagsBtn.style.display = this.selectedTags.size === 0 ? 'none' : 'inline-block';
    
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
    
    // 使用TagManager的方法来获取当前分类的Tag
    if (typeof tagManager !== 'undefined') {
      return tagManager.getTagsByCategory(this.currentCategory);
    }
    
    // 备用方法（如果tagManager不可用）
    const categoryLinks = links[this.currentCategory] || [];
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
    
    // 遍历所有分类（除了dashboard和all）
    Object.keys(links).forEach(categoryId => {
      if (categoryId !== 'dashboard' && categoryId !== 'all') {
        const categoryLinks = links[categoryId] || [];
        categoryLinks.forEach(link => {
          if (link.tags && Array.isArray(link.tags)) {
            link.tags.forEach(tag => tagsSet.add(tag));
          }
        });
      }
    });
    
    return Array.from(tagsSet).sort();
  }

  // 渲染DashBoard统计信息
  renderDashboardStats() {
    const linksGrid = document.getElementById('linksGrid');
    
    // 计算统计数据
    const totalLinks = this.allLinks.length;
    const categoryStats = {};
    
    categories.forEach(cat => {
      if (cat.id !== 'all') {
        categoryStats[cat.id] = {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          count: links[cat.id] ? links[cat.id].length : 0
        };
      }
    });
    
    // 创建统计卡片
    const statsCard = document.createElement('div');
    statsCard.className = 'dashboard-stats';
    statsCard.innerHTML = `
      <div class="stats-header">
        <h3>📊 网站统计</h3>
        <p>链接收藏总览</p>
      </div>
      <div class="stats-grid">
        <div class="stat-item total">
          <span class="stat-number">${totalLinks}</span>
          <span class="stat-label">总链接数</span>
        </div>
        <div class="stat-item categories">
          <span class="stat-number">${Object.keys(categoryStats).length}</span>
          <span class="stat-label">分类数量</span>
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
    card.onclick = () => window.open(link.url, '_blank');
    
    const tagsHTML = link.tags ? 
      `<div class="card-tags">
        ${link.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>` : '';
    
    // 如果是dashboard页面、全部页面或全局搜索，显示分类信息
    const categoryBadge = (this.currentCategory === 'dashboard' || this.currentCategory === 'all' || this.searchQuery) && link.categoryName ? 
      `<div class="category-badge">
        <span class="category-badge-icon">${link.categoryIcon}</span>
        <span class="category-badge-name">${link.categoryName}</span>
      </div>` : '';
    
    // 处理图标，如果为空或无效则使用默认图标
    const iconSrc = this.getSafeIcon(link.icon, link.url);
    
    card.innerHTML = `
      <div class="card-header">
        <img class="card-icon" src="${iconSrc}" alt="${link.title}" 
             onerror="this.src='${this.getDefaultIcon()}'">
        <h3 class="card-title">${link.title}</h3>
      </div>
      ${categoryBadge}
      <p class="card-description">${link.description}</p>
      ${tagsHTML}
    `;
    
    return card;
  }

  // 获取当前分类的链接
  getCurrentLinks() {
    // Dashboard状态下不返回链接
    if (this.currentCategory === null) {
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
        const currentCategoryLinks = links[this.currentCategory] || [];
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
      categoryLinks = links[this.currentCategory] || [];
    }
    
    // Tag筛选
    if (this.selectedTags.size > 0) {
      categoryLinks = categoryLinks.filter(link => {
        if (!link.tags || !Array.isArray(link.tags)) return false;
        
        // 只要包含任一选中的tag即可显示
        return Array.from(this.selectedTags).some(selectedTag => 
          link.tags.includes(selectedTag)
        );
      });
    }
    
    return categoryLinks;
  }

  // 更新分类信息
  updateCategoryInfo() {
    const categoryTitle = document.querySelector('.category-title');
    const categoryDesc = document.querySelector('.category-desc');
    const searchBar = document.getElementById('searchBar');
    
    if (this.currentCategory === null) {
      // Dashboard状态 - 使用siteConfig配置
      if (typeof siteConfig !== 'undefined' && siteConfig.dashboard) {
        if (categoryTitle) categoryTitle.textContent = siteConfig.dashboard.title || 'Dashboard';
        if (categoryDesc) categoryDesc.textContent = siteConfig.dashboard.subtitle || '数据统计和网站概览';
      } else {
        if (categoryTitle) categoryTitle.textContent = 'Dashboard';
        if (categoryDesc) categoryDesc.textContent = '数据统计和网站概览';
      }
      // Dashboard状态下隐藏搜索栏
      if (searchBar) {
        searchBar.style.display = 'none';
      }
    } else {
      // 具体分类状态
      const category = categories.find(cat => cat.id === this.currentCategory);
      if (category) {
        if (categoryTitle) categoryTitle.textContent = category.name;
        if (categoryDesc) categoryDesc.textContent = category.description;
      }
      // 分类页面显示搜索栏
      if (searchBar) {
        searchBar.style.display = 'block';
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
    clearBtn.style.display = this.searchQuery ? 'block' : 'none';
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
      filterSection.style.display = 'none';
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
    filterSection.style.display = 'none';
    
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