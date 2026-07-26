/**
 * 文章点赞 —— 纯前端 localStorage 实现。
 * 同时记录「计数」和「本人是否已赞」，刷新后状态可正确恢复。
 */
(function () {
  'use strict';

  var COUNT_KEY = 'blog_likes';   // { url: number }
  var MINE_KEY = 'blog_liked_by_me'; // [url, ...]

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  var counts = readJSON(COUNT_KEY, {});
  var mine = new Set(readJSON(MINE_KEY, []));

  function persist() {
    try {
      localStorage.setItem(COUNT_KEY, JSON.stringify(counts));
      localStorage.setItem(MINE_KEY, JSON.stringify(Array.from(mine)));
    } catch (e) { /* 存储不可用时静默降级 */ }
  }

  function render(btn) {
    var url = btn.dataset.post;
    var count = counts[url] || 0;
    var liked = mine.has(url);

    var countEl = btn.querySelector('.like-count');
    if (countEl) countEl.textContent = count;

    btn.classList.toggle('liked', liked);
    btn.classList.toggle('has-likes', !liked && count > 0);
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
    btn.setAttribute('title', liked ? '取消点赞' : '点赞此文章');
  }

  function toggle(btn) {
    var url = btn.dataset.post;
    if (!url) return;

    var count = counts[url] || 0;

    if (mine.has(url)) {
      mine.delete(url);
      counts[url] = Math.max(0, count - 1);
    } else {
      mine.add(url);
      counts[url] = count + 1;
      // 重放心跳动画
      var icon = btn.querySelector('.like-icon');
      if (icon) {
        icon.style.animation = 'none';
        void icon.offsetWidth; // 强制回流以重启动画
        icon.style.animation = '';
      }
    }

    persist();

    // 同一篇文章可能在页面上出现多次（列表 + 详情），全部同步
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
          toggle(btn);
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
