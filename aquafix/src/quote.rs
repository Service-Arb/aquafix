//! The primary conversion, on two paths.
//!
//! **No-JS first.** The markup below is a plain `<form method="post"
//! action="/quote">` handled by the outer axum router, which replies `303 →
//! /thanks`. An emergency visitor on a slow connection can submit before the
//! wasm has loaded. This is not a nicety; it is the whole funnel, so nothing
//! here may become dependent on hydration.
//!
//! **Hydrated.** [`submit_quote`] is the same write reached as a server fn, for
//! inline validation with no page reload. Both land in `store::insert`.
//!
//! Delivery order is persist-then-notify. The store is the commit point: a
//! notification failure logs at `error!` and the lead is still durable.
//!
//! A French page posts to `/quote?lang=fr`, which is the only thing the handler
//! needs to send the visitor to `/fr/thanks`. The [`Lead`] and the SQLite row
//! are language-free.

use dioxus::prelude::*;

use crate::{
	analytics,
	blocks::{CARD, TILE, Tick},
	content::Lang,
};

/// The radius is not in here: `class: CONTROL` is a raw attribute, not a
/// format string, so a `{TILE}` written here would ship as a literal class.
const CONTROL: &str = "w-full border border-rule bg-subtle px-4 py-[15px] text-[16px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent";
/// A submitted lead. `zip` and `mobile` are trimmed but not otherwise parsed:
/// a lead we cannot fully validate is still a lead, and rejecting it loses a
/// customer to protect a column type.
#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct Lead {
	pub job: String,
	pub zip: String,
	pub mobile: String,
}

impl Lead {
	/// The one rule worth enforcing: a lead with no way to reach the customer
	/// is not a lead. Everything else is accepted as typed.
	///
	/// The message is a diagnostic — it is logged and returned to the server fn,
	/// never rendered — so it stays out of `Text` and out of the language seam.
	pub fn validate(&self) -> Result<(), &'static str> {
		if self.mobile.chars().filter(char::is_ascii_digit).count() < 10 {
			return Err("A mobile number we can text your price to");
		}
		if self.zip.trim().is_empty() {
			return Err("The suburb or ZIP we would be driving to");
		}
		Ok(())
	}
}

#[server(endpoint = "quote")]
pub async fn submit_quote(lead: Lead) -> Result<(), ServerFnError> {
	lead.validate().map_err(ServerFnError::new)?;
	// See main.rs: dioxus-server 0.7.9 does not forward `with_context` to server
	// fns, so the store arrives as an axum request extension.
	let store = dioxus::fullstack::FullstackContext::extract::<dioxus::server::axum::Extension<crate::store::Store>, _>().await?.0;
	store.insert(&lead).await.map_err(ServerFnError::new)?;
	crate::store::notify(&lead);
	Ok(())
}

/// The no-JS POST target. English keeps the bare path — it is the default, and
/// the handler falls back to it.
fn action(lang: Lang) -> String {
	match lang {
		Lang::En => "/quote".into(),
		other => format!("/quote?lang={other}"),
	}
}

/// Figma `4:5` / `26:48` — the hero's card.
#[component]
pub fn QuoteCard(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		form {
			id: "quote",
			method: "post",
			action: action(lang),
			onsubmit: move |_| analytics::capture(analytics::QUOTE_SUBMITTED, &[("surface", "hero")]),
			class: "flex w-full flex-col gap-5 {CARD} bg-surface px-6 py-7 shadow-[0_20px_48px_0_rgba(0,13,31,0.34)] md:w-[480px] md:px-[34px] md:pb-[30px] md:pt-8",
			div { class: "flex flex-col gap-[7px]",
				p { class: "font-display text-[24px] font-bold text-ink md:text-[30px]",
					"{t.quote_form.title}"
				}
				p { class: "text-[15px] text-ink-soft", "{t.quote_form.lede}" }
			}
			Controls { lang, labelled: true }
			button {
				r#type: "submit",
				class: "w-full rounded-full bg-action py-[19px] font-display text-[18px] font-semibold text-on-action",
				"{t.quote_form.submit}"
			}
			p { class: "text-[13px] leading-[1.52] text-ink-soft", "{t.quote_reassurance()}" }
			div { class: "h-px w-full bg-rule" }
			div { class: "flex items-center gap-2.5",
				Tick {}
				span { class: "text-[13px] font-medium text-ink-mid", "{t.quote_form.privacy}" }
			}
		}
	}
}
/// Figma `9:9` — the closing band's one-line form. Same three fields, laid out
/// across instead of down.
#[component]
pub fn QuoteFormInline(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		form {
			method: "post",
			action: action(lang),
			onsubmit: move |_| analytics::capture(analytics::QUOTE_SUBMITTED, &[("surface", "closing")]),
			class: "flex w-full flex-col gap-3 md:flex-row md:items-center",
			Controls { lang }
			button {
				r#type: "submit",
				class: "shrink-0 rounded-full bg-inverse-deep px-[34px] py-[18px] font-display text-[18px] font-semibold text-on-inverse",
				"{t.quote_form.submit}"
			}
		}
	}
}
/// Figma `4:9`–`4:24`. One labelled control; the three fields differ only in
/// what they contain.
#[component]
fn Field(label: String, children: Element) -> Element {
	rsx! {
		label { class: "flex w-full flex-col gap-2",
			span { class: "text-[12.5px] font-medium tracking-[0.06em] text-ink-mid",
				"{label}"
			}
			{children}
		}
	}
}

/// The job `<select>`, the ZIP and the mobile — the three inputs both form
/// layouts share, so a field cannot exist on one and not the other.
#[component]
fn Controls(lang: Lang, #[props(default = false)] labelled: bool) -> Element {
	let f = &lang.text().quote_form;
	rsx! {
		if labelled {
			Field { label: f.job_label,
				JobSelect { lang }
			}
			Field { label: f.zip_label,
				input {
					class: "{TILE} {CONTROL}",
					r#type: "text",
					name: "zip",
					placeholder: f.zip_placeholder,
					required: true,
				}
			}
			Field { label: f.mobile_label,
				input {
					class: "{TILE} {CONTROL}",
					r#type: "tel",
					name: "mobile",
					placeholder: f.mobile_placeholder,
					required: true,
				}
			}
		} else {
			JobSelect { lang }
			input {
				class: "{TILE} {CONTROL}",
				r#type: "text",
				name: "zip",
				placeholder: f.zip_placeholder_short,
				required: true,
			}
			input {
				class: "{TILE} {CONTROL}",
				r#type: "tel",
				name: "mobile",
				placeholder: f.mobile_placeholder_short,
				required: true,
			}
		}
	}
}

#[component]
fn JobSelect(lang: Lang) -> Element {
	rsx! {
		select { class: "{TILE} {CONTROL}", name: "job", required: true,
			for (value, label) in lang.text().jobs {
				option { value: "{value}", "{label}" }
			}
		}
	}
}
