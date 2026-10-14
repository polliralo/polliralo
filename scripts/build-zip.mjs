// Packs the website for upload: a zip of the CONTENTS of site/, so that
// index.html sits at the top of the zip with assets/ beside it (hosts show a
// blank page or a folder listing if the files are nested one level down).
//
//   npm run zip    -> dist/nivara-coast-site.zip
//
// No dependencies: a small zip writer using Node's built-in zlib.

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SITE = join(ROOT, 'site');
const OUT_DIR = join(ROOT, 'dist');
const OUT = join(OUT_DIR, 'nivara-coast-site.zip');

// Every file in site/, in a stable order, skipping hidden files such as .DS_Store.
function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    });
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// Zip stores times in MS-DOS format (local time, two-second steps).
function dosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

const locals = [];
const centrals = [];
let offset = 0;

for (const file of listFiles(SITE)) {
  const name = Buffer.from(relative(SITE, file).split(sep).join('/'), 'utf8');
  const data = readFileSync(file);
  const packed = deflateRawSync(data, { level: 9 });
  // Photos and fonts are already compressed: store them as they are.
  const useDeflate = packed.length < data.length;
  const body = useDeflate ? packed : data;
  const method = useDeflate ? 8 : 0;
  const crc = crc32(data);
  const { time, day } = dosDateTime(statSync(file).mtime);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); // local file header
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(day, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(body.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  locals.push(local, name, body);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); // central directory header
  central.writeUInt16LE(20, 4); // version made by
  central.writeUInt16LE(20, 6); // version needed
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt16LE(time, 12);
  central.writeUInt16LE(day, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(body.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  centrals.push(central, name);

  offset += local.length + name.length + body.length;
}

const directory = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); // end of central directory
end.writeUInt16LE(centrals.length / 2, 8);
end.writeUInt16LE(centrals.length / 2, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);

mkdirSync(OUT_DIR, { recursive: true });
const zip = Buffer.concat([...locals, directory, end]);
writeFileSync(OUT, zip);
console.log(`zip    ${relative(ROOT, OUT)}: ${centrals.length / 2} files, ${(zip.length / 1024 / 1024).toFixed(1)} MB`);
