import type { Place, PostalAddress } from "@evinvest/kitstart";
import type { Locale } from "./i18n";

/**
 * The baked half of every point: what the site says when the live source is
 * absent or unreachable. Names and addresses are the Google Business Profiles'
 * own. The slug is the subdomain — data, so renaming one is an edit here.
 *
 * Every point starts with the four publication fields empty, so every point
 * starts `noindex`: nothing here was supplied by the owner yet, and a page
 * that differs from its neighbours only by the street name is a doorway page.
 */
const ARA = "Auvergne-Rhône-Alpes";

function storefront(
  slug: string,
  gbpName: string,
  name: string,
  address: Omit<PostalAddress, "region" | "country">,
): Place<Locale> {
  return {
    slug,
    gbpName,
    name: { fr: name, en: name },
    presence: {
      kind: "storefront",
      address: { ...address, region: ARA, country: "FR" },
      geo: null,
      storefrontPhoto: null,
      landmark: null,
    },
    serviceArea: null,
    // The card's number for both until a point has its own line and its own
    // WhatsApp Business account; `null` reads the brand's.
    channels: { phone: null, whatsapp: null },
    hours: null,
    rating: null,
  };
}

export const PLACES: readonly Place<Locale>[] = [
  storefront("royat", "Aquafix Plombier Chauffagiste - Clermont-Ferrand, Royat", "Royat", {
    street: "2 Av. Abbé Védrine",
    postalCode: "63130",
    locality: "Royat",
  }),
  storefront("clermont-ferrand", "Aquafix — Plombier Chauffagiste Clermont-Ferrand", "Clermont-Ferrand", {
    street: "36 Rue des Chanelles",
    postalCode: "63100",
    locality: "Clermont-Ferrand",
  }),
  storefront("desgenettes", "Aquafix Plombier Chauffagiste - Lyon, Desgenettes", "Lyon Desgenettes", {
    street: "9 Rue Professeur Florence",
    postalCode: "69003",
    locality: "Lyon",
  }),
  storefront("lyon-est", "Aquafix Plombier Chauffagiste - Lyon, Est", "Lyon Est", {
    street: "9 Rue Philippe Fabia",
    postalCode: "69008",
    locality: "Lyon",
  }),
  storefront("la-mouche", "Aquafix Plombier Chauffagiste - Lyon, la Mouche", "Lyon La Mouche", {
    street: "44 Rue Michel Félizat",
    postalCode: "69007",
    locality: "Lyon",
  }),
  storefront("lyon-nord", "Aquafix Plombier Chauffagiste - Lyon, Nord", "Lyon Nord", {
    street: "21 Rue Neyret",
    postalCode: "69001",
    locality: "Lyon",
  }),
];
