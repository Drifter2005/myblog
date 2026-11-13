# Meadow · Drifter Blog

为 Drifter2005 的 Hexo 博客定制的浅色简约主题。保留原有文章、音乐、RSS、分类、标签与 GitHub Actions 发布方式。

## 页面和操作

- 首页 `/`：草地蓝天引导页，完整引文、进入博客按钮、背景动画开关。文章列表在 `/#journal`。
- `/algorithm/`、`/ctf/`、`/about/`：算法笔记、CTF 记录、阅读随记。
- `/archives/`：按时间浏览文章；右侧工具条或顶部搜索按钮可以搜索标题、标签和正文。
- 桌面工具条默认为右侧展开；手机默认为小圆按钮，点击展开。
- 长按工具条约 0.42 秒，然后拖动。松手自动贴边，并在本浏览器记住位置。
- 聚焦工具条的拖动手柄后，方向键调整位置，Shift + 上下方向键加快移动，Home 恢复默认位置。
- 音乐按钮打开播放器；点击播放才会加载歌曲。支持上一首、下一首、进度、音量，并保存歌曲与进度。换页后需点击播放继续。
- Esc 关闭搜索或音乐面板；搜索对话框支持键盘操作。

## 背景素材

`source/media/` 下的三个文件由用户提供的视频与预览图片制作：

- `meadow.mp4`：1600 × 900、24fps、H.264、无音轨、约 3.1 MB。保留约 20 秒完整场景，启用 MP4 faststart。
- `meadow-poster.webp`：1920 × 1080 的桌面静态封面，视频加载失败时仍显示。
- `meadow-mobile.webp`：960 × 960 的手机静态封面。

路径可在本主题 `_config.yml` 的 `landing` 和 `background` 中修改。手机和省流量模式先使用静态图；手机可以手动播放。系统启用“减少动态效果”时不加载视频。离开引导页或切到其他标签页时暂停视频。

首页引文位于 `layout/_partial/landing.ejs`。背景位于文字下层，并叠加浅色渐变。文章阅读面板保持高不透明度，图片在正常文档流内按容器宽度缩放，宽代码块和表格单独横向滚动。

## 本地使用

在 Hexo 源码目录执行：

```powershell
npm ci
npm run build
npm run server
```

访问终端显示的本地地址。站点 `_config.yml` 应为 `theme: meadow`。

## 日常更新与发布

继续用原来的 Hexo / Qexo 方式写文章。推送源码仓库 `Drifter2005/myblog` 的 `main` 分支后，现有 GitHub Actions 会生成静态文件并发布到 `Drifter2005/Drifter2005.github.io`。

不要把 `public/` 当作 Hexo 源码提交，也不要手动覆盖发布仓库来替代源码更新。原来的 `cosmic` 主题保留为可恢复的旧版本。

两篇阅读笔记在 front matter 中固定了原来的 `permalink`，保证旧站的文章地址不因日期解析差异改变；原来的 `observatory-manifesto/` 地址也继续有效。

评论服务沿用可选 Waline 配置。原站未配置服务器地址，默认不加载评论客户端；如需启用，在 `_config.yml` 的 `waline.serverURL` 填入自己的地址。

本主题无字体 CDN、jQuery、APlayer 或第三方图标依赖。点赞数与工具条位置仅保存在当前浏览器，点赞数不会在访客之间共享。
