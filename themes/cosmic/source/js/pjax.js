/**
 * 轻量 PJAX —— 只替换 .outer 内容区，让 #music-player-host(音乐播放器) 在导航间存活。
 * 无依赖，基于 fetch + History API。
 */
(function () {
  'use strict';

  // 不支持的环境直接退回整页跳转
  if (!window.fetch || !window.history || !window.history.pushState || !window.DOMParser) return;

  // 必须用专属 id：.outer 在 header / 内容区 / footer 各出现一次，
  // 用类选择器会误抓到 header。
  var CONTAINER = '#content-outer';
  var cache = Object.create(null);
  var currentRequest = 0;

  function container() {
    return document.querySelector(CONTAINER);
  }

  /* ---------- 链接判定 ---------- */

  var SKIP_EXT = /\.(mp3|mp4|wav|ogg|flac|zip|rar|7z|pdf|png|jpe?g|gif|svg|webp|exe|dmg|txt|xml|json)$/i;

  function shouldHandle(link, event) {
    if (event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (!link || !link.href) return false;
    if (link.target && link.target !== '' && link.target !== '_self') return false;
    if (link.hasAttribute('download')) return false;
    if (link.getAttribute('rel') === 'external') return false;
    if (link.dataset.noPjax !== undefined) return false;

    var url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (e) {
      return false;
    }

    if (url.origin !== window.location.origin) return false;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (SKIP_EXT.test(url.pathname)) return false;

    // 同页锚点：交给浏览器原生处理
    if (url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash) {
      return false;
    }

    return true;
  }

  /* ---------- 进度条 ---------- */

  var bar = null;

  function barStart() {
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'pjax-progress';
      document.body.appendChild(bar);
    }
    bar.classList.remove('done');
    bar.classList.add('active');
  }

  function barDone() {
    if (!bar) return;
    bar.classList.remove('active');
    bar.classList.add('done');
    setTimeout(function () {
      if (bar) bar.classList.remove('done');
    }, 320);
  }

  /* ---------- 内容替换 ---------- */

  function applyDocument(html, url) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var incoming = doc.querySelector(CONTAINER);
    var host = container();
    if (!incoming || !host) {
      window.location.href = url;
      return false;
    }

    // 标题
    var title = doc.querySelector('title');
    document.title = title ? title.textContent : document.title;

    // body 的 page-layout-* class 决定侧栏/排版，必须同步
    var incomingBody = doc.body;
    if (incomingBody) {
      var keep = [];
      // 保留运行时状态类，避免星空/播放器状态被重置
      ['cosmic-ready', 'cosmic-pointer-active', 'music-playing', 'player-hidden'].forEach(function (cls) {
        if (document.body.classList.contains(cls)) keep.push(cls);
      });
      document.body.className = incomingBody.className;
      keep.forEach(function (cls) { document.body.classList.add(cls); });
    }

    host.innerHTML = incoming.innerHTML;
    return true;
  }

  function refreshDynamic() {
    // 重新绑定内容区里的交互（这些模块各自暴露了 refresh 钩子）
    if (typeof window.CosmicRefresh === 'function') window.CosmicRefresh();

    // fancybox（若启用）
    if (window.jQuery && typeof window.jQuery.fn.fancybox === 'function') {
      try {
        window.jQuery('.article-entry').find('img').parent('a').fancybox();
      } catch (e) { /* 忽略 */ }
    }

    updateNavActive();
    // Waline 的重新挂载由 waline-init.js 监听 pjax:done 自行处理，
    // 这里不直接触碰，避免两处管理同一个实例。
  }

  function updateNavActive() {
    var path = window.location.pathname;
    document.querySelectorAll('#main-nav .main-nav-link, #mobile-nav .mobile-nav-link').forEach(function (a) {
      var href;
      try {
        href = new URL(a.href, window.location.href).pathname;
      } catch (e) {
        return;
      }
      a.classList.toggle('nav-current', href === path);
    });
  }

  /* ---------- 导航 ---------- */

  function load(url, push) {
    var token = ++currentRequest;
    barStart();
    document.body.classList.add('pjax-loading');

    var done = function (html) {
      if (token !== currentRequest) return; // 已被更新的请求取代
      if (!applyDocument(html, url)) return;

      if (push) window.history.pushState({ pjax: true }, '', url);

      window.scrollTo({ top: 0, behavior: 'auto' });
      refreshDynamic();

      document.body.classList.remove('pjax-loading');
      barDone();

      // 通知其他脚本
      window.dispatchEvent(new CustomEvent('pjax:done', { detail: { url: url } }));
    };

    if (cache[url]) {
      // 缓存命中：下一帧渲染，保留过渡感
      requestAnimationFrame(function () { done(cache[url]); });
      return;
    }

    fetch(url, { credentials: 'same-origin', headers: { 'X-PJAX': 'true' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        cache[url] = html;
        done(html);
      })
      .catch(function () {
        // 任何失败都退回整页跳转，保证可用性
        window.location.href = url;
      });
  }

  /* ---------- 事件绑定 ---------- */

  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a') : null;
    if (!link) return;
    if (!shouldHandle(link, event)) return;

    event.preventDefault();

    var url = new URL(link.href, window.location.href);
    var target = url.pathname + url.search;

    if (target === window.location.pathname + window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 移动端导航打开时，点击后先收起
    document.body.classList.remove('mobile-nav-on');

    load(url.href, true);
  });

  window.addEventListener('popstate', function (event) {
    if (!event.state || !event.state.pjax) {
      // 不是 PJAX 产生的历史项（例如初始进入），交给浏览器
      return;
    }
    load(window.location.href, false);
  });

  // 让初始页面也带上 pjax 标记，前进/后退才能被正确接管
  window.history.replaceState({ pjax: true }, '', window.location.href);

  updateNavActive();
})();
