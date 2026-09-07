//! The layout vocabulary — and the **only** file where section padding, the
//! container width, the eyebrow treatment and the display type scale appear.
//!
//! A section file composes these and passes data; it never writes a spacing or
//! type-scale class of its own. That constraint is what makes a global
//! retuning one edit, and it is also where an `Importance` metric would later
//! attach — driving rem size *and* breakpoint visibility from one number.
//! `Importance` is deliberately not built: one site is not enough examples to
//! design it from.
//!
//! Geometry: the page is white and nothing paints to its edge. A section is a
//! panel — [`PANEL`] wide, inset by [`STACK`]'s gutter, with white air between
//! it and the next one. `hyros.com` is the reference for the proportion,
//! measured at nine widths (`docs/refs/sites/hyros/NOTES.md`).
//!
//! The panel caps at 1296 rather than the Figma frame's 1200 so that 48px of
//! panel padding puts the content back on `x=120, w=1200` at 1440. The Figma
//! column has not moved; it has a panel drawn around it.

use dioxus::prelude::*;

use crate::content::{LANGS, Lang, SITE};

/// The white field a page is stacked on: its gutter, and the air between
/// panels. The gap lives here rather than as padding inside each panel, which
/// is what lets a panel stop where its colour stops.
pub const STACK: &str = "flex flex-col gap-4 bg-surface px-4 py-4 sm:gap-8 sm:px-[38px] sm:py-[38px] md:gap-16 md:py-10";

/// A panel's box, without its colour — the width, the radius and the inset that
/// puts a painted section's content back on the Figma column. An unpainted
/// section takes it too, so its head sits on the same vertical as a painted
/// one's.
pub const PANEL: &str = "mx-auto w-full max-w-[1296px] rounded-[18px] px-5 sm:rounded-[26px] sm:px-8 md:rounded-[30px] md:px-12";

/// The two steps in from [`PANEL`]'s corner: a card sits on a panel, a tile or
/// a control sits on a card. The ladder is 30 → 20 → 14; a 14px corner nested
/// straight inside a 30px one reads as an accident rather than as a level.
pub const CARD: &str = "rounded-[20px]";
/// See [`CARD`].
pub const TILE: &str = "rounded-[14px]";

/// A section's colour field. The design alternates deliberately — a light
/// stretch, then an inverse one — and every tone carries its own text colour so
/// a section body never has to pick one. `Base` paints nothing: the white page
/// shows through, and the panel is only a box.
#[derive(Clone, Copy, PartialEq)]
pub enum Tone {
	/// The page itself, unpainted. `/guarantee` and `/about` bodies.
	Base,
	/// Off-white. Prices, reviews, services, FAQ.
	Subtle,
	/// Navy. The guarantee pillars.
	Inverse,
	/// Near-black navy. Emergency bar, hero, page heads, footer.
	Deep,
	/// Copper. CTA bands only — the eye must always be able to find the action.
	Action,
}

impl Tone {
	fn field(self) -> &'static str {
		match self {
			Tone::Base => "text-ink",
			Tone::Subtle => "bg-subtle text-ink",
			Tone::Inverse => "bg-inverse text-on-inverse",
			Tone::Deep => "bg-inverse-deep text-on-inverse",
			Tone::Action => "bg-action text-on-action",
		}
	}

	/// The muted text colour that reads on this field.
	pub fn muted(self) -> &'static str {
		match self {
			Tone::Base | Tone::Subtle => "text-ink-soft",
			Tone::Inverse | Tone::Deep => "text-on-inverse-muted",
			Tone::Action => "text-on-action opacity-[0.78]",
		}
	}

	/// The rule colour that reads on this field.
	pub fn rule(self) -> &'static str {
		match self {
			Tone::Base | Tone::Subtle => "border-rule",
			_ => "border-rule-inverse",
		}
	}

	/// The eyebrow colour that reads on this field. Copper everywhere the field
	/// is not itself copper.
	fn eyebrow(self) -> &'static str {
		match self {
			Tone::Action => "text-on-action",
			_ => "text-accent",
		}
	}
}

/// One panel in the stack. `id` is set when the section is a scroll anchor;
/// `tight` is the shorter vertical rhythm the sub-pages use.
#[component]
pub fn Section(tone: Tone, #[props(default)] id: Option<String>, #[props(default = false)] tight: bool, children: Element) -> Element {
	let pad = if tight { "py-7 sm:py-9 md:py-12" } else { "py-8 sm:py-11 md:py-14" };
	rsx! {
		section { id, class: "{PANEL} {pad} {tone.field()}", {children} }
	}
}

/// The copper all-caps label above a headline. Copper is otherwise reserved for
/// CTAs, and this is the one exception the design makes — so it takes its tone,
/// because on the copper band itself the exception has nothing to say.
#[component]
pub fn Eyebrow(tone: Tone, children: Element) -> Element {
	rsx! {
		p { class: "font-medium text-[10px] md:text-[11.5px] tracking-[0.15em] md:tracking-[0.16em] {tone.eyebrow()}",
			{children}
		}
	}
}

/// Eyebrow → headline → lede, the head every section shares.
#[component]
pub fn SectionHead(tone: Tone, eyebrow: String, title: String, #[props(default)] lede: Option<String>) -> Element {
	rsx! {
		div { class: "flex flex-col gap-2 md:gap-3.5",
			Eyebrow { tone, "{eyebrow}" }
			Head { "{title}" }
			if let Some(lede) = lede {
				p { class: "max-w-[52rem] text-[15px] md:text-[17px] leading-[1.58] {tone.muted()}",
					"{lede}"
				}
			}
		}
	}
}

/// The display headline. One scale for every section head on the site, so a
/// retune is one number.
#[component]
pub fn Head(children: Element) -> Element {
	rsx! {
		h2 { class: "font-display font-bold text-[25px] md:text-[42px] leading-[1.16] md:leading-[1.14] tracking-[-0.005em] max-w-[54rem]",
			{children}
		}
	}
}

/// Body copy at the reading measure.
#[component]
pub fn Prose(tone: Tone, children: Element) -> Element {
	rsx! {
		p { class: "text-[14px] md:text-[15px] leading-[1.62] {tone.muted()}", {children} }
	}
}

/// A call to action's colour role — not its tone. `Primary` is copper and is
/// the page's single action; the others exist because copper on copper is
/// invisible.
#[derive(Clone, Copy, PartialEq)]
pub enum Cta {
	Primary,
	Dark,
	Outline,
}

impl Cta {
	fn class(self) -> &'static str {
		match self {
			Cta::Primary => "bg-action text-on-action",
			Cta::Dark => "bg-inverse-deep text-on-inverse",
			Cta::Outline => "border-[1.5px] border-rule-inverse text-on-inverse",
		}
	}
}

/// The action button. Everything on this site that is a call to action is one
/// of these, so there is exactly one place a CTA's shape is decided.
#[component]
pub fn CtaButton(kind: Cta, href: String, #[props(default)] class: Option<String>, #[props(default)] onclick: Option<EventHandler<MouseEvent>>, children: Element) -> Element {
	let class = class.unwrap_or_default();
	rsx! {
		a {
			href,
			onclick: move |e| {
			    if let Some(h) = onclick {
			        h.call(e)
			    }
			},
			class: "inline-flex items-center justify-center rounded-full px-[26px] py-[15px] md:px-9 md:py-[19px] font-display font-semibold text-[15px] md:text-[18px] transition-opacity hover:opacity-90 {kind.class()} {class}",
			{children}
		}
	}
}

/// The phone number as a dialable link. Always renders `SITE.phone`, so no
/// caller can put a stale number on the page.
#[component]
pub fn PhoneLink(#[props(default)] class: Option<String>, #[props(default)] onclick: Option<EventHandler<MouseEvent>>) -> Element {
	let class = class.unwrap_or_default();
	rsx! {
		a {
			href: SITE.tel_href(),
			onclick: move |e| {
			    if let Some(h) = onclick {
			        h.call(e)
			    }
			},
			class: "{class}",
			"{SITE.phone}"
		}
	}
}

/// `EN · FR`, linking to the same page in the other language.
///
/// `?lang=` is what mints the cookie server-side, so the choice survives the
/// next unprefixed visit and stops the negotiator from fighting the visitor —
/// and it needs no JavaScript, which is the rule this funnel is built on.
/// `path` is the language-free route (`/prices`), not the current URL: the page
/// already knows it, and taking it as data keeps this renderable without a
/// router context.
#[component]
pub fn LangSwitch(lang: Lang, path: &'static str, class: String) -> Element {
	rsx! {
		span { class: "flex items-center gap-1.5 {class}",
			for (i, other) in LANGS.iter().copied().enumerate() {
				if i > 0 {
					span { class: "opacity-40", "·" }
				}
				a {
					href: "{other.href(path)}?lang={other}",
					class: switch_emphasis(other == lang),
					"{other.tag().to_uppercase()}"
				}
			}
		}
	}
}

fn switch_emphasis(current: bool) -> &'static str {
	if current { "font-semibold" } else { "opacity-60 hover:opacity-100" }
}

/// A rounded chip. Service areas, and nothing else so far.
#[component]
pub fn Pill(children: Element) -> Element {
	rsx! {
		span { class: "rounded-full border border-rule bg-subtle px-4 py-2.5 text-[14px] font-medium text-ink-mid",
			{children}
		}
	}
}

/// A figure with its label beside it — the hero microproof and the status
/// pages' guarantee strip are both this.
#[component]
pub fn StatRow(tone: Tone, figure: String, label: String) -> Element {
	rsx! {
		span { class: "flex items-center gap-[7px] whitespace-nowrap",
			span { class: "font-semibold", "{figure}" }
			span { class: "{tone.muted()}", "{label}" }
		}
	}
}

/// The green check the design uses for every affirmative term.
#[component]
pub fn Tick() -> Element {
	rsx! {
		span { class: "font-semibold text-success", "✓" }
	}
}
