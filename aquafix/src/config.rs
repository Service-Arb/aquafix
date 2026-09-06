use std::net::SocketAddr;

use v_utils::macros as v_macros;

#[derive(Clone, Debug, v_macros::LiveSettings, v_macros::MyConfigPrimitives, v_macros::Settings, smart_default::SmartDefault)]
pub struct AppConfig {
	/// Where leads land. The container mounts `/data`, so prod overrides this.
	#[primitives(skip)]
	#[default(_code = "default_db_path()")]
	#[serde(default = "default_db_path")]
	pub db_path: v_utils::io::ExpandedPath,

	#[primitives(skip)]
	#[default(_code = "\"127.0.0.1:59081\".parse().expect(\"literal\")")]
	#[serde(default = "default_socket_addr")]
	pub socket_addr: SocketAddr,
}

fn default_db_path() -> v_utils::io::ExpandedPath {
	v_utils::io::ExpandedPath::from("~/.local/share/aquafix/leads.db")
}

fn default_socket_addr() -> SocketAddr {
	"127.0.0.1:59081".parse().expect("literal")
}
