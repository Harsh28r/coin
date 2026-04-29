/** API base without trailing slash — align with footer / CTA defaults. */
export function getNewsletterApiBase(): string {
  return (process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com').replace(/\/$/, '');
}

/** Saves to NewsletterSubscriber — included in 8am UTC daily digest + welcome email. */
export async function postNewsletterSubscribe(
  email: string,
  source?: string,
  apiBase?: string,
): Promise<{ ok: boolean; message: string }> {
  const base = (apiBase || getNewsletterApiBase()).replace(/\/$/, '');
  const cleaned = email.trim().toLowerCase();
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
          "You're in! Check your inbox — daily 3-story digest hits around 8am UTC (unsubscribe link in every email).",
      };
    }
    return {
      ok: false,
      message: data.error || data.message || 'Could not subscribe. Try again.',
    };
  } catch {
    return { ok: false, message: 'Network error. Try again later.' };
  }
}
