// FavoriteBoard Plugin - Bookmarks Manager
// 收藏夹数据管理器

class BookmarkManager {
  constructor() {
    this.cache = null;
    this.lastSync = null;
    this.isLoading = false;
    this.eventListeners = new Map();
    
    // 监听来自后台脚本的更新消息
    this.setupMessageListener();
    
    console.log('📚 BookmarkManager initialized');
  }
  
  // 设置消息监听器
  setupMessageListener() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('📨 Received bookmark update:', message.action);
        
        switch (message.action) {
          case 'bookmark-created':
          case 'bookmark-removed':
          case 'bookmark-changed':
          case 'bookmark-moved':
            this.handleBookmarkUpdate(message.action, message.data);
            break;
        }
      });
    }
  }
  
  // 处理收藏夹更新
  async handleBookmarkUpdate(action, data) {
    console.log(`🔄 Handling bookmark update: ${action}`);
    
    try {
      // 重新获取数据
      await this.loadBookmarks(true);
      
      // 触发更新事件
      this.emit('bookmarks-updated', { action, data });
    } catch (error) {
      console.error('❌ Error handling bookmark update:', error);
    }
  }
  
  // 加载收藏夹数据
  async loadBookmarks(forceRefresh = false) {
    if (this.isLoading) {
      console.log('⏳ Already loading bookmarks, skipping...');
      return this.cache;
    }
    
    this.isLoading = true;
    
    try {
      console.log('📖 Loading bookmarks...');
      
      // 检查缓存是否有效
      if (!forceRefresh && this.cache && this.isCacheValid()) {
        console.log('✅ Using cached bookmarks data');
        this.isLoading = false;
        return this.cache;
      }
      
      // 从后台脚本获取数据
      const response = await this.sendMessage({ action: 'getBookmarksCache' });
      
      if (response.success && response.data) {
        this.cache = response.data;
        this.lastSync = response.lastSync || Date.now();
        
        console.log('✅ Bookmarks loaded successfully');
        console.log(`📊 Total: ${this.cache.totalBookmarks} bookmarks in ${this.cache.totalFolders} folders`);
        console.log('📂 FolderMap type:', typeof this.cache.folderMap);
        console.log('📂 FolderMap keys:', Object.keys(this.cache.folderMap || {}));
        
        // 触发加载完成事件
        this.emit('bookmarks-loaded', this.cache);
        
        this.isLoading = false;
        return this.cache;
      } else {
        throw new Error(response.error || 'Failed to load bookmarks');
      }
    } catch (error) {
      console.error('❌ Error loading bookmarks:', error);
      this.isLoading = false;
      
      // 触发错误事件
      this.emit('bookmarks-error', error);
      
      throw error;
    }
  }
  
  // 检查缓存是否有效
  isCacheValid() {
    if (!this.lastSync) return false;
    
    const cacheTimeout = 5 * 60 * 1000; // 5分钟
    return Date.now() - this.lastSync < cacheTimeout;
  }
  
  // 获取收藏夹文件夹树
  getFolderTree() {
    if (!this.cache || !this.cache.tree) return [];
    
    // 处理根节点，通常包含 "书签栏"、"其他书签" 等
    const rootNodes = this.cache.tree;
    const folderTree = [];
    
    rootNodes.forEach(rootNode => {
      if (rootNode.children) {
        rootNode.children.forEach(child => {
          if (child.children) {
            // 这是一个文件夹
            folderTree.push(this.buildFolderNode(child));
          }
        });
      }
    });
    
    return folderTree;
  }
  
  // 构建文件夹节点
  buildFolderNode(node) {
    const folderInfo = this.cache.folderMap[node.id] || {};
    
    return {
      id: node.id,
      title: node.title,
      parentId: node.parentId,
      children: node.children ? node.children.filter(child => child.children).map(child => this.buildFolderNode(child)) : [],
      bookmarkCount: folderInfo.bookmarkCount || 0,
      path: folderInfo.path || node.title,
      dateAdded: node.dateAdded,
      isExpanded: false // 默认折叠
    };
  }
  
  // 获取文件夹内的收藏夹
  getBookmarksInFolder(folderId) {
    if (!this.cache) return [];
    
    return this.cache.flatBookmarks.filter(bookmark => bookmark.parentId === folderId);
  }
  
  // 获取所有收藏夹
  getAllBookmarks() {
    if (!this.cache) return [];
    return this.cache.flatBookmarks;
  }
  
  // 搜索收藏夹
  searchBookmarks(query) {
    if (!this.cache || !query.trim()) return [];
    
    const searchQuery = query.toLowerCase().trim();
    
    return this.cache.flatBookmarks.filter(bookmark => {
      // 搜索标题
      if (bookmark.title.toLowerCase().includes(searchQuery)) return true;
      
      // 搜索URL
      if (bookmark.url.toLowerCase().includes(searchQuery)) return true;
      
      // 搜索域名
      if (bookmark.domain && bookmark.domain.toLowerCase().includes(searchQuery)) return true;
      
      return false;
    });
  }
  
  // 获取网站图标
  async getFavicon(url) {
    try {
      const response = await this.sendMessage({ 
        action: 'getFavicon', 
        url: url 
      });
      
      if (response.success) {
        return response.favicon;
      } else {
        console.warn('⚠️ Failed to get favicon for:', url);
        // 如果有fallback，使用fallback，否则使用默认图标
        return response.fallback || this.getDefaultFavicon();
      }
    } catch (error) {
      console.warn('⚠️ Error getting favicon:', error);
      return this.getDefaultFavicon();
    }
  }
  
  // 获取默认图标
  getDefaultFavicon() {
    // 使用简单的 emoji 作为默认图标
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="4" fill="#94a3b8"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🔗</text>
      </svg>
    `);
  }
  
  // 刷新缓存
  async refreshCache() {
    try {
      console.log('🔄 Refreshing bookmarks cache...');
      
      const response = await this.sendMessage({ action: 'refreshCache' });
      
      if (response.success) {
        // 重新加载数据
        await this.loadBookmarks(true);
        console.log('✅ Cache refreshed successfully');
      } else {
        throw new Error(response.error || 'Failed to refresh cache');
      }
    } catch (error) {
      console.error('❌ Error refreshing cache:', error);
      throw error;
    }
  }
  
  // 发送消息到后台脚本
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        reject(new Error('Chrome runtime not available'));
        return;
      }
      
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  // 事件系统
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }
  
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  // 获取统计信息
  getStats() {
    if (!this.cache) {
      return {
        totalBookmarks: 0,
        totalFolders: 0,
        lastSync: null
      };
    }
    
    return {
      totalBookmarks: this.cache.totalBookmarks,
      totalFolders: this.cache.totalFolders,
      lastSync: this.lastSync
    };
  }
  
  // 获取指定ID的文件夹信息
  async getFolder(folderId) {
    if (!folderId || !this.cache || !this.cache.folderMap) {
      return null;
    }
    
    // 从缓存中获取文件夹信息
    if (this.cache.folderMap[folderId]) {
      return this.cache.folderMap[folderId];
    }
    
    // 如果缓存中没有，尝试通过Chrome API获取
    try {
      const [folder] = await chrome.bookmarks.get(folderId);
      if (folder) {
        return {
          id: folder.id,
          title: folder.title,
          parentId: folder.parentId
        };
      }
    } catch (error) {
      console.warn('❌ Error getting folder:', error);
    }
    
    return null;
  }
}

// 导出为全局变量以供其他脚本使用
window.BookmarkManager = BookmarkManager; 