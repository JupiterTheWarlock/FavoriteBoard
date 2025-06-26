// FavoriteBoard Plugin - 配置和初始化
// 页面配置和favicon设置

// 应用网站配置
function applySiteConfig() {
    // 设置页面标题
    document.title = 'FavoriteBoard - 收藏夹管理面板';
    
    // 设置logo
    const logoElement = document.getElementById('siteLogo');
    if (logoElement) {
        logoElement.textContent = '🐱 FavoriteBoard';
    }
}

// 硬编码favicon设置 - 确保favicon始终可用
function setFavicon() {
    // 优先尝试SVG格式的favicon
    const svgFavicon = './assets/icons/favicon.svg';
    const pngFavicon = './assets/icons/favicon.png';
    
    // 检查现有的favicon链接
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    
    // 如果没有现有的favicon链接，或者需要确保使用正确的路径
    if (existingFavicons.length === 0) {
        // 添加SVG favicon
        const svgLink = document.createElement('link');
        svgLink.rel = 'icon';
        svgLink.type = 'image/svg+xml';
        svgLink.href = svgFavicon;
        document.head.appendChild(svgLink);
        
        // 添加PNG备用favicon
        const pngLink = document.createElement('link');
        pngLink.rel = 'icon';
        pngLink.type = 'image/png';
        pngLink.href = pngFavicon;
        document.head.appendChild(pngLink);
        
        // 添加Apple Touch图标
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = pngFavicon;
        document.head.appendChild(appleLink);
    } else {
        // 确保现有的favicon使用正确的路径
        existingFavicons.forEach(link => {
            if (link.type === 'image/svg+xml' || link.href.includes('.svg')) {
                link.href = svgFavicon;
            } else if (link.type === 'image/png' || link.href.includes('.png') || link.rel === 'apple-touch-icon') {
                link.href = pngFavicon;
            }
        });
    }
}

// 在DOM加载完成后应用配置
document.addEventListener('DOMContentLoaded', function() {
    setFavicon(); // 首先设置favicon
    applySiteConfig(); // 然后应用其他配置
});

// 如果脚本已经加载，立即应用配置
if (document.readyState === 'complete') {
    setFavicon();
    applySiteConfig();
} 