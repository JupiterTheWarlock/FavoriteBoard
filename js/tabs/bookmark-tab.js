// FavoriteBoard Plugin - Bookmark Tab
// 收藏夹Tab的具体实现

/**
 * Bookmark Tab - 收藏夹内容管理页面
 * 继承自BaseTab，专门处理收藏夹的渲染和交互
 */
class BookmarkTab extends BaseTab {
  constructor(folderId = null, folderData = null) {
    super('bookmark', '收藏夹', '📁', {
      showSearch: true,         // 显示搜索栏
      supportSearch: true,      // 支持搜索功能
      cache: false             // 不缓存，因为内容可能经常变化
    });
    
    // 收藏夹特有的数据
    this.folderId = folderId;
    this.folderData = folderData;
    this.currentLinks = [];
    this.filteredLinks = [];
    this.searchQuery = '';
    
    // 右键菜单状态
    this.currentContextMenu = null;
    this.currentBookmarkForContext = null;
    
    // 更新Tab标题
    if (folderData) {
      this.title = folderData.title || '收藏夹';
      this.icon = this.getFolderIcon(folderData.title);
    }
    
    console.log(`🐱 创建收藏夹Tab: ${this.folderId} - ${this.title}`);
  }
  
  /**
   * 获取收藏夹Tab描述
   * @returns {string}
   */
  getDescription() {
    if (this.folderId === 'all') {
      return `全部收藏• ${this.currentLinks.length} 个链接`;
    } else if (this.folderData) {
      return `${this.folderData.title} • ${this.currentLinks.length} 个链接`;
    }
    return '收藏夹内容管理';
  }
  
  /**
   * 渲染收藏夹内容
   * @param {HTMLElement} container - 容器元素
   */
  async render(container) {
    try {
      console.log(`🎨 渲染收藏夹Tab: ${this.folderId}`);
      
      // 获取应用实例
      const app = window.linkBoardApp;
      if (!app) {
        throw new Error('找不到应用实例');
      }
      
      // 加载收藏夹数据
      await this.loadBookmarkData(app);
      
      // 渲染收藏夹内容
      this.renderBookmarkContent(container);
      
      // 绑定事件
      this.bindBookmarkEvents();
      
      console.log(`✅ 收藏夹Tab渲染完成: ${this.currentLinks.length} 个链接`);
      
    } catch (error) {
      console.error('❌ 收藏夹Tab渲染失败:', error);
      throw error;
    }
  }
  
  /**
   * 加载收藏夹数据
   * @param {ToolboxApp} app - 应用实例
   */
  async loadBookmarkData(app) {
    try {
      // 根据文件夹ID获取链接数据
      if (this.folderId === 'all') {
        // 显示所有书签
        this.currentLinks = [...(app.allLinks || [])];
      } else if (this.folderId) {
        // 显示特定文件夹的书签
        this.currentLinks = this.getLinksForFolder(app, this.folderId);
      } else {
        // 默认显示所有书签
        this.currentLinks = [...(app.allLinks || [])];
      }
      
      // 按时间倒序排序：最新添加的链接排在前面
      this.currentLinks.sort((a, b) => {
        const aTime = parseInt(a.dateAdded) || 0;
        const bTime = parseInt(b.dateAdded) || 0;
        return bTime - aTime; // 倒序：时间戳大的(新的)在前
      });
      
      // 初始化筛选结果
      this.filteredLinks = [...this.currentLinks];
      
    } catch (error) {
      console.error('❌ 加载收藏夹数据失败:', error);
      this.currentLinks = [];
      this.filteredLinks = [];
    }
  }
  
  /**
   * 获取指定文件夹的链接
   * @param {ToolboxApp} app - 应用实例
   * @param {string} folderId - 文件夹ID
   * @returns {Array} 链接数组
   */
  getLinksForFolder(app, folderId) {
    const allLinks = app.allLinks || [];
    
    // 获取文件夹及其子文件夹的ID
    const folderIds = app.getFolderAndSubfolderIds ? 
      app.getFolderAndSubfolderIds(folderId) : [folderId];
    
    // 筛选属于这些文件夹的链接 - 确保类型一致性
    const matchedLinks = allLinks.filter(link => {
      const parentMatch = folderIds.some(fid => String(fid) === String(link.parentId));
      const folderMatch = folderIds.some(fid => String(fid) === String(link.folderId));
      const isMatch = parentMatch || folderMatch;
      
      return isMatch;
    });
    
    return matchedLinks;
  }
  
  /**
   * 渲染收藏夹内容
   * @param {HTMLElement} container - 容器元素
   */
  renderBookmarkContent(container) {
    // 清空容器
    container.innerHTML = '';
    
    // 创建主容器
    const bookmarkContainer = document.createElement('div');
    bookmarkContainer.className = 'bookmark-tab-container';
    
    // 渲染链接网格
    const linksGrid = this.renderLinksGrid();
    bookmarkContainer.appendChild(linksGrid);
    
    container.appendChild(bookmarkContainer);
  }
  
  /**
   * 渲染链接网格
   * @returns {HTMLElement}
   */
  renderLinksGrid() {
    const gridContainer = document.createElement('div');
    gridContainer.className = 'links-grid-container';
    
    // 如果没有链接，显示空状态
    if (this.filteredLinks.length === 0) {
      const emptyState = this.createEmptyState(
        this.searchQuery ? `没有找到包含 "${this.searchQuery}" 的链接` : '此文件夹没有书签',
        this.searchQuery ? '🔍' : '📭'
      );
      gridContainer.appendChild(emptyState);
      return gridContainer;
    }
    
    // 创建链接网格
    const linksGrid = document.createElement('div');
    linksGrid.className = 'links-grid';
    linksGrid.id = 'linksGrid';
    
    // 渲染每个链接卡片
    this.filteredLinks.forEach(link => {
      const linkCard = this.createLinkCard(link);
      linksGrid.appendChild(linkCard);
    });
    
    gridContainer.appendChild(linksGrid);
    return gridContainer;
  }
  
  /**
   * 创建链接卡片
   * @param {Object} link - 链接对象
   * @returns {HTMLElement}
   */
  createLinkCard(link) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.dataset.linkId = link.id;
    card.dataset.url = link.url;
    
    // 获取安全的图标URL
    const iconUrl = this.getSafeIcon(link.iconUrl, link.url);
    
    card.innerHTML = `
      <div class="card-header">
        <img class="card-icon" src="${iconUrl}" alt="icon" loading="lazy" onerror="this.src='${this.getDefaultIcon()}'">
        <h3 class="card-title" title="${this.escapeHtml(link.title)}">${this.escapeHtml(link.title)}</h3>
        <button class="context-menu-btn" title="更多选项">⋮</button>
      </div>
      <div class="card-description">
        <span class="link-url" title="${this.escapeHtml(link.url)}">${this.escapeHtml(this.getDomainFromUrl(link.url))}</span>
      </div>
    `;
    
    // 绑定卡片事件
    this.bindCardEvents(card, link);
    
    return card;
  }
  
  /**
   * 绑定卡片事件
   * @param {HTMLElement} card - 卡片元素
   * @param {Object} link - 链接对象
   */
  bindCardEvents(card, link) {
    // 点击打开链接
    card.addEventListener('click', (e) => {
      // 如果点击的是上下文菜单按钮，不打开链接
      if (e.target.closest('.context-menu-btn')) {
        return;
      }
      
      // 打开链接
      chrome.tabs.create({ url: link.url });
    });
    
    // 右键菜单
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, link, card);
    });
    
    // 上下文菜单按钮
    const contextBtn = card.querySelector('.context-menu-btn');
    if (contextBtn) {
      contextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showContextMenu(e, link, card);
      });
    }
  }
  
  /**
   * 绑定收藏夹事件
   */
  bindBookmarkEvents() {
    // 点击空白处隐藏上下文菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu')) {
        this.hideContextMenu();
      }
    });
  }
  
  // ==================== 搜索和筛选方法 ====================
  
  /**
   * 处理搜索
   * @param {string} query - 搜索查询
   */
  onSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.applyFilters();
    
    // 重新渲染链接网格
    const gridContainer = this.container?.querySelector('.links-grid-container');
    if (gridContainer) {
      const newGrid = this.renderLinksGrid();
      gridContainer.replaceWith(newGrid);
    }
  }
  
  /**
   * 应用筛选条件
   */
  applyFilters() {
    if (!this.searchQuery) {
      // 没有搜索条件，显示所有链接
      this.filteredLinks = [...this.currentLinks];
    } else {
      // 根据搜索条件筛选链接
      this.filteredLinks = this.currentLinks.filter(link => {
        return link.title.toLowerCase().includes(this.searchQuery) ||
               link.url.toLowerCase().includes(this.searchQuery) ||
               this.getDomainFromUrl(link.url).toLowerCase().includes(this.searchQuery);
      });
    }
    
    console.log(`🔍 筛选结果: ${this.filteredLinks.length}/${this.currentLinks.length} 个链接`);
  }
  
  // ==================== 右键菜单相关方法 ====================
  
  /**
   * 智能定位菜单位置（使用通用工具函数）
   * @param {Event} event - 鼠标事件
   * @param {HTMLElement} menu - 菜单元素
   * @returns {Object} 包含left和top的位置对象
   */
  calculateMenuPosition(event, menu) {
    return calculateSmartMenuPosition(event, menu, {
      margin: 10,
      preferRight: true,
      preferBottom: true
    });
  }
  
  /**
   * 显示右键菜单
   * @param {Event} event - 鼠标事件
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  showContextMenu(event, link, card) {
    // 隐藏之前的菜单
    this.hideContextMenu();
    
    this.currentBookmarkForContext = link;
    
    // 创建菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu show';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="open">
        <span class="icon">🔗</span>
        <span class="menu-text">打开链接</span>
      </div>
      <div class="context-menu-item" data-action="openNewTab">
        <span class="icon">📄</span>
        <span class="menu-text">新标签页打开</span>
      </div>
      <div class="context-menu-item" data-action="copy">
        <span class="icon">📋</span>
        <span class="menu-text">复制链接</span>
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="move">
        <span class="icon">📁</span>
        <span class="menu-text">移动到文件夹</span>
      </div>
      <div class="context-menu-item danger" data-action="delete">
        <span class="icon">🗑️</span>
        <span class="menu-text">删除书签</span>
      </div>
    `;
    
    // 智能定位菜单
    const position = this.calculateMenuPosition(event, menu);
    
    // 设置菜单样式和位置
    menu.style.position = 'fixed';
    menu.style.left = position.left + 'px';
    menu.style.top = position.top + 'px';
    menu.style.zIndex = '10000';
    
    document.body.appendChild(menu);
    this.currentContextMenu = menu;
    
    // 绑定菜单事件
    this.bindContextMenuEvents(menu, link, card);
    
    console.log('🐱 显示右键菜单，位置:', position);
  }
  
  /**
   * 绑定右键菜单事件
   * @param {HTMLElement} menu - 菜单元素
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  bindContextMenuEvents(menu, link, card) {
    const handleMenuClick = (e) => {
      const action = e.target.closest('.context-menu-item')?.dataset.action;
      if (!action) return;
      
      e.stopPropagation();
      
      switch (action) {
        case 'open':
        case 'openNewTab':
          chrome.tabs.create({ url: link.url });
          break;
        case 'copy':
          this.copyToClipboard(link.url);
          this.showNotification('链接已复制到剪贴板', 'success');
          break;
        case 'move':
          this.showMoveToFolderDialog(link);
          break;
        case 'delete':
          this.showDeleteConfirmation(link, card);
          break;
      }
      
      this.hideContextMenu();
    };
    
    menu.addEventListener('click', handleMenuClick);
  }
  
  /**
   * 隐藏右键菜单
   */
  hideContextMenu() {
    if (this.currentContextMenu) {
      document.body.removeChild(this.currentContextMenu);
      this.currentContextMenu = null;
      this.currentBookmarkForContext = null;
    }
  }
  
  // ==================== 工具方法 ====================
  
  /**
   * 获取文件夹图标
   * @param {string} title - 文件夹标题
   * @returns {string}
   */
  getFolderIcon(title) {
    if (!title) return '📁';
    
    const titleLower = title.toLowerCase();
    
    // 特殊文件夹图标映射
    const iconMap = {
      '工作': '💼', 'work': '💼',
      '学习': '📚', 'study': '📚', 'education': '📚',
      '娱乐': '🎮', 'entertainment': '🎮', 'games': '🎮',
      '社交': '💬', 'social': '💬', 'communication': '💬',
      '购物': '🛒', 'shopping': '🛒',
      '新闻': '📰', 'news': '📰',
      '技术': '⚙️', 'tech': '⚙️', 'technology': '⚙️',
      '设计': '🎨', 'design': '🎨',
      '音乐': '🎵', 'music': '🎵',
      '视频': '🎬', 'video': '🎬', 'movies': '🎬',
      '旅游': '✈️', 'travel': '✈️',
      '美食': '🍕', 'food': '🍕'
    };
    
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (titleLower.includes(keyword)) {
        return icon;
      }
    }
    
    return '📁';
  }
  
  /**
   * 获取默认图标
   * @returns {string}
   */
  getDefaultIcon() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzMzNzNkYyIvPgo8cGF0aCBkPSJNOCA0SDEyVjEySDhWNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00IDRIOFYxMkg0VjRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjciLz4KPC9zdmc+';
  }
  
  /**
   * 获取安全的图标URL
   * @param {string} iconUrl - 原始图标URL
   * @param {string} websiteUrl - 网站URL
   * @returns {string}
   */
  getSafeIcon(iconUrl, websiteUrl = null) {
    // 如果没有图标URL，使用默认图标
    if (!iconUrl) {
      return this.getDefaultIcon();
    }
    
    // 如果是有效的URL，直接返回
    if (this.isValidIconUrl(iconUrl)) {
      return iconUrl;
    }
    
    // 尝试从网站URL生成favicon
    if (websiteUrl) {
      try {
        const domain = new URL(websiteUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      } catch (e) {
        // URL解析失败，使用默认图标
      }
    }
    
    return this.getDefaultIcon();
  }
  
  /**
   * 检查图标URL是否有效
   * @param {string} iconUrl - 图标URL
   * @returns {boolean}
   */
  isValidIconUrl(iconUrl) {
    if (!iconUrl || typeof iconUrl !== 'string') return false;
    
    try {
      // 检查是否是data URL
      if (iconUrl.startsWith('data:')) return true;
      
      // 检查是否是有效的HTTP/HTTPS URL
      const url = new URL(iconUrl);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }
  
  /**
   * 从URL获取域名
   * @param {string} url - URL
   * @returns {string}
   */
  getDomainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  }
  
  /**
   * 转义HTML字符
   * @param {string} text - 文本
   * @returns {string}
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 复制到剪贴板
   * @param {string} text - 要复制的文本
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('复制到剪贴板失败:', err);
      throw err;
    }
  }
  
  // TODO: 实现移动和删除相关方法
  // showMoveToFolderDialog, showDeleteConfirmation 等
  // 这些方法比较复杂，需要在后续实现
  
  /**
   * 显示移动到文件夹对话框（占位符）
   * @param {Object} link - 链接对象
   */
  showMoveToFolderDialog(link) {
    this.showNotification('移动功能正在开发中...', 'info');
  }
  
  /**
   * 显示删除确认对话框（占位符）
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  showDeleteConfirmation(link, card) {
    this.showNotification('删除功能正在开发中...', 'info');
  }
  
  // ==================== 生命周期方法重写 ====================
  
  /**
   * Tab激活时调用
   */
  onActivate() {
    super.onActivate();
    
    // 更新页面信息
    this.updatePageTitle();
  }
  
  /**
   * Tab失活时调用
   */
  onDeactivate() {
    super.onDeactivate();
    
    // 隐藏右键菜单
    this.hideContextMenu();
  }
  
  /**
   * 更新页面标题
   */
  updatePageTitle() {
    const categoryInfo = document.getElementById('categoryInfo');
    if (categoryInfo) {
      const titleElement = categoryInfo.querySelector('h3');
      const descElement = categoryInfo.querySelector('p');
      
      if (titleElement) {
        titleElement.textContent = this.getTitle();
      }
      if (descElement) {
        descElement.textContent = this.getDescription();
      }
    }
  }
  
  /**
   * 处理数据更新
   * @param {string} action - 更新动作
   * @param {Object} data - 更新数据
   */
  onDataUpdate(action, data) {
    console.log(`📊 收藏夹Tab数据更新: ${action}`, data);
    
    // 重新加载数据并渲染
    if (this.isActive && this.container) {
      this.loadBookmarkData(window.linkBoardApp).then(() => {
        this.renderBookmarkContent(this.container);
        this.bindBookmarkEvents();
      });
    }
  }
}

// 导出BookmarkTab类到全局作用域
window.BookmarkTab = BookmarkTab; 