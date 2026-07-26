# Waline 接入说明（评论 / 点赞 / 阅读量）

主题侧代码已经写好，**只差一个服务端地址**。填进配置就全部生效；不填则整套功能不加载，站点照常工作。

## 为什么不用 Valine

Valine 把 LeanCloud 的 `appId` / `appKey` 直接写在前端 JS 里，任何访客打开控制台就能拿到，进而可以越过页面直接读写甚至删除整个评论库。对一门做安全方向的博客来说这个取舍不合适。Waline 把密钥放在服务端，前端只暴露一个 `serverURL`。

## 部署服务端

需要你自己注册账号并操作（涉及创建账号，我不代做）。按官方当前推荐的 Vercel + Neon Postgres 路线：

1. 打开一键部署模板，用 GitHub 账号登录 Vercel：

   <https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwalinejs%2Fwaline%2Ftree%2Fmain%2Fexample>

2. 填一个项目名 → **Create**。Vercel 会自动建仓库并完成首次部署。

3. 部署完成后进入项目 Dashboard，顶部选 **Storage** → **Create Database**
   → 在 *Marketplace Database Providers* 里选 **Neon** → Continue
   → 提示创建 Neon 账号时选 Accept and Create
   → 区域和套餐保持默认 → Continue → 数据库名保持默认 → Continue

4. 回到 Storage 点开这个数据库 → **Open in Neon** → 左侧 **SQL Editor**
   → 把下面这个文件的内容整段粘进去 → **Run** 建表：

   <https://raw.githubusercontent.com/walinejs/waline/main/assets/waline.pgsql>

5. 回 Vercel → **Deployments** → 对最新一次部署点 **Redeploy**（让数据库配置生效）

6. 状态变 **Ready** 后点 **Visit**，地址栏里的 URL 就是你的 `serverURL`
   （形如 `https://你的项目名.vercel.app`）

7. 访问 `<serverURL>/ui` 注册管理员账号。**第一个注册的账号自动成为管理员**，所以部署完请立刻去注册，别放着不管。

## 填入博客配置

编辑 `themes/cosmic/_config.yml`：

```yaml
waline:
  serverURL: https://你的项目名.vercel.app   # 结尾不要带斜杠
```

然后提交推送，GitHub Actions 会自动构建发布：

```bash
git add themes/cosmic/_config.yml && git commit -m "Enable Waline" && git push
```

## 生效后你会得到什么

| 功能 | 位置 | 说明 |
| --- | --- | --- |
| 评论 | 文章页底部「观测信号」区 | 访客无需注册，可填昵称/邮箱 |
| 点赞 | 评论区上方的 reaction | **计数存在服务端，全站共享** |
| 阅读量 | 文章页脚 👁 图标旁 | 真实 PV |
| 评论数 | 首页每张卡片 💬 图标旁 | 真实评论数 |

点赞用的是 Waline 的 reaction 特性。这和之前那个 ❤️ 按钮的区别是：之前的计数存在**访客自己浏览器的 localStorage** 里——你看到 1，别人打开还是 0，清一下浏览器数据就能重复点。那不是点赞，只是个本地开关，所以已经移除。

## 可调项

`themes/cosmic/_config.yml` 的 `waline` 段：

```yaml
reaction: true       # 文章页点赞，false 关闭
commentCount: true   # 首页卡片评论数
pageview: true       # 阅读量统计
pageSize: 10         # 每页评论数
requiredMeta: nick,mail   # 必填字段，可改成 nick 或留空
placeholder: 在这里留下你的观测信号
```

## 与 PJAX 的配合

站点用了 PJAX 局部刷新（为了让音乐跨页不断），被替换的内容区里的 `<script>` 不会重新执行。所以 `waline-init.js` 放在替换区之外只加载一次，靠监听 `pjax:done` 调用 `instance.destroy()` + `init()` 重新挂载。换页后评论区会按新文章的 path 重新拉取。

`path` 做了归一化（去掉结尾的 `index.html`、统一补上斜杠），保证同一篇文章从首页卡片和从文章页进入时算同一个 path——否则计数和评论列表会对不上。

## 排查

- **评论区不显示**：检查 `serverURL` 是否填了、结尾有没有多余斜杠；打开控制台看有没有 `[waline]` 开头的报错
- **计数一直是 `–`**：说明请求没回来，多半是 `serverURL` 不对或服务端没跑起来，直接访问 `<serverURL>` 看是否有响应
- **换页后评论区空白**：控制台看 `pjax:done` 后有没有 Waline 的报错
- **管理后台进不去**：确认访问的是 `<serverURL>/ui`
