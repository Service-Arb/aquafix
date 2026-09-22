import type { Metadata } from "next";
import { StatusScreen } from "@/widgets/status-screen";
import { loadNotFound } from "@/views/location/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * A real 404 — a soft one would keep the dead URL in the index. The visitor
 * still gets the offer and the phone.
 */
export default async function NotFound() {
  const { copy, target } = await loadNotFound();
  return (
    <>
      <title>{`${copy.t.notFound.title} · Aquafix`}</title>
      <StatusScreen copy={copy} status={copy.t.notFound} target={target} />
    </>
  );
}
