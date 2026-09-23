"use client";

import dynamic from "next/dynamic";

/**
 * Next renders a segment's not-found boundary into every page under it, so it
 * must not read the request (that would make each cached page per-request
 * again) and should not weigh on pages that never 404. The screen is a lazily
 * loaded client component over the route params; the server still renders it
 * into a 404 response. A client module itself, because `dynamic` only splits
 * code from one: from a Server Component the screen and the whole copy would
 * ride in every page's first load.
 */
const Screen = dynamic(() => import("@/views/not-found").then(m => m.NotFound));

export default function NotFound() {
  return <Screen />;
}
