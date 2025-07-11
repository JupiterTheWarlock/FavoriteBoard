/**
 * FavoriteBoard - 文件夹树组件
 * 负责：文件夹树渲染、交互处理、状态同步
 * 
 * @author JupiterTheWarlock
 * @description 可复用的文件夹树组件，支持展开/折叠、选中状态、右键菜单 🐱
 */

/**
 * 文件夹树组件 - 可复用的文件夹树UI组件
 * 负责文件夹树的渲染、交互和状态管理
 */
class FolderTreeComponent {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.dataManager = null;
    this.uiManager = null;
    this.appConfig = null;
    
    // 组件状态
    this.state = {
      folderTree: [],
      folderMap: new Map(),
      expandedNodes: new Set(),
      selectedNode: null,
      isRendering: false
    };
    
    // DOM元素
    this.elements = {
      container: null,
      tree: null
    };
    
    // 配置选项
    this.config = {
      showDashboard: true,
      showAllFolder: true,
      autoExpand: true,
      saveExpandedState: true,
      enableContextMenu: true,
      enableDragDrop: false,
      maxDepth: 10,
      animationDuration: 200
    };
    
    // 事件绑定标记
    this.eventsBound = false;
    
    console.log('🌳 文件夹树组件初始化 🐱');
  }
  
  /**
   * 初始化组件
   */
  async init() {
    try {
      console.log('🚀 文件夹树组件开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.dataManager = this.container.get('dataManager');
      this.uiManager = this.container.get('uiManager');
      this.appConfig = this.container.get('appConfig');
      
      // 应用配置
      this._applyConfig();
      
      // 绑定事件
      this._bindEvents();
      
      console.log('✅ 文件夹树组件初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ 文件夹树组件初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 应用配置
   * @private
   */
  _applyConfig() {
    if (this.appConfig?.folderTree) {
      Object.assign(this.config, this.appConfig.folderTree);
    }
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.eventManager) return;
    
    // 监听数据更新
    this.eventManager.on('data:loaded', (data) => {
      console.log('🌳 接收到数据更新，重新渲染树 🐱');
      this._updateTreeData(data.newState || data);
    });
    
    this.eventManager.on('data:stateChanged', (data) => {
      console.log('🌳 接收到状态变化，更新树数据 🐱');
      this._updateTreeData(data.newState);
    });
    
    // 监听选中节点变化
    this.eventManager.on('tab:switchComplete', (data) => {
      console.log('🌳 Tab切换完成，更新选中状态 🐱');
      this._updateSelection(data.type, data.instanceId);
    });
    
    // 监听配置变化
    this.eventManager.on('config:changed', (data) => {
      if (data.path && data.path.startsWith('folderTree.')) {
        console.log('⚙️ 文件夹树配置更改，重新应用配置 🐱');
        this._applyConfig();
      }
    });
  }
  
  /**
   * 渲染组件到指定容器
   * @param {HTMLElement|string} containerElement - 容器元素或选择器
   */
  render(containerElement) {
    try {
      // 获取容器元素
      if (typeof containerElement === 'string') {
        this.elements.container = document.querySelector(containerElement);
      } else {
        this.elements.container = containerElement;
      }
      
      if (!this.elements.container) {
        throw new Error('找不到容器元素');
      }
      
      console.log('🌳 开始渲染文件夹树 🐱');
      
      // 清空容器
      this.elements.container.innerHTML = '';
      
      // 创建树容器
      this.elements.tree = document.createElement('div');
      this.elements.tree.className = 'folder-tree-container';
      this.elements.tree.id = 'folderTreeContainer';
      
      // 渲染树内容
      this._renderTreeContent();
      
      // 添加到容器
      this.elements.container.appendChild(this.elements.tree);
      
      // 绑定DOM事件（只绑定一次）
      if (!this.eventsBound) {
        this._bindDOMEvents();
        this.eventsBound = true;
      }
      
      console.log('✅ 文件夹树渲染完成 🐱');
      
    } catch (error) {
      console.error('❌ 文件夹树渲染失败:', error);
      throw error;
    }
  }
  
  /**
   * 渲染树内容
   * @private
   */
  _renderTreeContent() {
    if (this.state.isRendering) {
      console.log('⏳ 文件夹树正在渲染中，跳过重复渲染 🐱');
      return;
    }
    
    this.state.isRendering = true;
    
    try {
      // 清空树容器
      this.elements.tree.innerHTML = '';
      
      // 添加Dashboard节点
      if (this.config.showDashboard) {
        const dashboardNode = this._createDashboardNode();
        this.elements.tree.appendChild(dashboardNode);
      }
      
      // 添加全部收藏节点
      if (this.config.showAllFolder && this.state.folderTree.length > 0) {
        const allNode = this.state.folderTree.find(node => node.id === 'all');
        if (allNode) {
          const allNodeElement = this._createTreeNodeElement(allNode, 0);
          this.elements.tree.appendChild(allNodeElement);
        }
      }
      
      // 渲染文件夹树
      this.state.folderTree.forEach(node => {
        if (node.id !== 'all') { // 跳过已经渲染的全部收藏节点
          this._renderTreeNode(node, this.elements.tree, 0);
        }
      });
      
    } finally {
      this.state.isRendering = false;
    }
  }
  
  /**
   * 创建Dashboard节点
   * @private
   * @returns {HTMLElement}
   */
  _createDashboardNode() {
    const dashboardNode = document.createElement('div');
    dashboardNode.className = 'tree-item dashboard-item';
    dashboardNode.dataset.folderId = 'dashboard';
    dashboardNode.dataset.depth = '0';
    dashboardNode.style.paddingLeft = '12px';
    
    dashboardNode.innerHTML = `
      <div class="tree-content">
        <span class="tree-spacer" style="width: 20px; display: inline-block;"></span>
        <span class="tree-icon">🏠</span>
        <span class="tree-title">仪表板</span>
        <span class="bookmark-count">-</span>
      </div>
    `;
    
    return dashboardNode;
  }
  
  /**
   * 递归渲染树节点
   * @private
   * @param {Object} node - 节点数据
   * @param {HTMLElement} container - 容器元素
   * @param {number} depth - 层级深度
   */
  _renderTreeNode(node, container, depth = 0) {
    // 创建节点元素
    const nodeElement = this._createTreeNodeElement(node, depth);
    container.appendChild(nodeElement);
    
    // 如果有子节点且展开状态，递归渲染子节点
    if (node.children && node.children.length > 0 && this._isNodeExpanded(node.id)) {
      node.children.forEach(child => {
        this._renderTreeNode(child, container, depth + 1);
      });
    }
  }
  
  /**
   * 创建树节点元素
   * @private
   * @param {Object} node - 节点数据
   * @param {number} depth - 层级深度
   * @returns {HTMLElement}
   */
  _createTreeNodeElement(node, depth = 0) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    item.dataset.folderId = node.id;
    item.dataset.depth = depth;
    item.style.paddingLeft = `${depth * 20 + 12}px`;
    
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = this._isNodeExpanded(node.id);
    
    item.innerHTML = `
      <div class="tree-content">
        ${hasChildren ? 
          `<span class="tree-toggle ${isExpanded ? 'expanded' : ''}" data-folder-id="${node.id}">▶</span>` : 
          '<span class="tree-spacer" style="width: 20px; display: inline-block;"></span>'
        }
        <span class="tree-icon">${node.icon || '📁'}</span>
        <span class="tree-title">${this._escapeHtml(node.title)}</span>
        <span class="bookmark-count">${node.bookmarkCount || 0}</span>
      </div>
    `;
    
    return item;
  }
  
  /**
   * 绑定DOM事件
   * @private
   */
  _bindDOMEvents() {
    if (!this.elements.tree) return;
    
    // 使用事件委托处理点击事件
    this.elements.tree.addEventListener('click', (e) => {
      this._handleTreeClick(e);
    });
    
    // 使用事件委托处理右键菜单
    if (this.config.enableContextMenu) {
      this.elements.tree.addEventListener('contextmenu', (e) => {
        this._handleTreeContextMenu(e);
      });
    }
    
    console.log('🔗 文件夹树DOM事件绑定完成 🐱');
  }
  
  /**
   * 处理树点击事件
   * @private
   * @param {Event} e
   */
  _handleTreeClick(e) {
    // 处理展开/折叠按钮点击
    const toggle = e.target.closest('.tree-toggle');
    if (toggle) {
      e.stopPropagation();
      e.preventDefault();
      
      const folderId = toggle.dataset.folderId;
      this._toggleNode(folderId);
      return;
    }
    
    // 处理节点点击
    const treeItem = e.target.closest('.tree-item');
    if (!treeItem) return;
    
    const folderId = treeItem.dataset.folderId;
    this._selectNode(folderId);
  }
  
  /**
   * 处理树右键菜单事件
   * @private
   * @param {Event} e
   */
  _handleTreeContextMenu(e) {
    const treeItem = e.target.closest('.tree-item');
    if (!treeItem) return;
    
    const folderId = treeItem.dataset.folderId;
    
    // Dashboard和全部收藏不显示右键菜单
    if (folderId === 'dashboard' || folderId === 'all') {
      return;
    }
    
    e.preventDefault();
    
    // 发布右键菜单事件
    this.eventManager.emit('folderTree:contextMenu', {
      folderId,
      event: e,
      element: treeItem,
      folderData: this.state.folderMap.get(folderId)
    });
  }
  
  /**
   * 切换节点展开/折叠状态
   * @private
   * @param {string} folderId
   */
  _toggleNode(folderId) {
    const folder = this.state.folderMap.get(folderId);
    if (!folder || !folder.children || folder.children.length === 0) return;
    
    // 切换展开状态
    if (this.state.expandedNodes.has(folderId)) {
      this.state.expandedNodes.delete(folderId);
    } else {
      this.state.expandedNodes.add(folderId);
    }
    
    // 保存展开状态
    if (this.config.saveExpandedState) {
      this._saveExpandedState();
    }
    
    // 重新渲染树
    this._renderTreeContent();
    
    // 恢复选中状态
    if (this.state.selectedNode) {
      this._updateSelectionUI(this.state.selectedNode);
    }
    
    // 发布展开状态变化事件
    this.eventManager.emit('folderTree:nodeToggled', {
      folderId,
      expanded: this.state.expandedNodes.has(folderId),
      folder
    });
    
    console.log(`🔄 切换文件夹展开状态: ${folder.title} -> ${this.state.expandedNodes.has(folderId) ? '展开' : '折叠'} 🐱`);
  }
  
  /**
   * 选中节点
   * @private
   * @param {string} folderId
   */
  _selectNode(folderId) {
    console.log(`🖱️ 点击文件夹: ${folderId} 🐱`);
    
    // 更新选中状态
    this.state.selectedNode = folderId;
    this._updateSelectionUI(folderId);
    
    // 发布选中事件
    if (folderId === 'dashboard') {
      this.eventManager.emit('folderTree:nodeSelected', {
        type: 'dashboard',
        instanceId: 'default',
        folderId,
        folderData: null
      });
    } else {
      const folderData = this.state.folderMap.get(folderId);
      this.eventManager.emit('folderTree:nodeSelected', {
        type: 'bookmark',
        instanceId: folderId,
        folderId,
        folderData
      });
    }
  }
  
  /**
   * 更新选中状态UI
   * @private
   * @param {string} folderId
   */
  _updateSelectionUI(folderId) {
    // 清除所有选中状态
    const allItems = this.elements.tree.querySelectorAll('.tree-item');
    allItems.forEach(item => item.classList.remove('active'));
    
    // 设置新的选中状态
    const targetItem = this.elements.tree.querySelector(`[data-folder-id="${folderId}"]`);
    if (targetItem) {
      targetItem.classList.add('active');
    }
  }
  
  /**
   * 更新树数据
   * @private
   * @param {Object} newData
   */
  _updateTreeData(newData) {
    if (!newData) return;
    
    // 更新状态
    if (newData.folderTree) {
      this.state.folderTree = newData.folderTree;
    }
    
    if (newData.folderMap) {
      this.state.folderMap = newData.folderMap;
    }
    
    // 重新渲染
    if (this.elements.tree) {
      this._renderTreeContent();
      
      // 恢复选中状态
      if (this.state.selectedNode) {
        this._updateSelectionUI(this.state.selectedNode);
      }
    }
  }
  
  /**
   * 更新选中状态
   * @param {string} type - Tab类型
   * @param {string} instanceId - 实例ID
   */
  _updateSelection(type, instanceId) {
    let targetId = null;
    
    if (type === 'dashboard') {
      targetId = 'dashboard';
    } else if (type === 'bookmark') {
      targetId = instanceId;
    }
    
    if (targetId) {
      this.state.selectedNode = targetId;
      this._updateSelectionUI(targetId);
    }
  }
  
  /**
   * 检查节点是否展开
   * @private
   * @param {string} nodeId
   * @returns {boolean}
   */
  _isNodeExpanded(nodeId) {
    // 检查是否在展开集合中，如果没有则使用默认值
    if (this.state.expandedNodes.has(nodeId)) {
      return true;
    }
    
    // 使用节点自身的展开状态
    const node = this.state.folderMap.get(nodeId);
    return node?.isExpanded || false;
  }
  
  /**
   * 保存展开状态
   * @private
   */
  _saveExpandedState() {
    try {
      const expandedArray = Array.from(this.state.expandedNodes);
      localStorage.setItem('folderTree:expandedNodes', JSON.stringify(expandedArray));
    } catch (error) {
      console.warn('⚠️ 保存展开状态失败:', error);
    }
  }
  
  /**
   * 加载展开状态
   * @private
   */
  _loadExpandedState() {
    try {
      const saved = localStorage.getItem('folderTree:expandedNodes');
      if (saved) {
        const expandedArray = JSON.parse(saved);
        this.state.expandedNodes = new Set(expandedArray);
      }
    } catch (error) {
      console.warn('⚠️ 加载展开状态失败:', error);
      this.state.expandedNodes = new Set();
    }
  }
  
  /**
   * 转义HTML
   * @private
   * @param {string} text
   * @returns {string}
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 刷新组件
   */
  refresh() {
    console.log('🔄 刷新文件夹树组件 🐱');
    
    if (this.elements.tree) {
      this._renderTreeContent();
      
      // 恢复选中状态
      if (this.state.selectedNode) {
        this._updateSelectionUI(this.state.selectedNode);
      }
    }
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    console.log('🗑️ 销毁文件夹树组件 🐱');
    
    // 清理DOM
    if (this.elements.container) {
      this.elements.container.innerHTML = '';
    }
    
    // 清理状态
    this.state.folderTree = [];
    this.state.folderMap.clear();
    this.state.expandedNodes.clear();
    this.state.selectedNode = null;
    
    // 标记为未绑定事件
    this.eventsBound = false;
    
    console.log('✅ 文件夹树组件已销毁 🐱');
  }
  
  // ==================== 公共API ====================
  
  /**
   * 设置选中节点
   * @param {string} folderId
   */
  setSelectedNode(folderId) {
    this._selectNode(folderId);
  }
  
  /**
   * 展开节点
   * @param {string} folderId
   */
  expandNode(folderId) {
    if (!this.state.expandedNodes.has(folderId)) {
      this.state.expandedNodes.add(folderId);
      this.refresh();
    }
  }
  
  /**
   * 折叠节点
   * @param {string} folderId
   */
  collapseNode(folderId) {
    if (this.state.expandedNodes.has(folderId)) {
      this.state.expandedNodes.delete(folderId);
      this.refresh();
    }
  }
  
  /**
   * 获取当前选中节点
   * @returns {string|null}
   */
  getSelectedNode() {
    return this.state.selectedNode;
  }
  
  /**
   * 获取展开的节点列表
   * @returns {string[]}
   */
  getExpandedNodes() {
    return Array.from(this.state.expandedNodes);
  }
} 