// Generates placeholder PWA icons using only Node's built-in zlib — no image
// libraries required. Produces a solid #000000 square with a centered white
// triangle ("mountain") glyph, at the sizes referenced by public/manifest.json
// and the apple-touch-icon convention. Replace the output PNGs with real
// branding assets when available; re-run with `node scripts/generate-placeholder-icons.mjs`.
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const BG = [0x00, 0x00, 0x00, 0xff];
const FG = [0xff, 0xff, 0xff, 0xff];

function pngChunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateIcon(size) {
    const pixels = Buffer.alloc(size * size * 4);
    // Centered triangle glyph, roughly 60% of the icon width/height.
    const margin = Math.round(size * 0.2);
    const top = margin;
    const bottom = size - margin;
    const left = margin;
    const right = size - margin;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const offset = (y * size + x) * 4;
            let color = BG;
            if (y >= top && y <= bottom) {
                const t = (y - top) / (bottom - top);
                const halfWidth = (t * (right - left)) / 2;
                const cx = size / 2;
                if (x >= cx - halfWidth && x <= cx + halfWidth) {
                    color = FG;
                }
            }
            pixels[offset] = color[0];
            pixels[offset + 1] = color[1];
            pixels[offset + 2] = color[2];
            pixels[offset + 3] = color[3];
        }
    }

    // Raw scanlines, each prefixed with filter-type byte 0 (none).
    const raw = Buffer.alloc((size * 4 + 1) * size);
    for (let y = 0; y < size; y++) {
        const rowStart = y * (size * 4 + 1);
        raw[rowStart] = 0;
        pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type: RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    const idat = deflateSync(raw);
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    return Buffer.concat([
        signature,
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", idat),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
}

const targets = [
    ["android-chrome-192x192.png", 192],
    ["android-chrome-512x512.png", 512],
    ["apple-touch-icon.png", 180],
];

for (const [filename, size] of targets) {
    const outPath = path.join(publicDir, filename);
    writeFileSync(outPath, generateIcon(size));
    console.log(`Generated ${outPath} (${size}x${size})`);
}
