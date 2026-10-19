// The product editor for the MONO demo admin: a right-hand drawer <dialog>
// with a form for every product field, row editors for options and images,
// inline validation with an error summary, and a "discard changes?" check.
// Browser only (uses document inside functions; nothing runs at import time).

import { esc, picture, icon } from './render.js';
import { $, $$, enhance, announce, reducedMotion } from './ui.js';
import { slugify, SLUG_RE, stable } from './admin-view.js';

const OPTION_TYPES = [
  { id: 'size', name: 'Size', label: 'Size', preset: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'waist', name: 'Waist', label: 'Waist', preset: ['32', '34', '36', '38'] },
  { id: 'none', name: 'One size', label: 'One size', preset: ['OS'] },
];
const HEX_RE = /^#[0-9a-f]{6}$/i;
const SKU_RE = /^[A-Z0-9][A-Z0-9-]{1,31}$/i;
const CODE_RE = /^[A-Za-z0-9]{1,8}$/;
const DEFAULT_HEX = '#5C5F45';

let uidCounter = 0;
const nextUid = () => String(++uidCounter);
const clone = (v) => JSON.parse(JSON.stringify(v));
const pad = (n) => String(n).padStart(2, '0');
const initialValue = (el) => (el.tagName === 'SELECT'
  ? ([...el.options].find((o) => o.defaultSelected)?.value ?? el.options[0]?.value ?? '')
  : el.defaultValue);

/**
 * Close with the drawer's exit motion. Unlike ui.js closeDialog, the fallback
 * timer is tied to this close only, so it can never shut a drawer that was
 * opened again in the meantime, and child animations do not end it early.
 */
function animateClose(dialog) {
  if (!dialog.open || dialog.classList.contains('is-closing')) return;
  if (reducedMotion()) { dialog.close(); return; }
  const token = (dialog._closeToken ?? 0) + 1;
  dialog._closeToken = token;
  dialog.classList.add('is-closing');
  const onEnd = (e) => { if (e.target === dialog) done(); };
  function done() {
    dialog.removeEventListener('animationend', onEnd);
    if (dialog._closeToken !== token) return;
    dialog._closeToken = token + 1;
    dialog.classList.remove('is-closing');
    if (dialog.open) dialog.close();
  }
  dialog.addEventListener('animationend', onEnd);
  setTimeout(done, 600);
}

/* ---------- Draft <-> product ---------- */

function draftFrom(product, { isNew }) {
  const p = product ?? {};
  const type = OPTION_TYPES.some((t) => t.id === p.option?.type) ? p.option.type : 'size';
  return {
    name: p.name ?? '',
    slug: p.slug ?? '',
    sku: p.sku ?? '',
    category: p.category ?? '',
    price: p.price != null ? String(p.price) : '',
    summary: p.summary ?? '',
    description: p.description ?? '',
    details: (p.details ?? []).join('\n'),
    colourName: p.colour?.name ?? '',
    colourHex: (p.colour?.hex ?? DEFAULT_HEX).toUpperCase(),
    accent: (p.accent ?? DEFAULT_HEX).toUpperCase(),
    optionType: type,
    optionLabel: p.option?.label ?? OPTION_TYPES.find((t) => t.id === type).label,
    variants: isNew
      ? OPTION_TYPES[0].preset.map((id) => ({ uid: nextUid(), id, label: id, stock: '0' }))
      : (p.variants ?? []).map((v) => ({ uid: nextUid(), id: v.id ?? '', label: v.label ?? '', stock: String(v.stock ?? 0) })),
    images: isNew
      ? [{ uid: nextUid(), key: '', alt: '', kind: 'cutout', view: 'Front' }]
      : (p.images ?? []).map((im) => ({ uid: nextUid(), key: im.key ?? '', alt: im.alt ?? '', kind: im.kind ?? 'photo', view: im.view ?? '' })),
    newArrival: Boolean(p.newArrival),
    featured: Boolean(p.featured),
    hidden: Boolean(p.hidden),
  };
}

const parsePrice = (raw) => {
  const s = String(raw ?? '').trim().replace(/^\$/, '').replace(/,/g, '');
  if (!s) return { empty: true };
  if (!/^\d+(\.\d+)?$/.test(s)) return { nan: true };
  const n = Number(s);
  return { n, decimals: (s.split('.')[1] ?? '').length };
};

function toProduct(d, base) {
  const p = base ? clone(base) : { group: null, completeTheLook: [] };
  delete p.custom;
  p.slug = d.slug;
  p.sku = d.sku.trim().toUpperCase();
  p.name = d.name.trim();
  p.category = d.category;
  p.price = Math.round(parsePrice(d.price).n * 100) / 100;
  p.colour = { name: d.colourName.trim(), hex: d.colourHex.trim().toUpperCase() };
  p.accent = d.accent.trim().toUpperCase();
  p.summary = d.summary.trim();
  p.description = d.description.trim();
  p.details = d.details.split('\n').map((s) => s.trim()).filter(Boolean);
  p.option = { type: d.optionType, label: d.optionLabel.trim() };
  p.variants = d.variants.map((v) => ({ id: v.id.trim(), label: v.label.trim(), stock: Number(v.stock) }));
  p.images = d.images.map((im) => ({ key: im.key, alt: im.alt.trim(), kind: im.kind, ...(im.view.trim() ? { view: im.view.trim() } : {}) }));
  p.featured = d.featured;
  p.newArrival = d.newArrival;
  if (d.hidden) p.hidden = true; else delete p.hidden;
  return p;
}

/* ---------- Validation (pure) ---------- */

/**
 * Returns [{ key, message, summary }]. key matches the data-key of the field
 * (or "variants" / "images" for the lists themselves).
 */
export function validateDraft(d, { products, originalSlug, isSeed, seedSlugs = [], autoSlug = false }) {
  const errors = [];
  const add = (key, message, summary = message) => errors.push({ key, message, summary });
  const others = products.filter((p) => p.slug !== originalSlug);

  const name = d.name.trim();
  if (!name) add('name', 'Enter a product name.');
  else if (name.length > 80) add('name', 'Keep the name to 80 characters or fewer.');

  if (!isSeed) {
    // A slug that is still made from the name needs no message of its own while the name is empty.
    if (!d.slug) { if (!(autoSlug && !name)) add('slug', 'Enter a slug for the product address.'); }
    else if (!SLUG_RE.test(d.slug)) add('slug', 'Use lowercase letters, numbers and single hyphens, for example olive-linen-shirt.');
    else if (others.some((p) => p.slug === d.slug)) add('slug', 'Another product already uses this slug.');
    else if (seedSlugs.includes(d.slug) && d.slug !== originalSlug) add('slug', 'This slug belongs to a demo product. Choose another.');
  }

  const sku = d.sku.trim();
  if (!sku) add('sku', 'Enter a SKU.');
  else if (!SKU_RE.test(sku)) add('sku', 'Use letters, numbers and hyphens, for example MONO-SH-03.');
  else if (others.some((p) => String(p.sku ?? '').toUpperCase() === sku.toUpperCase())) add('sku', 'Another product already uses this SKU.');

  if (!d.category) add('category', 'Choose a category.');

  const price = parsePrice(d.price);
  if (price.empty) add('price', 'Enter a price.');
  else if (price.nan) add('price', 'Enter the price as a number, for example 48 or 48.50.');
  else if (price.n <= 0) add('price', 'Enter a price above $0.');
  else if (price.n > 10000) add('price', 'Enter a price of $10,000 or less.');
  else if (price.decimals > 2) add('price', 'Use no more than two decimal places.');

  if (!d.summary.trim()) add('summary', 'Enter a one-line summary.');
  else if (d.summary.trim().length > 160) add('summary', 'Keep the summary to 160 characters or fewer.');
  if (!d.description.trim()) add('description', 'Enter a description.');

  if (!d.colourName.trim()) add('colourName', 'Enter a colour name.');
  if (!HEX_RE.test(d.colourHex.trim())) add('colourHex', 'Enter the swatch as a hex code, for example #5C5F45.');
  if (!HEX_RE.test(d.accent.trim())) add('accent', 'Enter the accent as a hex code, for example #5C5F45.');

  if (!d.optionLabel.trim()) add('optionLabel', 'Enter a label for the options, for example Size.');
  if (!d.variants.length) add('variants', 'Add at least one option.');
  const seenCodes = new Set();
  d.variants.forEach((v, i) => {
    const n = `Option ${i + 1}`;
    const code = v.id.trim();
    if (!code) add(`v:${v.uid}:id`, 'Enter a code.', `${n}: enter a code.`);
    else if (!CODE_RE.test(code)) add(`v:${v.uid}:id`, 'Use up to 8 letters or numbers.', `${n}: use up to 8 letters or numbers in the code.`);
    else if (seenCodes.has(code.toUpperCase())) add(`v:${v.uid}:id`, 'Each option needs its own code.', `${n}: each option needs its own code.`);
    seenCodes.add(code.toUpperCase());
    if (!v.label.trim()) add(`v:${v.uid}:label`, 'Enter a label.', `${n}: enter a label.`);
    const s = String(v.stock).trim();
    if (!/^\d+$/.test(s)) add(`v:${v.uid}:stock`, 'Enter a whole number, 0 or more.', `${n}: enter the stock as a whole number, 0 or more.`);
    else if (Number(s) > 9999) add(`v:${v.uid}:stock`, 'Enter 9,999 or less.', `${n}: enter a stock of 9,999 or less.`);
  });

  if (!d.images.length) add('images', 'Add at least one image.');
  d.images.forEach((im, i) => {
    const n = `Image ${i + 1}`;
    if (!im.key) add(`i:${im.uid}:key`, 'Choose an image file.', `${n}: choose an image file.`);
    if (!im.alt.trim()) add(`i:${im.uid}:alt`, 'Describe what the image shows.', `${n}: describe what the image shows.`);
  });
  return errors;
}

/* ---------- Markup ---------- */

function field({ key, label, hint = '', control, cls = '' }) {
  const hintId = hint ? `ed-${key}-hint` : '';
  return `<div class="field adm-field ${cls}" data-field="${key}"><label for="ed-${key}">${label}</label>`
    + control(hintId)
    + (hint ? `<p class="hint" id="${hintId}">${hint}</p>` : '')
    + `</div>`;
}

const describedBy = (id) => (id ? ` aria-describedby="${id}" data-desc="${id}"` : '');
const inputAttrs = (key, hintId, extra = '') => `class="input" id="ed-${key}" name="${key}" data-key="${key}"${describedBy(hintId)} ${extra}`;

function mediaOptions(media, selected) {
  const groups = [
    ['Cut-outs', (k) => k.startsWith('cut-')],
    ['Lifestyle', (k) => k.startsWith('life-')],
    ['Wide', (k) => k.startsWith('wide-')],
    ['Product photos', () => true],
  ];
  const used = new Set();
  let out = `<option value=""${selected ? '' : ' selected'}>Choose an image</option>`;
  for (const [name, test] of groups) {
    const keys = media.filter((m) => !used.has(m.key) && test(m.key));
    if (!keys.length) continue;
    keys.forEach((m) => used.add(m.key));
    out += `<optgroup label="${name}">${keys.map((m) => `<option value="${esc(m.key)}"${m.key === selected ? ' selected' : ''}>${esc(m.key)}</option>`).join('')}</optgroup>`;
  }
  return out;
}

function variantRowHTML(v, type) {
  const one = type === 'none';
  const ro = one ? ' readonly' : '';
  return `<li class="adm-vrow" data-vrow="${v.uid}">`
    + `<div class="field adm-vcell"><label class="visually-hidden" for="ed-v-${v.uid}-id" data-vlabel="Code"></label>`
    + `<input class="input" id="ed-v-${v.uid}-id" data-key="v:${v.uid}:id" data-v="id" value="${esc(v.id)}" maxlength="8" autocomplete="off" spellcheck="false" autocapitalize="characters"${ro}></div>`
    + `<div class="field adm-vcell"><label class="visually-hidden" for="ed-v-${v.uid}-label" data-vlabel="Label"></label>`
    + `<input class="input" id="ed-v-${v.uid}-label" data-key="v:${v.uid}:label" data-v="label" value="${esc(v.label)}" maxlength="24" autocomplete="off"${ro}></div>`
    + `<div class="field adm-vcell"><label class="visually-hidden" for="ed-v-${v.uid}-stock" data-vlabel="Stock"></label>`
    + `<div class="stepper adm-stepper"><button type="button" data-step="-1" data-vlabel-btn="Remove one from">${icon('minus', { size: 14 })}</button>`
    + `<input type="number" id="ed-v-${v.uid}-stock" data-key="v:${v.uid}:stock" data-v="stock" value="${esc(v.stock)}" min="0" max="9999" step="1" inputmode="numeric">`
    + `<button type="button" data-step="1" data-vlabel-btn="Add one to">${icon('plus', { size: 14 })}</button></div></div>`
    + (one ? '<span class="adm-vrow-gap" aria-hidden="true"></span>' : `<button class="adm-icon-act adm-act-danger" type="button" data-vremove>${icon('trash', { size: 16 })}</button>`)
    + `</li>`;
}

function imageRowHTML(im, media) {
  const kinds = [['cutout', 'Cut-out on the canvas'], ['photo', 'Photo']];
  return `<li class="adm-irow" data-irow="${im.uid}">`
    + `<div class="adm-irow-head"><p class="label adm-irow-num"></p><p class="small muted adm-irow-role"></p>`
    + `<div class="adm-irow-acts">`
    + `<button class="adm-icon-act adm-up" type="button" data-imove="-1">${icon('left', { size: 16 })}</button>`
    + `<button class="adm-icon-act adm-down" type="button" data-imove="1">${icon('right', { size: 16 })}</button>`
    + `<button class="adm-icon-act adm-act-danger" type="button" data-iremove>${icon('trash', { size: 16 })}</button>`
    + `</div></div>`
    + `<div class="adm-irow-body"><span class="adm-thumb adm-thumb-lg" data-ithumb>${im.key ? picture(im.key, { alt: '', sizes: '96px' }) : ''}</span>`
    + `<div class="adm-irow-fields">`
    + `<div class="field adm-field"><label for="ed-i-${im.uid}-key">Image file</label>`
    + `<select class="select" id="ed-i-${im.uid}-key" data-key="i:${im.uid}:key" data-i="key">${mediaOptions(media, im.key)}</select></div>`
    + `<div class="field adm-field"><label for="ed-i-${im.uid}-alt">Alt text</label>`
    + `<input class="input" id="ed-i-${im.uid}-alt" data-key="i:${im.uid}:alt" data-i="alt" value="${esc(im.alt)}" maxlength="200" autocomplete="off"></div>`
    + `<div class="adm-grid-2">`
    + `<div class="field adm-field"><label for="ed-i-${im.uid}-kind">Kind</label><select class="select" id="ed-i-${im.uid}-kind" data-key="i:${im.uid}:kind" data-i="kind">`
    + kinds.map(([id, name]) => `<option value="${id}"${id === im.kind ? ' selected' : ''}>${name}</option>`).join('') + `</select></div>`
    + `<div class="field adm-field"><label for="ed-i-${im.uid}-view">View name <span class="muted">(optional)</span></label>`
    + `<input class="input" id="ed-i-${im.uid}-view" data-key="i:${im.uid}:view" data-i="view" value="${esc(im.view)}" maxlength="24" placeholder="Front, Back, Detail" autocomplete="off"></div>`
    + `</div></div></div></li>`;
}

function formHTML(d, { isNew, isSeed, categories, media }) {
  const cats = `<option value=""${d.category ? '' : ' selected'}>Choose a category</option>`
    + categories.map((c) => `<option value="${esc(c.slug)}"${c.slug === d.category ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  const types = OPTION_TYPES.map((t) => `<label class="adm-seg-item"><input type="radio" name="optionType" value="${t.id}" data-key="optionType"${t.id === d.optionType ? ' checked' : ''}><span>${t.name}</span></label>`).join('');
  const check = (key, label, hint) => `<label class="check adm-check"><input type="checkbox" id="ed-${key}" data-key="${key}"${d[key] ? ' checked' : ''}><span><span class="adm-check-label">${label}</span><span class="hint">${hint}</span></span></label>`;
  const colour = (key, label, hint, pickLabel) => field({
    key, label, hint, cls: 'adm-colour-field',
    control: (h) => `<div class="adm-colour"><input type="color" class="adm-colour-pick" data-pick="${key}" value="${esc(HEX_RE.test(d[key]) ? d[key].toLowerCase() : DEFAULT_HEX.toLowerCase())}" aria-label="${pickLabel}">`
      + `<input ${inputAttrs(key, h, `value="${esc(d[key])}" maxlength="7" autocomplete="off" spellcheck="false"`)}></div>`,
  });
  const section = (n, title, body, extra = '') => `<fieldset class="adm-fs"${extra}><legend><span class="adm-fs-num" aria-hidden="true">${pad(n)}</span>${title}</legend><div class="adm-fs-body">${body}</div></fieldset>`;

  return `<div class="adm-errors" data-error-summary tabindex="-1" aria-labelledby="adm-errors-title" role="group" hidden>`
    + `<p class="adm-errors-title" id="adm-errors-title"></p><ul role="list" data-error-list></ul></div>`
    + section(1, 'Basics',
      field({ key: 'name', label: 'Name', control: (h) => `<input ${inputAttrs('name', h, `value="${esc(d.name)}" maxlength="80" autocomplete="off"`)}>` })
      + `<div class="adm-grid-2">`
      + field({
        key: 'slug', label: 'Slug',
        hint: isSeed ? 'Fixed for demo products: their store page is built at this address.' : `Made from the name. The store address is /product/?slug=&hellip;`,
        control: (h) => `<input ${inputAttrs('slug', h, `value="${esc(d.slug)}" maxlength="60" autocomplete="off" spellcheck="false" autocapitalize="off"${isSeed ? ' readonly' : ''}`)}>`,
      })
      + field({ key: 'sku', label: 'SKU', control: (h) => `<input ${inputAttrs('sku', h, `value="${esc(d.sku)}" maxlength="32" autocomplete="off" spellcheck="false" autocapitalize="characters"`)}>` })
      + field({ key: 'category', label: 'Category', control: (h) => `<select class="select" id="ed-category" name="category" data-key="category"${describedBy(h)}>${cats}</select>` })
      + field({
        key: 'price', label: 'Price', hint: 'Demo price in US dollars.',
        control: (h) => `<div class="adm-money"><span aria-hidden="true">$</span><input ${inputAttrs('price', h, `value="${esc(d.price)}" inputmode="decimal" autocomplete="off"`)}></div>`,
      })
      + `</div>`)
    + section(2, 'Words',
      field({ key: 'summary', label: 'Summary', hint: 'One line, shown under the name.', control: (h) => `<input ${inputAttrs('summary', h, `value="${esc(d.summary)}" maxlength="160" autocomplete="off"`)}>` })
      + field({ key: 'description', label: 'Description', control: (h) => `<textarea class="textarea" id="ed-description" name="description" data-key="description" rows="4"${describedBy(h)}>${esc(d.description)}</textarea>` })
      + field({ key: 'details', label: 'Details', hint: 'One per line. Shown as a list on the product page.', control: (h) => `<textarea class="textarea adm-textarea-sm" id="ed-details" name="details" data-key="details" rows="4"${describedBy(h)}>${esc(d.details)}</textarea>` }))
    + section(3, 'Colour',
      `<div class="adm-grid-2">`
      + field({ key: 'colourName', label: 'Colour name', control: (h) => `<input ${inputAttrs('colourName', h, `value="${esc(d.colourName)}" maxlength="40" autocomplete="off"`)}>` })
      + colour('colourHex', 'Swatch colour', 'The colour dot on cards and swatches.', 'Pick the swatch colour')
      + colour('accent', 'Accent colour', 'Used for the product colour bar.', 'Pick the accent colour')
      + `</div>`)
    + section(4, 'Options and stock',
      `<div class="field adm-field"><p class="adm-field-label" id="ed-type-label">Option type</p><div class="adm-seg" role="radiogroup" aria-labelledby="ed-type-label">${types}</div></div>`
      + `<div class="adm-grid-2">`
      + field({ key: 'optionLabel', label: 'Option label', hint: 'Shown above the choices, for example Size.', control: (h) => `<input ${inputAttrs('optionLabel', h, `value="${esc(d.optionLabel)}" maxlength="24" autocomplete="off"`)}>` })
      + `</div>`
      + `<div class="adm-vlist" data-field="variants">`
      + `<div class="adm-vhead" aria-hidden="true"><span>Code</span><span>Label</span><span>Stock</span><span></span></div>`
      + `<ol class="adm-vrows" role="list" data-vrows>${d.variants.map((v) => variantRowHTML(v, d.optionType)).join('')}</ol>`
      + `<p class="hint">A stock of 0 shows as sold out in the store.</p>`
      + `<button class="adm-add-row" type="button" data-vadd data-key="variants"${d.optionType === 'none' ? ' hidden' : ''}>${icon('plus', { size: 14 })}Add option</button>`
      + `</div>`)
    + section(5, 'Images',
      `<p class="hint adm-fs-note">The first image is the card and main product image. Cut-outs sit on the warm canvas; photos fill their frame.</p>`
      + `<div class="adm-ilist" data-field="images"><ol class="adm-irows" role="list" data-irows>${d.images.map((im) => imageRowHTML(im, media)).join('')}</ol>`
      + `<button class="adm-add-row" type="button" data-iadd data-key="images">${icon('plus', { size: 14 })}Add image</button></div>`)
    + section(6, 'Visibility',
      `<div class="adm-checks">`
      + check('newArrival', 'New arrival', 'Shows the New flag and joins new arrivals.')
      + check('featured', 'Featured', 'Can appear in featured spots on the home page.')
      + check('hidden', 'Hidden', 'Kept out of the store. Its page says it is no longer available.')
      + `</div>`);
}

/* ---------- The editor ---------- */

/**
 * createEditor({ categories, media, getProducts, seedSlugs, isSeedSlug, ask, onSave })
 * open(product | null, { opener, returnFocus })
 */
export function createEditor({ categories, media, getProducts, seedSlugs, ask, onSave }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'drawer adm-editor';
  dialog.id = 'adm-editor';
  dialog.setAttribute('aria-labelledby', 'adm-editor-title');
  document.body.append(dialog);

  let state = null; // { product, isNew, isSeed, originalSlug, snapshot, slugTouched, skuTouched, submitted, returnFocus }
  let downOnBackdrop = false;

  const form = () => $('form', dialog);
  const keyEl = (key) => dialog.querySelector(`[data-key="${CSS.escape(key)}"]`);
  const val = (key) => keyEl(key)?.value ?? '';

  function collect() {
    const f = form();
    const type = $('input[name="optionType"]:checked', f)?.value ?? 'size';
    return {
      name: val('name'),
      slug: val('slug').trim(),
      sku: val('sku'),
      category: val('category'),
      price: val('price'),
      summary: val('summary'),
      description: val('description'),
      details: val('details'),
      colourName: val('colourName'),
      colourHex: val('colourHex'),
      accent: val('accent'),
      optionType: type,
      optionLabel: val('optionLabel'),
      variants: $$('[data-vrow]', f).map((row) => ({
        uid: row.dataset.vrow,
        id: $('[data-v="id"]', row).value,
        label: $('[data-v="label"]', row).value,
        stock: $('[data-v="stock"]', row).value,
      })),
      images: $$('[data-irow]', f).map((row) => ({
        uid: row.dataset.irow,
        key: $('[data-i="key"]', row).value,
        alt: $('[data-i="alt"]', row).value,
        kind: $('[data-i="kind"]', row).value,
        view: $('[data-i="view"]', row).value,
      })),
      newArrival: $('#ed-newArrival', f).checked,
      featured: $('#ed-featured', f).checked,
      hidden: $('#ed-hidden', f).checked,
    };
  }
  // Uids differ between renders of the same data, so leave them out of the dirty check.
  const snapshot = () => {
    const d = collect();
    return stable({ ...d, variants: d.variants.map(({ uid, ...v }) => v), images: d.images.map(({ uid, ...im }) => im) });
  };
  const isDirty = () => state && snapshot() !== state.snapshot;

  function validate() {
    return validateDraft(collect(), {
      products: getProducts(),
      originalSlug: state.isNew ? null : state.originalSlug,
      isSeed: state.isSeed,
      seedSlugs,
      autoSlug: state.isNew && !state.slugTouched,
    });
  }

  /* ----- Error display ----- */
  function setFieldError(key, message) {
    const el = keyEl(key);
    if (!el) return;
    const holder = el.closest('.adm-vcell, .field, [data-field]') ?? el.parentElement;
    const errId = `${(el.id || `ed-${key}`).replace(/[^A-Za-z0-9_-]/g, '-')}-err`;
    let err = holder.querySelector(`:scope > .field-error[data-err]`);
    if (!message) {
      err?.remove();
      holder.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
      if (el.dataset.desc) el.setAttribute('aria-describedby', el.dataset.desc); else el.removeAttribute('aria-describedby');
      return;
    }
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      err.dataset.err = '';
      err.id = errId;
      holder.append(err);
    }
    err.textContent = message;
    holder.classList.add('is-invalid');
    if (el.matches('input, select, textarea')) el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', [el.dataset.desc, err.id].filter(Boolean).join(' '));
  }

  function clearErrors() {
    $$('.field-error[data-err]', dialog).forEach((e) => e.remove());
    $$('.is-invalid', dialog).forEach((e) => e.classList.remove('is-invalid'));
    $$('[aria-invalid]', dialog).forEach((el) => {
      el.removeAttribute('aria-invalid');
      if (el.dataset.desc) el.setAttribute('aria-describedby', el.dataset.desc); else el.removeAttribute('aria-describedby');
    });
  }

  function showErrors(errors) {
    clearErrors();
    errors.forEach((e) => setFieldError(e.key, e.message));
    const box = $('[data-error-summary]', dialog);
    if (!errors.length) { box.hidden = true; return; }
    $('#adm-errors-title', dialog).textContent = errors.length === 1 ? 'Check 1 thing before saving' : `Check ${errors.length} things before saving`;
    $('[data-error-list]', dialog).innerHTML = errors.map((e) => {
      const el = keyEl(e.key);
      return `<li><a href="#${esc(el?.id ?? '')}" data-goto="${esc(e.key)}">${esc(e.summary)}</a></li>`;
    }).join('');
    box.hidden = false;
  }

  /** Re-check one field after the person edits it (only once it has shown an error or after a save attempt). */
  function refreshField(key) {
    if (!key) return;
    const errors = validate();
    const mine = errors.find((e) => e.key === key);
    const el = keyEl(key);
    const showing = el?.getAttribute('aria-invalid') === 'true' || el?.closest('.is-invalid');
    if (mine && (showing || state.submitted)) setFieldError(key, mine.message);
    if (!mine && showing) setFieldError(key, '');
    if (state.submitted) {
      const box = $('[data-error-summary]', dialog);
      if (!errors.length) box.hidden = true;
    }
  }

  /* ----- Rows ----- */
  function renumber() {
    const type = $('input[name="optionType"]:checked', dialog)?.value;
    $$('[data-vrow]', dialog).forEach((row, i) => {
      const n = i + 1;
      $$('[data-vlabel]', row).forEach((l) => { l.textContent = `Option ${n} ${l.dataset.vlabel.toLowerCase()}`; });
      $$('[data-vlabel-btn]', row).forEach((b) => b.setAttribute('aria-label', `${b.dataset.vlabelBtn} option ${n} stock`));
      $('[data-vremove]', row)?.setAttribute('aria-label', `Remove option ${n}`);
    });
    const rows = $$('[data-irow]', dialog);
    rows.forEach((row, i) => {
      const n = i + 1;
      $('.adm-irow-num', row).textContent = `Image ${pad(n)}`;
      $('.adm-irow-role', row).textContent = i === 0 ? 'Main image' : '';
      const up = $('[data-imove="-1"]', row);
      const down = $('[data-imove="1"]', row);
      up.disabled = i === 0;
      down.disabled = i === rows.length - 1;
      up.setAttribute('aria-label', `Move image ${n} up`);
      down.setAttribute('aria-label', `Move image ${n} down`);
      $('[data-iremove]', row).setAttribute('aria-label', `Remove image ${n}`);
    });
    const vadd = $('[data-vadd]', dialog);
    if (vadd) vadd.hidden = type === 'none';
  }

  function setOptionType(type, prevType) {
    const t = OPTION_TYPES.find((o) => o.id === type);
    const prev = OPTION_TYPES.find((o) => o.id === prevType);
    const label = keyEl('optionLabel');
    if (label && (!label.value.trim() || label.value.trim() === prev?.label)) label.value = t.label;
    const current = collect().variants;
    let rows;
    if (type === 'none') {
      const total = current.reduce((n, v) => n + (Number(v.stock) || 0), 0);
      rows = [{ uid: nextUid(), id: 'OS', label: 'One size', stock: String(total) }];
    } else if (prevType === 'none' || (prev && current.every((v, i) => v.id === prev.preset[i]) && current.length === prev.preset.length)) {
      rows = t.preset.map((id) => ({ uid: nextUid(), id, label: id, stock: '0' }));
    } else {
      rows = null; // custom rows: keep them
    }
    if (rows) $('[data-vrows]', dialog).innerHTML = rows.map((v) => variantRowHTML(v, type)).join('');
    else $$('[data-vrow] input[readonly]', dialog).forEach((i) => i.removeAttribute('readonly'));
    renumber();
    announce(type === 'none' ? 'Options set to one size.' : `Options set to ${t.name.toLowerCase()}.`);
  }

  function addVariant() {
    const type = $('input[name="optionType"]:checked', dialog)?.value ?? 'size';
    const row = { uid: nextUid(), id: '', label: '', stock: '0' };
    $('[data-vrows]', dialog).insertAdjacentHTML('beforeend', variantRowHTML(row, type));
    renumber();
    setFieldError('variants', '');
    $(`#ed-v-${row.uid}-id`, dialog).focus();
  }

  function removeVariant(row) {
    const rows = $$('[data-vrow]', dialog);
    const i = rows.indexOf(row);
    row.remove();
    renumber();
    const left = $$('[data-vrow]', dialog);
    const target = left[i] ?? left[i - 1];
    (target ? $('[data-vremove]', target) ?? $('[data-v="id"]', target) : $('[data-vadd]', dialog))?.focus();
    announce(`Option removed. ${left.length} left.`);
  }

  function addImage() {
    const im = { uid: nextUid(), key: '', alt: '', kind: 'photo', view: '' };
    $('[data-irows]', dialog).insertAdjacentHTML('beforeend', imageRowHTML(im, media));
    renumber();
    setFieldError('images', '');
    $(`#ed-i-${im.uid}-key`, dialog).focus();
  }

  function moveImage(row, dir) {
    const sibling = dir < 0 ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) return;
    if (dir < 0) sibling.before(row); else sibling.after(row);
    renumber();
    const rows = $$('[data-irow]', dialog);
    const pos = rows.indexOf(row) + 1;
    const btn = $(`[data-imove="${dir}"]`, row);
    (btn.disabled ? $(`[data-imove="${-dir}"]`, row) : btn).focus();
    row.classList.remove('is-moved');
    void row.offsetWidth;
    row.classList.add('is-moved');
    announce(`Image moved to position ${pos} of ${rows.length}.`);
  }

  function removeImage(row) {
    const rows = $$('[data-irow]', dialog);
    const i = rows.indexOf(row);
    row.remove();
    renumber();
    const left = $$('[data-irow]', dialog);
    const target = left[i] ?? left[i - 1];
    (target ? $('[data-iremove]', target) : $('[data-iadd]', dialog))?.focus();
    announce(`Image removed. ${left.length} left.`);
  }

  function updateThumb(row) {
    const key = $('[data-i="key"]', row).value;
    const holder = $('[data-ithumb]', row);
    holder.innerHTML = key ? picture(key, { alt: '', sizes: '96px' }) : '';
    enhance(holder);
    const m = media.find((x) => x.key === key);
    if (m) $('[data-i="kind"]', row).value = m.alpha ? 'cutout' : 'photo';
  }

  function uniqueSlug(base) {
    const taken = new Set([...getProducts().map((p) => p.slug), ...seedSlugs]);
    if (!base) return '';
    let slug = base;
    for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
    return slug;
  }

  function suggestSku(category) {
    const products = getProducts();
    const inCat = products.filter((p) => p.category === category);
    const codes = inCat.map((p) => /^MONO-([A-Z]{2,3})-(\d+)$/.exec(String(p.sku ?? '').toUpperCase())).filter(Boolean);
    const code = codes[0]?.[1] ?? category.replace(/[^a-z]/g, '').slice(0, 2).toUpperCase();
    let n = codes.reduce((max, m) => Math.max(max, Number(m[2])), 0) + 1;
    const taken = new Set(products.map((p) => String(p.sku ?? '').toUpperCase()));
    let sku = `MONO-${code}-${pad(n)}`;
    while (taken.has(sku)) { n += 1; sku = `MONO-${code}-${pad(n)}`; }
    return sku;
  }

  /* ----- Open, close, save ----- */
  function render() {
    const { product, isNew, isSeed } = state;
    const d = draftFrom(product, { isNew });
    dialog.innerHTML = `<form class="adm-form" novalidate data-editor-form>`
      + `<div class="drawer-head adm-editor-head"><div class="adm-editor-titles">`
      + `<p class="eyebrow plain">${isNew ? 'New product' : 'Edit product'}${!isNew && isSeed ? ' <span aria-hidden="true">/</span> Demo product' : ''}${!isNew && !isSeed ? ' <span aria-hidden="true">/</span> Added in this browser' : ''}</p>`
      + `<h2 id="adm-editor-title" tabindex="-1">${isNew ? 'Add a product' : esc(product.name)}</h2></div>`
      + `<button class="icon-btn" type="button" data-editor-close aria-label="Close the editor">${icon('close', { size: 22 })}</button></div>`
      + `<div class="drawer-body adm-editor-body">${formHTML(d, { isNew, isSeed, categories, media })}</div>`
      + `<div class="drawer-foot adm-editor-foot"><p class="small muted">Saved in this browser only.</p>`
      + `<div class="adm-foot-actions"><button class="btn btn-ghost btn-sm" type="button" data-editor-close>Cancel</button>`
      + `<button class="btn btn-sm" type="submit">${isNew ? 'Add product' : 'Save changes'}</button></div></div>`
      + `</form>`;
    renumber();
    enhance(dialog);
    state.lastType = d.optionType;
    state.snapshot = snapshot();
  }

  function open(product, { opener, returnFocus } = {}) {
    if (dialog.open) return;
    dialog._closeToken = (dialog._closeToken ?? 0) + 1; // cancel any close still in flight
    const isNew = !product;
    state = {
      product: product ? clone(product) : null,
      isNew,
      isSeed: !isNew && seedSlugs.includes(product.slug) && !product.custom,
      originalSlug: product?.slug ?? null,
      slugTouched: !isNew,
      skuTouched: !isNew,
      submitted: false,
      returnFocus: returnFocus ?? (() => opener),
    };
    render();
    dialog.classList.remove('is-closing');
    dialog.showModal();
    document.documentElement.classList.add('is-locked');
    $('.adm-editor-body', dialog).scrollTop = 0;
    const fine = window.matchMedia('(pointer: fine)').matches;
    (isNew && fine ? keyEl('name') : $('#adm-editor-title', dialog)).focus();
  }

  function finishClose() {
    if (!dialog.open) return;
    animateClose(dialog);
  }

  async function requestClose() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (isDirty()) {
      const discard = await ask({
        title: 'Discard your changes?',
        text: state.isNew ? 'This product has not been added yet. Closing the editor throws the form away.' : `Your changes to ${state.product.name} have not been saved.`,
        confirmLabel: 'Discard changes',
        cancelLabel: 'Keep editing',
        opener: document.activeElement,
      });
      if (!dialog.open) return;
      document.documentElement.classList.add('is-locked');
      if (!discard) return;
    }
    finishClose();
  }

  function submit() {
    state.submitted = true;
    const errors = validate();
    showErrors(errors);
    if (errors.length) {
      const box = $('[data-error-summary]', dialog);
      $('.adm-editor-body', dialog).scrollTop = 0;
      box.focus({ preventScroll: true });
      announce(`${errors.length === 1 ? 'One field needs' : `${errors.length} fields need`} attention.`);
      return;
    }
    const d = collect();
    const product = toProduct(d, state.isNew ? null : state.product);
    const saved = onSave(product, { previousSlug: state.isNew ? null : state.originalSlug, isNew: state.isNew });
    state.returnFocus = saved?.returnFocus ?? state.returnFocus;
    state.snapshot = snapshot();
    finishClose();
  }

  /* ----- Events ----- */
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('is-locked');
    const target = typeof state?.returnFocus === 'function' ? state.returnFocus() : null;
    target?.focus?.();
  });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); });
  dialog.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === dialog; });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && downOnBackdrop) { requestClose(); return; }
    const t = e.target.closest('button, a[data-goto]');
    if (!t) return;
    if (t.matches('[data-editor-close]')) { requestClose(); return; }
    if (t.matches('[data-goto]')) {
      e.preventDefault();
      const el = keyEl(t.dataset.goto);
      el?.scrollIntoView({ block: 'center' });
      el?.focus({ preventScroll: true });
      return;
    }
    if (t.matches('[data-step]')) {
      const input = $('input', t.closest('.stepper'));
      const next = Math.max(0, Math.min(9999, (parseInt(input.value, 10) || 0) + Number(t.dataset.step)));
      input.value = String(next);
      refreshField(input.dataset.key);
      return;
    }
    if (t.matches('[data-vadd]')) { addVariant(); return; }
    if (t.matches('[data-vremove]')) { removeVariant(t.closest('[data-vrow]')); return; }
    if (t.matches('[data-iadd]')) { addImage(); return; }
    if (t.matches('[data-iremove]')) { removeImage(t.closest('[data-irow]')); return; }
    if (t.matches('[data-imove]')) moveImage(t.closest('[data-irow]'), Number(t.dataset.imove));
  });
  dialog.addEventListener('submit', (e) => { e.preventDefault(); submit(); });

  dialog.addEventListener('input', (e) => {
    const t = e.target;
    const key = t.dataset?.key;
    if (key === 'name' && state.isNew && !state.slugTouched) {
      keyEl('slug').value = uniqueSlug(slugify(t.value));
      refreshField('slug');
    }
    if (key === 'slug') {
      state.slugTouched = t.value.trim() !== '';
      if (!state.slugTouched) t.value = '';
    }
    if (key === 'sku') state.skuTouched = t.value.trim() !== '';
    if (t.dataset?.pick) {
      const text = keyEl(t.dataset.pick);
      text.value = t.value.toUpperCase();
      refreshField(t.dataset.pick);
    }
    if ((key === 'colourHex' || key === 'accent') && HEX_RE.test(t.value.trim())) {
      const pick = $(`[data-pick="${key}"]`, dialog);
      if (pick) pick.value = t.value.trim().toLowerCase();
    }
    if (key) refreshField(key);
  });

  dialog.addEventListener('change', (e) => {
    const t = e.target;
    const key = t.dataset?.key;
    if (t.name === 'optionType') {
      setOptionType(t.value, state.lastType);
      state.lastType = t.value;
      return;
    }
    if (key === 'category' && state.isNew && !state.skuTouched && t.value) {
      keyEl('sku').value = suggestSku(t.value);
      refreshField('sku');
    }
    if (t.dataset?.i === 'key') { updateThumb(t.closest('[data-irow]')); }
    if (key) refreshField(key);
  });

  // Show a field's problem when the person leaves it after typing.
  dialog.addEventListener('focusout', (e) => {
    const t = e.target;
    const key = t.dataset?.key;
    if (!key || !t.matches('input, select, textarea') || t.type === 'radio' || t.type === 'checkbox') return;
    if (t.value === initialValue(t) && !state.submitted) return;
    const mine = validate().find((x) => x.key === key);
    setFieldError(key, mine ? mine.message : '');
  });

  return { open, element: dialog, isOpen: () => dialog.open };
}
