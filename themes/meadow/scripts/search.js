'use strict';
hexo.extend.generator.register('meadow-search', function (locals) {
  const records = locals.posts.sort('date', -1).map(post => ({
    title: post.title,
    url: this.config.root + post.path.replace(/index\.html$/, ''),
    excerpt: String(post.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000),
    tags: post.tags.map(tag => tag.name)
  }));
  return {path: 'search.json', data: JSON.stringify(records)};
});
