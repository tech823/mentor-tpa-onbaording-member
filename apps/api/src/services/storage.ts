import { promises as fs, createReadStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../config/env";

/**
 * Storage abstraction (spec section 10/19). MVP writes to local disk; the same
 * interface can be backed by S3/R2 later by swapping the driver — callers only
 * ever hold an opaque `storageKey`, never a filesystem path or bucket credential.
 */
export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  getStream(key: string): ReturnType<typeof createReadStream>;
  getBuffer(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

class LocalDiskDriver implements StorageDriver {
  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    // Prevent path traversal — keys are app-generated but validate anyway.
    const safe = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    return path.join(this.baseDir, safe);
  }

  async put(key: string, data: Buffer): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  }

  getStream(key: string) {
    return createReadStream(this.resolve(key));
  }

  getBuffer(key: string) {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }
}

export const storage: StorageDriver =
  env.STORAGE_DRIVER === "local"
    ? new LocalDiskDriver(path.resolve(env.STORAGE_LOCAL_DIR))
    : // S3 driver plugs in here (Phase later) — same interface.
      new LocalDiskDriver(path.resolve(env.STORAGE_LOCAL_DIR));

/** Builds a namespaced, collision-free storage key for a submission document. */
export function buildStorageKey(submissionId: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 10);
  return `submissions/${submissionId}/${randomUUID()}${ext}`;
}
