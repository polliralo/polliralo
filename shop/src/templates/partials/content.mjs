// Shared pieces for the content pages (about, contact, size guide, privacy,
// shipping and returns, 404). Owned by the content area; styles live in
// site/assets/css/pages/content.css.

import { esc, breadcrumbs, icon } from '../../../site/assets/js/lib/render.js';
import { breadcrumbList } from './seo.mjs';
import { DEFAULT_OG_IMAGE } from '../../config.mjs';

export const OG_DEFAULT = {
  ogImage: DEFAULT_OG_IMAGE,
  ogImageAlt: 'MONO share card: two looks cut out on a warm canvas beside the words Modern menswear essentials',
};

/** Trail and matching BreadcrumbList for a content page: Home / {name}. */
export function trail(name, url) {
  const items = [{ name: 'Home', url: '/' }, { name, url }];
  return { items, html: breadcrumbs(items), jsonld: breadcrumbList(items) };
}

/**
 * The page head: breadcrumbs, eyebrow, h1 and lede. (Giant faint words are kept
 * for the home hero only; `ghost` is accepted and ignored.)
 * `title` is trusted HTML (it may hold an <em>); everything else is escaped.
 */
export function head({ crumbs = '', eyebrow, title, lede, ghost, meta = '', id = 'ct-title' }) {
  return `<section class="ct-hero" aria-labelledby="${id}">
  <div class="wrap page-head ct-head">
    ${crumbs}
    <div class="ct-head-body">
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <h1 id="${id}">${title}</h1>
      ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
      ${meta}
    </div>
  </div>
</section>`;
}

/** "On this page" index for long pages; items are [{ id, label }]. */
export function pageIndex(items, { label = 'On this page' } = {}) {
  return `<nav class="ct-index" aria-label="${esc(label)}">
  <p class="label ct-index-title">${esc(label)}</p>
  <ol role="list">${items.map((it, i) => `<li><a href="#${esc(it.id)}"><span class="ct-index-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${esc(it.label)}</a></li>`).join('')}</ol>
</nav>`;
}

/** A row of onward links: [{ href, label, note }]. */
export function onward(links, { title = 'Keep going', id = 'ct-onward' } = {}) {
  return `<section class="wrap ct-onward" aria-labelledby="${id}">
  <h2 class="label ct-onward-title" id="${id}">${esc(title)}</h2>
  <ul class="ct-onward-list" role="list">
    ${links.map((l) => `<li><a class="ct-onward-link" href="${esc(l.href)}"><span class="ct-onward-name">${esc(l.label)}</span>${l.note ? `<span class="ct-onward-note">${esc(l.note)}</span>` : ''}${icon('arrow', { size: 20 })}</a></li>`).join('')}
  </ul>
</section>`;
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/** 12 -> "twelve" (falls back to digits above twenty). */
export const numberWord = (n) => WORDS[n] ?? String(n);
export const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
