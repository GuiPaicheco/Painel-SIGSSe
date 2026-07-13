import { SigssPanelAdapter } from '../utils/sigssPanelAdapter';
import { MascotEngine } from '../mascot/MascotEngine';
import { MascotRenderer, MascotSkinType } from '../mascot/MascotRenderer';
import { MascotConfigManager } from './config';

class SIGSSMascotCore {
  private engine: MascotEngine | null = null;
  private renderer: MascotRenderer | null = null;
  private isRunning = false;
  private observer: MutationObserver | null = null;

  public async init() {
    // 1. Verificar se estamos na página correta do painel
    if (!SigssPanelAdapter.isPanelPage()) {
      console.log('Painel SIGSS+ Mascote: Página atual não identificada como painel de chamadas.');
      return;
    }

    console.log('Painel SIGSS+ Mascote: Inicializando na página...');

    // 2. Aguardar o carregamento dos elementos cruciais do DOM (necessário em SPAs)
    this.waitForElementsAndStart();

    // 3. Ouvir mudanças de configurações em tempo real
    this.setupConfigListener();
  }

  /**
   * Monitora e aguarda até que os elementos do painel estejam presentes para iniciar o motor
   */
  private waitForElementsAndStart() {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const elements = SigssPanelAdapter.getElements();
      
      // Se encontrarmos o card de chamada ou o nome do paciente, ou se atingirmos o limite de tentativas
      if (elements.callingCard || elements.patientName || attempts > 30) {
        clearInterval(interval);
        console.log(`Painel SIGSS+ Mascote: Elementos detectados (tentativas: ${attempts}). Iniciando motor...`);
        await this.start();
      }
    }, 500); // Tenta a cada 500ms
  }

  /**
   * Inicia o motor de física do mascote, o loop de animação e o observador de chamadas
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

    // Instanciar o motor e o renderizador
    this.engine = new MascotEngine();
    this.renderer = new MascotRenderer(this.engine);

    // Aplicar configurações iniciais
    this.engine.updateConfig({
      speedMultiplier: settings.speedMultiplier,
      size: settings.size,
      opacity: settings.opacity,
      callAwareness: settings.callAwareness
    });
    this.renderer.setSkin(settings.mascotSkin);

    // Acoplar o callback do motor para redesenhar o mascote a cada atualização física
    this.engine.onUpdate(() => {
      if (this.renderer) {
        this.renderer.render();
      }
    });

    // Iniciar o loop de animação (hardware accelerated)
    this.animationLoop();

    // Configurar o observador do painel para escutar novas chamadas
    this.setupCallObserver();
  }

  /**
   * Finaliza o motor e remove os elementos visuais da tela
   */
  private stop() {
    this.isRunning = false;
    
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.engine = null;
    console.log('Painel SIGSS+ Mascote: Motor parado e elementos removidos.');
  }

  /**
   * Loop de animação via requestAnimationFrame
   */
  private animationLoop = () => {
    if (!this.isRunning || !this.engine) return;
    
    this.engine.update();
    requestAnimationFrame(this.animationLoop);
  };

  /**
   * Monitora alterações na div de paciente ativo para simular ou disparar a reação de susto e festa
   */
  private setupCallObserver() {
    const elements = SigssPanelAdapter.getElements();
    if (!elements.patientName) {
      console.warn('Painel SIGSS+ Mascote: Elemento de nome de paciente não encontrado. Observer não ativado.');
      return;
    }

    // Criar o MutationObserver
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const text = (elements.patientName?.textContent || '').trim();
        // Evita reagir a estados vazios ou placeholders como "-"
        if (text && text !== '-' && text.length > 2) {
          const local = elements.localName?.textContent || '';
          if (this.engine) {
            this.engine.triggerCallReaction(text, local);
          }
          break;
        }
      }
    });

    // Observar tanto alterações de conteúdo do texto quanto de elementos filhos
    this.observer.observe(elements.patientName, {
      childList: true,
      characterData: true,
      subtree: true
    });

    console.log('Painel SIGSS+ Mascote: Monitoramento de chamadas ativado via MutationObserver.');
  }

  /**
   * Atualiza as configurações em execução em tempo real sem recarregar a página
   */
  private setupConfigListener() {
    MascotConfigManager.onChange((changes) => {
      // 1. Caso altere a ativação global da extensão
      if (changes.mascotEnabled) {
        const enabled = changes.mascotEnabled.newValue;
        if (enabled) {
          this.start();
        } else {
          this.stop();
        }
      }

      // Se a extensão não estiver rodando, não aplica as outras configurações agora
      if (!this.isRunning || !this.engine || !this.renderer) return;

      // 2. Skin / Personagem
      if (changes.mascotSkin) {
        this.renderer.setSkin(changes.mascotSkin.newValue as MascotSkinType);
      }

      // 3. Física e propriedades
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
        this.engine.updateConfig(updatedConfig);
      }
    });
  }
}

// Inicializar ponto de entrada
const core = new SIGSSMascotCore();
core.init().catch(err => {
  console.error('Painel SIGSS+ Mascote: Falha na inicialização do Core:', err);
});
