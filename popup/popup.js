// FavoriteBoard Plugin - Popup Script
class PopupManager {
  constructor() {
    this.init();
  }
  
  async init() {
    try {
      await this.loadStats();
      this.bindEvents();
      this.showContent();
    } catch (error) {
      this.showError(error);
    }
  }
  
  async loadStats() {
    const response = await this.sendMessage({ action: 'getBookmarksCache' });
    
    if (response.success && response.data) {
      const stats = {
        totalBookmarks: response.data.totalBookmarks || 0,
        totalFolders: response.data.totalFolders || 0
      };
      this.updateStats(stats);
    } else {
      throw new Error(response.error || 'Failed to load stats');
    }
  }
  
  updateStats(stats) {
    document.getElementById('bookmarkCount').textContent = stats.totalBookmarks;
    document.getElementById('folderCount').textContent = stats.totalFolders;
  }
  
  bindEvents() {
    document.getElementById('openNewTab').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'chrome://newtab/' });
      window.close();
    });
    
    document.getElementById('refreshCache').addEventListener('click', (e) => {
      e.preventDefault();
      this.refreshCache();
    });
  }
  
  async refreshCache() {
    const btn = document.getElementById('refreshCache');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="action-icon">⏳</span><span>刷新中...</span>';
    
    try {
      const response = await this.sendMessage({ action: 'refreshCache' });
      if (response.success) {
        await this.loadStats();
        btn.innerHTML = '<span class="action-icon">✅</span><span>刷新成功</span>';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 1500);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      btn.innerHTML = '<span class="action-icon">❌</span><span>刷新失败</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
  }
  
  showContent() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  }
  
  showError(error) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = error.message;
  }
  
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});