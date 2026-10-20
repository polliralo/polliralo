// Small building blocks shared by the sections.

import { cx, html } from '../lib/html.mjs';
import { icon, mark } from '../lib/icons.mjs';

// A link styled as a button. Variants: primary (navy), secondary (outline),
// accent (cyan, on navy) and inverse (outline, on navy). Sizes: sm, lg.
export function Button({ href, label, icon: iconName, variant = 'primary', size, external = false, className }) {
  const target = external ? html` target="_blank" rel="noopener"` : '';
  return html`<a class="${cx('btn', `btn--${variant}`, size && `btn--${size}`, className)}" href="${href}"${target}>${iconName ? icon(iconName) : ''}<span>${label}</span></a>`;
}

export function Logo({ name, variant = 'solid', href = '#top' }) {
  return html`<a class="${cx('logo', variant === 'inverse' && 'logo--inverse')}" href="${href}">${mark(variant)}<span class="logo__word">${name}</span></a>`;
}

// The small pill label above a title, with the cyan status dot of the logo.
export function Eyebrow({ text, inverse = false }) {
  return html`<p class="${cx('eyebrow', inverse && 'eyebrow--inverse')}">${text}</p>`;
}

// A title from content.mjs: a plain string, or { lead, accent } with the
// accent words set in blue.
export function titleText(title) {
  return typeof title === 'string' ? title : html`${title.lead} <span class="accent">${title.accent}</span>`;
}

// The href for a contact detail marked `link: 'call' | 'whatsapp'` in content.mjs.
export const detailHref = (links, link) => (link === 'call' ? links.call : links.whatsapp);
