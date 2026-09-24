import type { Text } from "./types";

/**
 * English. Transcribed from Figma `hn1D34By2eYTsakhzDWWkV`, which was argued
 * against the graded evidence in `docs/refs/sites/README.md`, and moved from
 * Portland to Clermont-Ferrand and Lyon: euros with TVA, kilometres, SIRET and
 * décennale in place of the US licences. The argument is unchanged; improving
 * a line here silently detaches it from the evidence.
 */
export const EN = {
  pages: {
    home: {
      title: f => `Plumber in ${f.place} — fixed price, fixed today`,
      description: f =>
        `Plumbers in ${f.place}. A written flat rate before we start, a 2-hour arrival window or the call-out is free, and a 12-month warranty. Published prices for nine jobs.`,
      eyebrow: "",
      h1: () => "Your plumbing fixed today — at a price we agree before we start.",
      lede: "Written flat rate on your doorstep. 2-hour arrival window. 12-month warranty. Late and the call-out is free.",
    },
    prices: {
      title: () => "Every job, every number",
      description: f =>
        `The full Aquafix price list in ${f.place}: nine jobs, real flat rates including TVA, and the questions everybody asks before booking.`,
      eyebrow: "PRICES  ·  AQUAFIX",
      h1: () => "Every job, every number.",
      lede: "What we charge, why the number never moves, and what happens if the job turns out worse than it looked.",
    },
    guarantee: {
      title: () => "What we actually promise",
      description: () =>
        "The four things people fear about calling a plumber, the written terms that remove each one, and how an Aquafix job runs start to finish.",
      eyebrow: "GUARANTEE  ·  AQUAFIX",
      h1: () => "What we actually promise.",
      lede: "The four things people fear about calling a plumber, the terms that remove each one, and how a job runs start to finish.",
    },
    about: {
      title: f => `Four plumbers and a ${f.radiusKm} km radius`,
      description: f =>
        `Who turns up, how they are insured, and exactly where around ${f.place} we will and will not drive.`,
      eyebrow: "ABOUT  ·  AQUAFIX",
      h1: f => `Four plumbers and a ${f.radiusKm} km radius.`,
      lede: "Who turns up, how they are insured, and exactly where we will and will not drive.",
    },
  },
  brandPage: {
    title: "Aquafix — plumbers in Clermont-Ferrand and Lyon",
    description:
      "Aquafix plumbing and heating: a written flat rate before work starts, a 2-hour arrival window and a 12-month warranty. Six points across Clermont-Ferrand and Lyon.",
    h1: "Fixed price. Fixed today. Near you.",
    lede: "Pick the point closest to you — each has its own van, its own number and the same written terms.",
    listTitle: "Our points",
    open: "Open this point",
  },
  nav: { prices: "Prices", guarantee: "Guarantee", reviews: "Reviews", about: "About" },
  promise: "FIXED PRICE. FIXED TODAY.",
  emergencyHours: "Emergencies — 24 hours, 7 days",
  bookingHours: "Bookings — 7am to 9pm daily",
  headerPhoneLabel: "24/7 · ANSWERED BY A HUMAN",
  heroPhotoAlt: "The Aquafix crew in front of the branded vans at the depot.",
  cta: "Get my flat price  →",
  ctaShort: "Get my flat price",
  callLabel: f => `Call ${f.phone}`,
  whatsappLabel: "WhatsApp us",
  whatsappShort: "WhatsApp",
  /** The mobile call bar's accessible name. */
  callBarLabel: "Contact us",
  menuLabel: "Menu",
  whatsappMessage: f => `Hello, I need a plumber in ${f.place}.`,
  quoteForm: {
    title: "Get your flat price",
    lede: "90 seconds. No obligation, no call-out fee.",
    submit: "Send me my price  →",
    privacy: "Your number is used to send the quote. Nothing else, ever.",
    reassurance: f =>
      `We text your price band back within 10 minutes, 7am–9pm. Emergency right now? Call ${f.phone} — we pick up 24/7.`,
    jobLabel: "WHAT'S WRONG?",
    zipLabel: "WHERE ARE YOU?",
    mobileLabel: "MOBILE",
    zipPlaceholder: "Town or postcode",
    mobilePlaceholder: "06 00 00 00 00",
    honeypotLabel: "Leave this field empty",
  },
  jobs: {
    blocked_drain: "Blocked drain",
    burst_pipe: "Burst or leaking pipe",
    hot_water: "Hot water",
    tap_toilet: "Tap, toilet or cistern",
    sewer_line: "Sewer line",
    leak_detection: "Leak detection",
    repipe: "Whole-house repipe",
    fit_out: "Bathroom or kitchen fit-out",
    other: "Something else",
  },
  prices: {
    drain: { job: "Blocked drain — machine cleared", time: "45–90 min" },
    tap: { job: "Leaking tap, mixer or cistern", time: "30–60 min" },
    toilet: { job: "Toilet repair or full replacement", time: "1–2 hrs" },
    water_heater_repair: { job: "Water heater — repair", time: "1–3 hrs" },
    water_heater_replace: { job: "Water heater — full replacement", time: "half day" },
    pipe: { job: "Burst or leaking pipe repair", time: "1–3 hrs" },
    camera: { job: "Drain camera inspection", time: "45 min" },
    sewer: { job: "Sewer line clear and report", time: "2–4 hrs" },
    repipe: { job: "Full repipe — 3 bedroom house", time: "2–3 days" },
  },
  priceColumns: { job: "JOB", price: "FLAT PRICE FROM", time: "TYPICAL TIME ON SITE" },
  home: {
    eyebrow: f => `PLUMBER · ${f.place.toUpperCase()}`,
    display: ["FIXED PRICE.", "FIXED TODAY.", "GUARANTEED."],
    lede: () => "A written flat rate on your doorstep before we start. Two-hour window, or the call-out is free.",
    cta: "Get my flat price",
    decennaleBadge: "Décennale insurance",
    headerRating: f => `★ ${f.rating.value} · ${f.rating.count} reviews`,
    stats: f => [
      { figure: `${f.rating.value}★`, label: `${f.rating.count} REVIEWS` },
      { figure: "43 MIN", label: "AVG. ARRIVAL" },
      { figure: "96%", label: "FIXED SAME DAY" },
      { figure: "12 MO", label: "WARRANTY" },
    ],
    workEyebrow: "WHAT WE DO · FLAT PRICES",
    workTitle: "The work. And what it costs.",
    work: {
      drains: {
        caption: "Blocked drains",
        body: "Water standing in the sink, a gurgle from the next drain along, or a smell that will not go away. We put a camera down first so we are clearing the blockage you actually have — an auger for a soft one, a jet for grease and scale, a cutting head for roots. If the camera shows the sewer line rather than your drain, we tell you that instead of charging you to rod it twice.",
      },
      taps: {
        caption: "Taps, mixers & showers",
        body: "A drip you can hear at night, a mixer that will not hold temperature, or pressure that has quietly dropped on one tap. Most are a cartridge, a seat or a scaled aerator, and are done inside the hour. We carry the common cartridges, so the usual job is one visit rather than a visit and an order.",
      },
      heaters: {
        caption: "Hot water & heating",
        body: "No hot water, hot that runs cold in four minutes, a knocking tank, or damp around the base. We flush the sediment, test the safety group and check the flue and connections. Nine times in ten that is the repair; when the tank has gone we say so before you have paid for a service on something we are about to replace.",
      },
      pipes: {
        caption: "Pipe repair",
        body: "Damp on a ceiling, a stain that grows, pressure down everywhere at once, or water audible with every tap shut. We locate it with acoustic and thermal kit before we open anything, so what gets cut is the section over the leak and not the wall we guessed at.",
      },
    },
    workMore: "What this involves",
    workClose: "Close",
    pricesNote: f => `Call-out ${f.callout}, credited in full against work you approve. Prices include TVA.`,
    guaranteeEyebrow: "OUR GUARANTEE, IN WRITING",
    guaranteeTitle: "Three things we pay for if we get them wrong.",
    guaranteeLink: "Read our guarantee",
    reviewsEyebrow: "REVIEWS",
    reviewsTitle: "What the neighbours say.",
    reviewsRating: f => `${f.rating.value} out of 5 · ${f.rating.count}${f.rating.google ? " Google" : ""} reviews`,
    reviewsCallAside: ["or call ", " — we pick up 24/7"],
    coverageEyebrow: f => `SERVICE AREA · ${f.radiusKm} KM AROUND ${f.place.toUpperCase()}`,
    coverageTitle: "Where we go.",
    coverageLede: f => `${f.place} and the communes around it. If you are outside, we will say so on the phone.`,
    mapShow: "Show the map",
    mapTitle: f => `Map: Aquafix ${f.place}`,
    backToTop: "Back to top",
  },
  pillars: [
    {
      n: "01",
      title: "The price cannot move.",
      body: () =>
        "A flat rate in writing before a single tool comes out of the van. Three hours longer than we estimated? That is our problem.",
    },
    {
      n: "02",
      title: "The clock is on us.",
      body: f => `A 2-hour arrival window. Miss the window and the ${f.callout} call-out fee is waived automatically.`,
    },
    {
      n: "03",
      title: "The work is warranted.",
      body: () => "12 months on parts and labour. If the same fault comes back, we come back and fix it at no charge.",
    },
  ],
  guaranteeCtaAside: f => `or call ${f.phone} — a human picks up, 24 hours a day`,
  reviews: [
    {
      stars: 5,
      body: f =>
        `Nate found the leak in twenty minutes after two other companies told me they would have to break up the floor. Quoted ${f.price("pipe")}. Charged ${f.price("pipe")}.`,
      author: "Sarah K.",
      attrib: "Chamalières · Burst pipe · 2 weeks ago",
    },
    {
      stars: 5,
      body: () =>
        "Booked the 8–10am window, van pulled up at 8:20. New water heater in before lunch. The price on the website is the price I actually paid.",
      author: "Danny R.",
      attrib: "Clermont-Ferrand · Hot water · 1 month ago",
    },
    {
      stars: 4,
      body: () =>
        "Four stars only because they could not come out until the next morning. Everything else was exactly as advertised, right down to the shoe covers.",
      author: "Priya M.",
      attrib: "Ceyrat · Blocked drain · 3 weeks ago",
    },
  ],
  services: {
    head: {
      eyebrow: "WHAT WE DO",
      title: () => "Eight jobs. We do them properly and we say no to the rest.",
      lede: "Every price below is the real starting flat rate, TVA included, confirmed on site before we begin.",
    },
    items: {
      drains: {
        name: "Blocked drains",
        body: "Machine cleared, camera checked, and we tell you what caused it so it does not happen again in six weeks.",
      },
      pipes: {
        name: "Burst & leaking pipes",
        body: "Located acoustically before anything is opened up. No exploratory holes in your walls or floors.",
      },
      heaters: {
        name: "Water heaters",
        body: "We try to repair first. We only recommend replacement when repair is throwing good money after bad.",
      },
      taps: {
        name: "Taps, toilets & cisterns",
        body: "The small jobs most plumbers will not drive out for. Same flat-rate promise applies.",
      },
      sewers: {
        name: "Sewer lines",
        body: "Camera inspection, clear, and a written report in a format your insurer will accept.",
      },
      leaks: {
        name: "Leak detection",
        body: "Acoustic and thermal imaging. We find it before we open a wall, not after.",
      },
      repipes: {
        name: "Whole-house repipes",
        body: "Staged so you never lose water overnight. Fixed price for the whole job, not per fitting.",
      },
      fit_out: {
        name: "Bathroom & kitchen fit-out",
        body: "Rough-in through to final fix, sequenced around your tiler and kitchen fitter.",
      },
    },
    from: "from",
    quoted: "quoted",
  },
  faqHead: {
    eyebrow: "BEFORE YOU CALL",
    title: "The questions everybody asks.",
    callAside: ["Still have a question? A human answers 24/7 on ", "."],
  },
  faqs: [
    {
      q: f => `Is the ${f.callout} call-out on top of the job price?`,
      a: f =>
        `No. It is credited in full against any work you approve. If you approve nothing, the ${f.callout} covers the visit and the diagnosis, and that is the entire bill.`,
    },
    {
      q: () => "What if you find something worse once it is open?",
      a: () =>
        "We stop, show you, and requote before touching anything. You can decline and owe only the amount you already approved. We never do extra work and bill for it afterwards.",
    },
    {
      q: () => "Do you actually answer at 2am?",
      a: f =>
        `Yes, and it is a person in ${f.place} rather than an answering service. Emergency call-outs between 9pm and 7am carry a ${f.surcharge} surcharge, quoted to you before we dispatch anyone.`,
    },
    {
      q: () => "Are you registered and insured?",
      a: f =>
        `SIRET ${f.siret}, and every job is covered by our assurance décennale (${f.insurer}, policy ${f.policy}). We will email you the certificate before the visit if you want to see it first.`,
    },
    {
      q: () => "How fast can you really get here?",
      a: () =>
        "Across our last 500 jobs the average emergency arrival was 43 minutes. For non-urgent work, 96% of bookings were attended within 24 hours.",
    },
    {
      q: () => "What payment do you take?",
      a: () => "Card, bank transfer or cash on completion. Every price we quote includes TVA — the number on the sheet is the number you pay.",
    },
  ],
  objectionsHead: {
    eyebrow: "WHY PEOPLE LIVE WITH IT FOR MONTHS",
    title: () => "Four reasons you have been putting off the call. We removed all four.",
    lede: "Every one of these is a real thing customers told us before they booked. Each one is now a written term on your job sheet, not a promise on a website.",
  },
  objections: [
    {
      quote: () => "“They’ll quote me €200 and then charge €700.”",
      title: "We price the job, not the hour.",
      body: () =>
        "You get a flat rate in writing before a single tool comes out of the van. If it takes us three hours longer than we estimated, that is our problem — you pay the number on the sheet.",
    },
    {
      quote: () => "“They’ll turn up whenever they feel like it.”",
      title: "A 2-hour window, or the call-out is free.",
      body: f =>
        `You pick the window. We text you when the van leaves the depot with the plumber’s name and photo. Miss the window and the ${f.callout} call-out fee is waived automatically.`,
    },
    {
      quote: () => "“They’ll walk mud through the house.”",
      title: "Shoe covers, drop sheets, before-and-after photos.",
      body: () =>
        "Every job sheet includes photographs of the work area before we start and after we finish. If we leave a mess, you have the evidence.",
    },
    {
      quote: () => "“It’ll be leaking again by winter.”",
      title: "12 months on parts and labour.",
      body: () =>
        "If the same fault returns inside a year we come back and fix it at no charge — no diagnostic fee, no argument about whose fault it was.",
    },
  ],
  stepsHead: { eyebrow: "HOW IT WORKS", title: "Three steps. Nothing to chase." },
  steps: [
    {
      n: "1",
      title: "You call, or send the form.",
      body: "One sentence about what is wrong. We ask three questions and give you a price band before you hang up.",
    },
    {
      n: "2",
      title: "We arrive inside your window.",
      body: "You get a text when the van leaves the depot — the plumber’s name, their photo, and a live ETA.",
    },
    {
      n: "3",
      title: "You approve the price. Then we fix it.",
      body: "Nothing is touched until you have seen the flat rate and said yes. 96% of jobs are finished on that first visit.",
    },
  ],
  crewHead: {
    eyebrow: "THE PEOPLE WHO WILL BE IN YOUR HOUSE",
    title: () => "Four plumbers. That is the whole team.",
    lede: "No subcontractors, no rotating strangers off an app. You will meet one of these four, and you will know which one before they knock.",
  },
  crew: [
    { initials: "MH", name: "Marcus Hale", role: "Owner · Master Plumber", years: "19 years on the tools", credential: "Covered by our décennale" },
    { initials: "NE", name: "Nate Ellis", role: "Lead Plumber", years: "11 years on the tools", credential: "Covered by our décennale" },
    { initials: "DO", name: "Deb Ovechi", role: "Plumber · Gas Fitter", years: "8 years on the tools", credential: "Covered by our décennale" },
    { initials: "TR", name: "Toby Ruiz", role: "Apprentice, 3rd year", years: "3 years on the tools", credential: "Always supervised" },
  ],
  areaHead: {
    eyebrow: "SERVICE AREA",
    title: f => `${f.radiusKm} km around ${f.place}. We turn down everything past it.`,
    lede: "A two-hour window we cannot actually hit is worth nothing to you, so we do not sell one. If you are outside the radius we will say so on the phone and point you at someone closer.",
  },
  inlineCta: {
    line: "Ready for a number? Get your flat price in ninety seconds.",
    button: "Get my flat price  →",
  },
  /** The registration facts, under the footer and every status screen. */
  facts: f => [`SIRET ${f.siret}`, `Assurance décennale · ${f.insurer}`, "Prices include TVA", "Every plumber vetted"],
  footer: {
    columns: { services: "SERVICES", areas: "AREAS", company: "COMPANY", contact: "CONTACT" },
    legal: ["Legal notice", "Privacy", "Insurance certificate"],
    siret: f => `SIRET ${f.siret}`,
    company: {
      guarantee: "Our guarantee",
      prices: "Published prices",
      reviews: "Reviews",
      crew: "The crew",
      contact: "Contact",
    },
  },
  statusStrip: ["Flat rate in writing", "2-hour arrival window", "12-month warranty"],
  notFound: {
    code: "404",
    title: "Page not found",
    eyebrow: "PAGE NOT FOUND",
    headline: ["This page went ", "down the drain."],
    body: () =>
      "Moved, renamed, or it never existed. Your plumbing problem has not gone anywhere though — here is the fastest way to get it fixed.",
    primary: "call",
    secondary: "home",
  },
  serverError: {
    code: "500",
    title: "Server error",
    eyebrow: "SERVER ERROR",
    headline: ["Our fault, not yours, ", "and we can still fix your pipes."],
    body: f =>
      `Something broke on our side. The phone works regardless, and it is answered by a human in ${f.place} 24 hours a day.`,
    primary: "call",
    secondary: "retry",
  },
  thanks: {
    code: "✓",
    title: "Request received",
    eyebrow: "REQUEST RECEIVED",
    headline: ["We have it. ", "Your price is on its way."],
    body: () =>
      "We text your flat price band within 10 minutes between 7am and 9pm. If this is an emergency right now, call us — we pick up 24/7.",
    primary: "call",
    secondary: "home",
  },
  backHome: "← Back to home",
  tryAgain: "Try again",
  /** The language switch's accessible name. */
  langLabel: "Language",
  langName: "English",
} satisfies Text;
