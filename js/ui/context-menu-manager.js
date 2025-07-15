/**
 * ContextMenuManager - 右键菜单管理器
 * 统一管理文件夹和Tab右键菜单
 */
class ContextMenuManager {
  constructor(eventBus, dialogManager) {
    this.eventBus = eventBus;
    this.dialogManager = dialogManager;
    
    // 菜单管理
    this.activeMenus = new Set();
    this.menuCounter = 0;
    this.zIndexBase = 9000;
    
    // 当前上下文数据
    this.currentFolderData = null;
    this.currentTabData = null;
    
    console.log('🎯 ContextMenuManager初始化开始...');
    
    // 绑定全局事件
    this.bindGlobalEvents();
    
    console.log('✅ ContextMenuManager初始化完成');
  }
  
  /**
   * 绑定全局事件
   */
  bindGlobalEvents() {
    // 点击空白处隐藏菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu')) {
        this.hideAllMenus();
      }
    });
    
    // 按ESC键隐藏菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAllMenus();
      }
    });
    
    console.log('🔗 ContextMenuManager全局事件绑定完成');
  }
  
  /**
   * 显示文件夹右键菜单
   * @param {Event} event - 鼠标右键事件
   * @param {string} folderId - 文件夹ID
   * @param {Object} folderData - 文件夹数据
   */
  showFolderMenu(event, folderId, folderData) {
    try {
      console.log(`🎯 显示文件夹右键菜单: ${folderData.title}`);
      
      // 隐藏现有菜单
      this.hideAllMenus();
      
      // 保存当前文件夹数据
      this.currentFolderData = folderData;
      
      // 检查是否为根文件夹（可删除性检查）
      const isRootFolder = this.isRootFolder(folderData);
      
      // 创建菜单项
      const menuItems = [
        {
          icon: '📁',
          text: '创建子文件夹',
          action: 'createSubfolder',
          enabled: true
        },
        {
          icon: '✏️',
          text: '重命名',
          action: 'rename',
          enabled: true
        }
      ];
      
      // 如果不是根文件夹，添加删除选项
      if (!isRootFolder) {
        menuItems.push(
          { type: 'separator' },
          {
            icon: '🗑️',
            text: '删除文件夹',
            action: 'delete',
            enabled: true,
            danger: true
          }
        );
      }
      
      // 创建并显示菜单
      const menu = this.createMenu(event, menuItems, 'folder');
      this.showMenu(menu, event);
      
    } catch (error) {
      console.error('❌ 显示文件夹右键菜单失败:', error);
    }
  }
  
  /**
   * 显示Tab右键菜单
   * @param {Event} event - 鼠标右键事件
   * @param {Object} tab - Tab对象
   */
  showTabMenu(event, tab) {
    try {
      console.log(`🎯 显示Tab右键菜单: ${tab.id}`);
      
      // 隐藏现有菜单
      this.hideAllMenus();
      
      // 保存当前Tab数据
      this.currentTabData = tab;
      
      // 创建菜单项
      const menuItems = [
        {
          icon: '🔄',
          text: '刷新数据',
          action: 'refresh',
          enabled: true
        }
      ];
      
      // 如果是书签Tab，添加额外选项
      if (tab.id === 'bookmark' && tab.currentLinks && tab.currentLinks.length > 0) {
        menuItems.push(
          { type: 'separator' },
          {
            icon: '🌐',
            text: '打开全部链接',
            action: 'openAll',
            enabled: true
          },
          {
            icon: '📤',
            text: '导出链接',
            action: 'export',
            enabled: true
          }
        );
      }
      
      // 创建并显示菜单
      const menu = this.createMenu(event, menuItems, 'tab');
      this.showMenu(menu, event);
      
    } catch (error) {
      console.error('❌ 显示Tab右键菜单失败:', error);
    }
  }
  
  /**
   * 创建菜单
   * @param {Event} event - 鼠标事件
   * @param {Array} menuItems - 菜单项配置
   * @param {string} menuType - 菜单类型 ('folder', 'tab')
   * @returns {Object} 菜单对象
   */
  createMenu(event, menuItems, menuType) {
    const menuId = `context-menu-${++this.menuCounter}`;
    
    // 创建菜单容器
    const menuElement = document.createElement('div');
    menuElement.className = `context-menu ${menuType}-context-menu`;
    menuElement.id = menuId;
    
    // 构建菜单HTML
    let menuHTML = '';
    menuItems.forEach(item => {
      if (item.type === 'separator') {
        menuHTML += '<div class="context-menu-separator"></div>';
      } else {
        const enabledClass = item.enabled ? '' : 'disabled';
        const dangerClass = item.danger ? 'danger' : '';
        
        menuHTML += `
          <div class="context-menu-item ${enabledClass} ${dangerClass}" data-action="${item.action}">
            <span class="icon">${item.icon}</span>
            <span class="menu-text">${item.text}</span>
          </div>
        `;
      }
    });
    
    menuElement.innerHTML = menuHTML;
    
    // 创建菜单对象
    const menu = {
      id: menuId,
      element: menuElement,
      type: menuType,
      isVisible: false,
      
      show: () => {
        document.body.appendChild(menuElement);
        setTimeout(() => {
          menuElement.classList.add('show');
        }, 10);
        menu.isVisible = true;
      },
      
      hide: () => {
        if (menuElement.parentNode) {
          menuElement.classList.remove('show');
          setTimeout(() => {
            if (menuElement.parentNode) {
              menuElement.parentNode.removeChild(menuElement);
            }
          }, 200);
        }
        menu.isVisible = false;
        this.activeMenus.delete(menu);
      }
    };
    
    // 绑定菜单事件
    this.bindMenuEvents(menu);
    
    return menu;
  }
  
  /**
   * 显示菜单
   * @param {Object} menu - 菜单对象
   * @param {Event} event - 鼠标事件
   */
  showMenu(menu, event) {
    try {
      // 计算菜单位置
      const position = this.calculateMenuPosition(event, menu.element);
      
      // 设置菜单样式和位置
      menu.element.style.position = 'fixed';
      menu.element.style.left = position.left + 'px';
      menu.element.style.top = position.top + 'px';
      menu.element.style.zIndex = this.zIndexBase + this.activeMenus.size;
      
      // 添加到活动菜单列表
      this.activeMenus.add(menu);
      
      // 显示菜单
      menu.show();
      
      console.log(`✅ 菜单显示完成: ${menu.id}`);
      
    } catch (error) {
      console.error('❌ 显示菜单失败:', error);
    }
  }
  
  /**
   * 计算菜单位置
   * @param {Event} event - 鼠标事件
   * @param {HTMLElement} menuElement - 菜单元素
   * @returns {Object} 位置坐标 {left, top}
   */
  calculateMenuPosition(event, menuElement) {
    // 临时添加到DOM以获取尺寸
    menuElement.style.visibility = 'hidden';
    menuElement.style.position = 'fixed';
    document.body.appendChild(menuElement);
    
    const rect = menuElement.getBoundingClientRect();
    const menuWidth = rect.width;
    const menuHeight = rect.height;
    
    // 移除临时元素
    document.body.removeChild(menuElement);
    menuElement.style.visibility = '';
    
    // 获取视窗尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 计算初始位置
    let left = event.clientX;
    let top = event.clientY;
    
    // 右边界检查
    if (left + menuWidth > viewportWidth - 10) {
      left = viewportWidth - menuWidth - 10;
    }
    
    // 下边界检查
    if (top + menuHeight > viewportHeight - 10) {
      top = viewportHeight - menuHeight - 10;
    }
    
    // 左边界检查
    if (left < 10) {
      left = 10;
    }
    
    // 上边界检查
    if (top < 10) {
      top = 10;
    }
    
    return { left, top };
  }
  
  /**
   * 绑定菜单事件
   * @param {Object} menu - 菜单对象
   */
  bindMenuEvents(menu) {
    menu.element.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.context-menu-item');
      if (!menuItem || menuItem.classList.contains('disabled')) {
        return;
      }
      
      const action = menuItem.dataset.action;
      if (!action) return;
      
      e.stopPropagation();
      
      // 处理菜单动作
      this.handleMenuAction(menu.type, action);
      
      // 隐藏菜单
      menu.hide();
    });
  }
  
  /**
   * 处理菜单动作
   * @param {string} menuType - 菜单类型
   * @param {string} action - 动作类型
   */
  handleMenuAction(menuType, action) {
    try {
      console.log(`🎯 处理菜单动作: ${menuType} - ${action}`);
      
      if (menuType === 'folder') {
        this.handleFolderMenuAction(action);
      } else if (menuType === 'tab') {
        this.handleTabMenuAction(action);
      }
      
    } catch (error) {
      console.error('❌ 处理菜单动作失败:', error);
    }
  }
  
  /**
   * 处理文件夹菜单动作
   * @param {string} action - 动作类型
   */
  handleFolderMenuAction(action) {
    if (!this.currentFolderData) {
      console.warn('⚠️ 当前文件夹数据不可用');
      return;
    }
    
    const folderData = this.currentFolderData;
    
    switch (action) {
      case 'createSubfolder':
        this.showCreateSubfolderDialog(folderData);
        break;
      case 'rename':
        this.showRenameFolderDialog(folderData);
        break;
      case 'delete':
        this.showDeleteFolderConfirmation(folderData);
        break;
      default:
        console.warn(`⚠️ 未知的文件夹菜单动作: ${action}`);
    }
  }
  
  /**
   * 处理Tab菜单动作
   * @param {string} action - 动作类型
   */
  handleTabMenuAction(action) {
    if (!this.currentTabData) {
      console.warn('⚠️ 当前Tab数据不可用');
      return;
    }
    
    const tab = this.currentTabData;
    
    // 发布Tab菜单动作事件
    this.eventBus.emit('tab-context-menu-action', {
      action,
      tab
    });
  }
  
  /**
   * 显示创建子文件夹对话框
   * @param {Object} parentFolderData - 父文件夹数据
   */
  showCreateSubfolderDialog(parentFolderData) {
    if (!this.dialogManager) {
      console.warn('⚠️ DialogManager不可用');
      return;
    }
    
    const dialog = this.dialogManager.create({
      title: `在 "${parentFolderData.title}" 中创建新文件夹`,
      type: 'input',
      inputPlaceholder: '文件夹名称',
      confirmText: '创建',
      cancelText: '取消'
    });
    
    dialog.onConfirm = async (folderName) => {
      if (!folderName.trim()) {
        this.eventBus.emit('notification-requested', {
          message: '文件夹名称不能为空',
          type: 'error'
        });
        return false;
      }
      
      try {
        // 发布创建文件夹事件
        this.eventBus.emit('folder-create-requested', {
          parentId: parentFolderData.id,
          folderName: folderName.trim()
        });
        
        return true;
      } catch (error) {
        console.error('❌ 创建文件夹失败:', error);
        this.eventBus.emit('notification-requested', {
          message: '创建文件夹失败: ' + error.message,
          type: 'error'
        });
        return false;
      }
    };
    
    dialog.show();
  }
  
  /**
   * 显示重命名文件夹对话框
   * @param {Object} folderData - 文件夹数据
   */
  showRenameFolderDialog(folderData) {
    if (!this.dialogManager) {
      console.warn('⚠️ DialogManager不可用');
      return;
    }
    
    const dialog = this.dialogManager.create({
      title: `重命名文件夹`,
      type: 'input',
      inputValue: folderData.title,
      inputPlaceholder: '文件夹名称',
      confirmText: '重命名',
      cancelText: '取消'
    });
    
    dialog.onConfirm = async (newName) => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        this.eventBus.emit('notification-requested', {
          message: '文件夹名称不能为空',
          type: 'error'
        });
        return false;
      }
      
      if (trimmedName === folderData.title) {
        this.eventBus.emit('notification-requested', {
          message: '文件夹名称没有变化',
          type: 'info'
        });
        return true;
      }
      
      try {
        // 发布重命名文件夹事件
        this.eventBus.emit('folder-rename-requested', {
          folderId: folderData.id,
          newName: trimmedName
        });
        
        return true;
      } catch (error) {
        console.error('❌ 重命名文件夹失败:', error);
        this.eventBus.emit('notification-requested', {
          message: '重命名文件夹失败: ' + error.message,
          type: 'error'
        });
        return false;
      }
    };
    
    dialog.show();
  }
  
  /**
   * 显示删除文件夹确认对话框
   * @param {Object} folderData - 文件夹数据
   */
  showDeleteFolderConfirmation(folderData) {
    if (!this.dialogManager) {
      console.warn('⚠️ DialogManager不可用');
      return;
    }
    
    const hasBookmarks = folderData.bookmarkCount > 0;
    const hasSubfolders = folderData.children && folderData.children.length > 0;
    
    let warningText = '';
    if (hasBookmarks && hasSubfolders) {
      warningText = `此文件夹包含 ${folderData.bookmarkCount} 个书签和子文件夹。`;
    } else if (hasBookmarks) {
      warningText = `此文件夹包含 ${folderData.bookmarkCount} 个书签。`;
    } else if (hasSubfolders) {
      warningText = '此文件夹包含子文件夹。';
    }
    
    const dialog = this.dialogManager.create({
      title: '删除文件夹',
      message: `确定要删除文件夹 "${folderData.title}" 吗？`,
      warning: warningText + (warningText ? ' 删除后将无法恢复。' : ''),
      type: 'confirm',
      confirmText: '删除',
      cancelText: '取消',
      isDangerous: true
    });
    
    dialog.onConfirm = async () => {
      try {
        console.log(`🗑️ [ContextMenuManager] 准备删除文件夹:`, {
          folderId: folderData.id,
          folderTitle: folderData.title,
          folderData: folderData
        });
        
        // 发布删除文件夹事件
        this.eventBus.emit('folder-delete-requested', {
          folderId: folderData.id,
          folderData: folderData
        });
        
        return true;
      } catch (error) {
        console.error('❌ 删除文件夹失败:', error);
        this.eventBus.emit('notification-requested', {
          message: '删除文件夹失败: ' + error.message,
          type: 'error'
        });
        return false;
      }
    };
    
    dialog.show();
  }
  
  /**
   * 检查是否为根文件夹
   * @param {Object} folderData - 文件夹数据
   * @returns {boolean} 是否为根文件夹
   */
  isRootFolder(folderData) {
    // 检查是否为Chrome浏览器自带的特殊文件夹
    // ID "1" 为收藏栏
    // ID "2" 为其他收藏夹
    return folderData.id === '1' || folderData.id === '2' || folderData.parentId === '0';
  }
  
  /**
   * 隐藏所有菜单
   */
  hideAllMenus() {
    if (this.activeMenus.size === 0) return;
    
    console.log('🎯 隐藏所有右键菜单...');
    
    const menusToHide = Array.from(this.activeMenus);
    for (const menu of menusToHide) {
      menu.hide();
    }
    
    // 清理上下文数据
    this.currentFolderData = null;
    this.currentTabData = null;
    
    console.log('✅ 所有右键菜单已隐藏');
  }
  
  /**
   * 获取活动菜单数量
   * @returns {number} 活动菜单数量
   */
  getActiveMenuCount() {
    return this.activeMenus.size;
  }
  
  /**
   * 主题变更处理
   * @param {string} theme - 主题名称
   */
  onThemeChange(theme) {
    console.log(`🎨 ContextMenuManager主题变更: ${theme}`);
    
    // 应用主题到所有活动菜单
    for (const menu of this.activeMenus) {
      if (menu.element) {
        menu.element.setAttribute('data-theme', theme);
      }
    }
  }
  
  /**
   * 窗口大小变化处理
   */
  onWindowResize() {
    console.log('📏 ContextMenuManager处理窗口大小变化');
    
    // 隐藏所有菜单（避免位置错乱）
    this.hideAllMenus();
  }
  
  /**
   * 清理资源
   */
  destroy() {
    console.log('🧹 清理ContextMenuManager资源...');
    
    // 隐藏所有菜单
    this.hideAllMenus();
    
    // 清理引用
    this.activeMenus.clear();
    this.menuCounter = 0;
    this.currentFolderData = null;
    this.currentTabData = null;
    
    console.log('✅ ContextMenuManager资源清理完成');
  }
}

// 导出ContextMenuManager类
window.ContextMenuManager = ContextMenuManager; 