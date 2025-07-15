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