import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { uploadedDocuments } from "../../db/schema/index";
import type { DocumentVerificationStatus } from "@mentor/shared";

export function findWithSubmission(id: string) {
  return db.query.uploadedDocuments.findFirst({
    where: eq(uploadedDocuments.id, id),
    with: {
      documentType: true,
      submission: { with: { programme: { columns: { corporateId: true } } } },
    },
  });
}

export async function updateVerification(
  id: string,
  status: DocumentVerificationStatus,
  notes: string | undefined,
  userId: string
) {
  const [row] = await db
    .update(uploadedDocuments)
    .set({
      verificationStatus: status,
      verificationNotes: notes,
      verifiedByUserId: userId,
      verifiedAt: new Date(),
    })
    .where(eq(uploadedDocuments.id, id))
    .returning();
  return row;
}
