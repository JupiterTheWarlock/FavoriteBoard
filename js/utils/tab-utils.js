/**
 * Tab工具函数 - 提供Tab组件通用的工具方法
 * 包含图标处理、HTML转义、文件夹图标等功能
 */

// ==================== 图标处理相关方法 ====================

/**
 * 检查图标URL是否有效
 * @param {string} iconUrl - 图标URL
 * @returns {boolean}
 */
function isValidIconUrl(iconUrl) {
  if (!iconUrl || typeof iconUrl !== 'string') return false;
  
  try {
    if (iconUrl.startsWith('data:')) return true;
    const url = new URL(iconUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// ==================== 首字母Icon生成相关方法 ====================

/**
 * 中文拼音首字母映射表（常用字符）
 * @param {string} char - 中文字符
 * @returns {string} 拼音首字母
 */
function getPinyinFirstLetter(char) {
  if (!char || typeof char !== 'string') return '?';
  
  const code = char.charCodeAt(0);
  // 中文字符Unicode范围：\u4e00-\u9fa5
  if (code < 0x4e00 || code > 0x9fa5) return null;
  
  // 常用中文字符拼音首字母映射表
  // 这里实现一个简化版本，覆盖常用字符
  // 完整版本可以使用第三方库或更完整的映射表
  const pinyinMap = {
    '啊': 'A', '阿': 'A', '爱': 'A', '安': 'A',
    '把': 'B', '白': 'B', '百': 'B', '帮': 'B', '被': 'B', '本': 'B', '比': 'B', '必': 'B', '变': 'B', '表': 'B', '别': 'B', '并': 'B', '不': 'B',
    '才': 'C', '参': 'C', '操': 'C', '草': 'C', '查': 'C', '差': 'C', '长': 'C', '常': 'C', '场': 'C', '车': 'C', '成': 'C', '城': 'C', '程': 'C', '出': 'C', '处': 'C', '传': 'C', '创': 'C', '从': 'C',
    '大': 'D', '代': 'D', '带': 'D', '单': 'D', '当': 'D', '到': 'D', '道': 'D', '得': 'D', '的': 'D', '等': 'D', '地': 'D', '第': 'D', '点': 'D', '电': 'D', '调': 'D', '定': 'D', '动': 'D', '都': 'D', '读': 'D', '对': 'D', '多': 'D',
    '而': 'E', '二': 'E',
    '发': 'F', '法': 'F', '反': 'F', '方': 'F', '放': 'F', '非': 'F', '分': 'F', '风': 'F', '服': 'F', '复': 'F', '副': 'F',
    '该': 'G', '改': 'G', '干': 'G', '感': 'G', '高': 'G', '告': 'G', '个': 'G', '各': 'G', '给': 'G', '根': 'G', '更': 'G', '工': 'G', '公': 'G', '功': 'G', '共': 'G', '构': 'G', '够': 'G', '故': 'G', '关': 'G', '观': 'G', '管': 'G', '光': 'G', '广': 'G', '规': 'G', '国': 'G', '过': 'G',
    '还': 'H', '海': 'H', '好': 'H', '号': 'H', '和': 'H', '合': 'H', '何': 'H', '河': 'H', '很': 'H', '红': 'H', '后': 'H', '候': 'H', '呼': 'H', '护': 'H', '花': 'H', '化': 'H', '话': 'H', '画': 'H', '回': 'H', '会': 'H', '活': 'H', '火': 'H',
    '机': 'J', '基': 'J', '及': 'J', '即': 'J', '集': 'J', '几': 'J', '计': 'J', '记': 'J', '技': 'J', '际': 'J', '加': 'J', '家': 'J', '价': 'J', '间': 'J', '见': 'J', '件': 'J', '建': 'J', '将': 'J', '讲': 'J', '交': 'J', '教': 'J', '较': 'J', '接': 'J', '节': 'J', '结': 'J', '解': 'J', '界': 'J', '今': 'J', '金': 'J', '进': 'J', '近': 'J', '经': 'J', '精': 'J', '景': 'J', '警': 'J', '净': 'J', '静': 'J', '就': 'J', '举': 'J', '具': 'J', '据': 'J', '距': 'J', '决': 'J', '绝': 'J', '军': 'J',
    '开': 'K', '看': 'K', '可': 'K', '克': 'K', '空': 'K', '口': 'K', '快': 'K', '宽': 'K', '况': 'K', '困': 'K',
    '拉': 'L', '来': 'L', '蓝': 'L', '老': 'L', '乐': 'L', '类': 'L', '冷': 'L', '离': 'L', '里': 'L', '理': 'L', '力': 'L', '历': 'L', '立': 'L', '利': 'L', '连': 'L', '联': 'L', '脸': 'L', '两': 'L', '量': 'L', '了': 'L', '列': 'L', '林': 'L', '临': 'L', '灵': 'L', '领': 'L', '流': 'L', '六': 'L', '路': 'L', '绿': 'L', '乱': 'L',
    '马': 'M', '吗': 'M', '买': 'M', '卖': 'M', '满': 'M', '慢': 'M', '忙': 'M', '毛': 'M', '没': 'M', '每': 'M', '美': 'M', '门': 'M', '们': 'M', '面': 'M', '民': 'M', '名': 'M', '明': 'M', '命': 'M', '模': 'M', '目': 'M', '木': 'M', '目': 'M',
    '那': 'N', '哪': 'N', '内': 'N', '能': 'N', '你': 'N', '年': 'N', '念': 'N', '鸟': 'N', '您': 'N', '牛': 'N', '农': 'N', '女': 'N',
    '哦': 'O', '欧': 'O',
    '怕': 'P', '拍': 'P', '排': 'P', '派': 'P', '判': 'P', '旁': 'P', '跑': 'P', '配': 'P', '批': 'P', '皮': 'P', '片': 'P', '票': 'P', '品': 'P', '平': 'P', '评': 'P', '破': 'P',
    '七': 'Q', '期': 'Q', '其': 'Q', '奇': 'Q', '起': 'Q', '气': 'Q', '器': 'Q', '千': 'Q', '前': 'Q', '钱': 'Q', '强': 'Q', '桥': 'Q', '切': 'Q', '且': 'Q', '亲': 'Q', '清': 'Q', '情': 'Q', '请': 'Q', '求': 'Q', '球': 'Q', '区': 'Q', '取': 'Q', '去': 'Q', '全': 'Q', '确': 'Q',
    '然': 'R', '让': 'R', '热': 'R', '人': 'R', '认': 'R', '任': 'R', '日': 'R', '容': 'R', '容': 'R', '如': 'R', '入': 'R', '软': 'R',
    '三': 'S', '色': 'S', '山': 'S', '闪': 'S', '商': 'S', '上': 'S', '少': 'S', '设': 'S', '社': 'S', '身': 'S', '深': 'S', '神': 'S', '生': 'S', '声': 'S', '省': 'S', '失': 'S', '十': 'S', '时': 'S', '实': 'S', '识': 'S', '史': 'S', '使': 'S', '世': 'S', '事': 'S', '是': 'S', '手': 'S', '首': 'S', '受': 'S', '书': 'S', '树': 'S', '数': 'S', '双': 'S', '水': 'S', '说': 'S', '思': 'S', '四': 'S', '送': 'S', '速': 'S', '算': 'S', '随': 'S', '所': 'S',
    '他': 'T', '她': 'T', '它': 'T', '台': 'T', '太': 'T', '态': 'T', '谈': 'T', '汤': 'T', '堂': 'T', '逃': 'T', '特': 'T', '提': 'T', '题': 'T', '体': 'T', '天': 'T', '条': 'T', '跳': 'T', '听': 'T', '停': 'T', '通': 'T', '同': 'T', '统': 'T', '头': 'T', '投': 'T', '透': 'T', '突': 'T', '图': 'T', '土': 'T', '团': 'T', '推': 'T', '退': 'T', '脱': 'T',
    '外': 'W', '完': 'W', '玩': 'W', '晚': 'W', '万': 'W', '网': 'W', '往': 'W', '望': 'W', '危': 'W', '为': 'W', '位': 'W', '未': 'W', '文': 'W', '问': 'W', '我': 'W', '无': 'W', '五': 'W', '物': 'W',
    '西': 'X', '息': 'X', '希': 'X', '习': 'X', '系': 'X', '细': 'X', '下': 'X', '先': 'X', '现': 'X', '线': 'X', '限': 'X', '相': 'X', '想': 'X', '向': 'X', '像': 'X', '消': 'X', '小': 'X', '校': 'X', '笑': 'X', '些': 'X', '写': 'X', '新': 'X', '心': 'X', '信': 'X', '星': 'X', '行': 'X', '形': 'X', '型': 'X', '性': 'X', '姓': 'X', '雄': 'X', '休': 'X', '修': 'X', '需': 'X', '许': 'X', '续': 'X', '选': 'X', '学': 'X', '雪': 'X',
    '压': 'Y', '呀': 'Y', '言': 'Y', '眼': 'Y', '演': 'Y', '验': 'Y', '样': 'Y', '要': 'Y', '也': 'Y', '页': 'Y', '夜': 'Y', '一': 'Y', '医': 'Y', '依': 'Y', '已': 'Y', '以': 'Y', '意': 'Y', '易': 'Y', '因': 'Y', '音': 'Y', '引': 'Y', '印': 'Y', '应': 'Y', '英': 'Y', '迎': 'Y', '影': 'Y', '用': 'Y', '优': 'Y', '由': 'Y', '有': 'Y', '又': 'Y', '右': 'Y', '于': 'Y', '鱼': 'Y', '与': 'Y', '语': 'Y', '雨': 'Y', '育': 'Y', '预': 'Y', '元': 'Y', '原': 'Y', '远': 'Y', '院': 'Y', '愿': 'Y', '约': 'Y', '月': 'Y', '越': 'Y', '云': 'Y', '运': 'Y',
    '再': 'Z', '在': 'Z', '咱': 'Z', '早': 'Z', '造': 'Z', '则': 'Z', '怎': 'Z', '增': 'Z', '展': 'Z', '站': 'Z', '张': 'Z', '长': 'Z', '掌': 'Z', '找': 'Z', '照': 'Z', '这': 'Z', '真': 'Z', '正': 'Z', '证': 'Z', '政': 'Z', '之': 'Z', '支': 'Z', '知': 'Z', '直': 'Z', '值': 'Z', '只': 'Z', '指': 'Z', '至': 'Z', '制': 'Z', '治': 'Z', '中': 'Z', '终': 'Z', '种': 'Z', '重': 'Z', '周': 'Z', '主': 'Z', '住': 'Z', '助': 'Z', '注': 'Z', '祝': 'Z', '抓': 'Z', '专': 'Z', '转': 'Z', '装': 'Z', '状': 'Z', '追': 'Z', '准': 'Z', '着': 'Z', '资': 'Z', '子': 'Z', '自': 'Z', '字': 'Z', '总': 'Z', '走': 'Z', '足': 'Z', '组': 'Z', '最': 'Z', '作': 'Z', '做': 'Z'
  };
  
  return pinyinMap[char] || '?';
}

/**
 * 提取首字母
 * @param {string} title - 标题
 * @param {string} url - URL
 * @returns {string} 首字母（大写）
 */
function extractFirstLetter(title, url) {
  let source = title;
  
  // 如果title为空，使用URL
  if (!source || source.trim() === '') {
    if (!url) return '?';
    
    try {
      // 跳过协议部分，提取域名或路径的首字符
      const urlObj = new URL(url);
      source = urlObj.hostname || urlObj.pathname || url;
      // 移除www.前缀
      source = source.replace(/^www\./i, '');
    } catch (e) {
      source = url;
    }
  }
  
  if (!source || source.trim() === '') return '?';
  
  // 获取第一个非空白字符
  const firstChar = source.trim()[0];
  if (!firstChar) return '?';
  
  // 判断是否为中文字符
  const code = firstChar.charCodeAt(0);
  if (code >= 0x4e00 && code <= 0x9fa5) {
    // 中文字符，转换为拼音首字母
    return getPinyinFirstLetter(firstChar).toUpperCase();
  }
  
  // 英文字母，转换为大写
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
    return firstChar.toUpperCase();
  }
  
  // 数字或其他特殊字符，直接返回
  return firstChar;
}

/**
 * 生成首字母SVG图标
 * @param {string} letter - 首字母
 * @returns {string} SVG data URI
 */
function generateLetterIcon(letter) {
  if (!letter || letter.length === 0) {
    letter = '?';
  }
  
  // 只取第一个字符
  letter = letter.charAt(0);
  
  // 转义HTML特殊字符
  const escapedLetter = escapeHtml(letter);
  
  // 生成SVG
  const svg = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" rx="2" fill="#000000"/>
  <text x="8" y="12" text-anchor="middle" fill="white" font-size="10" font-family="system-ui, -apple-system, sans-serif">${escapedLetter}</text>
</svg>`;
  
  // 转换为base64 data URI
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * 规范化缓存键
 * @param {string} title - 标题
 * @param {string} url - URL
 * @returns {string} 规范化后的键
 */
function normalizeCacheKey(title, url) {
  const source = (title && title.trim()) || (url && url.trim()) || '';
  // 转换为小写，去除首尾空格，用于缓存键
  return source.toLowerCase().trim();
}

/**
 * 获取首字母icon（带缓存）
 * @param {string} title - 标题
 * @param {string} url - URL
 * @returns {Promise<string>} 首字母icon的data URI
 */
async function getLetterIconWithCache(title, url) {
  // 提取首字母
  const letter = extractFirstLetter(title, url);
  
  // 生成缓存键
  const normalizedKey = normalizeCacheKey(title, url);
  const cacheKey = `letterIcon_${normalizedKey}`;
  
  // 检查缓存
  try {
    const cached = await chrome.storage.local.get([cacheKey]);
    if (cached[cacheKey]) {
      return cached[cacheKey];
    }
  } catch (error) {
    console.log('[favicon]读取首字母icon缓存失败:', error);
  }
  
  // 生成icon
  const iconDataUri = generateLetterIcon(letter);
  
  // 缓存icon
  try {
    await chrome.storage.local.set({ [cacheKey]: iconDataUri });
  } catch (error) {
    console.log('[favicon]保存首字母icon缓存失败:', error);
  }
  
  return iconDataUri;
}

/**
 * 获取默认图标（同步版本，用于HTML模板）
 * @param {string} title - 标题（可选）
 * @param {string} url - URL（可选）
 * @returns {string} 默认图标data URI
 */
function getDefaultIcon(title = null, url = null) {
  // 如果提供了title或url，使用首字母icon（同步生成，不使用缓存）
  if (title || url) {
    const letter = extractFirstLetter(title, url);
    return generateLetterIcon(letter);
  }
  
  // 保持向后兼容：返回原来的默认SVG icon
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzMzNzNkYyIvPgo8cGF0aCBkPSJNOCA0SDEyVjEySDhWNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00IDRIOFYxMkg0VjRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjciLz4KPC9zdmc+';
}

/**
 * 获取安全的图标URL（同步版本，用于初始渲染）
 * @param {string} iconUrl - 原始图标URL
 * @param {string} websiteUrl - 网站URL
 * @returns {string}
 */
function getSafeIcon(iconUrl, websiteUrl = null) {
  if (iconUrl && isValidIconUrl(iconUrl)) {
    return iconUrl;
  }
  
  if (websiteUrl) {
    try {
      const domain = new URL(websiteUrl).hostname;
      return `https://${domain}/favicon.ico`;
    } catch (e) {
      console.log('[favicon]无法解析网站URL生成favicon:', websiteUrl);
    }
  }
  
  return getDefaultIcon();
}

/**
 * 获取图标URL（带缓存，异步版本）
 * 通过 BookmarkManager 的统一缓存机制获取 favicon
 * @param {string} iconUrl - 原始图标URL（如果已有）
 * @param {string} websiteUrl - 网站URL（用于fallback）
 * @returns {Promise<string>} 图标URL
 */
async function getIconWithCache(iconUrl, websiteUrl = null) {
  // 如果已有有效的iconUrl，直接返回
  if (iconUrl && isValidIconUrl(iconUrl)) {
    return iconUrl;
  }
  
  // 如果没有websiteUrl，返回默认图标
  if (!websiteUrl) {
    return getDefaultIcon();
  }
  
  // 通过BookmarkManager获取favicon（带缓存）
  try {
    const app = window.linkBoardApp;
    if (app && app.bookmarkManager) {
      const favicon = await app.bookmarkManager.getFavicon(websiteUrl);
      return favicon || getDefaultIcon();
    }
  } catch (error) {
    console.log('[favicon]获取favicon失败，使用默认图标:');
  }
  
  return getDefaultIcon();
}

/**
 * 设置图标错误处理（统一流程）
 * 当图标加载失败时，按照以下顺序尝试fallback：
 * 1. 标准路径: https://${domain}/favicon.ico
 * 2. DuckDuckGo服务: https://external-content.duckduckgo.com/ip3/${domain}.ico
 * 3. 首字母icon: 使用标题或URL生成首字母图标（兜底方案）
 * 4. 默认图标: 使用data-fallback属性中的默认图标
 * 
 * 每次尝试如果超过5秒无响应，会自动跳到下一次尝试
 * @param {HTMLImageElement} iconImg - 图标img元素
 * @param {string} url - 网站URL
 * @param {string} title - 标题（可选，用于生成首字母icon作为兜底）
 */
function setupIconErrorHandling(iconImg, url, title = null) {
  let timeoutId = null;
  let isSuccess = false;
  let currentAttempt = 0; // 当前尝试次数
  const timedOutAttempts = new Set(); // 记录所有已超时的尝试编号
  const TIMEOUT_MS = 1000; // 1秒超时
  
  console.log('[favicon]初始化图标错误处理，URL:', url, '标题:', title);
  
  // 清除timeout
  const clearTimeoutHandler = () => {
    if (timeoutId !== null) {
      console.log('[favicon]清除timeout');
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  // 尝试下一个fallback
  const tryNextFallback = async (attemptNumber) => {
    if (isSuccess) {
      console.log('[favicon]已经成功，停止尝试');
      return;
    }
    
    currentAttempt = attemptNumber;
    console.log(`[favicon]尝试 ${attemptNumber}`);
    
    if (attemptNumber === 1) {
      // 第1次：尝试标准的 domain/favicon.ico 路径
      if (url) {
        try {
          const domain = new URL(url).hostname;
          const newSrc = `https://${domain}/favicon.ico`;
          console.log('[favicon]设置src为:', newSrc, url);
          iconImg.src = newSrc;
          startTimeout(attemptNumber);
          return;
        } catch (e) {
          console.log('[favicon]无法解析URL:', url);
        }
      }
      // 如果URL解析失败，直接尝试下一个
      tryNextFallback(attemptNumber + 1);
      return;
    }
    
    if (attemptNumber === 2) {
      // 第2次：尝试DuckDuckGo favicon服务
      if (url) {
        try {
          const domain = new URL(url).hostname;
          const newSrc = `https://external-content.duckduckgo.com/ip3/${domain}.ico`;
          console.log('[favicon]设置src为:', newSrc, url);
          iconImg.src = newSrc;
          startTimeout(attemptNumber);
          return;
        } catch (e) {
          console.log('[favicon]无法解析URL:', url);
        }
      }
      // 如果URL解析失败，直接尝试下一个
      tryNextFallback(attemptNumber + 1);
      return;
    }
    
    if (attemptNumber === 3) {
      // 第3次：尝试使用首字母icon
      try {
        if (title || url) {
          console.log('[favicon]生成首字母icon', url);
          const letterIcon = await getLetterIconWithCache(title, url);
          if (letterIcon) {
            console.log('[favicon]设置src为:', letterIcon, url);
            iconImg.src = letterIcon;
            startTimeout(attemptNumber);
            return;
          }
        }
      } catch (error) {
        console.log('[favicon]获取首字母icon失败:', error);
      }
      // 如果失败，尝试下一个
      tryNextFallback(attemptNumber + 1);
      return;
    }
    
    // 最终fallback：使用默认图标
    console.log('[favicon]使用默认图标', url);
    const fallbackUrl = iconImg.dataset.fallback;
    if (fallbackUrl) {
      console.log('[favicon]设置src为:', fallbackUrl, url);
      clearTimeoutHandler();
      iconImg.src = fallbackUrl;
    } else {
      console.log('[favicon]没有默认图标可用');
    }
  };
  
  // 启动timeout
  const startTimeout = (attemptNumber) => {
    clearTimeoutHandler();
    console.log(`[favicon]启动 ${TIMEOUT_MS}ms timeout`, url);
    timeoutId = window.setTimeout(() => {
      console.log(`[favicon]尝试 ${attemptNumber} 超时，跳到下一次`, url);
      timeoutId = null;
      // 记录这个尝试已超时
      timedOutAttempts.add(attemptNumber);
      console.log(`[favicon]已超时的尝试:`, Array.from(timedOutAttempts), url);
      // 跳到下一步
      if (!isSuccess && currentAttempt === attemptNumber) {
        tryNextFallback(attemptNumber + 1);
      }
    }, TIMEOUT_MS);
  };
  
  // 监听load事件，成功时清除timeout
  iconImg.addEventListener('load', () => {
    const loadSrc = iconImg.src;
    console.log('[favicon]图标加载成功:', loadSrc, url);
    
    // 检查这个load属于哪个尝试
    let loadAttempt = 0;
    if (url) {
      try {
        const domain = new URL(url).hostname;
        if (loadSrc.includes(`${domain}/favicon.ico`)) {
          loadAttempt = 1;
        } else if (loadSrc.includes('duckduckgo.com')) {
          loadAttempt = 2;
        } else if (loadSrc.startsWith('data:')) {
          loadAttempt = 3;
        }
      } catch (e) {
        // 忽略
      }
    }
    
    console.log(`[favicon]load事件来自尝试 ${loadAttempt}`, url);
    
    // 如果这个尝试已超时，忽略这个load
    if (timedOutAttempts.has(loadAttempt)) {
      console.log(`[favicon]尝试 ${loadAttempt} 已超时，忽略load事件`, url);
      return;
    }
    
    // 正常情况：load成功
    clearTimeoutHandler();
    console.log('[favicon]图标加载成功，停止尝试', url);
    isSuccess = true;
  }, { once: false });
  
  // 监听error事件，失败时尝试下一个
  iconImg.addEventListener('error', () => {
    console.log('[favicon]图标加载失败，当前尝试:', currentAttempt, url);
    
    // 如果这个尝试已超时，忽略这个error
    if (timedOutAttempts.has(currentAttempt)) {
      console.log(`[favicon]尝试 ${currentAttempt} 已超时，忽略error事件`, url);
      return;
    }
    
    // 正常情况：error，跳到下一步
    clearTimeoutHandler();
    if (!isSuccess) {
      tryNextFallback(currentAttempt + 1);
    }
  }, { once: false });
  
  // 初始尝试
  tryNextFallback(1);
}

/**
 * 获取文件夹图标
 * @param {string} title - 文件夹标题
 * @param {number} depth - 文件夹深度
 * @returns {string}
 */
function getFolderIcon(title, depth = 0) {
  if (!title) return '📁';
  
  const titleLower = title.toLowerCase();
  
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
  
  return depth === 0 ? '📁' : '📂';
}

// ==================== HTML处理相关方法 ====================

/**
 * 转义HTML字符
 * @param {string} text - 文本
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 从URL获取域名
 * @param {string} url - URL
 * @returns {string}
 */
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

// ==================== 时间格式化相关方法 ====================

/**
 * 格式化时间显示（简洁/相对）
 * @param {Date} date - 日期对象
 * @returns {string}
 */
function formatTime(date) {
  if (!date) return '未知时间';
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) {
    return '刚刚';
  }
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} 分钟前`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} 小时前`;
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} 天前`;
  }
  // 超过7天，显示详细日期（带年份）
  return formatTimeDetailed(date);
}

/**
 * 格式化时间显示（详细/绝对，始终带年份）
 * @param {Date} date - 日期对象
 * @returns {string}
 */
function formatTimeDetailed(date) {
  if (!date) return '未知时间';
  // yyyy-MM-dd HH:mm
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

// ==================== 空状态创建方法 ====================

/**
 * 创建空状态元素
 * @param {string} message - 显示消息
 * @param {string} icon - 图标
 * @returns {HTMLElement}
 */
function createEmptyState(message, icon = '📭') {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  
  emptyState.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-message">${escapeHtml(message)}</div>
  `;
  
  return emptyState;
}

// ==================== 导出到全局作用域 ====================

window.isValidIconUrl = isValidIconUrl;
window.getDefaultIcon = getDefaultIcon;
window.getSafeIcon = getSafeIcon;
window.getIconWithCache = getIconWithCache;
window.setupIconErrorHandling = setupIconErrorHandling;
window.getFolderIcon = getFolderIcon;
window.escapeHtml = escapeHtml;
window.getDomainFromUrl = getDomainFromUrl;
window.formatTime = formatTime;
window.formatTimeDetailed = formatTimeDetailed;
window.createEmptyState = createEmptyState;
window.getLetterIconWithCache = getLetterIconWithCache;
window.extractFirstLetter = extractFirstLetter;

window.TabUtils = {
  isValidIconUrl,
  getDefaultIcon,
  getSafeIcon,
  getIconWithCache,
  setupIconErrorHandling,
  getFolderIcon,
  escapeHtml,
  getDomainFromUrl,
  formatTime,
  formatTimeDetailed,
  createEmptyState,
  getLetterIconWithCache,
  extractFirstLetter
};