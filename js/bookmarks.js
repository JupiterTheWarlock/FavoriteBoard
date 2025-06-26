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
      
      // 搜索标签
      if (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery))) return true;
      
      return false;
    });
  }
  
  // 根据标签筛选收藏夹
  filterByTags(tags, bookmarks = null) {
    if (!tags || tags.length === 0) return bookmarks || this.getAllBookmarks();
    
    const targetBookmarks = bookmarks || this.getAllBookmarks();
    
    return targetBookmarks.filter(bookmark => {
      if (!bookmark.tags || bookmark.tags.length === 0) return false;
      
      // 检查是否包含所有选中的标签
      return tags.every(tag => bookmark.tags.includes(tag));
    });
  }
  
  // 获取所有唯一标签
  getAllTags() {
    if (!this.cache) return [];
    
    const tagsSet = new Set();
    
    this.cache.flatBookmarks.forEach(bookmark => {
      if (bookmark.tags) {
        // 过滤掉不需要的标签
        const filteredTags = bookmark.tags.filter(tag => {
          // 过滤掉以常见域名后缀结尾的标签
          const commonSuffixes = ['.com', '.org', '.net', '.edu', '.gov', '.nl', '.cn', '.io'];
          return !commonSuffixes.some(suffix => tag.toLowerCase().endsWith(suffix));
        });
        filteredTags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  }
  
  // 获取文件夹内的标签
  getTagsInFolder(folderId) {
    const bookmarks = this.getBookmarksInFolder(folderId);
    const tagsSet = new Set();
    
    bookmarks.forEach(bookmark => {
      if (bookmark.tags) {
        // 过滤掉不需要的标签
        const filteredTags = bookmark.tags.filter(tag => {
          // 过滤掉以常见域名后缀结尾的标签
          const commonSuffixes = ['.com', '.org', '.net', '.edu', '.gov', '.nl', '.cn', '.io'];
          return !commonSuffixes.some(suffix => tag.toLowerCase().endsWith(suffix));
        });
        filteredTags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  }
  
  // 生成标签（基于URL域名）
  generateTags(url) {
    try {
      const domain = new URL(url).hostname;
      const parts = domain.split('.');
      
      // 生成标签数组
      const tags = [];
      
      // 如果域名有多个部分，提取有意义的部分作为标签
      if (parts.length >= 2) {
        // 跳过主域名，只取子域名或其他有意义的部分
        const mainDomain = parts.slice(-2).join('.'); // 获取主域名，如 "baidu.com"
        
        // 添加子域名作为标签（如果有的话）
        if (parts.length > 2) {
          const subdomains = parts.slice(0, -2);
          // 只添加不是www且长度大于1的子域名，并且不添加以数字开头的子域名
          tags.push(...subdomains.filter(part => 
            part !== 'www' && 
            part.length > 1 && 
            !/^\d/.test(part) &&
            !part.includes('.')  // 确保不包含点号
          ));
        }
        
        // 可以根据特定域名添加分类标签
        const categoryMap = {
          'github.com': ['开发', '代码托管'],
          'stackoverflow.com': ['开发', '问答'],
          'bilibili.com': ['视频', '娱乐'],
          'youtube.com': ['视频', '娱乐'],
          'zhihu.com': ['知识', '问答'],
          'baidu.com': ['搜索'],
          'google.com': ['搜索'],
          'weibo.com': ['社交'],
          'twitter.com': ['社交'],
          'facebook.com': ['社交'],
        };
        
        if (categoryMap[mainDomain]) {
          tags.push(...categoryMap[mainDomain]);
        }
      }
      
      // 过滤掉空字符串、重复项和域名后缀
      return [...new Set(tags.filter(tag => {
        if (!tag || tag.length === 0) return false;
        
        // 过滤掉以常见域名后缀结尾的标签
        const commonSuffixes = ['.com', '.org', '.net', '.edu', '.gov', '.nl', '.cn', '.io'];
        return !commonSuffixes.some(suffix => tag.toLowerCase().endsWith(suffix));
      }))];
    } catch (error) {
      console.warn('❌ Error generating tags for URL:', url, error);
      return [];
    }
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
        totalTags: 0,
        lastSync: null
      };
    }
    
    return {
      totalBookmarks: this.cache.totalBookmarks,
      totalFolders: this.cache.totalFolders,
      totalTags: this.getAllTags().length,
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