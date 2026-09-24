import type { Text } from "./types";

/**
 * French — the default language. A translation of the graded English copy,
 * not a second grading of it: it carries the same argument and does not
 * re-derive it.
 */
export const FR = {
  pages: {
    home: {
      title: f => `Plombier à ${f.place} — prix fixe, réparé aujourd’hui`,
      description: f =>
        `Plombiers à ${f.place}. Tarif fixe écrit avant de commencer, une fenêtre d’arrivée de 2 heures ou le déplacement est offert, et une garantie de 12 mois. Prix publiés pour neuf interventions.`,
      eyebrow: "",
      h1: () => "Votre plomberie réparée aujourd’hui — au prix convenu avant que nous commencions.",
      lede: "Tarif fixe écrit sur votre pas de porte. Fenêtre d’arrivée de 2 heures. Garantie 12 mois. En retard et le déplacement est offert.",
    },
    prices: {
      title: () => "Chaque intervention, chaque chiffre",
      description: f =>
        `La liste complète des prix Aquafix à ${f.place} : neuf interventions, de vrais tarifs fixes TTC, et les questions que tout le monde pose avant de réserver.`,
      eyebrow: "PRIX  ·  AQUAFIX",
      h1: () => "Chaque intervention, chaque chiffre.",
      lede: "Ce que nous facturons, pourquoi le chiffre ne bouge jamais, et ce qui se passe si l’intervention s’avère pire qu’elle n’en avait l’air.",
    },
    guarantee: {
      title: () => "Ce que nous promettons vraiment",
      description: () =>
        "Les quatre craintes que l’on a en appelant un plombier, les conditions écrites qui suppriment chacune d’elles, et le déroulement d’une intervention Aquafix du début à la fin.",
      eyebrow: "GARANTIE  ·  AQUAFIX",
      h1: () => "Ce que nous promettons vraiment.",
      lede: "Les quatre craintes que l’on a en appelant un plombier, les conditions qui suppriment chacune d’elles, et le déroulement d’une intervention.",
    },
    about: {
      title: f => `Quatre plombiers et un rayon de ${f.radiusKm} km`,
      description: f =>
        `Qui se présente chez vous, comment ils sont assurés, et exactement où autour de ${f.place} nous acceptons — ou refusons — de nous déplacer.`,
      eyebrow: "À PROPOS  ·  AQUAFIX",
      h1: f => `Quatre plombiers et un rayon de ${f.radiusKm} km.`,
      lede: "Qui se présente, comment ils sont assurés, et exactement où nous acceptons — ou refusons — de nous déplacer.",
    },
  },
  brandPage: {
    title: "Aquafix — plombiers chauffagistes à Clermont-Ferrand et Lyon",
    description:
      "Aquafix, plomberie et chauffage : un tarif fixe écrit avant les travaux, une fenêtre d’arrivée de 2 heures et une garantie de 12 mois. Six points entre Clermont-Ferrand et Lyon.",
    h1: "Prix fixe. Réparé aujourd’hui. Près de chez vous.",
    lede: "Choisissez le point le plus proche — chacun a sa camionnette, son numéro et les mêmes conditions écrites.",
    listTitle: "Nos points",
    open: "Voir ce point",
  },
  nav: { prices: "Prix", guarantee: "Garantie", reviews: "Avis", about: "À propos" },
  promise: "PRIX FIXE. RÉPARÉ AUJOURD’HUI.",
  emergencyHours: "Urgences — 24 heures sur 24, 7 jours sur 7",
  bookingHours: "Réservations — de 7h à 21h, tous les jours",
  headerPhoneLabel: "24/7 · UN HUMAIN RÉPOND",
  heroPhotoAlt: "L’équipe Aquafix devant les camionnettes aux couleurs de l’entreprise, au dépôt.",
  cta: "Obtenir mon prix fixe  →",
  ctaShort: "Obtenir mon prix fixe",
  callLabel: f => `Appeler le ${f.phone}`,
  whatsappLabel: "Écrire sur WhatsApp",
  whatsappShort: "WhatsApp",
  menuLabel: "Menu",
  whatsappMessage: f => `Bonjour, j’ai besoin d’un plombier à ${f.place}.`,
  quoteForm: {
    title: "Obtenez votre prix fixe",
    lede: "90 secondes. Sans engagement, sans frais de déplacement.",
    submit: "Envoyez-moi mon prix  →",
    privacy: "Votre numéro sert à envoyer le devis. Rien d’autre, jamais.",
    reassurance: f =>
      `Nous vous envoyons votre fourchette de prix par SMS sous 10 minutes, de 7h à 21h. Urgence immédiate ? Appelez le ${f.phone} — nous décrochons 24h/24.`,
    jobLabel: "QUEL EST LE PROBLÈME ?",
    zipLabel: "OÙ ÊTES-VOUS ?",
    mobileLabel: "MOBILE",
    zipPlaceholder: "Commune ou code postal",
    mobilePlaceholder: "06 00 00 00 00",
    honeypotLabel: "Laissez ce champ vide",
  },
  jobs: {
    blocked_drain: "Canalisation bouchée",
    burst_pipe: "Tuyau éclaté ou qui fuit",
    hot_water: "Eau chaude",
    tap_toilet: "Robinet, WC ou chasse d’eau",
    sewer_line: "Conduite d’égout",
    leak_detection: "Détection de fuite",
    repipe: "Réfection complète de la tuyauterie",
    fit_out: "Aménagement salle de bains ou cuisine",
    other: "Autre chose",
  },
  prices: {
    drain: { job: "Canalisation bouchée — débouchage mécanique", time: "45–90 min" },
    tap: { job: "Robinet, mitigeur ou chasse d’eau qui fuit", time: "30–60 min" },
    toilet: { job: "Réparation ou remplacement complet de WC", time: "1–2 h" },
    water_heater_repair: { job: "Chauffe-eau — réparation", time: "1–3 h" },
    water_heater_replace: { job: "Chauffe-eau — remplacement complet", time: "une demi-journée" },
    pipe: { job: "Réparation de tuyau éclaté ou qui fuit", time: "1–3 h" },
    camera: { job: "Inspection caméra de canalisation", time: "45 min" },
    sewer: { job: "Débouchage d’égout et rapport", time: "2–4 h" },
    repipe: { job: "Réfection de la tuyauterie — maison T4", time: "2–3 jours" },
  },
  priceColumns: { job: "INTERVENTION", price: "PRIX FIXE À PARTIR DE", time: "DURÉE TYPIQUE SUR PLACE" },
  home: {
    eyebrow: f => `PLOMBIER · ${f.place.toUpperCase()}`,
    display: ["PRIX FIXE.", "RÉPARÉ CE JOUR.", "GARANTI."],
    lede: () =>
      "Un tarif ferme écrit sur votre pas de porte avant de commencer. Fenêtre de 2 h, ou le déplacement est offert.",
    cta: "Obtenir mon prix fixe",
    stats: [
      { figure: "4,9★", label: "612 AVIS" },
      { figure: "43 MIN", label: "ARRIVÉE MOY." },
      { figure: "96 %", label: "RÉPARÉ LE JOUR" },
      { figure: "12 MOIS", label: "GARANTIE" },
    ],
    workTitle: "Le travail.",
    work: {
      drains: {
        caption: "Débouchage",
        body: "De l’eau qui stagne dans l’évier, un gargouillis dans la bonde voisine, ou une odeur qui ne part pas. Nous passons d’abord une caméra, pour traiter le bouchon que vous avez vraiment — un furet pour un bouchon mou, un jet haute pression pour la graisse et le tartre, une tête coupante pour les racines. Si la caméra montre que c’est le collecteur et non votre canalisation, nous vous le disons plutôt que de vous faire payer deux débouchages.",
      },
      taps: {
        caption: "Robinets, mitigeurs & douches",
        body: "Une goutte qu’on entend la nuit, un mitigeur qui ne tient plus la température, ou une pression qui a baissé sur un seul robinet. C’est le plus souvent une cartouche, un siège ou un mousseur entartré, et c’est réglé en moins d’une heure. Nous avons les cartouches courantes dans le camion : une visite, pas une visite et une commande.",
      },
      heaters: {
        caption: "Eau chaude & chauffage",
        body: "Plus d’eau chaude, de l’eau chaude qui refroidit en quatre minutes, un ballon qui claque, ou de l’humidité au pied. Nous purgeons les boues, testons le groupe de sécurité et vérifions le conduit et les raccords. Neuf fois sur dix c’est la réparation ; quand le ballon est mort, nous le disons avant que vous ayez payé l’entretien d’un appareil que nous allons remplacer.",
      },
      pipes: {
        caption: "Réparation de canalisations",
        body: "Une auréole au plafond, une tache qui s’agrandit, une pression qui chute partout d’un coup, ou de l’eau qu’on entend alors que tout est fermé. Nous localisons la fuite au matériel acoustique et thermique avant d’ouvrir quoi que ce soit : on découpe au-dessus de la fuite, pas dans le mur qu’on avait supposé.",
      },
    },
    workMore: "Ce que ça implique",
    workClose: "Fermer",
    pricesTitle: "Ce que ça coûte.",
    pricesNote: f => `Déplacement ${f.callout}, déduit intégralement des travaux que vous acceptez. Prix TTC.`,
    guaranteeTitle: "Trois choses que nous payons si nous les manquons.",
    reviewsTitle: "Ce que disent les voisins.",
    coverageTitle: "Où nous allons.",
    coverageLede: f => `${f.place} et les communes alentour. Si vous êtes en dehors, nous vous le dirons au téléphone.`,
    mapShow: "Afficher la carte",
    mapTitle: f => `Carte : Aquafix ${f.place}`,
    closingTitle: "Obtenez votre prix fixe.",
    closingLede: "Quatre-vingt-dix secondes. Si le chiffre ne vous plaît pas, vous n’avez rien payé.",
    backToTop: "Haut de page",
  },
  pillars: [
    {
      n: "01",
      title: "Le prix ne peut pas bouger.",
      body: () =>
        "Votre tarif fixe est signé avant le début des travaux. Sur 4 100 interventions, nous n’avons jamais envoyé de facture supérieure au devis — si nous sous-estimons l’intervention, nous absorbons la différence.",
      short: () => "Signé avant le début des travaux. 4 100 interventions, jamais de facture au-dessus du devis.",
    },
    {
      n: "02",
      title: "Le chrono est à notre charge.",
      body: f =>
        `Fenêtre d’arrivée de deux heures, choisie par vous. Une seule minute de retard et les ${f.callout} de déplacement sont annulés automatiquement — vous n’avez ni à le demander ni à discuter.`,
      short: f => `Fenêtre de deux heures. Une minute de retard et les ${f.callout} de déplacement sautent automatiquement.`,
    },
    {
      n: "03",
      title: "Le travail est garanti.",
      body: () =>
        "Douze mois sur les pièces et la main-d’œuvre. Si la même panne revient, nous revenons gratuitement, et nous ne vous facturons toujours pas de frais de diagnostic pour l’examiner.",
      short: () => "Douze mois, pièces et main-d’œuvre. La même panne revient, nous revenons gratuitement.",
    },
  ],
  guaranteeCtaAside: f => `ou appelez le ${f.phone} — un humain décroche, 24 heures sur 24`,
  reviews: [
    {
      stars: 5,
      body: f =>
        `Nate a trouvé la fuite en vingt minutes, après que deux autres entreprises m’ont dit qu’il faudrait casser le carrelage. Devis ${f.price("pipe")}. Facturé ${f.price("pipe")}.`,
      author: "Sarah K.",
      attrib: "Chamalières · Tuyau éclaté · il y a 2 semaines",
    },
    {
      stars: 5,
      body: () =>
        "J’ai réservé la fenêtre 8h–10h, la camionnette s’est garée à 8h20. Nouveau chauffe-eau posé avant midi. Le prix affiché sur le site est celui que j’ai payé.",
      author: "Danny R.",
      attrib: "Clermont-Ferrand · Eau chaude · il y a 1 mois",
    },
    {
      stars: 4,
      body: () =>
        "Quatre étoiles seulement parce qu’ils n’ont pas pu venir avant le lendemain matin. Tout le reste était exactement comme annoncé, jusqu’aux surchaussures.",
      author: "Priya M.",
      attrib: "Ceyrat · Canalisation bouchée · il y a 3 semaines",
    },
  ],
  services: {
    head: {
      eyebrow: "CE QUE NOUS FAISONS",
      title: () => "Huit interventions. Nous les faisons bien et nous refusons le reste.",
      lede: "Chaque prix ci-dessous est le vrai tarif fixe de départ, TTC, confirmé sur place avant que nous commencions.",
    },
    items: {
      drains: {
        name: "Canalisations bouchées",
        body: "Débouchage mécanique, contrôle caméra, et nous vous disons ce qui l’a causé pour que cela ne recommence pas dans six semaines.",
      },
      pipes: {
        name: "Tuyaux éclatés et fuites",
        body: "Localisés acoustiquement avant toute ouverture. Aucun trou d’exploration dans vos murs ou vos sols.",
      },
      heaters: {
        name: "Chauffe-eau",
        body: "Nous essayons d’abord de réparer. Nous ne recommandons le remplacement que lorsque réparer revient à jeter de l’argent par les fenêtres.",
      },
      taps: {
        name: "Robinets, WC et chasses d’eau",
        body: "Les petites interventions pour lesquelles la plupart des plombiers ne se déplacent pas. La même promesse de tarif fixe s’applique.",
      },
      sewers: {
        name: "Conduites d’égout",
        body: "Inspection caméra, débouchage, et un rapport écrit dans un format que votre assureur acceptera.",
      },
      leaks: {
        name: "Détection de fuite",
        body: "Acoustique et imagerie thermique. Nous la trouvons avant d’ouvrir un mur, pas après.",
      },
      repipes: {
        name: "Réfection de la tuyauterie",
        body: "Échelonnée pour que vous ne soyez jamais sans eau la nuit. Prix fixe pour tout le chantier, pas au raccord.",
      },
      fit_out: {
        name: "Aménagement salle de bains et cuisine",
        body: "Du gros œuvre à la finition, séquencé autour de votre carreleur et de votre cuisiniste.",
      },
    },
    from: "à partir de",
    quoted: "sur devis",
  },
  faqHead: { eyebrow: "AVANT D’APPELER", title: "Les questions que tout le monde pose." },
  faqs: [
    {
      q: f => `Les ${f.callout} de déplacement s’ajoutent-ils au prix de l’intervention ?`,
      a: f =>
        `Non. Ils sont intégralement déduits de tout travail que vous approuvez. Si vous n’approuvez rien, les ${f.callout} couvrent la visite et le diagnostic, et c’est toute la facture.`,
    },
    {
      q: () => "Et si vous trouvez pire une fois que c’est ouvert ?",
      a: () =>
        "Nous arrêtons, nous vous montrons, et nous refaisons un devis avant de toucher à quoi que ce soit. Vous pouvez refuser et ne devez que le montant déjà approuvé. Nous ne faisons jamais de travaux supplémentaires pour les facturer après coup.",
    },
    {
      q: () => "Répondez-vous vraiment à 2h du matin ?",
      a: f =>
        `Oui, et c’est une personne à ${f.place} plutôt qu’un service de permanence. Les déplacements d’urgence entre 21h et 7h comportent un supplément de ${f.surcharge}, annoncé avant que nous envoyions quelqu’un.`,
    },
    {
      q: () => "Êtes-vous immatriculés et assurés ?",
      a: f =>
        `SIRET ${f.siret}, et chaque intervention est couverte par notre assurance décennale (${f.insurer}, contrat ${f.policy}). Nous vous envoyons l’attestation par e-mail avant la visite si vous voulez la voir d’abord.`,
    },
    {
      q: () => "En combien de temps pouvez-vous vraiment arriver ?",
      a: () =>
        "Sur nos 500 dernières interventions, l’arrivée d’urgence moyenne était de 43 minutes. Pour les travaux non urgents, 96 % des réservations ont été honorées sous 24 heures.",
    },
    {
      q: () => "Quels moyens de paiement acceptez-vous ?",
      a: () =>
        "Carte, virement ou espèces à la fin. Tous nos prix sont TTC — le chiffre inscrit sur le bon est celui que vous payez.",
    },
  ],
  objectionsHead: {
    eyebrow: "POURQUOI ON VIT AVEC PENDANT DES MOIS",
    title: () => "Quatre raisons qui vous font repousser l’appel. Nous les avons toutes les quatre supprimées.",
    lede: "Chacune est une chose que des clients nous ont réellement dite avant de réserver. Chacune est désormais une condition écrite sur votre bon d’intervention, pas une promesse sur un site web.",
  },
  objections: [
    {
      quote: () => "« Ils vont me faire un devis à 200 € et me facturer 700 €. »",
      title: "Nous facturons l’intervention, pas l’heure.",
      body: () =>
        "Vous obtenez un tarif fixe par écrit avant qu’un seul outil ne sorte de la camionnette. Si cela nous prend trois heures de plus que prévu, c’est notre problème — vous payez le chiffre inscrit sur le bon.",
    },
    {
      quote: () => "« Ils viendront quand ça leur chantera. »",
      title: "Une fenêtre de 2 heures, ou le déplacement est offert.",
      body: f =>
        `C’est vous qui choisissez la fenêtre. Nous vous envoyons un SMS au départ de la camionnette, avec le nom et la photo du plombier. Fenêtre manquée et les ${f.callout} de déplacement sont annulés automatiquement.`,
    },
    {
      quote: () => "« Ils vont traîner de la boue dans toute la maison. »",
      title: "Surchaussures, bâches de protection, photos avant-après.",
      body: () =>
        "Chaque bon d’intervention comprend des photographies de la zone de travail avant que nous commencions et après que nous avons fini. Si nous laissons du désordre, vous avez la preuve.",
    },
    {
      quote: () => "« Ça fuira de nouveau avant l’hiver. »",
      title: "12 mois sur les pièces et la main-d’œuvre.",
      body: () =>
        "Si la même panne revient dans l’année, nous revenons la réparer sans frais — pas de frais de diagnostic, pas de discussion sur la responsabilité.",
    },
  ],
  stepsHead: { eyebrow: "COMMENT ÇA MARCHE", title: "Trois étapes. Rien à relancer." },
  steps: [
    {
      n: "1",
      title: "Vous appelez, ou vous envoyez le formulaire.",
      body: "Une phrase sur ce qui ne va pas. Nous posons trois questions et vous donnons une fourchette de prix avant que vous raccrochiez.",
    },
    {
      n: "2",
      title: "Nous arrivons dans votre fenêtre.",
      body: "Vous recevez un SMS au départ de la camionnette — le nom du plombier, sa photo, et une heure d’arrivée en direct.",
    },
    {
      n: "3",
      title: "Vous approuvez le prix. Ensuite nous réparons.",
      body: "Rien n’est touché tant que vous n’avez pas vu le tarif fixe et dit oui. 96 % des interventions sont terminées dès cette première visite.",
    },
  ],
  crewHead: {
    eyebrow: "LES PERSONNES QUI SERONT CHEZ VOUS",
    title: () => "Quatre plombiers. C’est toute l’équipe.",
    lede: "Pas de sous-traitants, pas d’inconnus qui tournent via une appli. Vous rencontrerez l’un de ces quatre-là, et vous saurez lequel avant qu’il ne frappe.",
  },
  crew: [
    { initials: "MH", name: "Marcus Hale", role: "Gérant · Maître plombier", years: "19 ans sur le terrain", credential: "Couvert par notre décennale" },
    { initials: "NE", name: "Nate Ellis", role: "Plombier principal", years: "11 ans sur le terrain", credential: "Couvert par notre décennale" },
    { initials: "DO", name: "Deb Ovechi", role: "Plombier · Gazier", years: "8 ans sur le terrain", credential: "Couvert par notre décennale" },
    { initials: "TR", name: "Toby Ruiz", role: "Apprenti, 3e année", years: "3 ans sur le terrain", credential: "Toujours encadré" },
  ],
  areaHead: {
    eyebrow: "ZONE D’INTERVENTION",
    title: f => `${f.radiusKm} km autour de ${f.place}. Nous refusons tout ce qui est au-delà.`,
    lede: "Une fenêtre de deux heures que nous ne pouvons pas tenir ne vaut rien pour vous, alors nous ne la vendons pas. Si vous êtes hors du rayon, nous vous le dirons au téléphone et nous vous orienterons vers quelqu’un de plus proche.",
  },
  inlineCta: {
    line: "Prêt pour un chiffre ? Obtenez votre prix fixe en quatre-vingt-dix secondes.",
    button: "Obtenir mon prix fixe  →",
  },
  /** The registration facts, under the footer and every status screen. */
  facts: f => [`SIRET ${f.siret}`, `Assurance décennale · ${f.insurer}`, "Prix TTC", "Chaque plombier vérifié"],
  footer: {
    columns: { services: "SERVICES", areas: "ZONES", company: "ENTREPRISE", contact: "CONTACT" },
    legal: ["Mentions légales", "Confidentialité", "Attestation d’assurance"],
    company: {
      guarantee: "Notre garantie",
      prices: "Prix publiés",
      reviews: "Avis",
      crew: "L’équipe",
      contact: "Contact",
    },
  },
  statusStrip: ["Tarif fixe par écrit", "Fenêtre d’arrivée de 2 heures", "Garantie 12 mois"],
  notFound: {
    code: "404",
    title: "Page introuvable",
    eyebrow: "PAGE INTROUVABLE",
    headline: ["Cette page est partie ", "dans les tuyaux."],
    body: () =>
      "Déplacée, renommée, ou elle n’a jamais existé. Votre problème de plomberie, lui, n’a bougé nulle part — voici le chemin le plus rapide pour le faire réparer.",
    primary: "call",
    secondary: "home",
  },
  serverError: {
    code: "500",
    title: "Erreur serveur",
    eyebrow: "ERREUR SERVEUR",
    headline: ["Notre faute, pas la vôtre, ", "et nous pouvons toujours réparer vos tuyaux."],
    body: f =>
      `Quelque chose a cassé de notre côté. Le téléphone fonctionne quand même, et un humain à ${f.place} y répond 24 heures sur 24.`,
    primary: "call",
    secondary: "retry",
  },
  thanks: {
    code: "✓",
    title: "Demande reçue",
    eyebrow: "DEMANDE REÇUE",
    headline: ["Nous l’avons. ", "Votre prix arrive."],
    body: () =>
      "Nous envoyons votre fourchette de prix fixe par SMS sous 10 minutes, entre 7h et 21h. Si c’est une urgence maintenant, appelez-nous — nous décrochons 24h/24.",
    primary: "call",
    secondary: "home",
  },
  backHome: "← Retour à l’accueil",
  tryAgain: "Réessayer",
  langName: "Français",
} satisfies Text;
