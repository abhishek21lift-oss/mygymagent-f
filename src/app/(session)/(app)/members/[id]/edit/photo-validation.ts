/**
 * Client-side checks for a member profile photo, mirroring the backend's
 * member-documents contract (`ALLOWED_DOCUMENT_MIME_TYPES`, 10 MB) so a
 * file the server would reject never starts uploading.
 */

export const PROFILE_PHOTO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB, as the server enforces

const SIGNATURES: Array<{ mime: string; bytes: number[]; mask?: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // RIFF....WEBP — bytes 0-3 are "RIFF", 8-11 are "WEBP".
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46, -1, -1, -1, -1, 0x57, 0x45, 0x42, 0x50] },
];

function readHead(file: File): Promise<Uint8Array> {
  if (typeof file.slice(0, 12).arrayBuffer === "function") {
    return file.slice(0, 12).arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }
  // Older DOM implementations without Blob.arrayBuffer (e.g. jsdom).
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

function sniffMime(head: Uint8Array): string | null {
  for (const { mime, bytes } of SIGNATURES) {
    let ok = true;
    for (let i = 0; i < bytes.length; i += 1) {
      if (bytes[i] === -1) continue;
      if (head[i] !== bytes[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return mime;
  }
  return null;
}

/**
 * Returns an error message for an unacceptable file, or null when it may
 * be uploaded. Reads magic bytes rather than trusting the extension.
 */
export async function validateProfilePhoto(file: File): Promise<string | null> {
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "Photo must be 10 MB or smaller.";
  }
  if (file.size === 0) {
    return "That file is empty — choose a photo.";
  }
  let head: Uint8Array;
  try {
    head = await readHead(file);
  } catch {
    return "Could not read that file — try another photo.";
  }
  const mime = sniffMime(head);
  if (!mime) {
    return "Use a JPEG, PNG or WebP photo.";
  }
  return null;
}
