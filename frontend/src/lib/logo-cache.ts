const logoKey = (code: string) => `flightai.logo.${code.toUpperCase()}`;

export function getCachedLogo(code: string) {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(logoKey(code));
  } catch {
    return null;
  }
}

export async function cacheLogoFromApi(code: string) {
  if (typeof window === "undefined") return null;
  const existing = getCachedLogo(code);
  if (existing) return existing;

  const res = await fetch(`/api/logo?code=${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const blob = await res.blob();

  const dataUrl = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

  if (dataUrl) {
    try {
      localStorage.setItem(logoKey(code), dataUrl);
    } catch {
      // Ignore storage failures (quota, privacy mode).
    }
  }

  return dataUrl;
}
