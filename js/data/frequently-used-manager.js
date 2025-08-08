// FavoriteBoard Plugin - Frequently Used Websites Manager
// 常用网页数据管理器

/**
 * FrequentlyUsedManager - 常用网页数据管理器
 * 负责常用网页的增删改查操作，使用Chrome Storage API实现数据持久化
 * 实现事件驱动架构，与现有系统无缝集成
 */
class FrequentlyUsedManager {
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this.storageKey = 'frequentlyUsedWebsites';
    this.maxCount = null;
    this.cache = null;
    this.lastSync = null;
    this.isLoading = false;
    this.eventListeners = new Map();
    
    console.log('⭐ FrequentlyUsedManager initialized');
  }
  
  // ==================== 核心数据操作方法 ====================
  
  /**
   * 获取常用网页列表
   */
  async getFrequentlyUsedWebsites() {
    if (this.isLoading) {
      return this.cache || { urls: [], maxCount: this.maxCount };
    }
    
    this.isLoading = true;
    
    try {
      if (this.cache && this.isCacheValid()) {
        this.isLoading = false;
        return this.cache;
      }
      
      // Edge浏览器数据迁移检查
      const browser = this.detectBrowser();
      if (browser === 'edge') {
        await this.checkAndMigrateEdgeData();
      }
      
      const data = await this.loadFromStorage();
      this.cache = this.validateAndNormalizeData(data);
      this.lastSync = Date.now();
      
      this.emit('frequently-used-loaded', this.cache);
      await this.showStorageStatusNotification();
      
      this.isLoading = false;
      return this.cache;
      
    } catch (error) {
      console.error('❌ Error loading frequently used websites:', error);
      this.isLoading = false;
      this.emit('frequently-used-error', error);
      return { urls: [], maxCount: this.maxCount };
    }
  }
  
  /**
   * 添加常用网页
   */
  async addFrequentlyUsedWebsite(url, bookmarkData) {
    try {
      if (!this.isValidUrl(url)) {
        throw new Error('无效的URL');
      }
      
      const data = await this.getFrequentlyUsedWebsites();
      const existingIndex = data.urls.findIndex(item => item.url === url);
      
      if (existingIndex !== -1) {
        data.urls[existingIndex] = this.createWebsiteInfo(url, bookmarkData);
      } else {
        data.urls.push(this.createWebsiteInfo(url, bookmarkData));
      }
      
      await this.saveToStorage(data);
      this.updateCache(data);
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
   */
  async removeFrequentlyUsedWebsite(url) {
    try {
      const data = await this.getFrequentlyUsedWebsites();
      const index = data.urls.findIndex(item => item.url === url);
      
      if (index === -1) {
        throw new Error('常用网页不存在');
      }
      
      const removedItem = data.urls.splice(index, 1)[0];
      await this.saveToStorage(data);
      this.updateCache(data);
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
   */
  async updateLastUsed(url) {
    try {
      const data = await this.getFrequentlyUsedWebsites();
      const item = data.urls.find(item => item.url === url);
      
      if (!item) {
        throw new Error('常用网页不存在');
      }
      
      item.lastUsed = Date.now();
      data.urls.sort((a, b) => b.lastUsed - a.lastUsed);
      
      await this.saveToStorage(data);
      this.updateCache(data);
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
   */
  getWebsiteInfo(url, allBookmarks) {
    if (!url || !allBookmarks) return null;
    
    const bookmark = this.findBookmarkByUrl(url, allBookmarks);
    return bookmark ? {
      url: bookmark.url,
      title: bookmark.title,
      icon: bookmark.icon || null,
      addedAt: bookmark.dateAdded || Date.now(),
      lastUsed: Date.now()
    } : null;
  }
  
  // ==================== 存储操作方法 ====================
  
  /**
   * 检测浏览器类型
   */
  detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('edg/') || userAgent.includes('edge/')) return 'edge';
    if (userAgent.includes('chrome/')) return 'chrome';
    return 'unknown';
  }
  
  /**
   * 检测是否支持同步存储
   */
  async isSyncStorageSupported() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        return false;
      }
      
      const testKey = '__test_sync_storage__';
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({ [testKey]: 'test' }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            chrome.storage.sync.remove([testKey], resolve);
          }
        });
      });
      
      return true;
    } catch (error) {
      console.warn('⚠️ Sync storage not supported:', error.message);
      return false;
    }
  }
  
  /**
   * 从存储加载数据
   */
  async loadFromStorage() {
    try {
      const browser = this.detectBrowser();
      const syncSupported = await this.isSyncStorageSupported();
      
      if (syncSupported) {
        try {
          return await this.loadFromSyncStorage();
        } catch (error) {
          console.warn('⚠️ Failed to load from sync storage, falling back to local storage:', error.message);
        }
      }
      
      return await this.loadFromLocalStorage();
      
    } catch (error) {
      console.error('❌ Error loading from storage:', error);
      return { urls: [], maxCount: this.maxCount };
    }
  }
  
  /**
   * 保存数据到存储
   */
  async saveToStorage(data) {
    try {
      const browser = this.detectBrowser();
      const syncSupported = await this.isSyncStorageSupported();
      
      if (syncSupported) {
        try {
          await this.saveToSyncStorage(data);
          await this.saveToLocalStorage(data); // 备份
          return;
        } catch (error) {
          console.warn('⚠️ Failed to save to sync storage, falling back to local storage:', error.message);
        }
      }
      
      await this.saveToLocalStorage(data);
      
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
      throw error;
    }
  }
  
  /**
   * 从同步存储加载数据
   */
  async loadFromSyncStorage() {
    return new Promise((resolve, reject) => {
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
   * 从本地存储加载数据
   */
  async loadFromLocalStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[this.storageKey] || { urls: [], maxCount: this.maxCount });
        }
      });
    });
  }
  
  /**
   * 保存数据到同步存储
   */
  async saveToSyncStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [this.storageKey]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * 保存数据到本地存储
   */
  async saveToLocalStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: data }, () => {
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
   */
  validateAndNormalizeData(data) {
    if (!data || typeof data !== 'object') {
      return { urls: [], maxCount: null };
    }
    
    const normalized = {
      urls: Array.isArray(data.urls) ? data.urls : [],
      maxCount: null
    };
    
    normalized.urls = normalized.urls.filter(item => {
      if (!item || typeof item !== 'object' || !item.url || !this.isValidUrl(item.url)) {
        return false;
      }
      
      return {
        url: item.url,
        title: item.title || 'Unknown',
        icon: item.icon || null,
        addedAt: item.addedAt || Date.now(),
        lastUsed: item.lastUsed || item.addedAt || Date.now()
      };
    });
    
    normalized.urls.sort((a, b) => b.lastUsed - a.lastUsed);
    return normalized;
  }
  
  /**
   * 检查缓存是否有效
   */
  isCacheValid() {
    if (!this.cache || !this.lastSync) return false;
    const cacheAge = Date.now() - this.lastSync;
    return cacheAge < 5 * 60 * 1000; // 5分钟缓存
  }
  
  /**
   * 验证URL是否有效
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  /**
   * 创建网页信息对象
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
   */
  findBookmarkByUrl(url, bookmarks) {
    if (!Array.isArray(bookmarks)) return null;
    
    for (const bookmark of bookmarks) {
      if (bookmark.url === url) return bookmark;
      if (bookmark.children) {
        const found = this.findBookmarkByUrl(url, bookmark.children);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  // ==================== 事件系统方法 ====================
  
  /**
   * 注册事件监听器
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  
  /**
   * 移除事件监听器
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.eventBus) {
      this.eventBus.emit(event, data);
    } else {
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
  
  // ==================== 工具方法 ====================
  
  /**
   * 更新缓存
   */
  updateCache(data) {
    this.cache = data;
    this.lastSync = Date.now();
  }
  
  /**
   * 检查并迁移Edge数据
   */
  async checkAndMigrateEdgeData() {
    const syncSupported = await this.isSyncStorageSupported();
    if (!syncSupported) return;
    
    try {
      const syncData = await this.loadFromSyncStorage();
      const localData = await this.loadFromLocalStorage();
      
      if (syncData && syncData.urls && syncData.urls.length > 0 && 
          (!localData || !localData.urls || localData.urls.length === 0)) {
        console.log('🔄 Migrating data from sync to local storage for Edge compatibility...');
        await this.migrateFromSyncToLocal();
      }
    } catch (error) {
      console.warn('⚠️ Error during Edge data migration:', error.message);
    }
  }
  
  /**
   * 尝试从同步存储恢复数据到本地存储
   */
  async migrateFromSyncToLocal() {
    try {
      const syncData = await this.loadFromSyncStorage();
      
      if (syncData && syncData.urls && syncData.urls.length > 0) {
        await this.saveToLocalStorage(syncData);
        console.log(`✅ Successfully migrated ${syncData.urls.length} frequently used websites to local storage`);
        this.updateCache(syncData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ Failed to migrate from sync storage:', error.message);
      return false;
    }
  }
  
  /**
   * 获取存储状态信息
   */
  async getStorageStatus() {
    const browser = this.detectBrowser();
    const syncSupported = await this.isSyncStorageSupported();
    
    let syncData = null;
    let localData = null;
    
    try {
      syncData = await this.loadFromSyncStorage();
    } catch (error) {
      console.warn('⚠️ Cannot read sync storage:', error.message);
    }
    
    try {
      localData = await this.loadFromLocalStorage();
    } catch (error) {
      console.warn('⚠️ Cannot read local storage:', error.message);
    }
    
    return {
      browser,
      syncSupported,
      syncDataCount: syncData?.urls?.length || 0,
      localDataCount: localData?.urls?.length || 0,
      hasSyncData: syncData && syncData.urls && syncData.urls.length > 0,
      hasLocalData: localData && localData.urls && localData.urls.length > 0
    };
  }
  
  /**
   * 显示存储状态通知
   */
  async showStorageStatusNotification() {
    try {
      const syncSupported = await this.isSyncStorageSupported();
      let message = '';
      let type = 'info';

      if (syncSupported) {
        // 优先显示在线(同步)存储的数量与URL详情
        let syncData = { urls: [] };
        try {
          syncData = await this.loadFromSyncStorage();
        } catch (e) {
          console.warn('⚠️ 读取在线存储失败:', e.message);
        }

        const urls = Array.isArray(syncData?.urls)
          ? syncData.urls.map(item => item?.url).filter(u => typeof u === 'string')
          : [];

        const count = urls.length;
        const previewCount = Math.min(count, 10);
        const preview = urls.slice(0, previewCount).join(' | ');
        const tail = count > previewCount ? ' 等' : '';

        message = `在线存储中有 ${count} 个常用网页${count > 0 ? `：${preview}${tail}` : ''}`;
        type = 'success';
      } else {
        // 在线存储不可用时，降级展示本地存储，同时明确说明
        let localData = { urls: [] };
        try {
          localData = await this.loadFromLocalStorage();
        } catch (e) {
          console.warn('⚠️ 读取本地存储失败:', e.message);
        }

        const urls = Array.isArray(localData?.urls)
          ? localData.urls.map(item => item?.url).filter(u => typeof u === 'string')
          : [];

        const count = urls.length;
        const previewCount = Math.min(count, 10);
        const preview = urls.slice(0, previewCount).join(' | ');
        const tail = count > previewCount ? ' 等' : '';

        message = `在线存储不可用，当前本地存储有 ${count} 个常用网页${count > 0 ? `：${preview}${tail}` : ''}`;
        type = 'warning';
      }

      if (message) {
        this.emit('storage-status-notification', { message, type });
      }
      
    } catch (error) {
      console.error('❌ Error showing storage status notification:', error);
    }
  }
  
  /**
   * 获取统计信息
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
   */
  async clearAll() {
    try {
      const emptyData = { urls: [], maxCount: this.maxCount };
      await this.saveToStorage(emptyData);
      this.updateCache(emptyData);
      this.emit('frequently-used-cleared', {});
    } catch (error) {
      console.error('❌ Error clearing frequently used websites:', error);
      throw error;
    }
  }
  
  /**
   * 刷新缓存
   */
  async refreshCache() {
    this.cache = null;
    this.lastSync = null;
    return await this.getFrequentlyUsedWebsites();
  }
  
  /**
   * 强制使用本地存储
   */
  async forceUseLocalStorage() {
    try {
      await this.migrateFromSyncToLocal();
      this.preferLocalStorage = true;
    } catch (error) {
      console.error('❌ Error forcing local storage mode:', error);
      throw error;
    }
  }
}

// 导出类
window.FrequentlyUsedManager = FrequentlyUsedManager;

