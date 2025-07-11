// FavoriteBoard Plugin - Tab工厂
// 统一管理各种Tab的创建逻辑

/**
 * Tab工厂类 - 负责创建和管理不同类型的Tab
 */
class TabFactory {
  constructor() {
    // Tab类型注册表
    this.tabTypes = new Map();
    
    // 注册内置Tab类型
    this.registerBuiltInTabs();
    
    console.log('🐱 Tab工厂初始化完成');
  }
  
  /**
   * 注册内置Tab类型
   */
  registerBuiltInTabs() {
    // 注册Dashboard Tab
    this.registerTabType('dashboard', {
      name: 'Dashboard',
      description: '数据统计和网站概览',
      icon: '📊',
      className: 'DashboardTab',
      singleton: true,  // 单例模式
      options: {
        showSearch: false,
        showTagFilter: false,
        supportSearch: false
      }
    });
    
    // 注册收藏夹Tab  
    this.registerTabType('bookmark', {
      name: '收藏夹',
      description: '收藏夹内容管理',
      icon: '📁',
      className: 'BookmarkTab',
      singleton: false,  // 可创建多个实例
      options: {
        showSearch: true,
        showTagFilter: true,
        supportSearch: true
      }
    });
    
    // 注册设置Tab（未来扩展）
    this.registerTabType('settings', {
      name: '设置',
      description: '应用设置和配置',
      icon: '⚙️',
      className: 'SettingsTab',
      singleton: true,
      options: {
        showSearch: false,
        showTagFilter: false,
        supportSearch: false
      }
    });
  }
  
  /**
   * 注册Tab类型
   * @param {string} type - Tab类型
   * @param {Object} config - Tab配置
   */
  registerTabType(type, config) {
    this.tabTypes.set(type, {
      type,
      ...config,
      instances: new Map()  // 存储该类型的实例
    });
    
    console.log(`🐱 注册Tab类型: ${type} - ${config.name}`);
  }
  
  /**
   * 创建Dashboard Tab
   * @returns {DashboardTab}
   */
  createDashboardTab() {
    const config = this.tabTypes.get('dashboard');
    
    // Dashboard是单例，检查是否已存在
    if (config.singleton && config.instances.has('default')) {
      console.log('🐱 返回现有Dashboard Tab实例');
      return config.instances.get('default');
    }
    
    // 检查DashboardTab类是否可用
    if (typeof window.DashboardTab === 'undefined') {
      throw new Error('DashboardTab类未加载，请确保已引入dashboard-tab.js');
    }
    
    // 创建新实例
    const tab = new window.DashboardTab();
    
    // 单例模式下缓存实例
    if (config.singleton) {
      config.instances.set('default', tab);
    }
    
    console.log('🐱 创建Dashboard Tab');
    return tab;
  }
  
  /**
   * 创建收藏夹Tab
   * @param {string} folderId - 文件夹ID
   * @param {Object} folderData - 文件夹数据
   * @returns {BookmarkTab}
   */
  createBookmarkTab(folderId, folderData) {
    const config = this.tabTypes.get('bookmark');
    
    console.log(`🏭 创建收藏夹Tab请求: folderId=${folderId}, folderData=`, folderData);
    
    // 检查是否已存在该文件夹的Tab
    if (config.instances.has(folderId)) {
      console.log(`🐱 返回现有收藏夹Tab实例: ${folderId}`);
      return config.instances.get(folderId);
    }
    
    // 检查BookmarkTab类是否可用
    if (typeof window.BookmarkTab === 'undefined') {
      throw new Error('BookmarkTab类未加载，请确保已引入bookmark-tab.js');
    }
    
    // 创建新实例
    const tab = new window.BookmarkTab(folderId, folderData);
    
    // 缓存实例
    config.instances.set(folderId, tab);
    
    const title = folderData?.title || folderId;
    console.log(`🐱 创建收藏夹Tab: ${folderId} - ${title}`);
    return tab;
  }
  
  /**
   * 创建设置Tab（未来扩展）
   * @returns {SettingsTab}
   */
  createSettingsTab() {
    const config = this.tabTypes.get('settings');
    
    // 设置Tab是单例
    if (config.singleton && config.instances.has('default')) {
      console.log('🐱 返回现有设置Tab实例');
      return config.instances.get('default');
    }
    
    // 检查SettingsTab类是否可用
    if (typeof window.SettingsTab === 'undefined') {
      console.warn('SettingsTab类未加载，创建基础设置Tab');
      
      // 创建基础设置Tab（临时实现）
      const tab = new window.BaseTab('settings', '设置', '⚙️', {
        showSearch: false,
        showTagFilter: false,
        supportSearch: false
      });
      
      // 重写render方法提供基础设置界面
      tab.render = async function(container) {
        container.innerHTML = `
          <div class="settings-placeholder">
            <div class="settings-icon">⚙️</div>
            <h2>设置功能</h2>
            <p>设置功能正在开发中...</p>
            <div class="settings-preview">
              <h3>计划功能：</h3>
              <ul>
                <li>主题切换</li>
                <li>布局配置</li>
                <li>数据导入导出</li>
                <li>扩展设置</li>
              </ul>
            </div>
          </div>
        `;
      };
      
      tab.getDescription = function() {
        return '应用设置和配置（开发中）';
      };
      
      if (config.singleton) {
        config.instances.set('default', tab);
      }
      
      return tab;
    }
    
    // 创建新实例
    const tab = new window.SettingsTab();
    
    if (config.singleton) {
      config.instances.set('default', tab);
    }
    
    console.log('🐱 创建设置Tab');
    return tab;
  }
  
  /**
   * 通用Tab创建方法
   * @param {string} type - Tab类型
   * @param {Object} params - 创建参数
   * @returns {BaseTab}
   */
  createTab(type, params = {}) {
    const config = this.tabTypes.get(type);
    
    if (!config) {
      throw new Error(`未知的Tab类型: ${type}`);
    }
    
    switch (type) {
      case 'dashboard':
        return this.createDashboardTab();
        
      case 'bookmark':
        const { folderId, folderData } = params;
        if (!folderId || !folderData) {
          throw new Error('创建收藏夹Tab需要提供folderId和folderData参数');
        }
        return this.createBookmarkTab(folderId, folderData);
        
      case 'settings':
        return this.createSettingsTab();
        
      default:
        throw new Error(`不支持的Tab类型: ${type}`);
    }
  }
  
  /**
   * 销毁Tab实例
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID（可选，默认为'default'）
   */
  destroyTab(type, instanceId = 'default') {
    const config = this.tabTypes.get(type);
    
    if (!config) {
      console.warn(`销毁Tab失败：未知类型 ${type}`);
      return;
    }
    
    const tab = config.instances.get(instanceId);
    if (tab) {
      // 调用Tab的销毁方法
      tab.destroy();
      
      // 从实例缓存中移除
      config.instances.delete(instanceId);
      
      console.log(`🐱 销毁Tab: ${type}/${instanceId}`);
    }
  }
  
  /**
   * 获取Tab类型配置
   * @param {string} type - Tab类型
   * @returns {Object}
   */
  getTabConfig(type) {
    return this.tabTypes.get(type);
  }
  
  /**
   * 获取所有注册的Tab类型
   * @returns {Array}
   */
  getAllTabTypes() {
    return Array.from(this.tabTypes.keys());
  }
  
  /**
   * 获取Tab实例
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID
   * @returns {BaseTab|null}
   */
  getTabInstance(type, instanceId = 'default') {
    const config = this.tabTypes.get(type);
    return config ? config.instances.get(instanceId) : null;
  }
  
  /**
   * 获取某类型的所有实例
   * @param {string} type - Tab类型
   * @returns {Array}
   */
  getTabInstances(type) {
    const config = this.tabTypes.get(type);
    return config ? Array.from(config.instances.values()) : [];
  }
  
  /**
   * 清理所有Tab实例
   */
  cleanup() {
    console.log('🐱 清理所有Tab实例...');
    
    for (const [type, config] of this.tabTypes) {
      for (const [instanceId, tab] of config.instances) {
        tab.destroy();
      }
      config.instances.clear();
    }
    
    console.log('🐱 Tab工厂清理完成');
  }
  
  /**
   * 根据文件夹数据自动创建收藏夹Tab
   * @param {Array} folderTree - 文件夹树数据
   * @returns {Array} 创建的Tab列表
   */
  createBookmarkTabsFromFolders(folderTree) {
    const tabs = [];
    
    const processFolder = (folder) => {
      // 为每个有书签的文件夹创建Tab
      if (folder.bookmarkCount > 0) {
        try {
          const tab = this.createBookmarkTab(folder.id, {
            title: folder.title,
            bookmarkCount: folder.bookmarkCount,
            path: folder.path
          });
          tabs.push(tab);
        } catch (error) {
          console.warn(`创建文件夹Tab失败: ${folder.title}`, error);
        }
      }
      
      // 递归处理子文件夹
      if (folder.children) {
        folder.children.forEach(processFolder);
      }
    };
    
    folderTree.forEach(processFolder);
    
    console.log(`🐱 自动创建了 ${tabs.length} 个收藏夹Tab`);
    return tabs;
  }
}

// 导出工厂类
window.TabFactory = TabFactory; 