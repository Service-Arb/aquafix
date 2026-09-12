//! Every fact and every string the site shows, once per language.
//!
//! A section function takes its slice of this and nothing else; there is no
//! literal copy inside an `rsx!`. `seo` and `ld` read the same values, so a
//! description in the `<head>`, in the OG card and in the sitemap is one field
//! read three times.
//!
//! Copy is transcribed from Figma `hn1D34By2eYTsakhzDWWkV`, which was written
//! against the graded conversion evidence in `docs/refs/sites/README.md`.
//! Improving it here silently detaches it from that argument. [`FR`] is a
//! translation of that graded copy, not a second grading of it: it carries the
//! same argument in another language and does not re-derive it.
//!
//! [`SITE`] and [`RATING`] are the language-free half — a price, a licence
//! number, a slug is written once and read by both [`EN`] and [`FR`].

pub const SITE: Site = Site {
	legal_name: "Aquafix Plumbing LLC",
	name: "Aquafix",
	domain: "aquafix.top",
	phone: "(503) 555-0148",
	email_user: "hello",
	licence: "#PL-40219",
	ccb: "#221944",
	insurance: "$2,000,000",
	radius_miles: 30,
	founded: 2011,
	street: "2140 NW Industrial St",
	locality: "Portland",
	region: "OR",
	postal_code: "97210",
	price_range: "$$",
	copyright: "© 2026 Aquafix Plumbing LLC",
};

/// The Google rating, split out because `ld` needs it as numbers.
pub const RATING: (f64, u32) = (4.9, 612);

// ── language ─────────────────────────────────────────────────────────────────

pub const LANGS: &[Lang] = &[Lang::En, Lang::Fr];
pub const EN: Text = Text {
	pages: &[
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
	],
	nav: &[("Prices", "/prices"), ("Guarantee", "/guarantee"), ("Reviews", "/#reviews"), ("About", "/about")],
	promise: "FIXED PRICE. FIXED TODAY.",
	emergency_line: "Burst pipe, no hot water, or a leak you can hear? We answer the phone 24/7 —",
	emergency_hours: "Emergencies — 24 hours, 7 days",
	booking_hours: "Bookings — 7am to 9pm daily",
	hero_eyebrow: "LICENSED #PL-40219   ·   $2M INSURED   ·   4,100 JOBS SINCE 2011",
	hero_ticks: &[
		"Flat rate in writing — the number never moves",
		"2-hour arrival window, or the call-out is free",
		"12-month workmanship warranty, parts included",
	],
	hero_microproof: &[("★★★★★  4.9", "612 Google reviews"), ("43 min", "average arrival"), ("96%", "fixed same day")],
	header_phone_label: "24/7 · ANSWERED BY A HUMAN",
	quote_form: QuoteForm {
		title: "Get your flat price",
		lede: "90 seconds. No obligation, no call-out fee.",
		submit: "Send me my price  →",
		privacy: "Your number is used to send the quote. Nothing else, ever.",
		reassurance: ("We text your price band back within 10 minutes, 7am–9pm. Emergency right now? Call ", " — we pick up 24/7."),
		job_label: "WHAT'S WRONG?",
		zip_label: "WHERE ARE YOU?",
		mobile_label: "MOBILE",
		zip_placeholder: "Suburb or ZIP code",
		zip_placeholder_short: "ZIP code",
		mobile_placeholder: "(503) 000-0000",
		mobile_placeholder_short: "Mobile number",
	},
	jobs: &[
		("blocked_drain", "Blocked drain"),
		("burst_pipe", "Burst or leaking pipe"),
		("hot_water", "Hot water"),
		("tap_toilet", "Tap, toilet or cistern"),
		("sewer_line", "Sewer line"),
		("leak_detection", "Leak detection"),
		("repipe", "Whole-house repipe"),
		("fit_out", "Bathroom or kitchen fit-out"),
		("other", "Something else"),
	],
	proof: &[
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
	],
	prices: &[
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
	],
	price_head: (
		"NO SURPRISES",
		"What things actually cost.",
		"Real flat rates from our last 500 jobs. Your price is signed on your doorstep before we start, and it does not move.",
	),
	price_columns: ("JOB", "FLAT PRICE FROM", "TYPICAL TIME ON SITE"),
	price_note: "Call-out is $89 and is credited in full against any work you approve. Nights, weekends and public holidays add $60. That is the entire price list — there is nothing else.",
	price_note_short: "Call-out $89, credited in full against approved work. Nights and weekends add $60.",
	guarantee_head: ("THE AQUAFIX GUARANTEE", "Fixed right, or we come back free."),
	pillars: &[
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
	],
	reviews_head: ("612 GOOGLE REVIEWS · 4.9 AVERAGE", "Read the one-star ones too."),
	reviews: &[
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
	],
	reviews_embed_note: "ELFSIGHT GOOGLE REVIEWS WIDGET — LIVE EMBED · RESERVED HEIGHT 400PX · CARDS BELOW ARE THE VISUAL TARGET",
	closing: Closing {
		eyebrow: "LAST THING",
		title: "It is not going to fix itself.",
		lede: "Get the flat price. If you do not like the number you have lost ninety seconds and paid nothing at all.",
		lede_short: "Get the flat price. Do not like the number? You lost ninety seconds.",
	},
	inline_cta: ("Ready for a number? Get your flat price in ninety seconds.", "Get my flat price  →"),
	cta: "Get my flat price  →",
	cta_short: "Get my flat price",
	services_head: (
		"WHAT WE DO",
		"Eight jobs. We do them properly and we say no to the rest.",
		"Every price below is the real starting flat rate, confirmed on site before we begin.",
	),
	services: &[
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
	],
	services_from: "from",
	services_quoted: "quoted",
	faq_head: ("BEFORE YOU CALL", "The questions everybody asks."),
	faqs: &[
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
	],
	objections_head: (
		"WHY PEOPLE LIVE WITH IT FOR MONTHS",
		"Four reasons you have been putting off the call. We removed all four.",
		"Every one of these is a real thing customers told us before they booked. Each one is now a written term on your job sheet, not a promise on a website.",
	),
	objections: &[
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
	],
	steps_head: ("HOW IT WORKS", "Three steps. Nothing to chase."),
	steps: &[
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
	],
	crew_head: (
		"THE PEOPLE WHO WILL BE IN YOUR HOUSE",
		"Four plumbers. That is the whole company.",
		"No subcontractors, no rotating strangers off an app. You will meet one of these four, and you will know which one before they knock.",
	),
	crew: &[
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
	],
	area_head: (
		"SERVICE AREA",
		"Thirty miles of Portland. We turn down everything past it.",
		"A two-hour window we cannot actually hit is worth nothing to you, so we do not sell one. If you are outside the radius we will say so on the phone and point you at someone closer.",
	),
	areas: &[
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
	],
	footer_columns: ("SERVICES", "AREAS", "COMPANY", "CONTACT"),
	footer_services: &[
		("Blocked drains", "/prices"),
		("Burst pipes", "/prices"),
		("Hot water", "/prices"),
		("Taps & toilets", "/prices"),
		("Sewer lines", "/prices"),
		("Leak detection", "/prices"),
		("Repipes", "/prices"),
	],
	footer_areas: &["Portland", "Beaverton", "Hillsboro", "Lake Oswego", "Gresham", "Tigard", "Vancouver WA"],
	footer_company: &[
		("Our guarantee", "/guarantee"),
		("Published prices", "/prices"),
		("Reviews", "/#reviews"),
		("The crew", "/about"),
		("Careers", "/about"),
		("Contact", "/#quote"),
	],
	footer_facts: &[
		"Oregon CCB #221944",
		"State plumbing licence #PL-40219",
		"$2,000,000 public liability",
		"Bonded · every plumber background-checked",
	],
	footer_legal: &["Privacy", "Terms", "Licence & insurance certificates"],
	status_legal: &["PRIVACY", "TERMS", "CONTACT"],
	status_strip: &["Flat rate in writing", "2-hour arrival window", "12-month warranty"],
	not_found: StatusCopy {
		code: "404",
		title: "Page not found",
		eyebrow: "PAGE NOT FOUND",
		headline: ("This page went ", "down the drain."),
		body: "Moved, renamed, or it never existed. Your plumbing problem has not gone anywhere though — here is the fastest way to get it fixed.",
		primary: Action::Call,
		secondary: Action::Home,
	},
	forbidden: StatusCopy {
		code: "403",
		title: "Access denied",
		eyebrow: "ACCESS DENIED",
		headline: ("You need to be ", "signed in."),
		body: "This page is not public. If you are a customer looking for your job sheet, call us and we will read it to you.",
		primary: Action::SignIn,
		secondary: Action::Call,
	},
	server_error: StatusCopy {
		code: "500",
		title: "Server error",
		eyebrow: "SERVER ERROR",
		headline: ("Our fault, not yours, ", "and we can still fix your pipes."),
		body: "Something broke on our side. The phone works regardless, and it is answered by a human in Portland 24 hours a day.",
		primary: Action::Call,
		secondary: Action::Retry,
	},
	thanks: StatusCopy {
		code: "✓",
		title: "Request received",
		eyebrow: "REQUEST RECEIVED",
		headline: ("We have it. ", "Your price is on its way."),
		body: "We text your flat price band within 10 minutes between 7am and 9pm. If this is an emergency right now, call us — we pick up 24/7.",
		primary: Action::Call,
		secondary: Action::Home,
	},
	back_home: "← Back to home",
	sign_in: "Sign in",
	try_again: "Try again",
	call_label: ("Call ", ""),
	guarantee_cta_aside: ("or call ", " — a human picks up, 24 hours a day"),
	closing_aside: ("Or call ", " — 24 hours, answered by a human in Portland. Average pickup: 11 seconds."),
};
pub const FR: Text = Text {
	pages: &[
		Page {
			path: "/",
			title: "Plombier à Portland — prix fixe, réparé aujourd’hui",
			description: "Plombiers licenciés à Portland. Tarif fixe écrit avant de commencer, une fenêtre d’arrivée de 2 heures ou le déplacement est offert, et une garantie de 12 mois. Prix publiés pour neuf interventions.",
			eyebrow: "",
			h1: "Votre plomberie réparée aujourd’hui — au prix convenu avant que nous commencions.",
			lede: "Tarif fixe écrit sur votre pas de porte. Fenêtre d’arrivée de 2 heures. Garantie 12 mois. En retard et le déplacement est offert.",
		},
		Page {
			path: "/prices",
			title: "Chaque intervention, chaque chiffre",
			description: "La liste complète des prix Aquafix : neuf interventions, de vrais tarifs fixes issus de nos 500 derniers appels, et les questions que tout le monde pose avant de réserver.",
			eyebrow: "PRIX  ·  AQUAFIX",
			h1: "Chaque intervention, chaque chiffre.",
			lede: "Ce que nous facturons, pourquoi le chiffre ne bouge jamais, et ce qui se passe si l’intervention s’avère pire qu’elle n’en avait l’air.",
		},
		Page {
			path: "/guarantee",
			title: "Ce que nous promettons vraiment",
			description: "Les quatre craintes que l’on a en appelant un plombier, les conditions écrites qui suppriment chacune d’elles, et le déroulement d’une intervention Aquafix du début à la fin.",
			eyebrow: "GARANTIE  ·  AQUAFIX",
			h1: "Ce que nous promettons vraiment.",
			lede: "Les quatre craintes que l’on a en appelant un plombier, les conditions qui suppriment chacune d’elles, et le déroulement d’une intervention.",
		},
		Page {
			path: "/about",
			title: "Quatre plombiers et un rayon de 30 miles",
			description: "Qui se présente chez vous, ce qu’ils sont licenciés à faire, et exactement où dans la métropole de Portland nous acceptons — ou refusons — de conduire.",
			eyebrow: "À PROPOS  ·  AQUAFIX",
			h1: "Quatre plombiers et un rayon de 30 miles.",
			lede: "Qui se présente, ce qu’ils sont licenciés à faire, et exactement où nous acceptons — ou refusons — de conduire.",
		},
	],
	nav: &[("Prix", "/prices"), ("Garantie", "/guarantee"), ("Avis", "/#reviews"), ("À propos", "/about")],
	promise: "PRIX FIXE. RÉPARÉ AUJOURD’HUI.",
	emergency_line: "Tuyau éclaté, plus d’eau chaude, ou une fuite que vous entendez ? Nous répondons 24h/24, 7j/7 —",
	emergency_hours: "Urgences — 24 heures sur 24, 7 jours sur 7",
	booking_hours: "Réservations — de 7h à 21h, tous les jours",
	hero_eyebrow: "LICENCE #PL-40219   ·   ASSURÉ 2 M$   ·   4 100 INTERVENTIONS DEPUIS 2011",
	hero_ticks: &[
		"Tarif fixe par écrit — le chiffre ne bouge jamais",
		"Fenêtre d’arrivée de 2 heures, ou le déplacement est offert",
		"Garantie de main-d’œuvre 12 mois, pièces comprises",
	],
	hero_microproof: &[("★★★★★  4,9", "612 avis Google"), ("43 min", "arrivée moyenne"), ("96 %", "réparé le jour même")],
	header_phone_label: "24/7 · UN HUMAIN RÉPOND",
	quote_form: QuoteForm {
		title: "Obtenez votre prix fixe",
		lede: "90 secondes. Sans engagement, sans frais de déplacement.",
		submit: "Envoyez-moi mon prix  →",
		privacy: "Votre numéro sert à envoyer le devis. Rien d’autre, jamais.",
		reassurance: (
			"Nous vous envoyons votre fourchette de prix par SMS sous 10 minutes, de 7h à 21h. Urgence immédiate ? Appelez le ",
			" — nous décrochons 24h/24.",
		),
		job_label: "QUEL EST LE PROBLÈME ?",
		zip_label: "OÙ ÊTES-VOUS ?",
		mobile_label: "MOBILE",
		zip_placeholder: "Quartier ou code postal",
		zip_placeholder_short: "Code postal",
		mobile_placeholder: "(503) 000-0000",
		mobile_placeholder_short: "Numéro de mobile",
	},
	jobs: &[
		("blocked_drain", "Canalisation bouchée"),
		("burst_pipe", "Tuyau éclaté ou qui fuit"),
		("hot_water", "Eau chaude"),
		("tap_toilet", "Robinet, WC ou chasse d’eau"),
		("sewer_line", "Conduite d’égout"),
		("leak_detection", "Détection de fuite"),
		("repipe", "Retubage complet de la maison"),
		("fit_out", "Aménagement salle de bains ou cuisine"),
		("other", "Autre chose"),
	],
	proof: &[
		ProofStat {
			label: "GOOGLE",
			value: "4,9 ★  ·  612 avis",
		},
		ProofStat {
			label: "YELP",
			value: "4,8 ★  ·  188 avis",
		},
		ProofStat {
			label: "BBB",
			value: "Accrédité A+ depuis 2013",
		},
		ProofStat {
			label: "LICENCE D’ÉTAT",
			value: "#PL-40219",
		},
		ProofStat {
			label: "RESPONSABILITÉ CIVILE",
			value: "2 000 000 $",
		},
		ProofStat {
			label: "CHAQUE PLOMBIER",
			value: "antécédents vérifiés",
		},
	],
	prices: &[
		PriceRow {
			job: "Canalisation bouchée — débouchage mécanique",
			from_usd: 149,
			typical_time: "45–90 min",
		},
		PriceRow {
			job: "Robinet, mitigeur ou chasse d’eau qui fuit",
			from_usd: 129,
			typical_time: "30–60 min",
		},
		PriceRow {
			job: "Réparation ou remplacement complet de WC",
			from_usd: 189,
			typical_time: "1–2 h",
		},
		PriceRow {
			job: "Chauffe-eau — réparation",
			from_usd: 215,
			typical_time: "1–3 h",
		},
		PriceRow {
			job: "Chauffe-eau — remplacement complet",
			from_usd: 1290,
			typical_time: "une demi-journée",
		},
		PriceRow {
			job: "Réparation de tuyau éclaté ou qui fuit",
			from_usd: 265,
			typical_time: "1–3 h",
		},
		PriceRow {
			job: "Inspection caméra de canalisation",
			from_usd: 199,
			typical_time: "45 min",
		},
		PriceRow {
			job: "Débouchage d’égout et rapport",
			from_usd: 390,
			typical_time: "2–4 h",
		},
		PriceRow {
			job: "Retubage complet — maison de 3 chambres",
			from_usd: 4800,
			typical_time: "2–3 jours",
		},
	],
	price_head: (
		"AUCUNE SURPRISE",
		"Ce que les choses coûtent vraiment.",
		"De vrais tarifs fixes issus de nos 500 dernières interventions. Votre prix est signé sur votre pas de porte avant que nous commencions, et il ne bouge pas.",
	),
	price_columns: ("INTERVENTION", "PRIX FIXE À PARTIR DE", "DURÉE TYPIQUE SUR PLACE"),
	price_note: "Le déplacement est de 89 $ et il est intégralement déduit de tout travail que vous approuvez. Les nuits, week-ends et jours fériés ajoutent 60 $. Voilà toute la liste des prix — il n’y a rien d’autre.",
	price_note_short: "Déplacement 89 $, intégralement déduit des travaux approuvés. Nuits et week-ends : 60 $ de plus.",
	guarantee_head: ("LA GARANTIE AQUAFIX", "Bien réparé, ou nous revenons gratuitement."),
	pillars: &[
		Pillar {
			n: "01",
			title: "Le prix ne peut pas bouger.",
			body: "Votre tarif fixe est signé avant le début des travaux. Sur 4 100 interventions, nous n’avons jamais envoyé de facture supérieure au devis — si nous sous-estimons l’intervention, nous absorbons la différence.",
			short: "Signé avant le début des travaux. 4 100 interventions, jamais de facture au-dessus du devis.",
		},
		Pillar {
			n: "02",
			title: "Le chrono est à notre charge.",
			body: "Fenêtre d’arrivée de deux heures, choisie par vous. Une seule minute de retard et les 89 $ de déplacement sont annulés automatiquement — vous n’avez ni à le demander ni à discuter.",
			short: "Fenêtre de deux heures. Une minute de retard et les 89 $ de déplacement sautent automatiquement.",
		},
		Pillar {
			n: "03",
			title: "Le travail est garanti.",
			body: "Douze mois sur les pièces et la main-d’œuvre. Si la même panne revient, nous revenons gratuitement, et nous ne vous facturons toujours pas de frais de diagnostic pour l’examiner.",
			short: "Douze mois, pièces et main-d’œuvre. La même panne revient, nous revenons gratuitement.",
		},
	],
	reviews_head: ("612 AVIS GOOGLE · 4,9 DE MOYENNE", "Lisez aussi ceux à une étoile."),
	reviews: &[
		Review {
			stars: 5,
			body: "Nate a trouvé la fuite en vingt minutes, après que deux autres entreprises m’ont dit qu’il faudrait creuser l’allée. Devis 265 $. Facturé 265 $.",
			author: "Sarah K.",
			attrib: "Beaverton · Tuyau éclaté · il y a 2 semaines",
		},
		Review {
			stars: 5,
			body: "J’ai réservé la fenêtre 8h–10h, la camionnette s’est garée à 8h20. Nouveau chauffe-eau posé avant midi. Le prix affiché sur le site est celui que j’ai payé.",
			author: "Danny R.",
			attrib: "SE Portland · Eau chaude · il y a 1 mois",
		},
		Review {
			stars: 4,
			body: "Quatre étoiles seulement parce qu’ils n’ont pas pu venir avant le lendemain matin. Tout le reste était exactement comme annoncé, jusqu’aux surchaussures.",
			author: "Priya M.",
			attrib: "Lake Oswego · Canalisation bouchée · il y a 3 semaines",
		},
	],
	reviews_embed_note: "WIDGET AVIS GOOGLE ELFSIGHT — INTÉGRATION EN DIRECT · HAUTEUR RÉSERVÉE 400PX · LES CARTES CI-DESSOUS SONT LA CIBLE VISUELLE",
	closing: Closing {
		eyebrow: "DERNIÈRE CHOSE",
		title: "Ça ne va pas se réparer tout seul.",
		lede: "Obtenez le prix fixe. Si le chiffre ne vous plaît pas, vous aurez perdu quatre-vingt-dix secondes et payé absolument rien.",
		lede_short: "Obtenez le prix fixe. Le chiffre ne vous plaît pas ? Vous avez perdu quatre-vingt-dix secondes.",
	},
	inline_cta: ("Prêt pour un chiffre ? Obtenez votre prix fixe en quatre-vingt-dix secondes.", "Obtenir mon prix fixe  →"),
	cta: "Obtenir mon prix fixe  →",
	cta_short: "Obtenir mon prix fixe",
	services_head: (
		"CE QUE NOUS FAISONS",
		"Huit interventions. Nous les faisons bien et nous refusons le reste.",
		"Chaque prix ci-dessous est le vrai tarif fixe de départ, confirmé sur place avant que nous commencions.",
	),
	services: &[
		Service {
			name: "Canalisations bouchées",
			from_usd: Some(149),
			body: "Débouchage mécanique, contrôle caméra, et nous vous disons ce qui l’a causé pour que cela ne recommence pas dans six semaines.",
		},
		Service {
			name: "Tuyaux éclatés et fuites",
			from_usd: Some(265),
			body: "Localisés acoustiquement avant toute ouverture. Aucun trou d’exploration dans vos murs ou votre allée.",
		},
		Service {
			name: "Chauffe-eau",
			from_usd: Some(215),
			body: "Nous essayons d’abord de réparer. Nous ne recommandons le remplacement que lorsque réparer revient à jeter de l’argent par les fenêtres.",
		},
		Service {
			name: "Robinets, WC et chasses d’eau",
			from_usd: Some(129),
			body: "Les petites interventions pour lesquelles la plupart des plombiers ne se déplacent pas. La même promesse de tarif fixe s’applique.",
		},
		Service {
			name: "Conduites d’égout",
			from_usd: Some(390),
			body: "Inspection caméra, débouchage, et un rapport écrit dans un format que votre assureur acceptera.",
		},
		Service {
			name: "Détection de fuite",
			from_usd: Some(199),
			body: "Acoustique et imagerie thermique. Nous la trouvons avant d’ouvrir un mur, pas après.",
		},
		Service {
			name: "Retubage de maison complète",
			from_usd: Some(4800),
			body: "Échelonné pour que vous ne soyez jamais sans eau la nuit. Prix fixe pour tout le chantier, pas au raccord.",
		},
		Service {
			name: "Aménagement salle de bains et cuisine",
			from_usd: None,
			body: "Du gros œuvre à la finition, séquencé autour de votre carreleur et de votre cuisiniste.",
		},
	],
	services_from: "à partir de",
	services_quoted: "sur devis",
	faq_head: ("AVANT D’APPELER", "Les questions que tout le monde pose."),
	faqs: &[
		Faq {
			q: "Les 89 $ de déplacement s’ajoutent-ils au prix de l’intervention ?",
			a: "Non. Ils sont intégralement déduits de tout travail que vous approuvez. Si vous n’approuvez rien, les 89 $ couvrent la visite et le diagnostic, et c’est toute la facture.",
		},
		Faq {
			q: "Et si vous trouvez pire une fois que c’est ouvert ?",
			a: "Nous arrêtons, nous vous montrons, et nous refaisons un devis avant de toucher à quoi que ce soit. Vous pouvez refuser et ne devez que le montant déjà approuvé. Nous ne faisons jamais de travaux supplémentaires pour les facturer après coup.",
		},
		Faq {
			q: "Répondez-vous vraiment à 2h du matin ?",
			a: "Oui, et c’est une personne à Portland plutôt qu’un service de permanence. Les déplacements d’urgence entre 21h et 7h comportent un supplément de 60 $, annoncé avant que nous envoyions quelqu’un.",
		},
		Faq {
			q: "Êtes-vous licenciés et assurés ?",
			a: "Licence d’État #PL-40219 et 2 000 000 $ de responsabilité civile. Chaque plombier fait l’objet d’une vérification d’antécédents. Nous vous enverrons les deux attestations par e-mail avant la visite si vous voulez les voir d’abord.",
		},
		Faq {
			q: "En combien de temps pouvez-vous vraiment arriver ?",
			a: "Sur nos 500 dernières interventions, l’arrivée d’urgence moyenne était de 43 minutes. Pour les travaux non urgents, 96 % des réservations ont été honorées sous 24 heures.",
		},
		Faq {
			q: "Quels moyens de paiement acceptez-vous ?",
			a: "Carte, virement ou espèces à la fin. Aucun acompte en dessous de 1 000 $. Un financement est disponible au-delà de 2 000 $ via un tiers et nous ne majorons pas le taux.",
		},
	],
	objections_head: (
		"POURQUOI LES GENS VIVENT AVEC PENDANT DES MOIS",
		"Quatre raisons qui vous font repousser l’appel. Nous les avons toutes les quatre supprimées.",
		"Chacune est une chose que des clients nous ont réellement dite avant de réserver. Chacune est désormais une condition écrite sur votre bon d’intervention, pas une promesse sur un site web.",
	),
	objections: &[
		Objection {
			quote: "« Ils vont me faire un devis à 200 $ et me facturer 700 $. »",
			answer_title: "Nous facturons l’intervention, pas l’heure.",
			answer_body: "Vous obtenez un tarif fixe par écrit avant qu’un seul outil ne sorte de la camionnette. Si cela nous prend trois heures de plus que prévu, c’est notre problème — vous payez le chiffre inscrit sur le bon.",
		},
		Objection {
			quote: "« Ils viendront quand ça leur chantera. »",
			answer_title: "Une fenêtre de 2 heures, ou le déplacement est offert.",
			answer_body: "C’est vous qui choisissez la fenêtre. Nous vous envoyons un SMS au départ de la camionnette, avec le nom et la photo du plombier. Fenêtre manquée et les 89 $ de déplacement sont annulés automatiquement.",
		},
		Objection {
			quote: "« Ils vont traîner de la boue dans toute la maison. »",
			answer_title: "Surchaussures, bâches de protection, photos avant-après.",
			answer_body: "Chaque bon d’intervention comprend des photographies de la zone de travail avant que nous commencions et après que nous avons fini. Si nous laissons du désordre, vous avez la preuve.",
		},
		Objection {
			quote: "« Ça fuira de nouveau avant l’hiver. »",
			answer_title: "12 mois sur les pièces et la main-d’œuvre.",
			answer_body: "Si la même panne revient dans l’année, nous revenons la réparer sans frais — pas de frais de diagnostic, pas de discussion sur la responsabilité.",
		},
	],
	steps_head: ("COMMENT ÇA MARCHE", "Trois étapes. Rien à relancer."),
	steps: &[
		Step {
			n: "1",
			title: "Vous appelez, ou vous envoyez le formulaire.",
			body: "Une phrase sur ce qui ne va pas. Nous posons trois questions et vous donnons une fourchette de prix avant que vous raccrochiez.",
		},
		Step {
			n: "2",
			title: "Nous arrivons dans votre fenêtre.",
			body: "Vous recevez un SMS au départ de la camionnette — le nom du plombier, sa photo, et une heure d’arrivée en direct.",
		},
		Step {
			n: "3",
			title: "Vous approuvez le prix. Ensuite nous réparons.",
			body: "Rien n’est touché tant que vous n’avez pas vu le tarif fixe et dit oui. 96 % des interventions sont terminées dès cette première visite.",
		},
	],
	crew_head: (
		"LES PERSONNES QUI SERONT CHEZ VOUS",
		"Quatre plombiers. C’est toute l’entreprise.",
		"Pas de sous-traitants, pas d’inconnus qui tournent via une appli. Vous rencontrerez l’un de ces quatre-là, et vous saurez lequel avant qu’il ne frappe.",
	),
	crew: &[
		Crew {
			initials: "MH",
			name: "Marcus Hale",
			role: "Propriétaire · Maître plombier",
			years: "19 ans sur le terrain",
			licence: "Licence #PL-40219",
		},
		Crew {
			initials: "NE",
			name: "Nate Ellis",
			role: "Plombier principal",
			years: "11 ans sur le terrain",
			licence: "Licence #PL-51882",
		},
		Crew {
			initials: "DO",
			name: "Deb Ovechi",
			role: "Plombier · Gazier",
			years: "8 ans sur le terrain",
			licence: "Licence #PL-60114",
		},
		Crew {
			initials: "TR",
			name: "Toby Ruiz",
			role: "Apprenti, 3e année",
			years: "3 ans sur le terrain",
			licence: "Toujours supervisé",
		},
	],
	area_head: (
		"ZONE D’INTERVENTION",
		"Trente miles autour de Portland. Nous refusons tout ce qui est au-delà.",
		"Une fenêtre de deux heures que nous ne pouvons pas tenir ne vaut rien pour vous, alors nous ne la vendons pas. Si vous êtes hors du rayon, nous vous le dirons au téléphone et nous vous orienterons vers quelqu’un de plus proche.",
	),
	areas: &[
		"Portland — tous les quadrants",
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
	],
	footer_columns: ("SERVICES", "ZONES", "ENTREPRISE", "CONTACT"),
	footer_services: &[
		("Canalisations bouchées", "/prices"),
		("Tuyaux éclatés", "/prices"),
		("Eau chaude", "/prices"),
		("Robinets et WC", "/prices"),
		("Conduites d’égout", "/prices"),
		("Détection de fuite", "/prices"),
		("Retubages", "/prices"),
	],
	footer_areas: &["Portland", "Beaverton", "Hillsboro", "Lake Oswego", "Gresham", "Tigard", "Vancouver WA"],
	footer_company: &[
		("Notre garantie", "/guarantee"),
		("Prix publiés", "/prices"),
		("Avis", "/#reviews"),
		("L’équipe", "/about"),
		("Recrutement", "/about"),
		("Contact", "/#quote"),
	],
	footer_facts: &[
		"Oregon CCB #221944",
		"Licence de plomberie d’État #PL-40219",
		"2 000 000 $ de responsabilité civile",
		"Cautionné · antécédents vérifiés pour chaque plombier",
	],
	footer_legal: &["Confidentialité", "Conditions", "Attestations de licence et d’assurance"],
	status_legal: &["CONFIDENTIALITÉ", "CONDITIONS", "CONTACT"],
	status_strip: &["Tarif fixe par écrit", "Fenêtre d’arrivée de 2 heures", "Garantie 12 mois"],
	not_found: StatusCopy {
		code: "404",
		title: "Page introuvable",
		eyebrow: "PAGE INTROUVABLE",
		headline: ("Cette page est partie ", "dans les tuyaux."),
		body: "Déplacée, renommée, ou elle n’a jamais existé. Votre problème de plomberie, lui, n’a bougé nulle part — voici le chemin le plus rapide pour le faire réparer.",
		primary: Action::Call,
		secondary: Action::Home,
	},
	forbidden: StatusCopy {
		code: "403",
		title: "Accès refusé",
		eyebrow: "ACCÈS REFUSÉ",
		headline: ("Vous devez être ", "connecté."),
		body: "Cette page n’est pas publique. Si vous êtes un client à la recherche de son bon d’intervention, appelez-nous et nous vous le lirons.",
		primary: Action::SignIn,
		secondary: Action::Call,
	},
	server_error: StatusCopy {
		code: "500",
		title: "Erreur serveur",
		eyebrow: "ERREUR SERVEUR",
		headline: ("Notre faute, pas la vôtre, ", "et nous pouvons toujours réparer vos tuyaux."),
		body: "Quelque chose a cassé de notre côté. Le téléphone fonctionne quand même, et un humain à Portland y répond 24 heures sur 24.",
		primary: Action::Call,
		secondary: Action::Retry,
	},
	thanks: StatusCopy {
		code: "✓",
		title: "Demande reçue",
		eyebrow: "DEMANDE REÇUE",
		headline: ("Nous l’avons. ", "Votre prix arrive."),
		body: "Nous envoyons votre fourchette de prix fixe par SMS sous 10 minutes, entre 7h et 21h. Si c’est une urgence maintenant, appelez-nous — nous décrochons 24h/24.",
		primary: Action::Call,
		secondary: Action::Home,
	},
	back_home: "← Retour à l’accueil",
	sign_in: "Se connecter",
	try_again: "Réessayer",
	call_label: ("Appeler le ", ""),
	guarantee_cta_aside: ("ou appelez le ", " — un humain décroche, 24 heures sur 24"),
	closing_aside: ("Ou appelez le ", " — 24 heures sur 24, un humain à Portland répond. Décrochage moyen : 11 secondes."),
};
/// English is the default and its URLs carry no prefix; French is served under
/// `/fr`. Slugs stay English in both — `Page.path` is the one key `page()`, the
/// sitemap, `ld::breadcrumbs` and the route table all share.
#[derive(Clone, Copy, Debug, Default, Eq, Hash, PartialEq)]
pub enum Lang {
	#[default]
	En,
	Fr,
}
impl Lang {
	pub fn text(self) -> &'static Text {
		match self {
			Lang::En => &EN,
			Lang::Fr => &FR,
		}
	}

	/// `""` for the default language — the canonical URL carries no prefix.
	pub fn prefix(self) -> &'static str {
		match self {
			Lang::En => "",
			Lang::Fr => "/fr",
		}
	}

	/// `hreflang`, `lang=`, the `?lang=` query value and the cookie value.
	pub fn tag(self) -> &'static str {
		match self {
			Lang::En => "en",
			Lang::Fr => "fr",
		}
	}

	pub fn og_locale(self) -> &'static str {
		match self {
			Lang::En => "en_US",
			Lang::Fr => "fr_FR",
		}
	}

	/// `"/prices"` → `"/fr/prices"`, `"/"` → `"/fr"`, `"/#quote"` → `"/fr#quote"`.
	/// A bare fragment (`"#quote"`) is same-page and is returned untouched.
	pub fn href(self, path: &str) -> String {
		let prefix = self.prefix();
		if prefix.is_empty() {
			return path.to_string();
		}
		match path.strip_prefix('/') {
			Some(rest) if rest.is_empty() || rest.starts_with('#') => format!("{prefix}{rest}"),
			Some(_) => format!("{prefix}{path}"),
			None => path.to_string(),
		}
	}

	pub fn page(self, path: &str) -> &'static Page {
		self.text()
			.pages
			.iter()
			.find(|p| p.path == path)
			.unwrap_or_else(|| panic!("no Page for {path} in {self:?}; every Route arm must have one"))
	}
}

/// Only the prefixed languages parse. `/en/prices` is not a route — the
/// middleware 301s it to the unprefixed URL, which is the canonical one.
impl std::str::FromStr for Lang {
	type Err = &'static str;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"fr" => Ok(Lang::Fr),
			_ => Err("not a prefixed language"),
		}
	}
}

impl std::fmt::Display for Lang {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		f.write_str(self.tag())
	}
}

/// Every string that differs between languages. Two typed consts rather than a
/// catalogue: a field added to one and not the other is a compile error, so
/// there is no missing-key fallback and no drift audit.
pub struct Text {
	pub pages: &'static [Page],
	/// Header and footer navigation. Label plus the route it points at.
	pub nav: &'static [(&'static str, &'static str)],
	pub promise: &'static str,
	pub emergency_line: &'static str,
	pub emergency_hours: &'static str,
	pub booking_hours: &'static str,
	pub hero_eyebrow: &'static str,
	/// The three risk reversals, in the order the evidence ranks them.
	pub hero_ticks: &'static [&'static str],
	/// `(figure, label)` — the microproof strip under the hero CTA row.
	pub hero_microproof: &'static [(&'static str, &'static str)],
	pub header_phone_label: &'static str,
	pub quote_form: QuoteForm,
	/// `(value, label)` for the job `<select>`. The value is what `/quote`
	/// stores, so it is a stable slug, not the label, and it is the same slug in
	/// every language.
	pub jobs: &'static [(&'static str, &'static str)],
	pub proof: &'static [ProofStat],
	pub prices: &'static [PriceRow],
	pub price_head: (&'static str, &'static str, &'static str),
	pub price_columns: (&'static str, &'static str, &'static str),
	/// The differentiator: no reference site publishes this. See docs/refs/sites.
	pub price_note: &'static str,
	pub price_note_short: &'static str,
	pub guarantee_head: (&'static str, &'static str),
	pub pillars: &'static [Pillar],
	pub reviews_head: (&'static str, &'static str),
	/// The visual target the Elfsight embed replaces at runtime. A four-star
	/// review is here on purpose: a perfect wall reads as filtered.
	pub reviews: &'static [Review],
	pub reviews_embed_note: &'static str,
	pub closing: Closing,
	pub inline_cta: (&'static str, &'static str),
	/// The one CTA label, so a copy change cannot land on some buttons and not
	/// others. `cta_short` is the same action where the arrow does not fit.
	pub cta: &'static str,
	pub cta_short: &'static str,
	pub services_head: (&'static str, &'static str, &'static str),
	pub services: &'static [Service],
	/// Read by [`Service::from_display`], which prefixes a formatted `usd`.
	pub services_from: &'static str,
	pub services_quoted: &'static str,
	pub faq_head: (&'static str, &'static str),
	pub faqs: &'static [Faq],
	pub objections_head: (&'static str, &'static str, &'static str),
	pub objections: &'static [Objection],
	pub steps_head: (&'static str, &'static str),
	pub steps: &'static [Step],
	pub crew_head: (&'static str, &'static str, &'static str),
	pub crew: &'static [Crew],
	pub area_head: (&'static str, &'static str, &'static str),
	/// Rendered as chips and read by `ld` as `areaServed`.
	pub areas: &'static [&'static str],
	pub footer_columns: (&'static str, &'static str, &'static str, &'static str),
	/// Footer link columns: `(label, href)`.
	pub footer_services: &'static [(&'static str, &'static str)],
	pub footer_areas: &'static [&'static str],
	pub footer_company: &'static [(&'static str, &'static str)],
	pub footer_facts: &'static [&'static str],
	pub footer_legal: &'static [&'static str],
	/// The status pages carry a shorter legal row than the site footer.
	pub status_legal: &'static [&'static str],
	/// The strip under every status page — the same three terms as the hero
	/// ticks, compressed. A visitor who hit a 404 still gets the offer.
	pub status_strip: &'static [&'static str],
	pub not_found: StatusCopy,
	pub forbidden: StatusCopy,
	pub server_error: StatusCopy,
	pub thanks: StatusCopy,
	pub back_home: &'static str,
	pub sign_in: &'static str,
	pub try_again: &'static str,
	// Prose that names the phone number is split around it rather than written
	// out: `SITE.phone` is the only place the number lives, and these read it.
	pub call_label: (&'static str, &'static str),
	pub guarantee_cta_aside: (&'static str, &'static str),
	pub closing_aside: (&'static str, &'static str),
}

impl Text {
	pub fn call_label(&self) -> String {
		self.around_phone(self.call_label)
	}

	pub fn guarantee_cta_aside(&self) -> String {
		self.around_phone(self.guarantee_cta_aside)
	}

	pub fn closing_aside(&self) -> String {
		self.around_phone(self.closing_aside)
	}

	pub fn quote_reassurance(&self) -> String {
		self.around_phone(self.quote_form.reassurance)
	}

	fn around_phone(&self, (before, after): (&str, &str)) -> String {
		format!("{before}{}{after}", SITE.phone)
	}
}

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
	pub radius_miles: u32,
	pub founded: u32,
	pub street: &'static str,
	pub locality: &'static str,
	pub region: &'static str,
	pub postal_code: &'static str,
	pub price_range: &'static str,
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

/// A crawlable page. The one place a title or description is written. `path` is
/// the language-free key: `/fr/prices` is `Lang::Fr` plus this `/prices`.
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

// ── the quote form ───────────────────────────────────────────────────────────

pub struct QuoteForm {
	pub title: &'static str,
	pub lede: &'static str,
	pub submit: &'static str,
	pub privacy: &'static str,
	/// Split around `SITE.phone`; read through [`Text::quote_reassurance`].
	pub reassurance: (&'static str, &'static str),
	pub job_label: &'static str,
	pub zip_label: &'static str,
	pub mobile_label: &'static str,
	pub zip_placeholder: &'static str,
	/// The inline layout has no labels, so its placeholders carry less.
	pub zip_placeholder_short: &'static str,
	pub mobile_placeholder: &'static str,
	pub mobile_placeholder_short: &'static str,
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
	/// table and the schema.org `Offer` cannot disagree — and it is the same
	/// integer in every language.
	pub from_usd: u32,
	pub typical_time: &'static str,
}
impl PriceRow {
	pub fn from_display(&self) -> String {
		usd(self.from_usd)
	}
}

/// `4800` → `"$4,800"`. The only place a price becomes a string, so the table,
/// the service cards and the schema.org `Offer` cannot disagree. US-formatted in
/// every language: the customer is in Portland paying dollars.
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
	/// `None` renders `services_quoted` — a fit-out has no starting flat rate.
	pub from_usd: Option<u32>,
	pub body: &'static str,
}

impl Service {
	pub fn from_display(&self, t: &Text) -> String {
		match self.from_usd {
			Some(n) => format!("{} {}", t.services_from, usd(n)),
			None => t.services_quoted.to_string(),
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

// ── status pages ─────────────────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq)]
pub struct StatusCopy {
	pub code: &'static str,
	/// The `<title>`; these pages are `noindex` and carry no [`Page`].
	pub title: &'static str,
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
	pub fn label(self, t: &Text) -> String {
		match self {
			Action::Call => t.call_label(),
			Action::Home => t.back_home.into(),
			Action::SignIn => t.sign_in.into(),
			Action::Retry => t.try_again.into(),
		}
	}

	pub fn href(self, lang: Lang) -> String {
		match self {
			Action::Call => SITE.tel_href(),
			Action::Home | Action::SignIn | Action::Retry => lang.href("/"),
		}
	}
}
