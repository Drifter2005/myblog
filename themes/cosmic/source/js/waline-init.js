/**
 * Waline 评论 / 点赞(reaction) / 阅读量 接入。
 *
 * 作为 ES module 加载，且必须放在 PJAX 替换区（#content-outer）之外 ——
 * 被替换掉的节点里的 <script> 不会重新执行，所以这里只加载一次，
 * 之后靠监听 pjax:done 重新挂载。
 *
 * 配置由 after-footer.ejs 写入 window.__WALINE_CONFIG__。
 * serverURL 为空时本文件根本不会被引入。
 */
import { init } from 'https://unpkg.com/@waline/client@v3/dist/waline.js';

const config = window.__WALINE_CONFIG__ || {};

if (!config.serverURL) {
  console.warn('[waline] 未配置 serverURL，跳过初始化');
} else {
  /**
   * Waline 用 path 区分文章。必须保证同一篇文章在任何入口下 path 都一致，
   * 否则会加载到不同的评论列表。
   * Hexo 生成目录式链接（/2026/07/25/algorithm/），但直接访问
   * .../index.html 时 pathname 会不同，这里统一归一化。
   */
  function normalizePath(pathname) {
    let p = pathname || '/';
    p = p.replace(/\/index\.html$/, '/');
    if (!p.endsWith('/')) p += '/';
    return p;
  }

  let instance = null;

  function mount() {
    // 重新挂载前先销毁旧实例，避免监听器和 DOM 残留
    if (instance) {
      try {
        instance.destroy();
      } catch (e) {
        /* 实例已随 DOM 失效，忽略 */
      }
      instance = null;
    }

    const el = document.querySelector('#waline');
    const hasCounter =
      document.querySelector('.waline-comment-count') ||
      document.querySelector('.waline-pageview-count');

    // 既没有评论容器也没有计数器，就不必初始化
    if (!el && !hasCounter) return;

    const options = {
      // el 为 null 时只跑计数器，不渲染评论 UI（列表页就是这种情况）
      el: el || null,
      serverURL: config.serverURL,
      path: normalizePath(window.location.pathname),
      lang: config.lang || 'zh-CN',
      // 本站恒为深色，用永远命中的选择器让 Waline 始终走暗色
      dark: 'html',
      pageSize: config.pageSize || 10,
      comment: config.commentCount !== false,
      pageview: config.pageview !== false,
      reaction: config.reaction !== false,
      locale: {
        placeholder: config.placeholder || '在这里留下你的观测信号',
        reactionTitle: '读完这篇，留个信号',
      },
    };

    if (config.requiredMeta) {
      options.requiredMeta = String(config.requiredMeta)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    try {
      instance = init(options);
    } catch (e) {
      console.error('[waline] 初始化失败:', e);
    }
  }

  mount();

  // PJAX 换页后内容区是新节点，需要重新挂载并按新 path 拉取数据
  window.addEventListener('pjax:done', mount);
}
