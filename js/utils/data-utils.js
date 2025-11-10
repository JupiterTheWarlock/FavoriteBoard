// 数据处理工具函数

/**
 * 检查URL是否有效
 * @param {string} string - 要检查的字符串
 * @returns {boolean} 是否为有效URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * 获取文件夹及其子文件夹的ID
 * 用于从文件夹映射表中获取指定文件夹及其所有子文件夹的ID列表
 * 
 * @param {string} folderId - 文件夹ID
 * @param {Map} folderMap - 文件夹映射表（从StateManager获取）
 * @returns {Array} 文件夹ID数组，包含指定文件夹及其所有子文件夹的ID
 * 
 * @example
 * const folderMap = stateManager.getStateValue('data.folderMap');
 * const folderIds = getFolderAndSubfolderIds('123', folderMap);
 * // 返回: ['123', '124', '125', ...] (包含所有子文件夹)
 */
function getFolderAndSubfolderIds(folderId, folderMap) {
  if (!folderId || !folderMap) {
    return [folderId].filter(Boolean);
  }
  
  const ids = [folderId];
  
  function collectChildIds(node) {
    if (node && node.children && Array.isArray(node.children)) {
      node.children.forEach(child => {
        if (child && child.id) {
          ids.push(child.id);
          collectChildIds(child);
        }
      });
    }
  }
  
  const folder = folderMap.get(folderId);
  if (folder) {
    collectChildIds(folder);
  }
  
  return ids;
}

// 已删除未使用的函数: formatUrl, generateId, formatNumber

/**
 * 本地存储操作工具
 */
const Storage = {
    /**
     * 设置本地存储
     * @param {string} key - 键名
     * @param {*} value - 值
     * @returns {boolean} 是否设置成功
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    /**
     * 获取本地存储
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 存储的值或默认值
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    /**
     * 删除本地存储
     * @param {string} key - 键名
     * @returns {boolean} 是否删除成功
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    /**
     * 清空本地存储
     * @returns {boolean} 是否清空成功
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
}; 
window.Storage = Storage; 