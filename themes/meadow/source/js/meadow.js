(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const config = JSON.parse($('#meadow-config').textContent);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 600px)');
  const storage = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  };
  const announce = message => { $('#live-status').textContent = message; };
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (name === 'pause' ? '<path d="M8 5v14M16 5v14"/>' : '<path d="m8 4 13 8-13 8Z"/>') + '</svg>';

  // Background media never competes with the text layer. Poster remains on failure.
  const video = $('#landing-video');
  if (video) {
    const toggle = $('#video-toggle');
    let desired = false;
    let visibilityEpoch = 0;
    function reflectVideo() {
      const playing = !video.paused;
      toggle.innerHTML = icon(playing ? 'pause' : 'play') + '<span>' + (playing ? '暂停风景' : '播放风景') + '</span>';
      toggle.setAttribute('aria-label', playing ? '暂停背景动画' : '播放背景动画');
      toggle.setAttribute('aria-pressed', String(playing));
    }
    async function playVideo() {
      if (motion.matches) return;
      if (!video.src) video.src = video.dataset.videoSrc;
      video.muted = true;
      try { await video.play(); } catch (_) { reflectVideo(); }
    }
    toggle.addEventListener('click', () => {
      desired = video.paused;
      if (desired) playVideo(); else video.pause();
    });
    video.addEventListener('playing', () => { video.classList.add('is-playing'); reflectVideo(); });
    video.addEventListener('pause', reflectVideo);
    video.addEventListener('error', () => { video.classList.remove('is-playing'); reflectVideo(); });
    motion.addEventListener('change', () => { if (motion.matches) { desired = false; video.pause(); } });
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting;
      visibilityEpoch = visible ? 1 : 0;
      if (!visible) video.pause(); else if (desired && !document.hidden) playVideo();
    }, {threshold: .05});
    observer.observe($('.landing'));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause(); else if (desired && visibilityEpoch) playVideo();
    });
    // Save data and small screens start with the optimized still image.
    if (!motion.matches && !small.matches && !(navigator.connection && navigator.connection.saveData)) {
      desired = true;
      if ('requestIdleCallback' in window) requestIdleCallback(playVideo, {timeout: 1800});
      else setTimeout(playVideo, 800);
    }
  }

  // Hold for 420 ms, drag anywhere, then snap to a viewport edge.
  // Coordinates are proportions so a saved position survives rotation/resizing.
  const dock = $('#glass-dock');
  const dockToggle = $('#dock-toggle');
  let pointer = null;
  let holdTimer;
  let suppressClickUntil = 0;
  let settleTimer;
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function bounds() {
    return {w: innerWidth, h: window.visualViewport ? window.visualViewport.height : innerHeight, dw: dock.offsetWidth, dh: dock.offsetHeight};
  }
  function setPosition(x, y) {
    const b = bounds();
    const left = clamp(x, 10, b.w - b.dw - 10);
    const top = clamp(y, 12, b.h - b.dh - 22);
    dock.style.left = left + 'px'; dock.style.top = top + 'px';
    dock.style.right = 'auto'; dock.style.bottom = 'auto';
    dock.classList.toggle('dock-left', left < b.w / 2);
  }
  function savePosition() {
    const b = bounds(); const r = dock.getBoundingClientRect();
    storage.set('meadow-dock-v1', {edge: r.left < b.w / 2 ? 'left' : 'right', y: r.top / Math.max(1, b.h - b.dh)});
  }
  function restorePosition() {
    const saved = storage.get('meadow-dock-v1');
    if (!saved || !Number.isFinite(saved.y)) return;
    const b = bounds();
    setPosition(saved.edge === 'left' ? 12 : b.w - b.dw - 12, saved.y * (b.h - b.dh));
  }
  function snapPosition() {
    const b = bounds(); const r = dock.getBoundingClientRect();
    dock.classList.add('is-snapping');
    setPosition(r.left + b.dw / 2 < b.w / 2 ? 12 : b.w - b.dw - 12, r.top);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { dock.classList.remove('is-snapping'); savePosition(); }, 240);
  }
  function setExpanded(expanded) {
    dock.classList.toggle('is-expanded', expanded);
    dockToggle.setAttribute('aria-expanded', String(expanded));
    dockToggle.setAttribute('aria-label', expanded ? '收起快捷工具' : '展开快捷工具');
    if (dock.style.left) {
      const r = dock.getBoundingClientRect(); setPosition(r.left, r.top);
    } else if (expanded) {
      const r = dock.getBoundingClientRect(); setPosition(r.left, r.top);
    }
  }
  dockToggle.addEventListener('click', () => setExpanded(!dock.classList.contains('is-expanded')));
  dock.addEventListener('contextmenu', event => event.preventDefault());
  dock.addEventListener('dragstart', event => event.preventDefault());
  dock.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    clearTimeout(holdTimer);
    const r = dock.getBoundingClientRect();
    pointer = {id: event.pointerId, x: event.clientX, y: event.clientY, dx: event.clientX - r.left, dy: event.clientY - r.top, dragging: false};
    holdTimer = setTimeout(() => {
      if (!pointer) return;
      pointer.dragging = true;
      dock.classList.add('is-armed', 'is-dragging');
      dock.setPointerCapture(pointer.id);
      announce('可以拖动工具条了，松手后自动贴边。');
    }, 420);
  });
  dock.addEventListener('pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (!pointer.dragging) {
      if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 8) { clearTimeout(holdTimer); pointer = null; }
      return;
    }
    event.preventDefault();
    setPosition(event.clientX - pointer.dx, event.clientY - pointer.dy);
  });
  function finishPointer(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    clearTimeout(holdTimer);
    if (pointer.dragging) {
      suppressClickUntil = performance.now() + 700;
      if (dock.hasPointerCapture(pointer.id)) dock.releasePointerCapture(pointer.id);
      dock.classList.remove('is-armed', 'is-dragging');
      snapPosition(); announce('工具条位置已保存。');
    }
    pointer = null;
  }
  window.addEventListener('pointerup', finishPointer);
  window.addEventListener('pointercancel', finishPointer);
  window.addEventListener('blur', () => {
    clearTimeout(holdTimer); pointer = null; dock.classList.remove('is-armed', 'is-dragging');
  });
  dock.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  $('#dock-grip').addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') {
      try { localStorage.removeItem('meadow-dock-v1'); } catch (_) {}
      dock.removeAttribute('style'); dock.classList.remove('dock-left');
      return;
    }
    const r = dock.getBoundingClientRect(); const b = bounds();
    const step = event.shiftKey ? 60 : 20;
    setPosition(event.key === 'ArrowLeft' ? 12 : event.key === 'ArrowRight' ? b.w - b.dw - 12 : r.left, r.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0));
    savePosition();
  });
  let resizeFrame;
  function onResize() { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { if (!small.matches) setExpanded(false); restorePosition(); if (dock.style.left) { const r = dock.getBoundingClientRect(); setPosition(r.left, r.top); } }); }
  addEventListener('resize', onResize);
  if (window.visualViewport) visualViewport.addEventListener('resize', onResize);
  restorePosition();
  document.addEventListener('click', event => {
    if (small.matches && !dock.contains(event.target)) setExpanded(false);
  });
  $('[data-back-top]').addEventListener('click', () => {
    scrollTo({top: 0, behavior: motion.matches ? 'instant' : 'smooth'});
    if (small.matches) setExpanded(false);
  });

  // Search renders text nodes only; post content is never inserted as HTML.
  const dialog = $('#search-dialog');
  const searchInput = $('#search-input');
  const results = $('#search-results');
  const searchStatus = $('#search-status');
  let records;
  let searchRequest;
  let opener;
  async function loadSearch() {
    if (records) return records;
    if (!searchRequest) searchRequest = fetch(config.search).then(response => {
      if (!response.ok) throw new Error('search unavailable');
      return response.json();
    }).then(data => { records = data; return data; }).catch(error => { searchRequest = null; throw error; });
    return searchRequest;
  }
  async function renderSearch() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    results.replaceChildren();
    if (!query) { searchStatus.textContent = '输入关键词，找回一段记录。'; return; }
    searchStatus.textContent = '正在寻找…';
    try {
      const data = await loadSearch();
      if (query !== searchInput.value.trim().toLocaleLowerCase()) return;
      const words = query.split(/\s+/);
      const matches = data.filter(post => words.every(word => (post.title + ' ' + post.excerpt + ' ' + post.tags.join(' ')).toLocaleLowerCase().includes(word))).slice(0, 30);
      searchStatus.textContent = matches.length ? '找到 ' + matches.length + ' 篇记录' : '还没有找到，试试另一个关键词。';
      matches.forEach(post => {
        const a = document.createElement('a'); a.className = 'search-result'; a.href = post.url;
        const title = document.createElement('strong'); title.textContent = post.title;
        const excerpt = document.createElement('p'); excerpt.textContent = post.excerpt.slice(0, 100) + '…';
        a.append(title, excerpt); results.append(a);
      });
    } catch (_) { searchStatus.textContent = '搜索暂时无法加载，请稍后重试，或从文章归档查找。'; }
  }
  document.querySelectorAll('[data-open-search]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    if (small.matches) setExpanded(false);
    dialog.showModal(); searchInput.focus();
    loadSearch().catch(() => {});
  }));
  $('[data-close-search]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { if (opener && opener.offsetParent) opener.focus(); });
  let searchTimer;
  searchInput.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(renderSearch, 100); });

  // Existing local music files, no remote player library or autoplay required.
  const songs = [
    ['一格格', '卫兰', '一格格 - 卫兰.mp3'],
    ['如果可以 (烟嗓版)', '半吨兄弟', '如果可以 (烟嗓版) - 半吨兄弟.mp3'],
    ['孤独患者', '陈奕迅', '孤独患者 - 陈奕迅.mp3'],
    ['小孩', '何雨溪', '小孩 - 何雨溪.mp3'],
    ['小小的一片云呀 (童年走马灯)', '少女泪', '小小的一片云呀 (童年走马灯) - 少女泪.mp3'],
    ['把回忆拼好给你', '张妙格', '把回忆拼好给你 - 张妙格.mp3'],
    ['谜', '二硕', '谜 - 二硕.mp3']
  ];
  const audio = $('#blog-audio'); const panel = $('#music-panel'); const musicToggle = $('#music-toggle'); const play = $('#music-play');
  const savedMusic = storage.get('meadow-music') || {};
  let songIndex = Number.isInteger(savedMusic.index) ? clamp(savedMusic.index, 0, songs.length - 1) : 0;
  let resumeTime = Number.isFinite(savedMusic.time) ? savedMusic.time : 0;
  audio.volume = Number.isFinite(savedMusic.volume) ? clamp(savedMusic.volume, 0, 1) : .45;
  $('#music-volume').value = String(audio.volume);
  function time(value) { return Number.isFinite(value) ? Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0') : '0:00'; }
  function reflectMusic() {
    play.innerHTML = icon(audio.paused ? 'play' : 'pause');
    play.setAttribute('aria-label', audio.paused ? '播放音乐' : '暂停音乐');
    musicToggle.classList.toggle('is-playing', !audio.paused);
  }
  function selectSong(index) {
    songIndex = (index + songs.length) % songs.length;
    const song = songs[songIndex];
    $('#music-title').textContent = song[0]; $('#music-artist').textContent = song[1];
    audio.src = config.musicRoot + encodeURIComponent(song[2]);
    $('#music-status').textContent = '';
    $('#music-progress').value = '0'; $('#music-elapsed').textContent = '0:00'; $('#music-duration').textContent = '0:00';
    reflectMusic();
  }
  function saveMusic() { storage.set('meadow-music', {index: songIndex, time: audio.currentTime || resumeTime, volume: audio.volume}); }
  async function playMusic() { try { await audio.play(); } catch (_) { $('#music-status').textContent = '暂时无法播放，请再点一次播放。'; } }
  function setMusicOpen(open) { panel.hidden = !open; musicToggle.setAttribute('aria-expanded', String(open)); musicToggle.setAttribute('aria-label', open ? '关闭音乐面板' : '打开音乐'); }
  musicToggle.addEventListener('click', () => { setMusicOpen(panel.hidden); if (small.matches) setExpanded(false); });
  $('#music-close').addEventListener('click', () => setMusicOpen(false));
  play.addEventListener('click', () => { if (audio.paused) playMusic(); else audio.pause(); });
  $('#music-next').addEventListener('click', () => { resumeTime = 0; selectSong(songIndex + 1); playMusic(); });
  $('#music-prev').addEventListener('click', () => { resumeTime = 0; selectSong(songIndex - 1); playMusic(); });
  audio.addEventListener('ended', () => { resumeTime = 0; selectSong(songIndex + 1); playMusic(); });
  audio.addEventListener('play', reflectMusic); audio.addEventListener('pause', () => { reflectMusic(); saveMusic(); });
  audio.addEventListener('error', () => { $('#music-status').textContent = '这首歌暂时无法加载，可以试试下一首。'; });
  audio.addEventListener('loadedmetadata', () => { if (resumeTime > 0) { audio.currentTime = Math.min(resumeTime, audio.duration || resumeTime); resumeTime = 0; } $('#music-duration').textContent = time(audio.duration); });
  audio.addEventListener('timeupdate', () => { $('#music-elapsed').textContent = time(audio.currentTime); if (Number.isFinite(audio.duration) && audio.duration > 0) $('#music-progress').value = String(audio.currentTime / audio.duration * 100); });
  $('#music-progress').addEventListener('input', event => { if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(event.target.value) / 100; });
  $('#music-volume').addEventListener('input', event => { audio.volume = Number(event.target.value); saveMusic(); });
  addEventListener('pagehide', saveMusic);
  selectSong(songIndex);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (dialog.open) { event.preventDefault(); dialog.close(); } setMusicOpen(false); if (small.matches) setExpanded(false); } });

  const copy = $('[data-copy-link]');
  if (copy) copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); copy.textContent = '已复制'; announce('文章链接已复制。'); setTimeout(() => { copy.textContent = '复制链接'; }, 2000); }
    catch (_) { copy.textContent = '请复制地址栏链接'; }
  });
  document.querySelectorAll('.article-entry img').forEach((image, index) => {
    image.loading = 'lazy'; image.decoding = 'async';
    if (!image.alt) image.alt = '文章配图 ' + (index + 1);
  });
}());
