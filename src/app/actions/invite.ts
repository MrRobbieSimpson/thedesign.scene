"use server";

import { currentUser } from "@clerk/nextjs/server";
import { Resend } from "resend";

import { requireProfile } from "@/lib/auth";
import { buildInviteEmail } from "@/lib/invite-email";
import { absoluteUrl } from "@/lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteDesignerResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Send a digest-styled invite email to a designer.
 * Requires a signed-in profile; uses the same Resend + DIGEST_FROM_EMAIL path.
 */
export async function inviteDesignerByEmail(
  emailRaw: string
): Promise<InviteDesignerResult> {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return { ok: false, message: "Sign in to invite a designer." };
  }

  const email = emailRaw.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM_EMAIL;
  if (!apiKey || !from) {
    return {
      ok: false,
      message: "Invites aren’t configured yet. You can still copy the join link.",
    };
  }

  const user = await currentUser();
  const inviterName =
    profile.displayName?.trim() ||
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    (profile.handle ? `@${profile.handle}` : null) ||
    "A designer";

  const joinUrl = absoluteUrl("/sign-up");
  const invite = buildInviteEmail({ inviterName, joinUrl });

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: email,
      subject: invite.subject,
      html: invite.html,
      replyTo: user?.primaryEmailAddress?.emailAddress ?? undefined,
    });
  } catch (error) {
    console.error("inviteDesignerByEmail", error);
    return {
      ok: false,
      message: "Couldn’t send the invite. Try again, or copy the join link.",
    };
  }

  return {
    ok: true,
    message: `Invite sent to ${email}.`,
  };
}
