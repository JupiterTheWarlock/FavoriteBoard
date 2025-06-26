/**
 * Tag管理器
 * 提供Tag的验证、管理和辅助功能
 * 完全基于数据中的标签，无需预定义
 */

class TagManager {
  constructor() {
    // 不再依赖预定义的TAG_TYPES，完全基于数据动态构建
    this.validTags = new Set();
    this.initFromData();
  }

  /**
   * 从现有数据中初始化标签
   */
  initFromData() {
    // 从全局links数据中提取所有已使用的标签
    if (typeof links !== 'undefined') {
      Object.keys(links).forEach(categoryId => {
        if (categoryId !== 'dashboard' && categoryId !== 'all') {
          const categoryLinks = links[categoryId] || [];
          categoryLinks.forEach(link => {
            if (link.tags && Array.isArray(link.tags)) {
              link.tags.forEach(tag => {
                if (tag && typeof tag === 'string') {
                  this.validTags.add(tag.trim());
                }
              });
            }
          });
        }
      });
    }
  }

  /**
   * 验证Tag是否有效（任何非空字符串都是有效的）
   * @param {string} tag - 要验证的Tag
   * @returns {boolean} - 是否为有效Tag
   */
  isValidTag(tag) {
    return typeof tag === 'string' && tag.trim() !== '';
  }

  /**
   * 验证链接的所有Tag
   * @param {Object} link - 链接对象
   * @returns {Object} - 验证结果 { valid: boolean, invalidTags: string[] }
   */
  validateLinkTags(link) {
    if (!link.tags || !Array.isArray(link.tags)) {
      return { valid: true, invalidTags: [] };
    }

    const invalidTags = link.tags.filter(tag => !this.isValidTag(tag));
    return {
      valid: invalidTags.length === 0,
      invalidTags: invalidTags
    };
  }

  /**
   * 获取所有已使用的Tag
   * @returns {string[]} - 所有已使用Tag的数组
   */
  getAllValidTags() {
    return Array.from(this.validTags).sort();
  }

  /**
   * 添加新Tag到已知标签集合
   * @param {string} tag - 新Tag
   * @returns {boolean} - 是否添加成功
   */
  addTag(tag) {
    if (!this.isValidTag(tag)) {
      return false;
    }
    
    const trimmedTag = tag.trim();
    if (!this.validTags.has(trimmedTag)) {
      this.validTags.add(trimmedTag);
      return true;
    }
    return false;
  }

  /**
   * 获取指定分类的所有Tag
   * @param {string} categoryId - 分类ID
   * @param {Object} linksData - 链接数据对象，默认使用全局links
   * @returns {string[]} - 该分类的所有Tag数组
   */
  getTagsByCategory(categoryId, linksData = null) {
    // 使用传入的数据或全局links数据
    const data = linksData || (typeof links !== 'undefined' ? links : {});
    
    if (!categoryId || !data[categoryId]) {
      return [];
    }
    
    const tagsSet = new Set();
    const categoryLinks = data[categoryId] || [];
    
    categoryLinks.forEach(link => {
      if (link.tags && Array.isArray(link.tags)) {
        link.tags.forEach(tag => {
          if (this.isValidTag(tag)) {
            tagsSet.add(tag.trim());
          }
        });
      }
    });
    
    return Array.from(tagsSet).sort();
  }

  /**
   * 获取所有分类的Tag统计
   * @param {Object} linksData - 链接数据对象，默认使用全局links
   * @returns {Object} - 各分类的Tag统计
   */
  getAllCategoriesTags(linksData = null) {
    const data = linksData || (typeof links !== 'undefined' ? links : {});
    const result = {};
    
    Object.keys(data).forEach(categoryId => {
      if (categoryId !== 'dashboard' && categoryId !== 'all') { // 跳过dashboard和all
        result[categoryId] = this.getTagsByCategory(categoryId, data);
      }
    });
    
    return result;
  }

  /**
   * 搜索相关Tag
   * @param {string} query - 搜索关键词
   * @returns {string[]} - 匹配的Tag数组
   */
  searchTags(query) {
    if (!query || typeof query !== 'string') return [];
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.validTags).filter(tag => 
      tag.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取Tag的建议（基于已有Tag和所有分类数据）
   * @param {string[]} existingTags - 已有的Tag
   * @param {Object} linksData - 链接数据对象，默认使用全局links
   * @returns {string[]} - 建议的Tag
   */
  getSuggestedTags(existingTags = [], linksData = null) {
    const data = linksData || (typeof links !== 'undefined' ? links : {});
    const existing = new Set(existingTags);
    const suggestions = [];
    
    // 获取所有分类的Tag
    const allCategoriesTags = this.getAllCategoriesTags(data);
    
    // 基于已有Tag找到相关的分类，然后推荐该分类的其他Tag
    existingTags.forEach(tag => {
      Object.keys(allCategoriesTags).forEach(categoryId => {
        const categoryTags = allCategoriesTags[categoryId];
        if (categoryTags.includes(tag)) {
          // 推荐同分类的其他Tag
          categoryTags.forEach(relatedTag => {
            if (!existing.has(relatedTag) && !suggestions.includes(relatedTag)) {
              suggestions.push(relatedTag);
            }
          });
        }
      });
    });
    
    return suggestions.slice(0, 5); // 返回前5个建议
  }

  /**
   * 验证所有链接数据的Tag
   * @param {Object} linksData - links数据对象
   * @returns {Object} - 验证报告
   */
  validateAllLinks(linksData) {
    const report = {
      totalLinks: 0,
      validLinks: 0,
      invalidLinks: [],
      warnings: []
    };

    Object.keys(linksData).forEach(categoryId => {
      if (categoryId === 'dashboard' || categoryId === 'all') return; // 跳过dashboard和all
      
      const categoryLinks = linksData[categoryId] || [];
      categoryLinks.forEach((link, index) => {
        report.totalLinks++;
        
        const validation = this.validateLinkTags(link);
        if (validation.valid) {
          report.validLinks++;
        } else {
          report.invalidLinks.push({
            category: categoryId,
            linkIndex: index,
            title: link.title,
            invalidTags: validation.invalidTags
          });
        }
      });
    });

    return report;
  }

  /**
   * 生成Tag使用统计
   * @param {Object} linksData - links数据对象
   * @returns {Object} - Tag使用统计
   */
  generateTagStats(linksData) {
    const tagCounts = {};
    const tagLinks = {};

    Object.keys(linksData).forEach(categoryId => {
      if (categoryId === 'dashboard' || categoryId === 'all') return;
      
      const categoryLinks = linksData[categoryId] || [];
      categoryLinks.forEach(link => {
        if (link.tags && Array.isArray(link.tags)) {
          link.tags.forEach(tag => {
            if (this.isValidTag(tag)) {
              const cleanTag = tag.trim();
              tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
              
              if (!tagLinks[cleanTag]) {
                tagLinks[cleanTag] = [];
              }
              tagLinks[cleanTag].push({
                title: link.title,
                category: categoryId,
                url: link.url
              });
            }
          });
        }
      });
    });

    // 按使用频率排序
    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([tag, count]) => ({ tag, count, links: tagLinks[tag] }));

    return {
      totalTags: Object.keys(tagCounts).length,
      tagStats: sortedTags,
      mostUsedTag: sortedTags[0]?.tag,
      leastUsedTags: sortedTags.filter(item => item.count === 1).map(item => item.tag)
    };
  }

  /**
   * 刷新标签数据（当数据发生变化时调用）
   */
  refreshTags() {
    this.validTags.clear();
    this.initFromData();
  }
}

// 创建全局Tag管理器实例
const tagManager = new TagManager();

// 在开发模式下提供调试信息
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🏷️ Tag管理器已初始化');
  console.log('已发现的Tag数量:', tagManager.getAllValidTags().length);
  console.log('所有标签:', tagManager.getAllValidTags());
  
  // 添加到window对象便于调试
  window.tagManager = tagManager;
} 