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
    // 监听变更
    setTimeout(() => {
      const checkbox = settingsContainer.querySelector('#showBookmarkTimeCheckbox');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          const checked = !!e.target.checked;
          this.showBookmarkTime = checked;
          if (window.Storage && window.Storage.set) {
            window.Storage.set('showBookmarkTime', checked);
          }
          // 通知所有BookmarkTab刷新
          if (window.eventBus) {
            window.eventBus.emit('settings-updated', { showBookmarkTime: checked });
          }
          if (window.TabFactory && window.TabFactory.prototype.getTabInstances) {
            const factory = window.tabFactory || window.TabFactory.instance;
            if (factory) {
              const tabs = factory.getTabInstances('bookmark');
              tabs.forEach(tab => {
                tab.showBookmarkTime = checked;
                if (tab.container) {
                  tab.renderBookmarkContent(tab.container);
                }
              });
            }
          }
        });
      }
    }, 0);
    // 其余内容保留基础结构
    container.appendChild(settingsContainer);
  }
}

window.SettingsTab = SettingsTab; 