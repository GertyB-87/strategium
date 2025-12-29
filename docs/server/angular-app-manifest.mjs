
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/strategium/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/strategium"
  },
  {
    "renderMode": 2,
    "route": "/strategium/tabletop-match"
  },
  {
    "renderMode": 2,
    "route": "/strategium/home"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 9844, hash: 'ab38eb3695b422781eb786800a5f0c25e1e1a5cb0eff0a7283595c82cd6d54f8', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 2219, hash: '3ac6a4338fa6ccdb8fa7b84a818e5e1ba9dbae41bc8aaa28b5b6114e2baca088', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'tabletop-match/index.html': {size: 12399, hash: 'a6fac406a595250c57fd4c1410d3b3d149c5c36e831e39d4f70fe297a4cddcda', text: () => import('./assets-chunks/tabletop-match_index_html.mjs').then(m => m.default)},
    'index.html': {size: 12422, hash: 'be496c90602f5887e89aec4599c853d01e642b9b1038cb4e9429c6e0f310027f', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 12422, hash: 'be496c90602f5887e89aec4599c853d01e642b9b1038cb4e9429c6e0f310027f', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'styles-MMQYWLFA.css': {size: 8481, hash: 'K/Yihk53Pis', text: () => import('./assets-chunks/styles-MMQYWLFA_css.mjs').then(m => m.default)}
  },
};
