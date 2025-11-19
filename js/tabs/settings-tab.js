// FavoriteBoard Plugin - Settings Tab
// 插件设置页Tab实现

class SettingsTab extends BaseTab {
  constructor() {
    super('settings', '设置', '⚙️', {
      showSearch: false,
      supportSearch: false,
      cache: false // 禁用缓存，保证每次切换都重新渲染
    });
    // 偏好：是否显示收藏时间
    this.showBookmarkTime = (window.Storage && window.Storage.get) ? window.Storage.get('showBookmarkTime', true) : true;
  }

  getDescription() {
    return '插件偏好设置、数据保存等操作';
  }

  async render(container) {
    container.innerHTML = '';
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-tab-content';

    // 收藏时间显示偏好
    const timePrefDiv = document.createElement('div');
    timePrefDiv.className = 'setting-item';
    timePrefDiv.innerHTML = `
      <label>
        <input type="checkbox" id="showBookmarkTimeCheckbox" ${this.showBookmarkTime ? 'checked' : ''} />
        显示收藏条目的收藏时间
      </label>
    `;
    settingsContainer.appendChild(timePrefDiv);

    // 数据导入导出功能
    const dataSection = document.createElement('div');
    dataSection.className = 'setting-section';
    dataSection.innerHTML = `
      <h3>数据管理</h3>
      <div class="setting-item">
        <div class="data-export-import">
          <button id="exportDataBtn" class="btn btn-primary">
            📤 导出收藏夹数据
          </button>
          <button id="importDataBtn" class="btn btn-secondary">
            📥 导入收藏夹数据
          </button>
          <input type="file" id="importFileInput" accept=".json" style="display: none;" />
        </div>
        <p class="setting-description">
          导出当前收藏夹数据为JSON文件，或从JSON文件导入收藏夹数据
        </p>
      </div>
    `;
    settingsContainer.appendChild(dataSection);

    // 添加样式
    this.addStyles();

    // 监听变更
    setTimeout(() => {
      this.bindEventListeners(settingsContainer);
    }, 0);

    // 其余内容保留基础结构
    container.appendChild(settingsContainer);
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners(container) {
    // 收藏时间显示偏好监听
    const checkbox = container.querySelector('#showBookmarkTimeCheckbox');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        const checked = !!e.target.checked;
        this.showBookmarkTime = checked;
        if (window.Storage && window.Storage.set) {
          window.Storage.set('showBookmarkTime', checked);
        }
        // 通知所有BookmarkTab刷新
        const app = window.linkBoardApp;
        if (app && app.eventBus) {
          app.eventBus.emit('settings-updated', { showBookmarkTime: checked });
        }
        if (app && app.tabFactory) {
          const tabs = app.tabFactory.getTabInstances('bookmark');
          tabs.forEach(tab => {
            tab.showBookmarkTime = checked;
            if (tab.container) {
              tab.renderBookmarkContent(tab.container);
            }
          });
        }
      });
    }

    // 导出按钮事件
    const exportBtn = container.querySelector('#exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportBookmarks();
      });
    }

    // 导入按钮事件
    const importBtn = container.querySelector('#importDataBtn');
    const importInput = container.querySelector('#importFileInput');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => {
        importInput.click();
      });

      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.importBookmarks(file);
          // 清空文件选择，允许重复选择同一文件
          e.target.value = '';
        }
      });
    }
  }

  /**
   * 添加样式
   */
  addStyles() {
    if (document.querySelector('#settings-tab-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'settings-tab-styles';
    styles.textContent = `
      .settings-tab-content {
        padding: 20px;
        max-width: 600px;
        margin: 0 auto;
      }

      .setting-section {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
      }

      .setting-section h3 {
        margin: 0 0 15px 0;
        color: #374151;
        font-size: 18px;
        font-weight: 600;
      }

      .setting-item {
        margin-bottom: 20px;
      }

      .data-export-import {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .btn:active {
        transform: translateY(0);
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-secondary {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      .setting-description {
        color: #6b7280;
        font-size: 13px;
        margin: 8px 0 0 0;
        line-height: 1.4;
      }

      label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #374151;
        cursor: pointer;
      }

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #667eea;
      }

      /* 加载状态 */
      .btn.loading {
        opacity: 0.7;
        cursor: not-allowed;
        pointer-events: none;
      }

      .btn.loading::after {
        content: '';
        width: 14px;
        height: 14px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-left: 6px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * 导出收藏夹数据
   */
  async exportBookmarks() {
    try {
      const exportBtn = document.querySelector('#exportDataBtn');
      if (exportBtn) {
        exportBtn.classList.add('loading');
        exportBtn.textContent = '📤 导出中...';
      }

      // 获取当前收藏夹数据
      const bookmarkData = await this.getBookmarkData();

      // 创建导出数据结构
      const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        exportSource: 'FavoriteBoard Chrome Extension',
        data: bookmarkData
      };

      // 创建Blob对象
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-T]/g, '');
      const filename = `favorites-backup-${timestamp}.json`;

      // 创建下载链接并触发下载
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // 清理URL对象
      URL.revokeObjectURL(url);

      // 显示成功消息
      this.showNotification('收藏夹数据导出成功！', 'success');

    } catch (error) {
      console.error('❌ 导出失败:', error);
      this.showNotification('导出失败：' + error.message, 'error');
    } finally {
      // 恢复按钮状态
      const exportBtn = document.querySelector('#exportDataBtn');
      if (exportBtn) {
        exportBtn.classList.remove('loading');
        exportBtn.textContent = '📤 导出收藏夹数据';
      }
    }
  }

  /**
   * 导入收藏夹数据
   */
  async importBookmarks(file) {
    try {
      const importBtn = document.querySelector('#importDataBtn');
      if (importBtn) {
        importBtn.classList.add('loading');
        importBtn.textContent = '📥 导入中...';
      }

      // 验证文件类型
      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('请选择JSON格式的文件');
      }

      // 读取文件内容
      const text = await this.readFileAsText(file);
      const importData = JSON.parse(text);

      // 验证数据格式
      if (!this.validateImportData(importData)) {
        throw new Error('无效的数据格式，请确认文件是从FavoriteBoard导出的');
      }

      // 执行导入操作
      const response = await this.performImport(importData.data);

      // 显示成功消息
      if (response && response.summary) {
        const { summary } = response;
        let message = `收藏夹数据导入成功！\n`;
        message += `🗑️ 删除 ${summary.deletedBookmarks} 个旧书签\n`;
        message += `✅ 创建 ${summary.createdBookmarks} 个新书签`;

        if (summary.errors > 0) {
          message += `\n⚠️ ${summary.errors} 个错误`;
          console.warn('导入错误详情:', response.errors);
        }

        this.showNotification(message, 'success');
      } else {
        this.showNotification('收藏夹数据导入成功！', 'success');
      }

      // 刷新数据
      this.refreshApplicationData();

    } catch (error) {
      console.error('❌ 导入失败:', error);
      this.showNotification('导入失败：' + error.message, 'error');
    } finally {
      // 恢复按钮状态
      const importBtn = document.querySelector('#importDataBtn');
      if (importBtn) {
        importBtn.classList.remove('loading');
        importBtn.textContent = '📥 导入收藏夹数据';
      }
    }
  }

  /**
   * 获取收藏夹数据
   */
  async getBookmarkData() {
    // 从应用实例的StateManager获取数据
    const app = window.linkBoardApp;
    if (!app || !app.stateManager) {
      throw new Error('应用或StateManager不可用');
    }

    const dataState = app.stateManager.getDataState();

    // 过滤掉特殊的"全部收藏"项目，保留完整的嵌套结构
    const folderTree = this.buildCompleteFolderTree(dataState.folderTree || []);

    // 修复allLinks中的path字段
    const allLinksWithPath = this.fixAllLinksPath(dataState.allLinks || [], folderTree);

    return {
      folderTree: folderTree,
      allLinks: allLinksWithPath,
      folderMap: this.mapToObject(dataState.folderMap) || {},
      lastSync: dataState.lastSync,
      totalBookmarks: dataState.allLinks?.length || 0,
      totalFolders: this.countAllFolders(folderTree)
    };
  }

  /**
   * 修复allLinks中的path字段
   * @param {Array} allLinks - 原始链接数据
   * @param {Array} folderTree - 文件夹树结构
   * @returns {Array} 修复后的链接数据
   */
  fixAllLinksPath(allLinks, folderTree) {
    // 创建文件夹ID到路径的映射
    const folderPathMap = new Map();

    // 递归构建文件夹路径映射
    function buildPathMap(folders, basePath = '') {
      for (const folder of folders) {
        // 构建当前文件夹的路径
        let currentPath;
        if (folder.parentId === '1' || folder.parentId === '2') {
          // 第一层文件夹，路径就是根ID
          currentPath = folder.parentId;
        } else {
          // 子文件夹，路径是父路径+当前标题
          currentPath = basePath ? `${basePath}/${folder.title}` : folder.title;
        }

        // 存储映射关系
        folderPathMap.set(folder.id, currentPath);
        console.log(`🔍 DEBUG: 文件夹路径映射 - ID: ${folder.id} -> 路径: ${currentPath} -> 父ID: ${folder.parentId}`);

        // 递归处理子文件夹
        if (folder.children && folder.children.length > 0) {
          buildPathMap(folder.children, currentPath);
        }
      }
    }

    // 构建路径映射表
    buildPathMap(folderTree);

    // 修复所有链接的path字段
    return allLinks.map(link => {
      const path = folderPathMap.get(link.folderId) || '2'; // 默认为其他书签
      const fixedLink = {
        ...link,
        path: path
      };

      console.log(`🔍 DEBUG: 链接路径修复 - ${link.title} -> 文件夹ID: ${link.folderId} -> 路径: ${path}`);

      return fixedLink;
    });
  }

  /**
   * 构建完整的文件夹树结构（包含所有子文件夹）
   */
  buildCompleteFolderTree(folderTree) {
    const result = [];

    for (const folder of folderTree) {
      // 跳过特殊的虚拟文件夹
      if (folder.id === 'all' || folder.isSpecial) {
        continue;
      }

      // 递归构建文件夹结构
      const completeFolder = this.buildFolderNode(folder);
      if (completeFolder) {
        result.push(completeFolder);
      }
    }

    return result;
  }

  /**
   * 构建单个文件夹节点（递归）
   */
  buildFolderNode(folder, parentPath = '') {
    if (!folder || folder.id === 'all' || folder.isSpecial) {
      return null;
    }

    // 构建正确的路径：根文件夹用ID，子文件夹用父路径+标题
    let currentPath;
    if (folder.parentId === '1' || folder.parentId === '2') {
      // 第一层文件夹，直接使用根ID
      currentPath = folder.parentId;
    } else {
      // 子文件夹，使用父路径+当前标题
      currentPath = parentPath ? `${parentPath}/${folder.title}` : folder.title;
    }

    const node = {
      id: folder.id,
      title: folder.title,
      path: currentPath,
      parentId: folder.parentId,
      bookmarkCount: folder.bookmarkCount || 0,
      dateAdded: folder.dateAdded,
      children: []
    };

    console.log(`🔍 DEBUG: 构建文件夹节点: ${folder.title} -> 路径: ${currentPath} -> 父ID: ${folder.parentId}`);

    // 递归处理子文件夹
    if (folder.children && folder.children.length > 0) {
      for (const child of folder.children) {
        const childNode = this.buildFolderNode(child, currentPath);
        if (childNode) {
          node.children.push(childNode);
        }
      }
    }

    return node;
  }

  /**
   * 统计所有文件夹数量（包括子文件夹）
   */
  countAllFolders(folderTree) {
    let count = 0;

    function countFolders(folder) {
      count++;
      if (folder.children && folder.children.length > 0) {
        folder.children.forEach(countFolders);
      }
    }

    folderTree.forEach(countFolders);
    return count;
  }

  /**
   * Map转普通对象（用于JSON序列化）
   */
  mapToObject(map) {
    if (!map) return {};
    const obj = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * 验证导入数据
   */
  validateImportData(importData) {
    if (!importData || typeof importData !== 'object') {
      return false;
    }

    if (!importData.version || !importData.data) {
      return false;
    }

    const data = importData.data;
    if (!Array.isArray(data.folderTree) || !Array.isArray(data.allLinks)) {
      return false;
    }

    return true;
  }

  /**
   * 执行导入操作
   */
  async performImport(bookmarkData) {
    // 这里可以实现具体的导入逻辑
    // 由于Chrome扩展的安全限制，直接修改书签可能需要通过background script
    console.log('🔄 开始执行导入操作...', bookmarkData);

    // 发送导入请求到background script
    const app = window.linkBoardApp;
    if (app && app.bookmarkManager) {
      const response = await app.bookmarkManager.sendMessage({
        action: 'importBookmarks',
        data: bookmarkData
      });

      if (!response.success) {
        throw new Error(response.error || '导入操作失败');
      }

      return response;
    } else {
      console.warn('⚠️ BookmarkManager不可用，仅更新本地状态');
      // 这里可以添加本地状态更新逻辑
      return { success: true };
    }
  }

  /**
   * 刷新应用数据
   */
  refreshApplicationData() {
    // 刷新BookmarkManager数据
    const app = window.linkBoardApp;
    if (app && app.bookmarkManager) {
      app.bookmarkManager.loadBookmarks(true);
    }

    // 通过事件系统通知其他组件
    if (app && app.eventBus) {
      app.eventBus.emit('data-import-completed', {
        timestamp: Date.now()
      });
    }
  }

  /**
   * 读取文件为文本
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    // 如果有通知管理器，使用通知管理器
    const app = window.linkBoardApp;
    if (app && app.uiManager) {
      app.uiManager.showNotification(message, type);
      return;
    }

    // 否则使用简单的alert
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    alert(`${prefix} ${message}`);
  }
}

window.SettingsTab = SettingsTab; 