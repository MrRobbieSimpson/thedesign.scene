import {
  EMAIL,
  EMAIL_SERIF,
  emailCardFooter,
  emailCta,
  emailEyebrow,
  emailInk,
  emailMuted,
  escapeHtml,
  wrapEmailHtml,
} from "@/lib/email-layout";
import { absoluteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export type InviteEmailPayload = {
  html: string;
  subject: string;
  joinUrl: string;
};

/**
 * Invite email — same paper/ink shell as the weekly digest.
 */
export function buildInviteEmail(options: {
  inviterName: string;
  joinUrl?: string;
}): InviteEmailPayload {
  const joinUrl = options.joinUrl ?? absoluteUrl("/sign-up");
  const name = options.inviterName.trim() || "A designer";
  const safeName = escapeHtml(name);
  const home = absoluteUrl("/");
  const homeDisplay = home.replace(/^https?:\/\//, "");

  const subject = `${name} invited you to ${SITE_NAME}`;

  const title = `<h1 class="ink title" style="margin:0 0 12px;font-family:${EMAIL_SERIF};font-weight:500;font-size:28px;line-height:1.2;letter-spacing:-0.02em;color:${EMAIL.ink}">${safeName} invited you to sit with design</h1>`;

  const body = [
    emailEyebrow("An invitation", "0 0 10px"),
    title,
    emailMuted(
      `A calm place for ${escapeHtml(SITE_TAGLINE)} — writing, visuals, and events worth your attention. Quality over quantity.`
    ),
    emailInk(
      "You’re welcome to join, save what resonates, and — when you’re ready — share your own work with the scene."
    ),
    emailCta(joinUrl, "Join sit with design"),
    emailCardFooter(
      `Or open the scene anytime: <a class="muted" href="${escapeHtml(home)}" style="color:${EMAIL.muted};text-decoration:underline">${escapeHtml(homeDisplay)}</a>`
    ),
  ].join("\n");

  const html = wrapEmailHtml({
    preheader: `${name} thought you’d belong at sit with design.`,
    body,
    footerNote:
      "Sent by a member of sit with design · Follows your device light/dark setting where supported.",
  });

  return { html, subject, joinUrl };
}
