import { html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { Button, Logo } from './common.mjs';

// The phone menu: a modal <dialog>, so focus stays inside and Esc closes it.
// main.js opens it from the header's menu button.
export default function Menu({ config, content, links }) {
  const { nav, actions, menu } = content;
  return html`
    <dialog class="menu" id="menu" aria-label="${menu.label}">
      <div class="menu__bar">
        ${Logo({ name: config.name })}
        <button class="menu__close" type="button" data-menu-close>${icon('close')}<span>${menu.close}</span></button>
      </div>
      <nav class="menu__nav" aria-label="${menu.label}">
        <ul class="menu__list" role="list">
          ${nav.map((item) => html`<li><a class="menu__link" href="${item.href}">${item.label}</a></li>`)}
        </ul>
      </nav>
      <div class="menu__actions">
        ${Button({ href: links.call, label: actions.call, icon: 'phone', variant: 'primary', size: 'lg' })}
        ${Button({ href: links.whatsapp, label: actions.whatsapp, icon: 'message', variant: 'secondary', size: 'lg', external: true })}
        <p class="menu__note"><a class="nowrap" href="${links.call}">${config.phoneDisplay}</a> <span>${menu.note}</span></p>
      </div>
    </dialog>`;
}
