# FavoriteBoard 收藏后 FolderSelector 悬浮窗功能规划

## 1. 功能目标

- 当用户通过任意方式（包括浏览器原生收藏星号）收藏网页后，在浏览器右上角自动弹出一个悬浮窗，主内容为`FolderSelector`，用于快速移动新收藏到目标文件夹。
- 悬浮窗布局与插件主页面左侧tab container类似，包含标题、文件夹树、设置按钮、关闭按钮等。
- 支持倒计时自动关闭、鼠标悬停暂停倒计时、点击交互等细节体验。

---

## 2. 交互流程

1. **监听收藏事件**  
   通过`chrome.bookmarks.onCreated`监听所有新书签的添加。
2. **弹出悬浮窗**  
   在浏览器右上角显示自定义悬浮窗，内容为：
   - 顶部：标题（点击=打开插件主页面）（与tabContainer的标题样式相同）
   - 中部：`FolderSelector`（显示所有可用文件夹，支持选择）
   - 底部：设置按钮（点击=打开插件设置页）
   - 右上角：关闭按钮（带倒计时环）
3. **倒计时关闭**  
   悬浮窗出现后，倒计时N秒（如5秒），倒计时环逐渐消失。
   鼠标进入悬浮窗区域时，倒计时立即暂停且不再恢复，用户只能手动点击x关闭。
4. **文件夹选择**  
   用户点击某个文件夹，立即将新收藏移动到该文件夹（调用`card-interaction-utils`中的相关逻辑）。
   移动成功后可选：自动关闭悬浮窗/提示成功。
5. **关闭悬浮窗**  
   用户点击x按钮，悬浮窗关闭。
   倒计时结束自动关闭（若未悬停）。
6. **点击标题/设置**  
   标题：打开插件主页面（与点击扩展图标一致）。
   设置：打开插件设置页（与主页面设置按钮一致）。

---

## 3. UI结构设计

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
- 悬浮窗定位：浏览器右上角，靠近扩展图标。
- 尺寸：适配内容，建议宽度与主页面侧边栏一致。
- 层级：高于网页内容，z-index足够大。

---

## 4. 数据流与关键逻辑

### 4.1 监听新书签
- 在`background.js`或service worker中：
  ```js
  chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    // 1. 获取新书签信息（id, title, url, parentId等）
    // 2. 发送消息给前台页面/悬浮窗，触发弹窗显示
  });
  ```

### 4.2 弹出悬浮窗
- 通过`chrome.windows.create`或`chrome.offscreen`/自定义DOM注入（推荐用MV3的`offscreen`或`chrome.windows.create` type=popup）。
- 悬浮窗页面接收新书签信息，渲染UI。

### 4.3 渲染FolderSelector
- 获取当前所有可用文件夹树（可通过background与主页面通信获取最新数据）。
- 渲染`FolderSelector`组件，支持选择目标文件夹。

### 4.4 文件夹选择与移动
- 用户点击文件夹时，调用`card-interaction-utils`中的“移动书签”逻辑：
  ```js
  moveBookmarkToFolder(bookmarkId, targetFolderId)
  ```
- 移动成功后可提示“已移动”并关闭悬浮窗。

### 4.5 悬浮窗倒计时与关闭
- 悬浮窗出现时启动倒计时（如5秒），x按钮环形进度同步减少。
- 鼠标进入悬浮窗区域时，倒计时立即暂停且不再恢复，x按钮环保持当前状态。
- 只能手动点击x关闭（鼠标离开后不再自动关闭）。
- 点击x立即关闭悬浮窗。

### 4.6 标题与设置按钮
- 标题：点击后调用`chrome.runtime.openOptionsPage()`或模拟点击扩展图标，打开主页面。
- 设置按钮：点击后跳转到插件设置页。

---

## 5. 关键技术点与注意事项

- **悬浮窗实现**：推荐用`chrome.windows.create({type: 'popup'})`或MV3的offscreen+DOM注入，保证不会被网页内容遮挡。
- **数据同步**：悬浮窗与主页面/后台需通过`chrome.runtime.sendMessage`或`chrome.storage`同步文件夹树和书签信息。
- **UI一致性**：悬浮窗样式、交互与主页面侧边栏保持一致，复用`FolderSelector`组件。
- **倒计时环**：可用SVG或Canvas实现环形进度，定时器控制进度。
- **多窗口/多书签**：如短时间内多次收藏，需考虑悬浮窗叠加/合并/排队策略。

---

## 6. 伪代码流程

```js
// background.js
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  chrome.windows.create({
    url: 'folderSelectorPopup.html?bookmarkId=' + id,
    type: 'popup',
    width: 340,
    height: 500,
    top: 60,
    left: screen.width - 360
  });
});

// folderSelectorPopup.js
onLoad: {
  // 1. 解析bookmarkId，获取书签信息
  // 2. 渲染标题、FolderSelector、设置按钮、x按钮
  // 3. 启动倒计时，渲染环形进度
  // 4. 鼠标进入时暂停倒计时
  // 5. 点击文件夹时，调用moveBookmarkToFolder
  // 6. 点击标题/设置/x按钮时执行对应逻辑
}
```

---

## 7. 后续可扩展点

- 支持批量操作（多书签同时处理）
- 支持自定义倒计时时长
- 支持快捷键操作
- 支持收藏后自动归类/智能推荐文件夹

---

## 8. 总结

本方案能让用户在收藏后第一时间用FavoriteBoard的文件夹树快速整理新书签，极大提升效率和体验，UI风格也能和主页面保持一致，功能扩展性强，用户体验优秀。

如需详细UI原型、具体代码结构或关键模块实现，请参考本文档并结合项目实际需求进行开发。 