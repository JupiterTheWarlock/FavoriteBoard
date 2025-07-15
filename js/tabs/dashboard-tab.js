// FavoriteBoard Plugin - Dashboard Tab
// Dashboard页面的具体实现

/**
 * Dashboard Tab - 数据统计和概览页面
 * 继承自BaseTab，专门处理Dashboard的渲染和交互
 */
class DashboardTab extends BaseTab {
  constructor() {
    super('dashboard', '总览', '📊', {
      showSearch: false,        // Dashboard不显示搜索栏
      supportSearch: false,     // Dashboard不支持搜索
      cache: true              // 缓存Dashboard内容
    });
    
    // Dashboard特有的数据
    this.statsData = null;
    this.refreshInterval = null;
    
    // 卡片交互管理器
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
      
      // 获取应用实例和数据
      const app = window.linkBoardApp;
      if (!app) {
        throw new Error('找不到应用实例');
      }
      
      // 收集统计数据
      await this.collectStatsData(app);
      
      // 渲染统计面板
      this.renderStatsPanel(container);
      
      // 设置自动刷新（可选）
      this.setupAutoRefresh();
      
      console.log('✅ Dashboard渲染完成');
      
    } catch (error) {
      console.error('❌ Dashboard渲染失败:', error);
      throw error;
    }
  }
  
  /**
   * 收集统计数据
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
  
  /**
   * 渲染统计面板
   * @param {HTMLElement} container - 容器元素
   */
  renderStatsPanel(container) {
    const stats = this.statsData;
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建Dashboard主容器
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard-container';
    
    dashboard.innerHTML = `
      <!-- 统计卡片区域 -->
      <div class="dashboard-stats">
        <div class="stats-header">
          <h3>📊 收藏夹统计</h3>
          <p>您的收藏夹概览</p>
          <div class="stats-last-updated">
            最后更新: ${formatTime(stats.lastUpdated)}
          </div>
        </div>
        
        <!-- 主要统计数据 -->
        <div class="stats-grid">
          <div class="stat-item total">
            <div class="stat-icon">🔗</div>
            <div class="stat-content">
              <span class="stat-number">${stats.totalLinks}</span>
              <span class="stat-label">总收藏链接</span>
            </div>
          </div>
          
          <div class="stat-item folders">
            <div class="stat-icon">📁</div>
            <div class="stat-content">
              <span class="stat-number">${stats.totalFolders}</span>
              <span class="stat-label">文件夹数量</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近活动区域 -->
      <div class="dashboard-stats">
        <div class="stats-header">
          <h3>⏰ 最近活动</h3>
          <p>您的最新收藏记录</p>
        </div>
        
        <div class="recent-activity">
          ${this.renderRecentActivity(stats.recentActivity)}
        </div>
      </div>
    `;
    
    container.appendChild(dashboard);
    
    // 为最近活动卡片绑定交互事件
    this.bindActivityCardEvents(dashboard);
    
    // 确保容器可见
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
    
    // 移除 .slice(0, 5) 限制，显示全部最近活动
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
    // 初始化卡片交互管理器
    if (!this.cardInteractionManager) {
      this.cardInteractionManager = createCardInteractionManager({
        showNotification: this.showNotification.bind(this),
        app: window.linkBoardApp
      });
    }
    
    // 为每个有链接数据的activity-card绑定事件
    const activityCards = dashboard.querySelectorAll('.activity-card[data-url]:not([data-url=""])');
    activityCards.forEach(card => {
      const linkId = card.dataset.linkId;
      const url = card.dataset.url;
      
      // 只有当有有效链接数据时才绑定事件
      if (url) {
        // 从statsData中获取完整的链接信息
        const linkData = this.findLinkDataById(linkId) || {
          id: linkId,
          url: url,
          title: card.querySelector('.activity-title')?.textContent || '未知链接'
        };
        
        // 绑定卡片交互事件
        this.cardInteractionManager.bindCardEvents(card, linkData, {
          enableClick: true,
          enableContextMenu: true,
          enableMove: true,
          enableDelete: true,
          enableCopy: true,
          enableNewWindow: true
        });
        
        // 绑定图标错误处理
        const iconImg = card.querySelector('.activity-icon-img');
        if (iconImg) {
          let fallbackAttempts = 0;
          iconImg.addEventListener('error', () => {
            fallbackAttempts++;
            
            if (fallbackAttempts === 1) {
              // 第一次失败：尝试使用Google favicon服务
              if (url) {
                try {
                  const domain = new URL(url).hostname;
                  iconImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                  return;
                } catch (e) {
                  // URL解析失败，继续下一个备用方案
                }
              }
            }
            
            if (fallbackAttempts === 2) {
              // 第二次失败：尝试使用DuckDuckGo favicon服务
              if (url) {
                try {
                  const domain = new URL(url).hostname;
                  iconImg.src = `https://external-content.duckduckgo.com/ip3/${domain}.ico`;
                  return;
                } catch (e) {
                  // URL解析失败，继续下一个备用方案
                }
              }
            }
            
            // 最终备用方案：使用默认图标
            const fallbackUrl = iconImg.dataset.fallback;
            if (fallbackUrl && iconImg.src !== fallbackUrl) {
              iconImg.src = fallbackUrl;
            }
          });
        }
      }
    });
  }
  
  /**
   * 根据ID查找链接数据
   * @param {string} linkId - 链接ID
   * @returns {Object|null} 链接数据对象或null
   */
  findLinkDataById(linkId) {
    if (!this.statsData || !this.statsData.recentActivity) {
      return null;
    }
    
    const activity = this.statsData.recentActivity.find(act => act.link && act.link.id === linkId);
    return activity ? activity.link : null;
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
    
    // 过滤有dateAdded的链接
    const validLinks = allLinks.filter(link => link.dateAdded);
    
    // 按添加时间倒序排序，最新添加的排在最前面
    const recentLinks = validLinks
      .sort((a, b) => {
        const aTime = parseInt(a.dateAdded) || 0;
        const bTime = parseInt(b.dateAdded) || 0;
        const result = bTime - aTime; // 倒序：时间戳大的(新的)在前
        
        return result;
      });
      // 移除 .slice(0, 5) 限制，显示全部最近活动
    
    recentLinks.forEach((link, index) => {
      const time = parseInt(link.dateAdded);
      const date = new Date(time);
    });
    
    // 验证排序是否正确
    if (recentLinks.length >= 2) {
      const first = parseInt(recentLinks[0].dateAdded);
      const second = parseInt(recentLinks[1].dateAdded);
    }
    
    return recentLinks.map(link => ({
      icon: getSafeIcon(link.iconUrl, link.url), // 使用实际的链接图标
      title: `添加了收藏: ${link.title}`,
      time: new Date(parseInt(link.dateAdded)),
      link: link
    }));
  }
  
  
  /**
   * Tab激活时调用
   */
  onActivate() {
    super.onActivate();
    
    // Dashboard激活时刷新数据
    this.refreshData();
  }
  
  /**
   * Tab失活时调用
   */
  onDeactivate() {
    super.onDeactivate();
    
    // 清除自动刷新定时器
    this.clearAutoRefresh();
  }
  
  /**
   * Tab销毁时调用
   */
  destroy() {
    super.destroy();
    
    // 清理资源
    this.clearAutoRefresh();
    this.statsData = null;
    
    // 清理卡片交互管理器
    if (this.cardInteractionManager) {
      this.cardInteractionManager.destroy();
      this.cardInteractionManager = null;
    }
  }
  
  /**
   * 处理数据更新事件
   * @param {string} action - 更新动作
   * @param {Object} data - 更新数据
   */
  onDataUpdate(action, data) {
    super.onDataUpdate(action, data);
    
    // 发布Dashboard数据更新事件
    this.emitEvent('dashboard-data-updated', {
      action: action,
      statsData: this.statsData
    });
    
    // 收藏夹数据变化时重新收集统计
    if (['bookmark-created', 'bookmark-removed', 'bookmark-changed', 'bookmark-moved'].includes(action)) {
      console.log('🔄 收藏夹数据变化，刷新Dashboard统计');
      this.refreshData();
    }
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 刷新数据
   */
  async refreshData() {
    if (!this.isActive) return;
    
    try {
      const app = window.linkBoardApp;
      if (app) {
        await this.collectStatsData(app);
        
        // 如果容器存在，重新渲染
        if (this.container) {
          this.renderStatsPanel(this.container);
        }
        
        // 更新页面信息
        this.updatePageInfo();
      }
    } catch (error) {
      console.error('❌ 刷新Dashboard数据失败:', error);
    }
  }
  
  /**
   * 设置自动刷新（可选）
   */
  setupAutoRefresh() {
    // 暂时不启用自动刷新，避免性能问题
    // this.refreshInterval = setInterval(() => {
    //   this.refreshData();
    // }, 60000); // 1分钟刷新一次
  }
  
  /**
   * 清除自动刷新
   */
  clearAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// 导出Dashboard Tab类
window.DashboardTab = DashboardTab; 