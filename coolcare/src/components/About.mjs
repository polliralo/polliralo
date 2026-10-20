import { html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { photo } from '../lib/picture.mjs';
import { detailHref, Eyebrow, titleText } from './common.mjs';

// A short, honest brand statement and the key facts beside the framed
// technician portrait.
export default function About({ config, content, images, links }) {
  const { about } = content;
  return html`
    <section class="section section--sky about" id="about" aria-labelledby="about-title">
      <div class="container about__inner">
        <div class="about__content">
          ${Eyebrow({ text: about.eyebrow })}
          <h2 class="section-title" id="about-title">${titleText(about.title)}</h2>
          <div class="about__text">
            ${about.text.map((paragraph) => html`<p>${paragraph}</p>`)}
          </div>
          <dl class="facts">
            ${about.facts.map((fact) => html`
              <div class="facts__row">
                <dt><span class="badge-icon badge-icon--sm">${icon(fact.icon)}</span>${fact.term}</dt>
                <dd>${fact.value}${fact.link ? html` <a class="nowrap" href="${detailHref(links, fact.link)}">${config.phoneDisplay}</a>` : ''}</dd>
              </div>`)}
          </dl>
        </div>
        <div class="frame frame--plate-navy about__frame">
          ${photo(images, {
            name: 'technician-portrait',
            alt: about.image.alt,
            sizes: '(min-width: 80em) 480px, (min-width: 64em) 37.5vw, (min-width: 40em) 90vw, min(30rem, 100vw - 2.5rem)',
            className: 'frame__media about__media',
          })}
        </div>
      </div>
    </section>`;
}
