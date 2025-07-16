/**
 * 卡片交互工具 - 处理链接卡片的各种交互逻辑
 * 提供统一的卡片交互处理方案，支持左键点击、右键菜单等
 */

/**
 * 卡片交互管理器类
 * 封装所有卡片相关的交互逻辑
 */
class CardInteractionManager {
  constructor(options = {}) {
    this.options = {
      showNotification: options.showNotification || this.defaultNotification,
      app: options.app || window.linkBoardApp,
      ...options
    };
    
    // 右键菜单状态
    this.currentContextMenu = null;
    this.currentBookmarkForContext = null;
    
    // 绑定全局事件
    this.bindGlobalEvents();
  }
  
  /**
   * 绑定全局事件
   */
  bindGlobalEvents() {
    // 点击空白处隐藏上下文菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu')) {
        this.hideContextMenu();
      }
    });
  }
  
  /**
   * 为卡片绑定交互事件
   * @param {HTMLElement} card - 卡片元素
   * @param {Object} link - 链接对象
   * @param {Object} config - 配置选项
   */
  bindCardEvents(card, link, config = {}) {
    const {
      enableClick = true,
      enableContextMenu = true,
      clickHandler = null,
      contextMenuHandler = null
    } = config;
    
    // 左键点击事件
    if (enableClick) {
      card.addEventListener('click', (e) => {
        // 如果点击的是上下文菜单按钮，不打开链接
        if (e.target.closest('.context-menu-btn')) {
          return;
        }
        
        if (clickHandler) {
          clickHandler(link, e);
        } else {
          this.defaultClickHandler(link, e);
        }
      });
    }
    
    // 右键菜单事件
    if (enableContextMenu) {
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        if (contextMenuHandler) {
          contextMenuHandler(e, link, card);
        } else {
          this.showContextMenu(e, link, card, config);
        }
      });
      
      // 上下文菜单按钮
      const contextBtn = card.querySelector('.context-menu-btn');
      if (contextBtn) {
        contextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          
          if (contextMenuHandler) {
            contextMenuHandler(e, link, card);
          } else {
            this.showContextMenu(e, link, card, config);
          }
        });
      }
    }
  }
  
  /**
   * 默认的点击处理器 - 在新标签页打开链接
   * @param {Object} link - 链接对象
   * @param {Event} event - 点击事件
   */
  defaultClickHandler(link, event) {
    if (link.url) {
      chrome.tabs.create({ url: link.url });
    }
  }
  
  /**
   * 显示右键菜单
   * @param {Event} event - 鼠标事件
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   * @param {Object} config - 菜单配置
   */
  showContextMenu(event, link, card, config = {}) {
    // 隐藏之前的菜单
    this.hideContextMenu();
    
    this.currentBookmarkForContext = link;
    
    const {
      enableMove = true,
      enableDelete = true,
      enableCopy = true,
      enableNewWindow = true,
      customMenuItems = []
    } = config;
    
    // 创建菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu show';
    
    let menuItems = [];
    
    // 标准菜单项
    if (enableNewWindow) {
      menuItems.push(`
        <div class="context-menu-item" data-action="openNewWindow">
          <span class="icon">📄</span>
          <span class="menu-text">在新窗口打开</span>
        </div>
      `);
    }
    
    if (enableCopy) {
      menuItems.push(`
        <div class="context-menu-item" data-action="copy">
          <span class="icon">📋</span>
          <span class="menu-text">复制链接</span>
        </div>
      `);
    }
    
    // 分隔符
    if ((enableNewWindow || enableCopy) && (enableMove || enableDelete || customMenuItems.length > 0)) {
      menuItems.push('<div class="context-menu-separator"></div>');
    }
    
    // 自定义菜单项
    customMenuItems.forEach(item => {
      menuItems.push(`
        <div class="context-menu-item ${item.className || ''}" data-action="${item.action}">
          <span class="icon">${item.icon}</span>
          <span class="menu-text">${item.text}</span>
        </div>
      `);
    });
    
    // 管理菜单项
    if (enableMove) {
      menuItems.push(`
        <div class="context-menu-item" data-action="move">
          <span class="icon">📁</span>
          <span class="menu-text">移动到文件夹</span>
        </div>
      `);
    }
    
    if (enableDelete) {
      menuItems.push(`
        <div class="context-menu-item danger" data-action="delete">
          <span class="icon">🗑️</span>
          <span class="menu-text">删除收藏</span>
        </div>
      `);
    }
    
    menu.innerHTML = menuItems.join('');
    
    // 智能定位菜单
    const position = this.calculateMenuPosition(event, menu);
    
    // 设置菜单样式和位置
    menu.style.position = 'fixed';
    menu.style.left = position.left + 'px';
    menu.style.top = position.top + 'px';
    menu.style.zIndex = '10000';
    
    document.body.appendChild(menu);
    this.currentContextMenu = menu;
    
    // 绑定菜单事件
    this.bindContextMenuEvents(menu, link, card, config);
    
    console.log('🐱 显示右键菜单，位置:', position);
  }
  
  /**
   * 智能定位菜单位置
   * @param {Event} event - 鼠标事件
   * @param {HTMLElement} menu - 菜单元素
   * @returns {Object} 包含left和top的位置对象
   */
  calculateMenuPosition(event, menu) {
    // 使用ui-utils中的calculateSmartMenuPosition函数
    if (window.calculateSmartMenuPosition) {
      return window.calculateSmartMenuPosition(event, menu, {
        margin: 10,
        preferRight: true,
        preferBottom: true
      });
    }
    
    // 备用实现
    return {
      left: event.clientX,
      top: event.clientY
    };
  }
  
  /**
   * 绑定右键菜单事件
   * @param {HTMLElement} menu - 菜单元素
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   * @param {Object} config - 配置选项
   */
  bindContextMenuEvents(menu, link, card, config = {}) {
    const {
      customActionHandlers = {},
      onMoveRequested = null,
      onDeleteRequested = null
    } = config;
    
    const handleMenuClick = async (e) => {
      const actionElement = e.target.closest('.context-menu-item');
      if (!actionElement) return;
      
      const action = actionElement.dataset.action;
      if (!action) return;
      
      e.stopPropagation();
      
      // 处理标准动作
      switch (action) {
        case 'openNewWindow':
          chrome.windows.create({ url: link.url });
          break;
          
        case 'copy':
          await this.copyLinkToClipboard(link.url);
          break;
          
        case 'move':
          if (onMoveRequested) {
            onMoveRequested(link, card);
          } else {
            await this.defaultMoveHandler(link, card);
          }
          break;
          
        case 'delete':
          if (onDeleteRequested) {
            onDeleteRequested(link, card);
          } else {
            await this.defaultDeleteHandler(link, card);
          }
          break;
          
        default:
          // 处理自定义动作
          if (customActionHandlers[action]) {
            await customActionHandlers[action](link, card, e);
          }
          break;
      }
      
      this.hideContextMenu();
    };
    
    menu.addEventListener('click', handleMenuClick);
  }
  
  /**
   * 隐藏右键菜单
   */
  hideContextMenu() {
    if (this.currentContextMenu) {
      document.body.removeChild(this.currentContextMenu);
      this.currentContextMenu = null;
      this.currentBookmarkForContext = null;
    }
  }
  
  /**
   * 复制链接到剪贴板
   * @param {string} url - 链接URL
   */
  async copyLinkToClipboard(url) {
    try {
      // 使用dom-utils中的copyToClipboard函数
      if (window.copyToClipboard) {
        await window.copyToClipboard(url);
        this.options.showNotification('链接已复制到剪贴板', 'success');
      } else {
        // 备用实现
        await navigator.clipboard.writeText(url);
        this.options.showNotification('链接已复制到剪贴板', 'success');
      }
    } catch (error) {
      console.error('❌ 复制链接失败:', error);
      this.options.showNotification('复制失败', 'error');
    }
  }
  
  /**
   * 默认的移动处理器
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  async defaultMoveHandler(link, card) {
    try {
      console.log(`📁 显示移动对话框: ${link.title}`);
      
      // 获取应用实例
      const app = this.options.app;
      if (!app || !app.dialogManager) {
        throw new Error('应用实例或对话框管理器不可用');
      }
      
      // 创建移动对话框
      const moveDialog = this.createMoveDialog(link, card);
      
      // 显示对话框
      moveDialog.show();
      
    } catch (error) {
      console.error('❌ 显示移动对话框失败:', error);
      this.options.showNotification('无法显示移动对话框', 'error');
    }
  }
  
  /**
   * 默认的删除处理器
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  async defaultDeleteHandler(link, card) {
    try {
      console.log(`🗑️ 显示删除确认对话框: ${link.title}`);
      
      // 获取应用实例
      const app = this.options.app;
      if (!app || !app.dialogManager) {
        throw new Error('应用实例或对话框管理器不可用');
      }
      
      // 创建删除确认对话框
      const deleteDialog = app.dialogManager.create({
        title: '删除收藏',
        message: `确定要删除收藏"${link.title}"吗？`,
        warning: '此操作不可撤销',
        confirmText: '删除',
        cancelText: '取消',
        isDangerous: true,
        type: 'confirm'
      });
      
      // 设置确认回调
      deleteDialog.onConfirm = async () => {
        return await this.executeDeleteBookmark(link, card);
      };
      
      // 显示对话框
      deleteDialog.show();
      
    } catch (error) {
      console.error('❌ 显示删除确认对话框失败:', error);
      this.options.showNotification('无法显示删除对话框', 'error');
    }
  }
  
  /**
   * 创建移动对话框
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   * @returns {Object} 对话框对象
   */
  createMoveDialog(link, card) {
    // 创建对话框容器
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay move-dialog-overlay';
    
    const dialogElement = document.createElement('div');
    dialogElement.className = 'dialog move-dialog';
    
    // 构建对话框HTML
    dialogElement.innerHTML = `
      <div class="dialog-header">
        <h3 class="dialog-title">移动收藏</h3>
        <button class="dialog-close" title="关闭">×</button>
      </div>
      <div class="dialog-body">
        <div class="move-dialog-info">
          <div class="move-dialog-bookmark">
            <img class="move-dialog-icon" src="${getSafeIcon(link.iconUrl, link.url)}" alt="icon">
            <span class="move-dialog-title">${escapeHtml(link.title)}</span>
          </div>
          <p class="move-dialog-message">选择要移动到的文件夹：</p>
        </div>
        <div class="move-dialog-selector-container">
          <!-- FolderSelector将在这里渲染 -->
        </div>
      </div>
      <div class="dialog-footer">
        <button class="dialog-btn dialog-btn-cancel">取消</button>
        <button class="dialog-btn dialog-btn-confirm" disabled>移动</button>
      </div>
    `;
    
    overlay.appendChild(dialogElement);
    
    // 创建FolderSelector实例
    const folderSelector = new FolderSelector({
      excludeFolderIds: [link.parentId || link.folderId],
      showBookmarkCount: true,
      onSelectionChange: (folderId, folderData) => {
        const confirmBtn = dialogElement.querySelector('.dialog-btn-confirm');
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.dataset.targetFolderId = folderId;
        }
      }
    });
    
    // 获取文件夹树数据
    const app = this.options.app;
    const folderTree = app.stateManager?.getStateValue('data.folderTree') || [];
    folderSelector.setFolderTree(folderTree);
    
    // 渲染FolderSelector
    const selectorContainer = dialogElement.querySelector('.move-dialog-selector-container');
    folderSelector.render(selectorContainer);
    
    // 创建对话框对象
    const dialog = {
      element: overlay,
      dialogElement: dialogElement,
      folderSelector: folderSelector,
      isVisible: false,
      
      show: () => {
        overlay.style.zIndex = '10050';
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 10);
        dialog.isVisible = true;
      },
      
      hide: () => {
        if (overlay.parentNode) {
          overlay.classList.remove('show');
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, 300);
        }
        if (folderSelector) {
          folderSelector.destroy();
        }
        dialog.isVisible = false;
      }
    };
    
    // 绑定对话框事件
    this.bindMoveDialogEvents(dialog, link, card);
    
    return dialog;
  }
  
  /**
   * 绑定移动对话框事件
   * @param {Object} dialog - 对话框对象
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   */
  bindMoveDialogEvents(dialog, link, card) {
    const { dialogElement } = dialog;
    
    // 关闭按钮事件
    const closeBtn = dialogElement.querySelector('.dialog-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => dialog.hide());
    }
    
    // 取消按钮事件
    const cancelBtn = dialogElement.querySelector('.dialog-btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => dialog.hide());
    }
    
    // 确认按钮事件
    const confirmBtn = dialogElement.querySelector('.dialog-btn-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        const targetFolderId = confirmBtn.dataset.targetFolderId;
        if (!targetFolderId) {
          this.options.showNotification('请选择目标文件夹', 'warning');
          return;
        }
        
        await this.executeMoveBookmark(link, targetFolderId, dialog, card);
      });
    }
    
    // 点击背景关闭
    dialog.element.addEventListener('click', (e) => {
      if (e.target === dialog.element) {
        dialog.hide();
      }
    });
    
    // ESC键关闭
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && dialog.isVisible) {
        dialog.hide();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }
  
  /**
   * 执行移动链接操作
   * @param {Object} link - 链接对象
   * @param {string} targetFolderId - 目标文件夹ID
   * @param {Object} dialog - 对话框对象
   * @param {HTMLElement} card - 卡片元素
   */
  async executeMoveBookmark(link, targetFolderId, dialog, card) {
    try {
      console.log(`📁 移动收藏: ${link.title} → ${targetFolderId}`);
      
      const confirmBtn = dialog.dialogElement.querySelector('.dialog-btn-confirm');
      const originalText = confirmBtn.textContent;
      confirmBtn.textContent = '移动中...';
      confirmBtn.disabled = true;
      
      const app = this.options.app;
      if (!app || !app.bookmarkManager) {
        throw new Error('收藏管理器不可用');
      }
      
      const success = await app.bookmarkManager.moveBookmark(link.id, targetFolderId);
      
      if (success) {
        this.options.showNotification(`收藏已移动到新文件夹`, 'success');
        dialog.hide();
      } else {
        throw new Error('移动操作失败');
      }
      
    } catch (error) {
      console.error('❌ 移动收藏失败:', error);
      this.options.showNotification(`移动失败: ${error.message}`, 'error');
      
      const confirmBtn = dialog.dialogElement.querySelector('.dialog-btn-confirm');
      if (confirmBtn) {
        confirmBtn.textContent = '移动';
        confirmBtn.disabled = false;
      }
    }
  }
  
  /**
   * 执行删除收藏操作
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   * @returns {boolean} 是否关闭对话框
   */
  async executeDeleteBookmark(link, card) {
    try {
      console.log(`🗑️ 删除收藏: ${link.title}`);
      
      const app = this.options.app;
      if (!app || !app.bookmarkManager) {
        throw new Error('收藏管理器不可用');
      }
      
      const success = await app.bookmarkManager.removeBookmark(link.id);
      
      if (success) {
        this.options.showNotification(`收藏"${link.title}"已删除`, 'success');
        
        // 添加删除动画
        if (card && card.parentNode) {
          card.style.transition = 'all 0.3s ease';
          card.style.transform = 'scale(0.8)';
          card.style.opacity = '0';
          
          setTimeout(() => {
            if (card.parentNode) {
              card.parentNode.removeChild(card);
            }
          }, 300);
        }
        
        return true; // 关闭对话框
      } else {
        throw new Error('删除操作失败');
      }
      
    } catch (error) {
      console.error('❌ 删除收藏失败:', error);
      this.options.showNotification(`删除失败: ${error.message}`, 'error');
      return false; // 不关闭对话框
    }
  }
  
  
  /**
   * 默认通知方法
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   */
  defaultNotification(message, type) {
    console.log(`[${type}] ${message}`);
  }
  
  /**
   * 销毁管理器
   */
  destroy() {
    this.hideContextMenu();
    this.currentBookmarkForContext = null;
  }
}

// ==================== 导出函数 ====================

/**
 * 创建卡片交互管理器实例
 * @param {Object} options - 配置选项
 * @returns {CardInteractionManager}
 */
function createCardInteractionManager(options = {}) {
  return new CardInteractionManager(options);
}

/**
 * 为卡片绑定标准交互事件
 * @param {HTMLElement} card - 卡片元素
 * @param {Object} link - 链接对象
 * @param {Object} options - 配置选项
 */
function bindStandardCardInteraction(card, link, options = {}) {
  const manager = createCardInteractionManager(options);
  manager.bindCardEvents(card, link, options);
  return manager;
}

// 导出到全局作用域
window.CardInteractionManager = CardInteractionManager;
window.createCardInteractionManager = createCardInteractionManager;
window.bindStandardCardInteraction = bindStandardCardInteraction; 

/**
 * 提供全局API：moveBookmarkToFolder
 * 适用于content script环境，直接调用chrome.bookmarks.move
 * @param {string} bookmarkId - 书签ID
 * @param {string} targetFolderId - 目标文件夹ID
 * @returns {Promise<void>}
 */
window.moveBookmarkToFolder = function(bookmarkId, targetFolderId) {
  return new Promise((resolve, reject) => {
    if (!bookmarkId || !targetFolderId) {
      reject(new Error('参数缺失'));
      return;
    }
    chrome.bookmarks.move(bookmarkId, { parentId: targetFolderId }, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}; 