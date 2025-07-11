/**
 * FavoriteBoard - 文件夹服务
 * 负责：文件夹增删改、权限检查、数据验证
 * 
 * @author JupiterTheWarlock
 * @description 文件夹业务逻辑封装，提供文件夹操作的统一接口 🐱
 */

/**
 * 文件夹服务 - 文件夹业务逻辑
 * 处理文件夹的创建、重命名、删除等操作
 */
class FolderService {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.dataManager = null;
    this.appConfig = null;
    this.uiManager = null;
    
    // 文件夹操作状态
    this.operationStates = {
      creating: false,
      renaming: false,
      deleting: false
    };
    
    // 文件夹验证规则
    this.validationRules = {
      nameMinLength: 1,
      nameMaxLength: 255,
      forbiddenNames: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'],
      forbiddenChars: /[<>:"/\\|?*\x00-\x1f]/g,
      leadingTrailingSpaces: /^\s+|\s+$/g
    };
    
    // 权限管理
    this.permissions = {
      canCreateFolder: true,
      canRenameFolder: true,
      canDeleteFolder: true,
      canDeleteRootFolder: false
    };
    
    console.log('📁 文件夹服务初始化 🐱');
  }
  
  /**
   * 初始化文件夹服务
   */
  async init() {
    try {
      console.log('🚀 文件夹服务开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.dataManager = this.container.get('dataManager');
      this.appConfig = this.container.get('appConfig');
      this.uiManager = this.container.get('uiManager');
      
      // 应用配置
      this._applyConfig();
      
      // 绑定事件
      this._bindEvents();
      
      console.log('✅ 文件夹服务初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ 文件夹服务初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 应用配置
   * @private
   */
  _applyConfig() {
    if (this.appConfig) {
      // 获取文件夹相关配置
      const folderConfig = this.appConfig.folderTree || {};
      
      // 更新验证规则
      if (folderConfig.nameMaxLength) {
        this.validationRules.nameMaxLength = folderConfig.nameMaxLength;
      }
      
      // 更新权限设置
      const experimentalConfig = this.appConfig.experimental || {};
      this.permissions.canDeleteRootFolder = experimentalConfig.allowDeleteRootFolder || false;
    }
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.eventManager) return;
    
    // 监听文件夹操作请求
    this.eventManager.on('folder:create', async (data) => {
      console.log('📁 接收到文件夹创建请求 🐱', data);
      await this.createSubfolder(data.parentId, data.title);
    });
    
    this.eventManager.on('folder:rename', async (data) => {
      console.log('📁 接收到文件夹重命名请求 🐱', data);
      await this.renameFolder(data.folderId, data.newTitle);
    });
    
    this.eventManager.on('folder:delete', async (data) => {
      console.log('📁 接收到文件夹删除请求 🐱', data);
      await this.deleteFolder(data.folderId);
    });
    
    // 监听配置更改
    this.eventManager.on('config:changed', (data) => {
      if (data.path && (data.path.startsWith('folderTree.') || data.path.startsWith('experimental.'))) {
        console.log('⚙️ 文件夹相关配置更改，重新应用配置 🐱');
        this._applyConfig();
      }
    });
  }
  
  /**
   * 创建子文件夹
   * @param {string} parentId - 父文件夹ID
   * @param {string} title - 文件夹名称
   * @returns {Promise<Object>} 创建的文件夹对象
   */
  async createSubfolder(parentId, title) {
    if (this.operationStates.creating) {
      throw new Error('正在创建文件夹中，请稍候...');
    }
    
    this.operationStates.creating = true;
    
    try {
      console.log(`📁 开始创建子文件夹: ${title} in ${parentId} 🐱`);
      
      // 发布操作开始事件
      this.eventManager.emit('folder:createStart', {
        parentId,
        title,
        timestamp: Date.now()
      });
      
      // 验证权限
      this._checkPermission('create', parentId);
      
      // 验证父文件夹
      await this._validateParentFolder(parentId);
      
      // 验证文件夹名称
      this._validateFolderName(title);
      
      // 检查同名文件夹
      await this._checkDuplicateName(parentId, title);
      
      // 执行创建操作
      const folder = await this._executeCreateFolder(parentId, title);
      
      // 发布操作成功事件
      this.eventManager.emit('folder:createSuccess', {
        parentId,
        title,
        folder,
        timestamp: Date.now()
      });
      
      // 显示成功通知
      this.uiManager?.showNotification('文件夹创建成功', 'success');
      
      console.log('✅ 文件夹创建成功:', folder, '🐱');
      
      // 触发数据刷新
      await this._refreshData('创建文件夹');
      
      return folder;
      
    } catch (error) {
      console.error('❌ 创建文件夹失败:', error);
      
      // 发布操作失败事件
      this.eventManager.emit('folder:createFailed', {
        parentId,
        title,
        error: error.message,
        timestamp: Date.now()
      });
      
      // 显示错误通知
      this.uiManager?.showNotification(`创建文件夹失败: ${error.message}`, 'error');
      
      throw error;
      
    } finally {
      this.operationStates.creating = false;
    }
  }
  
  /**
   * 重命名文件夹
   * @param {string} folderId - 文件夹ID
   * @param {string} newTitle - 新名称
   * @returns {Promise<Object>} 更新结果
   */
  async renameFolder(folderId, newTitle) {
    if (this.operationStates.renaming) {
      throw new Error('正在重命名文件夹中，请稍候...');
    }
    
    this.operationStates.renaming = true;
    
    try {
      console.log(`📁 开始重命名文件夹: ${folderId} -> ${newTitle} 🐱`);
      
      // 发布操作开始事件
      this.eventManager.emit('folder:renameStart', {
        folderId,
        newTitle,
        timestamp: Date.now()
      });
      
      // 验证权限
      this._checkPermission('rename', folderId);
      
      // 获取文件夹信息
      const folderInfo = await this._getFolderInfo(folderId);
      const oldTitle = folderInfo.title;
      
      // 检查名称是否有变化
      if (newTitle.trim() === oldTitle) {
        this.uiManager?.showNotification('文件夹名称没有变化', 'info');
        return { success: true, noChange: true };
      }
      
      // 验证文件夹名称
      this._validateFolderName(newTitle);
      
      // 检查同名文件夹
      await this._checkDuplicateName(folderInfo.parentId, newTitle, folderId);
      
      // 执行重命名操作
      const result = await this._executeRenameFolder(folderId, newTitle);
      
      // 发布操作成功事件
      this.eventManager.emit('folder:renameSuccess', {
        folderId,
        oldTitle,
        newTitle,
        result,
        timestamp: Date.now()
      });
      
      // 显示成功通知
      this.uiManager?.showNotification('文件夹重命名成功', 'success');
      
      console.log('✅ 文件夹重命名成功 🐱');
      
      // 触发数据刷新
      await this._refreshData('重命名文件夹');
      
      return result;
      
    } catch (error) {
      console.error('❌ 重命名文件夹失败:', error);
      
      // 发布操作失败事件
      this.eventManager.emit('folder:renameFailed', {
        folderId,
        newTitle,
        error: error.message,
        timestamp: Date.now()
      });
      
      // 显示错误通知
      this.uiManager?.showNotification(`重命名文件夹失败: ${error.message}`, 'error');
      
      throw error;
      
    } finally {
      this.operationStates.renaming = false;
    }
  }
  
  /**
   * 删除文件夹
   * @param {string} folderId - 文件夹ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteFolder(folderId) {
    if (this.operationStates.deleting) {
      throw new Error('正在删除文件夹中，请稍候...');
    }
    
    this.operationStates.deleting = true;
    
    try {
      console.log(`📁 开始删除文件夹: ${folderId} 🐱`);
      
      // 发布操作开始事件
      this.eventManager.emit('folder:deleteStart', {
        folderId,
        timestamp: Date.now()
      });
      
      // 验证权限
      this._checkPermission('delete', folderId);
      
      // 获取文件夹信息
      const folderInfo = await this._getFolderInfo(folderId);
      
      // 检查是否为根文件夹
      const isRootFolder = this._isRootFolder(folderInfo);
      if (isRootFolder && !this.permissions.canDeleteRootFolder) {
        throw new Error('无法删除根文件夹');
      }
      
      // 获取文件夹统计信息
      const stats = this._getFolderStats(folderInfo);
      
      // 执行删除操作
      const result = await this._executeDeleteFolder(folderId);
      
      // 发布操作成功事件
      this.eventManager.emit('folder:deleteSuccess', {
        folderId,
        folderInfo,
        stats,
        result,
        timestamp: Date.now()
      });
      
      // 显示成功通知
      this.uiManager?.showNotification('文件夹删除成功', 'success');
      
      console.log('✅ 文件夹删除成功 🐱');
      
      // 如果当前显示的是被删除的文件夹，切换到Dashboard
      await this._handleDeletedFolderTab(folderId);
      
      // 触发数据刷新
      await this._refreshData('删除文件夹');
      
      return result;
      
    } catch (error) {
      console.error('❌ 删除文件夹失败:', error);
      
      // 发布操作失败事件
      this.eventManager.emit('folder:deleteFailed', {
        folderId,
        error: error.message,
        timestamp: Date.now()
      });
      
      // 显示错误通知
      this.uiManager?.showNotification(`删除文件夹失败: ${error.message}`, 'error');
      
      throw error;
      
    } finally {
      this.operationStates.deleting = false;
    }
  }
  
  /**
   * 验证文件夹名称
   * @param {string} name - 文件夹名称
   * @throws {Error} 验证失败时抛出错误
   */
  _validateFolderName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('文件夹名称不能为空');
    }
    
    const trimmedName = name.trim();
    
    // 检查长度
    if (trimmedName.length < this.validationRules.nameMinLength) {
      throw new Error('文件夹名称不能为空');
    }
    
    if (trimmedName.length > this.validationRules.nameMaxLength) {
      throw new Error(`文件夹名称不能超过 ${this.validationRules.nameMaxLength} 个字符`);
    }
    
    // 检查禁用字符
    if (this.validationRules.forbiddenChars.test(trimmedName)) {
      throw new Error('文件夹名称包含非法字符');
    }
    
    // 检查系统保留名称
    if (this.validationRules.forbiddenNames.includes(trimmedName.toUpperCase())) {
      throw new Error('文件夹名称不能使用系统保留名称');
    }
    
    // 检查前后空格
    if (trimmedName !== name) {
      throw new Error('文件夹名称前后不能有空格');
    }
  }
  
  /**
   * 检查权限
   * @private
   * @param {string} action - 操作类型
   * @param {string} folderId - 文件夹ID
   * @throws {Error} 权限不足时抛出错误
   */
  _checkPermission(action, folderId) {
    const permissionMap = {
      'create': 'canCreateFolder',
      'rename': 'canRenameFolder',
      'delete': 'canDeleteFolder'
    };
    
    const permission = permissionMap[action];
    if (permission && !this.permissions[permission]) {
      throw new Error(`没有${action}文件夹的权限`);
    }
  }
  
  /**
   * 验证父文件夹
   * @private
   * @param {string} parentId
   * @throws {Error} 验证失败时抛出错误
   */
  async _validateParentFolder(parentId) {
    if (!parentId) {
      throw new Error('父文件夹ID不能为空');
    }
    
    const parentFolder = this.dataManager.getFolder(parentId);
    if (!parentFolder) {
      throw new Error('父文件夹不存在');
    }
  }
  
  /**
   * 检查重名文件夹
   * @private
   * @param {string} parentId
   * @param {string} name
   * @param {string} excludeId - 排除的文件夹ID（用于重命名）
   * @throws {Error} 发现重名时抛出错误
   */
  async _checkDuplicateName(parentId, name, excludeId = null) {
    const parentFolder = this.dataManager.getFolder(parentId);
    if (!parentFolder || !parentFolder.children) {
      return;
    }
    
    const duplicateChild = parentFolder.children.find(child => 
      child.title === name.trim() && child.id !== excludeId
    );
    
    if (duplicateChild) {
      throw new Error('已存在同名文件夹');
    }
  }
  
  /**
   * 获取文件夹信息
   * @private
   * @param {string} folderId
   * @returns {Promise<Object>}
   * @throws {Error} 文件夹不存在时抛出错误
   */
  async _getFolderInfo(folderId) {
    const folder = this.dataManager.getFolder(folderId);
    if (!folder) {
      // 尝试从BookmarkManager获取
      const bookmarkManager = this.dataManager.getBookmarkManager();
      const folderInfo = await bookmarkManager.getFolder(folderId);
      if (!folderInfo) {
        throw new Error('文件夹不存在');
      }
      return folderInfo;
    }
    return folder;
  }
  
  /**
   * 检查是否为根文件夹
   * @private
   * @param {Object} folderInfo
   * @returns {boolean}
   */
  _isRootFolder(folderInfo) {
    // 检查是否为顶级文件夹（书签栏直接子文件夹）
    const bookmarkManager = this.dataManager.getBookmarkManager();
    const tree = bookmarkManager.cache?.tree || [];
    
    for (const rootNode of tree) {
      if (rootNode.children) {
        const isRootChild = rootNode.children.some(child => child.id === folderInfo.id);
        if (isRootChild) return true;
      }
    }
    
    return false;
  }
  
  /**
   * 获取文件夹统计信息
   * @private
   * @param {Object} folderInfo
   * @returns {Object}
   */
  _getFolderStats(folderInfo) {
    return {
      bookmarkCount: folderInfo.bookmarkCount || 0,
      hasSubfolders: folderInfo.children && folderInfo.children.length > 0,
      subfolderCount: folderInfo.children ? folderInfo.children.length : 0
    };
  }
  
  /**
   * 执行创建文件夹操作
   * @private
   * @param {string} parentId
   * @param {string} title
   * @returns {Promise<Object>}
   */
  async _executeCreateFolder(parentId, title) {
    const bookmarkManager = this.dataManager.getBookmarkManager();
    
    const response = await bookmarkManager.sendMessage({
      action: 'createFolder',
      parentId: parentId,
      title: title.trim()
    });
    
    if (!response.success) {
      throw new Error(response.error || '创建文件夹失败');
    }
    
    return response.folder;
  }
  
  /**
   * 执行重命名文件夹操作
   * @private
   * @param {string} folderId
   * @param {string} newTitle
   * @returns {Promise<Object>}
   */
  async _executeRenameFolder(folderId, newTitle) {
    const bookmarkManager = this.dataManager.getBookmarkManager();
    
    const response = await bookmarkManager.sendMessage({
      action: 'renameFolder',
      folderId: folderId,
      title: newTitle.trim()
    });
    
    if (!response.success) {
      throw new Error(response.error || '重命名文件夹失败');
    }
    
    return response;
  }
  
  /**
   * 执行删除文件夹操作
   * @private
   * @param {string} folderId
   * @returns {Promise<Object>}
   */
  async _executeDeleteFolder(folderId) {
    const bookmarkManager = this.dataManager.getBookmarkManager();
    
    const response = await bookmarkManager.sendMessage({
      action: 'deleteFolder',
      folderId: folderId
    });
    
    if (!response.success) {
      throw new Error(response.error || '删除文件夹失败');
    }
    
    return response;
  }
  
  /**
   * 处理被删除文件夹的Tab
   * @private
   * @param {string} folderId
   */
  async _handleDeletedFolderTab(folderId) {
    // 通过事件系统通知Tab管理器处理
    this.eventManager.emit('tab:handleDeletedFolder', {
      folderId,
      timestamp: Date.now()
    });
  }
  
  /**
   * 刷新数据
   * @private
   * @param {string} reason
   */
  async _refreshData(reason) {
    console.log(`🔄 ${reason}后刷新数据 🐱`);
    
    // 延迟一点时间让Chrome更新缓存
    setTimeout(async () => {
      try {
        await this.dataManager.refresh();
        console.log('✅ 数据刷新完成 🐱');
      } catch (error) {
        console.error('❌ 数据刷新失败:', error);
      }
    }, 100);
  }
  
  // ==================== 公共API ====================
  
  /**
   * 验证文件夹名称（公共方法）
   * @param {string} name - 文件夹名称
   * @returns {Object} 验证结果
   */
  validateFolderName(name) {
    try {
      this._validateFolderName(name);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * 检查权限（公共方法）
   * @param {string} action - 操作类型
   * @param {string} folderId - 文件夹ID
   * @returns {boolean}
   */
  checkPermission(action, folderId) {
    try {
      this._checkPermission(action, folderId);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 获取文件夹统计信息（公共方法）
   * @param {string} folderId - 文件夹ID
   * @returns {Object|null}
   */
  getFolderStats(folderId) {
    try {
      const folderInfo = this.dataManager.getFolder(folderId);
      if (!folderInfo) return null;
      
      return this._getFolderStats(folderInfo);
    } catch (error) {
      console.error('❌ 获取文件夹统计失败:', error);
      return null;
    }
  }
  
  /**
   * 获取操作状态
   * @returns {Object}
   */
  getOperationStates() {
    return { ...this.operationStates };
  }
  
  /**
   * 获取权限设置
   * @returns {Object}
   */
  getPermissions() {
    return { ...this.permissions };
  }
  
  /**
   * 获取验证规则
   * @returns {Object}
   */
  getValidationRules() {
    return { ...this.validationRules };
  }
  
  /**
   * 设置权限
   * @param {string} permission - 权限名称
   * @param {boolean} enabled - 是否启用
   */
  setPermission(permission, enabled) {
    if (this.permissions.hasOwnProperty(permission)) {
      this.permissions[permission] = enabled;
      
      // 发布权限更改事件
      this.eventManager.emit('folder:permissionChanged', {
        permission,
        enabled,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * 显示创建子文件夹对话框
   * @param {Object} parentFolderData - 父文件夹数据
   */
  showCreateSubfolderDialog(parentFolderData) {
    // 通过事件系统触发UI显示
    this.eventManager.emit('dialog:showCreateFolder', {
      parentFolderData,
      timestamp: Date.now()
    });
  }
  
  /**
   * 显示重命名文件夹对话框
   * @param {Object} folderData - 文件夹数据
   */
  showRenameFolderDialog(folderData) {
    // 通过事件系统触发UI显示
    this.eventManager.emit('dialog:showRenameFolder', {
      folderData,
      timestamp: Date.now()
    });
  }
  
  /**
   * 显示删除文件夹确认对话框
   * @param {Object} folderData - 文件夹数据
   */
  showDeleteFolderConfirmation(folderData) {
    // 通过事件系统触发UI显示
    this.eventManager.emit('dialog:showDeleteFolder', {
      folderData,
      timestamp: Date.now()
    });
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('📁 文件夹服务开始销毁 🐱');
    
    // 重置操作状态
    this.operationStates = {
      creating: false,
      renaming: false,
      deleting: false
    };
    
    console.log('📁 文件夹服务销毁完成 🐱');
  }
}

// 导出文件夹服务类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = FolderService;
} else {
  // 浏览器环境
  window.FolderService = FolderService;
} 