// The frame around every page: <head>, announcement bar, header, footer and
// the three shared dialogs (menu, search, bag). Page templates return their
// <main> content plus metadata; build.mjs wraps it with layout().

import { esc, icon } from '../../site/assets/js/lib/render.js';
import { SITE_URL, SITE_NAME, TAGLINE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, THEME_COLOR } from '../config.mjs';

export const absolute = (path) => (SITE_URL ? SITE_URL + path : path);

const FONT_PRELOADS = ['jost-400', 'jost-500', 'jost-600'];

// Chrome prerenders product pages on hover so the image morph starts instantly.
const SPECULATION = JSON.stringify({
  prerender: [{ where: { href_matches: '/products/*' }, eagerness: 'moderate' }],
  prefetch: [{ where: { href_matches: '/collections/*' }, eagerness: 'moderate' }],
});

// Names the one morphing image at navigation time: product card -> product
// page and back (shop/docs/research/motion.md, section 2). Classic inline
// script because pagereveal fires before the first render.
const VT_SCRIPT = `(function(){var N='product-media',K='mono:vt-from';function pdp(p){return /^\\/products\\/[^/]+\\/?$/.test(p)}function slug(p){return p.split('/').filter(Boolean)[1]}function seen(el){var r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}function card(s){return document.querySelector('[data-slug="'+s+'"] [data-vt-media]')}
addEventListener('pageswap',function(e){try{sessionStorage.setItem(K,location.pathname)}catch(x){}if(!e.viewTransition||!e.activation)return;var to=new URL(e.activation.entry.url).pathname,el=null;if(pdp(to))el=card(slug(to));else if(pdp(location.pathname))el=document.getElementById('pdp-media');if(!el||!seen(el))return;el.style.viewTransitionName=N;e.viewTransition.finished.finally(function(){el.style.viewTransitionName=''})});
addEventListener('pagereveal',function(e){var vt=e.viewTransition;if(!vt)return;var from=null;try{from=window.navigation&&navigation.activation&&navigation.activation.from?new URL(navigation.activation.from.url).pathname:sessionStorage.getItem(K)}catch(x){}var el=null;if(pdp(location.pathname))el=document.getElementById('pdp-media');else if(from&&pdp(from)){var c=card(slug(from));if(c&&seen(c))el=c}if(el){el.style.viewTransitionName=N;vt.ready.finally(function(){el.style.viewTransitionName=''})}function skip(){vt.skipTransition()}addEventListener('pointerdown',skip,{once:true});addEventListener('keydown',skip,{once:true});vt.finished.finally(function(){removeEventListener('pointerdown',skip);removeEventListener('keydown',skip)})})})();`;

/**
 * layout({
 *   path, title, description, content,
 *   css: ['home'], js: ['home'],        // assets/css/pages/<name>.css, assets/js/pages/<name>.js
 *   jsonld: [object, ...], noindex, ogImage, ogType, preload: ['<link ...>'],
 *   bodyClass, categories, activeCategory, fullTitle, ogImageAlt,
 *   robots: 'noindex, nofollow'   // only used with noindex; default 'noindex'
 * })
 */
export function layout(page) {
  const {
    path, title, description = DEFAULT_DESCRIPTION, content,
    css = [], js = [], jsonld = [], noindex = false, ogImage = DEFAULT_OG_IMAGE, ogType = 'website',
    preload = [], bodyClass = '', categories = [], activeCategory = null, fullTitle = null, robots = null,
    ogImageAlt = 'MONO, modern menswear essentials',
  } = page;
  const docTitle = fullTitle ?? (title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Premium Men's Fashion and Accessories`);
  const canonical = absolute(path);
  const og = ogImage.startsWith('http') ? ogImage : absolute(ogImage);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(docTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? `<meta name="robots" content="${robots ?? 'noindex'}">` : `<link rel="canonical" href="${esc(canonical)}">`}
<meta name="theme-color" content="${THEME_COLOR}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:type" content="${esc(ogType)}">
<meta property="og:title" content="${esc(title ?? SITE_NAME)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${esc(og)}">
${ogImage.includes('/og/') ? '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' : ''}<meta property="og:image:alt" content="${esc(ogImageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image:alt" content="${esc(ogImageAlt)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>${VT_SCRIPT}</script>
<script>(function(d){d.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('motion');setTimeout(function(){if(!d.classList.contains('store-ready'))d.classList.remove('motion')},4000)})(document.documentElement)</script>
${FONT_PRELOADS.map((f) => `<link rel="preload" href="/assets/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n')}
${preload.join('\n')}
<link rel="stylesheet" href="/assets/css/base.css">
${css.map((c) => `<link rel="stylesheet" href="/assets/css/pages/${c}.css">`).join('\n')}
<script type="speculationrules">${SPECULATION}</script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
<script type="module" src="/assets/js/app.js"></script>
${js.map((j) => `<script type="module" src="/assets/js/pages/${j}.js"></script>`).join('\n')}
</head>
<body class="${esc(bodyClass)}">
<a class="skip-link" href="#main">Skip to content</a>
<aside class="announce" aria-label="Demo store notice"><p><span class="announce-long">Portfolio demo: prices and stock are illustrative, and no real orders are placed.</span><span class="announce-short">Portfolio demo &middot; No real orders</span> <a href="/about/#demo">How it works</a></p></aside>
${header(categories, activeCategory, path)}
<main id="main">
${content}
</main>
${footer(categories)}
${dialogs(categories)}
</body>
</html>
`;
}

function header(categories, active, path) {
  return `<header class="site-header">
  <div class="wrap header-inner">
    <button class="icon-btn menu-btn" type="button" data-open-menu aria-label="Open menu" aria-haspopup="dialog">${icon('menu', { size: 22 })}</button>
    <a class="logo" href="/" aria-label="MONO home"${path === '/' ? ' aria-current="page"' : ''}>Mono</a>
    <nav class="main-nav" aria-label="Main">
      <ul>${categories.map((c) => `<li><a href="/collections/${c.slug}/"${c.slug === active ? ' aria-current="page"' : ''}>${esc(c.name)}</a></li>`).join('')}</ul>
    </nav>
    <div class="header-tools">
      <a class="tool-btn" href="/search/" data-open-search aria-haspopup="dialog" aria-label="Search">${icon('search', { size: 19 })}<span class="tool-text">Search</span></a>
      <a class="tool-btn" href="/cart/" data-open-cart aria-haspopup="dialog" aria-label="Bag">${icon('bag', { size: 19 })}<span class="tool-text">Bag</span><span class="bag-count" data-bag-count data-count="0" aria-hidden="true">0</span></a>
    </div>
  </div>
</header>`;
}

function footer(categories) {
  const year = new Date().getFullYear();
  return `<footer class="site-footer on-dark">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="logo" href="/">Mono</a>
        <p>${esc(TAGLINE)} Shirts, tees, polos and the few accessories that finish them.</p>
      </div>
      <nav class="footer-col" aria-labelledby="f-shop"><h2 id="f-shop">Shop</h2><ul>
        ${categories.map((c) => `<li><a href="/collections/${c.slug}/">${esc(c.name)}</a></li>`).join('')}
        <li><a href="/collections/">Shop all</a></li>
      </ul></nav>
      <nav class="footer-col" aria-labelledby="f-help"><h2 id="f-help">Help</h2><ul>
        <li><a href="/size-guide/">Size guide</a></li>
        <li><a href="/shipping-returns/">Shipping and returns</a></li>
        <li><a href="/contact/">Contact</a></li>
        <li><a href="/cart/">Your bag</a></li>
      </ul></nav>
      <nav class="footer-col" aria-labelledby="f-about"><h2 id="f-about">MONO</h2><ul>
        <li><a href="/about/">About</a></li>
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/admin/">Store admin (demo)</a></li>
      </ul></nav>
    </div>
    <div class="footer-note" id="demo-note">
      <p>MONO is a fictional brand made as a portfolio demo. The products, prices and stock are not real, no payment is ever taken and no orders are delivered.</p>
      <p>&copy; ${year} MONO demo</p>
    </div>
    <p class="footer-word" aria-hidden="true" data-word="Mono"></p>
  </div>
</footer>`;
}

function dialogs(categories) {
  return `<dialog class="drawer from-left menu-drawer" id="menu-drawer" aria-label="Menu">
  <div class="drawer-head"><a class="logo" href="/">Mono</a><button class="icon-btn" type="button" data-close-dialog aria-label="Close menu">${icon('close', { size: 22 })}</button></div>
  <div class="drawer-body">
    <nav aria-label="Menu"><ul class="menu-list">
      ${categories.map((c) => `<li><a href="/collections/${c.slug}/">${esc(c.name)}${icon('arrow', { size: 18 })}</a></li>`).join('')}
    </ul>
    <ul class="menu-sub">
      <li><a href="/collections/">Shop all</a></li>
      <li><a href="/about/">About</a></li>
      <li><a href="/size-guide/">Size guide</a></li>
      <li><a href="/shipping-returns/">Shipping and returns</a></li>
      <li><a href="/contact/">Contact</a></li>
    </ul></nav>
  </div>
</dialog>
<dialog class="search-dialog" id="search-dialog" aria-label="Search">
  <div class="wrap">
    <form class="search-bar" action="/search/" method="get" role="search">
      <label class="visually-hidden" for="search-q">Search products</label>
      ${icon('search', { size: 24 })}
      <input id="search-q" name="q" type="search" placeholder="Search shirts, watches, olive..." autocomplete="off" enterkeyhint="search">
      <button class="visually-hidden" type="submit">Search</button>
      <button class="icon-btn" type="button" data-close-dialog aria-label="Close search">${icon('close', { size: 22 })}</button>
    </form>
    <div class="search-results" data-search-results aria-live="polite"></div>
  </div>
</dialog>
<dialog class="drawer cart-drawer" id="cart-drawer" aria-labelledby="cart-drawer-title">
  <div class="drawer-head"><h2 id="cart-drawer-title">Your bag <span class="muted small tabular" data-drawer-count></span></h2><button class="icon-btn" type="button" data-close-dialog aria-label="Close bag">${icon('close', { size: 22 })}</button></div>
  <div class="drawer-body">
    <div class="empty" data-drawer-empty hidden>
      <h3>Your bag is empty</h3>
      <p class="muted">Start with a shirt or a polo, then finish the outfit.</p>
      <a class="btn" href="/collections/">Shop all</a>
    </div>
    <ul class="lines" role="list" data-drawer-lines></ul>
  </div>
  <div class="drawer-foot" data-drawer-foot hidden>
    <div data-drawer-summary></div>
    <p class="notice is-error" data-drawer-blocked hidden>Some items have changed. Open your bag to update them before checkout.</p>
    <a class="btn btn-block" href="/checkout/" data-drawer-checkout>Checkout</a>
    <a class="btn btn-ghost btn-block" href="/cart/">View bag</a>
  </div>
</dialog>`;
}
