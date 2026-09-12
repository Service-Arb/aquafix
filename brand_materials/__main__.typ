#import "lib.typ": card, render

#render(
  card(..toml("../assets/card.toml")),
  lang: sys.inputs.at("lang", default: "en"),
  material: sys.inputs.at("material", default: "card"),
  trim-guide: sys.inputs.at("trim-guide", default: "false") == "true",
)
