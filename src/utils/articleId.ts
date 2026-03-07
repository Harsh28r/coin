/**
 * Simple hash to generate a deterministic article ID from a URL/string.
 * Matches the backend's generateArticleId(url) which uses MD5.
 * We use a lightweight JS hash here (same output is NOT required —
 * the backend already sends article_id in the RSS response; this is
 * only a fallback for when article_id is missing).
 */
export function generateArticleId(input: string): string {
  if (!input) return `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  // Simple DJB2-style hash → hex string (deterministic, fast)
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

