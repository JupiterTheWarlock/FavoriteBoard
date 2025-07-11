/**
 * FavoriteBoard - 搜索服务
 * 负责：高级搜索功能、搜索历史、搜索建议
 * 
 * @author JupiterTheWarlock
 * @description 提供强大的搜索功能，支持多种搜索模式和搜索历史管理 🐱
 */

/**
 * 搜索服务 - 搜索功能实现
 * 提供统一的搜索接口和高级搜索功能
 */
class SearchService {
  constructor(container) {
    this.container = container;
    
    // 核心依赖（将在init中注入）
    this.eventManager = null;
    this.dataManager = null;
    this.appConfig = null;
    this.uiManager = null;
    
    // 搜索配置
    this.config = {
      minQueryLength: 1,
      debounceDelay: 300,
      maxResults: 100,
      highlightMatches: true,
      searchInUrl: true,
      searchInDescription: true,
      fuzzySearch: false,
      caseSensitive: false,
      enableHistory: true,
      maxHistorySize: 50
    };
    
    // 搜索状态
    this.state = {
      currentQuery: '',
      lastQuery: '',
      isSearching: false,
      results: [],
      resultCount: 0,
      searchTime: 0
    };
    
    // 搜索历史
    this.searchHistory = [];
    this.searchSuggestions = [];
    
    // 防抖定时器
    this.debounceTimer = null;
    
    // 搜索模式
    this.searchModes = {
      simple: this._simpleSearch.bind(this),
      advanced: this._advancedSearch.bind(this),
      fuzzy: this._fuzzySearch.bind(this),
      regex: this._regexSearch.bind(this)
    };
    
    this.currentMode = 'simple';
    
    console.log('🔍 搜索服务初始化 🐱');
  }
  
  /**
   * 初始化搜索服务
   */
  async init() {
    try {
      console.log('🚀 搜索服务开始初始化 🐱');
      
      // 获取依赖服务
      this.eventManager = this.container.get('eventManager');
      this.dataManager = this.container.get('dataManager');
      this.appConfig = this.container.get('appConfig');
      this.uiManager = this.container.get('uiManager');
      
      // 应用配置
      this._applyConfig();
      
      // 加载搜索历史
      this._loadSearchHistory();
      
      // 绑定事件
      this._bindEvents();
      
      console.log('✅ 搜索服务初始化完成 🐱');
      
    } catch (error) {
      console.error('❌ 搜索服务初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 应用配置
   * @private
   */
  _applyConfig() {
    if (this.appConfig && this.appConfig.search) {
      this.config = { ...this.config, ...this.appConfig.search };
    }
  }
  
  /**
   * 加载搜索历史
   * @private
   */
  _loadSearchHistory() {
    try {
      if (this.config.enableHistory && typeof localStorage !== 'undefined') {
        const historyData = localStorage.getItem('favoriteBoard_searchHistory');
        if (historyData) {
          this.searchHistory = JSON.parse(historyData);
          console.log(`🔍 搜索历史加载成功: ${this.searchHistory.length} 条 🐱`);
        }
      }
    } catch (error) {
      console.warn('⚠️ 搜索历史加载失败:', error);
      this.searchHistory = [];
    }
  }
  
  /**
   * 保存搜索历史
   * @private
   */
  _saveSearchHistory() {
    try {
      if (this.config.enableHistory && typeof localStorage !== 'undefined') {
        localStorage.setItem('favoriteBoard_searchHistory', JSON.stringify(this.searchHistory));
      }
    } catch (error) {
      console.warn('⚠️ 搜索历史保存失败:', error);
    }
  }
  
  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    if (!this.eventManager) return;
    
    // 监听搜索请求
    this.eventManager.on('search:query', (data) => {
      console.log('🔍 接收到搜索请求 🐱', data);
      this.search(data.query, data.options);
    });
    
    // 监听搜索清空请求
    this.eventManager.on('search:clear', () => {
      console.log('🔍 接收到搜索清空请求 🐱');
      this.clearSearch();
    });
    
    // 监听搜索模式切换
    this.eventManager.on('search:setMode', (data) => {
      console.log('🔍 切换搜索模式 🐱', data);
      this.setSearchMode(data.mode);
    });
    
    // 监听配置更改
    this.eventManager.on('config:changed', (data) => {
      if (data.path && data.path.startsWith('search.')) {
        console.log('⚙️ 搜索相关配置更改，重新应用配置 🐱');
        this._applyConfig();
      }
    });
  }
  
  /**
   * 执行搜索
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async search(query, options = {}) {
    // 清除防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // 设置防抖
    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        const results = await this._executeSearch(query, options);
        resolve(results);
      }, this.config.debounceDelay);
    });
  }
  
  /**
   * 执行实际搜索
   * @private
   * @param {string} query
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async _executeSearch(query, options = {}) {
    const startTime = performance.now();
    
    try {
      // 更新搜索状态
      this.state.isSearching = true;
      this.state.currentQuery = query;
      
      // 发布搜索开始事件
      this.eventManager.emit('search:start', {
        query,
        mode: this.currentMode,
        timestamp: Date.now()
      });
      
      // 验证查询
      const validationResult = this._validateQuery(query);
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }
      
      // 获取数据源
      const dataSource = this._getDataSource(options);
      
      // 执行搜索
      const searchFunction = this.searchModes[this.currentMode];
      const results = searchFunction(query, dataSource, options);
      
      // 限制结果数量
      const limitedResults = results.slice(0, this.config.maxResults);
      
      // 更新搜索状态
      this.state.results = limitedResults;
      this.state.resultCount = limitedResults.length;
      this.state.searchTime = performance.now() - startTime;
      this.state.lastQuery = query;
      
      // 添加到搜索历史
      this._addToHistory(query);
      
      // 发布搜索完成事件
      this.eventManager.emit('search:complete', {
        query,
        results: limitedResults,
        resultCount: limitedResults.length,
        searchTime: this.state.searchTime,
        timestamp: Date.now()
      });
      
      console.log(`🔍 搜索完成: "${query}" 找到 ${limitedResults.length} 个结果 (${this.state.searchTime.toFixed(2)}ms) 🐱`);
      
      return limitedResults;
      
    } catch (error) {
      console.error('❌ 搜索执行失败:', error);
      
      // 发布搜索错误事件
      this.eventManager.emit('search:error', {
        query,
        error: error.message,
        timestamp: Date.now()
      });
      
      return [];
      
    } finally {
      this.state.isSearching = false;
    }
  }
  
  /**
   * 验证搜索查询
   * @private
   * @param {string} query
   * @returns {Object}
   */
  _validateQuery(query) {
    if (!query || typeof query !== 'string') {
      return { valid: false, error: '搜索查询不能为空' };
    }
    
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < this.config.minQueryLength) {
      return { valid: false, error: `搜索查询至少需要 ${this.config.minQueryLength} 个字符` };
    }
    
    return { valid: true };
  }
  
  /**
   * 获取数据源
   * @private
   * @param {Object} options
   * @returns {Array}
   */
  _getDataSource(options) {
    if (options.dataSource) {
      return options.dataSource;
    }
    
    if (options.folderId) {
      return this.dataManager.getBookmarksInFolder(options.folderId);
    }
    
    return this.dataManager.getAllLinks();
  }
  
  /**
   * 简单搜索
   * @private
   * @param {string} query
   * @param {Array} dataSource
   * @param {Object} options
   * @returns {Array}
   */
  _simpleSearch(query, dataSource, options) {
    const searchQuery = this.config.caseSensitive ? query.trim() : query.toLowerCase().trim();
    
    return dataSource.filter(item => {
      const title = this.config.caseSensitive ? item.title : item.title.toLowerCase();
      const url = this.config.caseSensitive ? item.url : item.url.toLowerCase();
      
      // 搜索标题
      if (title.includes(searchQuery)) return true;
      
      // 搜索URL
      if (this.config.searchInUrl && url.includes(searchQuery)) return true;
      
      // 搜索域名
      if (this.config.searchInUrl) {
        const domain = this._extractDomain(item.url);
        const domainText = this.config.caseSensitive ? domain : domain.toLowerCase();
        if (domainText.includes(searchQuery)) return true;
      }
      
      return false;
    });
  }
  
  /**
   * 高级搜索
   * @private
   * @param {string} query
   * @param {Array} dataSource
   * @param {Object} options
   * @returns {Array}
   */
  _advancedSearch(query, dataSource, options) {
    // 解析高级搜索语法
    const searchTerms = this._parseAdvancedQuery(query);
    
    return dataSource.filter(item => {
      return this._matchAdvancedTerms(item, searchTerms);
    });
  }
  
  /**
   * 模糊搜索
   * @private
   * @param {string} query
   * @param {Array} dataSource
   * @param {Object} options
   * @returns {Array}
   */
  _fuzzySearch(query, dataSource, options) {
    const searchQuery = query.toLowerCase().trim();
    const results = [];
    
    for (const item of dataSource) {
      const titleScore = this._calculateFuzzyScore(searchQuery, item.title.toLowerCase());
      const urlScore = this.config.searchInUrl ? 
        this._calculateFuzzyScore(searchQuery, item.url.toLowerCase()) : 0;
      
      const maxScore = Math.max(titleScore, urlScore);
      if (maxScore > 0.3) { // 模糊匹配阈值
        results.push({
          ...item,
          _searchScore: maxScore
        });
      }
    }
    
    // 按分数排序
    return results.sort((a, b) => b._searchScore - a._searchScore);
  }
  
  /**
   * 正则表达式搜索
   * @private
   * @param {string} query
   * @param {Array} dataSource
   * @param {Object} options
   * @returns {Array}
   */
  _regexSearch(query, dataSource, options) {
    try {
      const flags = this.config.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(query, flags);
      
      return dataSource.filter(item => {
        return regex.test(item.title) || 
               (this.config.searchInUrl && regex.test(item.url));
      });
      
    } catch (error) {
      console.warn('⚠️ 正则表达式无效:', error);
      // 回退到简单搜索
      return this._simpleSearch(query, dataSource, options);
    }
  }
  
  /**
   * 解析高级搜索查询
   * @private
   * @param {string} query
   * @returns {Object}
   */
  _parseAdvancedQuery(query) {
    const terms = {
      include: [],
      exclude: [],
      exact: [],
      domain: [],
      folder: []
    };
    
    // 解析各种搜索语法
    const patterns = {
      exact: /"([^"]+)"/g,
      exclude: /-(\w+)/g,
      domain: /site:(\S+)/g,
      folder: /folder:(\S+)/g
    };
    
    // 提取精确匹配
    let match;
    while ((match = patterns.exact.exec(query)) !== null) {
      terms.exact.push(match[1]);
      query = query.replace(match[0], '');
    }
    
    // 提取排除词
    while ((match = patterns.exclude.exec(query)) !== null) {
      terms.exclude.push(match[1]);
      query = query.replace(match[0], '');
    }
    
    // 提取域名搜索
    while ((match = patterns.domain.exec(query)) !== null) {
      terms.domain.push(match[1]);
      query = query.replace(match[0], '');
    }
    
    // 提取文件夹搜索
    while ((match = patterns.folder.exec(query)) !== null) {
      terms.folder.push(match[1]);
      query = query.replace(match[0], '');
    }
    
    // 剩余的作为包含词
    const remainingWords = query.trim().split(/\s+/).filter(word => word);
    terms.include.push(...remainingWords);
    
    return terms;
  }
  
  /**
   * 匹配高级搜索条件
   * @private
   * @param {Object} item
   * @param {Object} terms
   * @returns {boolean}
   */
  _matchAdvancedTerms(item, terms) {
    const text = `${item.title} ${item.url}`.toLowerCase();
    
    // 检查精确匹配
    for (const exact of terms.exact) {
      if (!text.includes(exact.toLowerCase())) return false;
    }
    
    // 检查包含词
    for (const include of terms.include) {
      if (!text.includes(include.toLowerCase())) return false;
    }
    
    // 检查排除词
    for (const exclude of terms.exclude) {
      if (text.includes(exclude.toLowerCase())) return false;
    }
    
    // 检查域名
    if (terms.domain.length > 0) {
      const domain = this._extractDomain(item.url);
      const domainMatch = terms.domain.some(d => domain.includes(d));
      if (!domainMatch) return false;
    }
    
    return true;
  }
  
  /**
   * 计算模糊匹配分数
   * @private
   * @param {string} pattern
   * @param {string} text
   * @returns {number}
   */
  _calculateFuzzyScore(pattern, text) {
    if (pattern === text) return 1;
    if (pattern.length === 0) return 0;
    if (text.length === 0) return 0;
    
    // 检查包含关系
    if (text.includes(pattern)) {
      return 0.8;
    }
    
    // 计算编辑距离
    const distance = this._calculateEditDistance(pattern, text);
    const maxLength = Math.max(pattern.length, text.length);
    return Math.max(0, 1 - distance / maxLength);
  }
  
  /**
   * 计算编辑距离
   * @private
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  _calculateEditDistance(a, b) {
    const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // 删除
            dp[i][j - 1] + 1,     // 插入
            dp[i - 1][j - 1] + 1  // 替换
          );
        }
      }
    }
    
    return dp[a.length][b.length];
  }
  
  /**
   * 提取域名
   * @private
   * @param {string} url
   * @returns {string}
   */
  _extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '';
    }
  }
  
  /**
   * 添加到搜索历史
   * @private
   * @param {string} query
   */
  _addToHistory(query) {
    if (!this.config.enableHistory || !query.trim()) return;
    
    const trimmedQuery = query.trim();
    
    // 移除重复项
    this.searchHistory = this.searchHistory.filter(item => item.query !== trimmedQuery);
    
    // 添加到开头
    this.searchHistory.unshift({
      query: trimmedQuery,
      timestamp: Date.now(),
      resultCount: this.state.resultCount
    });
    
    // 限制历史记录大小
    if (this.searchHistory.length > this.config.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.config.maxHistorySize);
    }
    
    // 保存历史记录
    this._saveSearchHistory();
    
    // 发布历史更新事件
    this.eventManager.emit('search:historyUpdated', {
      query: trimmedQuery,
      historySize: this.searchHistory.length,
      timestamp: Date.now()
    });
  }
  
  /**
   * 高亮搜索结果
   * @param {string} text - 要高亮的文本
   * @param {string} query - 搜索查询
   * @returns {string} 高亮后的HTML
   */
  highlightText(text, query) {
    if (!this.config.highlightMatches || !query || !text) {
      return text;
    }
    
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = this.config.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${escapeRegex(query)})`, flags);
    
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  
  // ==================== 公共API ====================
  
  /**
   * 清空搜索
   */
  clearSearch() {
    this.state.currentQuery = '';
    this.state.results = [];
    this.state.resultCount = 0;
    
    // 发布搜索清空事件
    this.eventManager.emit('search:cleared', {
      timestamp: Date.now()
    });
    
    console.log('🔍 搜索已清空 🐱');
  }
  
  /**
   * 设置搜索模式
   * @param {string} mode - 搜索模式
   */
  setSearchMode(mode) {
    if (this.searchModes.hasOwnProperty(mode)) {
      this.currentMode = mode;
      
      // 发布模式切换事件
      this.eventManager.emit('search:modeChanged', {
        mode,
        timestamp: Date.now()
      });
      
      console.log(`🔍 搜索模式切换为: ${mode} 🐱`);
    }
  }
  
  /**
   * 获取搜索建议
   * @param {string} partialQuery - 部分查询
   * @returns {Array} 建议列表
   */
  getSuggestions(partialQuery) {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }
    
    const query = partialQuery.toLowerCase();
    const suggestions = [];
    
    // 从搜索历史中获取建议
    for (const historyItem of this.searchHistory) {
      if (historyItem.query.toLowerCase().includes(query)) {
        suggestions.push({
          text: historyItem.query,
          type: 'history',
          resultCount: historyItem.resultCount
        });
      }
    }
    
    // 从数据中获取建议
    const dataSource = this.dataManager.getAllLinks();
    const uniqueTitles = new Set();
    
    for (const item of dataSource) {
      if (item.title.toLowerCase().includes(query) && !uniqueTitles.has(item.title)) {
        uniqueTitles.add(item.title);
        suggestions.push({
          text: item.title,
          type: 'bookmark',
          url: item.url
        });
      }
    }
    
    return suggestions.slice(0, 10); // 限制建议数量
  }
  
  /**
   * 获取搜索状态
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * 获取搜索历史
   * @returns {Array}
   */
  getSearchHistory() {
    return [...this.searchHistory];
  }
  
  /**
   * 清空搜索历史
   */
  clearSearchHistory() {
    this.searchHistory = [];
    this._saveSearchHistory();
    
    // 发布历史清空事件
    this.eventManager.emit('search:historyCleated', {
      timestamp: Date.now()
    });
    
    console.log('🔍 搜索历史已清空 🐱');
  }
  
  /**
   * 获取搜索配置
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * 更新搜索配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // 发布配置更新事件
    this.eventManager.emit('search:configUpdated', {
      config: this.config,
      timestamp: Date.now()
    });
    
    console.log('🔍 搜索配置已更新 🐱');
  }
  
  /**
   * 获取可用的搜索模式
   * @returns {Array}
   */
  getAvailableModes() {
    return Object.keys(this.searchModes);
  }
  
  /**
   * 获取当前搜索模式
   * @returns {string}
   */
  getCurrentMode() {
    return this.currentMode;
  }
  
  /**
   * 销毁方法（供容器调用）
   */
  dispose() {
    console.log('🔍 搜索服务开始销毁 🐱');
    
    // 清除防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // 保存搜索历史
    this._saveSearchHistory();
    
    // 重置状态
    this.state = {
      currentQuery: '',
      lastQuery: '',
      isSearching: false,
      results: [],
      resultCount: 0,
      searchTime: 0
    };
    
    console.log('🔍 搜索服务销毁完成 🐱');
  }
}

// 导出搜索服务类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = SearchService;
} else {
  // 浏览器环境
  window.SearchService = SearchService;
} 