const fs = require('fs');
const path = require('path');

/**
 * Script de Compilação e Validação de Conteúdo — Painel SIGSSe 2.0
 * Varre a estrutura modular de content/ (mascots, messages, campaigns)
 * Processa SVGs e Spritesheets PNG, valida integridade referencial e gera content/manifest.json.
 */

const CONTENT_DIR = path.join(__dirname, '../content');
const MASCOTS_DIR = path.join(CONTENT_DIR, 'mascots');
const MESSAGES_DIR = path.join(CONTENT_DIR, 'messages');
const CAMPAIGNS_DIR = path.join(CONTENT_DIR, 'campaigns');
const OUTPUT_MANIFEST = path.join(CONTENT_DIR, 'manifest.json');

const VALID_STATES = [
  'IDLE', 'WALK', 'RUN', 'JUMP', 'FALL', 'CLIMB', 'SLEEP', 'CELEBRATE', 'TRIP', 'STRETCH', 'SPEAKING', 'DRAGGED'
];

function sanitizeSvg(svgContent) {
  if (!svgContent) return '';
  return svgContent
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}

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
      sequenceNumber = 1;
    }
  }

  const nnn = String(sequenceNumber).padStart(3, '0');
  return `${datePrefix}.${nnn}`;
}

function compileContent(customDate = new Date()) {
  console.log('📦 Compilando plataforma de conteúdo declarativo (SVG + PNG Spritesheets)...');

  const compiledMascots = [];
  const compiledCampaigns = [];
  const mascotIds = new Set();

  // 1. Processar Mascotes, Skins e Animações por Spritesheet
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

      // Processar Skins
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
        } else if (skin.type === 'spritesheet' && skin.asset) {
          const pngFilePath = path.join(mascotPath, skin.asset);
          if (!fs.existsSync(pngFilePath)) {
            throw new Error(`[Content Compiler] Arquivo PNG de spritesheet de skin não encontrado: ${pngFilePath}`);
          }
          const base64Png = fs.readFileSync(pngFilePath).toString('base64');
          skin.src = `data:image/png;base64,${base64Png}`;
        }
        processedSkins[skinKey] = skin;
      });

      mascotData.skins = processedSkins;

      // Processar Animações por Spritesheet se existirem
      if (mascotData.animations && typeof mascotData.animations === 'object') {
        const processedAnimations = {};
        Object.keys(mascotData.animations).forEach(animKey => {
          const anim = mascotData.animations[animKey];
          
          if (!anim.frameWidth || anim.frameWidth <= 0) {
            throw new Error(`[Content Compiler] frameWidth inválido na animação '${animKey}' do mascote '${mascotData.id}'`);
          }
          if (!anim.frameHeight || anim.frameHeight <= 0) {
            throw new Error(`[Content Compiler] frameHeight inválido na animação '${animKey}' do mascote '${mascotData.id}'`);
          }
          if (!anim.frameCount || anim.frameCount <= 0) {
            throw new Error(`[Content Compiler] frameCount inválido na animação '${animKey}' do mascote '${mascotData.id}'`);
          }
          if (!anim.fps || anim.fps <= 0) {
            throw new Error(`[Content Compiler] fps inválido na animação '${animKey}' do mascote '${mascotData.id}'`);
          }
          if (anim.state && !VALID_STATES.includes(anim.state)) {
            throw new Error(`[Content Compiler] Estado FSM inválido '${anim.state}' na animação '${animKey}'`);
          }

          if (anim.asset) {
            const animAssetPath = path.join(mascotPath, anim.asset);
            if (!fs.existsSync(animAssetPath)) {
              throw new Error(`[Content Compiler] Arquivo de animação PNG não encontrado: ${animAssetPath}`);
            }
            const ext = path.extname(animAssetPath).toLowerCase();
            if (!['.png', '.webp', '.jpg', '.jpeg', '.svg'].includes(ext)) {
              throw new Error(`[Content Compiler] Extensão de animação não permitida '${ext}' em: ${animAssetPath}`);
            }
            if (ext === '.svg') {
              const rawSvg = fs.readFileSync(animAssetPath, 'utf-8');
              anim.src = sanitizeSvg(rawSvg);
            } else {
              const base64Content = fs.readFileSync(animAssetPath).toString('base64');
              const mime = ext === '.webp' ? 'image/webp' : 'image/png';
              anim.src = `data:${mime};base64,${base64Content}`;
            }
          }

          processedAnimations[animKey] = anim;
        });
        mascotData.animations = processedAnimations;
      }

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

  // 3. Processar Mensagens Avulsas
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
