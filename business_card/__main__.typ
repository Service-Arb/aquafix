#import "lib.typ": card, render

#render(
  card(
    name: "Valeriy Sakharov",
    role: "Master Plumber · Owner",
    phone: "(503) 555-0148",
    email: "val@aquafix.top",
    site: "aquafix.com",
    hours: "24 HOURS · 7 DAYS",
    promise: "FIXED PRICE. FIXED TODAY.",
    credentials: "LICENCE #PL-40219  ·  $2M INSURED",
    serving: "Portland metro · 30 mile radius",
    guarantees: (
      "Written flat rate before we start.",
      "2-hour arrival window. Late is free.",
      "12-month workmanship warranty.",
    ),
  ),
  back-mark: sys.inputs.at("back-mark", default: "false") == "true",
  trim-guide: sys.inputs.at("trim-guide", default: "false") == "true",
)
