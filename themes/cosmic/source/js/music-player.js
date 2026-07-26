/**
 * 音乐播放器 —— APlayer 封装
 *
 * 添加歌曲：在下面 PLAYLIST 数组里加一项即可。
 *   { name: '歌名', artist: '歌手', url: '/music/文件名.mp3', cover: '封面URL(可留空)' }
 * mp3 文件放在  source/music/  目录下。
 */
(function () {
  'use strict';

  /* ============ 播放列表（在这里增删歌曲） ============ */
  var PLAYLIST = [
    { name: '一格格',                     artist: '卫兰',     url: '/music/一格格 - 卫兰.mp3' },
    { name: '如果可以 (烟嗓版)',           artist: '半吨兄弟', url: '/music/如果可以 (烟嗓版) - 半吨兄弟.mp3' },
    { name: '孤独患者',                   artist: '陈奕迅',   url: '/music/孤独患者 - 陈奕迅.mp3' },
    { name: '小孩',                       artist: '何雨溪',   url: '/music/小孩 - 何雨溪.mp3' },
    { name: '小小的一片云呀 (童年走马灯)', artist: '少女泪',   url: '/music/小小的一片云呀 (童年走马灯) - 少女泪.mp3' },
    { name: '把回忆拼好给你',             artist: '张妙格',   url: '/music/把回忆拼好给你 - 张妙格.mp3' },
    { name: '谜',                         artist: '二硕',     url: '/music/谜 - 二硕.mp3' }
  ];
  /* =================================================== */

  // 没有封面时用一张内嵌 SVG，避免外链占位图拖慢加载
  var FALLBACK_COVER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0d2b4a"/><stop offset="1" stop-color="#05101f"/>' +
    '</linearGradient></defs>' +
    '<rect width="120" height="120" fill="url(#g)"/>' +
    '<circle cx="60" cy="60" r="30" fill="none" stroke="#74f7d1" stroke-opacity=".45" stroke-width="1.5"/>' +
    '<circle cx="60" cy="60" r="6" fill="#74f7d1" fill-opacity=".85"/>' +
    '</svg>'
  );

  var ICON_MUSIC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';

  var ICON_COLLAPSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M6 9l6 6 6-6"/></svg>';

  var STORAGE_KEY = 'aplayer-visibility';

  /* ---------- 显示/隐藏控制 ---------- */

  var Controller = {
    isHidden: function () {
      return localStorage.getItem(STORAGE_KEY) === 'hidden';
    },

    apply: function (hidden, animate) {
      var btn = document.querySelector('.player-toggle');
      if (!animate) document.body.classList.add('player-no-anim');

      document.body.classList.toggle('player-hidden', hidden);

      if (btn) {
        btn.innerHTML = hidden ? ICON_MUSIC : ICON_COLLAPSE;
        btn.setAttribute('title', hidden ? '显示音乐播放器' : '隐藏音乐播放器');
        btn.setAttribute('aria-label', hidden ? '显示音乐播放器' : '隐藏音乐播放器');
        btn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
      }

      if (!animate) {
        // 下一帧再解除禁用，确保首次渲染没有闪烁的滑动动画。
        // 后台标签页里 rAF 会被暂停，用 setTimeout 兜底，
        // 否则这个 class 会一直留着、把过渡永久关掉。
        var released = false;
        var release = function () {
          if (released) return;
          released = true;
          document.body.classList.remove('player-no-anim');
        };
        requestAnimationFrame(function () {
          requestAnimationFrame(release);
        });
        setTimeout(release, 400);
      }
    },

    hide: function () {
      localStorage.setItem(STORAGE_KEY, 'hidden');
      this.apply(true, true);
    },

    show: function () {
      localStorage.setItem(STORAGE_KEY, 'visible');
      this.apply(false, true);
    },

    toggle: function () {
      if (this.isHidden()) this.show();
      else this.hide();
    }
  };

  /* ---------- 切换按钮 ---------- */

  function buildToggle() {
    if (document.querySelector('.player-toggle')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'player-toggle';
    btn.innerHTML = ICON_COLLAPSE;
    btn.setAttribute('title', '隐藏音乐播放器');
    btn.setAttribute('aria-label', '隐藏音乐播放器');
    btn.setAttribute('aria-expanded', 'true');

    btn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      Controller.toggle();
    });

    // 挂在 body 上，完全独立于 APlayer 内部 DOM，避免布局冲突
    document.body.appendChild(btn);
  }

  /* ---------- 初始化 ---------- */

  var booted = false;
  var initAttempts = 0;
  var MAX_INIT_ATTEMPTS = 50; // 约 6 秒；APlayer CDN 挂掉时放弃而不是永久轮询

  function init() {
    if (booted) return; // 防止重复初始化（PJAX 场景）

    var container = document.getElementById('music-player-host');
    if (!container || typeof window.APlayer === 'undefined') {
      if (++initAttempts < MAX_INIT_ATTEMPTS) setTimeout(init, 120);
      else console.warn('[player] APlayer 未能加载，跳过播放器初始化');
      return;
    }
    booted = true;

    var audio = PLAYLIST.map(function (track) {
      return {
        name: track.name,
        artist: track.artist,
        url: track.url,
        cover: track.cover || FALLBACK_COVER
      };
    });

    var player = new window.APlayer({
      container: container,
      fixed: true,
      autoplay: false,
      theme: '#74f7d1',
      loop: 'all',
      order: 'list',
      preload: 'metadata',
      volume: 0.7,
      mutex: true,
      listFolded: true,
      listMaxHeight: 300,
      lrcType: 0,
      audio: audio,
      storageName: 'aplayer-settings'
    });

    player.on('play', function () {
      document.body.classList.add('music-playing');
    });

    player.on('pause', function () {
      document.body.classList.remove('music-playing');
    });

    player.on('error', function () {
      // APlayer 在切歌 abort 时也会触发 error 事件；
      // 只有 audio.error 真实存在才是加载失败。
      var mediaError = player.audio && player.audio.error;
      if (mediaError) {
        console.error(
          '[player] 音轨加载失败 (code ' + mediaError.code + ')，' +
          '请检查 /music/ 下的文件名是否与 PLAYLIST 一致：',
          player.audio.src
        );
      }
    });

    window.aplayer = player;
    window.PlayerController = Controller;

    buildToggle();
    // 首次按存储状态就位，不播动画
    Controller.apply(Controller.isHidden(), false);

    // 快捷键 M 切换
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'm' && event.key !== 'M') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      var tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || event.target.isContentEditable) return;
      Controller.toggle();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
