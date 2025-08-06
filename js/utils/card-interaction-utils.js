/**
 * 卡片交互工具函数 - 纯功能函数集合
 * 提供卡片交互相关的工具函数，不包含UI逻辑
 * UI逻辑已迁移到 ui/card-context-menu.js
 */

/**
 * 卡片交互工具类 - 纯功能函数
 */
class CardInteractionUtils {
  /**
   * 计算菜单位置
   * @param {Event} event - 鼠标事件
   * @param {HTMLElement} menu - 菜单元素
   * @param {Object} options - 配置选项
   * @returns {Object} 位置坐标 {left, top}
   */
  static calculateMenuPosition(event, menu, options = {}) {
    // 使用ui-utils中的calculateSmartMenuPosition函数
    if (window.calculateSmartMenuPosition) {
      return window.calculateSmartMenuPosition(event, menu, {
        margin: 10,
        preferRight: true,
        preferBottom: true,
        ...options
      });
    }
    
    // 备用实现
    return {
      left: event.clientX,
      top: event.clientY
    };
  }
  
  /**
   * 复制链接到剪贴板
   * @param {string} url - 链接URL
   * @returns {Promise<boolean>} 是否复制成功
   */
  static async copyLinkToClipboard(url) {
    try {
      // 使用dom-utils中的copyToClipboard函数
      if (window.copyToClipboard) {
        return await window.copyToClipboard(url);
      } else {
        // 备用实现
        await navigator.clipboard.writeText(url);
        return true;
      }
    } catch (error) {
      console.error('❌ 复制链接失败:', error);
      return false;
    }
  }
  
  /**
   * 验证URL有效性
   * @param {string} url - URL字符串
   * @returns {boolean} 是否有效
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 获取安全的图标URL
   * @param {string} iconUrl - 图标URL
   * @param {string} fallbackUrl - 备用URL
   * @returns {string} 安全的图标URL
   */
  static getSafeIconUrl(iconUrl, fallbackUrl) {
    if (iconUrl && CardInteractionUtils.isValidUrl(iconUrl)) {
      return iconUrl;
    }
    return fallbackUrl || 'default-icon.png';
  }
  
  /**
   * 验证图标URL有效性
   * @param {string} url - 图标URL
   * @returns {boolean} 是否有效
   */
  static isValidIconUrl(url) {
    // 使用tab-utils中的isValidIconUrl函数
    if (window.isValidIconUrl) {
      return window.isValidIconUrl(url);
    }
    
    // 备用实现
    if (!url) return false;
    
    try {
      if (url.startsWith('data:')) return true;
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  /**
   * 获取默认图标
   * @param {string} url - 网站URL
   * @returns {string} 默认图标URL
   */
  static getDefaultIcon(url) {
    if (!url) return 'default-icon.png';
    
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
    } catch {
      return 'default-icon.png';
    }
  }
  
  /**
   * 转义HTML字符
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  static escapeHtml(text) {
    // 使用tab-utils中的escapeHtml函数
    if (window.escapeHtml) {
      return window.escapeHtml(text);
    }
    
    // 备用实现
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 验证书签对象有效性
   * @param {Object} bookmark - 书签对象
   * @returns {boolean} 是否有效
   */
  static isValidBookmark(bookmark) {
    return bookmark && 
           typeof bookmark === 'object' && 
           bookmark.id && 
           bookmark.title && 
           bookmark.url;
  }
  
  /**
   * 获取书签的安全标题
   * @param {Object} bookmark - 书签对象
   * @param {number} maxLength - 最大长度
   * @returns {string} 安全的标题
   */
  static getSafeTitle(bookmark, maxLength = 50) {
    if (!CardInteractionUtils.isValidBookmark(bookmark)) {
      return '未知书签';
    }
    
    let title = bookmark.title || bookmark.url || '无标题';
    title = CardInteractionUtils.escapeHtml(title);
    
    if (title.length > maxLength) {
      title = title.substring(0, maxLength) + '...';
    }
    
    return title;
  }
  
  /**
   * 获取书签的安全URL
   * @param {Object} bookmark - 书签对象
   * @returns {string} 安全的URL
   */
  static getSafeUrl(bookmark) {
    if (!CardInteractionUtils.isValidBookmark(bookmark)) {
      return '';
    }
    
    return bookmark.url || '';
  }
  
  /**
   * 获取书签的安全图标
   * @param {Object} bookmark - 书签对象
   * @returns {string} 安全的图标URL
   */
  static getSafeIcon(bookmark) {
    if (!CardInteractionUtils.isValidBookmark(bookmark)) {
      return 'default-icon.png';
    }
    
    const iconUrl = bookmark.iconUrl || bookmark.icon;
    const url = CardInteractionUtils.getSafeUrl(bookmark);
    
    return CardInteractionUtils.getSafeIconUrl(iconUrl, CardInteractionUtils.getDefaultIcon(url));
  }
  
  /**
   * 格式化书签数据
   * @param {Object} bookmark - 原始书签数据
   * @returns {Object} 格式化后的书签数据
   */
  static formatBookmarkData(bookmark) {
    if (!CardInteractionUtils.isValidBookmark(bookmark)) {
      return null;
    }
    
    return {
      id: bookmark.id,
      title: CardInteractionUtils.getSafeTitle(bookmark),
      url: CardInteractionUtils.getSafeUrl(bookmark),
      iconUrl: CardInteractionUtils.getSafeIcon(bookmark),
      parentId: bookmark.parentId,
      dateAdded: bookmark.dateAdded,
      lastModified: bookmark.lastModified
    };
  }
  
  /**
   * 验证文件夹对象有效性
   * @param {Object} folder - 文件夹对象
   * @returns {boolean} 是否有效
   */
  static isValidFolder(folder) {
    return folder && 
           typeof folder === 'object' && 
           folder.id && 
           folder.title;
  }
  
  /**
   * 获取文件夹的安全标题
   * @param {Object} folder - 文件夹对象
   * @param {number} maxLength - 最大长度
   * @returns {string} 安全的标题
   */
  static getSafeFolderTitle(folder, maxLength = 30) {
    if (!CardInteractionUtils.isValidFolder(folder)) {
      return '未知文件夹';
    }
    
    let title = folder.title || '无标题文件夹';
    title = CardInteractionUtils.escapeHtml(title);
    
    if (title.length > maxLength) {
      title = title.substring(0, maxLength) + '...';
    }
    
    return title;
  }
  
  /**
   * 格式化文件夹数据
   * @param {Object} folder - 原始文件夹数据
   * @returns {Object} 格式化后的文件夹数据
   */
  static formatFolderData(folder) {
    if (!CardInteractionUtils.isValidFolder(folder)) {
      return null;
    }
    
    return {
      id: folder.id,
      title: CardInteractionUtils.getSafeFolderTitle(folder),
      parentId: folder.parentId,
      dateAdded: folder.dateAdded,
      lastModified: folder.lastModified,
      children: folder.children || []
    };
  }
}

// ==================== 导出到全局作用域 ====================

window.CardInteractionUtils = CardInteractionUtils; 