// Contact links built from site.config.mjs, so a number is only ever typed once.

export const callHref = (config) => `tel:${config.phone}`;

export const whatsappHref = (config, message) =>
  `https://wa.me/${config.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

// Checks the business details before anything is built, with plain messages.
export function checkConfig(config) {
  const problems = [];
  if (!/^\+\d{8,15}$/.test(config.phone)) problems.push('phone: use + and digits only, for example +8801712345678');
  if (!/^\d{8,15}$/.test(config.whatsapp)) problems.push('whatsapp: digits only (country code first, no +), for example 8801712345678');
  for (const key of ['name', 'phoneDisplay', 'whatsappDisplay', 'serviceArea']) {
    if (!String(config[key] ?? '').trim()) problems.push(`${key}: must not be empty`);
  }
  if (config.siteUrl && !/^https:\/\/[^\s]+\/$/.test(config.siteUrl)) {
    problems.push('siteUrl: a full https address ending in /, for example https://coolcare.com.bd/');
  }
  if (problems.length) throw new Error(`site.config.mjs needs a fix:\n  ${problems.join('\n  ')}`);
}
