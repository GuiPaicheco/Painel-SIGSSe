import { SigssPanelAdapter } from '../utils/sigssPanelAdapter';
import { MascotEngine } from '../mascot/MascotEngine';
import { MascotRenderer } from '../mascot/MascotRenderer';
import { MascotConfigManager } from './config';
import { RemoteContentManager } from '../content/RemoteContentManager';

interface MascotInstance {
  engine: MascotEngine;
  renderer: MascotRenderer;
}

class SIGSSMascotCore {
  private mascots: MascotInstance[] = [];
  private isRunning = false;
  private observer: MutationObserver | null = null;
  private lastCalledPatient = '';
  private remoteUpdateUnsubscribe: (() => void) | null = null;

  public async init() {
    if (!SigssPanelAdapter.isPanelPage()) {
      console.log('Painel SIGSS+ Mascote v2.0: Página atual não identificada como painel de chamadas.');
      return;
    }

    console.log('Painel SIGSS+ Mascote v2.0: Inicializando plataforma modular...');

    // 1. Inicializar o Provedor de Conteúdo Remoto & Cache Local
    await RemoteContentManager.getInstance().init();

    // Escutar eventos de atualização dinâmica remota (Hot-Reload de Conteúdo)
    this.remoteUpdateUnsubscribe = RemoteContentManager.getInstance().onUpdate(() => {
      console.log('Painel SIGSS+ Mascote v2.0: Atualização remota recebida. Aplicando hot-reload visual...');
      this.refreshVisualSkins();
    });

    // 2. Aguardar o carregamento dos elementos cruciais do DOM
    this.waitForElementsAndStart();

    // 3. Ouvir mudanças de configurações em tempo real
    this.setupConfigListener();
  }

  private waitForElementsAndStart() {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const elements = SigssPanelAdapter.getElements();
      
      if (elements.callingCard || elements.patientName || attempts > 30) {
        clearInterval(interval);
        console.log(`Painel SIGSS+ Mascote v2.0: Elementos detectados. Iniciando motores...`);
        await this.start();
      }
    }, 500);
  }

  private async start() {
    if (this.isRunning) return;

    const settings = await MascotConfigManager.load();
    if (!settings.mascotEnabled) {
      console.log('Painel SIGSS+ Mascote v2.0: Extensão desativada nas configurações.');
      return;
    }

    this.isRunning = true;
    this.mascots = [];

    const count = settings.mascotCount || 1;
    console.log(`Painel SIGSS+ Mascote v2.0: Spawnando ${count} mascote(s)...`);

    const availableMascots = RemoteContentManager.getInstance().getMascots();
    const skinIds = availableMascots.map(m => m.id);

    for (let i = 0; i < count; i++) {
      const engine = new MascotEngine();
      
      engine.x = (window.innerWidth / (count + 1)) * (i + 1) - (settings.size / 2);
      engine.y = 80;
      
      engine.updateConfig({
        speedMultiplier: settings.speedMultiplier,
        size: settings.size,
        opacity: settings.opacity,
        callAwareness: settings.callAwareness
      });

      const renderer = new MascotRenderer(engine);

      let activeSkin = settings.mascotSkin || 'gotinha';
      if (activeSkin === 'mixed' && skinIds.length > 0) {
        activeSkin = skinIds[i % skinIds.length];
      }
      renderer.setSkin(activeSkin);

      engine.onUpdate(() => {
        renderer.render();
      });

      this.mascots.push({ engine, renderer });
    }

    this.animationLoop();
    this.setupCallObserver();
  }

  private refreshVisualSkins() {
    this.mascots.forEach(m => {
      m.renderer.updateSkinVisual();
    });
  }

  private stop() {
    this.isRunning = false;
    
    this.mascots.forEach(m => {
      m.renderer.destroy();
    });
    this.mascots = [];

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.remoteUpdateUnsubscribe) {
      this.remoteUpdateUnsubscribe();
      this.remoteUpdateUnsubscribe = null;
    }

    console.log('Painel SIGSS+ Mascote v2.0: Motores parados e limpos.');
  }

  private animationLoop = () => {
    if (!this.isRunning) return;
    
    this.mascots.forEach(m => {
      m.engine.update();
    });
    
    requestAnimationFrame(this.animationLoop);
  };

  private setupCallObserver() {
    this.lastCalledPatient = '';

    const initialElements = SigssPanelAdapter.getElements();
    if (initialElements.patientName) {
      this.lastCalledPatient = (initialElements.patientName.textContent || '').trim();
    }

    this.observer = new MutationObserver(() => {
      const elements = SigssPanelAdapter.getElements();
      if (!elements.patientName) return;

      const currentText = (elements.patientName.textContent || '').trim();

      if (
        currentText &&
        currentText !== '-' &&
        currentText.length > 2 &&
        currentText !== this.lastCalledPatient
      ) {
        console.log(`Painel SIGSS+ Mascote v2.0: Nova chamada detectada: ${currentText}`);
        this.lastCalledPatient = currentText;
        const local = (elements.localName?.textContent || '').trim();
        const professional = (elements.professionalName?.textContent || '').trim();

        this.mascots.forEach(m => {
          m.engine.triggerCallReaction(currentText, local, professional);
        });
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  private setupConfigListener() {
    MascotConfigManager.onChange((changes) => {
      if (changes.mascotEnabled) {
        const enabled = changes.mascotEnabled.newValue;
        if (enabled) {
          this.start();
        } else {
          this.stop();
        }
        return;
      }

      if (!this.isRunning) return;

      const hasStructureChanges = changes.mascotCount || changes.mascotSkin;
      
      if (hasStructureChanges) {
        console.log('Painel SIGSS+ Mascote v2.0: Alterações estruturais. Reiniciando mascotes...');
        this.stop();
        this.start();
        return;
      }

      this.mascots.forEach(m => {
        const updatedConfig: any = {};
        let hasConfigUpdate = false;

        if (changes.speedMultiplier) {
          updatedConfig.speedMultiplier = changes.speedMultiplier.newValue;
          hasConfigUpdate = true;
        }
        if (changes.size) {
          updatedConfig.size = changes.size.newValue;
          hasConfigUpdate = true;
        }
        if (changes.opacity) {
          updatedConfig.opacity = changes.opacity.newValue;
          hasConfigUpdate = true;
        }
        if (changes.callAwareness) {
          updatedConfig.callAwareness = changes.callAwareness.newValue;
          hasConfigUpdate = true;
        }

        if (hasConfigUpdate) {
          m.engine.updateConfig(updatedConfig);
        }
      });
    });
  }
}

const core = new SIGSSMascotCore();
core.init().catch(err => {
  console.error('Painel SIGSS+ Mascote v2.0: Erro na inicialização:', err);
});
