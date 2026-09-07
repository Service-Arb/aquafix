#[cfg(not(target_arch = "wasm32"))]
fn main() {
	use std::{sync::Arc, time::Duration};

	use aquafix::{
		App,
		config::{LiveSettings, SettingsFlags},
		content::{LANGS, Lang},
		l10n,
		quote::Lead,
		seo,
		store::Store,
	};
	use clap::Parser;
	use dioxus::server::axum::{
		Extension, Form, Router,
		extract::Query,
		http::{StatusCode, header},
		middleware,
		response::{IntoResponse, Redirect},
		routing::{get, post},
	};

	#[derive(Parser)]
	#[command(author, version = concat!(env!("CARGO_PKG_VERSION"), " (", env!("GIT_HASH"), ")"), about, long_about = None)]
	struct Cli {
		#[command(flatten)]
		settings: SettingsFlags,
	}

	let _ = color_eyre::install();
	{
		use tracing_subscriber::prelude::*;
		let filter = tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info,aquafix=debug"));
		tracing_subscriber::registry().with(filter).with(tracing_subscriber::fmt::layer()).init();
	}

	let cli = Cli::parse();
	let live_settings = Arc::new(v_utils::utils::exit_on_error(LiveSettings::new(cli.settings, Duration::from_secs(5))));
	let config = live_settings.config().expect("config valid on startup").clone();

	let rt = tokio::runtime::Runtime::new().expect("tokio runtime");
	let store = rt.block_on(async { Store::open(config.db_path.as_ref()).await.expect("open the lead store") });

	/// The `?lang=` the French forms post to. Absent means the default, which is
	/// the one case where a default is what the URL actually says.
	#[derive(serde::Deserialize, Default)]
	struct LangQuery {
		lang: Option<String>,
	}

	/// The no-JS path, and the one that has to keep working: a plain form POST
	/// answered with a 303 so a refresh does not resubmit. Reached before the
	/// wasm has loaded, which is when an emergency visitor submits.
	async fn quote(Extension(store): Extension<Store>, Query(q): Query<LangQuery>, Form(lead): Form<Lead>) -> impl IntoResponse {
		let lang: Lang = q.lang.as_deref().and_then(|t| LANGS.iter().copied().find(|l| l.tag() == t)).unwrap_or_default();
		if let Err(why) = lead.validate() {
			tracing::warn!(%why, "rejected quote submission");
			return (StatusCode::SEE_OTHER, [(header::LOCATION, lang.href("/#quote"))]).into_response();
		}
		// A 303 to /thanks on a lead that was never written is the worst outcome
		// this system can produce, so a store failure is a 500, never a redirect.
		match store.insert(&lead).await {
			Ok(_) => {
				aquafix::store::notify(&lead);
				Redirect::to(&lang.href("/thanks")).into_response()
			}
			Err(e) => {
				tracing::error!(error = %e, "lead store rejected a submission");
				(StatusCode::SEE_OTHER, [(header::LOCATION, lang.href("/500"))]).into_response()
			}
		}
	}

	//HACK: dioxus-server 0.7.9 does not forward `LaunchBuilder::with_context` to
	// server functions — those contexts only reach the SSR vdom, so a
	// `consume_context` inside a `#[server]` fn panics. Attach the shared state
	// as an axum request extension instead: it is present on both the SSR render
	// and every server-fn POST.
	let addr = config.socket_addr;
	let mk_router = move || {
		Router::new()
			.merge(dioxus::server::router(App))
			.route("/health", get(|| async { "ok" }))
			.route("/quote", post(quote))
			.route("/robots.txt", get(|| async { ([(header::CONTENT_TYPE, "text/plain; charset=utf-8")], seo::robots_txt()) }))
			.route("/sitemap.xml", get(|| async { ([(header::CONTENT_TYPE, "application/xml; charset=utf-8")], seo::sitemap_xml()) }))
			// Outermost, so it sees the raw URL before any route matches — and it
			// whitelists the page paths itself, so /quote and the assets are unaffected.
			.layer(middleware::from_fn(l10n::negotiate_language))
			.layer(Extension(store.clone()))
	};

	if cfg!(debug_assertions) {
		// `dx serve` owns the bind address and drives the hot-patch loop inside
		// `serve`; outside dx, IP/PORT remain dioxus' own address override.
		dioxus::server::serve(move || {
			let router = mk_router();
			async move { Ok(router) }
		});
	} else {
		// In release `serve` reduces to bind + `axum::serve`, except it spins up a
		// second runtime and takes the address only via env — bypass it.
		rt.block_on(async {
			let listener = tokio::net::TcpListener::bind(addr).await.expect("bind the configured socket_addr");
			dioxus::server::axum::serve(listener, mk_router()).await.expect("server error");
		});
	}
}

#[cfg(target_arch = "wasm32")]
fn main() {
	dioxus::web::launch::launch(aquafix::App, Vec::new(), Vec::new());
}
