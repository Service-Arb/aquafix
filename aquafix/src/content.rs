//! Every fact and every string the site shows, once.
//!
//! A section function takes its slice of this and nothing else; there is no
//! literal copy inside an `rsx!`. `seo` and `ld` read the same values, so a
//! description in the `<head>`, in the OG card and in the sitemap is one field
//! read three times.
//!
//! Copy is transcribed from Figma `hn1D34By2eYTsakhzDWWkV`, which was written
//! against the graded conversion evidence in `docs/refs/sites/README.md`.
//! Improving it here silently detaches it from that argument.

pub const SITE: Site = Site {
	legal_name: "Aquafix Plumbing LLC",
	name: "Aquafix",
	domain: "aquafix.top",
	phone: "(503) 555-0148",
	email_user: "hello",
	licence: "#PL-40219",
	ccb: "#221944",
	insurance: "$2,000,000",
	emergency_hours: "Emergencies — 24 hours, 7 days",
	booking_hours: "Bookings — 7am to 9pm daily",
	radius_miles: 30,
	founded: 2011,
	street: "2140 NW Industrial St",
	locality: "Portland",
	region: "OR",
	postal_code: "97210",
	price_range: "$$",
	promise: "FIXED PRICE. FIXED TODAY.",
	emergency_line: "Burst pipe, no hot water, or a leak you can hear? We answer the phone 24/7 —",
	copyright: "© 2026 Aquafix Plumbing LLC",
};
pub const PAGES: &[Page] = &[
	Page {
		path: "/",
		title: "Plumber in Portland — flat price, fixed today",
		description: "Licensed Portland plumbers. Written flat rate before we start, a 2-hour arrival window or the call-out is free, and a 12-month warranty. Published prices for nine jobs.",
		eyebrow: "",
		h1: "Your plumbing fixed today — at a price we agree before we start.",
		lede: "Written flat rate on your doorstep. 2-hour arrival window. 12-month warranty. Late and the call-out is free.",
	},
	Page {
		path: "/prices",
		title: "Every job, every number",
		description: "The full Aquafix price list: nine jobs, real flat rates from our last 500 calls, and the questions everybody asks before booking.",
		eyebrow: "PRICES  ·  AQUAFIX",
		h1: "Every job, every number.",
		lede: "What we charge, why the number never moves, and what happens if the job turns out worse than it looked.",
	},
	Page {
		path: "/guarantee",
		title: "What we actually promise",
		description: "The four things people fear about calling a plumber, the written terms that remove each one, and how an Aquafix job runs start to finish.",
		eyebrow: "GUARANTEE  ·  AQUAFIX",
		h1: "What we actually promise.",
		lede: "The four things people fear about calling a plumber, the terms that remove each one, and how a job runs start to finish.",
	},
	Page {
		path: "/about",
		title: "Four plumbers and a 30-mile radius",
		description: "Who turns up, what they are licensed to do, and exactly where in the Portland metro we will and will not drive.",
		eyebrow: "ABOUT  ·  AQUAFIX",
		h1: "Four plumbers and a 30-mile radius.",
		lede: "Who turns up, what they are licensed to do, and exactly where we will and will not drive.",
	},
];
/// Header and footer navigation. Label plus the route it points at.
pub const NAV: &[(&str, &str)] = &[("Prices", "/prices"), ("Guarantee", "/guarantee"), ("Reviews", "/#reviews"), ("About", "/about")];
pub const HERO_EYEBROW: &str = "LICENSED #PL-40219   ·   $2M INSURED   ·   4,100 JOBS SINCE 2011";
/// The three risk reversals, in the order the evidence ranks them.
pub const HERO_TICKS: &[&str] = &[
	"Flat rate in writing — the number never moves",
	"2-hour arrival window, or the call-out is free",
	"12-month workmanship warranty, parts included",
];
/// `(figure, label)` — the microproof strip under the hero CTA row.
pub const HERO_MICROPROOF: &[(&str, &str)] = &[("★★★★★  4.9", "612 Google reviews"), ("43 min", "average arrival"), ("96%", "fixed same day")];
pub const QUOTE_FORM: QuoteForm = QuoteForm {
	title: "Get your flat price",
	lede: "90 seconds. No obligation, no call-out fee.",
	submit: "Send me my price  →",
	privacy: "Your number is used to send the quote. Nothing else, ever.",
};
/// `(value, label)` for the job `<select>`. The value is what `/quote` stores,
/// so it is a stable slug, not the label.
pub const JOBS: &[(&str, &str)] = &[
	("blocked_drain", "Blocked drain"),
	("burst_pipe", "Burst or leaking pipe"),
	("hot_water", "Hot water"),
	("tap_toilet", "Tap, toilet or cistern"),
	("sewer_line", "Sewer line"),
	("leak_detection", "Leak detection"),
	("repipe", "Whole-house repipe"),
	("fit_out", "Bathroom or kitchen fit-out"),
	("other", "Something else"),
];
pub const PROOF: &[ProofStat] = &[
	ProofStat {
		label: "GOOGLE",
		value: "4.9 ★  ·  612 reviews",
	},
	ProofStat {
		label: "YELP",
		value: "4.8 ★  ·  188 reviews",
	},
	ProofStat {
		label: "BBB",
		value: "A+ accredited since 2013",
	},
	ProofStat {
		label: "STATE LICENCE",
		value: "#PL-40219",
	},
	ProofStat {
		label: "PUBLIC LIABILITY",
		value: "$2,000,000",
	},
	ProofStat {
		label: "EVERY PLUMBER",
		value: "background-checked",
	},
];
/// The Google rating, split out because `ld` needs it as numbers.
pub const RATING: (f64, u32) = (4.9, 612);
pub const PRICES: &[PriceRow] = &[
	PriceRow {
		job: "Blocked drain — machine cleared",
		from_usd: 149,
		typical_time: "45–90 min",
	},
	PriceRow {
		job: "Leaking tap, mixer or cistern",
		from_usd: 129,
		typical_time: "30–60 min",
	},
	PriceRow {
		job: "Toilet repair or full replacement",
		from_usd: 189,
		typical_time: "1–2 hrs",
	},
	PriceRow {
		job: "Hot water system — repair",
		from_usd: 215,
		typical_time: "1–3 hrs",
	},
	PriceRow {
		job: "Hot water system — full replacement",
		from_usd: 1290,
		typical_time: "half day",
	},
	PriceRow {
		job: "Burst or leaking pipe repair",
		from_usd: 265,
		typical_time: "1–3 hrs",
	},
	PriceRow {
		job: "CCTV drain camera inspection",
		from_usd: 199,
		typical_time: "45 min",
	},
	PriceRow {
		job: "Sewer line clear and report",
		from_usd: 390,
		typical_time: "2–4 hrs",
	},
	PriceRow {
		job: "Full repipe — 3 bedroom house",
		from_usd: 4800,
		typical_time: "2–3 days",
	},
];
pub const PRICE_HEAD: (&str, &str, &str) = (
	"NO SURPRISES",
	"What things actually cost.",
	"Real flat rates from our last 500 jobs. Your price is signed on your doorstep before we start, and it does not move.",
);
/// The differentiator: no reference site publishes this. See docs/refs/sites.
pub const PRICE_NOTE: &str =
	"Call-out is $89 and is credited in full against any work you approve. Nights, weekends and public holidays add $60. That is the entire price list — there is nothing else.";
pub const PRICE_NOTE_SHORT: &str = "Call-out $89, credited in full against approved work. Nights and weekends add $60.";
pub const GUARANTEE_HEAD: (&str, &str) = ("THE AQUAFIX GUARANTEE", "Fixed right, or we come back free.");
pub const PILLARS: &[Pillar] = &[
	Pillar {
		n: "01",
		title: "The price cannot move.",
		body: "Your flat rate is signed before work starts. In 4,100 jobs we have never sent an invoice higher than the quote — if we underestimate the job, we absorb it.",
		short: "Signed before work starts. 4,100 jobs, never an invoice above the quote.",
	},
	Pillar {
		n: "02",
		title: "The clock is on us.",
		body: "Two-hour arrival window, chosen by you. Late by a single minute and the $89 call-out is waived automatically — you do not have to ask, and you do not have to argue.",
		short: "Two-hour window. Late by a minute and the $89 call-out is waived automatically.",
	},
	Pillar {
		n: "03",
		title: "The work is warranted.",
		body: "Twelve months on parts and labour. If the same fault comes back we return free of charge, and we still do not charge you a diagnostic fee to look at it.",
		short: "Twelve months, parts and labour. Same fault returns, we come back free.",
	},
];
pub const REVIEWS_HEAD: (&str, &str) = ("612 GOOGLE REVIEWS · 4.9 AVERAGE", "Read the one-star ones too.");
/// The visual target the Elfsight embed replaces at runtime. A four-star review
/// is here on purpose: a perfect wall reads as filtered.
pub const REVIEWS: &[Review] = &[
	Review {
		stars: 5,
		body: "Nate found the leak in twenty minutes after two other companies told me I would have to dig up the driveway. Quoted $265. Charged $265.",
		author: "Sarah K.",
		attrib: "Beaverton · Burst pipe · 2 weeks ago",
	},
	Review {
		stars: 5,
		body: "Booked the 8–10am window, van pulled up at 8:20. New hot water unit in before lunch. The price on the website is the price I actually paid.",
		author: "Danny R.",
		attrib: "SE Portland · Hot water · 1 month ago",
	},
	Review {
		stars: 4,
		body: "Four stars only because they could not come out until the next morning. Everything else was exactly as advertised, right down to the boot covers.",
		author: "Priya M.",
		attrib: "Lake Oswego · Blocked drain · 3 weeks ago",
	},
];
pub const REVIEWS_EMBED_NOTE: &str = "ELFSIGHT GOOGLE REVIEWS WIDGET — LIVE EMBED · RESERVED HEIGHT 400PX · CARDS BELOW ARE THE VISUAL TARGET";
pub const CLOSING: Closing = Closing {
	eyebrow: "LAST THING",
	title: "It is not going to fix itself.",
	lede: "Get the flat price. If you do not like the number you have lost ninety seconds and paid nothing at all.",
	lede_short: "Get the flat price. Do not like the number? You lost ninety seconds.",
};
pub const INLINE_CTA: (&str, &str) = ("Ready for a number? Get your flat price in ninety seconds.", "Get my flat price  →");
/// The one CTA label, so a copy change cannot land on some buttons and not
/// others. `CTA_SHORT` is the same action where the arrow does not fit.
pub const CTA: &str = "Get my flat price  →";
pub const CTA_SHORT: &str = "Get my flat price";
pub const SERVICES_HEAD: (&str, &str, &str) = (
	"WHAT WE DO",
	"Eight jobs. We do them properly and we say no to the rest.",
	"Every price below is the real starting flat rate, confirmed on site before we begin.",
);
pub const SERVICES: &[Service] = &[
	Service {
		name: "Blocked drains",
		from_usd: Some(149),
		body: "Machine cleared, camera checked, and we tell you what caused it so it does not happen again in six weeks.",
	},
	Service {
		name: "Burst & leaking pipes",
		from_usd: Some(265),
		body: "Located acoustically before anything is opened up. No exploratory holes in your walls or driveway.",
	},
	Service {
		name: "Hot water systems",
		from_usd: Some(215),
		body: "We try to repair first. We only recommend replacement when repair is throwing good money after bad.",
	},
	Service {
		name: "Taps, toilets & cisterns",
		from_usd: Some(129),
		body: "The small jobs most plumbers will not drive out for. Same flat-rate promise applies.",
	},
	Service {
		name: "Sewer lines",
		from_usd: Some(390),
		body: "CCTV inspection, clear, and a written report in a format your insurer will accept.",
	},
	Service {
		name: "Leak detection",
		from_usd: Some(199),
		body: "Acoustic and thermal imaging. We find it before we open a wall, not after.",
	},
	Service {
		name: "Whole-house repipes",
		from_usd: Some(4800),
		body: "Staged so you never lose water overnight. Fixed price for the whole job, not per fitting.",
	},
	Service {
		name: "Bathroom & kitchen fit-out",
		from_usd: None,
		body: "Rough-in through to final fix, sequenced around your tiler and cabinetmaker.",
	},
];
pub const FAQ_HEAD: (&str, &str) = ("BEFORE YOU CALL", "The questions everybody asks.");
pub const FAQS: &[Faq] = &[
	Faq {
		q: "Is the $89 call-out on top of the job price?",
		a: "No. It is credited in full against any work you approve. If you approve nothing, the $89 covers the visit and the diagnosis, and that is the entire bill.",
	},
	Faq {
		q: "What if you find something worse once it is open?",
		a: "We stop, show you, and requote before touching anything. You can decline and owe only the amount you already approved. We never do extra work and bill for it afterwards.",
	},
	Faq {
		q: "Do you actually answer at 2am?",
		a: "Yes, and it is a person in Portland rather than an answering service. Emergency call-outs between 9pm and 7am carry a $60 surcharge, quoted to you before we dispatch anyone.",
	},
	Faq {
		q: "Are you licensed and insured?",
		a: "State licence #PL-40219 and $2,000,000 public liability. Every plumber is background-checked. We will email you both certificates before the visit if you want to see them first.",
	},
	Faq {
		q: "How fast can you really get here?",
		a: "Across our last 500 jobs the average emergency arrival was 43 minutes. For non-urgent work, 96% of bookings were attended within 24 hours.",
	},
	Faq {
		q: "What payment do you take?",
		a: "Card, bank transfer or cash on completion. No deposit under $1,000. Finance is available over $2,000 through a third party and we do not mark up the rate.",
	},
];
pub const OBJECTIONS_HEAD: (&str, &str, &str) = (
	"WHY PEOPLE LIVE WITH IT FOR MONTHS",
	"Four reasons you have been putting off the call. We removed all four.",
	"Every one of these is a real thing customers told us before they booked. Each one is now a written term on your job sheet, not a promise on a website.",
);
pub const OBJECTIONS: &[Objection] = &[
	Objection {
		quote: "“They’ll quote me $200 and then charge $700.”",
		answer_title: "We price the job, not the hour.",
		answer_body: "You get a flat rate in writing before a single tool comes out of the van. If it takes us three hours longer than we estimated, that is our problem — you pay the number on the sheet.",
	},
	Objection {
		quote: "“They’ll turn up whenever they feel like it.”",
		answer_title: "A 2-hour window, or the call-out is free.",
		answer_body: "You pick the window. We text you when the van leaves the depot with the plumber’s name and photo. Miss the window and the $89 call-out fee is waived automatically.",
	},
	Objection {
		quote: "“They’ll walk mud through the house.”",
		answer_title: "Boot covers, drop sheets, before-and-after photos.",
		answer_body: "Every job sheet includes photographs of the work area before we start and after we finish. If we leave a mess, you have the evidence.",
	},
	Objection {
		quote: "“It’ll be leaking again by winter.”",
		answer_title: "12 months on parts and labour.",
		answer_body: "If the same fault returns inside a year we come back and fix it at no charge — no diagnostic fee, no argument about whose fault it was.",
	},
];
pub const STEPS_HEAD: (&str, &str) = ("HOW IT WORKS", "Three steps. Nothing to chase.");
pub const STEPS: &[Step] = &[
	Step {
		n: "1",
		title: "You call, or send the form.",
		body: "One sentence about what is wrong. We ask three questions and give you a price band before you hang up.",
	},
	Step {
		n: "2",
		title: "We arrive inside your window.",
		body: "You get a text when the van leaves the depot — the plumber’s name, their photo, and a live ETA.",
	},
	Step {
		n: "3",
		title: "You approve the price. Then we fix it.",
		body: "Nothing is touched until you have seen the flat rate and said yes. 96% of jobs are finished on that first visit.",
	},
];
pub const CREW_HEAD: (&str, &str, &str) = (
	"THE PEOPLE WHO WILL BE IN YOUR HOUSE",
	"Four plumbers. That is the whole company.",
	"No subcontractors, no rotating strangers off an app. You will meet one of these four, and you will know which one before they knock.",
);
pub const CREW: &[Crew] = &[
	Crew {
		initials: "MH",
		name: "Marcus Hale",
		role: "Owner · Master Plumber",
		years: "19 years on the tools",
		licence: "Licence #PL-40219",
	},
	Crew {
		initials: "NE",
		name: "Nate Ellis",
		role: "Lead Plumber",
		years: "11 years on the tools",
		licence: "Licence #PL-51882",
	},
	Crew {
		initials: "DO",
		name: "Deb Ovechi",
		role: "Plumber · Gas Fitter",
		years: "8 years on the tools",
		licence: "Licence #PL-60114",
	},
	Crew {
		initials: "TR",
		name: "Toby Ruiz",
		role: "Apprentice, 3rd year",
		years: "3 years on the tools",
		licence: "Always supervised",
	},
];
pub const AREA_HEAD: (&str, &str, &str) = (
	"SERVICE AREA",
	"Thirty miles of Portland. We turn down everything past it.",
	"A two-hour window we cannot actually hit is worth nothing to you, so we do not sell one. If you are outside the radius we will say so on the phone and point you at someone closer.",
);
/// Rendered as chips and read by `ld` as `areaServed`.
pub const AREAS: &[&str] = &[
	"Portland — all quadrants",
	"Beaverton",
	"Hillsboro",
	"Tigard",
	"Lake Oswego",
	"Gresham",
	"Milwaukie",
	"Tualatin",
	"West Linn",
	"Oregon City",
	"Happy Valley",
	"Clackamas",
	"Vancouver WA",
	"Wilsonville",
	"Sherwood",
	"Forest Grove",
	"Aloha",
	"Cedar Mill",
];
/// Footer link columns: `(heading, [(label, href)])`.
pub const FOOTER_SERVICES: &[(&str, &str)] = &[
	("Blocked drains", "/prices"),
	("Burst pipes", "/prices"),
	("Hot water", "/prices"),
	("Taps & toilets", "/prices"),
	("Sewer lines", "/prices"),
	("Leak detection", "/prices"),
	("Repipes", "/prices"),
];
pub const FOOTER_AREAS: &[&str] = &["Portland", "Beaverton", "Hillsboro", "Lake Oswego", "Gresham", "Tigard", "Vancouver WA"];
pub const FOOTER_COMPANY: &[(&str, &str)] = &[
	("Our guarantee", "/guarantee"),
	("Published prices", "/prices"),
	("Reviews", "/#reviews"),
	("The crew", "/about"),
	("Careers", "/about"),
	("Contact", "/#quote"),
];
pub const FOOTER_FACTS: &[&str] = &[
	"Oregon CCB #221944",
	"State plumbing licence #PL-40219",
	"$2,000,000 public liability",
	"Bonded · every plumber background-checked",
];
pub const FOOTER_LEGAL: &[&str] = &["Privacy", "Terms", "Licence & insurance certificates"];
/// The status pages carry a shorter legal row than the site footer.
pub const STATUS_LEGAL: &[&str] = &["PRIVACY", "TERMS", "CONTACT"];
pub const NOT_FOUND: StatusCopy = StatusCopy {
	code: "404",
	eyebrow: "PAGE NOT FOUND",
	headline: ("This page went ", "down the drain."),
	body: "Moved, renamed, or it never existed. Your plumbing problem has not gone anywhere though — here is the fastest way to get it fixed.",
	primary: Action::Call,
	secondary: Action::Home,
};
pub const FORBIDDEN: StatusCopy = StatusCopy {
	code: "403",
	eyebrow: "ACCESS DENIED",
	headline: ("You need to be ", "signed in."),
	body: "This page is not public. If you are a customer looking for your job sheet, call us and we will read it to you.",
	primary: Action::SignIn,
	secondary: Action::Call,
};
pub const SERVER_ERROR: StatusCopy = StatusCopy {
	code: "500",
	eyebrow: "SERVER ERROR",
	headline: ("Our fault, not yours, ", "and we can still fix your pipes."),
	body: "Something broke on our side. The phone works regardless, and it is answered by a human in Portland 24 hours a day.",
	primary: Action::Call,
	secondary: Action::Retry,
};
/// The strip under every status page — the same three terms as the hero ticks,
/// compressed. A visitor who hit a 404 still gets the offer.
pub const STATUS_STRIP: &[&str] = &["Flat rate in writing", "2-hour arrival window", "12-month warranty"];
pub const THANKS: StatusCopy = StatusCopy {
	code: "✓",
	eyebrow: "REQUEST RECEIVED",
	headline: ("We have it. ", "Your price is on its way."),
	body: "We text your flat price band within 10 minutes between 7am and 9pm. If this is an emergency right now, call us — we pick up 24/7.",
	primary: Action::Call,
	secondary: Action::Home,
};
/// The business. One value; the business card renders from the same facts.
pub struct Site {
	pub legal_name: &'static str,
	pub name: &'static str,
	pub domain: &'static str,
	/// As printed. `tel_href` derives the dialable form.
	pub phone: &'static str,
	pub email_user: &'static str,
	pub licence: &'static str,
	pub ccb: &'static str,
	pub insurance: &'static str,
	pub emergency_hours: &'static str,
	pub booking_hours: &'static str,
	pub radius_miles: u32,
	pub founded: u32,
	pub street: &'static str,
	pub locality: &'static str,
	pub region: &'static str,
	pub postal_code: &'static str,
	pub price_range: &'static str,
	pub promise: &'static str,
	pub emergency_line: &'static str,
	pub copyright: &'static str,
}

impl Site {
	pub fn origin(&self) -> String {
		format!("https://{}", self.domain)
	}

	pub fn url(&self, path: &str) -> String {
		format!("https://{}{}", self.domain, path.trim_end_matches('/'))
	}

	pub fn email(&self) -> String {
		format!("{}@{}", self.email_user, self.domain)
	}

	/// E.164 for `tel:`. Panics on a number that is not 10 US digits — a
	/// mistyped CTA target is the most expensive silent bug on this page.
	pub fn tel_href(&self) -> String {
		let digits: String = self.phone.chars().filter(char::is_ascii_digit).collect();
		assert_eq!(digits.len(), 10, "SITE.phone must be a 10-digit US number, got {:?}", self.phone);
		format!("tel:+1{digits}")
	}
}

//DO: `(503) 555-0148` is the reserved 555 block and `aquafix.top` is unconfirmed
// against the Figma footer's `hello@aquafix.com`. Both resolve here, once,
// before launch — see tmp/site_dev_plans/deploy.md.

// ── routes ───────────────────────────────────────────────────────────────────

/// A crawlable page. The one place a title or description is written.
pub struct Page {
	pub path: &'static str,
	/// `<title>`, the OG title, and the breadcrumb label.
	pub title: &'static str,
	pub description: &'static str,
	/// The eyebrow above the page's `h1`. Empty on `/`, whose eyebrow is the
	/// credential strip.
	pub eyebrow: &'static str,
	pub h1: &'static str,
	pub lede: &'static str,
}

pub fn page(path: &str) -> &'static Page {
	PAGES
		.iter()
		.find(|p| p.path == path)
		.unwrap_or_else(|| panic!("no Page for {path}; every Route arm must have one"))
}

// ── the hero ─────────────────────────────────────────────────────────────────

// ── the quote form ───────────────────────────────────────────────────────────

pub struct QuoteForm {
	pub title: &'static str,
	pub lede: &'static str,
	pub submit: &'static str,
	pub privacy: &'static str,
}

// Prose that names the phone number is a function, not a literal: `SITE.phone`
// is the only place the number is written, and these read it.
pub fn quote_reassurance() -> String {
	format!(
		"We text your price band back within 10 minutes, 7am–9pm. Emergency right now? Call {} — we pick up 24/7.",
		SITE.phone
	)
}

pub fn guarantee_cta_aside() -> String {
	format!("or call {} — a human picks up, 24 hours a day", SITE.phone)
}

pub fn closing_aside() -> String {
	format!("Or call {} — 24 hours, answered by a human in Portland. Average pickup: 11 seconds.", SITE.phone)
}

pub fn call_label() -> String {
	format!("Call {}", SITE.phone)
}

// ── proof ────────────────────────────────────────────────────────────────────

pub struct ProofStat {
	pub label: &'static str,
	pub value: &'static str,
}

// ── prices ───────────────────────────────────────────────────────────────────

pub struct PriceRow {
	pub job: &'static str,
	/// Integer dollars. The rendered `$1,290` is formatted from this, so the
	/// table and the schema.org `Offer` cannot disagree.
	pub from_usd: u32,
	pub typical_time: &'static str,
}
impl PriceRow {
	pub fn from_display(&self) -> String {
		usd(self.from_usd)
	}
}

/// `4800` → `"$4,800"`. The only place a price becomes a string, so the table,
/// the service cards and the schema.org `Offer` cannot disagree.
pub fn usd(n: u32) -> String {
	let d = n.to_string();
	let mut out = String::with_capacity(d.len() + 2);
	for (i, c) in d.chars().enumerate() {
		if i > 0 && (d.len() - i) % 3 == 0 {
			out.push(',');
		}
		out.push(c);
	}
	format!("${out}")
}

// ── the guarantee ────────────────────────────────────────────────────────────

pub struct Pillar {
	pub n: &'static str,
	pub title: &'static str,
	pub body: &'static str,
	/// The mobile frame carries genuinely shorter copy, so it is a field rather
	/// than a second literal behind a breakpoint class.
	pub short: &'static str,
}

// ── reviews ──────────────────────────────────────────────────────────────────

pub struct Review {
	pub stars: u8,
	pub body: &'static str,
	pub author: &'static str,
	pub attrib: &'static str,
}

// ── the closing band ─────────────────────────────────────────────────────────

pub struct Closing {
	pub eyebrow: &'static str,
	pub title: &'static str,
	pub lede: &'static str,
	pub lede_short: &'static str,
}

// ── /prices ──────────────────────────────────────────────────────────────────

pub struct Service {
	pub name: &'static str,
	/// `None` renders "quoted" — a fit-out has no starting flat rate.
	pub from_usd: Option<u32>,
	pub body: &'static str,
}

impl Service {
	pub fn from_display(&self) -> String {
		match self.from_usd {
			Some(n) => format!("from {}", usd(n)),
			None => "quoted".to_string(),
		}
	}
}

pub struct Faq {
	pub q: &'static str,
	pub a: &'static str,
}

// ── /guarantee ───────────────────────────────────────────────────────────────

pub struct Objection {
	/// What a customer said, before they booked.
	pub quote: &'static str,
	pub answer_title: &'static str,
	pub answer_body: &'static str,
}

pub struct Step {
	pub n: &'static str,
	pub title: &'static str,
	pub body: &'static str,
}

// ── /about ───────────────────────────────────────────────────────────────────

pub struct Crew {
	pub initials: &'static str,
	pub name: &'static str,
	pub role: &'static str,
	pub years: &'static str,
	pub licence: &'static str,
}

// ── the footer ───────────────────────────────────────────────────────────────

// ── status pages ─────────────────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq)]
pub struct StatusCopy {
	pub code: &'static str,
	pub eyebrow: &'static str,
	/// Split at the copper half, which is how the design draws it.
	pub headline: (&'static str, &'static str),
	pub body: &'static str,
	pub primary: Action,
	pub secondary: Action,
}

/// A status page's two buttons. An enum, not a label, because each carries its
/// own href — and because `Call` must read `SITE.phone` rather than repeat it.
#[derive(Clone, Copy, PartialEq)]
pub enum Action {
	Call,
	Home,
	SignIn,
	Retry,
}

impl Action {
	pub fn label(self) -> String {
		match self {
			Action::Call => call_label(),
			Action::Home => "← Back to home".into(),
			Action::SignIn => "Sign in".into(),
			Action::Retry => "Try again".into(),
		}
	}

	pub fn href(self) -> String {
		match self {
			Action::Call => SITE.tel_href(),
			Action::Home | Action::SignIn | Action::Retry => "/".into(),
		}
	}
}
