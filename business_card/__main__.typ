#import "lib.typ": card, render

#render(
  card(
    name: "Valeriy Sakharov",
    phone: "(503) 555-0148",
    email: "val@aquafix.top",
    site: "aquafix.top",
    langs: (
      en: (
        role: "Master Plumber · Owner",
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
      fr: (
        role: "Maître plombier · Propriétaire",
        hours: "24 HEURES · 7 JOURS",
        promise: "PRIX FIXE. RÉPARÉ AUJOURD’HUI.",
        credentials: "LICENCE #PL-40219  ·  ASSURÉ 2 M$",
        serving: "Grand Portland · rayon de 50 km",
        guarantees: (
          "Prix ferme écrit avant de commencer.",
          "Fenêtre de 2 h. Retard, c’est gratuit.",
          "Main-d’œuvre garantie 12 mois.",
        ),
      ),
    ),
  ),
  lang: sys.inputs.at("lang", default: "en"),
  trim-guide: sys.inputs.at("trim-guide", default: "false") == "true",
)
