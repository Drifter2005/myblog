/**
 * 文章点赞 —— 鼓掌式：同一个人可以连续点多次，每次 +1。
 * 计数存 localStorage（记录的是本浏览器里的点赞数）。
 */
(function () {
  'use strict';

  var COUNT_KEY = 'blog_likes'; // { url: number }

  function readCounts() {
    try {
      var raw = localStorage.getItem(COUNT_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  var counts = readCounts();

  function persist() {
    try {
      localStorage.setItem(COUNT_KEY, JSON.stringify(counts));
    } catch (e) { /* 存储不可用时静默降级 */ }
  }

  function render(btn) {
    var url = btn.dataset.post;
    var count = counts[url] || 0;
    var countEl = btn.querySelector('.like-count');
    if (countEl) countEl.textContent = count;
    btn.classList.toggle('has-likes', count > 0);
  }

  function pop(btn) {
    // 每次点击都重放心跳动画
    var icon = btn.querySelector('.like-icon');
    if (!icon) return;
    icon.style.animation = 'none';
    void icon.offsetWidth; // 强制回流以重启动画
    icon.style.animation = '';

    // 飘出一个小心形
    var burst = document.createElement('span');
    burst.className = 'like-burst';
    burst.textContent = '❤';
    btn.appendChild(burst);
    setTimeout(function () { burst.remove(); }, 700);
  }

  function like(btn) {
    var url = btn.dataset.post;
    if (!url) return;

    counts[url] = (counts[url] || 0) + 1;
    persist();
    pop(btn);

    // 同一篇文章可能同时出现在列表与详情，全部同步
    document.querySelectorAll('.like-btn[data-post="' + url.replace(/"/g, '\\"') + '"]')
      .forEach(render);
  }

  function bind() {
    document.querySelectorAll('.like-btn').forEach(function (btn) {
      if (btn.dataset.likeBound !== '1') {
        btn.dataset.likeBound = '1';
        btn.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          like(btn);
        });
      }
      render(btn);
    });
  }

  // 供 PJAX 在换入新内容后调用
  window.LikeSystemRefresh = bind;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
