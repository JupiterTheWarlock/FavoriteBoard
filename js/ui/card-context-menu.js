/**
 * CardContextMenu - 卡片右键菜单UI组件
 * 负责卡片右键菜单的显示、事件处理和动作执行
 * 遵循单一职责原则，只处理UI逻辑，不包含业务逻辑
 */
class CardContextMenu {
  constructor(contextMenuManager) {
    this.contextMenuManager = contextMenuManager;
    this.currentMenu = null;
    this.currentBookmarkForContext = null;
    
    console.log('🎯 CardContextMenu初始化完成');
  }
  
  /**
   * 显示卡片右键菜单
   * @param {Event} event - 鼠标事件
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   * @param {Object} config - 配置选项
   * @returns {HTMLElement} 菜单元素
   */
  showCardContextMenu(event, link, card, config = {}) {
    try {
      console.log('🎯 显示卡片右键菜单:', link.title);
      
      // 隐藏现有菜单
      this.hideCurrentMenu();
      
      // 保存当前上下文
      this.currentBookmarkForContext = link;
      
      const {
        enableMove = true,
        enableDelete = true,
        enableCopy = true,
        enableNewWindow = true,
        enableFrequentlyUsed = true,
        customMenuItems = []
      } = config;
      
      // 构建菜单项
      const menuItems = this.buildMenuItems(config);
      
      // 通过context-menu-manager显示菜单
      this.currentMenu = this.contextMenuManager.showMenu(
        event, 
        menuItems, 
        'card', 
        {
          link,
          card,
          config
        }
      );
      
      return this.currentMenu;
      
    } catch (error) {
      console.error('❌ 显示卡片右键菜单失败:', error);
      throw error;
    }
  }
  
  /**
   * 构建菜单项
   * @param {Object} config - 配置选项
   * @returns {Array} 菜单项数组
   */
  buildMenuItems(config) {
    const {
      enableMove = true,
      enableDelete = true,
      enableCopy = true,
      enableNewWindow = true,
      enableFrequentlyUsed = true,
      customMenuItems = []
    } = config;
    
    const items = [];
    
    // 标准菜单项
    if (enableNewWindow) {
      items.push({
        icon: '📄',
        text: '在新窗口打开',
        action: 'openNewWindow',
        enabled: true
      });
    }
    
    if (enableCopy) {
      items.push({
        icon: '📋',
        text: '复制链接',
        action: 'copy',
        enabled: true
      });
    }
    
    // 常用网页菜单项
    if (enableFrequentlyUsed) {
      items.push({
        icon: '⭐',
        text: '设为常用网页',
        action: 'setFrequentlyUsed',
        enabled: true
      });
    }
    
    // 自定义菜单项
    customMenuItems.forEach(item => {
      items.push({
        icon: item.icon || '🔧',
        text: item.text,
        action: item.action,
        enabled: item.enabled !== false,
        className: item.className || ''
      });
    });
    
    // 管理菜单项
    if (enableMove) {
      items.push({
        icon: '📁',
        text: '移动到文件夹',
        action: 'move',
        enabled: true
      });
    }
    
    if (enableDelete) {
      items.push({
        icon: '🗑️',
        text: '删除收藏',
        action: 'delete',
        enabled: true,
        danger: true
      });
    }
    
    return items;
  }
  
  /**
   * 处理菜单动作
   * @param {string} action - 动作名称
   * @param {Object} context - 上下文数据
   */
  handleMenuAction(action, context) {
    const { link, card, config } = context;
    
    console.log('🎯 处理卡片菜单动作:', action, link.title);
    
    switch (action) {
      case 'openNewWindow':
        this.handleOpenNewWindow(link);
        break;
        
      case 'copy':
        this.handleCopyLink(link);
        break;
        
      case 'setFrequentlyUsed':
        this.handleSetFrequentlyUsed(link, card);
        break;
        
      case 'move':
        this.showMoveDialog(link, card);
        break;
        
      case 'delete':
        this.showDeleteConfirmation(link, card);
        break;
        
      default:
        // 处理自定义动作
        if (config.customMenuItems) {
          const customItem = config.customMenuItems.find(item => item.action === action);
          if (customItem && customItem.handler) {
            customItem.handler(link, card, action);
          }
        }
        break;
    }
  }
  
  /**
   * 处理在新窗口打开
   * @param {Object} link - 链接对象
   */
  handleOpenNewWindow(link) {
    try {
      chrome.windows.create({ url: link.url });
      console.log('✅ 在新窗口打开链接:', link.title);
    } catch (error) {
      console.error('❌ 打开新窗口失败:', error);
    }
  }
  
  /**
   * 处理复制链接
   * @param {Object} link - 链接对象
   */
  async handleCopyLink(link) {
    try {
      await navigator.clipboard.writeText(link.url);
      console.log('✅ 链接已复制到剪贴板');
      
      // 显示成功通知
      this.showNotification('链接已复制到剪贴板', 'success');
      
    } catch (error) {
      console.error('❌ 复制链接失败:', error);
      this.showNotification('复制失败，请稍后重试', 'error');
    }
  }
  
  /**
   * 处理设为常用网页
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  async handleSetFrequentlyUsed(link, card) {
    try {
      console.log('⭐ 设为常用网页:', link.title);
      
      // 获取常用网页管理器
      const app = window.linkBoardApp;
      if (!app || !app.frequentlyUsedManager) {
        throw new Error('常用网页管理器不可用');
      }
      
      // 添加到常用网页
      await app.frequentlyUsedManager.addFrequentlyUsedWebsite(link.url, link.title);
      
      // 显示成功通知
      this.showNotification(`已设为常用网页: ${link.title}`, 'success');
      
      // 更新卡片状态（如果有相关UI）
      this.updateCardFrequentlyUsedState(card, true);
      
    } catch (error) {
      console.error('❌ 设为常用网页失败:', error);
      this.showNotification('设置失败，请稍后重试', 'error');
    }
  }
  
  /**
   * 显示移动对话框
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  showMoveDialog(link, card) {
    try {
      console.log('📁 显示移动对话框:', link.title);
      
      // 获取对话框管理器
      const app = window.linkBoardApp;
      if (!app || !app.uiManager) {
        throw new Error('UI管理器不可用');
      }
      
      const dialogManager = app.uiManager.getDialogManager();
      if (!dialogManager) {
        throw new Error('对话框管理器不可用');
      }
      
      // 创建移动对话框
      dialogManager.showFolderSelectorDialog({
        title: '移动到文件夹',
        message: `选择要将"${link.title}"移动到的文件夹:`,
        onConfirm: async (targetFolderId) => {
          await this.executeMoveBookmark(link, targetFolderId, card);
        }
      });
      
    } catch (error) {
      console.error('❌ 显示移动对话框失败:', error);
      this.showNotification('无法显示移动对话框', 'error');
    }
  }
  
  /**
   * 执行移动书签
   * @param {Object} link - 链接对象
   * @param {string} targetFolderId - 目标文件夹ID
   * @param {HTMLElement} card - 卡片元素
   */
  async executeMoveBookmark(link, targetFolderId, card) {
    try {
      console.log('📁 执行移动书签:', link.title, '->', targetFolderId);
      
      // 获取书签管理器
      const app = window.linkBoardApp;
      if (!app || !app.bookmarkManager) {
        throw new Error('书签管理器不可用');
      }
      
      // 执行移动
      await app.bookmarkManager.moveBookmark(link.id, targetFolderId);
      
      // 显示成功通知
      this.showNotification(`已移动到新文件夹: ${link.title}`, 'success');
      
      // 移除卡片元素
      if (card && card.parentNode) {
        card.remove();
      }
      
    } catch (error) {
      console.error('❌ 移动书签失败:', error);
      this.showNotification('移动失败，请稍后重试', 'error');
    }
  }
  
  /**
   * 显示删除确认对话框
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  showDeleteConfirmation(link, card) {
    try {
      console.log('🗑️ 显示删除确认对话框:', link.title);
      
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
        title: '删除收藏',
        message: `确定要删除"${link.title}"吗？此操作无法撤销。`,
        confirmText: '删除',
        cancelText: '取消',
        danger: true,
        onConfirm: async () => {
          await this.executeDeleteBookmark(link, card);
        }
      });
      
    } catch (error) {
      console.error('❌ 显示删除确认对话框失败:', error);
      this.showNotification('无法显示删除确认对话框', 'error');
    }
  }
  
  /**
   * 执行删除书签
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  async executeDeleteBookmark(link, card) {
    try {
      console.log('🗑️ 执行删除书签:', link.title);
      
      // 获取书签管理器
      const app = window.linkBoardApp;
      if (!app || !app.bookmarkManager) {
        throw new Error('书签管理器不可用');
      }
      
      // 执行删除
      await app.bookmarkManager.deleteBookmark(link.id);
      
      // 显示成功通知
      this.showNotification(`已删除: ${link.title}`, 'success');
      
      // 移除卡片元素
      if (card && card.parentNode) {
        card.remove();
      }
      
    } catch (error) {
      console.error('❌ 删除书签失败:', error);
      this.showNotification('删除失败，请稍后重试', 'error');
    }
  }
  
  /**
   * 更新卡片常用网页状态
   * @param {HTMLElement} card - 卡片元素
   * @param {boolean} isFrequentlyUsed - 是否为常用网页
   */
  updateCardFrequentlyUsedState(card, isFrequentlyUsed) {
    if (!card) return;
    
    const frequentlyUsedIcon = card.querySelector('.frequently-used-icon');
    if (frequentlyUsedIcon) {
      frequentlyUsedIcon.style.display = isFrequentlyUsed ? 'inline' : 'none';
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
    console.log('🗑️ CardContextMenu销毁开始...');
    
    // 隐藏当前菜单
    this.hideCurrentMenu();
    
    // 清理引用
    this.currentBookmarkForContext = null;
    this.contextMenuManager = null;
    
    console.log('✅ CardContextMenu销毁完成');
  }
}

// 导出类
window.CardContextMenu = CardContextMenu;
