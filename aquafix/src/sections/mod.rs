//! One file per Figma frame, each composing `blocks` primitives over a slice of
//! `content`. No literal copy and no spacing class lives here.
//!
//! `page_head` and `inline_cta` are shared by the three sub-pages; everything
//! else belongs to exactly one page.

mod bottom_call_bar;
mod closing_cta;
mod crew;
mod emergency_bar;
mod faq;
mod footer;
mod guarantee;
mod header;
mod hero;
mod how_it_works;
mod inline_cta;
mod objections;
mod page_head;
mod prices;
mod proof_bar;
mod reviews;
mod service_area;
mod services;

pub use bottom_call_bar::BottomCallBar;
pub use closing_cta::ClosingCta;
pub use crew::Crew;
pub use emergency_bar::EmergencyBar;
pub use faq::Faq;
pub use footer::Footer;
pub use guarantee::Guarantee;
pub use header::Header;
pub use hero::Hero;
pub use how_it_works::HowItWorks;
pub use inline_cta::InlineCta;
pub use objections::Objections;
pub use page_head::PageHead;
pub use prices::Prices;
pub use proof_bar::ProofBar;
pub use reviews::Reviews;
pub use service_area::ServiceArea;
pub use services::Services;
