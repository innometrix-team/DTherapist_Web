/**
 * Validates that a target URL uses an allowed HTTP or HTTPS protocol.
 * Prevents execution of `javascript:`, `data:`, or malformed protocols during redirection.
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string" || url.trim().length === 0) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Safely redirects the browser to an external URL after validating its protocol.
 */
export function safeRedirect(url: string | null | undefined, fallback?: () => void): boolean {
  if (url && isValidRedirectUrl(url)) {
    window.location.href = url;
    return true;
  }
  if (fallback) {
    fallback();
  }
  return false;
}

