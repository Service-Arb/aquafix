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
//! Geometry is the Figma frame's, at both breakpoints: 1440 desktop
//! ([`GUTTER`] `py-16`) and 390 mobile (`px-5 py-9`).

use dioxus::prelude::*;

use crate::content::{LANGS, Lang, SITE};

/// The horizontal frame every full-bleed band on the site shares. A band paints
/// edge to edge; this is what decides where its *content* starts, so the header
/// lockup, a price row and the footer copyright all sit on one vertical.
///
/// The column is 1200px — the Figma desktop frame draws every head, table and
/// card grid at `x=120, w=1200` inside 1440. The `max()` hands everything past
/// that to the gutter instead of to the line: a 42px headline set across a
/// 1680px monitor is a different design from the one that was drawn.
///
/// Both frames get the treatment, which is why there are two numbers. Below the
/// `md` seam the 390 composition is running, and a single column is not more
/// readable for being 1200px wide either — it stops at 640.
///
/// Written as padding rather than a centred inner wrapper because these bands
/// need their background full-bleed, and a wrapper would be a second element in
/// every one of them.
pub const GUTTER: &str = "px-[max(1.25rem,calc((100%_-_640px)/2))] md:px-[max(2.5rem,calc((100%_-_1200px)/2))]";

/// A section's colour field. The design alternates deliberately — a light
/// stretch, then an inverse one — and every tone carries its own text colour so
/// a section body never has to pick one.
#[derive(Clone, Copy, PartialEq)]
pub enum Tone {
	/// White. `/guarantee` and `/about` bodies.
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
			Tone::Base => "bg-surface text-ink",
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

/// A full-bleed horizontal band. `id` is set when the section is a scroll
/// anchor; `tight` is the shorter vertical rhythm the sub-pages use.
#[component]
pub fn Section(tone: Tone, #[props(default)] id: Option<String>, #[props(default = false)] tight: bool, children: Element) -> Element {
	let pad = if tight { "py-8 md:py-14" } else { "py-9 md:py-16" };
	rsx! {
		section { id, class: "{GUTTER} {pad} {tone.field()}", {children} }
	}
}

/// The copper all-caps label above a headline. Copper is otherwise reserved for
/// CTAs, and this is the one exception the design makes — so it takes its tone,
/// because on the copper band itself the exception has nothing to say.
#[component]
pub fn Eyebrow(tone: Tone, children: Element) -> Element {
	rsx! {
		p { class: "font-medium text-[10px] md:text-[11.5px] tracking-[0.15em] md:tracking-[0.16em] {tone.eyebrow()}", {children} }
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
				p { class: "max-w-[52rem] text-[15px] md:text-[17px] leading-[1.58] {tone.muted()}", "{lede}" }
			}
		}
	}
}

/// The display headline. One scale for every section head on the site, so a
/// retune is one number.
#[component]
pub fn Head(children: Element) -> Element {
	rsx! {
		h2 { class: "font-display font-bold text-[25px] md:text-[42px] leading-[1.16] md:leading-[1.14] tracking-[-0.005em] max-w-[54rem]", {children} }
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
			onclick: move |e| { if let Some(h) = onclick { h.call(e) } },
			class: "inline-flex items-center justify-center rounded-[10px] px-[22px] py-[14px] md:px-8 md:py-[19px] font-display font-semibold text-[15px] md:text-[18px] transition-opacity hover:opacity-90 {kind.class()} {class}",
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
			onclick: move |e| { if let Some(h) = onclick { h.call(e) } },
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
			for (i , other) in LANGS.iter().copied().enumerate() {
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
		span { class: "rounded-full border border-rule bg-subtle px-4 py-2.5 text-[14px] font-medium text-ink-mid", {children} }
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
