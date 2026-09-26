import { promises as fs, createReadStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "../config/env";

/**
 * Storage abstraction (spec section 10/19). Files are addressed by an opaque
 * `storageKey` — callers never hold a filesystem path or bucket credential.
 *
 * Two drivers:
 *  - local : writes to disk (dev / small single-server deployments)
 *  - s3    : any S3-compatible object store (AWS S3, Cloudflare R2, Spaces, MinIO)
 *            — recommended for production so high upload volume never fills the
 *            app server's disk.
 */
export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  getStream(key: string): Promise<Readable>;
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

  async getStream(key: string): Promise<Readable> {
    return createReadStream(this.resolve(key));
  }

  getBuffer(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }
}

class S3Driver implements StorageDriver {
  private readonly client: S3Client;

  constructor(private readonly bucket: string) {
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
          : undefined,
    });
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType })
    );
  }

  async getStream(key: string): Promise<Readable> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return res.Body as Readable;
  }

  async getBuffer(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body as Readable) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

function createStorage(): StorageDriver {
  if (env.STORAGE_DRIVER === "s3") {
    if (!env.S3_BUCKET) {
      throw new Error("STORAGE_DRIVER=s3 requires S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY");
    }
    return new S3Driver(env.S3_BUCKET);
  }
  return new LocalDiskDriver(path.resolve(env.STORAGE_LOCAL_DIR));
}

export const storage: StorageDriver = createStorage();

/** Builds a namespaced, collision-free storage key for a submission document. */
export function buildStorageKey(submissionId: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 10);
  return `submissions/${submissionId}/${randomUUID()}${ext}`;
}
