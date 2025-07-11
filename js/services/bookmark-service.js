/**
 * FavoriteBoard - 书签业务服务
 * 负责：书签增删改查、导入导出、标签管理
 * 
 * @author JupiterTheWarlock
 * @description 封装书签相关的业务逻辑，提供统一的书签操作接口 🐱
 */

/**
 * 书签业务服务 - 书签业务逻辑处理
 * 提供书签的增删改查和高级功能
 */
class BookmarkService {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.dataManager = null;
    this.folderService = null;
    this.notificationService = null;
    this.appConfig = null;
    
    // 书签操作状态
    this.operationStates = {
      creating: false,
      updating: false,
      deleting: false,
      importing: false,
      exporting: false
    };
    
    // 书签验证规则
    this.validationRules = {
      titleMinLength: 1,
      titleMaxLength: 255,
      urlPattern: /^https?:\/\/.+/,
      allowedProtocols: ['http:', 'https:', 'ftp:', 'file:'],
      forbiddenUrls: ['javascript:', 'data:', 'about:blank']
    };
    
    // 标签管理
    this.tagCache = new Set();
    this.tagColors = new Map();
    
    // 书签统计
    this.statistics = {
      totalBookmarks: 0,
      totalFolders: 0,
      favoriteCount: 0,
      recentlyAdded: 0,
      recentlyVisited: 0
    };
    
    // 导入导出配置
    this.importExportConfig = {
      supportedFormats: ['html', 'json', 'csv'],
      defaultFormat: 'html',
      includeIcons: true,
      preserveStructure: true,
      maxImportSize: 10 * 1024 * 1024 // 10MB
    };
    
    console.log('📚 书签业务服务初始化 🐱');
  }
  
  /**
   * 初始化书签服务
   */
  async init() {
    try {
      console.log('🚀 书签业务服务开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.dataManager = this.container.get('dataManager');
      this.folderService = this.container.get('folderService');
      this.notificationService = this.container.get('notificationService');
      this.appConfig = this.container.get('appConfig');
      
      // 应用配置
      this._applyConfig();
      
      // 初始化标签缓存
      await this._initializeTagCache();
      
      // 更新统计信息
      this._updateStatistics();
      
      // 绑定事件
      this._bindEvents();
      
      console.log('✅ 书签业务服务初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ 书签业务服务初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 应用配置
   * @private
   */
  _applyConfig() {
    if (this.appConfig) {
      // 应用验证规则配置
      const validationConfig = this.appConfig.validation || {};
      this.validationRules = { ...this.validationRules, ...validationConfig };
      
      // 应用导入导出配置
      const importExportConfig = this.appConfig.importExport || {};
      this.importExportConfig = { ...this.importExportConfig, ...importExportConfig };
    }
  }
  
  /**
   * 初始化标签缓存
   * @private
   */
  async _initializeTagCache() {
    try {
      const allBookmarks = this.dataManager.getAllLinks();
      this.tagCache.clear();
      
      for (const bookmark of allBookmarks) {
        if (bookmark.tags && bookmark.tags.length > 0) {
          bookmark.tags.forEach(tag => this.tagCache.add(tag));
        }
      }
      
      console.log(`📚 标签缓存初始化完成: ${this.tagCache.size} 个标签 🐱`);
      
    } catch (error) {
      console.warn('⚠️ 标签缓存初始化失败:', error);
    }
  }
  
  /**
   * 更新统计信息
   * @private
   */
  _updateStatistics() {
    try {
      const state = this.dataManager.getState();
      const allLinks = state.allLinks || [];
      const folderTree = state.folderTree || [];
      
      this.statistics = {
        totalBookmarks: allLinks.length,
        totalFolders: this._countFolders(folderTree),
        favoriteCount: allLinks.filter(link => link.isFavorite).length,
        recentlyAdded: this._countRecentlyAdded(allLinks),
        recentlyVisited: this._countRecentlyVisited(allLinks)
      };
      
      console.log('📊 书签统计信息已更新 🐱', this.statistics);
      
    } catch (error) {
      console.warn('⚠️ 统计信息更新失败:', error);
    }
  }
  
  /**
   * 计算文件夹数量
   * @private
   * @param {Array} folders
   * @returns {number}
   */
  _countFolders(folders) {
    let count = 0;
    for (const folder of folders) {
      count++;
      if (folder.children) {
        count += this._countFolders(folder.children);
      }
    }
    return count;
  }
  
  /**
   * 计算最近添加的书签数量
   * @private
   * @param {Array} bookmarks
   * @returns {number}
   */
  _countRecentlyAdded(bookmarks) {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return bookmarks.filter(bookmark => 
      bookmark.dateAdded && parseInt(bookmark.dateAdded) > sevenDaysAgo
    ).length;
  }
  
  /**
   * 计算最近访问的书签数量
   * @private
   * @param {Array} bookmarks
   * @returns {number}
   */
  _countRecentlyVisited(bookmarks) {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return bookmarks.filter(bookmark => 
      bookmark.lastVisited && parseInt(bookmark.lastVisited) > sevenDaysAgo
    ).length;
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.eventManager) return;
    
    // 监听书签操作请求
    this.eventManager.on('bookmark:create', async (data) => {
      console.log('📚 接收到书签创建请求 🐱', data);
      await this.createBookmark(data.url, data.title, data.folderId, data.options);
    });
    
    this.eventManager.on('bookmark:update', async (data) => {
      console.log('📚 接收到书签更新请求 🐱', data);
      await this.updateBookmark(data.bookmarkId, data.updates);
    });
    
    this.eventManager.on('bookmark:delete', async (data) => {
      console.log('📚 接收到书签删除请求 🐱', data);
      await this.deleteBookmark(data.bookmarkId);
    });
    
    this.eventManager.on('bookmark:move', async (data) => {
      console.log('📚 接收到书签移动请求 🐱', data);
      await this.moveBookmark(data.bookmarkId, data.targetFolderId);
    });
    
    // 监听数据更新事件
    this.eventManager.on('data:loaded', () => {
      this._initializeTagCache();
      this._updateStatistics();
    });
    
    this.eventManager.on('data:afterUpdate', () => {
      this._initializeTagCache();
      this._updateStatistics();
    });
  }
  
  /**
   * 创建书签
   * @param {string} url - 书签URL
   * @param {string} title - 书签标题
   * @param {string} folderId - 目标文件夹ID
   * @param {Object} options - 额外选项
   * @returns {Promise<Object>} 创建的书签对象
   */
  async createBookmark(url, title, folderId, options = {}) {
    if (this.operationStates.creating) {
      throw new Error('正在创建书签中，请稍候...');
    }
    
    this.operationStates.creating = true;
    
    try {
      console.log(`📚 开始创建书签: ${title} -> ${url} 🐱`);
      
      // 发布操作开始事件
      this.eventManager.emit('bookmark:createStart', {
        url,
        title,
        folderId,
        timestamp: Date.now()
      });
      
      // 验证输入
      this._validateBookmarkData(url, title);
      this._validateFolderId(folderId);
      
      // 检查重复
      if (options.checkDuplicate !== false) {
        await this._checkDuplicateBookmark(url, folderId);
      }
      
      // 处理标题
      const processedTitle = title || await this._fetchPageTitle(url);
      
      // 执行创建操作
      const bookmark = await this._executeCreateBookmark(url, processedTitle, folderId, options);
      
      // 处理标签
      if (options.tags && options.tags.length > 0) {
        await this._processTags(bookmark.id, options.tags);
      }
      
      // 发布操作成功事件
      this.eventManager.emit('bookmark:createSuccess', {
        bookmark,
        timestamp: Date.now()
      });
      
      // 显示成功通知
      this.notificationService?.success('书签创建成功');
      
      console.log('✅ 书签创建成功:', bookmark, '🐱');
      
      // 触发数据刷新
      await this._refreshData('创建书签');
      
      return bookmark;
      
    } catch (error) {
      console.error('❌ 创建书签失败:', error);
      
      // 发布操作失败事件
      this.eventManager.emit('bookmark:createFailed', {
        url,
        title,
        folderId,
        error: error.message,
        timestamp: Date.now()
      });
      
      // 显示错误通知
      this.notificationService?.error(`创建书签失败: ${error.message}`);
      
      throw error;
      
    } finally {
      this.operationStates.creating = false;
    }
  }
  
  /**
   * 更新书签
   * @param {string} bookmarkId - 书签ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateBookmark(bookmarkId, updates) {
    if (this.operationStates.updating) {
      throw new Error('正在更新书签中，请稍候...');
    }
    
    this.operationStates.updating = true;
    
    try {
      console.log(`📚 开始更新书签: ${bookmarkId} 🐱`, updates);
      
      // 发布操作开始事件
      this.eventManager.emit('bookmark:updateStart', {
        bookmarkId,
        updates,
        timestamp: Date.now()
      });
      
      // 获取原始书签信息
      const originalBookmark = await this._getBookmarkInfo(bookmarkId);
      
      // 验证更新数据
      if (updates.url) {
        this._validateUrl(updates.url);
      }
      if (updates.title) {
        this._validateTitle(updates.title);
      }
      
      // 执行更新操作
      const result = await this._executeUpdateBookmark(bookmarkId, updates);
      
      // 处理标签更新
      if (updates.tags !== undefined) {
        await this._processTags(bookmarkId, updates.tags);
      }
      
      // 发布操作成功事件
      this.eventManager.emit('bookmark:updateSuccess', {
        bookmarkId,
        originalBookmark,
        updates,
        result,
        timestamp: Date.now()
      });
      
      // 显示成功通知
      this.notificationService?.success('书签更新成功');
      
      console.log('✅ 书签更新成功 🐱');
      
      // 触发数据刷新
      await this._refreshData('更新书签');
      
      return result;
      
    } catch (error) {
      console.error('❌ 更新书签失败:', error);
      
      // 发布操作失败事件
      this.eventManager.emit('bookmark:updateFailed', {
        bookmarkId,
        updates,
        error: error.message,
        timestamp: Date.now()
      });
      
      // 显示错误通知
      this.notificationService?.error(`更新书签失败: ${error.message}`);
      
      throw error;
      
    } finally {
      this.operationStates.updating = false;
    }
  }
  
  /**
   * 删除书签
   * @param {string} bookmarkId - 书签ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteBookmark(bookmarkId) {
    if (this.operationStates.deleting) {
      throw new Error('正在删除书签中，请稍候...');
    }
    
    this.operationStates.deleting = true;
    
    try {
      console.log(`📚 开始删除书签: ${bookmarkId} 🐱`);
      
      // 发布操作开始事件
      this.eventManager.emit('bookmark:deleteStart', {
        bookmarkId,
        timestamp: Date.now()
      });
      
      // 获取书签信息
      const bookmarkInfo = await this._getBookmarkInfo(bookmarkId);
      
      // 执行删除操作
      const result = await this._executeDeleteBookmark(bookmarkId);
      
      // 发布操作成功事件
      this.eventManager.emit('bookmark:deleteSuccess', {
        bookmarkId,
        bookmarkInfo,
        result,
        timestamp: Date.now()
      });
      
      // 显示成功通知
      this.notificationService?.success('书签删除成功');
      
      console.log('✅ 书签删除成功 🐱');
      
      // 触发数据刷新
      await this._refreshData('删除书签');
      
      return result;
      
    } catch (error) {
      console.error('❌ 删除书签失败:', error);
      
      // 发布操作失败事件
      this.eventManager.emit('bookmark:deleteFailed', {
        bookmarkId,
        error: error.message,
        timestamp: Date.now()
      });
      
      // 显示错误通知
      this.notificationService?.error(`删除书签失败: ${error.message}`);
      
      throw error;
      
    } finally {
      this.operationStates.deleting = false;
    }
  }
  
  /**
   * 移动书签
   * @param {string} bookmarkId - 书签ID
   * @param {string} targetFolderId - 目标文件夹ID
   * @returns {Promise<Object>} 移动结果
   */
  async moveBookmark(bookmarkId, targetFolderId) {
    try {
      console.log(`📚 开始移动书签: ${bookmarkId} -> ${targetFolderId} 🐱`);
      
      // 验证目标文件夹
      this._validateFolderId(targetFolderId);
      
      // 获取书签信息
      const bookmarkInfo = await this._getBookmarkInfo(bookmarkId);
      
      // 检查是否需要移动
      if (bookmarkInfo.parentId === targetFolderId) {
        console.log('📚 书签已在目标文件夹中，无需移动 🐱');
        return { success: true, noChange: true };
      }
      
      // 执行移动操作
      const result = await this._executeMoveBookmark(bookmarkId, targetFolderId);
      
      // 发布移动成功事件
      this.eventManager.emit('bookmark:moveSuccess', {
        bookmarkId,
        oldFolderId: bookmarkInfo.parentId,
        newFolderId: targetFolderId,
        result,
        timestamp: Date.now()
      });
      
      // 显示成功通知
      this.notificationService?.success('书签移动成功');
      
      console.log('✅ 书签移动成功 🐱');
      
      // 触发数据刷新
      await this._refreshData('移动书签');
      
      return result;
      
    } catch (error) {
      console.error('❌ 移动书签失败:', error);
      
      // 显示错误通知
      this.notificationService?.error(`移动书签失败: ${error.message}`);
      
      throw error;
    }
  }
  
  /**
   * 验证书签数据
   * @private
   * @param {string} url
   * @param {string} title
   */
  _validateBookmarkData(url, title) {
    this._validateUrl(url);
    this._validateTitle(title);
  }
  
  /**
   * 验证URL
   * @private
   * @param {string} url
   */
  _validateUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL不能为空');
    }
    
    // 检查禁止的URL
    for (const forbidden of this.validationRules.forbiddenUrls) {
      if (url.toLowerCase().startsWith(forbidden)) {
        throw new Error('不支持的URL类型');
      }
    }
    
    // 检查URL格式
    try {
      const urlObj = new URL(url);
      if (!this.validationRules.allowedProtocols.includes(urlObj.protocol)) {
        throw new Error('不支持的协议类型');
      }
    } catch (error) {
      throw new Error('URL格式无效');
    }
  }
  
  /**
   * 验证标题
   * @private
   * @param {string} title
   */
  _validateTitle(title) {
    if (!title || typeof title !== 'string') {
      throw new Error('标题不能为空');
    }
    
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < this.validationRules.titleMinLength) {
      throw new Error('标题不能为空');
    }
    
    if (trimmedTitle.length > this.validationRules.titleMaxLength) {
      throw new Error(`标题不能超过 ${this.validationRules.titleMaxLength} 个字符`);
    }
  }
  
  /**
   * 验证文件夹ID
   * @private
   * @param {string} folderId
   */
  _validateFolderId(folderId) {
    if (!folderId) {
      throw new Error('文件夹ID不能为空');
    }
    
    const folder = this.dataManager.getFolder(folderId);
    if (!folder) {
      throw new Error('目标文件夹不存在');
    }
  }
  
  /**
   * 检查重复书签
   * @private
   * @param {string} url
   * @param {string} folderId
   */
  async _checkDuplicateBookmark(url, folderId) {
    const folderBookmarks = this.dataManager.getBookmarksInFolder(folderId);
    const duplicate = folderBookmarks.find(bookmark => bookmark.url === url);
    
    if (duplicate) {
      throw new Error('该文件夹中已存在相同的书签');
    }
  }
  
  /**
   * 获取网页标题
   * @private
   * @param {string} url
   * @returns {Promise<string>}
   */
  async _fetchPageTitle(url) {
    try {
      // 在实际环境中，这里会通过背景脚本获取网页标题
      // 这里返回URL作为默认标题
      return new URL(url).hostname;
    } catch (error) {
      return 'New Bookmark';
    }
  }
  
  /**
   * 获取书签信息
   * @private
   * @param {string} bookmarkId
   * @returns {Promise<Object>}
   */
  async _getBookmarkInfo(bookmarkId) {
    const bookmarkManager = this.dataManager.getBookmarkManager();
    
    try {
      const [bookmark] = await bookmarkManager.sendMessage({
        action: 'getBookmark',
        bookmarkId
      });
      
      if (!bookmark) {
        throw new Error('书签不存在');
      }
      
      return bookmark;
    } catch (error) {
      throw new Error(`获取书签信息失败: ${error.message}`);
    }
  }
  
  /**
   * 执行创建书签操作
   * @private
   * @param {string} url
   * @param {string} title
   * @param {string} folderId
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async _executeCreateBookmark(url, title, folderId, options) {
    const bookmarkManager = this.dataManager.getBookmarkManager();
    
    const response = await bookmarkManager.sendMessage({
      action: 'createBookmark',
      parentId: folderId,
      title: title.trim(),
      url: url.trim()
    });
    
    if (!response.success) {
      throw new Error(response.error || '创建书签失败');
    }
    
    return response.bookmark;
  }
  
  /**
   * 执行更新书签操作
   * @private
   * @param {string} bookmarkId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async _executeUpdateBookmark(bookmarkId, updates) {
    const bookmarkManager = this.dataManager.getBookmarkManager();
    
    const response = await bookmarkManager.sendMessage({
      action: 'updateBookmark',
      bookmarkId,
      changes: updates
    });
    
    if (!response.success) {
      throw new Error(response.error || '更新书签失败');
    }
    
    return response;
  }
  
  /**
   * 执行删除书签操作
   * @private
   * @param {string} bookmarkId
   * @returns {Promise<Object>}
   */
  async _executeDeleteBookmark(bookmarkId) {
    const bookmarkManager = this.dataManager.getBookmarkManager();
    
    const response = await bookmarkManager.sendMessage({
      action: 'deleteBookmark',
      bookmarkId
    });
    
    if (!response.success) {
      throw new Error(response.error || '删除书签失败');
    }
    
    return response;
  }
  
  /**
   * 执行移动书签操作
   * @private
   * @param {string} bookmarkId
   * @param {string} targetFolderId
   * @returns {Promise<Object>}
   */
  async _executeMoveBookmark(bookmarkId, targetFolderId) {
    const bookmarkManager = this.dataManager.getBookmarkManager();
    
    const response = await bookmarkManager.sendMessage({
      action: 'moveBookmark',
      bookmarkId,
      destination: { parentId: targetFolderId }
    });
    
    if (!response.success) {
      throw new Error(response.error || '移动书签失败');
    }
    
    return response;
  }
  
  /**
   * 处理标签
   * @private
   * @param {string} bookmarkId
   * @param {Array} tags
   */
  async _processTags(bookmarkId, tags) {
    // 更新标签缓存
    tags.forEach(tag => this.tagCache.add(tag));
    
    // 发布标签更新事件
    this.eventManager.emit('bookmark:tagsUpdated', {
      bookmarkId,
      tags,
      timestamp: Date.now()
    });
  }
  
  /**
   * 刷新数据
   * @private
   * @param {string} reason
   */
  async _refreshData(reason) {
    console.log(`🔄 ${reason}后刷新数据 🐱`);
    
    // 延迟一点时间让Chrome更新缓存
    setTimeout(async () => {
      try {
        await this.dataManager.refresh();
        console.log('✅ 数据刷新完成 🐱');
      } catch (error) {
        console.error('❌ 数据刷新失败:', error);
      }
    }, 100);
  }
  
  // ==================== 公共API ====================
  
  /**
   * 批量创建书签
   * @param {Array} bookmarks - 书签数组
   * @param {string} folderId - 目标文件夹ID
   * @returns {Promise<Array>} 创建结果
   */
  async createBookmarksBatch(bookmarks, folderId) {
    const results = [];
    const errors = [];
    
    for (const bookmarkData of bookmarks) {
      try {
        const result = await this.createBookmark(
          bookmarkData.url,
          bookmarkData.title,
          folderId,
          bookmarkData.options || {}
        );
        results.push(result);
      } catch (error) {
        errors.push({
          bookmark: bookmarkData,
          error: error.message
        });
      }
    }
    
    return { results, errors };
  }
  
  /**
   * 获取书签统计信息
   * @returns {Object}
   */
  getStatistics() {
    return { ...this.statistics };
  }
  
  /**
   * 获取所有标签
   * @returns {Array}
   */
  getAllTags() {
    return Array.from(this.tagCache);
  }
  
  /**
   * 搜索标签
   * @param {string} query - 搜索查询
   * @returns {Array}
   */
  searchTags(query) {
    if (!query) return this.getAllTags();
    
    const searchQuery = query.toLowerCase();
    return this.getAllTags().filter(tag => 
      tag.toLowerCase().includes(searchQuery)
    );
  }
  
  /**
   * 根据标签获取书签
   * @param {string} tag - 标签名
   * @returns {Array}
   */
  getBookmarksByTag(tag) {
    const allBookmarks = this.dataManager.getAllLinks();
    return allBookmarks.filter(bookmark => 
      bookmark.tags && bookmark.tags.includes(tag)
    );
  }
  
  /**
   * 验证书签数据（公共方法）
   * @param {Object} bookmarkData
   * @returns {Object} 验证结果
   */
  validateBookmarkData(bookmarkData) {
    try {
      if (bookmarkData.url) {
        this._validateUrl(bookmarkData.url);
      }
      if (bookmarkData.title) {
        this._validateTitle(bookmarkData.title);
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * 获取操作状态
   * @returns {Object}
   */
  getOperationStates() {
    return { ...this.operationStates };
  }
  
  /**
   * 获取验证规则
   * @returns {Object}
   */
  getValidationRules() {
    return { ...this.validationRules };
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('📚 书签业务服务开始销毁 🐱');
    
    // 重置操作状态
    this.operationStates = {
      creating: false,
      updating: false,
      deleting: false,
      importing: false,
      exporting: false
    };
    
    // 清空缓存
    this.tagCache.clear();
    this.tagColors.clear();
    
    console.log('📚 书签业务服务销毁完成 🐱');
  }
}

// 导出书签业务服务类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = BookmarkService;
} else {
  // 浏览器环境
  window.BookmarkService = BookmarkService;
} 