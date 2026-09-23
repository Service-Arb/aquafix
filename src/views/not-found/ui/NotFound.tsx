"use client";

import { useParams } from "next/navigation";
import { StatusScreen } from "@/widgets/status-screen";
import { notFoundView } from "../model/view";

/**
 * A real 404 — a soft one would keep the dead URL in the index. The visitor
 * still gets the offer and the phone. No `robots` here: Next already emits
 * `noindex` for a not-found render, and a second tag was a duplicate.
 *
 * A client component for the params only: it still renders on the server
 * into the 404 response, so a crawler and a visitor without JS get the page.
 */
export function NotFound() {
  // `null` outside a matched route — an unmatched path renders the boundary too.
  const { copy, target } = notFoundView(useParams<{ locale?: string; location?: string }>() ?? {});
  return (
    <>
      <title>{`${copy.t.notFound.title} · Aquafix`}</title>
      <StatusScreen copy={copy} status={copy.t.notFound} target={target} />
    </>
  );
}
