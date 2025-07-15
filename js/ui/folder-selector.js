/**
 * FolderSelector - 文件夹选择器组件
 * 用于在对话框中显示可选择的文件夹树结构
 */
class FolderSelector {
  constructor(options = {}) {
    this.options = {
      allowRootSelection: false,        // 是否允许选择根目录
      excludeFolderIds: [],            // 禁用的文件夹ID列表（显示为灰色不可选）
      showBookmarkCount: true,         // 是否显示书签数量
      className: 'folder-selector',    // 自定义CSS类名
      emptyMessage: '暂无可选择的文件夹', // 空状态消息
      ...options
    };
    
    this.folderTree = [];
    this.selectedFolderId = null;
    this.onSelectionChange = this.options.onSelectionChange || (() => {});
    
    console.log('📁 FolderSelector创建完成');
  }
  
  /**
   * 设置文件夹树数据
   * @param {Array} folderTree - 文件夹树数据
   */
  setFolderTree(folderTree) {
    this.folderTree = this.processFolderTree(folderTree || []);
    console.log(`📁 设置文件夹树数据: ${this.folderTree.length} 个顶级文件夹`);
  }
  
  /**
   * 处理文件夹树数据 - 全部展开，标记禁用文件夹
   * @param {Array} folderTree - 原始文件夹树数据
   * @returns {Array} 处理后的文件夹树
   */
  processFolderTree(folderTree) {
    const processNode = (node) => {
      // 过滤掉特殊节点（如"全部收藏"）
      if (node.isSpecial || node.id === 'all') {
        return null;
      }
      
      // 检查是否是当前所在的文件夹（标记为禁用而不是过滤掉）
      const isDisabled = this.options.excludeFolderIds.includes(node.id);
      
      const processedNode = {
        ...node,
        isExpanded: true, // 强制全部展开
        isDisabled: isDisabled, // 标记禁用状态
        children: [],
        icon: node.icon || this.getFolderIcon(node.title) // 确保有图标
      };
      
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          const processedChild = processNode(child);
          if (processedChild) {
            processedNode.children.push(processedChild);
          }
        });
      }
      
      return processedNode;
    };
    
    const processedTree = [];
    folderTree.forEach(node => {
      const processedNode = processNode(node);
      if (processedNode) {
        processedTree.push(processedNode);
      }
    });
    
    return processedTree;
  }
  
  /**
   * 渲染文件夹选择器
   * @param {HTMLElement} container - 容器元素
   */
  render(container) {
    if (!container) {
      console.error('❌ FolderSelector: 容器元素不能为空');
      return;
    }
    
    // 清空容器
    container.innerHTML = '';
    container.className = this.options.className;
    
    // 如果没有文件夹数据，显示空状态
    if (!this.folderTree || this.folderTree.length === 0) {
      this.renderEmptyState(container);
      return;
    }
    
    // 创建文件夹树容器
    const treeContainer = document.createElement('div');
    treeContainer.className = 'folder-selector-tree';
    
    // 渲染文件夹树
    this.folderTree.forEach(node => {
      this.renderTreeNode(node, treeContainer, 0);
    });
    
    container.appendChild(treeContainer);
    
    // 绑定事件
    this.bindEvents(container);
    
    console.log('✅ FolderSelector渲染完成');
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
    
    // 渲染子节点（因为全部展开，所以直接渲染）
    if (node.children && node.children.length > 0) {
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
    item.className = `folder-selector-item${node.isDisabled ? ' disabled' : ''}`;
    item.dataset.folderId = node.id;
    item.dataset.depth = depth;
    item.dataset.disabled = node.isDisabled ? 'true' : 'false';
    item.style.paddingLeft = `${depth * 20 + 12}px`;
    
    // 检查是否有子节点（用于显示缩进）
    const hasChildren = node.children && node.children.length > 0;
    
    item.innerHTML = `
      <div class="folder-selector-content">
        <span class="folder-selector-icon">${node.icon}</span>
        <span class="folder-selector-title">${this.escapeHtml(node.title)}</span>
        ${this.options.showBookmarkCount ? 
          `<span class="folder-selector-count">${node.bookmarkCount || 0}</span>` : 
          ''
        }
        ${node.isDisabled ? '<span class="folder-selector-disabled-hint">(当前位置)</span>' : ''}
      </div>
    `;
    
    return item;
  }
  
  /**
   * 渲染空状态
   * @param {HTMLElement} container - 容器元素
   */
  renderEmptyState(container) {
    const emptyElement = document.createElement('div');
    emptyElement.className = 'folder-selector-empty';
    emptyElement.innerHTML = `
      <div class="folder-selector-empty-content">
        <div class="folder-selector-empty-icon">📁</div>
        <div class="folder-selector-empty-message">${this.options.emptyMessage}</div>
      </div>
    `;
    container.appendChild(emptyElement);
  }
  
  /**
   * 绑定事件
   * @param {HTMLElement} container - 容器元素
   */
  bindEvents(container) {
    // 文件夹点击事件（委托）
    container.addEventListener('click', (e) => {
      this.handleFolderClick(e);
    });
  }
  
  /**
   * 处理文件夹点击事件
   * @param {Event} e - 点击事件
   */
  handleFolderClick(e) {
    const folderItem = e.target.closest('.folder-selector-item');
    if (!folderItem) return;
    
    const folderId = folderItem.dataset.folderId;
    
    // 如果是禁用的文件夹，则不响应点击
    if (folderItem.dataset.disabled === 'true') {
      console.log(`📁 文件夹已禁用，无法选择: ${folderId}`);
      return;
    }
    
    // 如果不允许选择根目录且这是根目录，则返回
    if (!this.options.allowRootSelection && this.isRootFolder(folderId)) {
      return;
    }
    
    console.log(`📁 选择文件夹: ${folderId}`);
    
    // 更新选中状态
    this.updateSelection(folderId);
    
    // 触发回调
    this.onSelectionChange(folderId, this.getFolderData(folderId));
  }
  
  /**
   * 更新选中状态
   * @param {string} folderId - 文件夹ID
   */
  updateSelection(folderId) {
    // 移除之前的选中状态
    const prevSelected = document.querySelector('.folder-selector-item.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }
    
    // 添加新的选中状态
    const currentSelected = document.querySelector(`.folder-selector-item[data-folder-id="${folderId}"]`);
    if (currentSelected) {
      currentSelected.classList.add('selected');
    }
    
    this.selectedFolderId = folderId;
  }
  
  /**
   * 获取选中的文件夹ID
   * @returns {string|null} 文件夹ID
   */
  getSelectedFolderId() {
    return this.selectedFolderId;
  }
  
  /**
   * 获取文件夹数据
   * @param {string} folderId - 文件夹ID
   * @returns {Object|null} 文件夹数据
   */
  getFolderData(folderId) {
    const findFolder = (nodes, targetId) => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const found = findFolder(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findFolder(this.folderTree, folderId);
  }
  
  /**
   * 检查是否是根文件夹
   * @param {string} folderId - 文件夹ID
   * @returns {boolean} 是否是根文件夹
   */
  isRootFolder(folderId) {
    // 可以根据项目需要自定义根文件夹的判断逻辑
    return folderId === '0' || folderId === 'root';
  }
  
  /**
   * 获取文件夹图标
   * @param {string} title - 文件夹标题
   * @returns {string} 图标
   */
  getFolderIcon(title) {
    if (!title) return '📁';
    
    const titleLower = title.toLowerCase();
    
    // 特殊文件夹图标映射
    const iconMap = {
      '工作': '💼', 'work': '💼',
      '学习': '📚', 'study': '📚', 'education': '📚',
      '娱乐': '🎮', 'entertainment': '🎮', 'games': '🎮',
      '社交': '💬', 'social': '💬', 'communication': '💬',
      '购物': '🛒', 'shopping': '🛒',
      '新闻': '📰', 'news': '📰',
      '技术': '⚙️', 'tech': '⚙️', 'technology': '⚙️',
      '设计': '🎨', 'design': '🎨',
      '音乐': '🎵', 'music': '🎵',
      '视频': '🎬', 'video': '🎬', 'movies': '🎬',
      '旅游': '✈️', 'travel': '✈️',
      '美食': '🍕', 'food': '🍕'
    };
    
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (titleLower.includes(keyword)) {
        return icon;
      }
    }
    
    return '📁';
  }
  
  /**
   * 转义HTML字符
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 设置选择回调函数
   * @param {Function} callback - 回调函数
   */
  setOnSelectionChange(callback) {
    this.onSelectionChange = callback || (() => {});
  }
  
  /**
   * 清理资源
   */
  destroy() {
    this.folderTree = [];
    this.selectedFolderId = null;
    this.onSelectionChange = () => {};
    console.log('🧹 FolderSelector资源清理完成');
  }
}

// 导出FolderSelector类
window.FolderSelector = FolderSelector; 