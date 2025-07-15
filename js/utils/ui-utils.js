// UI工具函数

/**
 * 获取网站favicon URL
 * @param {string} url - 网站URL
 * @returns {string} favicon URL
 */
function getFaviconUrl(url) {
    try {
        const domain = new URL(url);
        return `${domain.protocol}//${domain.hostname}/favicon.ico`;
    } catch (e) {
        return getDefaultLinkIcon();
    }
}

/**
 * 获取默认链接图标
 * @returns {string} 默认图标的data URI
 */
function getDefaultLinkIcon() {
    return 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
    `);
}

/**
 * 验证图标URL是否有效
 * @param {string} iconUrl - 图标URL
 * @returns {boolean} 是否有效
 */
function isValidIconUrl(iconUrl) {
    if (!iconUrl || typeof iconUrl !== 'string' || iconUrl.trim() === '') {
        return false;
    }
    
    // 检查是否是有效的URL或data URI
    return isValidUrl(iconUrl) || iconUrl.startsWith('data:');
}

/**
 * 获取安全的图标URL
 * @param {string} iconUrl - 图标URL
 * @param {string} fallbackUrl - 备用URL
 * @returns {string} 安全的图标URL
 */
function getSafeIconUrl(iconUrl, fallbackUrl = null) {
    if (isValidIconUrl(iconUrl)) {
        return iconUrl;
    }
    
    if (fallbackUrl && isValidIconUrl(fallbackUrl)) {
        return fallbackUrl;
    }
    
    return getDefaultLinkIcon();
}

/**
 * 显示通知消息
 * @param {string} message - 通知内容
 * @param {string} type - 通知类型: 'info', 'success', 'warning', 'error'
 * @param {number} duration - 显示时长（毫秒）
 */
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

/**
 * 检测设备类型
 * @returns {string} 设备类型: 'desktop', 'tablet', 'mobile'
 */
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

/**
 * 智能定位菜单位置工具函数
 * @param {Event} event - 鼠标事件
 * @param {HTMLElement} menu - 菜单元素
 * @param {Object} options - 可选配置
 * @returns {Object} 包含left和top的位置对象
 */
function calculateSmartMenuPosition(event, menu, options = {}) {
    const {
        margin = 10,           // 距离边界的最小距离
        preferRight = true,    // 是否优先显示在鼠标右侧
        preferBottom = true    // 是否优先显示在鼠标下方
    } = options;
    
    // 获取菜单尺寸（需要先添加到DOM中才能获取准确尺寸）
    const originalVisibility = menu.style.visibility;
    const originalPosition = menu.style.position;
    const originalLeft = menu.style.left;
    const originalTop = menu.style.top;
    const originalParent = menu.parentNode;
    
    menu.style.visibility = 'hidden';
    menu.style.position = 'fixed';
    menu.style.left = '0px';
    menu.style.top = '0px';
    
    // 如果菜单不在DOM中，临时添加
    const needsTemporaryAdd = !menu.parentNode;
    if (needsTemporaryAdd) {
        document.body.appendChild(menu);
    }
    
    const menuRect = menu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;
    
    // 恢复菜单状态
    if (needsTemporaryAdd) {
        document.body.removeChild(menu);
    }
    
    menu.style.visibility = originalVisibility;
    menu.style.position = originalPosition;
    menu.style.left = originalLeft;
    menu.style.top = originalTop;
    
    // 获取视窗尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 鼠标位置
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // 计算合适的位置
    let left = mouseX;
    let top = mouseY;
    
    // 水平位置调整
    if (preferRight && left + menuWidth <= viewportWidth - margin) {
        // 优先右侧，且右侧有足够空间
        left = mouseX;
    } else if (!preferRight && left - menuWidth >= margin) {
        // 优先左侧，且左侧有足够空间
        left = mouseX - menuWidth;
    } else if (left + menuWidth > viewportWidth - margin) {
        // 右侧空间不足，尝试左侧
        left = mouseX - menuWidth;
        if (left < margin) {
            // 左侧也不足，紧贴边界
            left = Math.max(margin, viewportWidth - menuWidth - margin);
        }
    }
    
    // 垂直位置调整
    if (preferBottom && top + menuHeight <= viewportHeight - margin) {
        // 优先下方，且下方有足够空间
        top = mouseY;
    } else if (!preferBottom && top - menuHeight >= margin) {
        // 优先上方，且上方有足够空间
        top = mouseY - menuHeight;
    } else if (top + menuHeight > viewportHeight - margin) {
        // 下方空间不足，尝试上方
        top = mouseY - menuHeight;
        if (top < margin) {
            // 上方也不足，紧贴边界
            top = Math.max(margin, viewportHeight - menuHeight - margin);
        }
    }
    
    // 确保位置在有效范围内
    left = Math.max(margin, Math.min(left, viewportWidth - menuWidth - margin));
    top = Math.max(margin, Math.min(top, viewportHeight - menuHeight - margin));
    
    return { left, top };
} 