// FavoriteBoard Plugin - Tab容器
// 负责Tab的生命周期管理和切换逻辑

/**
 * Tab容器 - 管理Tab的创建、切换和生命周期
 * 从主应用中提取Tab管理相关的功能，实现更清晰的职责划分
 */
class TabContainer {
  /**
   * 构造函数
   * @param {EventBus} eventBus - 事件总线实例
   * @param {StateManager} stateManager - 状态管理器实例
   */
  constructor(eventBus, stateManager) {
    // 核心依赖
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    
    // Tab管理
    this.tabFactory = new TabFactory();
    this.registeredTabs = new Map(); // 已注册的Tab实例
    this.activeTab = null;          // 当前激活的Tab
    this.tabHistory = [];           // Tab切换历史
    
    // UI元素
    this.contentContainer = null;   // Tab内容容器
    
    console.log('🐱 Tab容器初始化完成');
    
    // 初始化事件监听
    this.initEventListeners();
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    if (!this.eventBus) {
      console.warn('⚠️ 事件总线不可用，Tab容器功能可能受限');
      return;
    }
    
    // 监听Tab切换请求事件
    this.eventBus.on('tab-switch-requested', (data) => {
      // 兼容旧参数tabId，也支持新参数type
      const type = data.type || data.tabId;
      const instanceId = data.instanceId || 'default';
      const options = data.options || {};
      this.switchToTab(type, instanceId, options);
    }, { unique: true });
    
    // 监听Tab注册请求事件
    this.eventBus.on('tab-register-requested', (data) => {
      this.registerTab(data.type, data.instanceId, data.data);
    }, { unique: true });
    
    // 监听Tab销毁请求事件
    this.eventBus.on('tab-destroy-requested', (data) => {
      this.destroyTab(data.type, data.instanceId);
    }, { unique: true });
    
    console.log('✅ Tab容器事件监听器初始化完成');
  }
  
  /**
   * 设置Tab内容容器
   * @param {HTMLElement} container - Tab内容容器元素
   */
  setContentContainer(container) {
    this.contentContainer = container;
    
    // 确保容器存在且有正确的样式
    if (this.contentContainer) {
      // 确保容器有正确的类名
      if (!this.contentContainer.classList.contains('tab-content-container')) {
        this.contentContainer.classList.add('tab-content-container');
      }
      
      // 确保容器可见
      this.contentContainer.style.display = 'block';
    }
    
    console.log('📦 设置Tab内容容器:', container);
  }
  
  /**
   * 获取Tab内容容器
   * @returns {HTMLElement} Tab内容容器
   */
  getContentContainer() {
    if (!this.contentContainer) {
      // 如果未设置，尝试从DOM中获取
      this.contentContainer = document.getElementById('tabContent');
      
      if (!this.contentContainer) {
        console.warn('⚠️ 未找到Tab内容容器，将创建一个新的容器');
        this.contentContainer = document.createElement('div');
        this.contentContainer.id = 'tabContent';
        document.body.appendChild(this.contentContainer);
      }
    }
    
    return this.contentContainer;
  }
  
  /**
   * 注册Tab
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID（可选，默认为'default'）
   * @param {Object} data - Tab数据（可选）
   * @returns {BaseTab} 注册的Tab实例
   */
  registerTab(type, instanceId = 'default', data = null) {
    try {
      console.log(`🔖 注册Tab: ${type} (${instanceId})`);
      
      // 生成Tab唯一标识
      const tabKey = `${type}:${instanceId}`;
      
      // 检查是否已存在
      if (this.registeredTabs.has(tabKey)) {
        console.log(`📝 Tab已存在: ${tabKey}，返回现有实例`);
        return this.registeredTabs.get(tabKey);
      }
      
      // 创建新Tab
      let tab;
      switch (type) {
        case 'dashboard':
          tab = this.tabFactory.createDashboardTab();
          break;
          
        case 'bookmark':
          const { folderId, folderData } = data || {};
          tab = this.tabFactory.createBookmarkTab(folderId, folderData);
          break;
          
        case 'settings':
          tab = this.tabFactory.createSettingsTab();
          break;
          
        default:
          // 通用创建方法
          tab = this.tabFactory.createTab(type, data);
      }
      
      // 存储Tab实例
      this.registeredTabs.set(tabKey, tab);
      
      // 更新状态管理器
      this.updateTabState();
      
      // 发布Tab注册事件
      this.eventBus.emit('tab-registered', {
        type,
        instanceId,
        tabKey,
        tab
      });
      
      console.log(`✅ Tab注册完成: ${tabKey}`);
      return tab;
      
    } catch (error) {
      console.error(`❌ 注册Tab失败: ${type} (${instanceId})`, error);
      throw error;
    }
  }
  
  /**
   * 切换到指定Tab
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID（可选，默认为'default'）
   * @param {Object} options - 切换选项（可选）
   * @returns {Promise<BaseTab>} 激活的Tab实例
   */
  async switchToTab(type, instanceId = 'default', options = {}) {
    try {
      console.log(`🔄 切换到Tab: ${type} (${instanceId})`);
      
      // 生成Tab唯一标识
      const tabKey = `${type}:${instanceId}`;
      
      // 获取Tab实例，如果不存在则注册
      let tab = this.registeredTabs.get(tabKey);
      if (!tab) {
        console.log(`📝 Tab不存在: ${tabKey}，尝试注册`);
        tab = this.registerTab(type, instanceId, options.data);
      }
      
      // 获取内容容器
      const container = this.getContentContainer();
      if (!container) {
        throw new Error('Tab内容容器不可用');
      }
      
      // 如果有当前激活的Tab，先使其失活
      if (this.activeTab && this.activeTab !== tab) {
        this.activeTab.onDeactivate();
      }
      
      // 更新当前激活的Tab
      this.activeTab = tab;
      
      // 更新Tab历史
      this.updateTabHistory(tabKey);
      
      // 更新状态管理器
      this.updateTabState();
      
      // 渲染Tab内容
      await this.renderTab(tab, container);
      
      // 激活Tab
      tab.onActivate();
      
      // 发布Tab切换事件
      this.eventBus.emit('tab-switched', {
        type,
        instanceId,
        tabKey,
        tab
      });
      
      console.log(`✅ Tab切换完成: ${tabKey}`);
      return tab;
      
    } catch (error) {
      console.error(`❌ 切换Tab失败: ${type} (${instanceId})`, error);
      throw error;
    }
  }
  
  /**
   * 渲染Tab内容
   * @param {BaseTab} tab - Tab实例
   * @param {HTMLElement} container - 容器元素
   * @returns {Promise<void>}
   */
  async renderTab(tab, container) {
    try {
      console.log(`🎨 渲染Tab: ${tab.id}`);
      
      // 显示加载状态
      this.stateManager.setUIState({ loading: true }, 'tab-render');

      // 清空容器，避免残留上一个Tab的内容
      if (container) {
        container.innerHTML = '';
      }

      // 强制本次进行实际渲染，避免因缓存导致不重绘
      if (tab && tab.isInitialized && tab.options?.cache) {
        tab.isInitialized = false;
      }
      
      // 安全渲染Tab内容
      await tab.safeRender(container);
      
      // 隐藏加载状态
      this.stateManager.setUIState({ loading: false }, 'tab-render');
      
      console.log(`✅ Tab渲染完成: ${tab.id}`);
      
    } catch (error) {
      console.error(`❌ 渲染Tab失败: ${tab.id}`, error);
      this.stateManager.setUIState({ loading: false }, 'tab-render');
      
      // 显示错误状态
      container.innerHTML = `
        <div class="error-container">
          <div class="error-icon">❌</div>
          <h3>渲染失败</h3>
          <p>${error.message}</p>
        </div>
      `;
      
      throw error;
    }
  }
  
  /**
   * 销毁Tab实例
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID（可选，默认为'default'）
   * @returns {boolean} 是否成功销毁
   */
  destroyTab(type, instanceId = 'default') {
    try {
      console.log(`🗑️ 销毁Tab: ${type} (${instanceId})`);
      
      // 生成Tab唯一标识
      const tabKey = `${type}:${instanceId}`;
      
      // 获取Tab实例
      const tab = this.registeredTabs.get(tabKey);
      if (!tab) {
        console.warn(`⚠️ 销毁Tab失败: ${tabKey} 不存在`);
        return false;
      }
      
      // 如果是当前激活的Tab，先切换到其他Tab
      if (this.activeTab === tab) {
        // 尝试切换到历史记录中的上一个Tab
        if (this.tabHistory.length > 1) {
          const prevTabKey = this.tabHistory[this.tabHistory.length - 2];
          const [prevType, prevInstanceId] = prevTabKey.split(':');
          this.switchToTab(prevType, prevInstanceId);
        } else {
          // 如果没有历史记录，切换到Dashboard
          this.switchToTab('dashboard');
        }
      }
      
      // 销毁Tab
      tab.destroy();
      
      // 从注册表中移除
      this.registeredTabs.delete(tabKey);
      
      // 从历史记录中移除
      this.tabHistory = this.tabHistory.filter(key => key !== tabKey);
      
      // 更新状态管理器
      this.updateTabState();
      
      // 发布Tab销毁事件
      this.eventBus.emit('tab-destroyed', {
        type,
        instanceId,
        tabKey
      });
      
      console.log(`✅ Tab销毁完成: ${tabKey}`);
      return true;
      
    } catch (error) {
      console.error(`❌ 销毁Tab失败: ${type} (${instanceId})`, error);
      return false;
    }
  }
  
  /**
   * 更新Tab历史记录
   * @param {string} tabKey - Tab唯一标识
   */
  updateTabHistory(tabKey) {
    // 从历史记录中移除当前Tab（如果存在）
    this.tabHistory = this.tabHistory.filter(key => key !== tabKey);
    
    // 添加到历史记录末尾
    this.tabHistory.push(tabKey);
    
    // 限制历史记录长度
    const maxHistorySize = this.stateManager.getStateValue('config.maxHistorySize') || 10;
    if (this.tabHistory.length > maxHistorySize) {
      this.tabHistory = this.tabHistory.slice(-maxHistorySize);
    }
  }
  
  /**
   * 更新状态管理器中的Tab状态
   */
  updateTabState() {
    // 构建Tab状态数据
    const tabState = {
      registered: Array.from(this.registeredTabs.keys()),
      active: this.activeTab ? `${this.activeTab.id}:${this.getTabInstanceId(this.activeTab)}` : null,
      history: [...this.tabHistory]
    };
    
    // 更新状态管理器
    this.stateManager.setTabState(tabState, 'tab-container');
  }
  
  /**
   * 获取Tab实例ID
   * @param {BaseTab} tab - Tab实例
   * @returns {string} 实例ID
   */
  getTabInstanceId(tab) {
    // 遍历注册表查找匹配的实例
    for (const [key, value] of this.registeredTabs.entries()) {
      if (value === tab) {
        const [, instanceId] = key.split(':');
        return instanceId;
      }
    }
    return 'default';
  }
  
  /**
   * 获取当前激活的Tab
   * @returns {BaseTab} 当前激活的Tab实例
   */
  getActiveTab() {
    return this.activeTab;
  }
  
  /**
   * 获取已注册的Tab
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID（可选，默认为'default'）
   * @returns {BaseTab} Tab实例
   */
  getTab(type, instanceId = 'default') {
    const tabKey = `${type}:${instanceId}`;
    return this.registeredTabs.get(tabKey);
  }
  
  /**
   * 获取所有已注册的Tab
   * @returns {Array<BaseTab>} Tab实例数组
   */
  getAllTabs() {
    return Array.from(this.registeredTabs.values());
  }
  
  /**
   * 获取指定类型的所有Tab
   * @param {string} type - Tab类型
   * @returns {Array<BaseTab>} Tab实例数组
   */
  getTabsByType(type) {
    const tabs = [];
    for (const [key, tab] of this.registeredTabs.entries()) {
      if (key.startsWith(`${type}:`)) {
        tabs.push(tab);
      }
    }
    return tabs;
  }
  
  /**
   * 清理所有Tab
   */
  cleanup() {
    console.log('🧹 清理所有Tab...');
    
    // 保存当前激活的Tab
    const activeTab = this.activeTab;
    
    // 重置激活状态
    this.activeTab = null;
    
    // 销毁所有Tab
    for (const [tabKey, tab] of this.registeredTabs.entries()) {
      try {
        tab.destroy();
      } catch (error) {
        console.warn(`⚠️ 销毁Tab失败: ${tabKey}`, error);
      }
    }
    
    // 清空注册表
    this.registeredTabs.clear();
    
    // 清空历史记录
    this.tabHistory = [];
    
    // 更新状态管理器
    this.updateTabState();
    
    // 发布清理完成事件
    this.eventBus.emit('tabs-cleaned-up');
    
    console.log('✅ Tab清理完成');
  }
}

// 导出Tab容器类
window.TabContainer = TabContainer; 