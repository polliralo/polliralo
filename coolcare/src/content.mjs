// Every word on the page lives here, apart from the business details in
// site.config.mjs. Keep sentences short and plain, and avoid long dashes.
// Section titles are { lead, accent }: the accent words are set in blue.

export default function content(config) {
  const area = config.serviceArea;

  return {
    meta: {
      title: `${config.name} | AC & Refrigerator Service in ${area}`,
      description:
        `Professional AC servicing, repairs and installation, plus refrigerator diagnostics for homes and businesses in ${area}. Call or WhatsApp ${config.name}.`,
      themeColor: '#FFFFFF',
    },

    // Pre-filled WhatsApp messages, so a visitor never has to start from a blank chat.
    messages: {
      general: `Hello ${config.name}, I need help with my AC or refrigerator.`,
    },

    nav: [
      { label: 'Services', href: '#services' },
      { label: 'Why CoolCare', href: '#why' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'About', href: '#about' },
    ],

    actions: {
      call: 'Call for Service',
      callShort: 'Call',
      whatsapp: 'WhatsApp Us',
      whatsappShort: 'WhatsApp',
    },

    hero: {
      eyebrow: 'AC & Refrigerator Service',
      // One entry per line; the last line is set in blue.
      title: ['AC & Refrigerator', 'Service You', 'Can Rely On'],
      text: 'Professional AC servicing, repairs and installation, plus refrigerator diagnostics for homes and businesses.',
      callPrefix: 'Or call',
      // The small card resting on the corner of the photo.
      badge: { label: 'Service area', value: `Homes and businesses across ${area}` },
      image: {
        alt: 'A CoolCare technician lifts the front panel of a wall-mounted split AC and works on it with a screwdriver.',
      },
    },

    services: {
      eyebrow: 'Services',
      title: { lead: 'Four services,', accent: 'done properly.' },
      intro:
        'For air conditioners and refrigerators in homes and businesses. Pick the one that fits, or describe the problem and we will tell you which one you need.',
      cta: 'Ask on WhatsApp',
      items: [
        {
          id: 'ac-cleaning',
          name: 'AC Cleaning',
          text: 'A thorough clean of the filters, coil and drain line, so cool air can flow freely again.',
          message: `Hello ${config.name}, I would like to book AC cleaning.`,
          image: 'ac-cleaning',
          alt: 'A technician brushes dust off an AC filter, with a cleaning cover fitted under the indoor unit to catch water and dirt.',
        },
        {
          id: 'ac-repair',
          name: 'AC Repair & Diagnostics',
          text: 'Not cooling, leaking water or tripping the power? We find the cause first, then fix it.',
          message: `Hello ${config.name}, my AC needs a repair.`,
          image: 'ac-diagnostics',
          alt: 'A technician reads a digital pressure gauge while testing a split AC with its cover open.',
        },
        {
          id: 'ac-installation',
          name: 'AC Installation',
          text: 'New and relocated split ACs, mounted level, sealed properly and tested before we leave.',
          message: `Hello ${config.name}, I need an AC installed.`,
          image: 'ac-installation',
          alt: 'A technician checks a newly mounted split AC with a spirit level.',
        },
        {
          id: 'refrigerator-repair',
          name: 'Refrigerator Repair',
          text: 'Not cold enough, icing up or noisy? We diagnose the fault and explain the repair before we start.',
          message: `Hello ${config.name}, my refrigerator needs a repair.`,
          image: 'fridge-diagnostics',
          alt: 'A technician measures the temperature inside an open refrigerator with a digital probe.',
        },
      ],
    },

    why: {
      eyebrow: 'Why CoolCare',
      title: { lead: 'Careful work,', accent: 'clearly explained.' },
      image: {
        alt: 'A technician holds an airflow meter to the vent of a split AC.',
        caption: 'Measuring airflow at the indoor unit.',
      },
      points: [
        {
          title: 'Careful workmanship',
          text: 'Covers, screws and pipe joints go back exactly as they should. Nothing is forced or rushed.',
        },
        {
          title: 'Clear diagnosis',
          text: 'We find the cause before fixing anything and explain it in plain words. No gas top-up without a leak check.',
        },
        {
          title: 'Professional service',
          text: 'Technicians in uniform, the right tools for each job and a clear account of the work done.',
        },
        {
          title: 'Respect for your space',
          text: 'Floors and furniture covered, water caught in a cleaning bag and the room left tidy.',
        },
      ],
    },

    process: {
      eyebrow: 'How it works',
      title: { lead: 'Three steps,', accent: 'no guesswork.' },
      steps: [
        {
          title: 'Tell us the problem',
          text: 'Call or WhatsApp us. A photo of the unit or its error code helps.',
        },
        {
          title: 'Technician assesses the appliance',
          text: 'We check it properly on site and explain what it needs before any work starts.',
        },
        {
          title: 'Service is completed',
          text: 'The work is done, tested and tidied up, and you see the result before we leave.',
        },
      ],
    },

    about: {
      eyebrow: 'About CoolCare',
      title: { lead: 'Straightforward care for the appliances that', accent: 'keep things cool.' },
      text: [
        `${config.name} looks after air conditioners and refrigerators for homes and businesses across ${area}.`,
        'The approach is simple: listen to the problem, find the cause, explain it plainly and do the work properly.',
      ],
      facts: [
        { term: 'Service area', value: area, icon: 'pin' },
        { term: 'Appliances', value: 'Air conditioners and refrigerators', icon: 'ac' },
        // The phone number is added after this text, as a link.
        { term: 'Contact', value: 'Call or WhatsApp', link: 'call', icon: 'phone' },
      ],
      image: {
        alt: 'A CoolCare technician in a navy polo shirt stands in a tidy workshop, holding a screwdriver.',
      },
    },

    contact: {
      eyebrow: 'Book a visit',
      title: { lead: 'Need AC or', accent: 'refrigerator service?' },
      text: 'Call us, or send a WhatsApp message with the appliance and the problem. A photo helps us come prepared.',
      details: [
        { term: 'Phone', value: config.phoneDisplay, link: 'call', icon: 'phone' },
        { term: 'WhatsApp', value: config.whatsappDisplay, link: 'whatsapp', icon: 'message' },
        { term: 'Service area', value: area, icon: 'pin' },
      ],
    },

    footer: {
      tagline: `AC and refrigerator service in ${area}.`,
      servicesTitle: 'Services',
      contactTitle: 'Contact',
      callLabel: 'Call',
      whatsappLabel: 'WhatsApp',
      areaLabel: 'Serving',
      conceptNote:
        'This is a concept website. The phone number, WhatsApp number and service area are placeholders, and the photographs are illustrative.',
      backToTop: 'Back to top',
    },

    menu: {
      label: 'Menu',
      close: 'Close',
      note: `Homes and businesses across ${area}`,
    },

    skipLink: 'Skip to content',
  };
}
