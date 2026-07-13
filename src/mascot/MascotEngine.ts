import { SigssPanelAdapter } from '../utils/sigssPanelAdapter';

export type MascotState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'FALL' | 'CLIMB' | 'SLEEP' | 'CELEBRATE';
export type MascotDirection = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

export interface MascotConfig {
  speedMultiplier: number;
  size: number;
  opacity: number;
  callAwareness: boolean;
}

export class MascotEngine {
  // Posição e velocidade
  public x = 100;
  public y = 100;
  private vx = 0;
  private vy = 0;

  // Tamanho do mascote
  public width = 64;
  public height = 64;

  // Direção e Estado
  public state: MascotState = 'FALL';
  public direction: MascotDirection = 'RIGHT';

  // Configurações
  private config: MascotConfig = {
    speedMultiplier: 1.0,
    size: 64,
    opacity: 0.9,
    callAwareness: true
  };

  // Física básica
  private gravity = 0.35;
  private jumpForce = -9;
  private normalSpeed = 1.2;
  private runSpeed = 2.8;
  private climbSpeed = 1.0;

  // Ciclo de comportamento
  private nextStateTime = 0;
  private celebrationEndTime = 0;
  private celebrationTargetX = 0;
  private celebrationTargetY = 0;
  private isCelebrating = false;

  // Callback de desenho
  private onUpdateCallback: () => void = () => {};

  constructor() {
    this.resetToSafety();
  }

  /**
   * Redefine o mascote para uma posição segura (no chão principal) se ele se perder
   */
  public resetToSafety() {
    this.x = window.innerWidth / 2;
    this.y = 50;
    this.vx = 0;
    this.vy = 2;
    this.state = 'FALL';
  }

  /**
   * Atualiza as configurações do mascote em tempo real
   */
  public updateConfig(newConfig: Partial<MascotConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.width = this.config.size;
    this.height = this.config.size;
    
    // Normalizar velocidade e física baseado no tamanho para manter a proporção
    const scale = this.config.size / 64;
    this.gravity = 0.35 * scale;
    this.jumpForce = -9 * Math.sqrt(scale);
  }

  public getConfig(): MascotConfig {
    return this.config;
  }

  /**
   * Registra a função que será chamada a cada frame para renderizar o mascote
   */
  public onUpdate(callback: () => void) {
    this.onUpdateCallback = callback;
  }

  /**
   * Ciclo principal de atualização (Game Loop)
   */
  public update() {
    this.applyBehavior();
    this.applyPhysics();
    this.onUpdateCallback();
  }

  /**
   * Trata o comportamento e as tomadas de decisão inteligentes do mascote
   */
  private applyBehavior() {
    const now = Date.now();

    // Se estiver celebrando uma chamada, o comportamento é focado
    if (this.isCelebrating) {
      if (now > this.celebrationEndTime) {
        this.isCelebrating = false;
        this.state = 'IDLE';
        this.nextStateTime = now + 2000;
        return;
      }

      this.executeCelebrationBehavior();
      return;
    }

    // Comportamento normal baseado em temporizador
    if (now > this.nextStateTime) {
      this.decideNextState(now);
    }
  }

  /**
   * Executa a movimentação direcionada de comemoração
   */
  private executeCelebrationBehavior() {
    const speed = this.runSpeed * this.config.speedMultiplier;
    
    // Se está no ar, não pode tomar decisões de direção no chão
    if (this.state === 'JUMP' || this.state === 'FALL') {
      return;
    }

    // Calcula a distância horizontal até o centro da chamada
    const dx = this.celebrationTargetX - (this.x + this.width / 2);
    
    if (Math.abs(dx) > 40) {
      // Corre na direção da chamada
      this.state = 'RUN';
      if (dx > 0) {
        this.vx = speed;
        this.direction = 'RIGHT';
      } else {
        this.vx = -speed;
        this.direction = 'LEFT';
      }
    } else {
      // Chegou perto da chamada! Executa pulos de alegria
      this.state = 'CELEBRATE';
      this.vx = 0;
      
      // Pula se estiver no chão
      if (this.y === this.getFloorLevelAt(this.x)) {
        this.vy = this.jumpForce * 1.1; // Pulo mais alto de alegria
        this.state = 'JUMP';
        // Pequena variação horizontal no pulo
        this.vx = (Math.random() - 0.5) * 2;
      }
    }
  }

  /**
   * Decide aleatoriamente qual será a próxima ação do mascote
   */
  private decideNextState(now: number) {
    const rand = Math.random();
    const duration = 2000 + Math.random() * 5000; // Dura de 2 a 7 segundos
    this.nextStateTime = now + duration;

    // Se estiver no ar, continua caindo
    if (this.state === 'JUMP' || this.state === 'FALL') {
      return;
    }

    const currentFloor = this.getFloorLevelAt(this.x);

    // Se bater na parede lateral da tela, obriga a mudar de estado ou direção
    if (this.x <= 0) {
      this.direction = 'RIGHT';
      this.state = 'WALK';
      this.vx = this.normalSpeed * this.config.speedMultiplier;
      return;
    }
    if (this.x + this.width >= window.innerWidth) {
      this.direction = 'LEFT';
      this.state = 'WALK';
      this.vx = -this.normalSpeed * this.config.speedMultiplier;
      return;
    }

    if (rand < 0.35) {
      // Caminhar
      this.state = 'WALK';
      const goRight = Math.random() > 0.5;
      this.direction = goRight ? 'RIGHT' : 'LEFT';
      this.vx = (goRight ? this.normalSpeed : -this.normalSpeed) * this.config.speedMultiplier;
    } 
    else if (rand < 0.50) {
      // Parado (Idle)
      this.state = 'IDLE';
      this.vx = 0;
    } 
    else if (rand < 0.65) {
      // Dormir (Sleep)
      this.state = 'SLEEP';
      this.vx = 0;
    } 
    else if (rand < 0.75) {
      // Pular (Jump)
      this.state = 'JUMP';
      this.vy = this.jumpForce;
      // Define velocidade horizontal no pulo
      this.vx = (Math.random() > 0.5 ? this.normalSpeed : -this.normalSpeed) * 1.5 * this.config.speedMultiplier;
    }
    else if (rand < 0.88) {
      // Correr (Run)
      this.state = 'RUN';
      const goRight = Math.random() > 0.5;
      this.direction = goRight ? 'RIGHT' : 'LEFT';
      this.vx = (goRight ? this.runSpeed : -this.runSpeed) * this.config.speedMultiplier;
    }
    else {
      // Escalar parede lateral (Climb) se estiver perto da borda
      if (this.x < 100 || this.x + this.width > window.innerWidth - 100) {
        this.state = 'CLIMB';
        this.vx = 0;
        this.vy = -this.climbSpeed * this.config.speedMultiplier;
        this.direction = this.x < 100 ? 'LEFT' : 'RIGHT'; // Vira de frente para a parede
      } else {
        // Fallback para idle
        this.state = 'IDLE';
        this.vx = 0;
      }
    }
  }

  /**
   * Dispara a comemoração de chamada de paciente
   */
  public triggerCallReaction(patientName: string, local: string) {
    if (!this.config.callAwareness) return;

    console.log(`Mascote detectou chamada: ${patientName} no local ${local}`);
    
    // Tenta encontrar as coordenadas da caixa de chamadas
    const elements = SigssPanelAdapter.getElements();
    if (elements.callingCard) {
      const rect = elements.callingCard.getBoundingClientRect();
      this.celebrationTargetX = rect.left + rect.width / 2;
      this.celebrationTargetY = rect.top + rect.height / 2;
    } else {
      // Fallback para o centro da tela
      this.celebrationTargetX = window.innerWidth / 2;
      this.celebrationTargetY = window.innerHeight / 2;
    }

    this.isCelebrating = true;
    this.state = 'RUN';
    this.celebrationEndTime = Date.now() + 10000; // Comemora por 10 segundos
    
    // Pequeno pulo de susto inicial se estiver no chão
    const floor = this.getFloorLevelAt(this.x);
    if (this.y >= floor - 5) {
      this.vy = this.jumpForce * 0.8;
      this.state = 'JUMP';
    }
  }

  /**
   * Aplica a gravidade, acelerações, limites da tela e colisões com plataformas
   */
  private applyPhysics() {
    // 1. Caso esteja escalando
    if (this.state === 'CLIMB') {
      this.y += this.vy;
      
      // Impede de subir além do topo da tela
      if (this.y < 0) {
        this.y = 0;
        this.state = 'IDLE';
        this.vy = 0;
      }
      
      // Se chegar na base da tela, para de escalar
      const floor = this.getFloorLevelAt(this.x);
      if (this.y >= floor) {
        this.y = floor;
        this.state = 'IDLE';
        this.vy = 0;
      }
      return;
    }

    // 2. Gravidade
    const currentFloor = this.getFloorLevelAt(this.x);
    
    if (this.y < currentFloor) {
      // Está no ar
      this.vy += this.gravity;
      if (this.state !== 'JUMP') {
        this.state = 'FALL';
      }
    }

    // 3. Atualiza coordenadas
    this.x += this.vx;
    this.y += this.vy;

    // 4. Limites de colisão horizontais (Laterais da tela)
    if (this.x < 0) {
      this.x = 0;
      this.vx = -this.vx * 0.5; // Bate e quica levemente
      this.direction = 'RIGHT';
    } else if (this.x + this.width > window.innerWidth) {
      this.x = window.innerWidth - this.width;
      this.vx = -this.vx * 0.5;
      this.direction = 'LEFT';
    }

    // 5. Colisão e aterrissagem no chão ativo
    const updatedFloor = this.getFloorLevelAt(this.x);
    if (this.y >= updatedFloor) {
      this.y = updatedFloor;
      this.vy = 0;
      
      if (this.state === 'FALL' || this.state === 'JUMP') {
        // Amortece o impacto e decide próxima ação rapidamente
        this.vx = 0;
        this.state = 'IDLE';
        this.nextStateTime = Date.now() + 1000;
      }
    }
  }

  /**
   * Calcula qual é o "chão" atual na coordenada X especificada.
   * O mascote pode caminhar no topo dos boxes (callingCard e historySection) se cair sobre eles.
   */
  private getFloorLevelAt(x: number): number {
    const elements = SigssPanelAdapter.getElements();
    const mascotCenterX = x + this.width / 2;

    // Chão padrão é o rodapé do painel (se houver) ou a base da janela
    let defaultFloor = window.innerHeight - this.height;
    if (elements.footerTicker) {
      const footerRect = elements.footerTicker.getBoundingClientRect();
      defaultFloor = footerRect.top - this.height;
    }

    // Se estiver sobre a caixa de histórico lateral (Aside)
    if (elements.historySection) {
      const histRect = elements.historySection.getBoundingClientRect();
      if (mascotCenterX >= histRect.left && mascotCenterX <= histRect.right) {
        // Se o mascote estiver caindo do topo ou já em cima dela
        if (this.y + this.height <= histRect.top + 15 && this.vy >= 0) {
          return histRect.top - this.height;
        }
      }
    }

    // Se estiver sobre o card principal de chamadas
    if (elements.callingCard) {
      const cardRect = elements.callingCard.getBoundingClientRect();
      if (mascotCenterX >= cardRect.left && mascotCenterX <= cardRect.right) {
        // Se o mascote estiver vindo por cima da caixa
        if (this.y + this.height <= cardRect.top + 15 && this.vy >= 0) {
          return cardRect.top - this.height;
        }
      }
    }

    return defaultFloor;
  }
}
