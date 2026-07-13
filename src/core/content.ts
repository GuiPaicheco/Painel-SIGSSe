import { SigssPanelAdapter } from '../utils/sigssPanelAdapter';
import { MascotEngine } from '../mascot/MascotEngine';
import { MascotRenderer, MascotSkinType } from '../mascot/MascotRenderer';
import { MascotConfigManager } from './config';

interface MascotInstance {
  engine: MascotEngine;
  renderer: MascotRenderer;
}

class SIGSSMascotCore {
  private mascots: MascotInstance[] = [];
  private isRunning = false;
  private observer: MutationObserver | null = null;
  private lastCalledPatient = '';

  public async init() {
    if (!SigssPanelAdapter.isPanelPage()) {
      console.log('Painel SIGSS+ Mascote: Página atual não identificada como painel de chamadas.');
      return;
    }

    console.log('Painel SIGSS+ Mascote: Inicializando na página...');

    // Aguardar o carregamento dos elementos cruciais do DOM
    this.waitForElementsAndStart();

    // Ouvir mudanças de configurações em tempo real
    this.setupConfigListener();
  }

  private waitForElementsAndStart() {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const elements = SigssPanelAdapter.getElements();
      
      if (elements.callingCard || elements.patientName || attempts > 30) {
        clearInterval(interval);
        console.log(`Painel SIGSS+ Mascote: Elementos detectados. Iniciando motor...`);
        await this.start();
      }
    }, 500);
  }

  /**
   * Inicia a quantidade configurada de mascotes na tela
   */
  private async start() {
    if (this.isRunning) return;

    // Carregar configurações locais
    const settings = await MascotConfigManager.load();
    if (!settings.mascotEnabled) {
      console.log('Painel SIGSS+ Mascote: Extensão desativada nas configurações.');
      return;
    }

    this.isRunning = true;
    this.mascots = [];

    const count = settings.mascotCount || 1;
    console.log(`Painel SIGSS+ Mascote: Spawnando ${count} mascote(s)...`);

    // Array de skins para rodar em modo "misturado" (mixed)
    const skinsList: MascotSkinType[] = [
      'gotinha',
      'gatinho_laranja',
      'gatinho_cinza',
      'gatinho_preto',
      'robozinho_azul',
      'robozinho_rosa',
      'robozinho_verde'
    ];

    for (let i = 0; i < count; i++) {
      const engine = new MascotEngine();
      
      // Espaçar os mascotes horizontalmente na inicialização para não empilharem
      engine.x = (window.innerWidth / (count + 1)) * (i + 1) - (settings.size / 2);
      engine.y = 80; // Solta do topo
      
      // Aplicar configurações físicas
      engine.updateConfig({
        speedMultiplier: settings.speedMultiplier,
        size: settings.size,
        opacity: settings.opacity,
        callAwareness: settings.callAwareness
      });

      const renderer = new MascotRenderer(engine);

      // Determinar o visual do mascote atual
      let activeSkin: MascotSkinType = 'gotinha';
      if (settings.mascotSkin === 'mixed') {
        // Escolhe uma skin rotativa para cada índice de mascote
        activeSkin = skinsList[i % skinsList.length];
      } else {
        activeSkin = settings.mascotSkin as MascotSkinType;
      }
      renderer.setSkin(activeSkin);

      // Configurar callback de render
      engine.onUpdate(() => {
        renderer.render();
      });

      this.mascots.push({ engine, renderer });
    }

    // Iniciar loop de animação comum
    this.animationLoop();

    // Configurar observador do painel
    this.setupCallObserver();
  }

  /**
   * Finaliza todos os motores e limpa os elementos visuais
   */
  private stop() {
    this.isRunning = false;
    
    // Destruir renderers
    this.mascots.forEach(m => {
      m.renderer.destroy();
    });
    this.mascots = [];

    // Desconectar observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    console.log('Painel SIGSS+ Mascote: Motores parados e todos os mascotes removidos.');
  }

  /**
   * Game Loop unificado para todos os mascotes
   */
  private animationLoop = () => {
    if (!this.isRunning) return;
    
    this.mascots.forEach(m => {
      m.engine.update();
    });
    
    requestAnimationFrame(this.animationLoop);
  };

  private setupCallObserver() {
    this.lastCalledPatient = '';

    // Carregar o nome inicial do paciente para evitar alarmes falsos de reload
    const initialElements = SigssPanelAdapter.getElements();
    if (initialElements.patientName) {
      this.lastCalledPatient = (initialElements.patientName.textContent || '').trim();
    }

    this.observer = new MutationObserver(() => {
      const elements = SigssPanelAdapter.getElements();
      if (!elements.patientName) return;

      const currentText = (elements.patientName.textContent || '').trim();

      // Se detectado paciente válido e diferente do último processado
      if (
        currentText &&
        currentText !== '-' &&
        currentText.length > 2 &&
        currentText !== this.lastCalledPatient
      ) {
        console.log(`Painel SIGSS+ Mascote: Nova chamada detectada via MutationObserver: ${currentText}`);
        this.lastCalledPatient = currentText;
        const local = elements.localName?.textContent || '';

        // Notificar todos os mascotes ativos
        this.mascots.forEach(m => {
          m.engine.triggerCallReaction(currentText, local);
        });
      }
    });

    // Observar o body inteiro para garantir suporte a recriações parciais da árvore DOM (Comum em React/Vue/Angular)
    this.observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  /**
   * Reinicia ou atualiza configurações em tempo real
   */
  private setupConfigListener() {
    MascotConfigManager.onChange((changes) => {
      // 1. Caso altere a ativação
      if (changes.mascotEnabled) {
        const enabled = changes.mascotEnabled.newValue;
        if (enabled) {
          this.start();
        } else {
          this.stop();
        }
        return;
      }

      // Se não estiver rodando, ignora as alterações agora
      if (!this.isRunning) return;

      // 2. Para alterações estruturais (quantidade ou tipo de skin), reiniciamos o motor
      const hasStructureChanges = changes.mascotCount || changes.mascotSkin;
      
      if (hasStructureChanges) {
        console.log('Painel SIGSS+ Mascote: Alterações estruturais salvas. Reiniciando mascotes...');
        this.stop();
        this.start();
        return;
      }

      // 3. Para ajustes finos dinâmicos (tamanho, velocidade, opacidade, chamada), aplicamos sem reiniciar
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
  console.error('Painel SIGSS+ Mascote: Falha na inicialização do Core:', err);
});
