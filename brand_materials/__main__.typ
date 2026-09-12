#import "lib.typ": card, render

#render(
  card(..toml("../assets/card.toml")),
  lang: sys.inputs.at("lang", default: "en"),
  material: sys.inputs.at("material", default: "card"),
  polarity: sys.inputs.at("polarity", default: "light"),
  trim-guide: sys.inputs.at("trim-guide", default: "false") == "true",
)
