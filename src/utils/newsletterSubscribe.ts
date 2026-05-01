import { buildRssBackendBasesFromEnv, defaultPublicBackend } from './rssBackendBases';

/** First healthy base in camify → Render chain (or override). */
export function getNewsletterApiBase(): string {
  const bases = buildRssBackendBasesFromEnv();
  return (bases[0] || defaultPublicBackend()).replace(/\/$/, '');
}

/** Saves to NewsletterSubscriber — included in daily digest (~11:35 AM IST) + welcome email. */
export async function postNewsletterSubscribe(
  email: string,
  source?: string,
  apiBase?: string,
): Promise<{ ok: boolean; message: string }> {
  const cleaned = email.trim().toLowerCase();
  const bases = apiBase
    ? [apiBase.replace(/\/$/, '')]
    : buildRssBackendBasesFromEnv();

  let lastMessage = 'Network error. Try again later.';
  for (const raw of bases) {
    const base = raw.replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleaned, source: source || 'site' }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (res.ok && data.success) {
        return {
          ok: true,
          message:
            "You're in! Check your inbox — daily 3-story digest ~11:35 AM IST (unsubscribe link in every email).",
        };
      }
      lastMessage = data.error || data.message || 'Could not subscribe. Try again.';
    } catch {
      continue;
    }
  }
  return { ok: false, message: lastMessage };
}
