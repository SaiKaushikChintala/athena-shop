import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { MAX_IMAGE_BYTES } from "@/lib/images";
import { jsonError } from "@/lib/server-utils";

const ALLOWED_TYPES = new Set<string>(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function looksLikeImage(bytes: Buffer): boolean {
  if (bytes.length < 12) return false;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(PNG_SIGNATURE);
  const webp =
    bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  const avif = bytes.subarray(4, 8).toString("ascii") === "ftyp";
  return jpeg || png || webp || avif;
}

export async function POST(request: Request): Promise<Response> {
  const seller = await getSeller();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected a file upload", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("No file was provided", 400);
  if (!ALLOWED_TYPES.has(file.type)) return jsonError("Use a JPEG, PNG, WebP, or AVIF image.", 415);
  if (file.size > MAX_IMAGE_BYTES) {
    return jsonError(`That image is ${(file.size / 1_000_000).toFixed(1)} MB. The limit is 1 MB.`, 413);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(bytes)) return jsonError("That file is not a valid image.", 415);

  const image = await db.productImage.create({
    data: { data: bytes, mimeType: file.type, size: bytes.byteLength, sellerId: seller.id },
    select: { id: true },
  });

  return Response.json({ id: image.id, url: `/api/images/${image.id}` }, { status: 201 });
}
