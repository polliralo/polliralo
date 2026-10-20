import { html } from '../lib/html.mjs';
import { Eyebrow, titleText } from './common.mjs';
import ServiceCard from './ServiceCard.mjs';

// The four services on an asymmetric card grid: a wide card and a narrow one
// per row, mirrored on the second row, so no two neighbours match.
const LAYOUT = ['wide', 'narrow', 'narrow', 'wide'];

export default function ServiceGrid({ content, images, links }) {
  const { services } = content;
  return html`
    <section class="section services" id="services" aria-labelledby="services-title">
      <div class="container">
        <div class="section-head section-head--split">
          <div class="section-head__main">
            ${Eyebrow({ text: services.eyebrow })}
            <h2 class="section-title" id="services-title">${titleText(services.title)}</h2>
          </div>
          <p class="section-intro">${services.intro}</p>
        </div>
        <ul class="service-grid" role="list">
          ${services.items.map((service, index) => html`
            <li class="service-grid__item service-grid__item--${LAYOUT[index]}" data-reveal>
              ${ServiceCard({ service, index, layout: LAYOUT[index], cta: services.cta, images, href: links.whatsappFor(service.message) })}
            </li>`)}
        </ul>
      </div>
    </section>`;
}
