// FavoriteBoard Plugin - Dashboard Tab
// Dashboard页面的具体实现

/**
 * Dashboard Tab - 数据统计和概览页面
 * 继承自BaseTab，专门处理Dashboard的渲染和交互
 */
class DashboardTab extends BaseTab {
  constructor() {
    super('dashboard', 'FavoriteBoard', '📊', {
      showSearch: false,
      supportSearch: false,
      cache: true
    });
    this.statsData = null;
    this.recentActivity = [];
    this.refreshInterval = null;
    this.cardInteractionManager = null;
  }
  
  /**
   * 获取Dashboard描述
   * @returns {string}
   */
  getDescription() {
    if (this.statsData) {
      return `总共 ${this.statsData.totalLinks} 个收藏链接 • ${this.statsData.totalFolders} 个文件夹`;
    }
    return '数据统计和网站概览';
  }
  
  /**
   * 渲染Dashboard内容
   * @param {HTMLElement} container - 容器元素
   */
  async render(container) {
    try {
      console.log('🎨 渲染Dashboard Tab...');
      const app = window.linkBoardApp;
      if (!app) {
        throw new Error('找不到应用实例');
      }
      // 收集统计数据
      await this.collectStatsData(app);
      // 只收集最近活动数据
      await this.collectRecentActivity(app);
      this.renderRecentActivityPanel(container);
      this.setupAutoRefresh();
      console.log('✅ Dashboard渲染完成');
    } catch (error) {
      console.error('❌ Dashboard渲染失败:', error);
      throw error;
    }
  }

  /**
   * 收集最近活动数据
   * @param {ToolboxApp} app - 应用实例
   */
  async collectStatsData(app) {
    console.log('📊 收集Dashboard统计数据...');
    
    try {
      // 从StateManager获取数据
      const stateManager = app.stateManager;
      if (!stateManager) {
        throw new Error('StateManager不可用');
      }
      
      const allLinks = stateManager.getStateValue('data.allLinks') || [];
      const folderTree = stateManager.getStateValue('data.folderTree') || [];
      const bookmarkManager = app.bookmarkManager;
      
      // 基础统计
      const totalLinks = allLinks.length;
      const totalFolders = this.countFolders(folderTree);
      
      // 获取收藏夹管理器的统计信息
      let bookmarkStats = {};
      if (bookmarkManager && typeof bookmarkManager.getStats === 'function') {
        try {
          bookmarkStats = bookmarkManager.getStats();
        } catch (e) {
          console.warn('获取收藏夹统计信息失败:', e);
          bookmarkStats = {};
        }
      }
      // 最近活动统计
      const recentActivity = this.calculateRecentActivity(allLinks);
      
      this.statsData = {
        totalLinks,
        totalFolders,
        recentActivity,
        bookmarkStats,
        lastUpdated: new Date()
      };
      
      console.log('📊 统计数据收集完成:', this.statsData);
      
    } catch (error) {
      console.error('❌ 收集统计数据失败:', error);
      // 提供默认数据
      this.statsData = {
        totalLinks: 0,
        totalFolders: 0,
        recentActivity: [],
        bookmarkStats: {},
        lastUpdated: new Date(),
        error: error.message
      };
    }
  }
  async collectRecentActivity(app) {
    const stateManager = app.stateManager;
    if (!stateManager) throw new Error('StateManager不可用');
    const allLinks = stateManager.getStateValue('data.allLinks') || [];
    this.recentActivity = this.calculateRecentActivity(allLinks);
  }

  /**
   * 渲染最近活动面板
   * @param {HTMLElement} container
   */
  renderRecentActivityPanel(container) {
    container.innerHTML = '';
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard-container';
    dashboard.innerHTML = `
      <div class="dashboard-stats">
        <div class="stats-header">
          <h3>⏰ 最近活动</h3>
          <p>您的最新收藏记录</p>
        </div>
        <div class="recent-activity">
          ${this.renderRecentActivity(this.recentActivity)}
        </div>
      </div>
    `;
    container.appendChild(dashboard);
    this.bindActivityCardEvents(dashboard);
    container.style.display = 'block';
  }

  /**
   * 渲染最近活动
   * @param {Array} activities - 最近活动数据
   * @returns {string}
   */
  renderRecentActivity(activities) {
    if (!activities || activities.length === 0) {
      return '<div class="empty-stats">暂无最近活动</div>';
    }
    return activities.map(activity => `
      <div class="activity-item activity-card" 
           data-link-id="${activity.link?.id || ''}"
           data-url="${activity.link?.url || ''}"
           title="左键点击打开链接，右键显示更多选项">
        <div class="activity-icon">
          <img class="activity-icon-img" src="${activity.icon}" alt="icon" loading="lazy" data-fallback="${getDefaultIcon()}">
        </div>
        <div class="activity-content">
          <div class="activity-title">${escapeHtml(activity.title)}</div>
          <div class="activity-time">${formatTime(activity.time)}</div>
        </div>
        <button class="context-menu-btn" title="更多选项">⋮</button>
      </div>
    `).join('');
  }

  /**
   * 为最近活动卡片绑定交互事件
   * @param {HTMLElement} dashboard - Dashboard容器元素
   */
  bindActivityCardEvents(dashboard) {
    if (!this.cardInteractionManager) {
      this.cardInteractionManager = createCardInteractionManager({
        showNotification: this.showNotification?.bind(this),
        app: window.linkBoardApp
      });
    }
    const activityCards = dashboard.querySelectorAll('.activity-card[data-url]:not([data-url=""])');
    activityCards.forEach(card => {
      const linkId = card.dataset.linkId;
      const url = card.dataset.url;
      if (url) {
        const linkData = this.recentActivity.find(act => act.link && act.link.id === linkId)?.link || {
          id: linkId,
          url: url,
          title: card.querySelector('.activity-title')?.textContent || '未知链接'
        };
        this.cardInteractionManager.bindCardEvents(card, linkData, {
          enableClick: true,
          enableContextMenu: true,
          enableMove: true,
          enableDelete: true,
          enableCopy: true,
          enableNewWindow: true
        });
        const iconImg = card.querySelector('.activity-icon-img');
        if (iconImg) {
          let fallbackAttempts = 0;
          iconImg.addEventListener('error', () => {
            fallbackAttempts++;
            if (fallbackAttempts === 1) {
              if (url) {
                try {
                  const domain = new URL(url).hostname;
                  iconImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                  return;
                } catch (e) {}
              }
            }
            if (fallbackAttempts === 2) {
              if (url) {
                try {
                  const domain = new URL(url).hostname;
                  iconImg.src = `https://external-content.duckduckgo.com/ip3/${domain}.ico`;
                  return;
                } catch (e) {}
              }
            }
            const fallbackUrl = iconImg.dataset.fallback;
            if (fallbackUrl && iconImg.src !== fallbackUrl) {
              iconImg.src = fallbackUrl;
            }
          });
        }
      }
    });
  }
  
  // ==================== 数据计算方法 ====================
  
  /**
   * 计算文件夹数量
   * @param {Array} folderTree - 文件夹树
   * @returns {number}
   */
  countFolders(folderTree) {
    let count = 0;
    
    const countRecursive = (folders) => {
      if (!folders || !Array.isArray(folders)) return;
      
      folders.forEach(folder => {
        count++;
        if (folder.children) {
          countRecursive(folder.children);
        }
      });
    };
    
    countRecursive(folderTree);
    return count;
  }
  
  /**
   * 计算最近活动
   * @param {Array} allLinks - 所有链接
   * @returns {Array}
   */
  calculateRecentActivity(allLinks) {
    const validLinks = allLinks.filter(link => link.dateAdded);
    const recentLinks = validLinks.sort((a, b) => {
      const aTime = parseInt(a.dateAdded) || 0;
      const bTime = parseInt(b.dateAdded) || 0;
      return bTime - aTime;
    });
    return recentLinks.map(link => ({
      icon: getSafeIcon(link.iconUrl, link.url),
      title: `添加了收藏: ${link.title}`,
      time: new Date(parseInt(link.dateAdded)),
      link: link
    }));
  }

  onActivate() {
    super.onActivate();
    this.refreshData();
  }
  onDeactivate() {
    super.onDeactivate();
    this.clearAutoRefresh();
  }
  destroy() {
    super.destroy();
    this.clearAutoRefresh();
    this.recentActivity = [];
    if (this.cardInteractionManager) {
      this.cardInteractionManager.destroy();
      this.cardInteractionManager = null;
    }
  }
  onDataUpdate(action, data) {
    super.onDataUpdate(action, data);
    if ([
      'bookmark-created',
      'bookmark-removed',
      'bookmark-changed',
      'bookmark-moved'
    ].includes(action)) {
      console.log('🔄 收藏夹数据变化，刷新Dashboard最近活动');
      this.refreshData();
    }
  }
  async refreshData() {
    if (!this.isActive) return;
    try {
      const app = window.linkBoardApp;
      if (app) {
        await this.collectRecentActivity(app);
        if (this.container) {
          this.renderRecentActivityPanel(this.container);
        }
        this.updatePageInfo?.();
      }
    } catch (error) {
      console.error('❌ 刷新Dashboard最近活动失败:', error);
    }
  }
  setupAutoRefresh() {
    // 保留接口但不启用自动刷新
  }
  clearAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
// 导出Dashboard Tab类
window.DashboardTab = DashboardTab; 