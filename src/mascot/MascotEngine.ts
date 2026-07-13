import { SigssPanelAdapter } from '../utils/sigssPanelAdapter';

export type MascotState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'FALL' | 'CLIMB' | 'SLEEP' | 'CELEBRATE' | 'TRIP' | 'STRETCH';
export type MascotDirection = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

export interface MascotConfig {
  speedMultiplier: number;
  size: number;
  opacity: number;
  callAwareness: boolean;
}

export class MascotEngine {
  // Posição e velocidade real
  public x = 100;
  public y = 100;
  public vx = 0;
  public vy = 0;

  // Velocidades alvo para inércia / aceleração suave
  private targetVx = 0;

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
  private jumpForce = -8.5;
  private normalSpeed = 1.1;
  private runSpeed = 2.6;
  private climbSpeed = 0.9;
  private inertia = 0.15; // Fator de inércia para movimento suave

  // Ciclo de comportamento
  private nextStateTime = 0;
  private actionEndTime = 0;
  private celebrationEndTime = 0;
  private celebrationTargetX = 0;
  private celebrationTargetY = 0;
  public isCelebrating = false;
  
  // Dados de contexto das chamadas
  public currentCalledPatient = '';
  public lastAnnouncedHour = -1;

  // Callback de desenho
  private onUpdateCallback: () => void = () => {};

  constructor() {
    this.resetToSafety();
  }

  public resetToSafety() {
    this.x = Math.random() * (window.innerWidth - 100) + 50;
    this.y = 50;
    this.vx = 0;
    this.vy = 2;
    this.targetVx = 0;
    this.state = 'FALL';
    this.isCelebrating = false;
  }

  public updateConfig(newConfig: Partial<MascotConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.width = this.config.size;
    this.height = this.config.size;
    
    const scale = this.config.size / 64;
    this.gravity = 0.35 * scale;
    this.jumpForce = -8.5 * Math.sqrt(scale);
  }

  public getConfig(): MascotConfig {
    return this.config;
  }

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
   * Comportamento e tomadas de decisão inteligentes
   */
  private applyBehavior() {
    const now = Date.now();

    // Atualizar dados de contexto do painel em tempo real
    this.updateContextData();

    // Se estiver celebrando chamada, o comportamento é prioritário e ignora outras ações temporárias
    if (this.isCelebrating) {
      if (now > this.celebrationEndTime) {
        this.isCelebrating = false;
        this.state = 'IDLE';
        this.nextStateTime = now + 2000;
        this.targetVx = 0;
        return;
      }

      this.executeCelebrationBehavior();
      return;
    }

    // 1. Tratamento do Estado Especial: Tropeçar (Trip)
    if (this.state === 'TRIP') {
      if (now > this.actionEndTime) {
        this.state = 'IDLE';
        this.nextStateTime = now + 1500;
        this.targetVx = 0;
      }
      return;
    }

    // 2. Tratamento do Estado Especial: Alongar (Stretch)
    if (this.state === 'STRETCH') {
      if (now > this.actionEndTime) {
        this.state = 'IDLE';
        this.nextStateTime = now + 1000;
        this.targetVx = 0;
      }
      return;
    }

    // 3. Comportamento aleatório normal baseado em tempo
    if (now > this.nextStateTime) {
      this.decideNextState(now);
    }
  }

  private updateContextData() {
    const elements = SigssPanelAdapter.getElements();
    if (elements.patientName) {
      this.currentCalledPatient = (elements.patientName.textContent || '').trim();
    }
    
    const now = new Date();
    this.lastAnnouncedHour = now.getHours();
  }

  /**
   * Movimento direcionado quando há chamadas na UBS
   */
  private executeCelebrationBehavior() {
    const speed = this.runSpeed * this.config.speedMultiplier;
    
    if (this.state === 'JUMP' || this.state === 'FALL') {
      return;
    }

    // Distância horizontal até a caixa de chamada principal
    const dx = this.celebrationTargetX - (this.x + this.width / 2);
    
    if (Math.abs(dx) > 60) {
      this.state = 'RUN';
      if (dx > 0) {
        this.targetVx = speed;
        this.direction = 'RIGHT';
      } else {
        this.targetVx = -speed;
        this.direction = 'LEFT';
      }
      
      // Se bater em uma parede enquanto corre para comemorar, tenta pular
      const floor = this.getFloorLevelAt(this.x);
      const nextFloor = this.getFloorLevelAt(this.x + (dx > 0 ? 25 : -25));
      if (nextFloor < floor - 20 && this.y >= floor - 5) {
        this.vy = this.jumpForce * 1.05;
        this.state = 'JUMP';
        this.targetVx = (dx > 0 ? speed : -speed) * 1.2;
      }
    } else {
      // Chegou! Pula de alegria continuamente
      this.state = 'CELEBRATE';
      this.targetVx = 0;
      
      if (this.y === this.getFloorLevelAt(this.x)) {
        this.vy = this.jumpForce * 1.15; // Super pulo
        this.state = 'JUMP';
        this.targetVx = (Math.random() - 0.5) * 2.5; // Leve zigue-zague no ar
      }
    }
  }

  /**
   * Decide aleatoriamente qual será a próxima ação
   */
  private decideNextState(now: number) {
    const rand = Math.random();
    const duration = 2500 + Math.random() * 4500; // 2.5s a 7s
    this.nextStateTime = now + duration;

    // Se estiver caindo ou pulando, aguarda estabilizar
    if (this.state === 'JUMP' || this.state === 'FALL') {
      return;
    }

    const currentFloor = this.getFloorLevelAt(this.x);

    // Evitar presas nas bordas da tela
    if (this.x <= 15) {
      this.direction = 'RIGHT';
      this.state = 'WALK';
      this.targetVx = this.normalSpeed * this.config.speedMultiplier;
      return;
    }
    if (this.x + this.width >= window.innerWidth - 15) {
      this.direction = 'LEFT';
      this.state = 'WALK';
      this.targetVx = -this.normalSpeed * this.config.speedMultiplier;
      return;
    }

    // Probabilidades de Comportamento
    if (rand < 0.35) {
      // Caminhar
      this.state = 'WALK';
      const goRight = Math.random() > 0.5;
      this.direction = goRight ? 'RIGHT' : 'LEFT';
      this.targetVx = (goRight ? this.normalSpeed : -this.normalSpeed) * this.config.speedMultiplier;
    } 
    else if (rand < 0.40) {
      // Tropeçar (Trip) - Raro e engraçado
      this.state = 'TRIP';
      this.actionEndTime = now + 2000;
      this.targetVx = (this.direction === 'RIGHT' ? this.normalSpeed : -this.normalSpeed) * 0.7;
    }
    else if (rand < 0.45) {
      // Alongamento (Esticar pernas)
      this.state = 'STRETCH';
      this.actionEndTime = now + 2200;
      this.targetVx = 0;
    }
    else if (rand < 0.60) {
      // Parado (Idle)
      this.state = 'IDLE';
      this.targetVx = 0;
    } 
    else if (rand < 0.70) {
      // Dormir (Sleep)
      this.state = 'SLEEP';
      this.targetVx = 0;
    } 
    else if (rand < 0.80) {
      // Pular (Jump)
      this.state = 'JUMP';
      this.vy = this.jumpForce;
      const jumpDir = Math.random() > 0.5 ? 1 : -1;
      this.targetVx = jumpDir * this.normalSpeed * 1.6 * this.config.speedMultiplier;
    }
    else if (rand < 0.90) {
      // Correr (Run)
      this.state = 'RUN';
      const goRight = Math.random() > 0.5;
      this.direction = goRight ? 'RIGHT' : 'LEFT';
      this.targetVx = (goRight ? this.runSpeed : -this.runSpeed) * this.config.speedMultiplier;
    }
    else {
      // Escalar se estiver encostado em algum box ou borda
      const isNearLeftWall = this.x < 120;
      const isNearRightWall = this.x + this.width > window.innerWidth - 120;
      
      if (isNearLeftWall || isNearRightWall) {
        this.state = 'CLIMB';
        this.targetVx = 0;
        this.vx = 0;
        this.vy = -this.climbSpeed * this.config.speedMultiplier;
        this.direction = isNearLeftWall ? 'LEFT' : 'RIGHT';
      } else {
        // Pulo em cima de um obstáculo próximo
        this.state = 'JUMP';
        this.vy = this.jumpForce * 1.1;
        const centerDir = this.x < window.innerWidth / 2 ? 1 : -1;
        this.targetVx = centerDir * this.normalSpeed * 1.8 * this.config.speedMultiplier;
      }
    }
  }

  /**
   * Dispara a comemoração de chamada de paciente de forma imediata
   */
  public triggerCallReaction(patientName: string, local: string) {
    if (!this.config.callAwareness) return;

    this.currentCalledPatient = patientName;
    const elements = SigssPanelAdapter.getElements();
    
    if (elements.callingCard) {
      const rect = elements.callingCard.getBoundingClientRect();
      this.celebrationTargetX = rect.left + rect.width / 2;
      this.celebrationTargetY = rect.top + rect.height / 2;
    } else {
      this.celebrationTargetX = window.innerWidth / 2;
      this.celebrationTargetY = window.innerHeight / 2;
    }

    this.isCelebrating = true;
    this.celebrationEndTime = Date.now() + 10000; // Comemora por 10 segundos
    
    // Força o cancelamento imediato de sonos, tropeços ou alongamentos
    this.actionEndTime = 0;
    
    // Grande pulo de susto inicial e ativa estado de pulo/corrida
    this.vy = this.jumpForce * 1.1;
    this.state = 'JUMP';
    
    // Vira de frente para a chamada e dá impulso horizontal imediato
    const dx = this.celebrationTargetX - (this.x + this.width / 2);
    this.direction = dx > 0 ? 'RIGHT' : 'LEFT';
    this.targetVx = (dx > 0 ? this.runSpeed : -this.runSpeed) * this.config.speedMultiplier;
    this.vx = this.targetVx * 0.8;
  }

  /**
   * Aplica física com aceleração e desaceleração linear para movimentos orgânicos
   */
  private applyPhysics() {
    // 1. Caso esteja escalando
    if (this.state === 'CLIMB') {
      this.y += this.vy;
      
      if (this.y < 0) {
        this.y = 0;
        this.state = 'IDLE';
        this.vy = 0;
      }
      
      const floor = this.getFloorLevelAt(this.x);
      if (this.y >= floor) {
        this.y = floor;
        this.state = 'IDLE';
        this.vy = 0;
      }
      return;
    }

    // 2. Aplicação de Inércia Horizontal (Aceleração suave)
    if (this.state === 'TRIP') {
      this.vx += (0 - this.vx) * 0.08;
    } else {
      this.vx += (this.targetVx - this.vx) * this.inertia;
    }

    // 3. Gravidade
    const currentFloor = this.getFloorLevelAt(this.x);
    
    if (this.y < currentFloor) {
      this.vy += this.gravity;
      if (this.state !== 'JUMP') {
        this.state = 'FALL';
      }
    }

    // 4. Atualização das coordenadas
    this.x += this.vx;
    this.y += this.vy;

    // 5. Colisão Lateral
    if (this.x < 0) {
      this.x = 0;
      this.vx = -this.vx * 0.4;
      this.targetVx = -this.targetVx;
      this.direction = 'RIGHT';
    } else if (this.x + this.width > window.innerWidth) {
      this.x = window.innerWidth - this.width;
      this.vx = -this.vx * 0.4;
      this.targetVx = -this.targetVx;
      this.direction = 'LEFT';
    }

    // 6. Colisão com o Chão / Plataformas
    const updatedFloor = this.getFloorLevelAt(this.x);
    if (this.y >= updatedFloor) {
      const isLanding = this.state === 'FALL' || this.state === 'JUMP';
      this.y = updatedFloor;
      this.vy = 0;
      
      if (isLanding) {
        this.targetVx = 0;
        this.vx = this.vx * 0.3;
        this.state = 'IDLE';
        this.nextStateTime = Date.now() + 800;
      }
    }
  }

  /**
   * Retorna a coordenada Y do "chão" na posição X.
   */
  private getFloorLevelAt(x: number): number {
    const elements = SigssPanelAdapter.getElements();
    const mascotCenterX = x + this.width / 2;

    let defaultFloor = window.innerHeight - this.height;
    if (elements.footerTicker) {
      const footerRect = elements.footerTicker.getBoundingClientRect();
      defaultFloor = footerRect.top - this.height;
    }

    // Plataforma A: Caixa de Histórico lateral
    if (elements.historySection) {
      const histRect = elements.historySection.getBoundingClientRect();
      if (mascotCenterX >= histRect.left && mascotCenterX <= histRect.right) {
        if (this.y + this.height <= histRect.top + 18 && this.vy >= 0) {
          return histRect.top - this.height;
        }
      }
    }

    // Plataforma B: Card grande de chamada ativa
    if (elements.callingCard) {
      const cardRect = elements.callingCard.getBoundingClientRect();
      if (mascotCenterX >= cardRect.left && mascotCenterX <= cardRect.right) {
        if (this.y + this.height <= cardRect.top + 18 && this.vy >= 0) {
          return cardRect.top - this.height;
        }
      }
    }

    return defaultFloor;
  }
}
