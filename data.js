// 网站配置数据
// 自动生成于 2025/6/26 12:00:55
const siteConfig = {
  'title': 'LinkBoard',
  'subtitle': 'LinkBoard - 链接管理面板',
  'description': '现代化的收集与管理链接的静态网页框架',
  'pageTitle': 'LinkBoard - 链接管理面板',
  'logo': {
    'text': 'LinkBoard',
    'icon': '🔗',
    'showIcon': false,
    'showText': true
  },
  'dashboard': {
    'title': '总览',
    'subtitle': '数据统计和网站概览',
    'welcomeMessage': '欢迎使用LinkBoard！在这里管理您的链接收藏。'
  },
  'meta': {
    'keywords': 'linkboard, 链接管理, 书签, 导航, 收藏夹',
    'author': '',
    'language': 'zh-CN'
  },
  'features': {
    'showStats': true,
    'showSearch': true,
    'showTags': true,
    'showCategoryCounts': true
  },
  'theme': {
    'primaryColor': '#3498db',
    'accentColor': '#2ecc71',
    'darkMode': false
  },
  'footer': {
    'copyright': '© 2024 LinkBoard. All rights reserved.',
    'showCopyright': false,
    'links': []
  }
};

// 分类数据
const categories = [
  {
    'id': 'all',
    'name': '全部',
    'icon': '🗂️',
    'color': '#95a5a6',
    'description': '所有链接的汇总展示'
  },
  {
    'id': 'dev-tools',
    'name': '开发工具',
    'icon': '🛠️',
    'color': '#3498db',
    'description': '编程开发相关工具'
  },
  {
    'id': 'design-resources',
    'name': '设计资源',
    'icon': '🎨',
    'color': '#e74c3c',
    'description': 'UI/UX设计相关资源'
  },
  {
    'id': 'learning',
    'name': '学习资源',
    'icon': '📚',
    'color': '#2ecc71',
    'description': '技术学习和教程'
  },
  {
    'id': 'utilities',
    'name': '实用工具',
    'icon': '🔧',
    'color': '#f39c12',
    'description': '日常使用的在线工具'
  },
  {
    'id': 'references',
    'name': '参考资料',
    'icon': '📖',
    'color': '#9b59b6',
    'description': '技术文档和参考手册'
  },
  {
    'id': 'websites',
    'name': '常用网站',
    'icon': '🌐',
    'color': '#1abc9c',
    'description': '常用的网站和平台'
  }
];

// 链接数据
const links = {
  'dashboard': [],
  'all': [],
  'dev-tools': [
    {
      'title': 'GitHub',
      'url': 'https://github.com',
      'description': '代码托管和协作平台',
      'icon': 'https://github.com/favicon.ico',
      'tags': ['版本控制', '开源', '协作']
    },
    {
      'title': 'VS Code Web',
      'url': 'https://vscode.dev',
      'description': '在线版VS Code编辑器',
      'icon': 'https://vscode.dev/favicon.ico',
      'tags': ['编辑器', '在线工具']
    },
    {
      'title': 'CodePen',
      'url': 'https://codepen.io',
      'description': '前端代码在线编辑器',
      'icon': 'https://codepen.io/favicon.ico',
      'tags': ['前端', '在线工具', '协作']
    },
    {
      'title': 'Stack Overflow',
      'url': 'https://stackoverflow.com',
      'description': '程序员问答社区',
      'icon': 'https://stackoverflow.com/favicon.ico',
      'tags': ['社区', '参考', '学习']
    },
    {
      'title': 'GitLab',
      'url': 'https://gitlab.com',
      'description': 'DevOps平台和代码仓库',
      'icon': 'https://gitlab.com/assets/favicon.ico',
      'tags': ['版本控制', '部署', '协作']
    },
    {
      'title': 'JSFiddle',
      'url': 'https://jsfiddle.net',
      'description': '在线JavaScript代码测试',
      'icon': 'https://jsfiddle.net/favicon.ico',
      'tags': ['JavaScript', '在线工具', '测试']
    }
  ],
  'design-resources': [
    {
      'title': 'Figma',
      'url': 'https://figma.com',
      'description': '在线UI/UX设计工具',
      'icon': 'https://figma.com/favicon.ico',
      'tags': ['设计工具', 'UI/UX', '协作']
    },
    {
      'title': 'Unsplash',
      'url': 'https://unsplash.com',
      'description': '免费高质量图片素材',
      'icon': 'https://unsplash.com/favicon.ico',
      'tags': ['图片素材', '免费', '图形设计']
    },
    {
      'title': 'Dribbble',
      'url': 'https://dribbble.com',
      'description': '设计师作品展示平台',
      'icon': 'https://dribbble.com/favicon.ico',
      'tags': ['设计', '社区', '图形设计']
    },
    {
      'title': 'Behance',
      'url': 'https://behance.net',
      'description': 'Adobe创意作品平台',
      'icon': 'https://behance.net/favicon.ico',
      'tags': ['设计', 'Adobe', '图形设计']
    },
    {
      'title': 'Iconfont',
      'url': 'https://iconfont.cn',
      'description': '阿里巴巴图标库',
      'icon': 'https://iconfont.cn/favicon.ico',
      'tags': ['图标', 'Alibaba', '免费']
    }
  ],
  'learning': [
    {
      'title': 'MDN Web Docs',
      'url': 'https://developer.mozilla.org',
      'description': 'Web开发权威文档',
      'icon': 'https://developer.mozilla.org/favicon.ico',
      'tags': ['文档', '前端', 'JavaScript']
    },
    {
      'title': '菜鸟教程',
      'url': 'https://runoob.com',
      'description': '编程入门教程网站',
      'icon': 'https://runoob.com/favicon.ico',
      'tags': ['教程', '学习', '免费']
    },
    {
      'title': 'W3Schools',
      'url': 'https://w3schools.com',
      'description': 'Web技术教程和参考',
      'icon': 'https://w3schools.com/favicon.ico',
      'tags': ['教程', '前端', '参考']
    },
    {
      'title': 'FreeCodeCamp',
      'url': 'https://freecodecamp.org',
      'description': '免费编程学习平台',
      'icon': 'https://freecodecamp.org/favicon.ico',
      'tags': ['免费', '课程', '学习']
    },
    {
      'title': 'Codecademy',
      'url': 'https://codecademy.com',
      'description': '交互式编程学习',
      'icon': 'https://codecademy.com/favicon.ico',
      'tags': ['课程', '学习', '付费']
    }
  ],
  'utilities': [
    {
      'title': 'JSON格式化',
      'url': 'https://jsonformatter.org',
      'description': 'JSON数据格式化工具',
      'icon': 'https://jsonformatter.org/favicon.ico',
      'tags': ['在线工具', '开发', '效率']
    },
    {
      'title': 'TinyPNG',
      'url': 'https://tinypng.com',
      'description': '在线图片压缩工具',
      'icon': 'https://tinypng.com/favicon.ico',
      'tags': ['图片素材', '性能', '在线工具']
    },
    {
      'title': 'Color Hunt',
      'url': 'https://colorhunt.co',
      'description': '配色方案灵感网站',
      'icon': 'https://colorhunt.co/favicon.ico',
      'tags': ['配色', '设计', '图形设计']
    },
    {
      'title': 'Regexr',
      'url': 'https://regexr.com',
      'description': '正则表达式测试工具',
      'icon': 'https://regexr.com/favicon.ico',
      'tags': ['测试', '开发', '在线工具']
    },
    {
      'title': 'Base64编码',
      'url': 'https://base64encode.org',
      'description': 'Base64编码解码工具',
      'icon': 'https://base64encode.org/favicon.ico',
      'tags': ['在线工具', '开发', '安全']
    }
  ],
  'references': [
    {
      'title': 'Can I Use',
      'url': 'https://caniuse.com',
      'description': '浏览器兼容性查询',
      'icon': 'https://caniuse.com/favicon.ico',
      'tags': ['参考', '前端', '文档']
    },
    {
      'title': 'DevDocs',
      'url': 'https://devdocs.io',
      'description': '开发文档聚合网站',
      'icon': 'https://devdocs.io/favicon.ico',
      'tags': ['文档', '参考', '开发']
    },
    {
      'title': 'CSS参考手册',
      'url': 'https://css-tricks.com',
      'description': 'CSS技巧和参考',
      'icon': 'https://css-tricks.com/favicon.ico',
      'tags': ['前端', '参考', '教程']
    },
    {
      'title': 'JavaScript参考',
      'url': 'https://javascript.info',
      'description': '现代JavaScript教程',
      'icon': 'https://javascript.info/favicon.ico',
      'tags': ['JavaScript', '教程', '文档']
    },
    {
      'title': 'HTTP状态码',
      'url': 'https://httpstatuses.com',
      'description': 'HTTP状态码参考',
      'icon': 'https://httpstatuses.com/favicon.ico',
      'tags': ['参考', '开发', 'API']
    }
  ],
  'websites': [
    {
      'title': '百度',
      'url': 'https://baidu.com',
      'description': '中文搜索引擎',
      'icon': 'https://baidu.com/favicon.ico',
      'tags': ['效率', '免费', '在线工具']
    },
    {
      'title': 'Google',
      'url': 'https://google.com',
      'description': '全球最大搜索引擎',
      'icon': 'https://google.com/favicon.ico',
      'tags': ['Google', '效率', '免费']
    },
    {
      'title': 'YouTube',
      'url': 'https://youtube.com',
      'description': '视频分享平台',
      'icon': 'https://youtube.com/favicon.ico',
      'tags': ['娱乐', '学习', '免费']
    },
    {
      'title': 'Bilibili',
      'url': 'https://bilibili.com',
      'description': '中文视频弹幕网站',
      'icon': 'https://bilibili.com/favicon.ico',
      'tags': ['娱乐', '学习', '社区']
    },
    {
      'title': 'Twitter',
      'url': 'https://twitter.com',
      'description': '社交媒体平台',
      'icon': 'https://twitter.com/favicon.ico',
      'tags': ['社区', '免费', '娱乐']
    },
    {
      'title': '知乎',
      'url': 'https://zhihu.com',
      'description': '中文问答社区',
      'icon': 'https://zhihu.com/favicon.ico',
      'tags': ['社区', '学习', '免费']
    }
  ]
};