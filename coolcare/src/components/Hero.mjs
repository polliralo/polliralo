import { cx, html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { photo } from '../lib/picture.mjs';
import { Button, Eyebrow } from './common.mjs';

// Split hero on light blue: the words on the left, the technician at work on
// the right in a framed photo with a small service-area card on its corner.
export default function Hero({ config, content, images, links }) {
  const { hero, actions } = content;
  const last = hero.title.length - 1;
  return html`
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__inner">
        <div class="hero__content">
          ${Eyebrow({ text: hero.eyebrow })}
          <h1 class="hero__title" id="hero-title">
            ${hero.title.map((line, i) => html`<span class="${cx('hero__line', i === last && 'accent')}">${line}</span>`)}
          </h1>
          <p class="hero__text">${hero.text}</p>
          <div class="hero__actions">
            ${Button({ href: links.call, label: actions.call, icon: 'phone', variant: 'primary', size: 'lg' })}
            ${Button({ href: links.whatsapp, label: actions.whatsapp, icon: 'message', variant: 'secondary', size: 'lg', external: true })}
          </div>
          <p class="hero__note">${hero.callPrefix} <a class="nowrap" href="${links.call}">${config.phoneDisplay}</a></p>
        </div>
        <div class="hero__visual">
          <div class="frame frame--hero">
            ${photo(images, {
              name: 'hero-mobile',
              alt: hero.image.alt,
              sizes: 'calc(100vw - 2.5rem)',
              art: [{ name: 'hero-desktop', media: '(min-width: 64em)', sizes: '(min-width: 88.75em) 714px, 50.3vw' }],
              eager: true,
              lqip: false,
              className: 'frame__media hero__media',
            })}
          </div>
          <p class="hero__badge">
            <span class="badge-icon">${icon('pin')}</span>
            <span class="hero__badge-text"><span class="hero__badge-label">${hero.badge.label}</span> <span class="hero__badge-value">${hero.badge.value}</span></span>
          </p>
        </div>
      </div>
    </section>`;
}
