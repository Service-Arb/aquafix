import { site } from "@/shared/config/site";
import type { Location, PostalAddress } from "../model/types";

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

function point(
  slug: string,
  gbpName: string,
  place: string,
  address: Omit<PostalAddress, "region" | "country">,
): Location {
  return {
    slug,
    gbpName,
    place: { fr: place, en: place },
    address: { ...address, region: ARA, country: "FR" },
    phone: site.brand.phone,
    // The card's number until a point has its own WhatsApp Business line.
    whatsapp: site.brand.phone,
    geo: null,
    storefrontPhoto: null,
    landmark: null,
    serviceArea: null,
    hours: null,
    rating: null,
  };
}

export const LOCATIONS: readonly Location[] = [
  point("royat", "Aquafix Plombier Chauffagiste - Clermont-Ferrand, Royat", "Royat", {
    street: "2 Av. Abbé Védrine",
    postalCode: "63130",
    locality: "Royat",
  }),
  point("clermont-ferrand", "Aquafix — Plombier Chauffagiste Clermont-Ferrand", "Clermont-Ferrand", {
    street: "36 Rue des Chanelles",
    postalCode: "63100",
    locality: "Clermont-Ferrand",
  }),
  point("desgenettes", "Aquafix Plombier Chauffagiste - Lyon, Desgenettes", "Lyon Desgenettes", {
    street: "9 Rue Professeur Florence",
    postalCode: "69003",
    locality: "Lyon",
  }),
  point("lyon-est", "Aquafix Plombier Chauffagiste - Lyon, Est", "Lyon Est", {
    street: "9 Rue Philippe Fabia",
    postalCode: "69008",
    locality: "Lyon",
  }),
  point("la-mouche", "Aquafix Plombier Chauffagiste - Lyon, la Mouche", "Lyon La Mouche", {
    street: "44 Rue Michel Félizat",
    postalCode: "69007",
    locality: "Lyon",
  }),
  point("lyon-nord", "Aquafix Plombier Chauffagiste - Lyon, Nord", "Lyon Nord", {
    street: "21 Rue Neyret",
    postalCode: "69001",
    locality: "Lyon",
  }),
];

export const LOCATION_SLUGS: readonly string[] = LOCATIONS.map(l => l.slug);

export function bakedLocation(slug: string): Location | undefined {
  return LOCATIONS.find(l => l.slug === slug);
}
