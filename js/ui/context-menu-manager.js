/**
 * ContextMenuManager - 右键菜单管理器
 * 统一管理所有类型的右键菜单，提供统一的菜单显示接口
 * 实现菜单类型路由和统一的菜单管理架构
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
    
    // 初始化子菜单管理器
    this.initSubMenuManagers();
    
    // 绑定全局事件
    this.bindGlobalEvents();
    
    console.log('✅ ContextMenuManager初始化完成');
  }
  
  /**
   * 初始化子菜单管理器
   */
  initSubMenuManagers() {
    try {
      // 初始化卡片右键菜单管理器
      if (window.CardContextMenu) {
        this.cardContextMenu = new CardContextMenu(this);
        console.log('✅ CardContextMenu初始化完成');
      } else {
        console.warn('⚠️ CardContextMenu类不可用');
      }
      
      // 初始化常用网页右键菜单管理器
      if (window.FrequentlyUsedContextMenu) {
        this.frequentlyUsedContextMenu = new FrequentlyUsedContextMenu(this);
        console.log('✅ FrequentlyUsedContextMenu初始化完成');
      } else {
        console.warn('⚠️ FrequentlyUsedContextMenu类不可用');
      }
      
    } catch (error) {
      console.error('❌ 初始化子菜单管理器失败:', error);
    }
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
  
  // ==================== 统一菜单显示接口 ====================
  
  /**
   * 统一的菜单显示接口
   * @param {Event} event - 鼠标事件
   * @param {Array} menuItems - 菜单项数组
   * @param {string} menuType - 菜单类型
   * @param {Object} contextData - 上下文数据
   * @returns {Object} 菜单对象
   */
  showMenu(event, menuItems, menuType, contextData = null) {
    try {
      console.log(`🎯 显示菜单: ${menuType}`);
      
      // 隐藏现有菜单
      this.hideAllMenus();
      
      // 创建菜单
      const menu = this.createMenu(event, menuItems, menuType, contextData);
      
      // 显示菜单
      this.showMenuElement(menu, event);
      
      return menu;
      
    } catch (error) {
      console.error('❌ 显示菜单失败:', error);
      throw error;
    }
  }
  
  /**
   * 显示卡片右键菜单
   * @param {Event} event - 鼠标事件
   * @param {Object} link - 链接对象
   * @param {HTMLElement} card - 卡片元素
   * @param {Object} config - 配置选项
   * @returns {Object} 菜单对象
   */
  showCardMenu(event, link, card, config = {}) {
    if (!this.cardContextMenu) {
      console.warn('⚠️ CardContextMenu不可用');
      return null;
    }
    
    return this.cardContextMenu.showCardContextMenu(event, link, card, config);
  }
  
  /**
   * 显示常用网页右键菜单
   * @param {Event} event - 鼠标事件
   * @param {string} url - 网页URL
   * @param {string} title - 网页标题
   * @returns {Object} 菜单对象
   */
  showFrequentlyUsedMenu(event, url, title) {
    if (!this.frequentlyUsedContextMenu) {
      console.warn('⚠️ FrequentlyUsedContextMenu不可用');
      return null;
    }
    
    return this.frequentlyUsedContextMenu.showFrequentlyUsedContextMenu(event, url, title);
  }
  
  /**
   * 显示文件夹右键菜单
   * @param {Event} event - 鼠标右键事件
   * @param {string} folderId - 文件夹ID
   * @param {Object} folderData - 文件夹数据
   * @returns {Object} 菜单对象
   */
  showFolderMenu(event, folderId, folderData) {
    try {
      console.log(`🎯 显示文件夹右键菜单: ${folderData.title}`);
      
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
      
      // 使用统一接口显示菜单
      return this.showMenu(event, menuItems, 'folder', { folderId, folderData });
      
    } catch (error) {
      console.error('❌ 显示文件夹右键菜单失败:', error);
      return null;
    }
  }
  
  /**
   * 显示Tab右键菜单
   * @param {Event} event - 鼠标右键事件
   * @param {Object} tab - Tab对象
   * @returns {Object} 菜单对象
   */
  showTabMenu(event, tab) {
    try {
      console.log(`🎯 显示Tab右键菜单: ${tab.id}`);
      
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
      
      // 使用统一接口显示菜单
      return this.showMenu(event, menuItems, 'tab', { tab });
      
    } catch (error) {
      console.error('❌ 显示Tab右键菜单失败:', error);
      return null;
    }
  }
  
  /**
   * 显示书签右键菜单
   * @param {Event} event - 鼠标右键事件
   * @param {Object} bookmarkData - 书签数据
   * @returns {Object} 菜单对象
   */
  showBookmarkMenu(event, bookmarkData) {
    try {
      console.log(`🎯 显示书签右键菜单: ${bookmarkData.title}`);
      
      // 创建菜单项
      const menuItems = [
        {
          icon: '🆕',
          text: '新窗口打开',
          action: 'openNewWindow',
          enabled: true
        },
        {
          icon: '📋',
          text: '复制链接',
          action: 'copyLink',
          enabled: true
        },
        { type: 'separator' },
        {
          icon: '⭐',
          text: '设为常用网页',
          action: 'setFrequentlyUsed',
          enabled: true
        },
        { type: 'separator' },
        {
          icon: '✏️',
          text: '编辑',
          action: 'edit',
          enabled: true
        },
        {
          icon: '🗑️',
          text: '删除',
          action: 'delete',
          enabled: true,
          danger: true
        }
      ];
      
      // 使用统一接口显示菜单
      return this.showMenu(event, menuItems, 'bookmark', bookmarkData);
      
    } catch (error) {
      console.error('❌ 显示书签右键菜单失败:', error);
      return null;
    }
  }
  
  // ==================== 菜单创建和显示 ====================
  
  /**
   * 创建菜单
   * @param {Event} event - 鼠标事件
   * @param {Array} menuItems - 菜单项配置
   * @param {string} menuType - 菜单类型
   * @param {Object} contextData - 额外的上下文数据
   * @returns {Object} 菜单对象
   */
  createMenu(event, menuItems, menuType, contextData = null) {
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
        const customClass = item.className ? ` ${item.className}` : '';
        
        menuHTML += `
          <div class="context-menu-item ${enabledClass} ${dangerClass}${customClass}" data-action="${item.action}">
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
      contextData: contextData,
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
   * 显示菜单元素
   * @param {Object} menu - 菜单对象
   * @param {Event} event - 鼠标事件
   */
  showMenuElement(menu, event) {
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
      this.handleMenuAction(menu.type, action, menu);
      
      // 隐藏菜单
      menu.hide();
    });
  }
  
  // ==================== 菜单动作处理 ====================
  
  /**
   * 处理菜单动作
   * @param {string} menuType - 菜单类型
   * @param {string} action - 动作类型
   * @param {Object} menu - 菜单对象（包含上下文数据）
   */
  handleMenuAction(menuType, action, menu = null) {
    try {
      console.log(`🎯 处理菜单动作: ${menuType} - ${action}`);
      
      // 根据菜单类型路由到对应的处理器
      switch (menuType) {
        case 'card':
          this.handleCardMenuAction(action, menu);
          break;
          
        case 'frequently-used':
          this.handleFrequentlyUsedMenuAction(action, menu);
          break;
          
        case 'folder':
          this.handleFolderMenuAction(action);
          break;
          
        case 'tab':
          this.handleTabMenuAction(action);
          break;
          
        case 'bookmark':
          this.handleBookmarkMenuAction(action, menu);
          break;
          
        default:
          console.warn(`⚠️ 未知的菜单类型: ${menuType}`);
      }
      
    } catch (error) {
      console.error('❌ 处理菜单动作失败:', error);
    }
  }
  
  /**
   * 处理卡片菜单动作
   * @param {string} action - 动作类型
   * @param {Object} menu - 菜单对象
   */
  handleCardMenuAction(action, menu) {
    if (!this.cardContextMenu) {
      console.warn('⚠️ CardContextMenu不可用');
      return;
    }
    
    this.cardContextMenu.handleMenuAction(action, menu.contextData);
  }
  
  /**
   * 处理常用网页菜单动作
   * @param {string} action - 动作类型
   * @param {Object} menu - 菜单对象
   */
  handleFrequentlyUsedMenuAction(action, menu) {
    if (!this.frequentlyUsedContextMenu) {
      console.warn('⚠️ FrequentlyUsedContextMenu不可用');
      return;
    }
    
    this.frequentlyUsedContextMenu.handleMenuAction(action, menu.contextData);
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
   * 处理书签菜单动作
   * @param {string} action - 动作类型
   * @param {Object} menu - 菜单对象
   */
  handleBookmarkMenuAction(action, menu) {
    if (!menu || !menu.contextData) {
      console.warn('⚠️ 书签上下文数据不可用');
      return;
    }
    
    const bookmarkData = menu.contextData;
    
    switch (action) {
      case 'openNewWindow':
        window.open(bookmarkData.url, '_blank');
        break;
      case 'copyLink':
        navigator.clipboard.writeText(bookmarkData.url).then(() => {
          this.eventBus.emit('notification-requested', {
            message: '链接已复制到剪贴板',
            type: 'success'
          });
        }).catch(() => {
          this.eventBus.emit('notification-requested', {
            message: '复制失败，请手动复制',
            type: 'error'
          });
        });
        break;
      case 'setFrequentlyUsed':
        // 发布设为常用网页事件
        this.eventBus.emit('frequently-used-add-requested', {
          url: bookmarkData.url,
          bookmarkData: bookmarkData
        });
        break;
      case 'edit':
        // 发布编辑书签事件
        this.eventBus.emit('bookmark-edit-requested', {
          bookmarkData: bookmarkData
        });
        break;
      case 'delete':
        // 发布删除书签事件
        this.eventBus.emit('bookmark-delete-requested', {
          bookmarkData: bookmarkData
        });
        break;
      default:
        console.warn(`⚠️ 未知的书签菜单动作: ${action}`);
    }
  }
  
  // ==================== 对话框和确认操作 ====================
  
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
  
  // ==================== 工具方法 ====================
  
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
   * 隐藏指定菜单
   * @param {Object} menu - 菜单对象
   */
  hideMenu(menu) {
    if (menu && menu.hide) {
      menu.hide();
    }
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
  
  // ==================== 生命周期方法 ====================
  
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
    
    // 销毁子菜单管理器
    if (this.cardContextMenu) {
      this.cardContextMenu.destroy();
      this.cardContextMenu = null;
    }
    
    if (this.frequentlyUsedContextMenu) {
      this.frequentlyUsedContextMenu.destroy();
      this.frequentlyUsedContextMenu = null;
    }
    
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