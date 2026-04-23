import { readdirSync } from "node:fs";
import { join } from "node:path";

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

function listImages(): string[] {
  try {
    const dir = join(process.cwd(), "public", "images");
    return readdirSync(dir)
      .filter((f) => IMAGE_EXT.test(f))
      .sort();
  } catch {
    return [];
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickCardImage(key: string): string | undefined {
  const images = listImages();
  if (images.length === 0) return undefined;
  const idx = hashString(key) % images.length;
  return `/images/${images[idx]}`;
}
