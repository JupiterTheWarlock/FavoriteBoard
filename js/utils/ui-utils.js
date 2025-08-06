// UI工具函数

// 图标处理函数已移至 tab-utils.js，请使用 window.getSafeIcon, window.getDefaultIcon 等

// showNotification 函数已移除 - 请使用 NotificationManager 或通过 UIManager.showNotification()

// getDeviceType 函数已删除 - 未在项目中使用

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

// ==================== 导出到全局作用域 ====================

window.calculateSmartMenuPosition = calculateSmartMenuPosition;

window.UIUtils = {
    calculateSmartMenuPosition
}; 