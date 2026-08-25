import { absoluteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/** Light (paper) — matches weekly digest. */
const PAPER = "#f7f4ef";
const CARD = "#fffefb";
const INK = "#1c1914";
const MUTED = "#7a7468";
const RULE = "rgba(28,25,20,0.12)";

/** Dark (ink) — prefers-color-scheme where supported. */
const DARK_PAPER = "#16130f";
const DARK_CARD = "#1e1b16";
const DARK_INK = "#f4f0ea";
const DARK_MUTED = "#a39e94";
const DARK_RULE = "rgba(244,240,234,0.12)";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type InviteEmailPayload = {
  html: string;
  subject: string;
  joinUrl: string;
};

/**
 * Digest-styled invite — same paper/ink shell as the weekly note.
 */
export function buildInviteEmail(options: {
  inviterName: string;
  joinUrl?: string;
}): InviteEmailPayload {
  const joinUrl = options.joinUrl ?? absoluteUrl("/sign-up");
  const name = options.inviterName.trim() || "A designer";
  const safeName = escapeHtml(name);

  const fontStack =
    "'Geist', 'Helvetica Neue', Helvetica, Arial, ui-sans-serif, system-ui, sans-serif";
  const serifStack =
    "'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif";

  const subject = `${name} invited you to ${SITE_NAME}`;

  const html = `
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
    :root { color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
      .body-bg { background: ${DARK_PAPER} !important; }
      .shell { background: ${DARK_PAPER} !important; }
      .card {
        background: ${DARK_CARD} !important;
        border-color: ${DARK_RULE} !important;
      }
      .brand, .ink, .ink a, a.ink, a.link {
        color: ${DARK_INK} !important;
      }
      .muted, .muted a, a.muted, .eyebrow {
        color: ${DARK_MUTED} !important;
      }
      .rule-b, .rule-t {
        border-color: ${DARK_RULE} !important;
      }
      .cta {
        background: ${DARK_INK} !important;
        color: ${DARK_PAPER} !important;
      }
    }
  </style>
</head>
<body class="body-bg" style="margin:0;padding:0;background:${PAPER}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    ${safeName} thought you’d belong at sit with design.
  </div>
  <table class="shell" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PAPER}">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:42rem;width:100%">
          <tr>
            <td class="brand" style="padding:0 0 28px;font-family:${fontStack};font-size:14px;font-weight:500;letter-spacing:-0.02em;color:${INK}">
              ${escapeHtml(SITE_NAME)}
            </td>
          </tr>
          <tr>
            <td class="card" style="padding:28px 24px;border:1px solid ${RULE};border-radius:18px;background:${CARD}">
              <p class="muted eyebrow" style="margin:0 0 10px;font-family:${fontStack};font-size:11px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED}">
                An invitation
              </p>
              <h1 class="ink title" style="margin:0 0 12px;font-family:${serifStack};font-weight:500;font-size:28px;line-height:1.2;letter-spacing:-0.02em;color:${INK}">
                ${safeName} invited you to sit with design
              </h1>
              <p class="muted" style="margin:0 0 22px;font-family:${fontStack};font-size:15px;line-height:1.65;color:${MUTED}">
                A calm place for ${escapeHtml(SITE_TAGLINE)} — writing, visuals, and events worth your attention. Quality over quantity.
              </p>
              <p class="ink" style="margin:0 0 28px;font-family:${fontStack};font-size:15px;line-height:1.65;color:${INK}">
                You’re welcome to join, save what resonates, and — when you’re ready — share your own work with the scene.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px">
                <tr>
                  <td>
                    <a class="cta" href="${escapeHtml(joinUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:${INK};color:${PAPER};font-family:${fontStack};font-size:14px;font-weight:500;letter-spacing:-0.01em;text-decoration:none">
                      Join sit with design
                    </a>
                  </td>
                </tr>
              </table>
              <p class="muted rule-t" style="margin:28px 0 0;padding-top:18px;border-top:1px solid ${RULE};font-family:${fontStack};font-size:12px;line-height:1.5;color:${MUTED}">
                Or open the scene anytime:
                <a class="muted" href="${escapeHtml(absoluteUrl("/"))}" style="color:${MUTED};text-decoration:underline">${escapeHtml(absoluteUrl("/").replace(/^https?:\/\//, ""))}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td class="muted" style="padding:16px 4px 0;font-family:${fontStack};font-size:11px;color:${MUTED};text-align:center">
              Sent by a member of sit with design · Follows your device light/dark setting where supported.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { html, subject, joinUrl };
}
