import { LOCATION_SLUGS } from "@/entities/location";
import { site } from "@/shared/config/site";
import { createAcceptLead } from "./accept";

/** The funnel's commit point, bound to this site once. */
export const acceptLead = createAcceptLead(site, LOCATION_SLUGS);
