import fs from 'node:fs';
import zlib from 'node:zlib';

function makePng(w, h, rgbaData) {
  const raw = [];
  for (let y = 0; y < h; y++) {
    raw.push(0); // filter type 0
    for (let x = 0; x < w * 4; x++) {
      raw.push(rgbaData[y * w * 4 + x]);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw), { level: 9 });

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const tag = Buffer.from(type);
    const body = Buffer.concat([tag, data]);
    const crc = Buffer.alloc(4);
    // calculate crc32
    let c = 0xffffffff;
    for (let i = 0; i < body.length; i++) {
      c ^= body[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    crc.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
  };

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const w = 64;
const h = 64;
const pixels = Buffer.alloc(w * h * 4);

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * 4;
    const dx = Math.max(0, 18 - x, x - 45);
    const dy = Math.max(0, 18 - y, y - 45);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 14) {
      pixels[idx] = 0;
      pixels[idx + 1] = 0;
      pixels[idx + 2] = 0;
      pixels[idx + 3] = 0;
      continue;
    }

    const ratio = (x + y) / (2 * 64);
    let r = Math.round(13 + ratio * 2);
    let g = Math.round(148 - ratio * 54);
    let b = Math.round(136 - ratio * 47);
    let a = 255;

    if (dist > 12.5) {
      r = 255;
      g = 255;
      b = 255;
      a = Math.round(((14 - dist) / 1.5) * 100);
    }

    if (20 <= y && y <= 25 && 24 <= x && x <= 40) {
      if (y === 20 || x === 24 || x === 25 || x === 39 || x === 40) {
        r = 245; g = 158; b = 11; a = 255;
      }
    }

    if (28 <= y && y <= 48) {
      if ((19 <= x && x <= 22) || (27 <= x && x <= 30) || (36 <= y && y <= 39 && 19 <= x && x <= 30)) {
        r = 255; g = 255; b = 255; a = 255;
      }
    }

    if (28 <= y && y <= 48) {
      const t = (y - 28) / 20.0;
      const vxLeft = 35 + t * 5;
      const vxRight = 45 - t * 5;
      if (Math.abs(x - vxLeft) <= 1.5 || Math.abs(x - vxRight) <= 1.5) {
        r = 245; g = 158; b = 11; a = 255;
      }
    }

    if ((x - 47) ** 2 + (y - 24) ** 2 <= 4) {
      r = 254; g = 240; b = 138; a = 255;
    }

    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = a;
  }
}

const pngBytes = makePng(w, h, pixels);

// Build ICO header
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type 1 = ICO
icoHeader.writeUInt16LE(1, 4); // count 1

const icoEntry = Buffer.alloc(16);
icoEntry[0] = w < 256 ? w : 0;
icoEntry[1] = h < 256 ? h : 0;
icoEntry[2] = 0; // color palette
icoEntry[3] = 0; // reserved
icoEntry.writeUInt16LE(1, 4); // color planes
icoEntry.writeUInt16LE(32, 6); // bits per pixel
icoEntry.writeUInt32LE(pngBytes.length, 8); // size of image
icoEntry.writeUInt32LE(22, 12); // offset

const icoBuffer = Buffer.concat([icoHeader, icoEntry, pngBytes]);
fs.writeFileSync('public/favicon.ico', icoBuffer);
console.log('Successfully wrote public/favicon.ico with HIRE-VIA brand icon');
