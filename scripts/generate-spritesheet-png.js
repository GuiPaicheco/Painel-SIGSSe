const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const payload = Buffer.concat([typeBuf, data]);
  
  let crc = 0xffffffff;
  for (let i = 0; i < payload.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ payload[i]) & 0xff];
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, payload, crcBuf]);
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function generatePngSpritesheet(width = 256, height = 64, colors) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  const rawData = Buffer.alloc(height * (width * 3 + 1));
  const frameWidth = width / 4;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const frameIdx = Math.floor(x / frameWidth);
      const color = colors[frameIdx];
      
      const localX = x % frameWidth;
      const isBorder = localX < 2 || localX >= frameWidth - 2 || y < 2 || y >= height - 2;
      
      if (isBorder) {
        rawData[offset++] = 33;
        rawData[offset++] = 33;
        rawData[offset++] = 33;
      } else {
        rawData[offset++] = color[0];
        rawData[offset++] = color[1];
        rawData[offset++] = color[2];
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// 1. Spritesheet Zé Gotinha (Celebrate)
const targetDir1 = path.join(__dirname, '../content/mascots/ze-gotinha/animations/celebrate-e2e');
if (!fs.existsSync(targetDir1)) fs.mkdirSync(targetDir1, { recursive: true });
fs.writeFileSync(path.join(targetDir1, 'spritesheet.png'), generatePngSpritesheet(256, 64, [
  [0, 230, 118], [255, 215, 0], [3, 169, 244], [233, 30, 99]
]));

// 2. Spritesheet Robozinho (Dance / Run) - Adição 100% Declarativa sem TS
const targetDir2 = path.join(__dirname, '../content/mascots/robozinho/animations/dance-e2e');
if (!fs.existsSync(targetDir2)) fs.mkdirSync(targetDir2, { recursive: true });
fs.writeFileSync(path.join(targetDir2, 'spritesheet.png'), generatePngSpritesheet(256, 64, [
  [156, 39, 176], [103, 58, 183], [63, 81, 181], [33, 150, 243]
]));

console.log('✅ Spritesheets PNG de teste gerados com sucesso para Zé Gotinha e Robozinho!');
