/** Display name used everywhere instead of external source names */
export const BRAND_DISPLAY_NAME = 'CoinsClarity';

/** Strip external platform attribution from RSS/content so only our brand shows */
export function stripAppearedFirstOn(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\s*The post .+ appeared first on [^.]+\.?\s*$/i, '')
    .replace(/\s*appeared first on [^.]+\.?\s*$/i, '')
    .replace(/\s*Read more at [^.]+\.?\s*$/i, '')
    .replace(/\s*Read (the )?full article at [^.]+\.?\s*$/i, '')
    .replace(/\s*Read (the )?full story at [^.]+\.?\s*$/i, '')
    .replace(/\s*Originally (published|posted) (on|at) [^.]+\.?\s*$/i, '')
    .replace(/\s*Source:\s*[^.]+\.?\s*$/i, '')
    .replace(/\s*Continue reading (on|at) [^.]+\.?\s*$/i, '')
    .replace(/\s*View (the )?original (article|story) (on|at) [^.]+\.?\s*$/i, '')
    .replace(/\s*This (article|story) (was )?(first )?published (on|at) [^.]+\.?\s*$/i, '')
    .replace(/\s*\.?\s*Read (more|full article) (at|on) [A-Za-z0-9.-]+\.?\s*/gi, ' ')
    .replace(/\s*\.?\s*Appeared first on [A-Za-z0-9.-]+\.?\s*/gi, ' ')
    .replace(/\s*\.?\s*First (published|posted) (on|at) [A-Za-z0-9.-]+\.?\s*/gi, ' ')
    .replace(/\s*\.?\s*Via [A-Za-z0-9.-]+\.?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
