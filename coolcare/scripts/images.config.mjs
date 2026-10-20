// The photos on the page: which original each one comes from, how it is
// cropped and which widths are made. Used by build-media.mjs (to make the
// files) and, through the manifest it writes, by build.mjs (for srcset).
//
// Crops are in source pixels. If you replace an original with a photo that is
// composed differently, check its crop here.

export const IMAGES = [
  // Hero, desktop: the wide photo in its frame beside the words, cropped a
  // little on the left so the technician and the open AC lead the picture.
  // (hero-portrait.png, the portrait version of the same scene, is not used.)
  {
    name: 'hero-desktop', src: 'hero-wide.png',
    crop: { left: 210, top: 0, width: 1462, height: 941 }, widths: [640, 960, 1280],
  },
  // Hero, phones and tablets: the wide version cropped to 4:3 around the
  // technician and the open AC.
  {
    name: 'hero-mobile', src: 'hero-wide.png',
    crop: { left: 417, top: 0, width: 1255, height: 941 }, widths: [480, 800],
  },
  // Service cards.
  { name: 'ac-cleaning', src: 'ac-cleaning.png', widths: [480, 640, 800, 1120] },
  { name: 'ac-diagnostics', src: 'ac-diagnostics.png', widths: [480, 640, 800, 1120] },
  { name: 'ac-installation', src: 'ac-installation.png', widths: [480, 640, 800, 1120] },
  { name: 'fridge-diagnostics', src: 'fridge-diagnostics.png', widths: [480, 640, 800, 1120] },
  // Why CoolCare: cropped on the left so the window view (a church spire)
  // stays out of a page made for Bangladesh.
  {
    name: 'close-inspection', src: 'close-inspection.png',
    crop: { left: 220, top: 0, width: 1316, height: 1024 }, widths: [480, 640, 800, 1120],
  },
  // About.
  { name: 'technician-portrait', src: 'technician-portrait.png', widths: [480, 800] },
];

// The link-preview image (1200x630) is cut from this photo.
export const SHARE_IMAGE = {
  src: 'hero-wide.png',
  crop: { left: 80, top: 0, width: 1592, height: 836 },
};
