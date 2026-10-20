import { html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { Logo } from './common.mjs';

// Minimal footer: brand line, the four services, contact and the small print.
export default function Footer({ config, content, links, year }) {
  const { footer, services } = content;
  return html`
    <footer class="site-footer" id="site-footer">
      <div class="container">
        <div class="site-footer__top">
          <div class="site-footer__brand">
            ${Logo({ name: config.name })}
            <p class="site-footer__tagline">${footer.tagline}</p>
          </div>
          <nav class="site-footer__group" aria-labelledby="footer-services">
            <h2 class="site-footer__heading" id="footer-services">${footer.servicesTitle}</h2>
            <ul class="site-footer__list" role="list">
              ${services.items.map((service) => html`<li><a href="#service-${service.id}">${service.name}</a></li>`)}
            </ul>
          </nav>
          <div class="site-footer__group">
            <h2 class="site-footer__heading">${footer.contactTitle}</h2>
            <ul class="site-footer__list" role="list">
              <li><a class="nowrap" href="${links.call}">${footer.callLabel} ${config.phoneDisplay}</a></li>
              <li><a class="nowrap" href="${links.whatsapp}" target="_blank" rel="noopener">${footer.whatsappLabel} ${config.whatsappDisplay}</a></li>
              <li>${footer.areaLabel} ${config.serviceArea}</li>
            </ul>
          </div>
        </div>
        <div class="site-footer__bottom">
          <p>&copy; ${year} ${config.name}</p>
          ${config.isConcept ? html`<p class="site-footer__note">${footer.conceptNote}</p>` : ''}
          <a class="site-footer__top-link" href="#top">${footer.backToTop}${icon('arrowUp')}</a>
        </div>
      </div>
    </footer>`;
}
