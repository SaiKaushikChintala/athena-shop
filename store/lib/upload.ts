import { MAX_IMAGE_BYTES } from "@/lib/images";

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name} is ${(file.size / 1_000_000).toFixed(1)} MB. The limit is 1 MB.` };
  }

  const body = new FormData();
  body.append("file", file);

  try {
    const res = await fetch("/api/images", { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
    return res.ok && data.url ? { url: data.url } : { error: data.message ?? "Upload failed." };
  } catch {
    return { error: "Could not reach the server." };
  }
}
