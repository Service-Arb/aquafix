//! Everything `quiet` says, in both languages.
//!
//! Facts stay in `content.rs` — the prices, the reviews, the service areas, the
//! phone. This file holds only the framing prose, because the framing prose is
//! what the version is an argument about. A number that appeared here would be
//! a second copy of a number that already exists.

use crate::content::Lang;

pub struct Copy {
	pub eyebrow: &'static str,
	/// Three lines, hard-broken. None longer than about fifteen characters, or
	/// the measure wraps them and the hero stops being three punches.
	pub display: [&'static str; 3],
	pub lede: &'static str,
	pub cta: &'static str,
	/// `(figure, label)` — the strip that replaced the proof band.
	pub stats: [(&'static str, &'static str); 4],
	pub work_title: &'static str,
	/// One label per photograph, in the order `bands::WORK` lists them. A
	/// caption, not a sentence — the picture is the claim.
	pub work_captions: [&'static str; 4],
	pub prices_title: &'static str,
	pub prices_note: &'static str,
	pub guarantee_title: &'static str,
	pub reviews_title: &'static str,
	pub coverage_title: &'static str,
	pub coverage_lede: &'static str,
	pub closing_title: &'static str,
	pub closing_lede: &'static str,
	pub back_to_top: &'static str,
}

pub fn copy(lang: Lang) -> &'static Copy {
	match lang {
		Lang::En => &EN,
		Lang::Fr => &FR,
	}
}

static EN: Copy = Copy {
	eyebrow: "PLUMBER · CLERMONT-FERRAND",
	display: ["FIXED PRICE.", "FIXED TODAY.", "GUARANTEED."],
	lede: "A written flat rate on your doorstep before we start. Two-hour window, or the call-out is free.",
	cta: "Get my flat price",
	stats: [("4.9★", "612 REVIEWS"), ("43 MIN", "AVG. ARRIVAL"), ("96%", "FIXED SAME DAY"), ("12 MO", "WARRANTY")],
	work_title: "The work.",
	work_captions: ["Blocked drains", "Taps, mixers & showers", "Hot water & heating", "Pipe repair"],
	prices_title: "What things cost.",
	// Dollars, because `content.rs` still formats every price through `usd()`.
	// The currency is part of the US placeholder layer, not this version's.
	prices_note: "Call-out $89, credited in full against work you approve.",
	guarantee_title: "Three things we pay for if we get them wrong.",
	reviews_title: "What the neighbours say.",
	coverage_title: "Where we go.",
	coverage_lede: "Clermont-Ferrand and the communes around it. If you are outside, we will say so on the phone.",
	closing_title: "Get your flat price.",
	closing_lede: "Ninety seconds. If you do not like the number you have paid nothing at all.",
	back_to_top: "Back to top",
};

static FR: Copy = Copy {
	eyebrow: "PLOMBIER · CLERMONT-FERRAND",
	display: ["PRIX FIXE.", "RÉPARÉ CE JOUR.", "GARANTI."],
	lede: "Un tarif ferme écrit sur votre pas de porte avant de commencer. Fenêtre de 2 h, ou le déplacement est offert.",
	cta: "Obtenir mon prix fixe",
	stats: [("4,9★", "612 AVIS"), ("43 MIN", "ARRIVÉE MOY."), ("96 %", "RÉPARÉ LE JOUR"), ("12 MOIS", "GARANTIE")],
	work_title: "Le travail.",
	work_captions: ["Débouchage", "Robinets, mitigeurs & douches", "Eau chaude & chauffage", "Réparation de canalisations"],
	prices_title: "Ce que ça coûte.",
	prices_note: "Déplacement 89 $, déduit intégralement des travaux que vous acceptez.",
	guarantee_title: "Trois choses que nous payons si nous les manquons.",
	reviews_title: "Ce que disent les voisins.",
	coverage_title: "Où nous allons.",
	coverage_lede: "Clermont-Ferrand et les communes alentour. Si vous êtes en dehors, nous vous le dirons au téléphone.",
	closing_title: "Obtenez votre prix fixe.",
	closing_lede: "Quatre-vingt-dix secondes. Si le chiffre ne vous plaît pas, vous n’avez rien payé.",
	back_to_top: "Haut de page",
};
