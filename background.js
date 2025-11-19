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

  // 处理打开主页面的特殊请求
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
    return true; // 保持消息端口开放
  }

  // 创建一个异步处理器处理其他消息
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

      case 'importBookmarks':
        return await handleImportBookmarks(message.data);

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

// 处理导入收藏夹数据（覆盖模式）
async function handleImportBookmarks(importData) {
  try {
    console.log('🔄 开始导入收藏夹数据（覆盖模式）...');

    if (!importData) {
      throw new Error('导入数据不能为空');
    }

    const { folderTree = [], allLinks = [] } = importData;

    if (!Array.isArray(folderTree) || !Array.isArray(allLinks)) {
      throw new Error('数据格式错误：folderTree和allLinks必须是数组');
    }

    let totalCreated = 0;
    let totalDeleted = 0;
    let errors = [];

    console.log(`📊 准备导入 ${folderTree.length} 个文件夹和 ${allLinks.length} 个书签`);

    // 获取现有的根文件夹（书签栏和其他书签）
    const [bookmarkBar] = await chrome.bookmarks.get('1'); // 书签栏
    const [otherBookmarks] = await chrome.bookmarks.get('2'); // 其他书签

    // 第一阶段：清空现有的收藏夹（除了根文件夹）
    console.log('🗑️ 清空现有收藏夹...');
    const beforeCount = await countAllBookmarks();
    await clearAllBookmarksExceptRoot();
    totalDeleted = beforeCount;
    console.log(`✅ 清空完成，删除了 ${totalDeleted} 个书签`);

    // 第二阶段：创建新的文件夹结构（基于路径匹配）
    const folderPathMap = new Map(); // 路径 -> 文件夹ID的映射
    console.log('🔍 DEBUG: 原始folderTree数据:', JSON.stringify(folderTree, null, 2));
    console.log('🔍 DEBUG: 开始创建文件夹结构...');
    await createFolderStructureBasedOnPaths(folderTree, folderPathMap, bookmarkBar.id, otherBookmarks.id);
    console.log('🔍 DEBUG: 文件夹映射表创建完成:', Array.from(folderPathMap.entries()));

    // 第三阶段：创建书签（基于路径匹配，带去重检查）
    for (const bookmark of allLinks) {
      try {
        const folderPath = bookmark.path || '其他';
        const targetFolderId = folderPathMap.get(folderPath) || otherBookmarks.id;
        console.log(`🔍 DEBUG: 书签 ${bookmark.title} - 路径: ${folderPath} - 目标文件夹ID: ${targetFolderId}`);

        // 检查书签是否已存在
        const existingBookmark = await findBookmarkByUrlAndFolder(targetFolderId, bookmark.url);
        if (existingBookmark) {
          console.log(`⚠️ 书签已存在，跳过: ${bookmark.title} -> ${bookmark.url}`);
          continue;
        }

        const newBookmark = await chrome.bookmarks.create({
          parentId: targetFolderId,
          title: bookmark.title || '未命名书签',
          url: bookmark.url
        });

        totalCreated++;
        console.log(`✅ 创建书签: ${bookmark.title} -> 路径: ${folderPath}`);
      } catch (error) {
        console.error(`❌ 创建书签失败: ${bookmark.title}`, error);
        errors.push(`书签"${bookmark.title}"创建失败: ${error.message}`);
      }
    }

    // 刷新缓存
    await refreshBookmarksCache();

    const result = {
      success: true,
      summary: {
        totalFolders: folderTree.length,
        totalBookmarks: allLinks.length,
        createdBookmarks: totalCreated,
        deletedBookmarks: totalDeleted,
        errors: errors.length
      },
      errors: errors
    };

    console.log(`✅ 导入完成！删除 ${totalDeleted} 个，创建 ${totalCreated} 个书签，${errors.length} 个错误`);

    return result;

  } catch (error) {
    console.error('❌ 导入收藏夹数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 清空所有收藏夹（除了根文件夹）
async function clearAllBookmarksExceptRoot() {
  try {
    // 获取完整的书签树
    const tree = await chrome.bookmarks.getTree();

    // 找到书签栏（ID: 1）和其他书签（ID: 2）
    const bookmarkBar = tree[0].children[0]; // 书签栏
    const otherBookmarks = tree[0].children[1]; // 其他书签

    console.log('🗑️ 开始清空收藏夹...');
    console.log(`📂 书签栏有 ${bookmarkBar.children?.length || 0} 个子项`);
    console.log(`📂 其他书签有 ${otherBookmarks.children?.length || 0} 个子项`);

    // 递归删除书签栏的所有子项
    if (bookmarkBar.children && bookmarkBar.children.length > 0) {
      for (const child of bookmarkBar.children) {
        await chrome.bookmarks.removeTree(child.id);
        console.log(`  - 删除书签栏子项: ${child.title || child.id}`);
      }
    }

    // 递归删除其他书签的所有子项
    if (otherBookmarks.children && otherBookmarks.children.length > 0) {
      for (const child of otherBookmarks.children) {
        await chrome.bookmarks.removeTree(child.id);
        console.log(`  - 删除其他书签子项: ${child.title || child.id}`);
      }
    }

    console.log('✅ 已清空所有收藏夹');
  } catch (error) {
    console.error('❌ 清空收藏夹失败:', error);
    throw error;
  }
}

// 统计所有书签数量
async function countAllBookmarks() {
  try {
    const tree = await chrome.bookmarks.getTree();
    let count = 0;

    function countBookmarks(node) {
      if (node.url) {
        count++;
      }
      if (node.children) {
        node.children.forEach(countBookmarks);
      }
    }

    tree.forEach(countBookmarks);
    return count;
  } catch (error) {
    console.error('❌ 统计书签数量失败:', error);
    return 0;
  }
}

// 基于路径创建文件夹结构（支持完整嵌套结构）
async function createFolderStructureBasedOnPaths(folderTree, folderPathMap, bookmarkBarId, otherBookmarksId) {
  // 递归处理所有文件夹，确保嵌套结构完整创建
  for (const folder of folderTree) {
    try {
      // 确定目标根文件夹
      let targetRootId = otherBookmarksId; // 默认放到其他书签
      const folderPath = folder.path || folder.title;

      // 特殊处理一些常见根文件夹
      if (folderPath.includes('书签栏') || folderPath.includes('收藏夹栏')) {
        targetRootId = bookmarkBarId;
      }

      console.log(`🔍 DEBUG: 处理文件夹 "${folder.title}"，路径: "${folderPath}"，根目标: ${targetRootId}`);

      // 创建当前文件夹及其所有子文件夹
      await createFolderAndChildren(folder, targetRootId, folderPathMap);

    } catch (error) {
      console.error(`❌ 创建文件夹失败: ${folder.title}`, error);
    }
  }
}

// 递归创建文件夹及其子文件夹
async function createFolderAndChildren(folder, parentId, folderPathMap) {
  console.log(`🔍 DEBUG: 创建文件夹 "${folder.title}" 在父文件夹 ${parentId} 下`);

  // 创建当前文件夹
  const newFolder = await createFolderWithPath(folder, parentId, folderPathMap);

  if (folder.children && folder.children.length > 0) {
    console.log(`🔍 DEBUG: 开始处理 ${folder.title} 的 ${folder.children.length} 个子文件夹`);

    // 递归创建子文件夹
    for (const childFolder of folder.children) {
      await createFolderAndChildren(childFolder, newFolder.id, folderPathMap);
    }
  }
}

// 基于路径创建单个文件夹（修复版本）
async function createFolderWithPath(folder, parentId, folderPathMap) {
  const fullPath = folder.path;
  if (!fullPath) {
    console.log('⚠️ DEBUG: 文件夹没有路径信息，跳过:', folder);
    return { id: parentId };
  }

  const pathParts = fullPath.split('/').filter(part => part.trim());
  let currentParentId = parentId;

  console.log(`🔍 DEBUG: 开始创建文件夹路径: "${fullPath}", 父级ID: ${parentId}`);
  console.log(`🔍 DEBUG: 路径分割结果:`, pathParts);

  // 处理路径的第一个部分（根文件夹ID）
  if (pathParts.length > 0) {
    const rootId = pathParts[0];
    let actualRootId;

    // 将数字ID映射到实际的根文件夹ID
    if (rootId === '1') {
      actualRootId = '1'; // 书签栏
      console.log(`🔍 DEBUG: 路径以 "1" 开头，映射到书签栏 (ID: 1)`);
    } else if (rootId === '2') {
      actualRootId = '2'; // 其他书签
      console.log(`🔍 DEBUG: 路径以 "2" 开头，映射到其他书签 (ID: 2)`);
    } else {
      console.warn(`⚠️ DEBUG: 未知的根文件夹ID: ${rootId}，默认使用其他书签`);
      actualRootId = '2';
    }

    currentParentId = actualRootId;

    // 如果只有一个路径部分（就是根文件夹），直接返回
    if (pathParts.length === 1) {
      console.log(`🔍 DEBUG: 路径只有根文件夹，返回ID: ${currentParentId}`);
      return { id: currentParentId };
    }

    // 从第二个部分开始处理子文件夹
    const subPathParts = pathParts.slice(1);

    // 创建子文件夹路径
    for (let i = 0; i < subPathParts.length; i++) {
      const pathPart = subPathParts[i];
      const currentPath = [rootId, ...subPathParts.slice(0, i + 1)].join('/');

      console.log(`🔍 DEBUG: 处理子路径部分 ${i+1}/${subPathParts.length}: "${pathPart}" -> 当前完整路径: "${currentPath}"`);

      // 检查是否已经创建了这个路径的文件夹
      if (folderPathMap.has(currentPath)) {
        currentParentId = folderPathMap.get(currentPath);
        console.log(`  ✅ 路径 "${currentPath}" 已在映射表中，使用ID: ${currentParentId}`);
        continue;
      }

      // 获取当前文件夹的标题
      let folderTitle = pathPart;
      if (i === subPathParts.length - 1) {
        // 最后一个部分使用原始文件夹标题
        folderTitle = folder.title || pathPart;
        console.log(`🔍 DEBUG: 最后一个路径部分，使用标题: "${folderTitle}"`);
      }

      console.log(`🔍 DEBUG: 检查父文件夹 ${currentParentId} 下是否存在同名文件夹 "${folderTitle}"`);

      // 检查当前父文件夹下是否已存在同名文件夹
      const existingFolder = await findFolderByName(currentParentId, folderTitle);
      if (existingFolder) {
        folderPathMap.set(currentPath, existingFolder.id);
        currentParentId = existingFolder.id;
        console.log(`  ✅ 找到已存在的同名文件夹 "${folderTitle}"，ID: ${existingFolder.id}`);
        continue;
      }

      console.log(`🔍 DEBUG: 创建新文件夹 "${folderTitle}" 在父文件夹 ${currentParentId} 下`);

      // 创建新文件夹
      const newFolder = await chrome.bookmarks.create({
        parentId: currentParentId,
        title: folderTitle
      });

      folderPathMap.set(currentPath, newFolder.id);
      currentParentId = newFolder.id;
      console.log(`  ✅ 成功创建新文件夹 "${folderTitle}"，ID: ${newFolder.id}`);
    }
  }

  console.log(`🔍 DEBUG: 文件夹路径 "${fullPath}" 处理完成，最终ID: ${currentParentId}`);
  return { id: currentParentId };
}

// 根据名称查找文件夹
async function findFolderByName(parentId, folderName) {
  try {
    const children = await chrome.bookmarks.getChildren(parentId);
    return children.find(child =>
      !child.url && child.title === folderName
    );
  } catch (error) {
    console.error('❌ 查找文件夹失败:', error);
    return null;
  }
}

// 根据URL和文件夹查找书签（去重检查）
async function findBookmarkByUrlAndFolder(folderId, url) {
  try {
    const children = await chrome.bookmarks.getChildren(folderId);
    return children.find(child =>
      child.url === url
    );
  } catch (error) {
    console.error('❌ 查找书签失败:', error);
    return null;
  }
}

// 递归创建文件夹结构
async function createFolderWithImport(folder, parentId, folderIdMap) {
  try {
    // 如果没有父文件夹映射，直接使用提供的parentId
    let actualParentId = parentId;

    // 如果有parentFolderId且存在映射，使用映射的ID
    if (folder.parentFolderId && folderIdMap.has(folder.parentFolderId)) {
      actualParentId = folderIdMap.get(folder.parentFolderId);
    }

    const newFolder = await chrome.bookmarks.create({
      parentId: actualParentId,
      title: folder.title || '未命名文件夹'
    });

    // 递归创建子文件夹
    if (folder.children && folder.children.length > 0) {
      for (const childFolder of folder.children) {
        try {
          await createFolderWithImport(childFolder, newFolder.id, folderIdMap);
        } catch (error) {
          console.error(`❌ 创建子文件夹失败: ${childFolder.title}`, error);
          // 不抛出错误，继续创建其他子文件夹
        }
      }
    }

    return newFolder;

  } catch (error) {
    console.error(`❌ createFolderWithImport 失败:`, error);
    throw error;
  }
}

// 创建书签
async function createBookmarkWithImport(bookmark, folderIdMap) {
  try {
    // 确定目标文件夹ID
    let targetFolderId = '2'; // 默认放在"其他书签"

    if (bookmark.folderId && folderIdMap.has(bookmark.folderId)) {
      targetFolderId = folderIdMap.get(bookmark.folderId);
    } else if (bookmark.parentId && folderIdMap.has(bookmark.parentId)) {
      targetFolderId = folderIdMap.get(bookmark.parentId);
    }

    const newBookmark = await chrome.bookmarks.create({
      parentId: targetFolderId,
      title: bookmark.title || '未命名书签',
      url: bookmark.url
    });

    return newBookmark;

  } catch (error) {
    console.error(`❌ createBookmarkWithImport 失败:`, error);
    throw error;
  }
}

console.log('✅ FavoriteBoard Plugin background script ready'); 