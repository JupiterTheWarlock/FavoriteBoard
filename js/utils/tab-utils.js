/**
 * Tab工具函数 - 提供Tab组件通用的工具方法
 * 包含图标处理、HTML转义、文件夹图标等功能
 */

// ==================== 图标处理相关方法 ====================

/**
 * 检查图标URL是否有效
 * @param {string} iconUrl - 图标URL
 * @returns {boolean}
 */
function isValidIconUrl(iconUrl) {
  if (!iconUrl || typeof iconUrl !== 'string') return false;
  
  try {
    if (iconUrl.startsWith('data:')) return true;
    const url = new URL(iconUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * 获取默认图标
 * @returns {string}
 */
function getDefaultIcon() {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzMzNzNkYyIvPgo8cGF0aCBkPSJNOCA0SDEyVjEySDhWNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00IDRIOFYxMkg0VjRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjciLz4KPC9zdmc+';
}

/**
 * 获取安全的图标URL
 * @param {string} iconUrl - 原始图标URL
 * @param {string} websiteUrl - 网站URL
 * @returns {string}
 */
function getSafeIcon(iconUrl, websiteUrl = null) {
  if (iconUrl && isValidIconUrl(iconUrl)) {
    return iconUrl;
  }
  
  if (websiteUrl) {
    try {
      const domain = new URL(websiteUrl).hostname;
      return `https://${domain}/favicon.ico`;
    } catch (e) {
      console.warn('无法解析网站URL生成favicon:', websiteUrl);
    }
  }
  
  return getDefaultIcon();
}

/**
 * 获取文件夹图标
 * @param {string} title - 文件夹标题
 * @param {number} depth - 文件夹深度
 * @returns {string}
 */
function getFolderIcon(title, depth = 0) {
  if (!title) return '📁';
  
  const titleLower = title.toLowerCase();
  
  const iconMap = {
    '工作': '💼', 'work': '💼',
    '学习': '📚', 'study': '📚', 'education': '📚',
    '娱乐': '🎮', 'entertainment': '🎮', 'games': '🎮',
    '社交': '💬', 'social': '💬', 'communication': '💬',
    '购物': '🛒', 'shopping': '🛒',
    '新闻': '📰', 'news': '📰',
    '技术': '⚙️', 'tech': '⚙️', 'technology': '⚙️',
    '设计': '🎨', 'design': '🎨',
    '音乐': '🎵', 'music': '🎵',
    '视频': '🎬', 'video': '🎬', 'movies': '🎬',
    '旅游': '✈️', 'travel': '✈️',
    '美食': '🍕', 'food': '🍕'
  };
  
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (titleLower.includes(keyword)) {
      return icon;
    }
  }
  
  return depth === 0 ? '📁' : '📂';
}

// ==================== HTML处理相关方法 ====================

/**
 * 转义HTML字符
 * @param {string} text - 文本
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 从URL获取域名
 * @param {string} url - URL
 * @returns {string}
 */
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

// ==================== 时间格式化相关方法 ====================

/**
 * 格式化时间显示（简洁/相对）
 * @param {Date} date - 日期对象
 * @returns {string}
 */
function formatTime(date) {
  if (!date) return '未知时间';
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) {
    return '刚刚';
  }
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} 分钟前`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} 小时前`;
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} 天前`;
  }
  // 超过7天，显示详细日期（带年份）
  return formatTimeDetailed(date);
}

/**
 * 格式化时间显示（详细/绝对，始终带年份）
 * @param {Date} date - 日期对象
 * @returns {string}
 */
function formatTimeDetailed(date) {
  if (!date) return '未知时间';
  // yyyy-MM-dd HH:mm
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

// ==================== 空状态创建方法 ====================

/**
 * 创建空状态元素
 * @param {string} message - 显示消息
 * @param {string} icon - 图标
 * @returns {HTMLElement}
 */
function createEmptyState(message, icon = '📭') {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  
  emptyState.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-message">${escapeHtml(message)}</div>
  `;
  
  return emptyState;
}

// ==================== 导出到全局作用域 ====================

window.isValidIconUrl = isValidIconUrl;
window.getDefaultIcon = getDefaultIcon;
window.getSafeIcon = getSafeIcon;
window.getFolderIcon = getFolderIcon;
window.escapeHtml = escapeHtml;
window.getDomainFromUrl = getDomainFromUrl;
window.formatTime = formatTime;
window.formatTimeDetailed = formatTimeDetailed;
window.createEmptyState = createEmptyState;

window.TabUtils = {
  isValidIconUrl,
  getDefaultIcon,
  getSafeIcon,
  getFolderIcon,
  escapeHtml,
  getDomainFromUrl,
  formatTime,
  formatTimeDetailed,
  createEmptyState
};