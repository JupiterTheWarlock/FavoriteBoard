// FavoriteBoard Plugin - 核心系统初始化
// 负责在页面加载时初始化核心系统组件

/**
 * 初始化核心系统组件
 * 确保在页面加载时创建全局事件总线和其他核心组件
 */
(function() {
  // 创建全局事件总线
  window.eventBus = new EventBus();
  
  // 设置事件总线调试模式（开发环境启用）
  const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDevMode) {
    window.eventBus.setDebug(true);
    console.log('🐛 事件总线调试模式已启用');
  }
  
  // 页面加载完成后初始化应用
  window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 页面加载完成，初始化应用...');
    
    try {
      // 创建主应用实例
      window.linkBoardApp = new ToolboxApp();
      
      // 发布应用初始化完成事件
      window.eventBus.emit('app-initialized', {
        timestamp: Date.now()
      });
      
      console.log('✅ 应用初始化完成');
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      
      // 显示错误信息
      const appContainer = document.querySelector('.app');
      if (appContainer) {
        appContainer.innerHTML = `
          <div class="error-container">
            <div class="error-icon">❌</div>
            <h3>应用初始化失败</h3>
            <p>${error.message}</p>
            <div class="error-details">
              <pre>${error.stack}</pre>
            </div>
          </div>
        `;
      }
    }
  });
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    // 使用防抖处理窗口大小变化事件
    if (window.resizeTimer) {
      clearTimeout(window.resizeTimer);
    }
    
    window.resizeTimer = setTimeout(() => {
      if (window.eventBus) {
        window.eventBus.emit('window-resized', {
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    }, 250);
  });
  
  console.log('🐱 核心系统初始化脚本加载完成');
})(); 