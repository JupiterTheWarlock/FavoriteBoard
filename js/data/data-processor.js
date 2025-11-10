 // FavoriteBoard Plugin - 数据处理器
// 负责原始数据的转换和处理

/**
 * 数据处理器 - 专门处理收藏夹数据的转换和分析
 */
class DataProcessor {
  
    /**
     * 从收藏夹数据生成文件夹树
     * @param {Object} bookmarkCache - 收藏夹缓存数据
     * @returns {Array} 处理后的文件夹树
     */
    static generateFolderTree(bookmarkCache) {
      const rawTree = bookmarkCache?.tree || [];
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
              bookmarkCount: bookmarkCache?.totalBookmarks || 0,
              isSpecial: true,
              isExpanded: true,
              children: []
            });
          }
          
          // 处理每个根节点的子节点
          rootNode.children.forEach(child => {
            if (child.children !== undefined) { // 这是一个文件夹
              const processedFolder = DataProcessor.processFolderNode(child, 0, bookmarkCache);
              if (processedFolder) {
                folderTree.push(processedFolder);
              }
            }
          });
        }
      });
      
      return folderTree;
    }
    
    /**
     * 处理文件夹节点
     * @param {Object} node - 原始文件夹节点
     * @param {number} depth - 层级深度
     * @param {Object} bookmarkCache - 收藏夹缓存数据
     * @returns {Object} 处理后的文件夹节点
     */
    static processFolderNode(node, depth, bookmarkCache) {
      const folderInfo = bookmarkCache?.folderMap[node.id] || {};
      
      const folderNode = {
        id: node.id,
        title: node.title,
        parentId: node.parentId,
        icon: DataProcessor.getFolderIcon(node.title, depth),
        bookmarkCount: folderInfo.bookmarkCount || 0,
        depth: depth,
        isExpanded: depth < 2, // 前两层默认展开
        children: []
      };
      
      // 递归处理子文件夹
      if (node.children) {
        node.children.forEach(child => {
          if (child.children !== undefined) { // 这是一个文件夹
            const childFolder = DataProcessor.processFolderNode(child, depth + 1, bookmarkCache);
            if (childFolder) {
              folderNode.children.push(childFolder);
            }
          }
        });
      }
      
      return folderNode;
    }
    
    /**
     * 生成所有链接数据（链接卡片）
     * @param {Object} bookmarkCache - 收藏夹缓存数据
     * @returns {Array} 处理后的链接卡片数组
     */
    static generateAllLinks(bookmarkCache) {
      const allBookmarks = bookmarkCache?.flatBookmarks || [];
      
      return allBookmarks.map(bookmark => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        folderId: bookmark.parentId,
        iconUrl: bookmark.iconUrl || DataProcessor.generateFaviconUrl(bookmark.url),
        dateAdded: bookmark.dateAdded,
        dateGrouped: bookmark.dateGrouped,
        domain: bookmark.domain || DataProcessor.extractDomain(bookmark.url)
      }));
    }
    
    /**
     * 构建文件夹映射表
     * @param {Array} folderTree - 文件夹树
     * @param {Object} originalFolderMap - 原始的文件夹映射表（从bookmarkCache来的）
     * @returns {Map} 文件夹映射表
     */
    static buildFolderMap(folderTree, originalFolderMap = {}) {
      const map = new Map();
      
      // 首先添加原始folderMap中的数据
      if (originalFolderMap && typeof originalFolderMap === 'object') {
        Object.keys(originalFolderMap).forEach(folderId => {
          const folderData = originalFolderMap[folderId];
          if (folderData) {
            const mappedData = {
              id: folderId,
              title: folderData.title || '未知文件夹',
              parentId: folderData.parentId,
              bookmarkCount: folderData.bookmarkCount || 0,
              path: folderData.path,
              dateAdded: folderData.dateAdded,
              children: [],
              isExpanded: false,
              icon: DataProcessor.getFolderIcon(folderData.title || '', 0)
            };
            
            // 存储字符串版本的key
            map.set(folderId, mappedData);
            
            // 如果folderId是数字字符串，也存储数字版本的key
            if (!isNaN(folderId)) {
              map.set(parseInt(folderId), mappedData);
            }
            
            // 如果folderId是数字，也存储字符串版本的key
            if (typeof folderId === 'number') {
              map.set(folderId.toString(), mappedData);
            }
          }
        });
      }
      
      // 然后遍历folderTree，更新和补充数据
      const traverseTree = (nodes) => {
        nodes.forEach(node => {
          if (node && node.id) {
            // 如果Map中已存在该文件夹，则更新；否则添加新的
            const existingData = map.get(node.id);
            const updatedData = existingData ? 
              { ...existingData, ...node } : 
              { ...node };
            
            // 存储字符串版本的key
            map.set(node.id, updatedData);
            
            // 如果node.id是数字字符串，也存储数字版本的key
            if (!isNaN(node.id)) {
              map.set(parseInt(node.id), updatedData);
            }
            
            // 如果node.id是数字，也存储字符串版本的key
            if (typeof node.id === 'number') {
              map.set(node.id.toString(), updatedData);
            }
            
            if (node.children && node.children.length > 0) {
              traverseTree(node.children);
            }
          }
        });
      };
      
      traverseTree(folderTree);
      
      console.log(`🗂️ 构建文件夹映射表完成: ${map.size} 个文件夹`);
      
      return map;
    }
    
    /**
     * 获取文件夹及其子文件夹的ID
     * @deprecated 此方法已移至 js/utils/data-utils.js，请使用工具函数 getFolderAndSubfolderIds()
     * @param {string} folderId - 文件夹ID
     * @param {Map} folderMap - 文件夹映射表
     * @returns {Array} 文件夹ID数组
     */
    static getFolderAndSubfolderIds(folderId, folderMap) {
      // 为了向后兼容，保留此方法，但建议使用工具函数
      console.warn('⚠️ DataProcessor.getFolderAndSubfolderIds() 已废弃，请使用工具函数 getFolderAndSubfolderIds()');
      const ids = [folderId];
      
      function collectChildIds(node) {
        if (node.children) {
          node.children.forEach(child => {
            ids.push(child.id);
            collectChildIds(child);
          });
        }
      }
      
      const folder = folderMap.get(folderId);
      if (folder) {
        collectChildIds(folder);
      }
      
      return ids;
    }
    
    /**
     * 获取文件夹图标
     * @param {string} folderTitle - 文件夹标题
     * @param {number} depth - 层级深度
     * @returns {string} 图标emoji
     */
    static getFolderIcon(folderTitle, depth) {
      if (!folderTitle) return '📁';
      
      const titleLower = folderTitle.toLowerCase();
      const iconMap = {
        '工作': '💼', 'work': '💼',
        '学习': '📚', 'study': '📚', 'education': '📚',
        '娱乐': '🎮', 'entertainment': '🎮', 'games': '🎮',
        '社交': '💬', 'social': '💬', 'communication': '💬',
        '购物': '🛒', 'shopping': '🛒',
        '新闻': '📰', 'news': '📰',
        '技术': '⚙️', 'tech': '⚙️', 'technology': '⚙️',
        '设计': '🎨', 'design': '🎨'
      };
      
      for (const [keyword, icon] of Object.entries(iconMap)) {
        if (titleLower.includes(keyword)) {
          return icon;
        }
      }
      
      return '📁';
    }
    
    /**
     * 生成Favicon URL
     * @param {string} url - 网站URL
     * @returns {string} Favicon URL
     */
    static generateFaviconUrl(url) {
      try {
        const domain = new URL(url).hostname;
        return `https://${domain}/favicon.ico`;
      } catch (e) {
        return '';
      }
    }
    
    /**
     * 从URL提取域名
     * @param {string} url - 网站URL
     * @returns {string} 域名（去除www前缀）
     */
    static extractDomain(url) {
      try {
        const hostname = new URL(url).hostname;
        return hostname.replace(/^www\./i, '');
      } catch (e) {
        return 'unknown';
      }
    }
  }