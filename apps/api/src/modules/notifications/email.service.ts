import { db } from "../../db/index";
import { emailLogs } from "../../db/schema/index";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  template: string;
  metadata?: Record<string, unknown>;
}

/**
 * Sends a transactional email via Resend (spec section 21). Best-effort: never
 * throws into the caller's flow, and records every attempt in email_logs.
 * If RESEND_API_KEY is unset, it logs the email as "skipped" so dev works offline.
 */
export async function sendEmail(args: SendArgs): Promise<void> {
  if (!env.RESEND_API_KEY) {
    await log(args, false, "RESEND_API_KEY not configured (skipped)");
    logger.info({ to: args.to, template: args.template }, "Email skipped (no Resend key)");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: args.to, subject: args.subject, html: args.html }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(body.message ?? `Resend error ${res.status}`);
    await log(args, true, undefined, body.id);
  } catch (err) {
    await log(args, false, err instanceof Error ? err.message : "Unknown error");
    logger.error({ err, to: args.to, template: args.template }, "Email send failed");
  }
}

async function log(args: SendArgs, success: boolean, error?: string, providerId?: string) {
  try {
    await db.insert(emailLogs).values({
      toEmail: args.to,
      template: args.template,
      subject: args.subject,
      providerId,
      success,
      error,
      metadata: args.metadata,
    });
  } catch (err) {
    logger.error({ err }, "Failed to write email_logs");
  }
}

// --- templates ---
const wrap = (title: string, body: string) => `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="color:#0369a1">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="font-size:12px;color:#64748b">Mentor TPA — Corporate Onboarding</p>
  </div>`;

export function submissionConfirmationEmail(memberName: string, programmeName: string) {
  return {
    subject: `We received your submission — ${programmeName}`,
    html: wrap(
      "Submission received",
      `<p>Assalam-o-Alaikum ${memberName || "Member"},</p>
       <p>Your onboarding submission for <strong>${programmeName}</strong> has been received successfully.
       Our team will review your details and documents shortly.</p>`
    ),
  };
}

export function adminNewSubmissionEmail(memberName: string, programmeName: string, corporateName: string) {
  return {
    subject: `New submission — ${corporateName} / ${programmeName}`,
    html: wrap(
      "New onboarding submission",
      `<p>A new submission has been received.</p>
       <ul>
         <li><strong>Member:</strong> ${memberName || "—"}</li>
         <li><strong>Programme:</strong> ${programmeName}</li>
         <li><strong>Corporate:</strong> ${corporateName}</li>
       </ul>`
    ),
  };
}

export function documentRejectedEmail(memberName: string, documentName: string, notes?: string) {
  return {
    subject: `Action needed: ${documentName} needs to be re-uploaded`,
    html: wrap(
      "Document needs attention",
      `<p>Assalam-o-Alaikum ${memberName || "Member"},</p>
       <p>Your uploaded document <strong>${documentName}</strong> could not be verified.</p>
       ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}
       <p>Please contact your programme coordinator to re-submit a clear copy.</p>`
    ),
  };
}
