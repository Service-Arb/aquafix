import type { NeedLabel } from "@evinvest/kitstart/server";
import { text } from "@/entities/content";

// French whatever the visitor's language: the business reads its mail and its panel in it.
const JOB_LABELS = new Map<string, string>(Object.entries(text("fr").jobs));

/** A job in the business's words; `undefined` for one the form no longer offers. */
export const jobLabelFr: NeedLabel = need => JOB_LABELS.get(need);
