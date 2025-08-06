/**
 * FrequentlyUsedContextMenu - 常用网页右键菜单UI组件
 * 负责常用网页右键菜单的显示、事件处理和动作执行
 * 遵循单一职责原则，只处理UI逻辑，不包含业务逻辑
 */
class FrequentlyUsedContextMenu {
  constructor(contextMenuManager) {
    this.contextMenuManager = contextMenuManager;
    this.currentMenu = null;
    
    console.log('🎯 FrequentlyUsedContextMenu初始化完成');
  }
  
  /**
   * 显示常用网页右键菜单
   * @param {Event} event - 鼠标事件
   * @param {string} url - 网页URL
   * @param {string} title - 网页标题
   * @returns {HTMLElement} 菜单元素
   */
  showFrequentlyUsedContextMenu(event, url, title) {
    try {
      console.log('🎯 显示常用网页右键菜单:', title);
      
      // 隐藏现有菜单
      this.hideCurrentMenu();
      
      // 构建菜单项
      const menuItems = this.buildMenuItems(url, title);
      
      // 通过context-menu-manager显示菜单
      this.currentMenu = this.contextMenuManager.showMenu(
        event, 
        menuItems, 
        'frequently-used', 
        {
          url,
          title
        }
      );
      
      return this.currentMenu;
      
    } catch (error) {
      console.error('❌ 显示常用网页右键菜单失败:', error);
      throw error;
    }
  }
  
  /**
   * 构建菜单项
   * @param {string} url - 网页URL
   * @param {string} title - 网页标题
   * @returns {Array} 菜单项数组
   */
  buildMenuItems(url, title) {
    const items = [
      {
        icon: '📄',
        text: '在新窗口打开',
        action: 'openNewWindow',
        enabled: true
      },
      {
        icon: '📋',
        text: '复制链接',
        action: 'copy',
        enabled: true
      },
      { type: 'separator' },
      {
        icon: '🗑️',
        text: '移除常用网页',
        action: 'remove',
        enabled: true,
        danger: true
      }
    ];
    
    return items;
  }
  
  /**
   * 处理菜单动作
   * @param {string} action - 动作名称
   * @param {Object} context - 上下文数据
   */
  handleMenuAction(action, context) {
    const { url, title } = context;
    
    console.log('🎯 处理常用网页菜单动作:', action, title);
    
    switch (action) {
      case 'openNewWindow':
        this.handleOpenNewWindow(url);
        break;
        
      case 'copy':
        this.handleCopyLink(url);
        break;
        
      case 'remove':
        this.showRemoveConfirmation(url, title);
        break;
        
      default:
        console.warn('⚠️ 未知的菜单动作:', action);
        break;
    }
  }
  
  /**
   * 处理在新窗口打开
   * @param {string} url - 网页URL
   */
  handleOpenNewWindow(url) {
    try {
      chrome.windows.create({ url: url });
      console.log('✅ 在新窗口打开链接:', url);
    } catch (error) {
      console.error('❌ 打开新窗口失败:', error);
    }
  }
  
  /**
   * 处理复制链接
   * @param {string} url - 网页URL
   */
  async handleCopyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      console.log('✅ 链接已复制到剪贴板');
      
      // 显示成功通知
      this.showNotification('链接已复制到剪贴板', 'success');
      
    } catch (error) {
      console.error('❌ 复制链接失败:', error);
      this.showNotification('复制失败，请稍后重试', 'error');
    }
  }
  
  /**
   * 显示移除确认对话框
   * @param {string} url - 网页URL
   * @param {string} title - 网页标题
   */
  showRemoveConfirmation(url, title) {
    try {
      console.log('🗑️ 显示移除确认对话框:', title);
      
      // 获取对话框管理器
      const app = window.linkBoardApp;
      if (!app || !app.uiManager) {
        throw new Error('UI管理器不可用');
      }
      
      const dialogManager = app.uiManager.getDialogManager();
      if (!dialogManager) {
        throw new Error('对话框管理器不可用');
      }
      
      // 显示确认对话框
      dialogManager.showConfirmDialog({
        title: '移除常用网页',
        message: `确定要移除"${title}"吗？`,
        confirmText: '移除',
        cancelText: '取消',
        danger: true,
        onConfirm: async () => {
          await this.executeRemoveFrequentlyUsed(url, title);
        }
      });
      
    } catch (error) {
      console.error('❌ 显示移除确认对话框失败:', error);
      this.showNotification('无法显示移除确认对话框', 'error');
    }
  }
  
  /**
   * 执行移除常用网页
   * @param {string} url - 网页URL
   * @param {string} title - 网页标题
   */
  async executeRemoveFrequentlyUsed(url, title) {
    try {
      console.log('🗑️ 执行移除常用网页:', title);
      
      // 获取常用网页管理器
      const app = window.linkBoardApp;
      if (!app || !app.frequentlyUsedManager) {
        throw new Error('常用网页管理器不可用');
      }
      
      // 执行移除
      await app.frequentlyUsedManager.removeFrequentlyUsedWebsite(url);
      
      // 显示成功通知
      this.showNotification(`已移除: ${title}`, 'success');
      
      // 触发事件通知其他组件更新
      if (app.eventBus) {
        app.eventBus.emit('frequently-used-removed', {
          url: url,
          title: title
        });
      }
      
    } catch (error) {
      console.error('❌ 移除常用网页失败:', error);
      this.showNotification('移除失败，请稍后重试', 'error');
    }
  }
  
  /**
   * 隐藏当前菜单
   */
  hideCurrentMenu() {
    if (this.currentMenu) {
      this.contextMenuManager.hideMenu(this.currentMenu);
      this.currentMenu = null;
    }
  }
  
  /**
   * 显示通知
   * @param {string} message - 消息内容
   * @param {string} type - 通知类型
   */
  showNotification(message, type = 'info') {
    const app = window.linkBoardApp;
    if (app && app.uiManager) {
      app.uiManager.showNotification(message, type);
    } else {
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    console.log('🗑️ FrequentlyUsedContextMenu销毁开始...');
    
    // 隐藏当前菜单
    this.hideCurrentMenu();
    
    // 清理引用
    this.contextMenuManager = null;
    
    console.log('✅ FrequentlyUsedContextMenu销毁完成');
  }
}

// 导出类
window.FrequentlyUsedContextMenu = FrequentlyUsedContextMenu;
