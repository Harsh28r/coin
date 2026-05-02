/** Split HTML after the first closing `</p>` so an in-article ad can sit between blocks. */
export function splitAfterFirstClosingPTag(html: string): { head: string; tail: string } | null {
  if (!html) return null;
  const idx = html.toLowerCase().indexOf('</p>');
  if (idx === -1) return null;
  const end = idx + 4;
  const tail = html.slice(end).trim();
  if (!tail) return null;
  return { head: html.slice(0, end), tail };
}
