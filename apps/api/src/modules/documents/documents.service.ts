import { ApiError } from "../../utils/ApiError";
import { assertCorporateAccess } from "../../middleware/auth";
import { storage } from "../../services/storage";
import * as repo from "./documents.repository";
import { sendEmail, documentRejectedEmail } from "../notifications/email.service";
import type { AuthUser, DocumentVerificationStatus } from "@mentor/shared";

export async function verifyDocument(
  user: AuthUser,
  id: string,
  status: DocumentVerificationStatus,
  notes?: string
) {
  const doc = await repo.findWithSubmission(id);
  if (!doc) throw ApiError.notFound("Document not found");
  assertCorporateAccess(user, doc.submission.programme.corporateId);

  const updated = await repo.updateVerification(id, status, notes, user.id);

  // Notify the member on rejection (best-effort).
  if (status === "REJECTED" && doc.submission.email) {
    const tpl = documentRejectedEmail(doc.submission.memberName ?? "", doc.documentType.name, notes);
    void sendEmail({
      to: doc.submission.email,
      ...tpl,
      template: "document_rejected",
      metadata: { documentId: id },
    });
  }
  return updated;
}

/** Returns document metadata + a readable stream, after a tenant access check. */
export async function getForDownload(user: AuthUser, id: string) {
  const doc = await repo.findWithSubmission(id);
  if (!doc) throw ApiError.notFound("Document not found");
  assertCorporateAccess(user, doc.submission.programme.corporateId);
  return {
    stream: await storage.getStream(doc.storageKey),
    mimeType: doc.mimeType,
    fileName: doc.originalFileName,
  };
}
