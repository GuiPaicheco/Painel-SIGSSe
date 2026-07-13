import { MascotEngine, MascotState, MascotDirection } from './MascotEngine';

export type MascotSkinType = 'gotinha' | 'robozinho' | 'gatinho';

export class MascotRenderer {
  private containerEl: HTMLDivElement | null = null;
  private spriteEl: HTMLDivElement | null = null;
  private balloonEl: HTMLDivElement | null = null;
  private engine: MascotEngine;
  private currentSkin: MascotSkinType = 'gotinha';
  private healthTipInterval = 0;
  private lastTipTime = 0;

  // Lista de dicas de saúde curtas para exibir em salas de espera da UBS
  private healthTips = [
    "Beba água diariamente! 💧",
    "Lave as mãos com frequência! 🧼",
    "Mantenha sua vacinação em dia! 💉",
    "Evite automedicação. Consulte um médico! 🩺",
    "Se estiver gripado, use máscara! 😷",
    "Pratique atividades físicas regularmente! 🏃‍♂️",
    "Alimente-se de forma saudável! 🍎",
    "Combata focos de dengue em sua casa! 🦟"
  ];

  constructor(engine: MascotEngine) {
    this.engine = engine;
    this.injectStyles();
    this.createMascotElements();
    this.setSkin('gotinha');
    this.startHealthTipsTimer();
  }

  /**
   * Remove os elementos do mascote da página (cleanup)
   */
  public destroy() {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
    }
    window.clearInterval(this.healthTipInterval);
  }

  /**
   * Define o visual (skin) do mascote
   */
  public setSkin(skin: MascotSkinType) {
    this.currentSkin = skin;
    if (!this.spriteEl) return;

    switch (skin) {
      case 'gotinha':
        this.spriteEl.innerHTML = this.getGotinhaSVG();
        break;
      case 'robozinho':
        this.spriteEl.innerHTML = this.getRobozinhoSVG();
        break;
      case 'gatinho':
        this.spriteEl.innerHTML = this.getGatinhoSVG();
        break;
    }
  }

  /**
   * Desenha/atualiza as coordenadas, escala, opacidade e classes de animação na página
   */
  public render() {
    if (!this.containerEl || !this.spriteEl || !this.balloonEl) return;

    const config = this.engine.getConfig();

    // 1. Atualizar tamanho, posição e opacidade do container
    this.containerEl.style.left = `${this.engine.x}px`;
    this.containerEl.style.top = `${this.engine.y}px`;
    this.containerEl.style.width = `${this.engine.width}px`;
    this.containerEl.style.height = `${this.engine.height}px`;
    this.containerEl.style.opacity = `${config.opacity}`;

    // 2. Atualizar classes de estado e direção
    this.spriteEl.className = `sigss-mascot-sprite sigss-skin-${this.currentSkin} state-${this.engine.state.toLowerCase()} dir-${this.engine.direction.toLowerCase()}`;

    // 3. Atualizar balão de informações/reações
    this.updateBalloon(config.callAwareness);
  }

  /**
   * Gerencia os balões de diálogo acima do mascote (Zzz, exclamações e dicas de saúde)
   */
  private updateBalloon(callAwareness: boolean) {
    if (!this.balloonEl) return;

    const now = Date.now();

    // Caso A: Se estiver comemorando chamada ativamente
    if (this.engine.state === 'CELEBRATE' || (this.engine.state === 'RUN' && callAwareness && (this.engine as any).isCelebrating)) {
      this.balloonEl.textContent = "🔔 ATENÇÃO!";
      this.balloonEl.classList.add('visible', 'important-balloon');
      return;
    }

    // Caso B: Se estiver dormindo, mostra Zzz
    if (this.engine.state === 'SLEEP') {
      const zees = ['z', 'zz', 'zzz', 'Zzz'];
      const index = Math.floor((now / 800) % zees.length);
      this.balloonEl.textContent = zees[index];
      this.balloonEl.classList.add('visible');
      this.balloonEl.classList.remove('important-balloon');
      return;
    }

    // Caso C: Dicas de Saúde periódicas (exibe por 6 segundos a cada 20 segundos se o mascote estiver tranquilo)
    if (this.engine.state === 'IDLE' || this.engine.state === 'WALK') {
      const timeSinceLastTip = now - this.lastTipTime;
      if (timeSinceLastTip > 20000) {
        // Dispara uma nova dica
        const randomTip = this.healthTips[Math.floor(Math.random() * this.healthTips.length)];
        this.balloonEl.textContent = randomTip;
        this.balloonEl.classList.add('visible');
        this.balloonEl.classList.remove('important-balloon');
        this.lastTipTime = now;
      } else if (timeSinceLastTip > 6000 && this.balloonEl.classList.contains('visible') && !this.balloonEl.classList.contains('important-balloon')) {
        // Esconde a dica após 6 segundos
        this.balloonEl.classList.remove('visible');
      }
    } else {
      // Se estiver correndo ou pulando, esconde balão de dicas para focar na ação física
      if (!this.balloonEl.classList.contains('important-balloon')) {
        this.balloonEl.classList.remove('visible');
      }
    }
  }

  private startHealthTipsTimer() {
    this.lastTipTime = Date.now() - 10000; // Começa a primeira dica em 10 segundos
  }

  /**
   * Cria os elementos HTML necessários no body da página
   */
  private createMascotElements() {
    // Container Principal
    this.containerEl = document.createElement('div');
    this.containerEl.id = 'sigss-mascot-container';
    this.containerEl.className = 'sigss-mascot-container';

    // Sprite (onde o SVG é renderizado)
    this.spriteEl = document.createElement('div');
    this.spriteEl.className = 'sigss-mascot-sprite';

    // Balão de Diálogo/Animação
    this.balloonEl = document.createElement('div');
    this.balloonEl.className = 'sigss-mascot-balloon';

    this.containerEl.appendChild(this.balloonEl);
    this.containerEl.appendChild(this.spriteEl);
    document.body.appendChild(this.containerEl);
  }

  /**
   * Injeta o arquivo de estilos CSS para controlar todas as animações e estilos visuais do mascote
   */
  private injectStyles() {
    if (document.getElementById('sigss-mascot-styles')) return;

    const style = document.createElement('style');
    style.id = 'sigss-mascot-styles';
    style.textContent = `
      .sigss-mascot-container {
        position: fixed;
        z-index: 999999;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        will-change: left, top, width, height;
      }

      .sigss-mascot-sprite {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease;
      }

      .sigss-mascot-sprite svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      /* Direção Horizontal */
      .sigss-mascot-sprite.dir-left {
        transform: scaleX(-1);
      }

      /* Balão de diálogo premium */
      .sigss-mascot-balloon {
        position: absolute;
        bottom: 105%;
        background-color: #1e293b;
        color: #f1f5f9;
        border: 2px solid #3b82f6;
        border-radius: 12px;
        padding: 8px 12px;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(10px) scale(0.8);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000000;
      }

      .sigss-mascot-balloon::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px;
        border-style: solid;
        border-color: #3b82f6 transparent transparent transparent;
      }

      .sigss-mascot-balloon.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      /* Balão especial de comemoração/alerta */
      .sigss-mascot-balloon.important-balloon {
        background-color: #dc2626;
        border-color: #f87171;
        color: #ffffff;
        animation: pulseImportant 0.5s ease-in-out infinite alternate;
      }

      .sigss-mascot-balloon.important-balloon::after {
        border-color: #f87171 transparent transparent transparent;
      }

      @keyframes pulseImportant {
        from { transform: translateY(0) scale(1); }
        to { transform: translateY(-4px) scale(1.08); }
      }

      /* ==========================================================================
         ANIMAÇÕES DOS ESTADOS DO MASCOTE (CSS KEYFRAMES)
         ========================================================================== */
      
      /* 1. IDLE (Respiração leve) */
      .state-idle svg {
        animation: mascotBreath 1.6s ease-in-out infinite;
      }

      @keyframes mascotBreath {
        0%, 100% { transform: translateY(0) scaleY(1); }
        50% { transform: translateY(1px) scaleY(0.96) scaleX(1.02); }
      }

      /* 2. WALK (Balanço horizontal) */
      .state-walk svg {
        animation: mascotWalk 0.6s ease-in-out infinite;
      }

      @keyframes mascotWalk {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-3px) rotate(-4deg); }
        50% { transform: translateY(0) rotate(0deg); }
        75% { transform: translateY(-3px) rotate(4deg); }
      }

      /* 3. RUN (Balanço horizontal rápido) */
      .state-run svg {
        animation: mascotRun 0.35s linear infinite;
      }

      @keyframes mascotRun {
        0%, 100% { transform: translateY(0) scaleY(1) rotate(-2deg); }
        50% { transform: translateY(-5px) scaleY(0.9) rotate(5deg); }
      }

      /* 4. SLEEP (Respiração muito lenta e deitado) */
      .state-sleep {
        transform: rotate(90deg) translateY(10px) !important;
      }
      
      .state-sleep.dir-left {
        transform: scaleX(-1) rotate(90deg) translateY(10px) !important;
      }

      .state-sleep svg {
        animation: mascotSleep 3s ease-in-out infinite;
      }

      @keyframes mascotSleep {
        0%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.85; }
        50% { transform: scaleX(0.95) scaleY(0.95); opacity: 0.98; }
      }

      /* 5. JUMP (Estica ao pular) */
      .state-jump svg {
        transform: scaleY(1.15) scaleX(0.9);
      }

      /* 6. FALL (Encolhe na queda) */
      .state-fall svg {
        transform: scaleY(0.9) scaleX(1.1);
      }

      /* 7. CLIMB (Balanço vertical ao subir) */
      .state-climb svg {
        animation: mascotClimb 0.5s linear infinite;
      }

      @keyframes mascotClimb {
        0%, 100% { transform: translateY(0) scaleX(1); }
        50% { transform: translateY(-2px) scaleX(0.92) scaleY(1.08); }
      }

      /* 8. CELEBRATE (Pulo rotativo rápido / Comemoração) */
      .state-celebrate svg {
        animation: mascotCelebrate 0.5s ease-in-out infinite;
      }

      @keyframes mascotCelebrate {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-12px) rotate(180deg); }
        100% { transform: translateY(0) rotate(360deg); }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ==========================================================================
  // VETORES SVG DOS PERSONAGENS (Desenhados via código de forma nítida e fofa)
  // ==========================================================================

  /**
   * Gotinha do SUS (Droplet Mascot)
   */
  private getGotinhaSVG(): string {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Pernas/Pés -->
        <ellipse cx="22" cy="58" rx="7" ry="4" fill="#3b82f6"/>
        <ellipse cx="42" cy="58" rx="7" ry="4" fill="#3b82f6"/>
        <path d="M22 52V58M42 52V58" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
        
        <!-- Corpo da Gotinha (Forma de gota suave) -->
        <path d="M32 4C32 4 12 30 12 42C12 52.5 21 57 32 57C43 57 52 52.5 52 42C52 30 32 4 32 4Z" fill="#ffffff" stroke="#3b82f6" stroke-width="3"/>
        
        <!-- Colete/Detalhe Azul (Identidade Visual SUS) -->
        <path d="M16 43.5C21 47 43 47 48 43.5C48 43.5 45 54 32 54C19 54 16 43.5 16 43.5Z" fill="#60a5fa" opacity="0.85"/>
        <rect x="30" y="47" width="4" height="6" fill="#2563eb" rx="1"/>
        <rect x="29" y="49" width="6" height="2" fill="#2563eb" rx="1"/>

        <!-- Olhos Animados -->
        <circle cx="25" cy="33" r="3.5" fill="#1e293b"/>
        <circle cx="39" cy="33" r="3.5" fill="#1e293b"/>
        <circle cx="26.5" cy="31.5" r="1.2" fill="#ffffff"/>
        <circle cx="40.5" cy="31.5" r="1.2" fill="#ffffff"/>
        
        <!-- Bochechas Coradas -->
        <ellipse cx="20" cy="36.5" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.6"/>
        <ellipse cx="44" cy="36.5" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.6"/>

        <!-- Boca Sorridente -->
        <path d="M29 37.5C29.5 39 34.5 39 35 37.5" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>

        <!-- Bracinhos -->
        <path d="M13 38C8 36 6 32 6 32" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        <path d="M51 38C56 36 58 32 58 32" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
  }

  /**
   * Robozinho Assistente de Saúde (Health Bot)
   */
  private getRobozinhoSVG(): string {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Chama/Propulsor flutuante -->
        <path d="M32 58C32 58 27 50 32 46C37 50 32 58 32 58Z" fill="#ff7e00" opacity="0.8"/>
        <path d="M32 56C32 56 29 51 32 48C35 51 32 56 32 56Z" fill="#ffb800"/>

        <!-- Antena e Luz Superior -->
        <line x1="32" y1="12" x2="32" y2="4" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="4" r="3" fill="#3b82f6" stroke="#93c5fd" stroke-width="1"/>

        <!-- Corpo Principal Redondo -->
        <rect x="14" y="12" width="36" height="34" rx="18" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>
        
        <!-- Tela/Visor Digital -->
        <rect x="20" y="18" width="24" height="15" rx="5" fill="#0f172a"/>

        <!-- Olhos Digitais de LED -->
        <rect class="bot-eye" x="24" y="23" width="4" height="5" rx="1.5" fill="#38bdf8"/>
        <rect class="bot-eye" x="36" y="23" width="4" height="5" rx="1.5" fill="#38bdf8"/>
        
        <!-- Simbolo Médio de Coração/Pulso no peito -->
        <path d="M28 41H31.5L32.5 37L33.5 44L34.5 41H36" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Bracinhos Flutuantes Mecânicos -->
        <path d="M12 28C7 28 6 34 6 34" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
        <path d="M52 28C57 28 58 34 58 34" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
  }

  /**
   * Gatinho de Pixel Art Minimalista (Cute Cat)
   */
  private getGatinhoSVG(): string {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Rabo do Gato -->
        <path d="M48 48C52 48 56 44 56 38C56 32 53 30 50 30" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>

        <!-- Patinhas -->
        <rect x="18" y="52" width="6" height="8" rx="2" fill="#d97706"/>
        <rect x="27" y="52" width="6" height="8" rx="2" fill="#d97706"/>
        <rect x="36" y="52" width="6" height="8" rx="2" fill="#d97706"/>
        
        <!-- Corpo do Gato -->
        <rect x="12" y="24" width="34" height="30" rx="12" fill="#f59e0b" stroke="#d97706" stroke-width="2.5"/>
        <rect x="16" y="28" width="26" height="22" rx="8" fill="#fbbf24"/>

        <!-- Orelhinhas -->
        <path d="M16 25L10 12L22 23Z" fill="#d97706"/>
        <path d="M38 25L44 12L32 23Z" fill="#d97706"/>
        <path d="M16 23L13 16L20 22Z" fill="#fca5a5"/>
        <path d="M38 23L41 16L34 22Z" fill="#fca5a5"/>

        <!-- Olhos de Gato (Pretos com brilho branco) -->
        <circle cx="21" cy="34" r="3.2" fill="#1e293b"/>
        <circle cx="33" cy="34" r="3.2" fill="#1e293b"/>
        <circle cx="22" cy="32.8" r="1" fill="#ffffff"/>
        <circle cx="34" cy="32.8" r="1" fill="#ffffff"/>

        <!-- Focinho de Gatinho -->
        <path d="M26 37.5L27 36L28 37.5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M25 39C25.5 39.8 27 39.8 27 39M27 39C27 39.8 28.5 39.8 29 39" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>

        <!-- Bigodes -->
        <line x1="8" y1="36" x2="16" y2="37" stroke="#92400e" stroke-width="1.5"/>
        <line x1="8" y1="39" x2="16" y2="39" stroke="#92400e" stroke-width="1.5"/>
        <line x1="46" y1="36" x2="38" y2="37" stroke="#92400e" stroke-width="1.5"/>
        <line x1="46" y1="39" x2="38" y2="39" stroke="#92400e" stroke-width="1.5"/>
      </svg>
    `;
  }
}
