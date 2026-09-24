// The server half of the slice's public API, kept apart from `index.ts` so a
// client leaf that needs a type or a URL helper never imports the fetch layer.
export { placeSource } from "./api/source";
