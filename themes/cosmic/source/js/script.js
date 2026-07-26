(function($){
  // Search
  var $searchWrap = $('#search-form-wrap'),
    isSearchAnim = false,
    searchAnimDuration = 200;

  var startSearchAnim = function(){
    isSearchAnim = true;
  };

  var stopSearchAnim = function(callback){
    setTimeout(function(){
      isSearchAnim = false;
      callback && callback();
    }, searchAnimDuration);
  };

  $('.nav-search-btn').on('click', function(){
    if (isSearchAnim) return;

    startSearchAnim();
    $searchWrap.addClass('on');
    $(this).attr('aria-expanded', 'true');
    stopSearchAnim(function(){
      $('.search-form-input').focus();
    });
  });

  // 用 focusout + relatedTarget 判断焦点是否真的离开了整个表单，
  // 避免 Tab 从输入框移到提交按钮的瞬间表单被收起。
  $('.search-form').on('focusout', function(event){
    var next = event.relatedTarget;
    if (next && $.contains(this, next)) return;

    startSearchAnim();
    $searchWrap.removeClass('on');
    $('.nav-search-btn').attr('aria-expanded', 'false');
    stopSearchAnim();
  });

  // Share
  $('body').on('click', function(){
    $('.article-share-box.on').removeClass('on');
  }).on('click', '.article-share-link', function(e){
    e.stopPropagation();

    var $this = $(this),
      url = $this.attr('data-url'),
      encodedUrl = encodeURIComponent(url),
      id = 'article-share-box-' + $this.attr('data-id'),
      title = $this.attr('data-title'),
      offset = $this.offset();

    if ($('#' + id).length){
      var box = $('#' + id);

      if (box.hasClass('on')){
        box.removeClass('on');
        return;
      }
    } else {
      var html = [
        '<div id="' + id + '" class="article-share-box">',
          '<input class="article-share-input" value="' + url + '">',
          '<div class="article-share-links">',
            '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodedUrl + '" class="article-share-twitter" target="_blank" title="Twitter"><span class="fa fa-twitter"></span></a>',
            '<a href="https://www.facebook.com/sharer.php?u=' + encodedUrl + '" class="article-share-facebook" target="_blank" title="Facebook"><span class="fa fa-facebook"></span></a>',
            '<a href="http://pinterest.com/pin/create/button/?url=' + encodedUrl + '" class="article-share-pinterest" target="_blank" title="Pinterest"><span class="fa fa-pinterest"></span></a>',
            '<a href="https://www.linkedin.com/shareArticle?mini=true&url=' + encodedUrl + '" class="article-share-linkedin" target="_blank" title="LinkedIn"><span class="fa fa-linkedin"></span></a>',
          '</div>',
        '</div>'
      ].join('');

      var box = $(html);

      $('body').append(box);
    }

    $('.article-share-box.on').hide();

    box.css({
      top: offset.top + 25,
      left: offset.left
    }).addClass('on');
  }).on('click', '.article-share-box', function(e){
    e.stopPropagation();
  }).on('click', '.article-share-box-input', function(){
    $(this).select();
  }).on('click', '.article-share-box-link', function(e){
    e.preventDefault();
    e.stopPropagation();

    window.open(this.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
  });

  // Caption + fancybox
  // 抽成可重入函数：PJAX 换入的新内容需要重新处理，否则新文章里的图片
  // 拿不到 <a> 包裹，灯箱和图注都会失效。
  var enhanceArticleImages = function(){
    $('.article-entry').each(function(i){
      var $entry = $(this);

      // 已处理过的容器直接跳过，避免重复包裹和重复插入图注
      if ($entry.data('imagesEnhanced')) return;
      $entry.data('imagesEnhanced', true);

      $entry.find('img').each(function(){
        if ($(this).parent().hasClass('fancybox') || $(this).parent().is('a')) return;

        var alt = this.alt;

        if (alt) $(this).after('<span class="caption">' + alt + '</span>');

        $(this).wrap('<a href="' + this.src + '" data-fancybox=\"gallery\" data-caption="' + alt + '"></a>')
      });

      $entry.find('.fancybox').each(function(){
        $(this).attr('rel', 'article' + i);
      });
    });

    if ($.fancybox){
      $('.fancybox').fancybox();
    }
  };

  enhanceArticleImages();

  // 供 pjax.js 在换页后调用
  window.EnhanceArticleImages = enhanceArticleImages;

  // Mobile nav
  var $container = $('#container'),
    isMobileNavAnim = false,
    mobileNavAnimDuration = 200;

  var startMobileNavAnim = function(){
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function(){
    setTimeout(function(){
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  }

  $('#main-nav-toggle').on('click', function(){
    if (isMobileNavAnim) return;

    startMobileNavAnim();
    $container.toggleClass('mobile-nav-on');
    $(this).attr('aria-expanded', $container.hasClass('mobile-nav-on') ? 'true' : 'false');
    stopMobileNavAnim();
  });

  $('#wrap').on('click', function(){
    if (isMobileNavAnim || !$container.hasClass('mobile-nav-on')) return;

    $container.removeClass('mobile-nav-on');
  });
})(jQuery);