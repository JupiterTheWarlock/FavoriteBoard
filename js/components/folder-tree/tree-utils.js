/**
 * FavoriteBoard - 文件夹树工具类
 * 负责：树操作工具函数、数据处理、路径计算等
 * 
 * @author JupiterTheWarlock
 * @description 文件夹树相关的工具函数集合 🐱
 */

/**
 * 文件夹树工具类 - 静态工具函数集合
 * 提供树结构操作、路径计算、数据转换等功能
 */
class TreeUtils {
  
  /**
   * 根据文件夹标题获取图标
   * @param {string} title - 文件夹标题
   * @param {number} depth - 层级深度
   * @returns {string} 图标emoji
   */
  static getFolderIcon(title, depth = 0) {
    const lowerTitle = title.toLowerCase();
    
    // 特殊文件夹图标映射
    const iconMap = {
      // 常见分类
      '工作': '💼',
      'work': '💼',
      '开发': '💻',
      'dev': '💻',
      'development': '💻',
      '学习': '📚',
      'study': '📚',
      'learn': '📚',
      '项目': '📁',
      'project': '📁',
      'projects': '📁',
      
      // 技术相关
      'github': '🐙',
      'git': '🔗',
      'docs': '📄',
      'documentation': '📄',
      'api': '🔌',
      'tools': '🔧',
      'utils': '🛠️',
      'utilities': '🛠️',
      
      // 娱乐相关
      '游戏': '🎮',
      'game': '🎮',
      'games': '🎮',
      '音乐': '🎵',
      'music': '🎵',
      '视频': '🎬',
      'video': '🎬',
      'videos': '🎬',
      '电影': '🎬',
      'movie': '🎬',
      'movies': '🎬',
      
      // 购物相关
      '购物': '🛍️',
      'shopping': '🛍️',
      'shop': '🛍️',
      '淘宝': '🛒',
      'taobao': '🛒',
      '京东': '📦',
      'jd': '📦',
      
      // 新闻资讯
      '新闻': '📰',
      'news': '📰',
      '资讯': 'ℹ️',
      'info': 'ℹ️',
      
      // 社交相关
      '社交': '👥',
      'social': '👥',
      '论坛': '💬',
      'forum': '💬',
      'reddit': '📱',
      'twitter': '🐦',
      'weibo': '📱',
      
      // 其他常见
      '收藏': '⭐',
      'favorite': '⭐',
      'bookmark': '🔖',
      '临时': '📝',
      'temp': '📝',
      'tmp': '📝',
      '待整理': '📋',
      '其他': '📂',
      'other': '📂',
      'misc': '📂'
    };
    
    // 检查是否有匹配的图标
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (lowerTitle.includes(keyword)) {
        return icon;
      }
    }
    
    // 根据层级返回默认图标
    if (depth === 0) {
      return '📁'; // 根级文件夹
    } else if (depth === 1) {
      return '📂'; // 二级文件夹
    } else {
      return '📄'; // 深层文件夹
    }
  }
  
  /**
   * 查找节点
   * @param {Array} tree - 树数据
   * @param {string} nodeId - 节点ID
   * @returns {Object|null} 找到的节点
   */
  static findNode(tree, nodeId) {
    for (const node of tree) {
      if (node.id === nodeId) {
        return node;
      }
      
      if (node.children && node.children.length > 0) {
        const found = this.findNode(node.children, nodeId);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 查找节点路径
   * @param {Array} tree - 树数据
   * @param {string} nodeId - 节点ID
   * @returns {Array} 路径数组（从根到目标节点）
   */
  static findNodePath(tree, nodeId) {
    const path = [];
    
    const findPath = (nodes, targetId, currentPath) => {
      for (const node of nodes) {
        const newPath = [...currentPath, node];
        
        if (node.id === targetId) {
          path.push(...newPath);
          return true;
        }
        
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, targetId, newPath)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    findPath(tree, nodeId, []);
    return path;
  }
  
  /**
   * 获取节点父节点
   * @param {Array} tree - 树数据
   * @param {string} nodeId - 节点ID
   * @returns {Object|null} 父节点
   */
  static findParentNode(tree, nodeId) {
    const findParent = (nodes, targetId, parent = null) => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return parent;
        }
        
        if (node.children && node.children.length > 0) {
          const found = findParent(node.children, targetId, node);
          if (found !== null) {
            return found;
          }
        }
      }
      
      return null;
    };
    
    return findParent(tree, nodeId);
  }
  
  /**
   * 获取所有子节点ID
   * @param {Object} node - 父节点
   * @param {boolean} includeParent - 是否包含父节点本身
   * @returns {Array} 子节点ID数组
   */
  static getAllChildrenIds(node, includeParent = false) {
    const ids = [];
    
    if (includeParent) {
      ids.push(node.id);
    }
    
    const collectIds = (node) => {
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          ids.push(child.id);
          collectIds(child);
        }
      }
    };
    
    collectIds(node);
    return ids;
  }
  
  /**
   * 扁平化树结构
   * @param {Array} tree - 树数据
   * @param {string} parentId - 父节点ID
   * @returns {Map} 节点ID到节点数据的映射
   */
  static flattenTree(tree, parentId = null) {
    const map = new Map();
    
    const flatten = (nodes, parentId) => {
      for (const node of nodes) {
        // 添加父节点信息
        const nodeWithParent = {
          ...node,
          parentId: parentId
        };
        
        map.set(node.id, nodeWithParent);
        
        if (node.children && node.children.length > 0) {
          flatten(node.children, node.id);
        }
      }
    };
    
    flatten(tree, parentId);
    return map;
  }
  
  /**
   * 构建树结构（从扁平数据）
   * @param {Array} flatData - 扁平数据数组
   * @param {string} rootParentId - 根节点的父ID
   * @returns {Array} 树结构数据
   */
  static buildTreeFromFlat(flatData, rootParentId = null) {
    const tree = [];
    const map = new Map();
    
    // 创建ID到节点的映射
    flatData.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });
    
    // 构建树结构
    flatData.forEach(item => {
      const node = map.get(item.id);
      
      if (item.parentId === rootParentId) {
        // 根节点
        tree.push(node);
      } else if (map.has(item.parentId)) {
        // 子节点
        const parent = map.get(item.parentId);
        parent.children.push(node);
      }
    });
    
    return tree;
  }
  
  /**
   * 计算树的深度
   * @param {Array} tree - 树数据
   * @returns {number} 最大深度
   */
  static getTreeDepth(tree) {
    let maxDepth = 0;
    
    const calculateDepth = (nodes, currentDepth = 0) => {
      for (const node of nodes) {
        maxDepth = Math.max(maxDepth, currentDepth);
        
        if (node.children && node.children.length > 0) {
          calculateDepth(node.children, currentDepth + 1);
        }
      }
    };
    
    calculateDepth(tree);
    return maxDepth;
  }
  
  /**
   * 计算节点数量
   * @param {Array} tree - 树数据
   * @returns {number} 节点总数
   */
  static getNodeCount(tree) {
    let count = 0;
    
    const countNodes = (nodes) => {
      for (const node of nodes) {
        count++;
        
        if (node.children && node.children.length > 0) {
          countNodes(node.children);
        }
      }
    };
    
    countNodes(tree);
    return count;
  }
  
  /**
   * 排序树节点
   * @param {Array} tree - 树数据
   * @param {Function|string} compareFn - 比较函数或字段名
   * @param {boolean} recursive - 是否递归排序子节点
   * @returns {Array} 排序后的树
   */
  static sortTree(tree, compareFn = 'title', recursive = true) {
    // 创建比较函数
    let compare;
    if (typeof compareFn === 'string') {
      compare = (a, b) => {
        const aValue = a[compareFn] || '';
        const bValue = b[compareFn] || '';
        return aValue.localeCompare(bValue, 'zh-CN', { numeric: true });
      };
    } else {
      compare = compareFn;
    }
    
    // 排序当前层级
    const sorted = [...tree].sort(compare);
    
    // 递归排序子节点
    if (recursive) {
      sorted.forEach(node => {
        if (node.children && node.children.length > 0) {
          node.children = this.sortTree(node.children, compareFn, recursive);
        }
      });
    }
    
    return sorted;
  }
  
  /**
   * 过滤树节点
   * @param {Array} tree - 树数据
   * @param {Function} filterFn - 过滤函数
   * @param {boolean} includeParents - 是否包含有匹配子节点的父节点
   * @returns {Array} 过滤后的树
   */
  static filterTree(tree, filterFn, includeParents = true) {
    const filtered = [];
    
    for (const node of tree) {
      const nodeMatches = filterFn(node);
      let hasMatchingChildren = false;
      let filteredChildren = [];
      
      // 递归过滤子节点
      if (node.children && node.children.length > 0) {
        filteredChildren = this.filterTree(node.children, filterFn, includeParents);
        hasMatchingChildren = filteredChildren.length > 0;
      }
      
      // 决定是否包含此节点
      if (nodeMatches || (includeParents && hasMatchingChildren)) {
        const filteredNode = {
          ...node,
          children: filteredChildren
        };
        filtered.push(filteredNode);
      }
    }
    
    return filtered;
  }
  
  /**
   * 搜索树节点
   * @param {Array} tree - 树数据
   * @param {string} query - 搜索关键词
   * @param {Array} searchFields - 搜索字段
   * @returns {Array} 匹配的节点数组
   */
  static searchTree(tree, query, searchFields = ['title']) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    const search = (nodes, path = []) => {
      for (const node of nodes) {
        const currentPath = [...path, node];
        let matches = false;
        
        // 检查搜索字段
        for (const field of searchFields) {
          const value = node[field];
          if (value && value.toString().toLowerCase().includes(lowerQuery)) {
            matches = true;
            break;
          }
        }
        
        if (matches) {
          results.push({
            node: { ...node },
            path: currentPath,
            depth: currentPath.length - 1
          });
        }
        
        // 递归搜索子节点
        if (node.children && node.children.length > 0) {
          search(node.children, currentPath);
        }
      }
    };
    
    search(tree);
    return results;
  }
  
  /**
   * 克隆树结构
   * @param {Array} tree - 树数据
   * @param {boolean} deep - 是否深度克隆
   * @returns {Array} 克隆的树
   */
  static cloneTree(tree, deep = true) {
    if (!deep) {
      return [...tree];
    }
    
    const clone = (nodes) => {
      return nodes.map(node => {
        const cloned = { ...node };
        
        if (node.children && node.children.length > 0) {
          cloned.children = clone(node.children);
        }
        
        return cloned;
      });
    };
    
    return clone(tree);
  }
  
  /**
   * 验证树结构
   * @param {Array} tree - 树数据
   * @returns {Object} 验证结果
   */
  static validateTree(tree) {
    const errors = [];
    const nodeIds = new Set();
    
    const validate = (nodes, path = []) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const currentPath = [...path, i];
        
        // 检查必要字段
        if (!node.id) {
          errors.push(`节点缺少ID字段: 路径 ${currentPath.join('.')}`);
        } else if (nodeIds.has(node.id)) {
          errors.push(`重复的节点ID: ${node.id} 路径 ${currentPath.join('.')}`);
        } else {
          nodeIds.add(node.id);
        }
        
        if (!node.title) {
          errors.push(`节点缺少标题: ID ${node.id} 路径 ${currentPath.join('.')}`);
        }
        
        // 验证子节点
        if (node.children) {
          if (!Array.isArray(node.children)) {
            errors.push(`子节点必须是数组: ID ${node.id} 路径 ${currentPath.join('.')}`);
          } else if (node.children.length > 0) {
            validate(node.children, currentPath);
          }
        }
      }
    };
    
    validate(tree);
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      nodeCount: nodeIds.size
    };
  }
  
  /**
   * 生成树的文本表示
   * @param {Array} tree - 树数据
   * @param {string} indent - 缩进字符
   * @returns {string} 文本表示
   */
  static treeToString(tree, indent = '  ') {
    const lines = [];
    
    const generateLines = (nodes, currentIndent = '') => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isLast = i === nodes.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        
        lines.push(`${currentIndent}${prefix}${node.title} (${node.id})`);
        
        if (node.children && node.children.length > 0) {
          const childIndent = currentIndent + (isLast ? '    ' : '│   ');
          generateLines(node.children, childIndent);
        }
      }
    };
    
    generateLines(tree);
    return lines.join('\n');
  }
} 