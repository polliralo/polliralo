import { html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { photo } from '../lib/picture.mjs';
import { Eyebrow, titleText } from './common.mjs';

// A large framed close-up of careful work beside the four principles, set
// together on one white card like a technician's checklist.
export default function WhyCoolCare({ content, images }) {
  const { why } = content;
  return html`
    <section class="section section--sky why" id="why" aria-labelledby="why-title">
      <div class="container why__inner">
        <figure class="why__figure" data-reveal>
          <div class="frame frame--plate-start">
            ${photo(images, {
              name: 'close-inspection',
              alt: why.image.alt,
              sizes: '(min-width: 88.75em) 686px, (min-width: 64em) 48.3vw, calc(100vw - 2.5rem)',
              className: 'frame__media why__media',
            })}
          </div>
          <figcaption class="caption">${why.image.caption}</figcaption>
        </figure>
        <div class="why__content">
          ${Eyebrow({ text: why.eyebrow })}
          <h2 class="section-title" id="why-title">${titleText(why.title)}</h2>
          <ul class="principles" role="list">
            ${why.points.map((point) => html`
              <li class="principle" data-reveal>
                <span class="principle__icon" aria-hidden="true">${icon('check')}</span>
                <div class="principle__body">
                  <h3 class="principle__title">${point.title}</h3>
                  <p class="principle__text">${point.text}</p>
                </div>
              </li>`)}
          </ul>
        </div>
      </div>
    </section>`;
}
