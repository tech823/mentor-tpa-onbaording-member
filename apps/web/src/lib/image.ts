/**
 * Client-side image compression for document uploads.
 *
 * Phone photos are typically 3–8 MB, which many reverse proxies reject (HTTP 413)
 * and which fill server disk fast under high volume. We downscale + re-encode to
 * JPEG in the browser so the uploaded file is small (usually < 1 MB) before it
 * ever leaves the device. Non-images (e.g. PDFs) are returned untouched.
 */
interface CompressOptions {
  maxDimension?: number; // longest side, px
  maxBytes?: number; // target ceiling
  quality?: number; // starting JPEG quality (0–1)
}

export async function compressImageFile(file: File, opts: CompressOptions = {}): Promise<File> {
  const maxDimension = opts.maxDimension ?? 1600;
  const maxBytes = opts.maxBytes ?? 1_200_000; // ~1.2 MB
  let quality = opts.quality ?? 0.8;

  // Only touch raster images we can safely re-encode; leave PDFs/GIFs/etc. alone.
  const compressible = /^image\/(jpe?g|png|webp)$/i.test(file.type);
  if (!compressible || file.size <= maxBytes) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const toBlob = (q: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", q));

    let blob = await toBlob(quality);
    // Step the quality down until it fits (or we hit the floor).
    while (blob && blob.size > maxBytes && quality > 0.4) {
      quality -= 0.15;
      blob = await toBlob(quality);
    }
    if (!blob || blob.size >= file.size) return file; // no real gain → keep original

    const name = file.name.replace(/\.(png|jpe?g|webp|heic|heif)$/i, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file; // any decode failure → fall back to the original file
  }
}
