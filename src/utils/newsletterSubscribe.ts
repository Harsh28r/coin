import {
  buildNewsletterBackendBasesFromEnv,
  defaultPublicBackend,
} from './rssBackendBases';

/** Primary URL for newsletter (direct AWS first — same order as subscribe failover). */
export function getNewsletterApiBase(): string {
  const bases = buildNewsletterBackendBasesFromEnv();
  return (bases[0] || defaultPublicBackend()).replace(/\/$/, '');
}

/** Saves to NewsletterSubscriber — included in daily digest (~11:45 AM IST) + welcome email. */
export async function postNewsletterSubscribe(
  email: string,
  source?: string,
  apiBase?: string,
): Promise<{ ok: boolean; message: string }> {
  const cleaned = email.trim().toLowerCase();
  const bases = apiBase
    ? [apiBase.replace(/\/$/, '')]
    : buildNewsletterBackendBasesFromEnv();

  let lastMessage = 'Network error. Try again later.';
  for (const raw of bases) {
    const base = raw.replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleaned, source: source || 'site' }),
      });
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      const data = (ct.includes('json') ? await res.json().catch(() => ({})) : {}) as {
        success?: boolean;
        error?: string;
        message?: string;
        id?: string;
      };
      const looksSuccess =
        data.success === true || (res.ok && Boolean(data.id) && !data.error);
      if (res.ok && looksSuccess) {
        return {
          ok: true,
          message:
            "You're in! Check your inbox — daily 3-story digest ~11:45 AM IST (unsubscribe link in every email).",
        };
      }
      lastMessage =
        data.error ||
        data.message ||
        (!res.ok ? `Server returned ${res.status}. Try again in a moment.` : 'Could not subscribe. Try again.');
    } catch {
      continue;
    }
  }
  return { ok: false, message: lastMessage };
}
