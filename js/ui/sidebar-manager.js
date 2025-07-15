/**
 * SidebarManager - 侧边栏管理器
 * 负责文件夹树的渲染、交互和状态管理
 */
class SidebarManager {
  constructor(eventBus, stateManager, contextMenuManager, bookmarkManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.contextMenuManager = contextMenuManager;
    this.bookmarkManager = bookmarkManager;
    
    // DOM元素引用
    this.folderTreeContainer = null;
    
    // 状态管理
    this.expandedFolders = new Set(); // 运行时缓存的展开状态
    this.selectedFolder = null;
    this.isInitialized = false;
    this.isFirstRender = true; // 标记是否是首次渲染
    
    console.log('🌳 SidebarManager初始化开始...');
    
    // 初始化
    this.init();
    
    console.log('✅ SidebarManager初始化完成');
  }
  
  /**
   * 初始化侧边栏管理器
   */
  init() {
    try {
      // 缓存DOM元素
      this.cacheElements();
      
      // 绑定事件
      this.bindEvents();
      
      // 绑定标题点击事件
      this.bindLogoClickEvent();
      
      // 监听状态变化
      this.setupStateSubscriptions();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ SidebarManager初始化失败:', error);
      throw error;
    }
  }
  


  /**
   * 缓存DOM元素
   */
  cacheElements() {
    this.folderTreeContainer = document.getElementById('folderTree');
    
    if (!this.folderTreeContainer) {
      console.warn('⚠️ 找不到文件夹树容器元素');
    }
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    if (!this.folderTreeContainer) {
      console.warn('⚠️ 文件夹树容器不可用，跳过事件绑定');
      return;
    }
    
    console.log('🔗 绑定文件夹树事件...');
    
    // 文件夹点击事件（委托）
    this.folderTreeContainer.addEventListener('click', (e) => {
      this.handleFolderClick(e);
    });
    
    // 文件夹右键菜单事件（委托）
    this.folderTreeContainer.addEventListener('contextmenu', (e) => {
      this.handleFolderContextMenu(e);
    });
    
    console.log('✅ 文件夹树事件绑定完成');
  }
  
  /**
   * 绑定标题点击事件
   */
  bindLogoClickEvent() {
    const logoElement = document.getElementById('siteLogo');
    if (!logoElement) {
      console.warn('⚠️ 找不到标题元素');
      return;
    }
    
    console.log('🔗 绑定标题点击事件...');
    
    // 为标题添加点击样式
    logoElement.style.cursor = 'pointer';
    logoElement.style.userSelect = 'none';
    
    // 绑定点击事件
    logoElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🖱️ 标题被点击，切换到Dashboard');
      
      // 发布文件夹点击事件，切换到Dashboard
      this.eventBus.emit('folder-clicked', {
        folderId: 'dashboard',
        folderData: {
          id: 'dashboard',
          title: 'Dashboard',
          icon: '📊'
        }
      });
    });
    
    console.log('✅ 标题点击事件绑定完成');
  }
  
  /**
   * 设置状态订阅
   */
  setupStateSubscriptions() {
    console.log('🔗 设置SidebarManager状态订阅...');
    
    // 监听文件夹树数据变化
    this.stateManager.subscribe(['data.folderTree'], ([folderTree]) => {
      if (folderTree && folderTree.length > 0) {
        this.renderFolderTree();
      }
    });
    
    // 监听Tab状态变化
    this.stateManager.subscribe(['tabs.active'], ([activeTab]) => {
      if (activeTab) {
        const [type, instanceId] = activeTab.split(':');
        this.updateSelection(type, instanceId);
      }
    });
    
    console.log('✅ SidebarManager状态订阅完成');
  }
  
  /**
   * 渲染文件夹树
   */
  renderFolderTree() {
    try {
      if (!this.folderTreeContainer) {
        console.warn('⚠️ 文件夹树容器不可用');
        return;
      }
      
      console.log('🌳 开始渲染文件夹树...');
      
      // 清空现有内容
      this.folderTreeContainer.innerHTML = '';
      
      // 从StateManager安全获取文件夹树数据
      const folderTree = this.stateManager?.getStateValue('data.folderTree');
      if (!folderTree || !Array.isArray(folderTree)) {
        console.warn('⚠️ 文件夹树数据不可用或格式不正确');
        this.renderEmptyState();
        return;
      }
      
      // 应用展开状态到文件夹树
      this.applyExpandedStatesBeforeRender(folderTree);
      
      // 渲染文件夹树
      if (folderTree.length > 0) {
        folderTree.forEach(node => {
          if (node) {
            this.renderTreeNode(node, this.folderTreeContainer, 0);
          }
        });
        console.log('✅ 文件夹树渲染完成');
      } else {
        this.renderEmptyState();
        console.log('🌳 文件夹树为空');
      }
      
    } catch (error) {
      console.error('❌ 渲染文件夹树失败:', error);
      this.renderErrorState(error);
    }
  }
  
  /**
   * 在渲染前应用展开状态到文件夹树
   * @param {Array} folderTree - 文件夹树数据
   */
  applyExpandedStatesBeforeRender(folderTree) {
    const traverseAndApplyStates = (nodes) => {
      nodes.forEach(node => {
        if (node && node.id) {
          if (this.isFirstRender) {
            // 首次渲染：使用DataProcessor设置的默认展开状态，并缓存到运行时
            if (node.isExpanded) {
              this.expandedFolders.add(node.id);
            }
          } else {
            // 后续渲染：应用运行时缓存的展开状态
            node.isExpanded = this.expandedFolders.has(node.id);
          }
          
          // 递归处理子节点
          if (node.children && node.children.length > 0) {
            traverseAndApplyStates(node.children);
          }
        }
      });
    };
    
    traverseAndApplyStates(folderTree);
    
    // 如果是首次渲染，标记为已完成首次渲染
    if (this.isFirstRender) {
      this.isFirstRender = false;
      console.log('🌱 首次渲染：已缓存DataProcessor设置的默认展开状态到运行时');
    } else {
      console.log('🔄 已应用运行时缓存的展开状态');
    }
  }
  
  /**
   * 递归渲染树节点
   * @param {Object} node - 节点数据
   * @param {HTMLElement} container - 容器元素
   * @param {number} depth - 层级深度
   */
  renderTreeNode(node, container, depth = 0) {
    // 创建节点元素
    const nodeElement = this.createTreeNodeElement(node, depth);
    container.appendChild(nodeElement);
    
    // 如果有子节点且展开状态，递归渲染子节点
    if (node.children && node.children.length > 0 && node.isExpanded) {
      node.children.forEach(child => {
        this.renderTreeNode(child, container, depth + 1);
      });
    }
  }
  
  /**
   * 创建树节点元素
   * @param {Object} node - 节点数据
   * @param {number} depth - 层级深度
   * @returns {HTMLElement} 节点元素
   */
  createTreeNodeElement(node, depth = 0) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    item.dataset.folderId = node.id;
    item.dataset.depth = depth;
    item.style.paddingLeft = `${depth * 20 + 12}px`;
    
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.isExpanded || false;
    
    item.innerHTML = `
      <div class="tree-content">
        ${hasChildren ? 
          `<span class="tree-toggle ${isExpanded ? 'expanded' : ''}" data-folder-id="${node.id}">▶</span>` : 
          '<span class="tree-spacer" style="width: 20px; display: inline-block;"></span>'
        }
        <span class="tree-icon">${node.icon}</span>
        <span class="tree-title">${node.title}</span>
        <span class="bookmark-count">${node.bookmarkCount || 0}</span>
      </div>
    `;
    
    return item;
  }
  

  
  /**
   * 渲染空状态
   */
  renderEmptyState() {
    const emptyNode = document.createElement('div');
    emptyNode.className = 'empty-tree';
    emptyNode.innerHTML = '<div class="empty-tree-message">暂无文件夹数据</div>';
    this.folderTreeContainer.appendChild(emptyNode);
  }
  
  /**
   * 渲染错误状态
   * @param {Error} error - 错误对象
   */
  renderErrorState(error) {
    const errorNode = document.createElement('div');
    errorNode.className = 'error-tree';
    errorNode.innerHTML = `
      <div class="error-tree-message">
        <div class="error-icon">😿</div>
        <div class="error-text">加载文件夹失败</div>
        <div class="error-detail">${error.message}</div>
      </div>
    `;
    this.folderTreeContainer.appendChild(errorNode);
  }
  
  /**
   * 处理文件夹点击事件
   * @param {Event} e - 点击事件
   */
  handleFolderClick(e) {
    // 如果点击的是展开/折叠按钮，处理展开/折叠
    const toggle = e.target.closest('.tree-toggle');
    if (toggle) {
      e.stopPropagation();
      e.preventDefault();
      const folderId = toggle.dataset.folderId;
      this.toggleTreeNode(folderId);
      return;
    }
    
    // 处理文件夹点击
    const treeItem = e.target.closest('.tree-item');
    if (!treeItem) return;
    
    const folderId = treeItem.dataset.folderId;
    console.log(`🖱️ 点击文件夹: ${folderId}`);
    
    // 发布文件夹点击事件
    this.eventBus.emit('folder-clicked', {
      folderId,
      folderData: this.getFolderData(folderId)
    });
  }
  
  /**
   * 处理文件夹右键菜单事件
   * @param {Event} e - 右键事件
   */
  handleFolderContextMenu(e) {
    const treeItem = e.target.closest('.tree-item');
    if (!treeItem) return;
    
    const folderId = treeItem.dataset.folderId;
    
    // Dashboard和"全部"不显示右键菜单
    if (folderId === 'dashboard' || folderId === 'all') {
      return;
    }
    
    e.preventDefault();
    
    // 获取文件夹数据
    const folderData = this.getFolderData(folderId);
    if (!folderData) {
      console.warn(`🐱 无法找到文件夹数据: ${folderId}`);
      return;
    }
    
    // 显示右键菜单
    if (this.contextMenuManager) {
      this.contextMenuManager.showFolderMenu(e, folderId, folderData);
    }
  }
  
  /**
   * 切换树节点展开/折叠状态
   * @param {string} folderId - 文件夹ID
   */
  toggleTreeNode(folderId) {
    try {
      console.log(`🔄 切换文件夹展开状态: ${folderId}`);
      
      // 直接从folderTree中查找真正的节点对象
      const folderTree = this.stateManager?.getStateValue('data.folderTree');
      if (!folderTree || !Array.isArray(folderTree)) {
        console.warn(`🐱 文件夹树数据不可用或格式不正确`);
        this.eventBus.emit('notification-requested', {
          message: '无法展开/折叠文件夹，数据不可用',
          type: 'error'
        });
        return;
      }
      
      // 在folderTree中递归查找目标节点
      const findNodeInTree = (nodes, targetId) => {
        for (const node of nodes) {
          if (node.id === targetId) {
            return node;
          }
          if (node.children && node.children.length > 0) {
            const found = findNodeInTree(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      
      const folder = findNodeInTree(folderTree, folderId);
      if (!folder) {
        console.warn(`🐱 在文件夹树中找不到节点: ${folderId}`);
        this.eventBus.emit('notification-requested', {
          message: '无法找到此文件夹的数据',
          type: 'error'
        });
        return;
      }
      
      // 检查是否有子节点
      if (!folder.children || folder.children.length === 0) {
        console.log(`📁 文件夹 ${folder.title} 没有子节点`);
        return;
      }
      
      console.log(`📁 文件夹 ${folder.title} 有 ${folder.children.length} 个子节点`);
      
      // 获取当前激活的Tab信息（用于恢复选中状态）
      const activeTab = this.stateManager?.getStateValue('tabs.active');
      
      // 切换展开状态（现在操作的是真正的folderTree节点）
      folder.isExpanded = !folder.isExpanded;
      
      // 更新展开状态集合
      if (folder.isExpanded) {
        this.expandedFolders.add(folderId);
      } else {
        this.expandedFolders.delete(folderId);
      }
      
      // 重新渲染文件夹树
      this.renderFolderTree();
      
      // 恢复Tab选中状态
      if (activeTab) {
        const [type, instanceId] = activeTab.split(':');
        this.updateSelection(type, instanceId);
      }
      
      // 更新运行时展开状态缓存
      this.updateExpandedStatesCache();
      
      console.log(`✅ 文件夹 ${folder.title} 展开状态: ${folder.isExpanded ? '展开' : '折叠'}`);
      
    } catch (error) {
      console.error('❌ 切换文件夹展开状态失败:', error);
      this.eventBus.emit('notification-requested', {
        message: '操作文件夹时发生错误',
        type: 'error'
      });
    }
  }
  
  /**
   * 更新文件夹树选择状态
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID
   */
  updateSelection(type, instanceId) {
    try {
      console.log(`🎯 更新文件夹树选择状态: ${type} - ${instanceId}`);
      
      // 移除所有选中状态
      const allItems = document.querySelectorAll('.tree-item');
      allItems.forEach(item => item.classList.remove('active'));
      
      // 根据Tab类型和实例ID设置选中状态
      if (type === 'bookmark') {
        // 选中对应的文件夹
        const folderItem = document.querySelector(`.tree-item[data-folder-id="${instanceId}"]`);
        if (folderItem) {
          folderItem.classList.add('active');
          
          // 确保父文件夹都展开
          this.ensureParentFoldersExpanded(folderItem);
        }
      }
      // 注意：移除了Dashboard类型的选择处理，因为Dashboard不再在文件夹树中
      
      this.selectedFolder = instanceId;
      
    } catch (error) {
      console.warn('⚠️ 更新文件夹树选择状态失败:', error);
    }
  }
  
  /**
   * 确保父文件夹都展开
   * @param {HTMLElement} folderItem - 文件夹元素
   */
  ensureParentFoldersExpanded(folderItem) {
    let parent = folderItem.parentElement.closest('.tree-item');
    while (parent) {
      const toggle = parent.querySelector('.tree-toggle');
      if (toggle && !parent.classList.contains('expanded')) {
        // 触发展开
        const folderId = parent.dataset.folderId;
        if (folderId) {
          this.toggleTreeNode(folderId);
        }
      }
      parent = parent.parentElement.closest('.tree-item');
    }
  }
  
  /**
   * 获取文件夹数据
   * @param {string} folderId - 文件夹ID
   * @returns {Object|null} 文件夹数据
   */
  getFolderData(folderId) {
    try {
      const folderMap = this.stateManager?.getStateValue('data.folderMap');
      if (!folderMap || !(folderMap instanceof Map)) {
        console.warn(`🐱 文件夹映射表不可用或格式不正确`);
        return null;
      }

      // 安全获取folderData
      let folderData = folderMap.get(folderId);

      // 如果在folderMap中找不到，尝试从bookmarkManager的缓存中获取
      if (!folderData && this.bookmarkManager && this.bookmarkManager.cache) {
        // 尝试从原始的folderMap获取
        const originalFolderMap = this.bookmarkManager.cache.folderMap;
        if (originalFolderMap && originalFolderMap[folderId]) {
          const originalData = originalFolderMap[folderId];
          folderData = {
            id: folderId,
            title: originalData.title || '未知文件夹',
            parentId: originalData.parentId,
            bookmarkCount: originalData.bookmarkCount || 0,
            path: originalData.path,
            dateAdded: originalData.dateAdded,
            children: [],
            isExpanded: false,
            icon: '📁'
          };
        }
        
        // 尝试从tree中查找
        if (!folderData && this.bookmarkManager.cache.tree) {
          const findInTree = (nodes) => {
            for (const node of nodes) {
              if (node.id === folderId) {
                return {
                  id: node.id,
                  title: node.title || '未知文件夹',
                  parentId: node.parentId,
                  bookmarkCount: 0,
                  children: node.children || [],
                  isExpanded: false,
                  icon: '📁'
                };
              }
              if (node.children) {
                const found = findInTree(node.children);
                if (found) return found;
              }
            }
            return null;
          };
          
          folderData = findInTree(this.bookmarkManager.cache.tree);
        }
      }

      return folderData;
    } catch (error) {
      console.error('❌ 获取文件夹数据失败:', error);
      return null;
    }
  }
  
  /**
   * 更新运行时展开状态缓存
   */
  updateExpandedStatesCache() {
    try {
      const folderTree = this.stateManager?.getStateValue('data.folderTree');
      if (!folderTree) return;
      
      // 从文件夹树中收集当前展开的节点ID
      const currentExpandedIds = new Set();
      const traverseTree = (nodes) => {
        nodes.forEach(node => {
          if (node.isExpanded) {
            currentExpandedIds.add(node.id);
          }
          if (node.children && node.children.length > 0) {
            traverseTree(node.children);
          }
        });
      };
      
      traverseTree(folderTree);
      
      // 更新运行时缓存
      this.expandedFolders = currentExpandedIds;
      
      console.log('💾 运行时展开状态缓存已更新');
      
    } catch (error) {
      console.warn('⚠️ 更新展开状态缓存失败:', error);
    }
  }
  

  
  /**
   * 主题变更处理
   * @param {string} theme - 主题名称
   */
  onThemeChange(theme) {
    console.log(`🎨 SidebarManager主题变更: ${theme}`);
    // 可以在这里实现主题相关的UI更新
  }
  
  /**
   * 窗口大小变化处理
   */
  onWindowResize() {
    console.log('📏 SidebarManager处理窗口大小变化');
    // 可以在这里实现窗口大小变化相关的UI调整
  }
  
  /**
   * 加载状态变更处理
   * @param {boolean} loading - 是否加载中
   */
  onLoadingStateChange(loading) {
    console.log(`⏳ SidebarManager加载状态变更: ${loading}`);
    
    if (this.folderTreeContainer) {
      if (loading) {
        this.folderTreeContainer.classList.add('loading');
      } else {
        this.folderTreeContainer.classList.remove('loading');
      }
    }
  }
  
  /**
   * 清理资源
   */
  destroy() {
    console.log('🧹 清理SidebarManager资源...');
    
    // 清理事件监听器
    if (this.folderTreeContainer) {
      this.folderTreeContainer.innerHTML = '';
    }
    
    // 清理引用
    this.folderTreeContainer = null;
    this.expandedFolders.clear();
    this.selectedFolder = null;
    
    this.isInitialized = false;
    
    console.log('✅ SidebarManager资源清理完成');
  }
}

// 导出SidebarManager类
window.SidebarManager = SidebarManager; 