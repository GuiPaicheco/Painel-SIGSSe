const fs = require('fs');
const path = require('path');

/**
 * Script de Compilação e Validação de Conteúdo — Painel SIGSSe 2.0
 * Varre a estrutura modular de content/ (mascots, messages, campaigns)
 * Injete SVGs estáticos, valida integridade referencial e gera content/manifest.json.
 */

const CONTENT_DIR = path.join(__dirname, '../content');
const MASCOTS_DIR = path.join(CONTENT_DIR, 'mascots');
const MESSAGES_DIR = path.join(CONTENT_DIR, 'messages');
const CAMPAIGNS_DIR = path.join(CONTENT_DIR, 'campaigns');
const OUTPUT_MANIFEST = path.join(CONTENT_DIR, 'manifest.json');

function sanitizeSvg(svgContent) {
  if (!svgContent) return '';
  return svgContent
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Calcula a versão de conteúdo de forma incremental e monotônica (YYYY.MM.DD.NNN)
 */
function calculateNextContentVersion(now = new Date(), manifestPath = OUTPUT_MANIFEST) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}.${month}.${day}`;

  let sequenceNumber = 1;

  if (fs.existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (existing && typeof existing.contentVersion === 'string') {
        const parts = existing.contentVersion.split('.');
        if (parts.length === 4) {
          const existingPrefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
          if (existingPrefix === datePrefix) {
            const currentSeq = parseInt(parts[3], 10);
            if (!isNaN(currentSeq)) {
              sequenceNumber = currentSeq + 1;
            }
          }
        }
      }
    } catch (e) {
      // Se o manifesto no disco estiver corrompido, inicia em 001
      sequenceNumber = 1;
    }
  }

  const nnn = String(sequenceNumber).padStart(3, '0');
  return `${datePrefix}.${nnn}`;
}

function compileContent(customDate = new Date()) {
  console.log('📦 Compilando plataforma de conteúdo declarativo...');

  const compiledMascots = [];
  const compiledCampaigns = [];
  const mascotIds = new Set();

  // 1. Processar Mascotes e Skins
  if (fs.existsSync(MASCOTS_DIR)) {
    const mascotFolders = fs.readdirSync(MASCOTS_DIR);
    mascotFolders.forEach(folder => {
      const mascotPath = path.join(MASCOTS_DIR, folder);
      if (!fs.statSync(mascotPath).isDirectory()) return;

      const mascotJsonFile = path.join(mascotPath, 'mascot.json');
      if (!fs.existsSync(mascotJsonFile)) {
        throw new Error(`[Content Compiler] Arquivo mascot.json não encontrado em: ${mascotPath}`);
      }

      const mascotData = JSON.parse(fs.readFileSync(mascotJsonFile, 'utf-8'));

      if (mascotIds.has(mascotData.id)) {
        throw new Error(`[Content Compiler] ID de mascote duplicado: ${mascotData.id}`);
      }
      mascotIds.add(mascotData.id);

      if (!mascotData.skins || !mascotData.skins[mascotData.defaultSkin]) {
        throw new Error(`[Content Compiler] Skin default '${mascotData.defaultSkin}' não existe no mascote '${mascotData.id}'`);
      }

      const processedSkins = {};
      Object.keys(mascotData.skins).forEach(skinKey => {
        const skin = mascotData.skins[skinKey];
        if (skin.type === 'svg' && skin.asset) {
          const svgFilePath = path.join(mascotPath, skin.asset);
          if (!fs.existsSync(svgFilePath)) {
            throw new Error(`[Content Compiler] Arquivo SVG de skin não encontrado: ${svgFilePath}`);
          }
          const rawSvg = fs.readFileSync(svgFilePath, 'utf-8');
          skin.src = sanitizeSvg(rawSvg);
        }
        processedSkins[skinKey] = skin;
      });

      mascotData.skins = processedSkins;
      compiledMascots.push(mascotData);
    });
  }

  // 2. Processar Campanhas
  if (fs.existsSync(CAMPAIGNS_DIR)) {
    const campaignFiles = fs.readdirSync(CAMPAIGNS_DIR);
    campaignFiles.forEach(file => {
      if (!file.endsWith('.json')) return;
      const campaignPath = path.join(CAMPAIGNS_DIR, file);
      const campaignData = JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));
      compiledCampaigns.push(campaignData);
    });
  }

  // 3. Processar Mensagens Avulsas como Campanha Geral
  if (fs.existsSync(MESSAGES_DIR)) {
    const messageFiles = fs.readdirSync(MESSAGES_DIR);
    const generalMessages = [];
    messageFiles.forEach(file => {
      if (!file.endsWith('.json')) return;
      const messagePath = path.join(MESSAGES_DIR, file);
      const msgs = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
      if (Array.isArray(msgs)) {
        generalMessages.push(...msgs);
      }
    });

    if (generalMessages.length > 0) {
      compiledCampaigns.push({
        id: 'campanha_mensagens_gerais',
        title: 'Mensagens Institucionais Gerais',
        priority: 5,
        active: true,
        messages: generalMessages
      });
    }
  }

  const contentVersion = calculateNextContentVersion(customDate);

  const finalManifest = {
    contentVersion,
    schemaVersion: '1.0',
    minExtensionVersion: '2.0.0',
    updatedAt: customDate.toISOString(),
    mascots: compiledMascots,
    campaigns: compiledCampaigns
  };

  fs.writeFileSync(OUTPUT_MANIFEST, JSON.stringify(finalManifest, null, 2), 'utf-8');
  console.log(`✅ Manifesto compilado com sucesso em content/manifest.json (Versão ${contentVersion})!`);
  console.log(`   - ${compiledMascots.length} mascote(s) processado(s)`);
  console.log(`   - ${compiledCampaigns.length} campanha(s) compilada(s)`);
  return finalManifest;
}

if (require.main === module) {
  try {
    compileContent();
  } catch (err) {
    console.error('❌ Erro na compilação de conteúdo:', err.message);
    process.exit(1);
  }
}

module.exports = { compileContent, sanitizeSvg, calculateNextContentVersion };
