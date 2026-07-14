const localOrigin = "https://homedesignai.local";

export function sanitizeNextPath(value: string | null | undefined, fallback = "/account") {
  if (!value) return fallback;

  try {
    const url = new URL(value, localOrigin);
    if (url.origin !== localOrigin || !value.startsWith("/") || value.startsWith("//")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
