// FavoriteBoard Plugin - Background Service Worker
// 基于 Manifest V3 的后台脚本

console.log('🐱 FavoriteBoard Plugin background script loaded');

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
        autoGenerateTags: true,
        cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
        lastSync: Date.now()
      }
    });
    
    // 初始化收藏夹缓存
    await initializeBookmarksCache();
    
    console.log('✅ Extension initialized successfully');
    
    // 打开新标签页展示欢迎界面
    chrome.tabs.create({ url: 'chrome://newtab/' });
    
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
        tags: generateAutoTags(node.url),
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

// 从URL生成自动标签
function generateAutoTags(url) {
  try {
    const domain = extractDomain(url);
    const tags = [domain];
    
    // 根据常见域名添加分类标签
    const categoryMap = {
      'github.com': ['开发', '代码', 'Git'],
      'stackoverflow.com': ['开发', '问答', '编程'],
      'youtube.com': ['视频', '娱乐'],
      'bilibili.com': ['视频', '娱乐', '学习'],
      'zhihu.com': ['知识', '问答', '社交'],
      'baidu.com': ['搜索', '工具'],
      'google.com': ['搜索', '工具'],
      'figma.com': ['设计', '工具'],
      'notion.so': ['笔记', '工具', '协作']
    };
    
    if (categoryMap[domain]) {
      tags.push(...categoryMap[domain]);
    }
    
    // 根据URL路径添加标签
    if (url.includes('/docs')) tags.push('文档');
    if (url.includes('/blog')) tags.push('博客');
    if (url.includes('/tutorial')) tags.push('教程');
    if (url.includes('/api')) tags.push('API');
    
    return [...new Set(tags)]; // 去重
  } catch (error) {
    console.warn('⚠️ Error generating tags for URL:', url, error);
    return [];
  }
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
  
  switch (message.action) {
    case 'getBookmarksCache':
      handleGetBookmarksCache(sendResponse);
      return true;
      
    case 'getFavicon':
      handleGetFavicon(message.url, sendResponse);
      return true;
      
    case 'refreshCache':
      handleRefreshCache(sendResponse);
      return true;
      
    default:
      console.warn('⚠️ Unknown message action:', message.action);
  }
});

// 获取收藏夹缓存
async function handleGetBookmarksCache(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['bookmarksCache', 'lastBookmarkSync']);
    sendResponse({
      success: true,
      data: result.bookmarksCache,
      lastSync: result.lastBookmarkSync
    });
  } catch (error) {
    console.error('❌ Error getting bookmarks cache:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 获取网站图标
async function handleGetFavicon(url, sendResponse) {
  try {
    const domain = extractDomain(url);
    const cacheKey = `favicon_${domain}`;
    
    // 先检查缓存
    const cached = await chrome.storage.local.get(cacheKey);
    if (cached[cacheKey]) {
      sendResponse({ success: true, favicon: cached[cacheKey] });
      return;
    }
    
    // 首先尝试使用扩展内部的 favicon API
    const extensionFaviconUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
    
    // 测试扩展 favicon 是否可用
    try {
      const response = await fetch(extensionFaviconUrl);
      if (response.ok) {
        // 缓存结果
        await chrome.storage.local.set({ [cacheKey]: extensionFaviconUrl });
        sendResponse({ success: true, favicon: extensionFaviconUrl });
        return;
      }
    } catch (error) {
      console.warn('⚠️ Extension favicon not available, falling back to Google service');
    }
    
    // 后备方案：使用 Google favicon 服务
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    // 缓存结果
    await chrome.storage.local.set({ [cacheKey]: googleFaviconUrl });
    
    sendResponse({ success: true, favicon: googleFaviconUrl });
  } catch (error) {
    console.error('❌ Error getting favicon:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 刷新缓存
async function handleRefreshCache(sendResponse) {
  try {
    await refreshBookmarksCache();
    sendResponse({ success: true });
  } catch (error) {
    console.error('❌ Error refreshing cache:', error);
    sendResponse({ success: false, error: error.message });
  }
}

console.log('✅ FavoriteBoard Plugin background script ready'); 