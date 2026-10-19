// The demo admin: /admin/ (dashboard), /admin/products/ and /admin/orders/.
// The server markup is the frame (honest banner, section nav, heading) with a
// loading state and a no-JS message. assets/js/pages/admin.js renders each view
// from the browser store (localStorage over the seed catalogue).

import { BANNER, navHTML } from '../../../site/assets/js/lib/admin-view.js';

const PAGES = {
  dashboard: {
    title: 'Admin (Demo)',
    description: 'Demo admin for the MONO demo store: catalogue and order numbers saved in this browser only.',
    eyebrow: 'Dashboard',
    h1: 'Admin <em>(Demo)</em>',
    ghost: 'Overview',
    lede: 'A quick read of the demo catalogue and the demo orders saved in this browser.',
  },
  products: {
    title: 'Products | Admin (Demo)',
    description: 'Demo admin for MONO products: add, edit, hide and remove demo products in this browser only.',
    eyebrow: 'Admin (Demo)',
    h1: 'Products',
    ghost: 'Catalogue',
    lede: 'Add, edit, hide or remove products. Changes show in the store in this browser straight away.',
  },
  orders: {
    title: 'Orders | Admin (Demo)',
    description: 'Demo admin for MONO orders placed through the demo checkout in this browser only.',
    eyebrow: 'Admin (Demo)',
    h1: 'Orders',
    ghost: 'Orders',
    lede: 'Orders placed through the demo checkout in this browser. Nothing was charged or shipped.',
  },
};

export default function render(ctx, route) {
  const view = PAGES[route.params?.view] ? route.params.view : 'dashboard';
  const page = PAGES[view];
  // Data for the page script: the shipped product slugs (to tell demo products
  // from ones added in this browser) and, for the product editor, every image
  // in the manifest with whether it is a cut-out.
  const data = { seedSlugs: ctx.products.map((p) => p.slug) };
  if (view === 'products') data.media = Object.entries(ctx.media).map(([key, m]) => ({ key, alpha: Boolean(m.alpha) }));
  const media = `\n<script type="application/json" id="adm-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

  const content = `<div class="adm" data-admin data-view="${view}">
  <div class="wrap">
    <p class="adm-banner"><strong class="adm-banner-label">Demo admin.</strong> <span>${BANNER}</span></p>
    <div class="adm-shell">
      ${navHTML(view)}
      <div class="adm-main">
        <header class="adm-head">
          <p class="eyebrow">${page.eyebrow}</p>
          <h1>${page.h1}</h1>
          <p class="adm-lede">${page.lede}</p>
        </header>
        <div class="adm-view" data-admin-view aria-busy="true">
          <div class="adm-loading" data-admin-loading>
            <span class="adm-loading-bar" aria-hidden="true"></span>
            <p class="label">Loading the demo data</p>
          </div>
          <noscript><p class="notice">The demo admin needs JavaScript: it reads and saves the demo catalogue and orders in this browser. Turn JavaScript on to use it.</p></noscript>
        </div>
      </div>
    </div>
  </div>
</div>${media}`;

  return {
    title: page.title,
    description: page.description,
    content,
    css: ['admin'],
    js: ['admin'],
    noindex: true,
    robots: 'noindex, nofollow',
    bodyClass: 'adm-page',
  };
}
