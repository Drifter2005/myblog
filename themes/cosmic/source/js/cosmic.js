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

  body.classList.add('cosmic-ready');

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateMouseVars(x, y) {
    var px = ((x / window.innerWidth) - 0.5) * 18;
    var py = ((y / window.innerHeight) - 0.5) * 18;
    root.style.setProperty('--cosmic-mouse-x', x + 'px');
    root.style.setProperty('--cosmic-mouse-y', y + 'px');
    root.style.setProperty('--cosmic-parallax-x', px.toFixed(2) + 'px');
    root.style.setProperty('--cosmic-parallax-y', py.toFixed(2) + 'px');
  }

  window.addEventListener('pointermove', function (event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (!mouse.active) {
      mouse.active = true;
      body.classList.add('cosmic-pointer-active');
    }
    updateMouseVars(mouse.x, mouse.y);
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

    var count = clamp(Math.floor((width * height) / 7600), 80, 230);
    stars = Array.from({ length: count }, function (_, index) {
      var depth = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.35 + depth * 1.35,
        r: 0.45 + Math.random() * 1.65,
        vx: (-0.08 + Math.random() * 0.16) * (0.4 + depth),
        vy: (0.035 + Math.random() * 0.13) * (0.45 + depth),
        pulse: Math.random() * Math.PI * 2,
        hue: index % 5 === 0 ? '116,247,209' : '220,236,255'
      };
    });
  }

  function drawStars(time) {
    if (!ctx || reducedMotion) return;
    ctx.clearRect(0, 0, width, height);
    var gravityX = (mouse.x - width / 2) / width;
    var gravityY = (mouse.y - height / 2) / height;

    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];
      star.x += star.vx + gravityX * star.z * 0.12;
      star.y += star.vy + gravityY * star.z * 0.08;

      if (star.x < -10) star.x = width + 10;
      if (star.x > width + 10) star.x = -10;
      if (star.y > height + 10) star.y = -10;
      if (star.y < -10) star.y = height + 10;

      var twinkle = 0.42 + Math.sin(time / 780 + star.pulse) * 0.22 + star.z * 0.22;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + star.hue + ',' + clamp(twinkle, 0.22, 0.95) + ')';
      ctx.shadowColor = 'rgba(116,247,209,0.42)';
      ctx.shadowBlur = star.z * 8;
      ctx.arc(star.x, star.y, star.r * star.z, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    requestAnimationFrame(drawStars);
  }

  function revealOnScroll() {
    var targets = document.querySelectorAll('.article, .widget-wrap');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (target) { target.classList.add('in-view'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (target) { observer.observe(target); });
  }

  function attachCardLight() {
    document.querySelectorAll('.article-inner').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width) * 100;
        var y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--cosmic-card-x', x.toFixed(2) + '%');
        card.style.setProperty('--cosmic-card-y', y.toFixed(2) + '%');
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

  window.addEventListener('resize', function () {
    buildStars();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());