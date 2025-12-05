// FavoriteBoard Plugin - Background Service Worker
// 基于 Manifest V3 的后台脚本

console.log('🐱 FavoriteBoard Plugin background script loaded');

// 监听插件图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🐱 插件图标被点击，打开收藏夹面板...');
  
  try {
    // 检查是否已经有收藏夹标签页打开
    const tabs = await chrome.tabs.query({url: chrome.runtime.getURL('index.html')});
    
    if (tabs.length > 0) {
      // 如果已经有收藏夹标签页，则激活它
      await chrome.tabs.update(tabs[0].id, {active: true});
      await chrome.windows.update(tabs[0].windowId, {focused: true});
    } else {
      // 否则创建新的收藏夹标签页
      await chrome.tabs.create({
        url: chrome.runtime.getURL('index.html')
      });
    }
  } catch (error) {
    console.error('❌ 打开收藏夹面板失败:', error);
  }
});

// 扩展安装或更新时的处理
chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // 首次安装时的初始化
    initializeExtension();
  } else if (details.reason === 'update') {
    // 更新时的处理
    handleExtensionUpdate();
  }
});

// 初始化扩展
async function initializeExtension() {
  console.log('🚀 Initializing FavoriteBoard Plugin...');
  
  try {
    // 设置默认配置
    await chrome.storage.local.set({
      favoriteboardConfig: {
        initialized: true,
        version: '1.0.0',
        theme: 'light',
        showFolderIcons: true,
        cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
        lastSync: Date.now()
      }
    });
    
    // 初始化收藏夹缓存
    await initializeBookmarksCache();
    
    console.log('✅ Extension initialized successfully');
    
  } catch (error) {
    console.error('❌ Error initializing extension:', error);
  }
}

// 处理扩展更新
async function handleExtensionUpdate() {
  console.log('🔄 Handling extension update...');
  
  try {
    // 清理旧缓存
    await clearOldCache();
    
    // 重新初始化收藏夹缓存
    await initializeBookmarksCache();
    
    console.log('✅ Extension updated successfully');
  } catch (error) {
    console.error('❌ Error updating extension:', error);
  }
}

// 初始化收藏夹缓存
async function initializeBookmarksCache() {
  console.log('📚 Initializing bookmarks cache...');
  
  try {
    // 获取收藏夹树结构
    const bookmarkTree = await chrome.bookmarks.getTree();
    
    // 处理和缓存收藏夹数据
    const processedBookmarks = await processBookmarkTree(bookmarkTree);
    
    // 缓存到本地存储
    await chrome.storage.local.set({
      bookmarksCache: processedBookmarks,
      lastBookmarkSync: Date.now()
    });
    
    console.log('✅ Bookmarks cache initialized');
    console.log(`📊 Cached ${processedBookmarks.totalBookmarks} bookmarks in ${processedBookmarks.totalFolders} folders`);
    
  } catch (error) {
    console.error('❌ Error initializing bookmarks cache:', error);
  }
}

// 处理收藏夹树结构
async function processBookmarkTree(bookmarkTree) {
  const result = {
    tree: bookmarkTree,
    totalBookmarks: 0,
    totalFolders: 0,
    flatBookmarks: [],
    folderMap: {} // 改为普通对象，可以序列化
  };
  
  // 递归处理收藏夹节点
  function processNode(node, parentPath = '') {
    const currentPath = parentPath ? `${parentPath}/${node.title}` : node.title;
    
    if (node.children) {
      // 这是一个文件夹
      result.totalFolders++;
      result.folderMap[node.id] = {
        id: node.id,
        title: node.title,
        path: currentPath,
        parentId: node.parentId,
        dateAdded: node.dateAdded,
        bookmarkCount: 0
      };
      
      // 递归处理子节点
      node.children.forEach(child => processNode(child, currentPath));
      
      // 计算文件夹内的书签数量
      const bookmarkCount = countBookmarksInFolder(node);
      if (result.folderMap[node.id]) {
        result.folderMap[node.id].bookmarkCount = bookmarkCount;
      }
    } else if (node.url) {
      // 这是一个书签
      result.totalBookmarks++;
      const bookmark = {
        id: node.id,
        title: node.title,
        url: node.url,
        parentId: node.parentId,
        dateAdded: node.dateAdded,
        domain: extractDomain(node.url),
        path: currentPath
      };
      result.flatBookmarks.push(bookmark);
    }
  }
  
  // 处理根节点
  bookmarkTree.forEach(rootNode => {
    if (rootNode.children) {
      rootNode.children.forEach(child => processNode(child));
    }
  });
  
  return result;
}

// 计算文件夹内的书签数量
function countBookmarksInFolder(folderNode) {
  let count = 0;
  
  function countRecursive(node) {
    if (node.children) {
      node.children.forEach(child => countRecursive(child));
    } else if (node.url) {
      count++;
    }
  }
  
  countRecursive(folderNode);
  return count;
}

// 提取域名
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (error) {
    console.warn('⚠️ Error extracting domain from URL:', url);
    return 'unknown';
  }
}

// 清理旧缓存
async function clearOldCache() {
  console.log('🧹 Clearing old cache...');
  
  try {
    // 清理过期的favicon缓存
    const result = await chrome.storage.local.get();
    const keysToRemove = [];
    
    Object.keys(result).forEach(key => {
      if (key.startsWith('favicon_')) {
        keysToRemove.push(key);
      }
    });
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`🗑️ Removed ${keysToRemove.length} old favicon cache entries`);
    }
  } catch (error) {
    console.error('❌ Error clearing old cache:', error);
  }
}

// 监听收藏夹变更
chrome.bookmarks.onCreated.addListener(handleBookmarkCreated);
chrome.bookmarks.onRemoved.addListener(handleBookmarkRemoved);
chrome.bookmarks.onChanged.addListener(handleBookmarkChanged);
chrome.bookmarks.onMoved.addListener(handleBookmarkMoved);

// 监听新书签创建，通知当前活动tab弹出悬浮窗
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'show-folder-selector-float',
        bookmarkId: id,
        bookmark: bookmark
      });
    }
  });
});

// 处理收藏夹创建
async function handleBookmarkCreated(id, bookmark) {
  console.log('➕ Bookmark created:', bookmark.title);
  await refreshBookmarksCache();
  notifyTabsOfUpdate('bookmark-created', { id, bookmark });
}

// 处理收藏夹删除
async function handleBookmarkRemoved(id, removeInfo) {
  console.log('➖ Bookmark removed:', id);
  await refreshBookmarksCache();
  notifyTabsOfUpdate('bookmark-removed', { id, removeInfo });
}

// 处理收藏夹修改
async function handleBookmarkChanged(id, changeInfo) {
  console.log('✏️ Bookmark changed:', id, changeInfo);
  await refreshBookmarksCache();
  notifyTabsOfUpdate('bookmark-changed', { id, changeInfo });
}

// 处理收藏夹移动
async function handleBookmarkMoved(id, moveInfo) {
  console.log('📁 Bookmark moved:', id);
  await refreshBookmarksCache();
  notifyTabsOfUpdate('bookmark-moved', { id, moveInfo });
}

// 刷新收藏夹缓存
async function refreshBookmarksCache() {
  try {
    console.log('🔄 Refreshing bookmarks cache...');
    await initializeBookmarksCache();
  } catch (error) {
    console.error('❌ Error refreshing bookmarks cache:', error);
  }
}

// 通知所有标签页更新
function notifyTabsOfUpdate(action, data) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.startsWith('chrome://newtab/')) {
        chrome.tabs.sendMessage(tab.id, {
          action,
          data
        }).catch(() => {
          // 忽略无法发送消息的标签页
        });
      }
    });
  });
}

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message:', message.action);
  
  // 创建一个异步处理器
  const handleAsync = async () => {
    switch (message.action) {
      case 'getBookmarksCache':
        return await handleGetBookmarksCache();
        
      case 'getFavicon':
        return await handleGetFavicon(message.url);
        
      case 'refreshCache':
        return await handleRefreshCache();
        
      case 'deleteBookmark':
        return await handleDeleteBookmark(message.bookmarkId);
        
      case 'moveBookmark':
        return await handleMoveBookmark(message.bookmarkId, message.targetFolderId);
        
      case 'createFolder':
        return await handleCreateFolder(message.parentId, message.title);
        
      case 'renameFolder':
        return await handleRenameFolder(message.folderId, message.title);
        
      case 'deleteFolder':
        return await handleDeleteFolder(message.folderId);
        
      default:
        console.warn('⚠️ Unknown message action:', message.action);
        return { success: false, error: 'Unknown action' };
    }
  };
  
  // 执行异步处理器并发送响应
  handleAsync()
    .then(response => {
      sendResponse(response);
    })
    .catch(error => {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  // 返回true保持消息端口开放
  return true;
});

// 监听内容脚本请求打开主页面（与扩展按钮点击行为一致）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openMainPage') {
    (async () => {
      const hash = message.hash || '';
      const url = chrome.runtime.getURL('index.html') + (hash || '');
      const tabs = await chrome.tabs.query({url: chrome.runtime.getURL('index.html')});
      let found = false;
      for (const tab of tabs) {
        // 如果hash参数存在，且已有标签页hash不一致，则新开
        if (hash && !tab.url.endsWith(hash)) continue;
        await chrome.tabs.update(tab.id, {active: true});
        await chrome.windows.update(tab.windowId, {focused: true});
        found = true;
        break;
      }
      if (!found) {
        await chrome.tabs.create({ url });
      }
    })();
  }
});

// 获取收藏夹缓存
async function handleGetBookmarksCache() {
  try {
    const result = await chrome.storage.local.get(['bookmarksCache', 'lastBookmarkSync']);
    return {
      success: true,
      data: result.bookmarksCache,
      lastSync: result.lastBookmarkSync
    };
  } catch (error) {
    console.error('❌ Error getting bookmarks cache:', error);
    return { success: false, error: error.message };
  }
}

// 获取网站图标
async function handleGetFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    const cacheKey = `favicon_${domain}`;
    
    // 检查缓存
    const cached = await chrome.storage.local.get([cacheKey]);
    if (cached[cacheKey]) {
      return { success: true, favicon: cached[cacheKey] };
    }
    
    // 首先尝试使用标准的 domain/favicon.ico API
    const domainFaviconUrl = `https://${domain}/favicon.ico`;
    
    try {
      const response = await fetch(domainFaviconUrl, {
        method: 'HEAD', // 只检查头部，不下载内容
        timeout: 5000   // 5秒超时
      });
      
      if (response.ok && response.headers.get('content-type')?.includes('image')) {
        await chrome.storage.local.set({ [cacheKey]: domainFaviconUrl });
        return { success: true, favicon: domainFaviconUrl };
      }
    } catch (e) {
      console.warn('⚠️ 标准favicon路径不可用:', e.message);
    }
    
    // 备选方案1：尝试使用扩展内部的 favicon API
    const extensionFaviconUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
    
    try {
      console.log('🔍 尝试扩展内部favicon API');
      const response = await fetch(extensionFaviconUrl);
      if (response.ok) {
        await chrome.storage.local.set({ [cacheKey]: extensionFaviconUrl });
        return { success: true, favicon: extensionFaviconUrl };
      }
    } catch (e) {
      console.warn('⚠️ 扩展内部favicon API不可用:', e.message);
    }
    
    // 备选方案2：使用 Google favicon 服务
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    try {
      await chrome.storage.local.set({ [cacheKey]: googleFaviconUrl });
      return { success: true, favicon: googleFaviconUrl };
    } catch (error) {
      console.error('❌ Google favicon服务失败:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="4" fill="#94a3b8"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🔗</text>
          </svg>
        `)
      };
    }
  } catch (error) {
    console.error('❌ handleGetFavicon执行错误:', error);
    return { 
      success: false, 
      error: error.message,
      fallback: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="4" fill="#94a3b8"/>
          <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🔗</text>
        </svg>
      `)
    };
  }
}

// 刷新缓存
async function handleRefreshCache() {
  try {
    await refreshBookmarksCache();
    return { success: true };
  } catch (error) {
    console.error('❌ Error refreshing cache:', error);
    return { success: false, error: error.message };
  }
}

// 删除收藏夹
async function handleDeleteBookmark(bookmarkId) {
  try {
    console.log('🗑️ Deleting bookmark:', bookmarkId);
    
    if (!bookmarkId) {
      throw new Error('Bookmark ID is required');
    }
    
    // 先检查收藏夹是否存在
    try {
      await chrome.bookmarks.get(bookmarkId);
    } catch (getError) {
      throw new Error('Bookmark not found or already deleted');
    }
    
    // 调用Chrome收藏夹API删除
    await chrome.bookmarks.remove(bookmarkId);
    
    console.log('✅ Bookmark deleted successfully:', bookmarkId);
    return { success: true, bookmarkId: bookmarkId };
    
    // 刷新缓存将由事件监听器自动处理
  } catch (error) {
    console.error('❌ Error deleting bookmark:', error);
    return { 
      success: false, 
      error: error.message,
      bookmarkId: bookmarkId
    };
  }
}

// 处理移动收藏夹
async function handleMoveBookmark(bookmarkId, targetFolderId) {
  try {
    console.log('📁 Moving bookmark:', bookmarkId, 'to folder:', targetFolderId);
    
    if (!bookmarkId || !targetFolderId) {
      throw new Error('Bookmark ID and target folder ID are required');
    }
    
    // 先检查收藏夹是否存在
    try {
      await chrome.bookmarks.get(bookmarkId);
    } catch (getError) {
      throw new Error('Bookmark not found or already deleted');
    }
    
    // 调用Chrome收藏夹API移动
    await chrome.bookmarks.move(bookmarkId, { parentId: targetFolderId });
    
    console.log('✅ Bookmark moved successfully:', bookmarkId);
    return { success: true, bookmarkId: bookmarkId };
    
    // 刷新缓存将由事件监听器自动处理
  } catch (error) {
    console.error('❌ Error moving bookmark:', error);
    return { 
      success: false, 
      error: error.message,
      bookmarkId: bookmarkId
    };
  }
}

// 处理创建文件夹
async function handleCreateFolder(parentId, title) {
  try {
    console.log('📁 Creating folder:', title, 'in parent:', parentId);
    
    if (!parentId || !title) {
      throw new Error('Parent ID and folder title are required');
    }
    
    // 验证父文件夹是否存在
    try {
      const [parentFolder] = await chrome.bookmarks.get(parentId);
      // 文件夹没有url属性，书签有url属性
      if (parentFolder.url) {
        throw new Error('Parent is not a folder (it is a bookmark)');
      }
    } catch (getError) {
      if (getError.message.includes('Parent is not a folder')) {
        throw getError;
      }
      throw new Error('Parent folder not found');
    }
    
    // 调用Chrome书签API创建文件夹
    const folder = await chrome.bookmarks.create({
      parentId: parentId,
      title: title.trim()
    });
    
    console.log('✅ Folder created successfully:', folder);
    return { success: true, folder: folder };
    
    // 刷新缓存将由事件监听器自动处理
  } catch (error) {
    console.error('❌ Error creating folder:', error);
    return { 
      success: false, 
      error: error.message,
      parentId: parentId,
      title: title
    };
  }
}

// 处理重命名文件夹
async function handleRenameFolder(folderId, title) {
  try {
    console.log('✏️ Renaming folder:', folderId, 'to:', title);
    
    if (!folderId || !title) {
      throw new Error('Folder ID and new title are required');
    }
    
    // 验证文件夹是否存在
    try {
      const [folder] = await chrome.bookmarks.get(folderId);
      // 文件夹没有url属性，书签有url属性
      if (folder.url) {
        throw new Error('Target is not a folder (it is a bookmark)');
      }
    } catch (getError) {
      if (getError.message.includes('Target is not a folder')) {
        throw getError;
      }
      throw new Error('Folder not found');
    }
    
    // 调用Chrome书签API更新文件夹
    const updatedFolder = await chrome.bookmarks.update(folderId, {
      title: title.trim()
    });
    
    console.log('✅ Folder renamed successfully:', updatedFolder);
    return { success: true, folder: updatedFolder };
    
    // 刷新缓存将由事件监听器自动处理
  } catch (error) {
    console.error('❌ Error renaming folder:', error);
    return { 
      success: false, 
      error: error.message,
      folderId: folderId,
      title: title
    };
  }
}

// 处理删除文件夹
async function handleDeleteFolder(folderId) {
  try {
    console.log('🗑️ Deleting folder:', folderId);
    
    if (!folderId) {
      throw new Error('Folder ID is required');
    }
    
    // 检查是否为浏览器内置文件夹（不允许删除）
    if (folderId === '1' || folderId === '2') {
      throw new Error('不能删除浏览器内置的"收藏栏"或"其他收藏夹"');
    }
    
    // 验证文件夹是否存在
    try {
      const [folder] = await chrome.bookmarks.get(folderId);
      // 文件夹没有url属性，书签有url属性
      if (folder.url) {
        throw new Error('Target is not a folder (it is a bookmark)');
      }
    } catch (getError) {
      if (getError.message.includes('Target is not a folder')) {
        throw getError;
      }
      throw new Error('Folder not found');
    }
    
    // 调用Chrome书签API删除文件夹
    // 注意：removeTree会递归删除文件夹及其所有内容
    await chrome.bookmarks.removeTree(folderId);
    
    console.log('✅ Folder deleted successfully:', folderId);
    return { success: true, folderId: folderId };
    
    // 刷新缓存将由事件监听器自动处理
  } catch (error) {
    console.error('❌ Error deleting folder:', error);
    return { 
      success: false, 
      error: error.message,
      folderId: folderId
    };
  }
}

console.log('✅ FavoriteBoard Plugin background script ready'); 