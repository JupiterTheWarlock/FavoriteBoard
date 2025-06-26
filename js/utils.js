// 工具函数集合

// 显示/隐藏元素的工具函数（符合CSP要求）
function hideElement(element) {
    if (element) {
        element.classList.add('hidden');
        element.classList.remove('show', 'show-inline-block', 'show-grid');
    }
}

function showElement(element, displayType = 'block') {
    if (element) {
        element.classList.remove('hidden');
        if (displayType === 'inline-block') {
            element.classList.add('show-inline-block');
            element.classList.remove('show', 'show-grid');
        } else if (displayType === 'grid') {
            element.classList.add('show-grid');
            element.classList.remove('show', 'show-inline-block');
        } else {
            element.classList.add('show');
            element.classList.remove('show-inline-block', 'show-grid');
        }
    }
}

function toggleElement(element, show, displayType = 'block') {
    if (show) {
        showElement(element, displayType);
    } else {
        hideElement(element);
    }
}

// 防抖函数
function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// 节流函数
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 格式化URL，确保有协议前缀
function formatUrl(url) {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
}

// 检查URL是否有效
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// 获取网站favicon URL
function getFaviconUrl(url) {
  try {
    const domain = new URL(url);
    return `${domain.protocol}//${domain.hostname}/favicon.ico`;
  } catch (e) {
    return getDefaultLinkIcon();
  }
}

// 获取默认链接图标
function getDefaultLinkIcon() {
  return 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  `);
}

// 验证图标URL是否有效
function isValidIconUrl(iconUrl) {
  if (!iconUrl || typeof iconUrl !== 'string' || iconUrl.trim() === '') {
    return false;
  }
  
  // 检查是否是有效的URL或data URI
  return isValidUrl(iconUrl) || iconUrl.startsWith('data:');
}

// 获取安全的图标URL
function getSafeIconUrl(iconUrl, fallbackUrl = null) {
  if (isValidIconUrl(iconUrl)) {
    return iconUrl;
  }
  
  if (fallbackUrl && isValidIconUrl(fallbackUrl)) {
    return fallbackUrl;
  }
  
  return getDefaultLinkIcon();
}

// 高亮搜索关键词
function highlightText(text, query) {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// 复制文本到剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// 显示通知消息
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('slide-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// 检测设备类型
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// 本地存储操作
const Storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },
  
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

// 随机生成ID
function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 格式化数字
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
} 