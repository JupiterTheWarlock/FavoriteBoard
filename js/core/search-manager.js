// FavoriteBoard Plugin - 全局搜索管理器
// 负责监听搜索输入、计算全局结果并更新集中状态

class SearchManager {
  /**
   * @param {EventBus} eventBus
   * @param {StateManager} stateManager
   */
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.debounceTimer = null;
    this.debounceMs = 180;

    if (!this.eventBus) {
      console.warn('⚠️ [SearchManager] 事件总线不可用');
      return;
    }

    this.eventBus.on('search-query-changed', (query) => {
      this.handleQueryChanged(query);
    }, { unique: true });

    console.log('🔎 SearchManager 已初始化');
  }

  /**
   * 处理搜索查询变更（防抖）
   * @param {string} query
   */
  handleQueryChanged(query) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.executeSearch(String(query || ''));
    }, this.debounceMs);
  }

  /**
   * 执行全局搜索
   * @param {string} rawQuery
   */
  executeSearch(rawQuery) {
    try {
      const query = rawQuery.trim().toLowerCase();
      const allLinks = this.stateManager?.getStateValue('data.allLinks') || [];

      let results = [];
      if (query.length > 0) {
        results = this.filterLinks(allLinks, query);
      }

      const active = query.length > 0;

      // 更新集中 UI 状态
      this.stateManager.setUIState({
        search: { query, results, active }
      }, 'search-manager');

      // 广播结果更新事件
      this.eventBus.emit('search-results-updated', { query, results, active });

      console.log(`🔎 全局搜索: "${query}" → ${results.length} 条`);
    } catch (error) {
      console.error('❌ [SearchManager] 执行搜索失败:', error);
    }
  }

  /**
   * 过滤链接
   * @param {Array} links
   * @param {string} query
   */
  filterLinks(links, query) {
    const q = query.toLowerCase();
    const safeIncludes = (text) => (String(text || '').toLowerCase().includes(q));

    // 简单包含匹配：title/url/domain/path
    const results = [];
    for (const link of links) {
      if (!link) continue;
      const { title, url, domain, path } = link;
      if (safeIncludes(title) || safeIncludes(url) || safeIncludes(domain) || safeIncludes(path)) {
        results.push(link);
      }
    }

    return results;
  }
}

// 导出全局
window.SearchManager = SearchManager;


