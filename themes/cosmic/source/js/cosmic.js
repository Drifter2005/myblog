(function () {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var body = document.body;
  var canvas = document.getElementById('starfield');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  var stars = [];
  var width = 0;
  var height = 0;
  var dpr = 1;
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
  var mouseThrottle = 0;
  var lastFrameTime = 0;

  body.classList.add('cosmic-ready');

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // 直接改目标元素的 transform，而不是往 :root 写自定义属性 ——
  // 后者每次都触发全文档样式失效（实测 ~3ms/次），前者只走合成器。
  var halo = document.querySelector('.cursor-halo');
  var bgLayer = document.querySelector('.cosmic-background');
  var mouseRaf = null;

  function applyMouseVars() {
    mouseRaf = null;
    if (halo) {
      halo.style.transform = 'translate3d(' + mouse.x + 'px,' + mouse.y + 'px,0)';
    }
    if (bgLayer) {
      var px = ((mouse.x / window.innerWidth) - 0.5) * 18;
      var py = ((mouse.y / window.innerHeight) - 0.5) * 18;
      bgLayer.style.transform = 'translate3d(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px,0)';
    }
  }

  function updateMouseVars() {
    if (!mouseRaf) mouseRaf = requestAnimationFrame(applyMouseVars);
  }

  window.addEventListener('pointermove', function (event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (!mouse.active) {
      mouse.active = true;
      body.classList.add('cosmic-pointer-active');
    }
    updateMouseVars();
  }, { passive: true });

  window.addEventListener('pointerleave', function () {
    mouse.active = false;
    body.classList.remove('cosmic-pointer-active');
  });

  function buildStars() {
    if (!ctx || reducedMotion) return;
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = clamp(Math.floor((width * height) / 8200), 60, 200);
    stars = Array.from({ length: count }, function (_, index) {
      var depth = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.32 + depth * 1.4,
        r: 0.5 + Math.random() * 1.5,
        vx: (-0.06 + Math.random() * 0.12) * (0.35 + depth),
        vy: (0.025 + Math.random() * 0.1) * (0.4 + depth),
        pulse: Math.random() * Math.PI * 2,
        hue: index % 5 === 0 ? '116,247,209' : '220,236,255'
      };
    });
  }

  function drawStars(time) {
    if (!ctx || reducedMotion) return;

    // 高刷屏限帧到 ~60fps。早退分支必须重新排队，
    // 否则第一帧 delta < 16ms 时整个动画循环就永久停死。
    var now = performance.now();
    if (now - lastFrameTime < 16) {
      requestAnimationFrame(drawStars);
      return;
    }
    lastFrameTime = now;

    ctx.clearRect(0, 0, width, height);
    var gravityX = (mouse.x - width / 2) / width;
    var gravityY = (mouse.y - height / 2) / height;

    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];
      star.x += star.vx + gravityX * star.z * 0.08;
      star.y += star.vy + gravityY * star.z * 0.06;

      if (star.x < -10) star.x = width + 10;
      if (star.x > width + 10) star.x = -10;
      if (star.y > height + 10) star.y = -10;
      if (star.y < -10) star.y = height + 10;

      var twinkle = 0.48 + Math.sin(time / 820 + star.pulse) * 0.24 + star.z * 0.18;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + star.hue + ',' + clamp(twinkle, 0.24, 0.92) + ')';
      ctx.shadowColor = 'rgba(116,247,209,0.38)';
      ctx.shadowBlur = Math.max(star.z * 6, 2);
      ctx.arc(star.x, star.y, star.r * star.z, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    requestAnimationFrame(drawStars);
  }

  var revealObserver = null;

  function revealOnScroll() {
    var targets = document.querySelectorAll('.article, .widget-wrap');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (target) { target.classList.add('in-view'); });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    }

    targets.forEach(function (target) {
      if (target.classList.contains('in-view')) return;
      revealObserver.observe(target);
    });
  }

  function attachCardLight() {
    document.querySelectorAll('.article-inner').forEach(function (card) {
      // PJAX 换入的新节点才需要绑定，避免重复挂载
      if (card.dataset.cardLight === '1') return;
      card.dataset.cardLight = '1';

      var rafId = null;
      card.addEventListener('pointermove', function (event) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function() {
          var rect = card.getBoundingClientRect();
          var x = ((event.clientX - rect.left) / rect.width) * 100;
          var y = ((event.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty('--cosmic-card-x', x.toFixed(1) + '%');
          card.style.setProperty('--cosmic-card-y', y.toFixed(1) + '%');
        });
      }, { passive: true });
    });
  }

  function boot() {
    updateMouseVars(mouse.x, mouse.y);
    revealOnScroll();
    attachCardLight();
    buildStars();
    if (ctx && !reducedMotion) requestAnimationFrame(drawStars);
  }

  // PJAX 换入新内容后重新绑定内容区交互（星空/光晕是全局的，无需重建）
  window.CosmicRefresh = function () {
    revealOnScroll();
    attachCardLight();
  };

  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(buildStars, 300);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());