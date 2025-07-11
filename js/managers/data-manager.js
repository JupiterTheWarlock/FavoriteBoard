/**
 * FavoriteBoard - 数据管理器
 * 负责：数据加载、状态管理、数据同步
 * 
 * @author JupiterTheWarlock
 * @description 封装BookmarkManager访问，实现应用级别的数据状态管理 🐱
 */

/**
 * 数据管理器 - 状态管理中心
 * 封装BookmarkManager，提供统一的数据访问接口
 */
class DataManager {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.appConfig = null;
    
    // BookmarkManager实例
    this.bookmarkManager = null;
    
    // 应用数据状态
    this.state = this.createInitialState();
    
    // 状态监听器
    this.stateListeners = [];
    
    // 数据缓存配置
    this.cacheConfig = {
      enabled: true,
      timeout: 300000, // 5分钟
      maxSize: 100
    };
    
    // 加载状态
    this.loadingStates = {
      bookmarks: false,
      folderTree: false,
      allLinks: false
    };
    
    console.log('📊 数据管理器初始化 🐱');
  }
  
  /**
   * 创建初始状态
   * @private
   * @returns {Object}
   */
  createInitialState() {
    return {
      // 原始书签数据
      bookmarks: [],
      
      // 文件夹树结构
      folderTree: [],
      
      // 文件夹映射表（扁平化）
      folderMap: new Map(),
      
      // 所有链接数据（扁平化）
      allLinks: [],
      
      // 加载状态
      isLoading: false,
      loadingProgress: 0,
      
      // 数据版本和时间戳
      version: 0,
      lastUpdate: null,
      lastSync: null,
      
      // 错误状态
      error: null,
      
      // 统计信息
      stats: {
        totalBookmarks: 0,
        totalFolders: 0,
        totalLinks: 0,
        lastRefresh: null
      }
    };
  }
  
  /**
   * 初始化数据管理器
   */
  async init() {
    try {
      console.log('🚀 数据管理器开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.appConfig = this.container.get('appConfig');
      
      // 创建BookmarkManager实例
      this.bookmarkManager = new BookmarkManager();
      
      // 设置缓存配置
      this._configureCaching();
      
      // 绑定BookmarkManager事件
      this._bindBookmarkManagerEvents();
      
      // 监听应用级事件
      this._bindApplicationEvents();
      
      console.log('✅ 数据管理器初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ 数据管理器初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 配置缓存设置
   * @private
   */
  _configureCaching() {
    if (this.appConfig) {
      this.cacheConfig = {
        enabled: this.appConfig.get('data.cacheEnabled', true),
        timeout: this.appConfig.get('performance.cacheTimeout', 300000),
        maxSize: this.appConfig.get('performance.maxCacheSize', 100)
      };
    }
  }
  
  /**
   * 绑定BookmarkManager事件
   * @private
   */
  _bindBookmarkManagerEvents() {
    if (!this.bookmarkManager) return;
    
    // 监听收藏夹数据加载完成
    this.bookmarkManager.on?.('bookmarks-loaded', (data) => {
      console.log('📊 收藏夹数据加载完成事件 🐱');
      this._handleBookmarkDataLoaded(data);
    });
    
    // 监听收藏夹数据更新
    this.bookmarkManager.on?.('bookmarks-updated', (data) => {
      console.log('📊 收藏夹数据更新事件 🐱');
      this._handleBookmarkDataUpdated(data);
    });
    
    // 监听收藏夹数据错误
    this.bookmarkManager.on?.('bookmarks-error', (error) => {
      console.error('❌ 收藏夹数据错误事件:', error);
      this._handleBookmarkDataError(error);
    });
  }
  
  /**
   * 绑定应用级事件
   * @private
   */
  _bindApplicationEvents() {
    if (!this.eventManager) return;
    
    // 监听数据刷新请求
    this.eventManager.on('data:refresh', async () => {
      console.log('🔄 接收到数据刷新请求 🐱');
      await this.refresh();
    });
    
    // 监听配置更改
    this.eventManager.on('config:changed', (data) => {
      if (data.path && data.path.startsWith('data.')) {
        console.log('⚙️ 数据相关配置更改，重新配置缓存 🐱');
        this._configureCaching();
      }
    });
  }
  
  /**
   * 加载数据（主入口）
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} 返回当前状态
   */
  async loadData(forceRefresh = false) {
    if (this.state.isLoading) {
      console.log('⏳ 数据正在加载中，等待完成... 🐱');
      return this._waitForLoading();
    }
    
    this._updateState({ 
      isLoading: true, 
      error: null,
      loadingProgress: 0
    });
    
    try {
      console.log('📖 开始加载数据 🐱', { forceRefresh });
      
      // 第一步：加载收藏夹数据
      this._updateState({ loadingProgress: 20 });
      await this._loadBookmarksData(forceRefresh);
      
      // 第二步：生成文件夹树
      this._updateState({ loadingProgress: 50 });
      this._generateFolderTreeFromBookmarks();
      
      // 第三步：生成所有链接数据
      this._updateState({ loadingProgress: 70 });
      this._generateAllLinks();
      
      // 第四步：更新统计信息
      this._updateState({ loadingProgress: 90 });
      this._updateStats();
      
      // 完成
      this._updateState({
        lastUpdate: Date.now(),
        version: this.state.version + 1,
        isLoading: false,
        loadingProgress: 100
      });
      
      // 发布数据加载完成事件
      this.eventManager.emit('data:loaded', {
        state: this.getState(),
        version: this.state.version,
        timestamp: Date.now()
      });
      
      console.log('✅ 数据加载完成 🐱', this._getLoadingSummary());
      return this.getState();
      
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
      
      this._updateState({
        error: error.message,
        isLoading: false,
        loadingProgress: 0
      });
      
      this.eventManager.emit('data:error', {
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  /**
   * 等待加载完成
   * @private
   * @returns {Promise<Object>}
   */
  async _waitForLoading() {
    return new Promise((resolve) => {
      const checkLoading = () => {
        if (!this.state.isLoading) {
          resolve(this.getState());
        } else {
          setTimeout(checkLoading, 100);
        }
      };
      checkLoading();
    });
  }
  
  /**
   * 加载收藏夹数据
   * @private
   * @param {boolean} forceRefresh
   */
  async _loadBookmarksData(forceRefresh = false) {
    console.log('📚 加载收藏夹数据 🐱');
    
    try {
      await this.bookmarkManager.loadBookmarks(forceRefresh);
      
      // 更新基础书签数据
      this._updateState({
        bookmarks: this.bookmarkManager.cache?.flatBookmarks || [],
        lastSync: this.bookmarkManager.lastSync || Date.now()
      });
      
      console.log('📚 收藏夹数据加载成功 🐱');
      
    } catch (error) {
      console.error('❌ 收藏夹数据加载失败:', error);
      throw error;
    }
  }
  
  /**
   * 从收藏夹数据生成文件夹树
   * @private
   */
  _generateFolderTreeFromBookmarks() {
    console.log('🌳 生成文件夹树 🐱');
    
    try {
      // 获取原始收藏夹树结构
      const rawTree = this.bookmarkManager.cache?.tree || [];
      const folderTree = [];
      
      // 处理根节点，通常包含 "书签栏"、"其他书签" 等
      rawTree.forEach(rootNode => {
        if (rootNode.children) {
          // 添加一个"全部"节点
          if (folderTree.length === 0) {
            folderTree.push({
              id: 'all',
              title: '全部收藏',
              icon: '🗂️',
              bookmarkCount: this.bookmarkManager.cache?.totalBookmarks || 0,
              isSpecial: true,
              isExpanded: true,
              children: []
            });
          }
          
          // 处理每个根节点的子节点
          rootNode.children.forEach(child => {
            if (child.children !== undefined) { // 这是一个文件夹
              const processedFolder = this._processFolderNode(child, 0);
              if (processedFolder) {
                folderTree.push(processedFolder);
              }
            }
          });
        }
      });
      
      // 构建文件夹映射表
      const folderMap = this._buildFolderMap(folderTree);
      
      // 更新状态
      this._updateState({
        folderTree,
        folderMap
      });
      
      console.log('🌳 文件夹树生成完成，根节点数量:', folderTree.length);
      console.log('🗂️ 文件夹映射表包含', folderMap.size, '个文件夹 🐱');
      
    } catch (error) {
      console.error('❌ 文件夹树生成失败:', error);
      throw error;
    }
  }
  
  /**
   * 处理文件夹节点
   * @private
   * @param {Object} node
   * @param {number} depth
   * @returns {Object}
   */
  _processFolderNode(node, depth) {
    const folderInfo = this.bookmarkManager.cache?.folderMap[node.id] || {};
    
    const folderNode = {
      id: node.id,
      title: node.title,
      parentId: node.parentId,
      icon: this._getFolderIcon(node.title, depth),
      bookmarkCount: folderInfo.bookmarkCount || 0,
      depth: depth,
      isExpanded: depth < 2, // 前两层默认展开
      children: []
    };
    
    // 递归处理子文件夹
    if (node.children) {
      node.children.forEach(child => {
        if (child.children !== undefined) { // 这是一个文件夹
          const childFolder = this._processFolderNode(child, depth + 1);
          if (childFolder) {
            folderNode.children.push(childFolder);
          }
        }
      });
    }
    
    return folderNode;
  }
  
  /**
   * 生成所有链接数据
   * @private
   */
  _generateAllLinks() {
    console.log('🔗 生成所有链接数据 🐱');
    
    try {
      const allBookmarks = this.bookmarkManager.cache?.flatBookmarks || [];
      
      console.log('📚 原始书签数据:', allBookmarks.length, '个');
      
      const allLinks = allBookmarks.map(bookmark => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        folderId: bookmark.parentId,
        iconUrl: bookmark.iconUrl || this._generateFaviconUrl(bookmark.url),
        dateAdded: bookmark.dateAdded,
        dateGrouped: bookmark.dateGrouped
      }));
      
      // 更新状态
      this._updateState({ allLinks });
      
      console.log('🔗 生成了所有链接数据，共', allLinks.length, '个链接 🐱');
      
    } catch (error) {
      console.error('❌ 生成链接数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 构建文件夹映射表
   * @private
   * @param {Array} folderTree
   * @returns {Map}
   */
  _buildFolderMap(folderTree) {
    const map = new Map();
    
    const traverseTree = (nodes) => {
      nodes.forEach(node => {
        map.set(node.id, node);
        if (node.children && node.children.length > 0) {
          traverseTree(node.children);
        }
      });
    };
    
    traverseTree(folderTree);
    return map;
  }
  
  /**
   * 更新统计信息
   * @private
   */
  _updateStats() {
    const stats = {
      totalBookmarks: this.state.bookmarks.length,
      totalFolders: this.state.folderMap.size,
      totalLinks: this.state.allLinks.length,
      lastRefresh: Date.now()
    };
    
    this._updateState({ stats });
  }
  
  /**
   * 获取文件夹图标
   * @private
   * @param {string} folderTitle
   * @param {number} depth
   * @returns {string}
   */
  _getFolderIcon(folderTitle, depth) {
    // 简化版图标选择逻辑
    const icons = ['📁', '📂', '🗂️', '📋', '📌', '⭐', '🏷️', '🎯'];
    return icons[depth % icons.length] || '📁';
  }
  
  /**
   * 生成Favicon URL
   * @private
   * @param {string} url
   * @returns {string}
   */
  _generateFaviconUrl(url) {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch (error) {
      return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23f0f0f0"/></svg>';
    }
  }
  
  /**
   * 刷新数据
   * @returns {Promise<Object>}
   */
  async refresh() {
    console.log('🔄 刷新数据 🐱');
    return await this.loadData(true);
  }
  
  /**
   * 更新状态
   * @private
   * @param {Object} updates
   */
  _updateState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // 通知状态监听器
    for (const listener of this.stateListeners) {
      try {
        listener(this.state, oldState, updates);
      } catch (error) {
        console.error('❌ 状态监听器错误:', error);
      }
    }
    
    // 发布状态更新事件
    if (this.eventManager) {
      this.eventManager.emit('data:stateChanged', {
        newState: this.state,
        oldState,
        updates,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * 处理BookmarkManager数据加载完成
   * @private
   * @param {Object} data
   */
  _handleBookmarkDataLoaded(data) {
    console.log('📊 处理收藏夹数据加载完成 🐱');
    // 如果当前没有在加载，可能是外部更新，需要重新处理数据
    if (!this.state.isLoading) {
      this.loadData(false).catch(error => {
        console.error('❌ 处理外部数据更新失败:', error);
      });
    }
  }
  
  /**
   * 处理BookmarkManager数据更新
   * @private
   * @param {Object} data
   */
  _handleBookmarkDataUpdated(data) {
    console.log('📊 处理收藏夹数据更新 🐱', data);
    
    // 发布更新前事件
    this.eventManager.emit('data:beforeUpdate', {
      action: data.action,
      data: data.data,
      timestamp: Date.now()
    });
    
    // 重新加载数据
    this.loadData(true).then(() => {
      // 发布更新后事件
      this.eventManager.emit('data:afterUpdate', {
        action: data.action,
        data: data.data,
        newState: this.getState(),
        timestamp: Date.now()
      });
    }).catch(error => {
      console.error('❌ 处理数据更新失败:', error);
    });
  }
  
  /**
   * 处理BookmarkManager数据错误
   * @private
   * @param {Error} error
   */
  _handleBookmarkDataError(error) {
    console.error('❌ 处理收藏夹数据错误 🐱', error);
    
    this._updateState({
      error: error.message,
      isLoading: false
    });
    
    this.eventManager.emit('data:error', {
      error: error.message,
      timestamp: Date.now()
    });
  }
  
  /**
   * 获取加载摘要
   * @private
   * @returns {Object}
   */
  _getLoadingSummary() {
    return {
      bookmarks: this.state.bookmarks.length,
      folders: this.state.folderMap.size,
      links: this.state.allLinks.length,
      version: this.state.version
    };
  }
  
  // ==================== 公共API ====================
  
  /**
   * 获取当前状态（副本）
   * @returns {Object}
   */
  getState() {
    return { 
      ...this.state,
      folderMap: new Map(this.state.folderMap) // 创建Map副本
    };
  }
  
  /**
   * 获取文件夹树
   * @returns {Array}
   */
  getFolderTree() {
    return [...this.state.folderTree];
  }
  
  /**
   * 获取文件夹映射表
   * @returns {Map}
   */
  getFolderMap() {
    return new Map(this.state.folderMap);
  }
  
  /**
   * 获取所有链接
   * @returns {Array}
   */
  getAllLinks() {
    return [...this.state.allLinks];
  }
  
  /**
   * 获取所有书签
   * @returns {Array}
   */
  getBookmarks() {
    return [...this.state.bookmarks];
  }
  
  /**
   * 获取文件夹信息
   * @param {string} folderId
   * @returns {Object|null}
   */
  getFolder(folderId) {
    return this.state.folderMap.get(folderId) || null;
  }
  
  /**
   * 获取文件夹中的书签
   * @param {string} folderId
   * @returns {Array}
   */
  getBookmarksInFolder(folderId) {
    if (folderId === 'all') {
      return this.getAllLinks();
    }
    
    const folderIds = this.getFolderAndSubfolderIds(folderId);
    return this.state.allLinks.filter(link => {
      return folderIds.includes(link.parentId) || folderIds.includes(link.folderId);
    });
  }
  
  /**
   * 获取文件夹及其子文件夹的ID
   * @param {string} folderId
   * @returns {Array}
   */
  getFolderAndSubfolderIds(folderId) {
    const ids = [folderId];
    
    const collectChildIds = (node) => {
      if (node.children) {
        node.children.forEach(child => {
          ids.push(child.id);
          collectChildIds(child);
        });
      }
    };
    
    const folder = this.state.folderMap.get(folderId);
    if (folder) {
      collectChildIds(folder);
    }
    
    return ids;
  }
  
  /**
   * 搜索书签
   * @param {string} query
   * @returns {Array}
   */
  searchBookmarks(query) {
    if (!query || !query.trim()) {
      return [];
    }
    
    const searchQuery = query.toLowerCase().trim();
    return this.state.allLinks.filter(bookmark => {
      return bookmark.title.toLowerCase().includes(searchQuery) ||
             bookmark.url.toLowerCase().includes(searchQuery);
    });
  }
  
  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return { ...this.state.stats };
  }
  
  /**
   * 获取BookmarkManager实例
   * @returns {BookmarkManager}
   */
  getBookmarkManager() {
    return this.bookmarkManager;
  }
  
  /**
   * 添加状态监听器
   * @param {Function} listener
   * @returns {Function} 取消监听的函数
   */
  addStateListener(listener) {
    if (typeof listener === 'function') {
      this.stateListeners.push(listener);
      
      // 返回取消监听的函数
      return () => {
        const index = this.stateListeners.indexOf(listener);
        if (index !== -1) {
          this.stateListeners.splice(index, 1);
        }
      };
    }
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('📊 数据管理器开始销毁 🐱');
    
    // 清理状态监听器
    this.stateListeners.length = 0;
    
    // 销毁BookmarkManager
    if (this.bookmarkManager && typeof this.bookmarkManager.dispose === 'function') {
      this.bookmarkManager.dispose();
    }
    
    // 清理状态
    this.state = this.createInitialState();
    
    console.log('📊 数据管理器销毁完成 🐱');
  }
}

// 导出数据管理器类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = DataManager;
} else {
  // 浏览器环境
  window.DataManager = DataManager;
} 