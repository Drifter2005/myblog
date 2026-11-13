# Hexo / GitHub Pages 发布方式

## 两个仓库各自负责什么

| 仓库 | 内容 | Pages 发布设置 |
| --- | --- | --- |
| `Drifter2005/myblog` | Hexo 源码、Markdown 文章和主题 | Source：**GitHub Actions**，API `build_type: workflow` |
| `Drifter2005/Drifter2005.github.io` | Hexo 生成的 HTML、CSS、JS 和媒体 | Source：**Deploy from a branch**，`main`、`/ (root)` |

正常链路：更新 `myblog/main` → `.github/workflows/deploy.yml` 安装依赖并运行 Hexo → 把 `public/` 发布到 `Drifter2005.github.io/main` → GitHub Pages 更新正式博客。

源码仓库不需要使用 Jekyll 再构建一次。它的 Pages Source 设为 GitHub Actions 后，默认的分支 Jekyll 构建会停止，现有的 `Deploy Hexo site` 工作流继续处理文章更新。

## `The meadow theme could not be found` 的原因

如果源码仓库的 Pages Source 误设为从 `main` 分支直接发布，GitHub 会额外运行 `pages build and deployment`。其中的 `Build with Jekyll` 会读取 Hexo 的 `_config.yml`，把 `theme: meadow` 当作 Jekyll 主题名称，随后报主题不存在。

修复位置是 **`myblog` 仓库的 Settings → Pages → Build and deployment → Source → GitHub Actions**。

`meadow` 是仓库内的 Hexo 主题，保留 `theme: meadow` 即可。无需安装同名 Jekyll gem，也无需向源码根目录添加 `.nojekyll` 来绕过处理。

设置修正后，再推送一次正常提交，应该只看到源码仓库的 `Deploy Hexo site` 发布流程，不会再产生默认 Jekyll 构建。已经发送的失败邮件及历史失败记录不会改成成功；应检查修复后最新提交的运行结果。

## 日常更新

继续使用 Hexo / Qexo 修改文章并提交源码。不要把 `public/` 覆盖到源码仓库，也不要把源码仓库的 Pages 重新切回从分支构建。

正式博客地址：https://drifter2005.github.io/

GitHub Pages 构建方式说明：https://docs.github.com/en/rest/pages/pages#update-information-about-a-github-pages-site
