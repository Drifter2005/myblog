/* 静态资源版本号 —— 按文件内容哈希。
 *
 * 之前用 Date.now()：每次构建全变，Qexo 每保存一次全站 235KB CSS/JS
 * 缓存全部失效，访客反复全量重下（包括永远不变的 jQuery）。
 * 内容哈希只让真正改动过的文件换 URL。
 *
 * style.css 由 styl 编译而来，源文件树哈希近似其内容哈希 ——
 * 任何 .styl 变了 style.css 就变，语义正确。
 */
'use strict';

const { createHash } = require('crypto');
const { readFileSync, readdirSync, statSync, existsSync } = require('fs');
const { join } = require('path');

const cache = new Map();

function hashFile(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex').slice(0, 10);
}

function hashTree(dir) {
  const h = createHash('md5');
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else h.update(readFileSync(p));
    }
  };
  walk(dir);
  return h.digest('hex').slice(0, 10);
}

hexo.extend.helper.register('asset_version', function (relPath) {
  const key = relPath || '__site__';
  if (cache.has(key)) return cache.get(key);

  let version;
  try {
    if (relPath === 'css/style.css') {
      // 编译产物：哈希整个 styl 源码树
      version = hashTree(join(hexo.theme_dir, 'source', 'css'));
    } else if (relPath) {
      const candidates = [
        join(hexo.theme_dir, 'source', relPath),
        join(hexo.source_dir, relPath),
      ];
      const found = candidates.find((p) => existsSync(p));
      version = found ? hashFile(found) : 'na';
    } else {
      version = 'na';
    }
  } catch (e) {
    version = 'na';
  }

  cache.set(key, version);
  return version;
});
