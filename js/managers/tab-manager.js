/**
 * FavoriteBoard - Tab管理器
 * 负责：Tab创建、切换、销毁、状态管理
 * 
 * @author JupiterTheWarlock
 * @description Tab生命周期管理，提供Tab的创建、切换和销毁功能 🐱
 */

/**
 * Tab管理器 - Tab生命周期管理
 * 从main.js中提取的Tab管理逻辑，支持依赖注入和事件驱动
 */
class TabManager {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.dataManager = null;
    this.appConfig = null;
    
    // Tab系统相关
    this.tabFactory = null;
    this.currentTab = null;
    this.registeredTabs = new Map(); // Map<tabKey, tabInstance>
    this.tabHistory = []; // Tab切换历史记录
    
    // UI元素缓存
    this.searchInput = null;
    this.searchBar = null;
    this.mainContent = null;
    this.tabContentContainer = null;
    
    // Tab状态
    this.isInitialized = false;
    this.switchingTab = false;
    
    console.log('🎯 Tab管理器初始化 🐱');
  }
  
  /**
   * 初始化Tab管理器
   */
  async init() {
    try {
      console.log('🚀 Tab管理器开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.dataManager = this.container.get('dataManager');
      this.appConfig = this.container.get('appConfig');
      
      // 初始化Tab系统
      this._initTabSystem();
      
      // 缓存UI元素
      this._cacheUIElements();
      
      // 绑定事件
      this._bindEvents();
      
      // 监听数据更新
      this._bindDataEvents();
      
      this.isInitialized = true;
      
      console.log('✅ Tab管理器初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ Tab管理器初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 初始化Tab系统
   * @private
   */
  _initTabSystem() {
    // 创建Tab工厂
    this.tabFactory = new TabFactory();
    console.log('🏭 Tab工厂创建完成 🐱');
  }
  
  /**
   * 缓存UI元素
   * @private
   */
  _cacheUIElements() {
    this.searchInput = document.getElementById('searchInput');
    this.searchBar = document.getElementById('searchBar');
    this.mainContent = document.querySelector('.main-content');
    
    // 主要使用linksGrid作为Tab内容容器
    this.tabContentContainer = document.getElementById('linksGrid');
    
    console.log('📋 Tab管理器UI元素缓存完成 🐱');
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.eventManager) return;
    
    // 监听Tab切换请求
    this.eventManager.on('tab:switch', async (data) => {
      console.log('🎯 接收到Tab切换请求 🐱', data);
      await this.switchToTab(data.type, data.instanceId, data.data);
    });
    
    // 监听Tab注册请求
    this.eventManager.on('tab:register', (data) => {
      console.log('🎯 接收到Tab注册请求 🐱', data);
      this.registerTab(data.type, data.instanceId, data.data);
    });
    
    // 监听Tab销毁请求
    this.eventManager.on('tab:destroy', (data) => {
      console.log('🎯 接收到Tab销毁请求 🐱', data);
      this.destroyTab(data.tabKey);
    });
    
    // 监听搜索事件
    this.eventManager.on('search:query', (data) => {
      console.log('🔍 接收到搜索请求 🐱', data);
      this.handleSearch(data.query);
    });
    
    // 监听搜索清空事件
    this.eventManager.on('search:clear', () => {
      console.log('🔍 接收到搜索清空请求 🐱');
      this.clearSearch();
    });
  }
  
  /**
   * 绑定数据事件
   * @private
   */
  _bindDataEvents() {
    if (!this.eventManager) return;
    
    // 监听数据加载完成
    this.eventManager.on('data:loaded', (data) => {
      console.log('📊 数据加载完成，通知当前Tab 🐱');
      this._notifyCurrentTabDataUpdate('data-loaded', data);
    });
    
    // 监听数据更新
    this.eventManager.on('data:afterUpdate', (data) => {
      console.log('📊 数据更新完成，通知当前Tab 🐱');
      this._notifyCurrentTabDataUpdate('data-updated', data);
    });
    
    // 监听数据错误
    this.eventManager.on('data:error', (data) => {
      console.log('❌ 数据错误，通知当前Tab 🐱');
      this._notifyCurrentTabDataUpdate('data-error', data);
    });
  }
  
  /**
   * 注册Tab
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID  
   * @param {Object} data - Tab数据
   * @returns {BaseTab|null} Tab实例
   */
  registerTab(type, instanceId = 'default', data = null) {
    const tabKey = `${type}:${instanceId}`;
    
    if (this.registeredTabs.has(tabKey)) {
      console.log(`🔄 Tab已存在: ${tabKey} 🐱`);
      return this.registeredTabs.get(tabKey);
    }
    
    let tab = null;
    
    try {
      // 根据类型创建Tab
      switch (type) {
        case 'dashboard':
          tab = this.tabFactory.createDashboardTab();
          break;
        case 'bookmark':
          tab = this.tabFactory.createBookmarkTab(instanceId, data);
          break;
        default:
          console.warn(`⚠️ 未知的Tab类型: ${type} 🐱`);
          return null;
      }
      
      if (tab) {
        // 为Tab设置依赖
        tab.setDependencies?.(this.container);
        
        this.registeredTabs.set(tabKey, tab);
        
        // 发布Tab注册事件
        this.eventManager.emit('tab:registered', {
          tabKey,
          type,
          instanceId,
          tab,
          timestamp: Date.now()
        });
        
        console.log(`✅ Tab注册成功: ${tabKey} - ${tab.getTitle()} 🐱`);
      }
      
      return tab;
      
    } catch (error) {
      console.error(`❌ Tab注册失败: ${tabKey}`, error);
      
      // 发布Tab注册失败事件
      this.eventManager.emit('tab:registerFailed', {
        tabKey,
        type,
        instanceId,
        error: error.message,
        timestamp: Date.now()
      });
      
      return null;
    }
  }
  
  /**
   * 切换到指定Tab
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID
   * @param {Object} data - Tab数据（可选）
   * @returns {Promise<boolean>} 切换是否成功
   */
  async switchToTab(type, instanceId = 'default', data = null) {
    if (this.switchingTab) {
      console.log('⏳ Tab正在切换中，忽略新的切换请求 🐱');
      return false;
    }
    
    const tabKey = `${type}:${instanceId}`;
    this.switchingTab = true;
    
    try {
      console.log(`🔄 切换到Tab: ${tabKey} 🐱`);
      
      // 发布Tab切换开始事件
      this.eventManager.emit('tab:switchStart', {
        tabKey,
        type,
        instanceId,
        previousTab: this.currentTab?.getTabKey?.(),
        timestamp: Date.now()
      });
      
      // 失活当前Tab
      if (this.currentTab) {
        await this._deactivateCurrentTab();
      }
      
      // 获取或创建目标Tab
      let targetTab = this.registeredTabs.get(tabKey);
      if (!targetTab) {
        targetTab = this.registerTab(type, instanceId, data);
        if (!targetTab) {
          throw new Error(`无法创建Tab: ${tabKey}`);
        }
      }
      
      // 渲染Tab内容
      await this._renderTab(targetTab);
      
      // 激活新Tab
      await this._activateTab(targetTab);
      
      // 更新当前Tab引用
      this.currentTab = targetTab;
      
      // 添加到历史记录
      this._addToHistory(tabKey);
      
      // 更新UI状态
      this._updateUIState(type, instanceId);
      
      // 发布Tab切换完成事件
      this.eventManager.emit('tab:switchComplete', {
        tabKey,
        type,
        instanceId,
        tab: targetTab,
        timestamp: Date.now()
      });
      
      console.log(`✅ Tab切换完成: ${tabKey} - ${targetTab.getTitle()} 🐱`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Tab切换失败: ${tabKey}`, error);
      
      // 发布Tab切换失败事件
      this.eventManager.emit('tab:switchFailed', {
        tabKey,
        type,
        instanceId,
        error: error.message,
        timestamp: Date.now()
      });
      
      // 显示错误通知
      this._showNotification('Tab切换失败', 'error');
      
      return false;
      
    } finally {
      this.switchingTab = false;
    }
  }
  
  /**
   * 失活当前Tab
   * @private
   */
  async _deactivateCurrentTab() {
    if (this.currentTab) {
      try {
        if (typeof this.currentTab.onDeactivate === 'function') {
          await this.currentTab.onDeactivate();
        }
        console.log('📴 当前Tab已失活 🐱');
      } catch (error) {
        console.error('❌ Tab失活失败:', error);
      }
    }
  }
  
  /**
   * 激活Tab
   * @private
   * @param {BaseTab} tab
   */
  async _activateTab(tab) {
    try {
      if (typeof tab.onActivate === 'function') {
        await tab.onActivate();
      }
      console.log('📱 Tab已激活 🐱');
    } catch (error) {
      console.error('❌ Tab激活失败:', error);
    }
  }
  
  /**
   * 渲染Tab内容
   * @private
   * @param {BaseTab} tab - Tab实例
   */
  async _renderTab(tab) {
    try {
      // 获取内容容器
      const container = this._getTabContentContainer();
      
      // 使用安全渲染方法
      const success = await tab.safeRender?.(container) || await tab.render?.(container);
      
      if (!success && success !== undefined) {
        throw new Error('Tab渲染失败');
      }
      
    } catch (error) {
      console.error('❌ Tab渲染失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取Tab内容容器
   * @private
   * @returns {HTMLElement}
   */
  _getTabContentContainer() {
    if (this.tabContentContainer) {
      this.tabContentContainer.innerHTML = '';
      this.tabContentContainer.className = 'tab-content-container';
      return this.tabContentContainer;
    }
    
    throw new Error('找不到Tab内容容器 🐱');
  }
  
  /**
   * 更新UI状态
   * @private
   * @param {string} type
   * @param {string} instanceId
   */
  _updateUIState(type, instanceId) {
    // 更新文件夹树选中状态
    this._updateFolderTreeSelection(type, instanceId);
    
    // 更新搜索栏显示状态
    this._updateSearchBarVisibility();
  }
  
  /**
   * 更新文件夹树选中状态
   * @private
   * @param {string} type
   * @param {string} instanceId
   */
  _updateFolderTreeSelection(type, instanceId) {
    // 清除所有选中状态
    const allItems = document.querySelectorAll('.tree-item');
    allItems.forEach(item => item.classList.remove('active'));
    
    // 设置新的选中状态
    let targetId = null;
    if (type === 'dashboard') {
      targetId = 'dashboard';
    } else if (type === 'bookmark') {
      targetId = instanceId;
    }
    
    if (targetId) {
      const targetItem = document.querySelector(`[data-folder-id="${targetId}"]`);
      if (targetItem) {
        targetItem.classList.add('active');
      }
    }
    
    // 发布选中状态更新事件
    this.eventManager.emit('folderTree:selectionChanged', {
      type,
      instanceId,
      targetId,
      timestamp: Date.now()
    });
  }
  
  /**
   * 更新搜索栏显示状态
   * @private
   */
  _updateSearchBarVisibility() {
    if (this.searchBar && this.currentTab) {
      const shouldShow = this.currentTab.supports?.('search') || this.currentTab.options?.supportSearch;
      this.searchBar.style.display = shouldShow ? 'block' : 'none';
      
      // 如果隐藏搜索栏，清空搜索内容
      if (!shouldShow && this.searchInput) {
        this.searchInput.value = '';
      }
      
      // 发布搜索栏状态更新事件
      this.eventManager.emit('searchBar:visibilityChanged', {
        visible: shouldShow,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * 添加到历史记录
   * @private
   * @param {string} tabKey
   */
  _addToHistory(tabKey) {
    // 移除重复项
    this.tabHistory = this.tabHistory.filter(key => key !== tabKey);
    
    // 添加到开头
    this.tabHistory.unshift(tabKey);
    
    // 限制历史记录长度
    const maxHistory = this.appConfig?.get('ui.maxTabHistory', 10) || 10;
    if (this.tabHistory.length > maxHistory) {
      this.tabHistory = this.tabHistory.slice(0, maxHistory);
    }
  }
  
  /**
   * 注册默认Tab
   */
  async registerDefaultTabs() {
    if (!this.dataManager) {
      console.warn('⚠️ 数据管理器未初始化，无法注册默认Tab 🐱');
      return;
    }
    
    try {
      console.log('📋 注册默认Tab... 🐱');
      
      // 获取当前数据状态
      const state = this.dataManager.getState();
      const allLinksCount = state.allLinks?.length || 0;
      
      console.log(`📊 当前链接总数: ${allLinksCount} 🐱`);
      
      // 注册Dashboard Tab
      this.registerTab('dashboard', 'default');
      
      // 注册全部收藏Tab
      this.registerTab('bookmark', 'all', { 
        id: 'all', 
        title: '全部收藏', 
        icon: '🗂️',
        bookmarkCount: allLinksCount
      });
      
      console.log('✅ 默认Tab注册完成 🐱');
      
      // 发布默认Tab注册完成事件
      this.eventManager.emit('tab:defaultTabsRegistered', {
        totalLinks: allLinksCount,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ 注册默认Tab失败:', error);
    }
  }
  
  /**
   * 处理搜索
   * @param {string} query - 搜索查询
   */
  handleSearch(query) {
    if (this.currentTab && typeof this.currentTab.handleSearch === 'function') {
      try {
        this.currentTab.handleSearch(query);
        
        // 发布搜索事件
        this.eventManager.emit('tab:searchHandled', {
          tabKey: this.getCurrentTabKey(),
          query,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('❌ Tab搜索处理失败:', error);
      }
    }
  }
  
  /**
   * 清空搜索
   */
  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    
    if (this.currentTab && typeof this.currentTab.clearSearch === 'function') {
      try {
        this.currentTab.clearSearch();
        
        // 发布搜索清空事件
        this.eventManager.emit('tab:searchCleared', {
          tabKey: this.getCurrentTabKey(),
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('❌ Tab搜索清空失败:', error);
      }
    }
  }
  
  /**
   * 销毁Tab
   * @param {string} tabKey - Tab键值
   * @returns {boolean} 销毁是否成功
   */
  destroyTab(tabKey) {
    try {
      const tab = this.registeredTabs.get(tabKey);
      if (!tab) {
        console.warn(`⚠️ Tab不存在: ${tabKey} 🐱`);
        return false;
      }
      
      // 如果是当前Tab，需要先切换到其他Tab
      if (this.currentTab === tab) {
        console.log('🔄 销毁当前Tab，尝试切换到其他Tab 🐱');
        const nextTabKey = this._findNextTab(tabKey);
        if (nextTabKey) {
          const [type, instanceId] = nextTabKey.split(':');
          this.switchToTab(type, instanceId).catch(error => {
            console.error('❌ 切换到下一个Tab失败:', error);
          });
        }
      }
      
      // 调用Tab的销毁方法
      if (typeof tab.dispose === 'function') {
        tab.dispose();
      }
      
      // 从注册表中移除
      this.registeredTabs.delete(tabKey);
      
      // 从历史记录中移除
      this.tabHistory = this.tabHistory.filter(key => key !== tabKey);
      
      // 发布Tab销毁事件
      this.eventManager.emit('tab:destroyed', {
        tabKey,
        timestamp: Date.now()
      });
      
      console.log(`✅ Tab销毁成功: ${tabKey} 🐱`);
      return true;
      
    } catch (error) {
      console.error(`❌ Tab销毁失败: ${tabKey}`, error);
      return false;
    }
  }
  
  /**
   * 寻找下一个Tab
   * @private
   * @param {string} excludeTabKey
   * @returns {string|null}
   */
  _findNextTab(excludeTabKey) {
    // 优先从历史记录中选择
    for (const tabKey of this.tabHistory) {
      if (tabKey !== excludeTabKey && this.registeredTabs.has(tabKey)) {
        return tabKey;
      }
    }
    
    // 如果历史记录中没有，选择第一个可用的Tab
    for (const tabKey of this.registeredTabs.keys()) {
      if (tabKey !== excludeTabKey) {
        return tabKey;
      }
    }
    
    return null;
  }
  
  /**
   * 通知当前Tab数据更新
   * @private
   * @param {string} action
   * @param {Object} data
   */
  _notifyCurrentTabDataUpdate(action, data) {
    if (this.currentTab && typeof this.currentTab.onDataUpdate === 'function') {
      try {
        this.currentTab.onDataUpdate(action, data);
      } catch (error) {
        console.error('❌ 通知Tab数据更新失败:', error);
      }
    }
  }
  
  /**
   * 显示通知
   * @private
   * @param {string} message
   * @param {string} type
   */
  _showNotification(message, type = 'info') {
    // 通过事件系统显示通知
    this.eventManager.emit('notification:show', {
      message,
      type,
      timestamp: Date.now()
    });
  }
  
  // ==================== 公共API ====================
  
  /**
   * 获取当前Tab
   * @returns {BaseTab|null}
   */
  getCurrentTab() {
    return this.currentTab;
  }
  
  /**
   * 获取当前Tab键值
   * @returns {string|null}
   */
  getCurrentTabKey() {
    return this.currentTab?.getTabKey?.() || null;
  }
  
  /**
   * 获取所有已注册的Tab
   * @returns {Map<string, BaseTab>}
   */
  getRegisteredTabs() {
    return new Map(this.registeredTabs);
  }
  
  /**
   * 获取Tab历史记录
   * @returns {Array<string>}
   */
  getTabHistory() {
    return [...this.tabHistory];
  }
  
  /**
   * 检查Tab是否存在
   * @param {string} tabKey
   * @returns {boolean}
   */
  hasTab(tabKey) {
    return this.registeredTabs.has(tabKey);
  }
  
  /**
   * 获取Tab工厂
   * @returns {TabFactory}
   */
  getTabFactory() {
    return this.tabFactory;
  }
  
  /**
   * 获取Tab管理器状态
   * @returns {Object}
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      currentTab: this.getCurrentTabKey(),
      registeredTabsCount: this.registeredTabs.size,
      tabHistory: this.getTabHistory(),
      switchingTab: this.switchingTab
    };
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('🎯 Tab管理器开始销毁 🐱');
    
    // 销毁所有Tab
    for (const [tabKey, tab] of this.registeredTabs.entries()) {
      try {
        if (typeof tab.dispose === 'function') {
          tab.dispose();
        }
      } catch (error) {
        console.error(`❌ 销毁Tab失败: ${tabKey}`, error);
      }
    }
    
    // 清理状态
    this.registeredTabs.clear();
    this.tabHistory.length = 0;
    this.currentTab = null;
    this.isInitialized = false;
    
    console.log('🎯 Tab管理器销毁完成 🐱');
  }
}

// 导出Tab管理器类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = TabManager;
} else {
  // 浏览器环境
  window.TabManager = TabManager;
} 