/* 为静态资源提供一个「每次构建固定、构建之间变化」的版本号。
 * 用于给 css/js 加 ?v= 后缀，让部署后浏览器不再沿用旧缓存。
 * 在 Hexo 初始化时求值一次，因此全站所有页面共用同一个值，
 * 同一文件不会因为版本号不同而被重复下载。
 */
const ASSET_VERSION = Date.now().toString(36);

hexo.extend.helper.register('asset_version', function () {
  return ASSET_VERSION;
});
