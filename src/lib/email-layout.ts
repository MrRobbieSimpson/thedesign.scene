import { SITE_NAME } from "@/lib/site";

/**
 * Shared paper/ink aesthetic for every Resend email (digest, invite, …).
 * Keep tokens + shell here so templates never drift apart.
 */

/** Light (paper) — inline fallbacks for clients that strip <style>. */
export const EMAIL = {
  paper: "#f7f4ef",
  card: "#fffefb",
  ink: "#1c1914",
  muted: "#7a7468",
  rule: "rgba(28,25,20,0.12)",
  dark: {
    paper: "#16130f",
    card: "#1e1b16",
    ink: "#f4f0ea",
    muted: "#a39e94",
    rule: "rgba(244,240,234,0.12)",
  },
} as const;

export const EMAIL_FONT =
  "'Geist', 'Helvetica Neue', Helvetica, Arial, ui-sans-serif, system-ui, sans-serif";
export const EMAIL_SERIF =
  "'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const { paper, card, ink, muted, rule, dark } = EMAIL;

/** Dark-mode overrides — Apple Mail, iOS, many desktop clients. */
function darkModeCss() {
  return `
    :root { color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
      .body-bg { background: ${dark.paper} !important; }
      .shell { background: ${dark.paper} !important; }
      .card {
        background: ${dark.card} !important;
        border-color: ${dark.rule} !important;
      }
      .brand, .ink, .ink a, a.ink, a.link {
        color: ${dark.ink} !important;
      }
      .muted, .muted a, a.muted, .eyebrow {
        color: ${dark.muted} !important;
      }
      .rule-b, .rule-t, .note {
        border-color: ${dark.rule} !important;
      }
      .event-card {
        border-color: ${dark.rule} !important;
        background: ${dark.card} !important;
      }
      .cta {
        background: ${dark.ink} !important;
        color: ${dark.paper} !important;
      }
    }
  `.trim();
}

export type WrapEmailOptions = {
  /** Hidden preview text in inbox list. */
  preheader: string;
  /** Inner HTML for the card (already escaped where needed). */
  body: string;
  /** Optional line under the card (defaults to light/dark note). */
  footerNote?: string;
  /** Brand label above the card (defaults to SITE_NAME). */
  brand?: string;
};

/**
 * Full HTML document — paper shell, brand, card, footer.
 * All product emails should go through this.
 */
export function wrapEmailHtml(options: WrapEmailOptions): string {
  const brand = escapeHtml(options.brand ?? SITE_NAME);
  const footer =
    options.footerNote ??
    "Follows your device light/dark setting where supported.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet" />
  <style>
    ${darkModeCss()}
  </style>
</head>
<body class="body-bg" style="margin:0;padding:0;background:${paper}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    ${escapeHtml(options.preheader)}
  </div>
  <table class="shell" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${paper}">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:42rem;width:100%">
          <tr>
            <td class="brand" style="padding:0 0 28px;font-family:${EMAIL_FONT};font-size:14px;font-weight:500;letter-spacing:-0.02em;color:${ink}">
              ${brand}
            </td>
          </tr>
          <tr>
            <td class="card" style="padding:28px 24px;border:1px solid ${rule};border-radius:18px;background:${card}">
              ${options.body}
            </td>
          </tr>
          <tr>
            <td class="muted" style="padding:16px 4px 0;font-family:${EMAIL_FONT};font-size:11px;color:${muted};text-align:center">
              ${escapeHtml(footer)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/** Pill CTA — ink on paper (inverts in dark mode via .cta). */
export function emailCta(href: string, label: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px">
  <tr>
    <td>
      <a class="cta" href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:${ink};color:${paper};font-family:${EMAIL_FONT};font-size:14px;font-weight:500;letter-spacing:-0.01em;text-decoration:none">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`.trim();
}

/** Section eyebrow (uppercase muted label). */
export function emailEyebrow(text: string, margin = "0 0 14px"): string {
  return `<p class="muted eyebrow" style="margin:${margin};font-family:${EMAIL_FONT};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${muted}">${escapeHtml(text)}</p>`;
}

/** Serif title inside the card. */
export function emailTitle(text: string, sizePx = 28): string {
  return `<h1 class="ink title" style="margin:0 0 12px;font-family:${EMAIL_SERIF};font-weight:500;font-size:${sizePx}px;line-height:1.2;letter-spacing:-0.02em;color:${ink}">${escapeHtml(text)}</h1>`;
}

/** Muted body paragraph. */
export function emailMuted(htmlOrText: string, margin = "0 0 22px"): string {
  return `<p class="muted" style="margin:${margin};font-family:${EMAIL_FONT};font-size:15px;line-height:1.65;color:${muted}">${htmlOrText}</p>`;
}

/** Ink body paragraph. */
export function emailInk(htmlOrText: string, margin = "0 0 28px"): string {
  return `<p class="ink" style="margin:${margin};font-family:${EMAIL_FONT};font-size:15px;line-height:1.65;color:${ink}">${htmlOrText}</p>`;
}

/** Footer rule + muted links row inside the card. */
export function emailCardFooter(
  innerHtml: string,
  margin = "28px 0 0"
): string {
  return `<p class="muted rule-t" style="margin:${margin};padding-top:18px;border-top:1px solid ${rule};font-family:${EMAIL_FONT};font-size:12px;line-height:1.5;color:${muted}">${innerHtml}</p>`;
}
