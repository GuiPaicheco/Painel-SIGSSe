import { MascotEngine, MascotState, MascotDirection } from './MascotEngine';

export type MascotSkinType = 'gotinha' | 'robozinho' | 'gatinho';

export class MascotRenderer {
  private containerEl: HTMLDivElement | null = null;
  private spriteEl: HTMLDivElement | null = null;
  private balloonEl: HTMLDivElement | null = null;
  private engine: MascotEngine;
  private currentSkin: MascotSkinType = 'gotinha';
  private lastTipTime = 0;
  private activeBubbleContent = '';

  // Dicas e falas normais (humanizadas e simpáticas)
  private normalSpeeches = [
    "Tô de olho nessa fila... 🧐",
    "Já bebeu água hoje? Tem bebedouro ali! 💧",
    "Estica as pernas um pouquinho! 🚶‍♂️",
    "Sabia que o SUS é o maior sistema público de saúde gratuito do mundo? 🇧🇷",
    "Por favor, não esqueça seus documentos quando for chamado! 🪪",
    "Que dia produtivo aqui na UBS! 🩺",
    "Quem trouxe o cartão do SUS levantando a mão! 💳",
    "Lavar as mãos salva vidas, viu? 🧼",
    "Mantenha a postura sentada nessa cadeira! 🧘‍♂️",
    "Alimentação saudável é o melhor remédio. Coma frutas! 🍎",
    "Se tossir ou espirrar, use o braço para cobrir! 🤧",
    "A vacina protege você e quem você ama. Vacine-se! 💉"
  ];

  // Falas de tropeço (divertidas)
  private tripSpeeches = [
    "Ops! Quem deixou esse degrau virtual aqui? 🤕",
    "Aí! Que escorregada... 😅",
    "Cuidado com o chão liso! 🧼",
    "Minha física deu tilt! 🤖",
    "Tropecei no rodapé do painel! 🫣",
    "Estou bem! Ninguém viu, né? 👀"
  ];

  // Falas de alongamento
  private stretchSpeeches = [
    "Alongando... Estica bem as costas! 🧘‍♂️",
    "Uh! Que preguiça boa...",
    "Esticando os circuitos! ⚙️",
    "Bora dar aquela esticada nas patinhas! 🐾"
  ];

  constructor(engine: MascotEngine) {
    this.engine = engine;
    this.injectStyles();
    this.createMascotElements();
    this.setSkin('gotinha');
    this.lastTipTime = Date.now() - 10000; // Primeira fala após 10 segundos
  }

  public destroy() {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
    }
  }

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
   * Atualiza coordenadas físicas, estados e balões de diálogo
   */
  public render() {
    if (!this.containerEl || !this.spriteEl || !this.balloonEl) return;

    const config = this.engine.getConfig();

    // 1. Atualizar tamanho, posição e opacidade
    this.containerEl.style.left = `${this.engine.x}px`;
    this.containerEl.style.top = `${this.engine.y}px`;
    this.containerEl.style.width = `${this.engine.width}px`;
    this.containerEl.style.height = `${this.engine.height}px`;
    this.containerEl.style.opacity = `${config.opacity}`;

    // 2. Aplicar classes de estado e direção horizontal
    this.spriteEl.className = `sigss-mascot-sprite sigss-skin-${this.currentSkin} state-${this.engine.state.toLowerCase()} dir-${this.engine.direction.toLowerCase()}`;

    // 3. Atualizar balão de informações contextualizado
    this.updateBalloon(config.callAwareness);
  }

  /**
   * Lógica avançada de geração de falas de acordo com a posição e ações do mascote
   */
  private updateBalloon(callAwareness: boolean) {
    if (!this.balloonEl) return;

    const now = Date.now();

    // CASO 1: Reação de comemoração de chamada de paciente
    if (this.engine.state === 'CELEBRATE' || (this.engine.state === 'RUN' && this.engine.isCelebrating && callAwareness)) {
      let patientGreet = "📢 Nova chamada!";
      if (this.engine.currentCalledPatient && this.engine.currentCalledPatient !== '-') {
        // Formata o nome para ficar mais curto (ex: JOAO SILVA)
        const nameParts = this.engine.currentCalledPatient.split(' ');
        const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : nameParts[0];
        patientGreet = `✨ Boa consulta, ${shortName}! 🍀`;
      }
      this.setBalloonText(patientGreet, true);
      return;
    }

    // CASO 2: Dormindo
    if (this.engine.state === 'SLEEP') {
      const sleepWords = ["Zzz...", "*Sonhando com vacinas...*", "Mais 5 minutinhos... 💤", "Recarregando as baterias... 🔋"];
      // Muda a fala a cada 3.5 segundos durante o sono
      const index = Math.floor((now / 3500) % sleepWords.length);
      this.setBalloonText(sleepWords[index], false);
      return;
    }

    // CASO 3: Tropeçou
    if (this.engine.state === 'TRIP') {
      // Sorteia uma fala de tropeço fixa para a duração do tombo
      if (!this.balloonEl.classList.contains('visible') || this.activeBubbleContent === '') {
        const randTrip = this.tripSpeeches[Math.floor(Math.random() * this.tripSpeeches.length)];
        this.setBalloonText(randTrip, false);
      }
      return;
    }

    // CASO 4: Alongando
    if (this.engine.state === 'STRETCH') {
      if (!this.balloonEl.classList.contains('visible') || this.activeBubbleContent === '') {
        const randStretch = this.stretchSpeeches[Math.floor(Math.random() * this.stretchSpeeches.length)];
        this.setBalloonText(randStretch, false);
      }
      return;
    }

    // CASO 5: Falas periódicas e baseadas no ambiente
    if (this.engine.state === 'IDLE' || this.engine.state === 'WALK') {
      const timeSinceLastTip = now - this.lastTipTime;
      
      if (timeSinceLastTip > 18000) {
        // Decide fala baseada no contexto (Relógio do cabeçalho)
        let chosenSpeech = '';
        
        // Se estiver bem alto (próximo ao cabeçalho/relógio)
        if (this.engine.y < 120 && this.engine.lastAnnouncedHour >= 0) {
          const hr = this.engine.lastAnnouncedHour;
          if (hr >= 7 && hr < 12) {
            chosenSpeech = "Bom dia! Que o seu dia seja saudável e produtivo. ☀️";
          } else if (hr >= 12 && hr < 13) {
            chosenSpeech = "Quase hora do almoço... Bateu aquela fominha! 😋";
          } else if (hr >= 13 && hr < 18) {
            chosenSpeech = "Boa tarde! Lembra de beber água nesta tarde. 🥤";
          } else {
            chosenSpeech = "Fim de tarde... Já se cuidou hoje? 🌙";
          }
        } else {
          // Fala aleatória de saúde humana
          chosenSpeech = this.normalSpeeches[Math.floor(Math.random() * this.normalSpeeches.length)];
        }

        this.setBalloonText(chosenSpeech, false);
        this.lastTipTime = now;
      } 
      // Esconde balão comum após 6.5 segundos
      else if (timeSinceLastTip > 6500 && this.balloonEl.classList.contains('visible') && !this.balloonEl.classList.contains('important-balloon')) {
        this.balloonEl.classList.remove('visible');
        this.activeBubbleContent = '';
      }
    } else {
      // Esconde balão comum se estiver correndo ou caindo
      if (!this.balloonEl.classList.contains('important-balloon')) {
        this.balloonEl.classList.remove('visible');
        this.activeBubbleContent = '';
      }
    }
  }

  private setBalloonText(text: string, isImportant: boolean) {
    if (!this.balloonEl) return;
    
    if (this.activeBubbleContent === text) return; // Evita re-trigger
    
    this.activeBubbleContent = text;
    this.balloonEl.textContent = text;
    this.balloonEl.classList.add('visible');
    
    if (isImportant) {
      this.balloonEl.classList.add('important-balloon');
    } else {
      this.balloonEl.classList.remove('important-balloon');
    }
  }

  private createMascotElements() {
    this.containerEl = document.createElement('div');
    this.containerEl.id = 'sigss-mascot-container';
    this.containerEl.className = 'sigss-mascot-container';

    this.spriteEl = document.createElement('div');
    this.spriteEl.className = 'sigss-mascot-sprite';

    this.balloonEl = document.createElement('div');
    this.balloonEl.className = 'sigss-mascot-balloon';

    this.containerEl.appendChild(this.balloonEl);
    this.containerEl.appendChild(this.spriteEl);
    document.body.appendChild(this.containerEl);
  }

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
        transition: transform 0.1s ease;
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
        color: #f8fafc;
        border: 2.5px solid #2563eb;
        border-radius: 12px;
        padding: 8px 14px;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-size: 11.5px;
        font-weight: 700;
        text-align: center;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(12px) scale(0.8);
        transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        z-index: 1000000;
      }

      .sigss-mascot-balloon::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 7px;
        border-style: solid;
        border-color: #2563eb transparent transparent transparent;
      }

      .sigss-mascot-balloon.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      /* Alerta especial de chamada importante */
      .sigss-mascot-balloon.important-balloon {
        background-color: #dc2626;
        border-color: #f87171;
        color: #ffffff;
        font-size: 12.5px;
        padding: 10px 16px;
        border-radius: 14px;
        box-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
        animation: pulseImportant 0.4s ease-in-out infinite alternate;
      }

      .sigss-mascot-balloon.important-balloon::after {
        border-color: #f87171 transparent transparent transparent;
      }

      @keyframes pulseImportant {
        from { transform: translateY(0) scale(1); }
        to { transform: translateY(-5px) scale(1.08); }
      }

      /* ==========================================================================
         ANIMAÇÕES DOS ESTADOS DO MASCOTE (CSS KEYFRAMES)
         ========================================================================== */
      
      /* 1. IDLE (Respiração com balanço sutil) */
      .state-idle svg {
        animation: mascotBreath 1.8s ease-in-out infinite;
      }

      @keyframes mascotBreath {
        0%, 100% { transform: translateY(0) scaleY(1); }
        50% { transform: translateY(1.5px) scaleY(0.95) scaleX(1.03); }
      }

      /* 2. WALK (Ginga horizontal) */
      .state-walk svg {
        animation: mascotWalk 0.55s ease-in-out infinite;
      }

      @keyframes mascotWalk {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-4px) rotate(-5deg); }
        50% { transform: translateY(0) rotate(0deg); }
        75% { transform: translateY(-4px) rotate(5deg); }
      }

      /* 3. RUN (Passadas rápidas e pulos curtos) */
      .state-run svg {
        animation: mascotRun 0.3s linear infinite;
      }

      @keyframes mascotRun {
        0%, 100% { transform: translateY(0) scaleY(1) rotate(-3deg); }
        50% { transform: translateY(-6px) scaleY(0.88) rotate(6deg); }
      }

      /* 4. SLEEP (Preguiça, rotacionado deitado) */
      .state-sleep {
        transform: rotate(90deg) translateY(12px) !important;
      }
      
      .state-sleep.dir-left {
        transform: scaleX(-1) rotate(90deg) translateY(12px) !important;
      }

      .state-sleep svg {
        animation: mascotSleep 3s ease-in-out infinite;
      }

      @keyframes mascotSleep {
        0%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.8; }
        50% { transform: scaleX(0.94) scaleY(0.94); opacity: 0.98; }
      }

      /* 5. JUMP (Alongado no ar) */
      .state-jump svg {
        transform: scaleY(1.18) scaleX(0.85);
      }

      /* 6. FALL (Pressionado ao cair) */
      .state-fall svg {
        transform: scaleY(0.85) scaleX(1.15);
      }

      /* 7. CLIMB (Balanço vertical ao subir escadas/laterais) */
      .state-climb svg {
        animation: mascotClimb 0.45s linear infinite;
      }

      @keyframes mascotClimb {
        0%, 100% { transform: translateY(0) scaleX(1) scaleY(1); }
        50% { transform: translateY(-3px) scaleX(0.9) scaleY(1.1); }
      }

      /* 8. CELEBRATE (Giro mortal 360 no ar) */
      .state-celebrate svg {
        animation: mascotCelebrate 0.45s ease-in-out infinite;
      }

      @keyframes mascotCelebrate {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-16px) rotate(180deg) scale(1.1); }
        100% { transform: translateY(0) rotate(360deg); }
      }

      /* 9. TRIP (Tropeço: Deita de cara no chão e treme levemente) */
      .state-trip {
        transform: rotate(85deg) translateY(15px) !important;
      }
      .state-trip.dir-left {
        transform: scaleX(-1) rotate(85deg) translateY(15px) !important;
      }
      .state-trip svg {
        animation: mascotTripShake 0.15s ease-in-out infinite alternate;
      }
      @keyframes mascotTripShake {
        from { transform: translateX(-1px) translateY(0); }
        to { transform: translateX(1px) translateY(1px); }
      }

      /* 10. STRETCH (Estica muito pra cima e depois relaxa) */
      .state-stretch svg {
        animation: mascotStretch 2.2s ease-in-out infinite;
      }
      @keyframes mascotStretch {
        0%, 100% { transform: scaleY(1) scaleX(1); }
        35%, 65% { transform: scaleY(1.32) scaleX(0.8); }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ==========================================================================
  // VETORES SVG DOS PERSONAGENS (Desenhos dinâmicos via código)
  // ==========================================================================

  private getGotinhaSVG(): string {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="22" cy="58" rx="7" ry="4" fill="#3b82f6"/>
        <ellipse cx="42" cy="58" rx="7" ry="4" fill="#3b82f6"/>
        <path d="M22 52V58M42 52V58" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
        <path d="M32 4C32 4 12 30 12 42C12 52.5 21 57 32 57C43 57 52 52.5 52 42C52 30 32 4 32 4Z" fill="#ffffff" stroke="#3b82f6" stroke-width="3"/>
        <path d="M16 43.5C21 47 43 47 48 43.5C48 43.5 45 54 32 54C19 54 16 43.5 16 43.5Z" fill="#60a5fa" opacity="0.85"/>
        <rect x="30" y="47" width="4" height="6" fill="#2563eb" rx="1"/>
        <rect x="29" y="49" width="6" height="2" fill="#2563eb" rx="1"/>
        <circle cx="25" cy="33" r="3.5" fill="#1e293b"/>
        <circle cx="39" cy="33" r="3.5" fill="#1e293b"/>
        <circle cx="26.5" cy="31.5" r="1.2" fill="#ffffff"/>
        <circle cx="40.5" cy="31.5" r="1.2" fill="#ffffff"/>
        <ellipse cx="20" cy="36.5" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.6"/>
        <ellipse cx="44" cy="36.5" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.6"/>
        <path d="M29 37.5C29.5 39 34.5 39 35 37.5" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <path d="M13 38C8 36 6 32 6 32" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        <path d="M51 38C56 36 58 32 58 32" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
  }

  private getRobozinhoSVG(): string {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 58C32 58 27 50 32 46C37 50 32 58 32 58Z" fill="#ff7e00" opacity="0.8"/>
        <path d="M32 56C32 56 29 51 32 48C35 51 32 56 32 56Z" fill="#ffb800"/>
        <line x1="32" y1="12" x2="32" y2="4" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="4" r="3" fill="#3b82f6" stroke="#93c5fd" stroke-width="1"/>
        <rect x="14" y="12" width="36" height="34" rx="18" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>
        <rect x="20" y="18" width="24" height="15" rx="5" fill="#0f172a"/>
        <rect class="bot-eye" x="24" y="23" width="4" height="5" rx="1.5" fill="#38bdf8"/>
        <rect class="bot-eye" x="36" y="23" width="4" height="5" rx="1.5" fill="#38bdf8"/>
        <path d="M28 41H31.5L32.5 37L33.5 44L34.5 41H36" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 28C7 28 6 34 6 34" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
        <path d="M52 28C57 28 58 34 58 34" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
  }

  private getGatinhoSVG(): string {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M48 48C52 48 56 44 56 38C56 32 53 30 50 30" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>
        <rect x="18" y="52" width="6" height="8" rx="2" fill="#d97706"/>
        <rect x="27" y="52" width="6" height="8" rx="2" fill="#d97706"/>
        <rect x="36" y="52" width="6" height="8" rx="2" fill="#d97706"/>
        <rect x="12" y="24" width="34" height="30" rx="12" fill="#f59e0b" stroke="#d97706" stroke-width="2.5"/>
        <rect x="16" y="28" width="26" height="22" rx="8" fill="#fbbf24"/>
        <path d="M16 25L10 12L22 23Z" fill="#d97706"/>
        <path d="M38 25L44 12L32 23Z" fill="#d97706"/>
        <path d="M16 23L13 16L20 22Z" fill="#fca5a5"/>
        <path d="M38 23L41 16L34 22Z" fill="#fca5a5"/>
        <circle cx="21" cy="34" r="3.2" fill="#1e293b"/>
        <circle cx="33" cy="34" r="3.2" fill="#1e293b"/>
        <circle cx="22" cy="32.8" r="1" fill="#ffffff"/>
        <circle cx="34" cy="32.8" r="1" fill="#ffffff"/>
        <path d="M26 37.5L27 36L28 37.5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M25 39C25.5 39.8 27 39.8 27 39M27 39C27 39.8 28.5 39.8 29 39" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="8" y1="36" x2="16" y2="37" stroke="#92400e" stroke-width="1.5"/>
        <line x1="8" y1="39" x2="16" y2="39" stroke="#92400e" stroke-width="1.5"/>
        <line x1="46" y1="36" x2="38" y2="37" stroke="#92400e" stroke-width="1.5"/>
        <line x1="46" y1="39" x2="38" y2="39" stroke="#92400e" stroke-width="1.5"/>
      </svg>
    `;
  }
}
