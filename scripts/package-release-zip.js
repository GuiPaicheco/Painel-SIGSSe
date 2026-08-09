const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Script de Empacotamento de Release da Extensão — Painel SIGSSe v2.0.0
 * Gera o pacote ZIP de distribuição contendo exclusivamente os ativos compilados runtime de dist/ e content/.
 */

function createZipHeader(filename, uncompressedSize, compressedSize, crc, offset) {
  const buf = Buffer.alloc(30 + filename.length);
  buf.writeUInt32LE(0x04034b50, 0); // Local file header signature
  buf.writeUInt16LE(20, 4);        // Version needed to extract
  buf.writeUInt16LE(0, 6);         // General purpose bit flag
  buf.writeUInt16LE(8, 8);         // Compression method (8 = Deflate)
  buf.writeUInt16LE(0, 10);        // Last mod file time
  buf.writeUInt16LE(0, 12);        // Last mod file date
  buf.writeUInt32LE(crc, 14);      // CRC-32
  buf.writeUInt32LE(compressedSize, 18); // Compressed size
  buf.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
  buf.writeUInt16LE(filename.length, 26); // Filename length
  buf.writeUInt16LE(0, 28);        // Extra field length
  buf.write(filename, 30);
  return buf;
}

function createCentralDirectoryHeader(filename, uncompressedSize, compressedSize, crc, offset) {
  const buf = Buffer.alloc(46 + filename.length);
  buf.writeUInt32LE(0x02014b50, 0); // Central directory header signature
  buf.writeUInt16LE(20, 4);        // Version made by
  buf.writeUInt16LE(20, 6);        // Version needed to extract
  buf.writeUInt16LE(0, 8);         // General purpose bit flag
  buf.writeUInt16LE(8, 10);        // Compression method
  buf.writeUInt16LE(0, 12);        // Last mod file time
  buf.writeUInt16LE(0, 14);        // Last mod file date
  buf.writeUInt32LE(crc, 16);      // CRC-32
  buf.writeUInt32LE(compressedSize, 20); // Compressed size
  buf.writeUInt32LE(uncompressedSize, 24); // Uncompressed size
  buf.writeUInt16LE(filename.length, 28); // Filename length
  buf.writeUInt16LE(0, 30);        // Extra field length
  buf.writeUInt16LE(0, 32);        // File comment length
  buf.writeUInt16LE(0, 34);        // Disk number start
  buf.writeUInt16LE(0, 36);        // Internal file attributes
  buf.writeUInt32LE(0, 38);        // External file attributes
  buf.writeUInt32LE(offset, 42);   // Relative offset of local header
  buf.write(filename, 46);
  return buf;
}

function createEndOfCentralDirectoryRecord(entryCount, centralDirSize, centralDirOffset) {
  const buf = Buffer.alloc(22);
  buf.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  buf.writeUInt16LE(0, 4);          // Number of this disk
  buf.writeUInt16LE(0, 6);          // Disk where central directory starts
  buf.writeUInt16LE(entryCount, 8);  // Number of central directory records on this disk
  buf.writeUInt16LE(entryCount, 10); // Total number of central directory records
  buf.writeUInt32LE(centralDirSize, 12); // Size of central directory
  buf.writeUInt32LE(centralDirOffset, 16); // Offset of start of central directory
  buf.writeUInt16LE(0, 20);         // ZIP comment length
  return buf;
}

function calculateCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function packageReleaseZip() {
  console.log('📦 Empacotando extensão para lançamento da Release v2.0.0...');
  
  const distDir = path.join(__dirname, '../dist');
  const targetZipPath = path.join(distDir, 'Painel-SIGSSe-v2.0.0.zip');

  const filesToInclude = [];
  const distFiles = fs.readdirSync(distDir);
  
  distFiles.forEach(file => {
    if (file.endsWith('.zip') || file.endsWith('.map') || file === 'mock_panel.html') return;
    const fullPath = path.join(distDir, file);
    if (fs.statSync(fullPath).isFile()) {
      filesToInclude.push({ name: file, path: fullPath });
    }
  });

  const contentManifestPath = path.join(__dirname, '../content/manifest.json');
  if (fs.existsSync(contentManifestPath)) {
    filesToInclude.push({ name: 'content/manifest.json', path: contentManifestPath });
  }

  const zipChunks = [];
  const centralDirHeaders = [];
  let currentOffset = 0;

  filesToInclude.forEach(fileInfo => {
    const rawData = fs.readFileSync(fileInfo.path);
    const crc = calculateCrc32(rawData);
    const compressed = zlib.deflateRawSync(rawData);

    const localHeader = createZipHeader(fileInfo.name, rawData.length, compressed.length, crc, currentOffset);
    const centralHeader = createCentralDirectoryHeader(fileInfo.name, rawData.length, compressed.length, crc, currentOffset);

    zipChunks.push(localHeader);
    zipChunks.push(compressed);

    centralDirHeaders.push(centralHeader);
    currentOffset += localHeader.length + compressed.length;
  });

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  centralDirHeaders.forEach(ch => {
    zipChunks.push(ch);
    centralDirSize += ch.length;
  });

  const endRecord = createEndOfCentralDirectoryRecord(filesToInclude.length, centralDirSize, centralDirOffset);
  zipChunks.push(endRecord);

  const finalBuffer = Buffer.concat(zipChunks);
  fs.writeFileSync(targetZipPath, finalBuffer);

  const stats = fs.statSync(targetZipPath);
  console.log(`✅ Pacote ZIP v2.0.0 gerado com sucesso em: ${targetZipPath}`);
  console.log(`   - Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   - Total de arquivos runtime no pacote: ${filesToInclude.length}`);
  filesToInclude.forEach(f => console.log(`     • ${f.name}`));
}

if (require.main === module) {
  try {
    packageReleaseZip();
  } catch (err) {
    console.error('❌ Erro ao gerar pacote ZIP de release:', err);
    process.exit(1);
  }
}

module.exports = { packageReleaseZip };
