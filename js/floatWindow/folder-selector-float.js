// FavoriteBoard - FolderSelector 悬浮窗主控制器
// 监听 background 消息，页面内插入/移除悬浮窗，挂载 UI 和倒计时环

(function() {
  // 悬浮窗唯一ID，防止重复插入
  const FLOAT_ID = 'favoriteboard-folder-selector-float';
  let countdownTimer = null;
  let paused = false;

  // 监听 background 消息
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'show-folder-selector-float') {
      showFloat(msg.bookmarkId, msg.bookmark);
    }
  });

  // 创建悬浮窗DOM
  function showFloat(bookmarkId, bookmark) {
    // 已存在则先移除
    removeFloat();

    // 创建主容器
    const float = document.createElement('div');
    float.id = FLOAT_ID;
    float.style.position = 'fixed';
    float.style.top = '0'; // 顶到页面最上方
    float.style.right = '0'; // 顶到页面最右侧
    float.style.zIndex = '999999';
    float.style.width = '170px'; // 原来340px，减半
    float.style.background = '#fff';
    float.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    float.style.borderRadius = '12px';
    float.style.overflow = 'hidden';
    float.style.fontFamily = 'inherit';
    float.style.transition = 'opacity 0.2s';
    float.style.opacity = '1';

    // 顶部栏
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.padding = '8px 8px 4px 8px'; // 原来16px 20px 8px 20px，减小
    header.style.fontWeight = 'bold';
    header.style.fontSize = '15px';
    header.style.userSelect = 'none';
    header.innerHTML = `
      <span id="fb-float-title" style="cursor:pointer;">FavoriteBoard</span>
      <span id="fb-float-close" style="position:relative;cursor:pointer;width:28px;height:28px;display:inline-block;"></span>
    `;
    float.appendChild(header);

    // 倒计时环（SVG）
    const closeBtn = header.querySelector('#fb-float-close');
    closeBtn.appendChild(createCountdownRing(5)); // 5秒倒计时

    // 中部：FolderSelector容器
    const selectorWrap = document.createElement('div');
    selectorWrap.id = 'fb-float-folder-selector-wrap';
    selectorWrap.style.padding = '0 8px 8px 8px'; // 原来0 20px 12px 20px，减小
    float.appendChild(selectorWrap);

    // 底部：设置按钮
    const footer = document.createElement('div');
    footer.style.textAlign = 'right';
    footer.style.padding = '0 8px 8px 8px'; // 原来0 20px 16px 20px，减小
    footer.innerHTML = '<button id="fb-float-settings" style="background:none;border:none;color:#888;cursor:pointer;font-size:13px;">设置</button>';
    float.appendChild(footer);

    // 插入DOM
    document.body.appendChild(float);

    // 挂载FolderSelector（异步加载/复用）
    mountFolderSelector(selectorWrap, bookmarkId, bookmark);

    // 事件绑定
    closeBtn.onclick = removeFloat;
    header.querySelector('#fb-float-title').onclick = () => {
      chrome.runtime.sendMessage({ action: 'openMainPage' });
      removeFloat();
    };
    footer.querySelector('#fb-float-settings').onclick = () => {
      chrome.runtime.sendMessage({ action: 'openMainPage', hash: '#settings' });
      removeFloat();
    };

    // 悬浮窗鼠标悬停暂停倒计时
    float.addEventListener('mouseenter', () => {
      paused = true;
      if (countdownTimer) countdownTimer.pause();
    });
    float.addEventListener('mouseleave', () => {
      if (paused && countdownTimer) {
        paused = false;
        countdownTimer.resume();
      }
    });
  }

  // 移除悬浮窗
  function removeFloat() {
    const exist = document.getElementById(FLOAT_ID);
    if (exist) {
      exist.style.opacity = '0';
      setTimeout(() => exist.remove(), 180);
    }
    if (countdownTimer) {
      countdownTimer.destroy();
      countdownTimer = null;
    }
  }

  // 创建倒计时环（SVG）
  function createCountdownRing(seconds) {
    const size = 28, stroke = 3, radius = (size - stroke) / 2;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.transform = 'rotate(-90deg)';
    svg.style.pointerEvents = 'none';

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', size/2);
    bg.setAttribute('cy', size/2);
    bg.setAttribute('r', radius);
    bg.setAttribute('stroke', '#eee');
    bg.setAttribute('stroke-width', stroke);
    bg.setAttribute('fill', 'none');
    svg.appendChild(bg);

    const fg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fg.setAttribute('cx', size/2);
    fg.setAttribute('cy', size/2);
    fg.setAttribute('r', radius);
    fg.setAttribute('stroke', '#f66');
    fg.setAttribute('stroke-width', stroke);
    fg.setAttribute('fill', 'none');
    fg.setAttribute('stroke-linecap', 'round');
    fg.setAttribute('stroke-dasharray', 2 * Math.PI * radius);
    fg.setAttribute('stroke-dashoffset', 0);
    svg.appendChild(fg);

    // 计时逻辑
    let start = Date.now();
    let remain = seconds;
    let pausedAt = null;
    let rafId = null;
    function update() {
      if (paused) return;
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, remain - elapsed);
      const percent = left / seconds;
      fg.setAttribute('stroke-dashoffset', (1 - percent) * 2 * Math.PI * radius);
      if (left > 0) {
        rafId = requestAnimationFrame(update);
      } else {
        removeFloat();
      }
    }
    countdownTimer = {
      pause() {
        if (!pausedAt) {
          pausedAt = Date.now();
        }
      },
      resume() {
        if (pausedAt) {
          start += Date.now() - pausedAt;
          pausedAt = null;
          update();
        }
      },
      destroy() {
        cancelAnimationFrame(rafId);
      }
    };
    update();
    return svg;
  }

  // 挂载FolderSelector组件（需异步加载/复用）
  function mountFolderSelector(container, bookmarkId, bookmark) {
    // 假设window.FolderSelector已暴露，或动态import
    if (window.FolderSelector) {
      renderSelector();
    } else {
      // 动态加载js/ui/folder-selector.js
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('js/ui/folder-selector.js');
      script.onload = renderSelector;
      document.head.appendChild(script);
    }
    function renderSelector() {
      // 这里假设FolderSelector支持如下API
      // new FolderSelector({onSelect: fn, mount: container, ...})
      new window.FolderSelector({
        mount: container,
        bookmark,
        onSelect: (folderId) => {
          // 移动书签到目标文件夹
          moveBookmarkToFolder(bookmarkId, folderId);
        }
      });
    }
  }

  // 移动书签到目标文件夹（调用工具函数）
  function moveBookmarkToFolder(bookmarkId, folderId) {
    if (window.moveBookmarkToFolder) {
      window.moveBookmarkToFolder(bookmarkId, folderId).then(() => {
        removeFloat();
      });
    } else {
      // 动态加载工具函数
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('js/utils/card-interaction-utils.js');
      script.onload = () => {
        window.moveBookmarkToFolder(bookmarkId, folderId).then(() => {
          removeFloat();
        });
      };
      document.head.appendChild(script);
    }
  }

  // 提供全局关闭方法（便于调试）
  window.FBFolderSelectorFloat = { close: removeFloat };
  
})(); 