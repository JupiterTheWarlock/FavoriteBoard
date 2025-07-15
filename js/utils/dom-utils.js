// DOM操作工具函数

/**
 * 隐藏元素（符合CSP要求）
 * @param {HTMLElement} element - 要隐藏的元素
 */
function hideElement(element) {
    if (element) {
        element.classList.add('hidden');
        element.classList.remove('show', 'show-inline-block', 'show-grid');
    }
}

/**
 * 显示元素（符合CSP要求）
 * @param {HTMLElement} element - 要显示的元素
 * @param {string} displayType - 显示类型: 'block', 'inline-block', 'grid'
 */
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

/**
 * 切换元素显示/隐藏状态
 * @param {HTMLElement} element - 目标元素
 * @param {boolean} show - 是否显示
 * @param {string} displayType - 显示类型
 */
function toggleElement(element, show, displayType = 'block') {
    if (show) {
        showElement(element, displayType);
    } else {
        hideElement(element);
    }
}

/**
 * 高亮搜索关键词
 * @param {string} text - 原始文本
 * @param {string} query - 搜索关键词
 * @returns {string} 高亮后的HTML文本
 */
function highlightText(text, query) {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
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