"use client";

import dynamic from "next/dynamic";

/**
 * The 500. Next ships a segment's error boundary with every page under it, so
 * whatever this module imports is paid by every visitor, error or not — and
 * the screen needs the whole copy of both languages (~12 KB gz). Loaded on
 * demand instead. Nothing is lost: a server error answers 500 and the
 * boundary renders in the browser after hydration either way; now it costs
 * one more request on the failed page, and nothing on the others.
 */
const ServerError = dynamic(() => import("@/views/server-error").then(m => m.ServerError));

export default function ErrorBoundary() {
  return <ServerError />;
}
