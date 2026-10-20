import { html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { Button, Logo } from './common.mjs';

// Sticky header: logo, the four section links and both ways to get in touch.
// On phones the links move into the menu and the call button stays.
export default function Header({ config, content, links }) {
  const { actions, nav, menu } = content;
  return html`
    <header class="site-header" data-header>
      <div class="site-header__inner">
        ${Logo({ name: config.name })}
        <nav class="site-nav" aria-label="Main">
          <ul class="site-nav__list" role="list">
            ${nav.map((item) => html`<li><a class="site-nav__link" href="${item.href}">${item.label}</a></li>`)}
          </ul>
        </nav>
        <div class="site-header__actions">
          ${Button({ href: links.whatsapp, label: actions.whatsappShort, icon: 'message', variant: 'secondary', size: 'sm', external: true, className: 'site-header__whatsapp' })}
          <a class="btn btn--primary btn--sm site-header__call" href="${links.call}">${icon('phone')}<span class="site-header__call-full">${actions.call}</span><span class="site-header__call-short">${actions.callShort}</span></a>
          <button class="menu-toggle" type="button" data-menu-open aria-haspopup="dialog" aria-controls="menu" aria-expanded="false">${icon('menu')}<span>${menu.label}</span></button>
        </div>
      </div>
    </header>`;
}
