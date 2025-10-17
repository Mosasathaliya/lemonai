const defaultOrigin =
  typeof window !== "undefined" && window.location
    ? window.location.origin
    : "";

const ensureMailto = (value: string | null) => {
  if (!value) return null;
  return value.startsWith("mailto:") ? value : `mailto:${value}`;
};

export const brandLinks = {
  home: import.meta.env.VITE_BRAND_HOME_URL ?? null,
  docs: import.meta.env.VITE_BRAND_DOCS_URL ?? null,
  store: import.meta.env.VITE_BRAND_STORE_URL ?? null,
  updates: import.meta.env.VITE_BRAND_UPDATES_URL ?? null,
  releases: import.meta.env.VITE_BRAND_RELEASES_URL ?? null,
  contactEmail: ensureMailto(import.meta.env.VITE_BRAND_CONTACT_EMAIL ?? null),
};

export const embedMessageOrigin =
  import.meta.env.VITE_BRAND_EMBED_ORIGIN ?? defaultOrigin;
