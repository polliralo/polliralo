import { html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { photo } from '../lib/picture.mjs';

// How wide each card's photo is drawn, for the browser to pick a file.
// Keep in step with .service-grid and .service-card in main.css. On wide
// screens a narrow card's photo fills its height (3rem + 24vw, at most 26rem)
// at 4:3, so its drawn width follows the height, not the card.
const SIZES = {
  wide: '(min-width: 88.75em) 735px, (min-width: 64em) 51.8vw, (min-width: 40em) 43vw, calc(100vw - 3.75rem)',
  narrow: '(min-width: 96em) 555px, (min-width: 64em) calc(32vw + 4rem), (min-width: 40em) 43vw, calc(100vw - 3.75rem)',
};

// One service: a framed photo, number, name, one line and a WhatsApp link
// with the service already written into the message. The whole card is the link.
export default function ServiceCard({ service, index, layout, cta, images, href }) {
  const number = String(index + 1).padStart(2, '0');
  return html`
    <article class="service-card service-card--${layout}" id="service-${service.id}">
      ${photo(images, { name: service.image, alt: service.alt, sizes: SIZES[layout], className: 'service-card__media' })}
      <div class="service-card__body">
        <p class="service-card__index" aria-hidden="true">${number}</p>
        <h3 class="service-card__title">
          <a class="service-card__link" href="${href}" target="_blank" rel="noopener">${service.name}<span class="visually-hidden">: ${cta}</span></a>
        </h3>
        <p class="service-card__text">${service.text}</p>
        <p class="service-card__cta" aria-hidden="true"><span>${cta}</span><span class="arrow-button">${icon('arrow')}</span></p>
      </div>
    </article>`;
}
