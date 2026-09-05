#import "lib.typ": card, render

#render(
  card(
    name: "Marcus Hale",
    role: "Master Plumber · Owner",
    phone: "(503) 555-0148",
    email: "marcus@aquafix.com",
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
  trim-guide: sys.inputs.at("trim-guide", default: "false") == "true",
)
