# FavoriteBoard 收藏后 FolderSelector 页面内悬浮窗功能规划

## 1. 功能目标

- 当用户通过任意方式（包括浏览器原生收藏星号）收藏网页后，在**当前网页页面内部**自动弹出一个悬浮窗，主内容为`FolderSelector`，用于快速移动新收藏到目标文件夹。
- 悬浮窗通过 content script 注入 DOM 实现，**不是浏览器新窗口**。
- 悬浮窗布局与插件主页面左侧tab container类似，包含标题、文件夹树、设置按钮、关闭按钮等。
- 支持倒计时自动关闭、鼠标悬停暂停倒计时、点击交互等细节体验。

---

## 2. 交互流程

1. **监听收藏事件**  
   background.js 通过`chrome.bookmarks.onCreated`监听所有新书签的添加。
2. **通知当前页面 content script**  
   background.js 通过`chrome.tabs.sendMessage`向当前活动tab发送消息，包含新书签信息。
3. **页面内弹出悬浮窗**  
   content script（如`js/content/folder-selector-float.js`）监听消息，在当前网页右上角插入自定义悬浮窗DOM，内容为：
   - 顶部：标题（点击=打开插件主页面）（与tabContainer的标题样式相同）
   - 中部：`FolderSelector`（显示所有可用文件夹，支持选择）
   - 底部：设置按钮（点击=打开插件设置页）
   - 右上角：关闭按钮（带倒计时环）
4. **倒计时关闭**  
   悬浮窗出现后，倒计时N秒（如5秒），倒计时环逐渐消失。
   鼠标进入悬浮窗区域时，倒计时立即暂停且不再恢复，用户只能手动点击x关闭。
5. **文件夹选择**  
   用户点击某个文件夹，立即将新收藏移动到该文件夹（调用`card-interaction-utils`中的相关逻辑）。
   移动成功后可选：自动关闭悬浮窗/提示成功。
6. **关闭悬浮窗**  
   用户点击x按钮，悬浮窗关闭。
   倒计时结束自动关闭（若未悬停）。
7. **点击标题/设置**  
   标题：打开插件主页面（与点击扩展图标一致）。
   设置：打开插件设置页（与主页面设置按钮一致）。

---

## 3. 技术实现与数据流

### 3.1 manifest.json 配置

- 必须声明 content_scripts 注入 content script 和样式：
  ```json
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["js/content/folder-selector-float.js", "js/ui/folder-selector.js", "js/utils/card-interaction-utils.js"],
      "css": ["css/folder-selector-popup.css"]
    }
  ],
  "permissions": [
    "bookmarks",
    "tabs",
    "activeTab"
  ],
  "web_accessible_resources": [
    {
      "resources": [
        "js/ui/folder-selector.js",
        "js/utils/card-interaction-utils.js"
      ],
      "matches": ["<all_urls>"]
    }
  ]
  ```

### 3.2 background.js 监听与消息发送

- 监听新书签创建，向当前活动tab发送消息：
  ```js
  chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'show-folder-selector-float',
          bookmarkId: id,
          bookmark: bookmark
        });
      }
    });
  });
  ```

### 3.3 content script 页面内悬浮窗逻辑

- content script 监听消息，插入悬浮窗DOM，渲染 FolderSelector，处理倒计时、关闭、移动书签等。
- 依赖的 FolderSelector 组件和 card-interaction-utils 工具可通过 content_scripts 或 web_accessible_resources 注入。
- 悬浮窗样式通过 css/folder-selector-popup.css 复用主页面风格。

### 3.4 依赖注入与复用

- FolderSelector 组件和书签移动工具函数可直接在 content script 里调用。
- 悬浮窗UI、倒计时、交互逻辑可参考原popup实现，适配为页面内DOM。

---

## 4. UI结构设计

```
┌─────────────────────────────┐
│  [标题]                [x○] │  ← 顶部，x为关闭按钮，带倒计时环
├─────────────────────────────┤
│                             │
│      FolderSelector树        │  ← 中部，文件夹树选择器
│                             │
├─────────────────────────────┤
│         [设置按钮]           │  ← 底部
└─────────────────────────────┘
```
- 悬浮窗定位：页面右上角，position: fixed，z-index足够大。
- 尺寸：适配内容，建议宽度与主页面侧边栏一致。
- 层级：高于网页内容，z-index足够大。

---

## 5. 关键技术点与注意事项

- **页面内悬浮窗**：通过 content script 注入DOM实现，不能用chrome.windows.create。
- **数据同步**：content script 通过chrome.bookmarks.getTree等API获取文件夹树和书签信息。
- **UI一致性**：悬浮窗样式、交互与主页面侧边栏保持一致，复用FolderSelector组件。
- **倒计时环**：可用SVG实现环形进度，定时器控制进度。
- **多窗口/多书签**：如短时间内多次收藏，需考虑悬浮窗叠加/合并/排队策略（可后续扩展）。
- **权限声明**：manifest.json需声明bookmarks、tabs、activeTab权限。
- **依赖注入**：如需动态加载依赖js，可用web_accessible_resources声明。

---

## 6. 伪代码流程

```js
// background.js
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'show-folder-selector-float',
        bookmarkId: id,
        bookmark: bookmark
      });
    }
  });
});

// js/content/folder-selector-float.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'show-folder-selector-float') {
    // 1. 获取bookmarkId，获取书签信息
    // 2. 插入悬浮窗DOM，渲染标题、FolderSelector、设置按钮、x按钮
    // 3. 启动倒计时，渲染环形进度
    // 4. 鼠标进入时暂停倒计时
    // 5. 点击文件夹时，调用moveBookmarkToFolder
    // 6. 点击标题/设置/x按钮时执行对应逻辑
  }
});
```

---

## 7. 后续可扩展点

- 支持批量操作（多书签同时处理）
- 支持自定义倒计时时长
- 支持快捷键操作
- 支持收藏后自动归类/智能推荐文件夹
- 支持多标签页同步弹窗

---

## 8. 总结

本方案能让用户在收藏后第一时间用FavoriteBoard的文件夹树快速整理新书签，极大提升效率和体验，UI风格也能和主页面保持一致，功能扩展性强，用户体验优秀。

如需详细UI原型、具体代码结构或关键模块实现，请参考本文档并结合项目实际需求进行开发。 

---

## 9. 开发执行步骤（模块化分步）

1. **Manifest与权限声明**
   - 目标：确保content script、样式、权限声明齐全。
   - 涉及文件：manifest.json
   - 主要任务：声明content_scripts、web_accessible_resources、bookmarks/tabs/activeTab权限。

2. **background监听与消息发送**
   - 目标：监听书签创建，向当前tab发送弹窗指令。
   - 涉及文件：background.js
   - 主要任务：实现onCreated监听与sendMessage逻辑。

3. **悬浮窗主控制器开发**
   - 目标：content script监听消息，控制悬浮窗的创建、销毁、交互。
   - 涉及文件：js/content/folder-selector-float.js
   - 主要任务：监听消息、插入/移除DOM、挂载UI、事件绑定。

4. **倒计时环SVG模块开发**
   - 目标：实现可暂停/恢复/销毁的SVG倒计时环。
   - 涉及文件：js/content/folder-selector-float-timer.js
   - 主要任务：SVG渲染、定时器、暂停/恢复API。

5. **复用/适配FolderSelector组件**
   - 目标：在悬浮窗中复用主页面的文件夹树UI。
   - 涉及文件：js/ui/folder-selector.js
   - 主要任务：适配onSelect回调，支持content script环境。

6. **书签移动工具适配**
   - 目标：在content script中调用moveBookmarkToFolder。
   - 涉及文件：js/utils/card-interaction-utils.js
   - 主要任务：暴露API，适配content script调用。

7. **悬浮窗样式开发**
   - 目标：实现与主页面一致的悬浮窗样式。
   - 涉及文件：css/folder-selector-popup.css
   - 主要任务：定位、尺寸、z-index、动画、倒计时环样式。

8. **集成与联调**
   - 目标：各模块集成，联调完整流程。
   - 涉及文件：上述所有
   - 主要任务：功能测试、bug修复、体验优化。

9. **可选扩展与优化**
   - 目标：支持批量、快捷键、自定义倒计时等扩展。
   - 涉及文件：按需新增
   - 主要任务：功能扩展、性能优化、用户体验提升。 