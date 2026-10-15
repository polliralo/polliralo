// Pure helpers for the bag, checkout and order confirmation pages (owned by
// the checkout area). No window or document at import time, so the Node
// build can import it to pre-render the same markup the browser renders.

import { esc, money, picture } from './render.js';
import { SHIPPING_OPTIONS, shippingCost, shippingOption } from './pricing.js';

/* ----- Countries and their address rules -----
   Labels and postcode checks change with the country, so a Canadian or UK
   shopper is never asked for a "ZIP code". Kept short on purpose: this is a
   demo store and nothing ships. */
const DIGITS = (n) => new RegExp(`^\\d{${n}}$`);
export const COUNTRIES = [
  { code: 'AU', name: 'Australia', region: 'State or territory', postcode: { label: 'Postcode', pattern: DIGITS(4), example: '2000', numeric: true } },
  { code: 'AT', name: 'Austria', region: 'Region', postcode: { label: 'Postcode', pattern: DIGITS(4), example: '1010', numeric: true } },
  { code: 'BD', name: 'Bangladesh', region: 'Division', postcode: { label: 'Postcode', pattern: DIGITS(4), example: '1205', numeric: true } },
  { code: 'BE', name: 'Belgium', region: 'Province', postcode: { label: 'Postcode', pattern: DIGITS(4), example: '1000', numeric: true } },
  { code: 'CA', name: 'Canada', region: 'Province or territory', postcode: { label: 'Postal code', pattern: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i, example: 'K1A 0B1' } },
  { code: 'DK', name: 'Denmark', region: 'Region', postcode: { label: 'Postcode', pattern: DIGITS(4), example: '1050', numeric: true } },
  { code: 'FR', name: 'France', region: 'Region', postcode: { label: 'Postcode', pattern: DIGITS(5), example: '75001', numeric: true } },
  { code: 'DE', name: 'Germany', region: 'State', postcode: { label: 'Postcode', pattern: DIGITS(5), example: '10115', numeric: true } },
  { code: 'IN', name: 'India', region: 'State', postcode: { label: 'PIN code', pattern: /^\d{3} ?\d{3}$/, example: '110001', numeric: true } },
  { code: 'IE', name: 'Ireland', region: 'County', postcode: { label: 'Eircode', pattern: /^[AC-FHKNPRTV-Y]\d[\dW] ?[0-9AC-FHKNPRTV-Y]{4}$/i, example: 'D02 X285' } },
  { code: 'IT', name: 'Italy', region: 'Province', postcode: { label: 'Postcode', pattern: DIGITS(5), example: '00118', numeric: true } },
  { code: 'JP', name: 'Japan', region: 'Prefecture', postcode: { label: 'Postcode', pattern: /^\d{3}-?\d{4}$/, example: '100-0001' } },
  { code: 'NL', name: 'Netherlands', region: 'Province', postcode: { label: 'Postcode', pattern: /^\d{4} ?[A-Z]{2}$/i, example: '1011 AB' } },
  { code: 'NZ', name: 'New Zealand', region: 'Region', postcode: { label: 'Postcode', pattern: DIGITS(4), example: '6011', numeric: true } },
  { code: 'NO', name: 'Norway', region: 'County', postcode: { label: 'Postcode', pattern: DIGITS(4), example: '0150', numeric: true } },
  { code: 'PT', name: 'Portugal', region: 'District', postcode: { label: 'Postcode', pattern: /^\d{4}-?\d{3}$/, example: '1100-148' } },
  { code: 'SG', name: 'Singapore', region: 'Region', postcode: { label: 'Postal code', pattern: DIGITS(6), example: '018956', numeric: true } },
  { code: 'ES', name: 'Spain', region: 'Province', postcode: { label: 'Postcode', pattern: DIGITS(5), example: '28013', numeric: true } },
  { code: 'SE', name: 'Sweden', region: 'County', postcode: { label: 'Postcode', pattern: /^\d{3} ?\d{2}$/, example: '111 52' } },
  { code: 'CH', name: 'Switzerland', region: 'Canton', postcode: { label: 'Postcode', pattern: DIGITS(4), example: '8001', numeric: true } },
  { code: 'GB', name: 'United Kingdom', region: 'County', postcode: { label: 'Postcode', pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, example: 'SW1A 1AA' } },
  { code: 'US', name: 'United States', region: 'State', postcode: { label: 'ZIP code', pattern: /^\d{5}(?:[- ]?\d{4})?$/, example: '10001', numeric: true } },
];
export const DEFAULT_COUNTRY = 'US';
export const country = (code) => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY);

/** <option> list for the country select. */
export function countryOptions(selected = DEFAULT_COUNTRY) {
  return COUNTRIES.map((c) => `<option value="${c.code}"${c.code === selected ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
}

/* ----- Delivery estimates -----
   Baymard: show a date, not only a speed. The working-day range comes from
   the option's own ETA text ("3 to 5 working days"), so the numbers live in
   one place (lib/pricing.js). Dates are estimates and labelled so. */
export function etaRange(option) {
  const nums = String(option?.eta ?? '').match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return [3, 5];
  return [nums[0], nums[1] ?? nums[0]];
}

export function addWorkingDays(from, days) {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return d;
}

export const formatDay = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** "Tue, Oct 20 to Thu, Oct 22" for a shipping option, counted from `from`. */
export function arrivalText(optionOrId, from = new Date()) {
  const option = typeof optionOrId === 'string' ? shippingOption(optionOrId) : optionOrId;
  const [min, max] = etaRange(option);
  const a = formatDay(addWorkingDays(from, min));
  const b = formatDay(addWorkingDays(from, max));
  return a === b ? a : `${a} to ${b}`;
}

/** "Free" or "$6.00" for an option at this subtotal. */
export function shippingPriceText(id, subtotal) {
  const cost = shippingCost(id, subtotal);
  return cost === 0 && subtotal > 0 ? 'Free' : money(cost || shippingOption(id).price, { cents: true });
}

/** A short line under an option's name, for example "Free on orders of $150 or more (demo rate)". */
export function shippingRule(option) {
  return option.freeOver != null ? `Free on orders of ${money(option.freeOver)} or more` : 'Flat demo rate';
}

export { SHIPPING_OPTIONS };

/* ----- Read-only order lines (checkout summary and confirmation) ----- */

/**
 * item: { name, optionText, qty, lineTotal, imageKey, url }
 * Compact, not interactive except the product link.
 */
export function summaryLineHTML(item, { imageSizes = '64px' } = {}) {
  const name = esc(item.name);
  const qty = Number(item.qty) || 0;
  return `<li class="co-sline">`
    + `<span class="co-sline-media">${item.imageKey ? picture(item.imageKey, { alt: '', sizes: imageSizes }) : ''}</span>`
    + `<span class="co-sline-text">`
    + `<span class="co-sline-name">${item.url ? `<a href="${esc(item.url)}">${name}</a>` : name}</span>`
    + `<span class="co-sline-meta">${item.optionText ? `${esc(item.optionText)} · ` : ''}Qty ${qty}</span>`
    + (item.note ? `<span class="co-sline-note">${esc(item.note)}</span>` : '')
    + `</span>`
    + `<span class="co-sline-price">${money(item.lineTotal, { cents: true })}</span>`
    + `</li>`;
}

/** "Size: M" or the colour name for one-size products, like the bag lines. */
export function optionText(product, variant) {
  if (!product || !variant) return '';
  if (product.option?.type === 'none') return product.colour?.name ?? 'One size';
  return `${product.option?.label ?? 'Option'}: ${variant.label}`;
}

/** Text for an item saved in an order record. */
export function orderItemOptionText(item) {
  const value = item.variantLabel ?? '';
  const label = item.optionLabel ?? '';
  if (!value) return '';
  if (!label || label === value || /one size/i.test(label)) return value;
  return `${label}: ${value}`;
}

/** Subtotal, delivery, total rows. */
export function totalsHTML({ subtotal, shipping, total, shippingName = 'Delivery', pending = false }) {
  const ship = pending ? '·' : shipping === 0 && subtotal > 0 ? 'Free' : money(shipping, { cents: true });
  return `<div class="sum-row"><span>Subtotal</span><span>${money(subtotal, { cents: true })}</span></div>`
    + `<div class="sum-row"><span>${esc(shippingName)}</span><span>${ship}</span></div>`
    + `<div class="sum-row total co-total"><span>Total</span><span>${money(total, { cents: true })}</span></div>`;
}
