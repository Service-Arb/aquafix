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
	/// What is behind each card once it is opened: what the symptom looks like
	/// from the kitchen, and what actually happens when we turn up. Graded from
	/// `docs/refs/sites/drain-king/NOTES.md` — the substance is theirs, the
	/// sentences are not.
	pub work_bodies: [&'static str; 4],
	/// The affordance on a closed card. Short, because it sits under a caption.
	pub work_more: &'static str,
	pub work_close: &'static str,
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
	work_bodies: [
		"Water standing in the sink, a gurgle from the next drain along, or a smell that will not go away. We put a camera down first so we are clearing the blockage you actually have — an auger for a soft one, a jet for grease and scale, a cutting head for roots. If the camera shows the sewer line rather than your drain, we tell you that instead of charging you to rod it twice.",
		"A drip you can hear at night, a mixer that will not hold temperature, or pressure that has quietly dropped on one tap. Most are a cartridge, a seat or a scaled aerator, and are done inside the hour. We carry the common cartridges, so the usual job is one visit rather than a visit and an order.",
		"No hot water, hot that runs cold in four minutes, a knocking tank, or damp around the base. We flush the sediment, test the pressure-relief valve and check the flue and connections. Nine times in ten that is the repair; when the tank has gone we say so before you have paid for a service on something we are about to replace.",
		"Damp on a ceiling, a stain that grows, pressure down everywhere at once, or water audible with every tap shut. We locate it with acoustic and thermal kit before we open anything, so what gets cut is the section over the leak and not the wall we guessed at.",
	],
	work_more: "What this involves",
	work_close: "Close",
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
	work_bodies: [
		"De l’eau qui stagne dans l’évier, un gargouillis dans la bonde voisine, ou une odeur qui ne part pas. Nous passons d’abord une caméra, pour traiter le bouchon que vous avez vraiment — un furet pour un bouchon mou, un jet haute pression pour la graisse et le tartre, une tête coupante pour les racines. Si la caméra montre que c’est le collecteur et non votre canalisation, nous vous le disons plutôt que de vous faire payer deux débouchages.",
		"Une goutte qu’on entend la nuit, un mitigeur qui ne tient plus la température, ou une pression qui a baissé sur un seul robinet. C’est le plus souvent une cartouche, un siège ou un mousseur entartré, et c’est réglé en moins d’une heure. Nous avons les cartouches courantes dans le camion : une visite, pas une visite et une commande.",
		"Plus d’eau chaude, de l’eau chaude qui refroidit en quatre minutes, un ballon qui claque, ou de l’humidité au pied. Nous purgeons les boues, testons le groupe de sécurité et vérifions le conduit et les raccords. Neuf fois sur dix c’est la réparation ; quand le ballon est mort, nous le disons avant que vous ayez payé l’entretien d’un appareil que nous allons remplacer.",
		"Une auréole au plafond, une tache qui s’agrandit, une pression qui chute partout d’un coup, ou de l’eau qu’on entend alors que tout est fermé. Nous localisons la fuite au matériel acoustique et thermique avant d’ouvrir quoi que ce soit : on découpe au-dessus de la fuite, pas dans le mur qu’on avait supposé.",
	],
	work_more: "Ce que ça implique",
	work_close: "Fermer",
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
