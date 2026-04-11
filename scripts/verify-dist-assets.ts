/**
 * Fail the build if critical files are missing or invalid in `dist/`.
 * Catches deploys where `/og-image.png` would 404 or return non-image bytes.
 */
import { open, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const dist = path.join(repoRoot, "dist");

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

async function readHeadBytes(filePath: string, n: number): Promise<Buffer> {
  const fh = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(n);
    const { bytesRead } = await fh.read(buf, 0, n, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

async function assertFile(
  relative: string,
  check: "png" | "jpeg" | "any",
): Promise<void> {
  const p = path.join(dist, relative);
  const st = await stat(p).catch(() => null);
  if (!st?.isFile()) {
    throw new Error(`verify-dist-assets: missing ${relative} (expected ${p})`);
  }
  if (check === "any") return;
  const head = await readHeadBytes(p, 16);
  if (check === "png" && !head.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error(`verify-dist-assets: ${relative} is not a PNG (wrong bytes)`);
  }
  if (check === "jpeg" && !head.subarray(0, 3).equals(JPEG_MAGIC)) {
    throw new Error(`verify-dist-assets: ${relative} is not a JPEG (wrong bytes)`);
  }
}

async function main() {
  await assertFile("index.html", "any");
  await assertFile("og-image.png", "png");
  await assertFile("og-image.jpg", "jpeg");
  await assertFile("favicon.svg", "any");
  console.log("verify-dist-assets: dist root assets OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
