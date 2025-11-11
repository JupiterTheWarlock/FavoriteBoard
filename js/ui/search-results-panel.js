// FavoriteBoard Plugin - 搜索结果面板
// 统一在搜索激活时接管 #tabContent 展示全局搜索结果

class SearchResultsPanel {
  /**
   * @param {EventBus} eventBus
   * @param {StateManager} stateManager
   */
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = null; // #tabContent
    this.isActive = false;

    if (!this.eventBus) {
      console.warn('⚠️ [SearchResultsPanel] 事件总线不可用');
      return;
    }

    this.eventBus.on('search-results-updated', (payload) => {
      this.handleResultsUpdated(payload);
    }, { unique: true });

    console.log('🖼️ SearchResultsPanel 已初始化');
  }

  getContainer() {
    if (!this.container) {
      this.container = document.getElementById('tabContent');
    }
    return this.container;
  }

  handleResultsUpdated({ query, results, active }) {
    const container = this.getContainer();
    if (!container) return;

    if (active) {
      this.isActive = true;
      this.render(container, query, results || []);
    } else {
      this.isActive = false;
      // 清空并交还给当前 Tab 重新渲染
      container.innerHTML = '';
      // 触发当前激活 Tab 的重新渲染
      const app = window.linkBoardApp;
      const activeTab = app?.tabContainer?.getActiveTab();
      if (app?.tabContainer && activeTab) {
        try {
          // 强制跳过缓存以恢复内容
          activeTab.isInitialized = false;
          app.tabContainer.renderTab(activeTab, this.getContainer());
        } catch (e) {}
      }
    }
  }

  render(container, query, results) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'search-results-container';

    const header = document.createElement('div');
    header.className = 'search-results-header';
    const title = document.createElement('h3');
    title.textContent = `搜索结果（${results.length}）`;
    const subtitle = document.createElement('p');
    subtitle.textContent = query ? `包含 “${query}” 的链接` : '请输入关键词开始搜索';
    header.appendChild(title);
    header.appendChild(subtitle);

    wrapper.appendChild(header);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'links-grid-container';

    if (!results || results.length === 0) {
      const empty = createEmptyState(query ? `没有找到包含 "${query}" 的链接` : '请输入关键词开始搜索', query ? '🔍' : '⌨️');
      gridContainer.appendChild(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'links-grid';

      results.forEach(link => {
        const card = this.createLinkCard(link);
        grid.appendChild(card);
      });

      gridContainer.appendChild(grid);
    }

    wrapper.appendChild(gridContainer);
    container.appendChild(wrapper);
    container.style.display = 'block';
  }

  createLinkCard(link) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.dataset.linkId = link.id;
    card.dataset.url = link.url;

    const iconUrl = getSafeIcon(link.iconUrl, link.url);

    card.innerHTML = `
      <div class="card-header">
        <img class="card-icon" src="${iconUrl}" alt="icon" loading="lazy" data-fallback="${getDefaultIcon(link.title, link.url)}">
        <h3 class="card-title" title="${escapeHtml(link.title)}">${escapeHtml(link.title)}</h3>
        <button class="context-menu-btn" title="更多选项">⋮</button>
      </div>
      <div class="card-description">
        <span class="link-url" title="${escapeHtml(link.url)}">${escapeHtml(getDomainFromUrl(link.url))}</span>
        <br>
        ${link.dateAdded ? `<span class="link-time" title="收藏时间">${formatTimeDetailed(new Date(parseInt(link.dateAdded)))}</span>` : ''}
      </div>
    `;

    // 绑定卡片事件：复用 BookmarkTab 的逻辑（简化版）
    const app = window.linkBoardApp;
    const contextMenuManager = app?.uiManager?.getContextMenuManager?.();

    card.addEventListener('click', (e) => {
      if (e.target.closest('.context-menu-btn')) return;
      if (link.url) {
        chrome.tabs.create({ url: link.url });
      }
    });

    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (contextMenuManager) {
        contextMenuManager.showCardMenu(e, link, card, {
          enableMove: true,
          enableDelete: true,
          enableCopy: true,
          enableNewWindow: true,
          enableFrequentlyUsed: true
        });
      }
    });

    const btn = card.querySelector('.context-menu-btn');
    if (btn && contextMenuManager) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        contextMenuManager.showCardMenu(e, link, card, {
          enableMove: true,
          enableDelete: true,
          enableCopy: true,
          enableNewWindow: true,
          enableFrequentlyUsed: true
        });
      });
    }

    // 绑定图标错误处理（统一流程）
    const iconImg = card.querySelector('.card-icon');
    if (iconImg && link.url) {
      setupIconErrorHandling(iconImg, link.url, link.title);
    }

    return card;
  }
}

// 导出
window.SearchResultsPanel = SearchResultsPanel;


