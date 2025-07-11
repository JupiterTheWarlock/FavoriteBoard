// FavoriteBoard Plugin - Dashboard Tab
// Dashboard页面的具体实现

/**
 * Dashboard Tab - 数据统计和概览页面
 * 继承自BaseTab，专门处理Dashboard的渲染和交互
 */
class DashboardTab extends BaseTab {
  constructor() {
    super('dashboard', 'Dashboard', '📊', {
      showSearch: false,        // Dashboard不显示搜索栏
      supportSearch: false,     // Dashboard不支持搜索
      cache: true              // 缓存Dashboard内容
    });
    
    // Dashboard特有的数据
    this.statsData = null;
    this.refreshInterval = null;
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
      // 获取所有链接数据
      const allLinks = app.allLinks || [];
      const folderTree = app.folderTree || [];
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
            最后更新: ${this.formatTime(stats.lastUpdated)}
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

      <!-- 最近活动 -->
      <div class="recent-activity-section">
        <h4>⏰ 最近活动</h4>
        <div class="recent-activity">
          ${this.renderRecentActivity(stats.recentActivity)}
        </div>
      </div>
    `;
    
    container.appendChild(dashboard);
    
    // 确保容器可见
    showElement(container, 'block');
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
    
    return activities.slice(0, 5).map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-time">${this.formatTime(activity.time)}</div>
        </div>
      </div>
    `).join('');
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
    // 按添加时间排序，获取最近的活动
    const recentLinks = allLinks
      .filter(link => link.dateAdded)
      .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
      .slice(0, 5);
    
    return recentLinks.map(link => ({
      icon: '🔗',
      title: `添加了收藏: ${link.title}`,
      time: new Date(parseInt(link.dateAdded)),
      link: link
    }));
  }
  
  /**
   * 获取文件夹图标
   * @param {string} title - 文件夹标题
   * @param {number} depth - 文件夹深度
   * @returns {string}
   */
  getFolderIcon(title, depth) {
    // 这里可以复用main.js中的getFolderIcon逻辑
    if (window.linkBoardApp && typeof window.linkBoardApp.getFolderIcon === 'function') {
      return window.linkBoardApp.getFolderIcon(title, depth);
    }
    
    // 简单的默认图标逻辑
    if (depth === 0) return '📁';
    return '📂';
  }
  
  /**
   * 格式化时间
   * @param {Date} date - 日期对象
   * @returns {string}
   */
  formatTime(date) {
    if (!date) return '未知时间';
    
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} 分钟前`;
    }
    
    // 小于1天
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} 小时前`;
    }
    
    // 小于7天
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} 天前`;
    }
    
    // 超过7天，显示具体日期
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // ==================== 生命周期方法 ====================
  
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
  }
  
  /**
   * 处理数据更新事件
   * @param {string} action - 更新动作
   * @param {Object} data - 更新数据
   */
  onDataUpdate(action, data) {
    super.onDataUpdate(action, data);
    
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
          this.container.innerHTML = '';
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