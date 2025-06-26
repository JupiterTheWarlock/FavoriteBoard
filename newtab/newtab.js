// FavoriteBoard Plugin - New Tab Script
// 新标签页主脚本

class FavoriteBoardApp {
  constructor() {
    this.bookmarkManager = null;
    this.currentFolderId = null; // null 表示显示所有收藏夹
    this.searchQuery = '';
    this.selectedTags = new Set();
    this.filteredBookmarks = [];
    
    console.log('🐱 FavoriteBoardApp initializing...');
    this.init();
  }
  
  async init() {
    try {
      // 显示加载状态
      this.showLoading();
      
      // 初始化收藏夹管理器
      this.bookmarkManager = new BookmarkManager();
      
      // 监听收藏夹事件
      this.setupBookmarkEvents();
      
      // 加载收藏夹数据
      await this.bookmarkManager.loadBookmarks();
      
      // 绑定事件（在渲染前绑定，确保错误状态下也能工作）
      this.bindEvents();
      
      // 渲染界面
      this.renderFolderTree();
      this.renderBookmarks();
      
      // 隐藏加载状态，显示主界面
      this.showMainApp();
      
      console.log('✅ FavoriteBoardApp initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing FavoriteBoardApp:', error);
      
      // 即使出错也要绑定基本事件
      this.bindEvents();
      
      this.showError(error);
    }
  }
  
  // 设置收藏夹事件监听
  setupBookmarkEvents() {
    this.bookmarkManager.on('bookmarks-loaded', (data) => {
      console.log('📊 Bookmarks loaded, updating UI...');
      this.renderFolderTree();
      this.renderBookmarks();
    });
    
    this.bookmarkManager.on('bookmarks-updated', (data) => {
      console.log('🔄 Bookmarks updated, refreshing UI...');
      this.renderFolderTree();
      this.renderBookmarks();
    });
    
    this.bookmarkManager.on('bookmarks-error', (error) => {
      console.error('❌ Bookmarks error:', error);
      this.showError(error);
    });
  }
  
  // 显示加载状态
  showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
  }
  
  // 显示主应用
  showMainApp() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
  }
  
  // 显示错误状态
  showError(error) {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    const errorDetails = document.getElementById('errorDetails');
    if (errorDetails) {
      errorDetails.textContent = error.message || '未知错误';
    }
  }
  
  // 渲染文件夹树
  renderFolderTree() {
    const folderTree = document.getElementById('folderTree');
    if (!folderTree) return;
    
    const folders = this.bookmarkManager.getFolderTree();
    
    // 清空现有内容
    folderTree.innerHTML = '';
    
    // 添加"所有收藏夹"根节点
    const allBookmarksItem = this.createFolderItem({
      id: null,
      title: '所有收藏夹',
      bookmarkCount: this.bookmarkManager.getStats().totalBookmarks,
      isRoot: true
    });
    folderTree.appendChild(allBookmarksItem);
    
    // 递归渲染文件夹树
    folders.forEach(folder => {
      const folderItem = this.createFolderTreeNode(folder);
      folderTree.appendChild(folderItem);
    });
  }
  
  // 创建文件夹树节点
  createFolderTreeNode(folder) {
    const item = document.createElement('div');
    item.className = 'folder-tree-item';
    item.dataset.folderId = folder.id;
    
    const hasChildren = folder.children && folder.children.length > 0;
    
    item.innerHTML = `
      <div class="folder-item ${this.currentFolderId === folder.id ? 'active' : ''}" 
           data-folder-id="${folder.id}">
        ${hasChildren ? `<span class="folder-toggle ${folder.isExpanded ? 'expanded' : ''}" data-folder-id="${folder.id}">▶</span>` : '<span class="folder-spacer"></span>'}
        <span class="folder-icon">📁</span>
        <span class="folder-title">${this.escapeHtml(folder.title)}</span>
        <span class="folder-count">${folder.bookmarkCount}</span>
      </div>
      ${hasChildren ? `<div class="folder-children ${folder.isExpanded ? 'expanded' : ''}" data-folder-id="${folder.id}"></div>` : ''}
    `;
    
    // 如果有子文件夹，递归添加
    if (hasChildren && folder.isExpanded) {
      const childrenContainer = item.querySelector('.folder-children');
      folder.children.forEach(child => {
        const childItem = this.createFolderTreeNode(child);
        childrenContainer.appendChild(childItem);
      });
    }
    
    return item;
  }
  
  // 创建文件夹项
  createFolderItem(folder) {
    const item = document.createElement('div');
    item.className = `folder-item ${folder.isRoot ? 'root-folder' : ''} ${this.currentFolderId === folder.id ? 'active' : ''}`;
    item.dataset.folderId = folder.id;
    
    const icon = folder.isRoot ? '🔖' : '📁';
    
    item.innerHTML = `
      <span class="folder-icon">${icon}</span>
      <span class="folder-title">${this.escapeHtml(folder.title)}</span>
      <span class="folder-count">${folder.bookmarkCount}</span>
    `;
    
    return item;
  }
  
  // 渲染收藏夹
  renderBookmarks() {
    const currentBookmarks = this.getCurrentBookmarks();
    const linksGrid = document.getElementById('linksGrid');
    const emptyState = document.getElementById('emptyState');
    
    // 更新当前文件夹信息
    this.updateFolderInfo();
    
    // 渲染标签筛选器
    this.renderTagFilters();
    
    if (currentBookmarks.length === 0) {
      linksGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    linksGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    // 清空现有内容
    linksGrid.innerHTML = '';
    
    // 渲染收藏夹卡片
    currentBookmarks.forEach(bookmark => {
      const card = this.createBookmarkCard(bookmark);
      linksGrid.appendChild(card);
    });
    
    this.updateLinkCount(currentBookmarks.length);
  }
  
  // 获取当前显示的收藏夹
  getCurrentBookmarks() {
    let bookmarks;
    
    // 根据当前文件夹获取收藏夹
    if (this.currentFolderId === null) {
      bookmarks = this.bookmarkManager.getAllBookmarks();
    } else {
      bookmarks = this.bookmarkManager.getBookmarksInFolder(this.currentFolderId);
    }
    
    // 应用搜索筛选
    if (this.searchQuery) {
      bookmarks = this.bookmarkManager.searchBookmarks(this.searchQuery);
      if (this.currentFolderId !== null) {
        // 如果在特定文件夹内搜索，只保留该文件夹的结果
        bookmarks = bookmarks.filter(bookmark => bookmark.parentId === this.currentFolderId);
      }
    }
    
    // 应用标签筛选
    if (this.selectedTags.size > 0) {
      bookmarks = this.bookmarkManager.filterByTags(Array.from(this.selectedTags), bookmarks);
    }
    
    this.filteredBookmarks = bookmarks;
    return bookmarks;
  }
  
  // 创建收藏夹卡片
  createBookmarkCard(bookmark) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.dataset.bookmarkId = bookmark.id;
    
    // 获取域名作为描述
    const description = bookmark.domain ? `来自 ${bookmark.domain}` : '收藏夹链接';
    
    card.innerHTML = `
      <div class="card-header">
        <img class="site-icon" src="${this.bookmarkManager.getDefaultFavicon()}" 
             alt="${this.escapeHtml(bookmark.title)}" 
             data-url="${bookmark.url}">
        <h3 class="site-title">${this.escapeHtml(bookmark.title)}</h3>
      </div>
      <p class="site-description">${this.escapeHtml(description)}</p>
      <div class="card-footer">
        <div class="tags">
          ${bookmark.tags ? bookmark.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
        </div>
        <div class="card-url">${this.escapeHtml(bookmark.domain || new URL(bookmark.url).hostname)}</div>
      </div>
    `;
    
    // 异步加载网站图标
    this.loadBookmarkFavicon(card, bookmark.url);
    
    return card;
  }
  
  // 异步加载收藏夹图标
  async loadBookmarkFavicon(card, url) {
    const iconElement = card.querySelector('.site-icon');
    if (!iconElement) return;
    
    try {
      // 先设置默认图标
      iconElement.src = this.bookmarkManager.getDefaultFavicon();
      
      // 获取favicon
      const favicon = await this.bookmarkManager.getFavicon(url);
      if (favicon) {
        // 创建新的图片对象来测试URL是否有效
        const testImg = new Image();
        testImg.onload = () => {
          // 图标加载成功，设置到元素上
          iconElement.src = favicon;
        };
        testImg.onerror = () => {
          // 图标加载失败，保持默认图标
          console.warn('⚠️ Failed to load favicon:', favicon);
        };
        testImg.src = favicon;
      }
    } catch (error) {
      console.warn('⚠️ Error loading favicon for:', url, error);
      // 确保使用默认图标
      iconElement.src = this.bookmarkManager.getDefaultFavicon();
    }
  }
  
  // 渲染标签筛选器
  renderTagFilters() {
    const filterSection = document.getElementById('tagFilterSection');
    const tagList = document.getElementById('tagList');
    const clearTagsBtn = document.getElementById('clearTagsBtn');
    
    // 获取当前的标签
    const currentTags = this.getCurrentTags();
    
    if (currentTags.length === 0) {
      filterSection.style.display = 'none';
      return;
    }
    
    filterSection.style.display = 'block';
    clearTagsBtn.style.display = this.selectedTags.size === 0 ? 'none' : 'inline-block';
    
    // 渲染标签按钮
    tagList.innerHTML = currentTags.map(tag => `
      <button class="tag-filter-btn ${this.selectedTags.has(tag) ? 'active' : ''}" 
              data-tag="${this.escapeHtml(tag)}">
        ${this.escapeHtml(tag)}
      </button>
    `).join('');
  }
  
  // 获取当前的标签
  getCurrentTags() {
    if (this.currentFolderId === null) {
      return this.bookmarkManager.getAllTags();
    } else {
      return this.bookmarkManager.getTagsInFolder(this.currentFolderId);
    }
  }
  
  // 更新文件夹信息
  updateFolderInfo() {
    const titleElement = document.getElementById('categoryTitle');
    const descElement = document.getElementById('categoryDesc');
    
    if (this.currentFolderId === null) {
      titleElement.textContent = '所有收藏夹';
      descElement.textContent = '浏览器收藏夹概览';
    } else {
      const folder = this.findFolderById(this.currentFolderId);
      if (folder) {
        titleElement.textContent = folder.title;
        descElement.textContent = folder.path || folder.title;
      }
    }
  }
  
  // 根据ID查找文件夹
  findFolderById(folderId) {
    const folders = this.bookmarkManager.getFolderTree();
    
    function findRecursive(folderList) {
      for (const folder of folderList) {
        if (folder.id === folderId) return folder;
        if (folder.children) {
          const found = findRecursive(folder.children);
          if (found) return found;
        }
      }
      return null;
    }
    
    return findRecursive(folders);
  }
  
  // 更新链接计数
  updateLinkCount(count) {
    const linkCountElement = document.getElementById('linkCount');
    if (linkCountElement) {
      linkCountElement.textContent = count;
    }
  }
  
  // 绑定事件
  bindEvents() {
    // 重试按钮事件
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
    
    // 文件夹点击事件
    document.addEventListener('click', (e) => {
      // 文件夹项点击
      if (e.target.closest('.folder-item')) {
        const folderItem = e.target.closest('.folder-item');
        const folderId = folderItem.dataset.folderId;
        this.selectFolder(folderId === 'null' ? null : folderId);
        return;
      }
      
      // 文件夹展开/折叠
      if (e.target.classList.contains('folder-toggle')) {
        const folderId = e.target.dataset.folderId;
        this.toggleFolder(folderId);
        return;
      }
      
      // 收藏夹卡片点击
      if (e.target.closest('.link-card')) {
        const card = e.target.closest('.link-card');
        const bookmarkId = card.dataset.bookmarkId;
        this.openBookmark(bookmarkId);
        return;
      }
      
      // 标签筛选点击
      if (e.target.classList.contains('tag-filter-btn')) {
        const tag = e.target.dataset.tag;
        this.toggleTag(tag);
        return;
      }
    });
    
    // 搜索事件
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }
    
    // 清除搜索按钮
    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }
    
    // 清除标签筛选按钮
    const clearTagsBtn = document.getElementById('clearTagsBtn');
    if (clearTagsBtn) {
      clearTagsBtn.addEventListener('click', () => {
        this.clearTagFilters();
      });
    }
  }
  
  // 选择文件夹
  selectFolder(folderId) {
    this.currentFolderId = folderId;
    
    // 更新UI中的活动状态
    document.querySelectorAll('.folder-item').forEach(item => {
      const itemFolderId = item.dataset.folderId;
      if ((itemFolderId === 'null' && folderId === null) || itemFolderId === folderId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // 重新渲染收藏夹
    this.renderBookmarks();
    
    console.log(`📁 Selected folder: ${folderId || 'All'}`);
  }
  
  // 切换文件夹展开/折叠
  toggleFolder(folderId) {
    const toggle = document.querySelector(`.folder-toggle[data-folder-id="${folderId}"]`);
    const children = document.querySelector(`.folder-children[data-folder-id="${folderId}"]`);
    
    if (toggle && children) {
      const isExpanded = toggle.classList.contains('expanded');
      
      if (isExpanded) {
        toggle.classList.remove('expanded');
        children.classList.remove('expanded');
      } else {
        toggle.classList.add('expanded');
        children.classList.add('expanded');
        
        // 如果子文件夹还没有渲染，现在渲染
        if (children.children.length === 0) {
          const folder = this.findFolderById(folderId);
          if (folder && folder.children) {
            folder.children.forEach(child => {
              const childItem = this.createFolderTreeNode(child);
              children.appendChild(childItem);
            });
          }
        }
      }
    }
  }
  
  // 打开收藏夹
  openBookmark(bookmarkId) {
    const bookmark = this.bookmarkManager.getAllBookmarks().find(b => b.id === bookmarkId);
    if (bookmark) {
      console.log(`🔗 Opening bookmark: ${bookmark.title}`);
      window.open(bookmark.url, '_blank');
    }
  }
  
  // 处理搜索
  handleSearch(query) {
    this.searchQuery = query.trim();
    
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
      clearBtn.style.display = this.searchQuery ? 'block' : 'none';
    }
    
    this.renderBookmarks();
  }
  
  // 清除搜索
  clearSearch() {
    this.searchQuery = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
    }
    
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
      clearBtn.style.display = 'none';
    }
    
    this.renderBookmarks();
  }
  
  // 切换标签筛选
  toggleTag(tag) {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    
    this.renderBookmarks();
  }
  
  // 清除标签筛选
  clearTagFilters() {
    this.selectedTags.clear();
    this.renderBookmarks();
  }
  
  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM loaded, initializing FavoriteBoardApp...');
  new FavoriteBoardApp();
}); 