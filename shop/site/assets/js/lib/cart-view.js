// Bag line markup and controls, shared by the cart drawer and the /cart/ page.

import * as cart from './cart.js';
import { esc, money, picture, productUrl, icon } from './render.js';
import { toast, announce, enhance } from './ui.js';
import { totals, freeShippingProgress } from './pricing.js';

const ISSUE_TEXT = {
  missing: 'No longer available. Remove it to continue.',
  'sold-out': 'This option has just sold out. Remove it to continue.',
  limited: 'Only {n} left, so the quantity will be lowered.',
};

function optionLabel(line) {
  const p = line.product;
  if (!p || !line.variantData) return '';
  if (p.option?.type === 'none') return p.colour?.name ?? '';
  return `${p.option?.label ?? 'Option'}: ${line.variantData.label}`;
}

export function lineHTML(line, { compact = false } = {}) {
  const p = line.product;
  const name = p ? esc(p.name) : 'Unavailable item';
  const img = p?.images?.[0];
  const issue = line.issue ? `<p class="line-issue">${esc(ISSUE_TEXT[line.issue].replace('{n}', line.stock))}</p>` : '';
  const max = Math.min(line.stock, cart.MAX_QTY);
  const stepper = line.issue === 'missing' || line.issue === 'sold-out' ? '' : `
    <div class="stepper" role="group" aria-label="Quantity for ${name}">
      <button type="button" data-qty="-1" aria-label="Decrease quantity" ${line.qty <= 1 ? 'disabled' : ''}>${icon('minus', { size: 14 })}</button>
      <output aria-live="polite">${line.qty}</output>
      <button type="button" data-qty="1" aria-label="Increase quantity" ${line.qty >= max ? 'disabled' : ''}>${icon('plus', { size: 14 })}</button>
    </div>`;
  return `<li class="line${compact ? ' line-compact' : ''}" data-line data-slug="${esc(line.slug)}" data-variant="${esc(line.variant)}">
    <a class="line-media" href="${p ? productUrl(p) : '#'}" tabindex="-1" aria-hidden="true">${img ? picture(img.key, { alt: '', sizes: '88px' }) : ''}</a>
    <div>
      <p class="line-name">${p ? `<a href="${productUrl(p)}">${name}</a>` : name}</p>
      <p class="line-meta">${esc(optionLabel(line))}${p ? ` · ${money(line.unitPrice)}` : ''}</p>
      ${issue}
      <div class="line-controls">${stepper}<button type="button" class="line-remove" data-remove>Remove</button></div>
    </div>
    <p class="line-price">${line.lineTotal ? money(line.lineTotal, { cents: true }) : ''}</p>
  </li>`;
}

/** Wire +/- and remove buttons inside a container (event delegation, once). */
export function bindLineControls(container) {
  if (container._bound) return;
  container._bound = true;
  container.addEventListener('click', (e) => {
    const row = e.target.closest('[data-line]');
    if (!row) return;
    const { slug, variant } = row.dataset;
    const step = e.target.closest('[data-qty]');
    if (step) {
      const item = cart.getItems().find((i) => i.slug === slug && i.variant === variant);
      if (item) {
        cart.setQty(slug, variant, item.qty + Number(step.dataset.qty));
        announce(`Quantity updated to ${Math.max(0, item.qty + Number(step.dataset.qty))}`);
      }
      return;
    }
    if (e.target.closest('[data-remove]')) {
      const item = cart.getItems().find((i) => i.slug === slug && i.variant === variant);
      cart.remove(slug, variant);
      const name = row.querySelector('.line-name')?.textContent?.trim() ?? 'Item';
      announce(`${name} removed from your bag`);
      if (item) toast({ message: `${name} removed`, action: { label: 'Undo', onClick: () => cart.restore(item) } });
    }
  });
}

/** Summary rows: subtotal, delivery, total. */
export function summaryHTML({ shippingId = 'standard', showShippingNote = true } = {}) {
  const sub = cart.subtotal();
  const t = totals(sub, shippingId);
  const free = freeShippingProgress(sub);
  const meter = showShippingNote && sub > 0
    ? `<div class="ship-meter" style="--p:${free.progress.toFixed(3)}"><span>${free.reached ? 'Standard delivery is free on this order (demo rate).' : `${money(free.gap, { cents: true })} away from free standard delivery (demo rate).`}</span><div class="bar"><i></i></div></div>`
    : '';
  return `${meter}
    <div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal, { cents: true })}</span></div>
    <div class="sum-row muted small"><span>Delivery</span><span>${t.shipping === 0 && sub > 0 ? 'Free' : sub > 0 ? `from ${money(t.shipping, { cents: true })}` : '·'}</span></div>`;
}

/** Render a full list into a <ul>. Returns the lines used. */
export function renderLines(listEl, opts) {
  const ls = cart.lines();
  listEl.innerHTML = ls.map((l) => lineHTML(l, opts)).join('');
  enhance(listEl);
  return ls;
}
