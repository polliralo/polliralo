// Home page: three-message hero, categories, new arrivals, shop the look,
// the watch feature, a short brand note and the demo newsletter.
// Markup builders shared with the browser live in assets/js/pages/home-view.js.
//
// Photo rule: no editorial photo appears twice on this page. Category tiles
// keep their category photos; the hero, the watch feature and the cards use
// pictures that are not shown anywhere else here.

import { website, organization } from '../partials/seo.mjs';
import {
  HERO_SLIDES, heroHTML, newArrivals, newArrivalsHTML,
  lookProducts, lookTextHTML, lookFigureHTML, lookListHTML, watchPanelHTML,
} from '../../../site/assets/js/pages/home-view.js';

// A short line under each category photo, from the catalogue facts.
const CATEGORY_LINES = {
  shirts: 'Two Oxfords and a fine blue stripe.',
  't-shirts': 'Textured charcoal, heavy ivory and plain navy.',
  polos: 'Piqué in olive and navy, knit in cream.',
  watches: 'Two hands and a quiet dial.',
  sunglasses: 'Black rectangle, silver aviator, round tortoiseshell.',
  accessories: 'A wallet, a dress belt and a card holder.',
};

const CAT_SIZES = '(min-width: 1180px) 15vw, (min-width: 760px) 30vw, 44vw';

export default function render(ctx) {
  const { r, categories, looks } = ctx;
  const { esc, picture, icon } = r;
  const visible = ctx.products.filter((p) => !p.hidden);

  /* 1. Hero */
  const hero = heroHTML(HERO_SLIDES);

  /* 2. Shop by category (the photo reveals, the words do not) */
  const cats = `<section class="home-cats" aria-labelledby="home-cats-title">
  <div class="wrap">
    <div class="section-head home-head">
      <h2 id="home-cats-title">Shop by <em>category</em></h2>
      <a class="link" href="/collections/">View all</a>
    </div>
    <ul class="home-cats-list" role="list" data-stagger>
      ${categories.map((c) => `<li class="home-cat">
        <a class="home-cat-link" href="${r.categoryUrl(c.slug)}">
          <span class="home-cat-media" data-reveal>${picture(c.image.key, { alt: '', sizes: CAT_SIZES })}</span>
          <span class="home-cat-label">${esc(c.name)}${icon('arrow', { size: 16 })}</span>
          <span class="home-cat-line">${esc(CATEGORY_LINES[c.slug] ?? c.description)}</span>
        </a>
      </li>`).join('\n      ')}
    </ul>
  </div>
</section>`;

  /* 3. New arrivals (a snap rail on every screen size) */
  const fresh = newArrivals(visible);
  const arrivals = `<section class="home-new section" id="new-arrivals" aria-labelledby="home-new-title" data-new-section${fresh.length ? '' : ' hidden'}>
  <div class="wrap">
    <div class="rail-wrap" data-rail>
      <div class="section-head home-head">
        <div class="home-head-title">
          <h2 id="home-new-title">New <em>arrivals</em></h2>
          <span class="label muted">Demo prices</span>
        </div>
        <div class="home-head-tools">
          <a class="link" href="/collections/?sort=new">Shop all</a>
          <div class="rail-nav">
            <button type="button" data-rail-prev aria-label="Previous new arrivals">${icon('left', { size: 18 })}</button>
            <button type="button" data-rail-next aria-label="More new arrivals">${icon('right', { size: 18 })}</button>
          </div>
        </div>
      </div>
      <div class="rail home-new-rail" data-new-list>${newArrivalsHTML(fresh)}</div>
    </div>
  </div>
</section>`;

  /* 4. Shop the look */
  const lookList = looks.map((look, i) => ({ look, i, products: lookProducts(look, ctx.getProduct) }));
  const shopLook = looks.length ? `<section class="home-look section" aria-labelledby="home-look-title" data-look-section>
  <div class="wrap">
    <div class="section-head home-head">
      <h2 id="home-look-title">Shop the <em>look</em></h2>
      <p>Two complete outfits from the collection. Pick a look, then add the pieces you want.</p>
    </div>
    <div class="home-look-grid">
      <div class="home-look-info">
        <p class="eyebrow">Lookbook</p>
        <div class="home-look-texts" data-look-texts>${lookList.map(({ look, i }) => lookTextHTML(look, i, looks.length, i === 0)).join('')}</div>
        <fieldset class="home-look-switch" data-look-switch>
          <legend class="visually-hidden">Choose a look</legend>
          ${looks.map((look, i) => `<input class="home-look-radio" type="radio" name="home-look" id="home-look-${esc(look.id)}" value="${esc(look.id)}"${i === 0 ? ' checked' : ''}><label class="home-look-option" for="home-look-${esc(look.id)}">${esc(look.name)}</label>`).join('')}
        </fieldset>
      </div>
      <div class="home-look-stage" data-look-stage>${lookList.map(({ look, i }) => lookFigureHTML(look, i === 0)).join('')}</div>
      <div class="home-look-panel" data-look-panel>${lookList.map(({ look, i, products }) => lookListHTML(look, products, i === 0)).join('')}</div>
    </div>
  </div>
</section>` : '';

  /* 5. The watch feature: the white dial, so no wrist photo repeats the
        watches category tile. */
  const watch = ctx.getProduct('white-dial-watch');
  const extras = ['brown-bifold-wallet', 'black-dress-belt'].map(ctx.getProduct).filter((p) => p && !p.hidden);
  const other = ctx.getProduct('black-dial-watch');
  const watchImage = watch?.images.find((i) => i.key === 'watch-white-dial') ?? watch?.images[0];
  const watches = watch ? `<section class="home-watch on-night" aria-labelledby="home-watch-title">
  <div class="wrap home-watch-grid">
    <div class="home-watch-story">
      <p class="eyebrow">Watches</p>
      <h2 id="home-watch-title">White dial, <em>link bracelet</em></h2>
      <p class="home-watch-text">${esc(watch.description)}</p>
      <ul class="home-watch-details" role="list">${watch.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
      <a class="link" href="/collections/watches/">Shop watches</a>
    </div>
    <div class="home-watch-photo" data-reveal>${watchImage ? picture(watchImage.key, { alt: watchImage.alt ?? '', sizes: '(min-width: 1040px) 34vw, (min-width: 760px) 50vw, 92vw' }) : ''}</div>
    <div class="home-watch-buy" data-watch-panel>${watchPanelHTML(watch.hidden ? null : watch, extras, { alt: other && !other.hidden ? other : null, altQuestion: 'Prefer a black dial?' })}</div>
  </div>
</section>` : '';

  /* 6. Brand note */
  const note = `<section class="home-note section" aria-labelledby="home-note-title">
  <div class="wrap home-note-inner">
    <h2 id="home-note-title" class="eyebrow">A note on MONO</h2>
    <p class="home-note-text">MONO is a small, fictional label. It exists to show how a calm menswear shop could look and work, <em>from the first shirt to a demo checkout.</em></p>
    <a class="link" href="/about/">About MONO</a>
  </div>
</section>`;

  /* 7. Newsletter (demo) */
  const news = `<section class="home-news" aria-labelledby="home-news-title">
  <div class="wrap home-news-inner">
    <div class="home-news-copy">
      <h2 id="home-news-title">Notes from <em>MONO</em></h2>
      <p>A short letter when something new arrives in the collection.</p>
    </div>
    <form class="home-news-form" data-demo-form novalidate>
      <label class="home-news-label" for="home-news-email">Email address</label>
      <div class="home-news-row">
        <input class="input" id="home-news-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="name@example.com" required aria-describedby="home-news-note home-news-msg">
        <button class="btn" type="submit">Sign up</button>
      </div>
      <p class="home-news-note" id="home-news-note">This is a demo: nothing is sent or saved.</p>
      <p class="home-news-msg" id="home-news-msg" data-form-message></p>
    </form>
  </div>
</section>`;

  return {
    title: 'MONO | Modern Menswear Essentials',
    fullTitle: 'MONO | Modern Menswear Essentials',
    description: 'Shirts, T-shirts, polos, watches, sunglasses and accessories with quiet, considered design. MONO is a fictional menswear demo store.',
    content: [hero, cats, arrivals, shopLook, watches, note, news].join('\n'),
    css: ['home'],
    js: ['home'],
    jsonld: [website(), organization()],
    ogImage: '/assets/img/og/default.jpg',
    ogImageAlt: 'MONO, modern menswear essentials: a fictional demo store',
    // The hero headline is set in Jost 700, which the layout does not preload.
    preload: ['<link rel="preload" href="/assets/fonts/jost-700.woff2" as="font" type="font/woff2" crossorigin>'],
    bodyClass: 'page-home',
  };
}
