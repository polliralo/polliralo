// /about/: the honest brand page, plus "How this demo works" (#demo) with the
// reset button that clears this browser's demo data (content.js).

import { head, trail, onward, numberWord, capitalise, OG_DEFAULT } from '../partials/content.mjs';

export default function render(ctx) {
  const { r } = ctx;
  const crumbs = trail('About', '/about/');
  const pieces = numberWord(ctx.products.length);
  const cats = numberWord(ctx.categories.length);

  const content = `
${head({
  crumbs: crumbs.html,
  eyebrow: 'The label',
  title: 'About MONO',
  lede: 'MONO is a fictional menswear label, made as a portfolio demo. The idea behind it is simple: fewer, better essentials, chosen to work together.',
  ghost: 'Mono',
})}

<section class="wrap section-tight ct-about-idea" aria-labelledby="ct-idea">
  <figure class="ct-figure ct-about-portrait">
    <div class="ct-figure-frame" data-reveal="clip">
      ${r.picture('life-charcoal-tee-wardrobe', {
        alt: 'Man in a charcoal crew-neck tee standing by an open wardrobe of shirts and polos',
        sizes: '(min-width: 1040px) 40vw, (min-width: 760px) 50vw, 100vw',
      })}
    </div>
    <figcaption class="ct-caption"><span class="label">Pictured</span> The Charcoal Textured Tee, by a wardrobe of shirts and polos.</figcaption>
  </figure>
  <div class="ct-about-words" data-reveal>
    <p class="eyebrow">The idea</p>
    <h2 class="ct-h2" id="ct-idea">Fewer, better <em>essentials</em></h2>
    <div class="prose">
      <p>MONO starts from a short list: the shirts, tees and polos a man reaches for most, and the few accessories that finish them. Nothing seasonal, nothing loud.</p>
      <p>The colours are chosen to sit together: ivory, charcoal, olive, navy, black and brown. The intent is that any top in the range works with any watch, belt or pair of sunglasses, so getting dressed takes less thought.</p>
    </div>
    <ol class="ct-principles" role="list" data-stagger>
      <li data-reveal>
        <span class="ct-principle-n" aria-hidden="true">01</span>
        <h3>Fewer pieces</h3>
        <p>${capitalise(pieces)} pieces in ${cats} categories. A short range is easier to choose from and easier to combine.</p>
      </li>
      <li data-reveal>
        <span class="ct-principle-n" aria-hidden="true">02</span>
        <h3>Quiet colours</h3>
        <p>Muted, natural shades, so a new piece joins the rest of the wardrobe instead of fighting it.</p>
      </li>
      <li data-reveal>
        <span class="ct-principle-n" aria-hidden="true">03</span>
        <h3>Plain words</h3>
        <p>Each product page says what the piece is, shows it from more than one side and suggests what to wear it with.</p>
      </li>
    </ol>
  </div>
</section>

<section class="wrap section-tight ct-about-wide" aria-labelledby="ct-detail">
  <figure class="ct-figure ct-figure-wide">
    <div class="ct-figure-frame ct-wide-frame" data-reveal>
      ${r.picture('wide-watch-desk', {
        alt: 'The black-dial watch on a brown strap, worn at a desk beside a leather notebook',
        sizes: '(min-width: 1440px) 1000px, (min-width: 1040px) 70vw, 100vw',
      })}
    </div>
    <figcaption class="ct-wide-caption" data-reveal>
      <h2 class="ct-h3" id="ct-detail">The finishing pieces</h2>
      <p>Two-hand watches with quiet dials, a black belt, a brown wallet and two pairs of sunglasses. Small things, meant to go with every top in the range.</p>
      <p class="ct-caption"><span class="label">Pictured</span> The Black Dial Watch on its brown strap.</p>
      <a class="link" href="/collections/watches/">Shop watches</a>
    </figcaption>
  </figure>
</section>

<section class="ct-demo on-night" id="demo" aria-labelledby="ct-demo-title">
  <div class="wrap ct-demo-grid">
    <div class="ct-demo-intro" data-reveal>
      <p class="eyebrow">Demo</p>
      <h2 class="ct-h2" id="ct-demo-title">How this demo works</h2>
      <p class="lede">MONO looks and behaves like a shop, so you can try every step. None of it is real, and nothing you do here is shared.</p>
    </div>
    <dl class="ct-facts" data-stagger>
      <div class="ct-fact" data-reveal>
        <dt>Prices and stock</dt>
        <dd>Every price and stock number is demo data, set for illustration only.</dd>
      </div>
      <div class="ct-fact" data-reveal>
        <dt>Saved in this browser</dt>
        <dd>Your bag, demo orders and any admin edits are saved only in this browser (localStorage). They never leave your device, and other visitors cannot see them.</dd>
      </div>
      <div class="ct-fact" data-reveal>
        <dt>Checkout</dt>
        <dd>The checkout takes no payment and has no card fields, so it collects no card details. Placing an order only saves a demo record in this browser.</dd>
      </div>
      <div class="ct-fact" data-reveal>
        <dt>Store admin</dt>
        <dd>The <a href="/admin/">demo admin</a> has no sign-in and is not secure. Anyone can open it, and changes only affect the browser they were made in.</dd>
      </div>
      <div class="ct-fact" data-reveal>
        <dt>Forms</dt>
        <dd>The contact and newsletter forms send nothing. See the <a href="/privacy/">privacy policy</a> for the full list of what is kept.</dd>
      </div>
    </dl>

    <div class="ct-reset" data-demo-reset hidden>
      <div class="ct-reset-copy">
        <h3 class="ct-h3">Start again</h3>
        <p>Clear the bag, demo orders and admin edits from this browser. The shop goes back to its original demo data.</p>
      </div>
      <dl class="ct-state" data-demo-state aria-label="Demo data in this browser">
        <div><dt>Bag</dt><dd data-state="cart">No items</dd></div>
        <div><dt>Demo orders</dt><dd data-state="orders">None</dd></div>
        <div><dt>Catalogue</dt><dd data-state="catalog">As shipped</dd></div>
      </dl>
      <div class="ct-reset-actions">
        <button class="btn btn-light" type="button" data-reset-open aria-haspopup="dialog">Reset this demo in my browser</button>
        <p class="ct-reset-done" data-reset-done hidden></p>
      </div>
    </div>
    <noscript><p class="ct-reset-nojs">To clear this demo's data, clear this site's data in your browser settings.</p></noscript>
  </div>
</section>

<dialog class="ct-confirm" id="ct-reset-dialog" aria-labelledby="ct-reset-title" aria-describedby="ct-reset-desc">
  <div class="ct-confirm-body">
    <p class="eyebrow">Demo data</p>
    <h2 class="ct-confirm-title" id="ct-reset-title">Reset this demo?</h2>
    <p id="ct-reset-desc">This removes your bag, demo orders and admin edits from this browser. It cannot be undone.</p>
    <div class="ct-confirm-actions">
      <button class="btn btn-ghost" type="button" data-close-dialog>Cancel</button>
      <button class="btn ct-btn-danger" type="button" data-reset-confirm>Reset demo</button>
    </div>
  </div>
</dialog>

${onward([
  { href: '/collections/', label: 'Shop all', note: `All ${pieces} pieces in one place` },
  { href: '/size-guide/', label: 'Size guide', note: 'Measurements for every size' },
  { href: '/privacy/', label: 'Privacy policy', note: 'What this demo keeps, and where' },
  { href: '/contact/', label: 'Contact', note: 'A demo form you can try' },
])}`;

  return {
    fullTitle: 'About MONO',
    title: 'About MONO',
    description: 'MONO is a fictional menswear label made as a portfolio demo: fewer, better essentials. How the demo works and how to reset it.',
    content,
    css: ['content'],
    js: ['content'],
    jsonld: [crumbs.jsonld],
    bodyClass: 'ct-page ct-about',
    ...OG_DEFAULT,
  };
}
