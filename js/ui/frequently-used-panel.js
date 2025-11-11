// FavoriteBoard Plugin - Frequently Used Panel
// 常用网页面板组件

/**
 * FrequentlyUsedPanel - 常用网页面板组件
 * 负责常用网页的UI渲染和交互逻辑
 * 实现事件驱动架构，与FrequentlyUsedManager集成
 */
class FrequentlyUsedPanel {
  constructor(eventBus, stateManager, frequentlyUsedManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.frequentlyUsedManager = frequentlyUsedManager;
    
    // 组件状态
    this.isRendered = false;
    this.currentData = null;
    this.container = null;
    
    // 事件监听器引用（用于清理）
    this.eventListeners = new Map();
    
    console.log('⭐ FrequentlyUsedPanel initialized');
    
    // 设置事件监听
    this.setupEventListeners();
  }
  
  // ==================== 生命周期方法 ====================
  
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    console.log('🔗 Setting up FrequentlyUsedPanel event listeners...');
    
    // 监听常用网页数据变化
    this.eventBus.on('frequently-used-loaded', this.handleDataLoaded.bind(this), { unique: true });
    this.eventBus.on('frequently-used-added', this.handleWebsiteAdded.bind(this), { unique: true });
    this.eventBus.on('frequently-used-removed', this.handleWebsiteRemoved.bind(this), { unique: true });
    this.eventBus.on('frequently-used-updated', this.handleWebsiteUpdated.bind(this), { unique: true });
    this.eventBus.on('frequently-used-error', this.handleError.bind(this), { unique: true });
    
    // 监听存储状态通知
    this.eventBus.on('storage-status-notification', this.handleStorageStatusNotification.bind(this), { unique: true });
    
    // 监听收藏夹数据变化（可能需要更新网页信息）
    this.eventBus.on('bookmark-updated', this.handleBookmarkUpdate.bind(this), { unique: true });
    
    console.log('✅ FrequentlyUsedPanel event listeners setup complete');
  }
  
  /**
   * 渲染常用网页面板
   * @param {HTMLElement} container - 容器元素
   * @returns {Promise<void>}
   */
  async render(container) {
    try {
      console.log('🎨 Rendering frequently used panel...');
      
      this.container = container;
      
      // 显示加载状态
      this.showLoadingState();
      
      // 获取常用网页数据
      const data = await this.frequentlyUsedManager.getFrequentlyUsedWebsites();
      this.currentData = data;
      
      // 渲染面板内容
      this.renderPanelContent(data);
      
      // 绑定交互事件
      this.bindPanelEvents();
      
      this.isRendered = true;
      console.log('✅ Frequently used panel rendered successfully');
      
    } catch (error) {
      console.error('❌ Error rendering frequently used panel:', error);
      this.showErrorState(error);
    }
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    console.log('🗑️ Destroying FrequentlyUsedPanel...');
    
    // 清理事件监听器
    this.cleanupEventListeners();
    
    // 清理DOM引用
    this.container = null;
    this.currentData = null;
    this.isRendered = false;
    
    console.log('✅ FrequentlyUsedPanel destroyed');
  }
  
  // ==================== 渲染方法 ====================
  
  /**
   * 渲染面板内容
   * @param {Object} data - 常用网页数据
   */
  renderPanelContent(data) {
    if (!this.container) {
      console.warn('⚠️ Container not available for rendering');
      return;
    }
    
    const { urls = [] } = data;
    
    this.container.innerHTML = `
      <div class="frequently-used-panel">
        <div class="panel-header">
          <h3>⭐ 常用网页</h3>
          <span class="count">(${urls.length})</span>
        </div>
        <div class="frequently-used-grid">
          ${this.renderWebsiteButtons(urls)}
        </div>
        ${this.renderEmptyState(urls)}
      </div>
    `;
    
    // 隐藏加载状态
    this.hideLoadingState();
  }
  
  /**
   * 渲染常用网页按钮
   * @param {Array} websites - 网页列表
   * @returns {string}
   */
  renderWebsiteButtons(websites) {
    if (!websites || websites.length === 0) {
      return '';
    }
    
    return websites.map(website => `
      <div class="frequently-used-button" 
           data-url="${escapeHtml(website.url)}"
           data-title="${escapeHtml(website.title)}"
           title="${escapeHtml(website.title)}">
        <img class="website-icon" 
             src="${getSafeIcon(website.icon, website.url)}" 
             alt="icon" 
             loading="lazy"
             data-fallback="${getDefaultIcon()}">
        <button class="remove-btn" title="移除常用网页">×</button>
      </div>
    `).join('');
  }
  
  /**
   * 渲染空状态
   * @param {Array} websites - 网页列表
   * @returns {string}
   */
  renderEmptyState(websites) {
    if (websites && websites.length > 0) {
      return '';
    }
    
    return `
      <div class="frequently-used-empty">
        <div class="empty-icon">⭐</div>
        <div class="empty-message">暂无常用网页</div>
        <div class="empty-hint">右键点击收藏夹中的网页，选择"设为常用网页"</div>
      </div>
    `;
  }
  
  /**
   * 显示加载状态
   */
  showLoadingState() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="frequently-used-panel">
        <div class="panel-header">
          <h3>⭐ 常用网页</h3>
        </div>
        <div class="loading-state">
          <div class="loading-icon">⏳</div>
          <div class="loading-text">加载中...</div>
        </div>
      </div>
    `;
  }
  
  /**
   * 隐藏加载状态
   */
  hideLoadingState() {
    // 加载状态会在renderPanelContent中被替换
  }
  
  /**
   * 显示错误状态
   * @param {Error} error - 错误对象
   */
  showErrorState(error) {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="frequently-used-panel">
        <div class="panel-header">
          <h3>⭐ 常用网页</h3>
        </div>
        <div class="error-state">
          <div class="error-icon">❌</div>
          <div class="error-text">加载失败</div>
          <div class="error-detail">${escapeHtml(error.message)}</div>
          <button class="retry-btn" onclick="this.retryLoad()">重试</button>
        </div>
      </div>
    `;
  }
  
  // ==================== 事件绑定方法 ====================
  
  /**
   * 绑定面板交互事件
   */
  bindPanelEvents() {
    if (!this.container) return;
    
    // 绑定常用网页按钮点击事件
    const buttons = this.container.querySelectorAll('.frequently-used-button');
    buttons.forEach(button => {
      this.bindWebsiteButtonEvents(button);
    });
    
    // 绑定重试按钮事件
    const retryBtn = this.container.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', this.retryLoad.bind(this));
    }
  }
  
  /**
   * 绑定网页按钮事件
   * @param {HTMLElement} button - 按钮元素
   */
  bindWebsiteButtonEvents(button) {
    const url = button.dataset.url;
    const title = button.dataset.title;
    
    if (!url) return;
    
    // 左键点击 - 打开网页
    button.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        return; // 移除按钮的点击事件单独处理
      }
      
      this.handleWebsiteClick(url, title);
    });
    
    // 右键点击 - 显示上下文菜单
    button.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleWebsiteContextMenu(e, url, title);
    });
    
    // 移除按钮点击
    const removeBtn = button.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleRemoveWebsite(url, title);
      });
    }
    
    // 图标加载错误处理（统一流程）
    const iconImg = button.querySelector('.website-icon');
    if (iconImg && url) {
      setupIconErrorHandling(iconImg, url);
    }
  }
  
  // ==================== 事件处理方法 ====================
  
  /**
   * 处理数据加载完成事件
   * @param {Object} data - 加载的数据
   */
  handleDataLoaded(data) {
    console.log('📊 Frequently used data loaded:', data);
    
    if (this.isRendered) {
      this.currentData = data;
      this.renderPanelContent(data);
      this.bindPanelEvents();
    }
  }
  
  /**
   * 处理网页添加事件
   * @param {Object} eventData - 事件数据
   */
  handleWebsiteAdded(eventData) {
    console.log('➕ Website added to frequently used:', eventData);
    
    if (this.isRendered) {
      // 重新渲染以显示新添加的网页
      this.refreshPanel();
    }
  }
  
  /**
   * 处理网页移除事件
   * @param {Object} eventData - 事件数据
   */
  handleWebsiteRemoved(eventData) {
    console.log('🗑️ Website removed from frequently used:', eventData);
    
    if (this.isRendered) {
      // 重新渲染以移除网页
      this.refreshPanel();
    }
  }
  
  /**
   * 处理网页更新事件
   * @param {Object} eventData - 事件数据
   */
  handleWebsiteUpdated(eventData) {
    console.log('🔄 Website updated in frequently used:', eventData);
    
    if (this.isRendered) {
      // 重新渲染以更新网页信息
      this.refreshPanel();
    }
  }
  
  /**
   * 处理错误事件
   * @param {Error} error - 错误对象
   */
  handleError(error) {
    console.error('❌ Frequently used panel error:', error);
    
    if (this.isRendered) {
      this.showErrorState(error);
    }
  }
  
  /**
   * 处理收藏夹更新事件
   * @param {Object} eventData - 事件数据
   */
  handleBookmarkUpdate(eventData) {
    console.log('📚 Bookmark updated, refreshing frequently used panel');
    
    if (this.isRendered) {
      // 收藏夹更新可能影响网页信息，重新加载数据
      this.refreshPanel();
    }
  }

  /**
   * 处理存储状态通知
   * @param {Object} eventData - 事件数据
   */
  handleStorageStatusNotification(eventData) {
    const { message, type } = eventData;
    console.log(`📦 Storage Status Notification: ${message} (${type})`);
    this.showNotification(message, type);
  }
  
  // ==================== 交互处理方法 ====================
  
  /**
   * 处理网页点击
   * @param {string} url - 网页URL
   * @param {string} title - 网页标题
   */
  handleWebsiteClick(url, title) {
    console.log('🖱️ Frequently used website clicked:', url);
    
    try {
      // 更新最后使用时间
      this.frequentlyUsedManager.updateLastUsed(url);
      
      // 打开网页
      window.open(url, '_blank');
      
      // 显示通知
      this.showNotification(`正在打开: ${title}`, 'info');
      
    } catch (error) {
      console.error('❌ Error opening frequently used website:', error);
      this.showNotification('打开网页失败', 'error');
    }
  }
  
  /**
   * 处理网页右键菜单
   * @param {Event} event - 右键事件
   * @param {string} url - 网页URL
   * @param {string} title - 网页标题
   */
  handleWebsiteContextMenu(event, url, title) {
    console.log('🖱️ Frequently used website context menu:', url);
    
    // 获取UI管理器
    const app = window.linkBoardApp;
    if (!app || !app.uiManager) {
      console.warn('⚠️ UIManager not available');
      return;
    }
    
    const contextMenuManager = app.uiManager.getContextMenuManager();
    if (!contextMenuManager) {
      console.warn('⚠️ ContextMenuManager not available');
      return;
    }
    
    // 显示常用网页的上下文菜单
    contextMenuManager.showFrequentlyUsedMenu(event, url, title);
  }
  
  /**
   * 处理移除网页
   * @param {string} url - 网页URL
   * @param {string} title - 网页标题
   */
  async handleRemoveWebsite(url, title) {
    console.log('🗑️ Removing frequently used website:', url);
    
    try {
      // 显示确认对话框
      const confirmed = await this.showConfirmDialog(
        '移除常用网页',
        `确定要移除"${title}"吗？`,
        '移除',
        '取消'
      );
      
      if (!confirmed) {
        return;
      }
      
      // 移除网页
      await this.frequentlyUsedManager.removeFrequentlyUsedWebsite(url);
      
      // 显示成功通知
      this.showNotification(`已移除: ${title}`, 'success');
      
    } catch (error) {
      console.error('❌ Error removing frequently used website:', error);
      this.showNotification('移除失败，请稍后重试', 'error');
    }
  }
  
  /**
   * 重试加载
   */
  async retryLoad() {
    console.log('🔄 Retrying frequently used panel load...');
    
    try {
      await this.render(this.container);
    } catch (error) {
      console.error('❌ Retry load failed:', error);
      this.showErrorState(error);
    }
  }
  
  /**
   * 刷新面板
   */
  async refreshPanel() {
    if (!this.isRendered || !this.container) {
      return;
    }
    
    try {
      const data = await this.frequentlyUsedManager.getFrequentlyUsedWebsites();
      this.currentData = data;
      this.renderPanelContent(data);
      this.bindPanelEvents();
    } catch (error) {
      console.error('❌ Error refreshing frequently used panel:', error);
      this.showErrorState(error);
    }
  }
  
  // ==================== 工具方法 ====================
  
  /**
   * 显示通知
   * @param {string} message - 消息内容
   * @param {string} type - 通知类型
   */
  showNotification(message, type = 'info') {
    const app = window.linkBoardApp;
    if (app && app.uiManager) {
      app.uiManager.showNotification(message, type);
    } else {
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
  }
  
  /**
   * 显示确认对话框
   * @param {string} title - 对话框标题
   * @param {string} message - 对话框消息
   * @param {string} confirmText - 确认按钮文本
   * @param {string} cancelText - 取消按钮文本
   * @returns {Promise<boolean>}
   */
  async showConfirmDialog(title, message, confirmText = '确定', cancelText = '取消') {
    const app = window.linkBoardApp;
    if (app && app.uiManager) {
      const dialogManager = app.uiManager.getDialogManager();
      return await dialogManager.confirm(message, {
        title,
        confirmText,
        cancelText
      });
    } else {
      // 降级到浏览器原生确认对话框
      return confirm(message);
    }
  }
  
  /**
   * 清理事件监听器
   */
  cleanupEventListeners() {
    // 事件总线会自动处理清理，这里只需要清理本地引用
    this.eventListeners.clear();
  }
  
  /**
   * 获取面板统计信息
   * @returns {Object}
   */
  getStats() {
    if (!this.currentData) {
      return { count: 0, maxCount: null };
    }
    
    return {
      count: this.currentData.urls.length,
      maxCount: null,
      availableSlots: null
    };
  }
}

// 导出类
window.FrequentlyUsedPanel = FrequentlyUsedPanel;
