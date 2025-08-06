// FavoriteBoard Plugin - Frequently Used Websites Manager
// 常用网页数据管理器

/**
 * FrequentlyUsedManager - 常用网页数据管理器
 * 负责常用网页的增删改查操作，使用Chrome Storage API实现数据持久化
 * 实现事件驱动架构，与现有系统无缝集成
 */
class FrequentlyUsedManager {
  constructor(eventBus = null) {
    // 事件总线
    this.eventBus = eventBus;
    
    // 存储配置
    this.storageKey = 'frequentlyUsedWebsites';
    this.maxCount = null; // 移除最大数量限制
    
    // 缓存管理
    this.cache = null;
    this.lastSync = null;
    this.isLoading = false;
    
    // 事件监听器（如果没有eventBus，使用本地事件系统）
    this.eventListeners = new Map();
    
    console.log('⭐ FrequentlyUsedManager initialized');
  }
  
  // ==================== 数据获取方法 ====================
  
  /**
   * 获取常用网页列表
   * @returns {Promise<Object>} 常用网页数据
   */
  async getFrequentlyUsedWebsites() {
    if (this.isLoading) {
      console.log('⏳ Already loading frequently used websites, skipping...');
      return this.cache || { urls: [], maxCount: this.maxCount };
    }
    
    this.isLoading = true;
    
    try {
      console.log('📖 Loading frequently used websites...');
      
      // 检查缓存是否有效
      if (this.cache && this.isCacheValid()) {
        console.log('✅ Using cached frequently used websites data');
        this.isLoading = false;
        return this.cache;
      }
      
      const data = await this.loadFromStorage();
      
      // 验证和标准化数据
      this.cache = this.validateAndNormalizeData(data);
      this.lastSync = Date.now();
      
      console.log('✅ Frequently used websites loaded successfully');
      console.log(`📊 Total: ${this.cache.urls.length} frequently used websites`);
      
      // 触发加载完成事件
      this.emit('frequently-used-loaded', this.cache);
      
      this.isLoading = false;
      return this.cache;
      
    } catch (error) {
      console.error('❌ Error loading frequently used websites:', error);
      this.isLoading = false;
      
      // 触发错误事件
      this.emit('frequently-used-error', error);
      
      // 返回默认数据
      return { urls: [], maxCount: this.maxCount };
    }
  }
  
  /**
   * 添加常用网页
   * @param {string} url - 网页URL
   * @param {Object} bookmarkData - 收藏夹数据
   * @returns {Promise<Object>} 添加结果
   */
  async addFrequentlyUsedWebsite(url, bookmarkData) {
    try {
      console.log('➕ Adding frequently used website:', url);
      
      // 验证URL
      if (!this.isValidUrl(url)) {
        throw new Error('无效的URL');
      }
      
      // 获取当前数据
      const data = await this.getFrequentlyUsedWebsites();
      
      // 检查是否已存在
      const existingIndex = data.urls.findIndex(item => item.url === url);
      if (existingIndex !== -1) {
        console.log('⚠️ Website already exists, updating...');
        data.urls[existingIndex] = this.createWebsiteInfo(url, bookmarkData);
      } else {
        // 移除最大数量限制，直接添加新条目
        data.urls.push(this.createWebsiteInfo(url, bookmarkData));
      }
      
      // 保存数据
      await this.saveToStorage(data);
      
      // 更新缓存
      this.cache = data;
      this.lastSync = Date.now();
      
      console.log('✅ Frequently used website added successfully');
      
      // 触发添加事件
      this.emit('frequently-used-added', { url, websiteInfo: this.getWebsiteInfo(url, bookmarkData) });
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error adding frequently used website:', error);
      this.emit('frequently-used-error', error);
      throw error;
    }
  }
  
  /**
   * 移除常用网页
   * @param {string} url - 网页URL
   * @returns {Promise<Object>} 移除结果
   */
  async removeFrequentlyUsedWebsite(url) {
    try {
      console.log('🗑️ Removing frequently used website:', url);
      
      // 获取当前数据
      const data = await this.getFrequentlyUsedWebsites();
      
      // 查找并移除
      const index = data.urls.findIndex(item => item.url === url);
      if (index === -1) {
        throw new Error('常用网页不存在');
      }
      
      const removedItem = data.urls.splice(index, 1)[0];
      
      // 保存数据
      await this.saveToStorage(data);
      
      // 更新缓存
      this.cache = data;
      this.lastSync = Date.now();
      
      console.log('✅ Frequently used website removed successfully');
      
      // 触发移除事件
      this.emit('frequently-used-removed', { url, removedItem });
      
      return { success: true, removedItem };
      
    } catch (error) {
      console.error('❌ Error removing frequently used website:', error);
      this.emit('frequently-used-error', error);
      throw error;
    }
  }
  
  /**
   * 更新使用时间
   * @param {string} url - 网页URL
   * @returns {Promise<Object>} 更新结果
   */
  async updateLastUsed(url) {
    try {
      console.log('🔄 Updating last used time for:', url);
      
      // 获取当前数据
      const data = await this.getFrequentlyUsedWebsites();
      
      // 查找并更新
      const item = data.urls.find(item => item.url === url);
      if (!item) {
        throw new Error('常用网页不存在');
      }
      
      item.lastUsed = Date.now();
      
      // 重新排序（最近使用的在前）
      data.urls.sort((a, b) => b.lastUsed - a.lastUsed);
      
      // 保存数据
      await this.saveToStorage(data);
      
      // 更新缓存
      this.cache = data;
      this.lastSync = Date.now();
      
      console.log('✅ Last used time updated successfully');
      
      // 触发更新事件
      this.emit('frequently-used-updated', { url, item });
      
      return { success: true, item };
      
    } catch (error) {
      console.error('❌ Error updating last used time:', error);
      this.emit('frequently-used-error', error);
      throw error;
    }
  }
  
  /**
   * 从收藏夹数据中获取网页信息
   * @param {string} url - 网页URL
   * @param {Array} allBookmarks - 所有收藏夹数据
   * @returns {Object|null} 网页信息
   */
  getWebsiteInfo(url, allBookmarks) {
    if (!url || !allBookmarks) {
      return null;
    }
    
    // 在收藏夹中查找匹配的书签
    const bookmark = this.findBookmarkByUrl(url, allBookmarks);
    
    if (bookmark) {
      return {
        url: bookmark.url,
        title: bookmark.title,
        icon: bookmark.icon || null,
        addedAt: bookmark.dateAdded || Date.now(),
        lastUsed: Date.now()
      };
    }
    
    return null;
  }
  
  // ==================== 存储操作方法 ====================
  
  /**
   * 从Chrome Storage加载数据
   * @returns {Promise<Object>} 存储的数据
   */
  async loadFromStorage() {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        reject(new Error('Chrome Storage API不可用'));
        return;
      }
      
      chrome.storage.sync.get([this.storageKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[this.storageKey] || { urls: [], maxCount: this.maxCount });
        }
      });
    });
  }
  
  /**
   * 保存数据到Chrome Storage
   * @param {Object} data - 要保存的数据
   * @returns {Promise<void>}
   */
  async saveToStorage(data) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        reject(new Error('Chrome Storage API不可用'));
        return;
      }
      
      chrome.storage.sync.set({ [this.storageKey]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
  
  // ==================== 数据验证和处理方法 ====================
  
  /**
   * 验证和标准化数据
   * @param {Object} data - 原始数据
   * @returns {Object} 标准化后的数据
   */
  validateAndNormalizeData(data) {
    if (!data || typeof data !== 'object') {
      return { urls: [], maxCount: null };
    }
    
    const normalized = {
      urls: Array.isArray(data.urls) ? data.urls : [],
      maxCount: null // 移除最大数量限制
    };
    
    // 验证每个URL项
    normalized.urls = normalized.urls.filter(item => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      
      // 验证必需字段
      if (!item.url || !this.isValidUrl(item.url)) {
        return false;
      }
      
      // 标准化字段
      return {
        url: item.url,
        title: item.title || 'Unknown',
        icon: item.icon || null,
        addedAt: item.addedAt || Date.now(),
        lastUsed: item.lastUsed || item.addedAt || Date.now()
      };
    });
    
    // 按最后使用时间排序
    normalized.urls.sort((a, b) => b.lastUsed - a.lastUsed);
    
    return normalized;
  }
  
  /**
   * 检查缓存是否有效
   * @returns {boolean} 缓存是否有效
   */
  isCacheValid() {
    if (!this.cache || !this.lastSync) {
      return false;
    }
    
    // 缓存有效期5分钟
    const cacheAge = Date.now() - this.lastSync;
    return cacheAge < 5 * 60 * 1000;
  }
  
  /**
   * 验证URL是否有效
   * @param {string} url - URL字符串
   * @returns {boolean} URL是否有效
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  /**
   * 创建网页信息对象
   * @param {string} url - 网页URL
   * @param {Object} bookmarkData - 收藏夹数据
   * @returns {Object} 网页信息
   */
  createWebsiteInfo(url, bookmarkData) {
    const bookmark = this.findBookmarkByUrl(url, bookmarkData);
    
    return {
      url: url,
      title: bookmark ? bookmark.title : this.extractTitleFromUrl(url),
      icon: bookmark ? (bookmark.iconUrl || bookmark.icon || null) : null,
      addedAt: Date.now(),
      lastUsed: Date.now()
    };
  }
  
  /**
   * 从URL中提取标题
   * @param {string} url - 网页URL
   * @returns {string} 提取的标题
   */
  extractTitleFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Unknown';
    }
  }
  
  /**
   * 在收藏夹数据中查找书签
   * @param {string} url - 网页URL
   * @param {Array} bookmarks - 收藏夹数据
   * @returns {Object|null} 找到的书签
   */
  findBookmarkByUrl(url, bookmarks) {
    if (!Array.isArray(bookmarks)) {
      return null;
    }
    
    for (const bookmark of bookmarks) {
      if (bookmark.url === url) {
        return bookmark;
      }
      
      // 递归搜索子文件夹
      if (bookmark.children) {
        const found = this.findBookmarkByUrl(url, bookmark.children);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }
  
  // ==================== 事件系统方法 ====================
  
  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  
  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    // 优先使用全局eventBus
    if (this.eventBus) {
      this.eventBus.emit(event, data);
    } else {
      // 降级到本地事件系统
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`❌ Error in event listener for ${event}:`, error);
          }
        });
      }
    }
  }
  
  // ==================== 统计和工具方法 ====================
  
  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const data = this.cache || { urls: [] };
    
    return {
      totalCount: data.urls.length,
      maxCount: this.maxCount,
      availableSlots: this.maxCount - data.urls.length,
      lastSync: this.lastSync
    };
  }
  
  /**
   * 清空所有数据
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      console.log('🗑️ Clearing all frequently used websites...');
      
      const emptyData = { urls: [], maxCount: this.maxCount };
      await this.saveToStorage(emptyData);
      
      this.cache = emptyData;
      this.lastSync = Date.now();
      
      console.log('✅ All frequently used websites cleared');
      
      this.emit('frequently-used-cleared', {});
      
    } catch (error) {
      console.error('❌ Error clearing frequently used websites:', error);
      throw error;
    }
  }
  
  /**
   * 刷新缓存
   * @returns {Promise<Object>} 刷新后的数据
   */
  async refreshCache() {
    console.log('🔄 Refreshing frequently used websites cache...');
    
    this.cache = null;
    this.lastSync = null;
    
    return await this.getFrequentlyUsedWebsites();
  }
}

// 导出类
window.FrequentlyUsedManager = FrequentlyUsedManager;
