import { registryMetadata } from "./generated/metadata";

export type CatalogEntry =
  (typeof registryMetadata)[number];

/** Immutable metadata for every published validator, sorted by subpath. */
export const catalog: readonly CatalogEntry[] =
  registryMetadata;

export const getCatalogEntry = (
  id: string,
): CatalogEntry | undefined =>
  registryMetadata.find((entry) => entry.id === id);

export default catalog;
