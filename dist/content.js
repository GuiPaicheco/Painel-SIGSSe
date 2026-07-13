"use strict";
(() => {
  // src/utils/sigssPanelAdapter.ts
  var SigssPanelAdapter = class {
    /**
     * Detecta se a página aberta é de fato o painel de chamadas
     */
    static isPanelPage() {
      const url = window.location.href;
      return url.includes("unique-panel/panel-screen") || url.includes("mock_panel.html") || document.title.toLowerCase().includes("painel") || !!document.querySelector(".called-patient, #current-patient, .panel-container");
    }
    /**
     * Retorna os elementos do painel ativo
     */
    static getElements() {
      const elements = {
        callingCard: document.querySelector(".calling-card, .chamando-card, .painel-chamando, main > section:first-child"),
        patientName: document.querySelector("#current-patient, .called-patient, .chamando-paciente, .paciente-chamado"),
        localName: document.querySelector("#current-local, .called-local, .chamando-local, .sala-chamada"),
        professionalName: document.querySelector("#current-professional, .called-professional, .chamando-profissional"),
        historySection: document.querySelector(".history-section, .ultimas-chamadas, aside.history, .painel-historico"),
        footerTicker: document.querySelector(".panel-footer, footer, .footer-ticker, .marquee-container")
      };
      if (!elements.callingCard) {
        const divs = Array.from(document.querySelectorAll("div, section"));
        let largestDiv = null;
        let largestArea = 0;
        divs.forEach((div) => {
          const rect = div.getBoundingClientRect();
          const area = rect.width * rect.height;
          if (rect.width > 200 && rect.height > 200 && rect.left < window.innerWidth / 2 && area > largestArea) {
            largestArea = area;
            largestDiv = div;
          }
        });
        elements.callingCard = largestDiv;
      }
      if (elements.callingCard && !elements.patientName) {
        const childElements = Array.from(elements.callingCard.querySelectorAll("span, div, h1, h2, td"));
        let largestFontEl = null;
        let maxFontSize = 0;
        childElements.forEach((el) => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const text = (el.textContent || "").trim();
          if (fontSize > maxFontSize && text.length > 3 && !/^\d+$/.test(text) && text !== "CHAMANDO" && text !== "-") {
            maxFontSize = fontSize;
            largestFontEl = el;
          }
        });
        elements.patientName = largestFontEl;
      }
      return elements;
    }
    /**
     * Obtém a caixa delimitadora (Bounding Rect) de um elemento para colisões físicas
     */
    static getObstacleRects() {
      const rects = [];
      const elements = this.getElements();
      if (elements.callingCard) {
        rects.push(elements.callingCard.getBoundingClientRect());
      }
      if (elements.historySection) {
        rects.push(elements.historySection.getBoundingClientRect());
      }
      return rects;
    }
  };

  // src/mascot/MascotEngine.ts
  var MascotEngine = class {
    // Posição e velocidade
    x = 100;
    y = 100;
    vx = 0;
    vy = 0;
    // Tamanho do mascote
    width = 64;
    height = 64;
    // Direção e Estado
    state = "FALL";
    direction = "RIGHT";
    // Configurações
    config = {
      speedMultiplier: 1,
      size: 64,
      opacity: 0.9,
      callAwareness: true
    };
    // Física básica
    gravity = 0.35;
    jumpForce = -9;
    normalSpeed = 1.2;
    runSpeed = 2.8;
    climbSpeed = 1;
    // Ciclo de comportamento
    nextStateTime = 0;
    celebrationEndTime = 0;
    celebrationTargetX = 0;
    celebrationTargetY = 0;
    isCelebrating = false;
    // Callback de desenho
    onUpdateCallback = () => {
    };
    constructor() {
      this.resetToSafety();
    }
    /**
     * Redefine o mascote para uma posição segura (no chão principal) se ele se perder
     */
    resetToSafety() {
      this.x = window.innerWidth / 2;
      this.y = 50;
      this.vx = 0;
      this.vy = 2;
      this.state = "FALL";
    }
    /**
     * Atualiza as configurações do mascote em tempo real
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      this.width = this.config.size;
      this.height = this.config.size;
      const scale = this.config.size / 64;
      this.gravity = 0.35 * scale;
      this.jumpForce = -9 * Math.sqrt(scale);
    }
    getConfig() {
      return this.config;
    }
    /**
     * Registra a função que será chamada a cada frame para renderizar o mascote
     */
    onUpdate(callback) {
      this.onUpdateCallback = callback;
    }
    /**
     * Ciclo principal de atualização (Game Loop)
     */
    update() {
      this.applyBehavior();
      this.applyPhysics();
      this.onUpdateCallback();
    }
    /**
     * Trata o comportamento e as tomadas de decisão inteligentes do mascote
     */
    applyBehavior() {
      const now = Date.now();
      if (this.isCelebrating) {
        if (now > this.celebrationEndTime) {
          this.isCelebrating = false;
          this.state = "IDLE";
          this.nextStateTime = now + 2e3;
          return;
        }
        this.executeCelebrationBehavior();
        return;
      }
      if (now > this.nextStateTime) {
        this.decideNextState(now);
      }
    }
    /**
     * Executa a movimentação direcionada de comemoração
     */
    executeCelebrationBehavior() {
      const speed = this.runSpeed * this.config.speedMultiplier;
      if (this.state === "JUMP" || this.state === "FALL") {
        return;
      }
      const dx = this.celebrationTargetX - (this.x + this.width / 2);
      if (Math.abs(dx) > 40) {
        this.state = "RUN";
        if (dx > 0) {
          this.vx = speed;
          this.direction = "RIGHT";
        } else {
          this.vx = -speed;
          this.direction = "LEFT";
        }
      } else {
        this.state = "CELEBRATE";
        this.vx = 0;
        if (this.y === this.getFloorLevelAt(this.x)) {
          this.vy = this.jumpForce * 1.1;
          this.state = "JUMP";
          this.vx = (Math.random() - 0.5) * 2;
        }
      }
    }
    /**
     * Decide aleatoriamente qual será a próxima ação do mascote
     */
    decideNextState(now) {
      const rand = Math.random();
      const duration = 2e3 + Math.random() * 5e3;
      this.nextStateTime = now + duration;
      if (this.state === "JUMP" || this.state === "FALL") {
        return;
      }
      const currentFloor = this.getFloorLevelAt(this.x);
      if (this.x <= 0) {
        this.direction = "RIGHT";
        this.state = "WALK";
        this.vx = this.normalSpeed * this.config.speedMultiplier;
        return;
      }
      if (this.x + this.width >= window.innerWidth) {
        this.direction = "LEFT";
        this.state = "WALK";
        this.vx = -this.normalSpeed * this.config.speedMultiplier;
        return;
      }
      if (rand < 0.35) {
        this.state = "WALK";
        const goRight = Math.random() > 0.5;
        this.direction = goRight ? "RIGHT" : "LEFT";
        this.vx = (goRight ? this.normalSpeed : -this.normalSpeed) * this.config.speedMultiplier;
      } else if (rand < 0.5) {
        this.state = "IDLE";
        this.vx = 0;
      } else if (rand < 0.65) {
        this.state = "SLEEP";
        this.vx = 0;
      } else if (rand < 0.75) {
        this.state = "JUMP";
        this.vy = this.jumpForce;
        this.vx = (Math.random() > 0.5 ? this.normalSpeed : -this.normalSpeed) * 1.5 * this.config.speedMultiplier;
      } else if (rand < 0.88) {
        this.state = "RUN";
        const goRight = Math.random() > 0.5;
        this.direction = goRight ? "RIGHT" : "LEFT";
        this.vx = (goRight ? this.runSpeed : -this.runSpeed) * this.config.speedMultiplier;
      } else {
        if (this.x < 100 || this.x + this.width > window.innerWidth - 100) {
          this.state = "CLIMB";
          this.vx = 0;
          this.vy = -this.climbSpeed * this.config.speedMultiplier;
          this.direction = this.x < 100 ? "LEFT" : "RIGHT";
        } else {
          this.state = "IDLE";
          this.vx = 0;
        }
      }
    }
    /**
     * Dispara a comemoração de chamada de paciente
     */
    triggerCallReaction(patientName, local) {
      if (!this.config.callAwareness) return;
      console.log(`Mascote detectou chamada: ${patientName} no local ${local}`);
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
      this.state = "RUN";
      this.celebrationEndTime = Date.now() + 1e4;
      const floor = this.getFloorLevelAt(this.x);
      if (this.y >= floor - 5) {
        this.vy = this.jumpForce * 0.8;
        this.state = "JUMP";
      }
    }
    /**
     * Aplica a gravidade, acelerações, limites da tela e colisões com plataformas
     */
    applyPhysics() {
      if (this.state === "CLIMB") {
        this.y += this.vy;
        if (this.y < 0) {
          this.y = 0;
          this.state = "IDLE";
          this.vy = 0;
        }
        const floor = this.getFloorLevelAt(this.x);
        if (this.y >= floor) {
          this.y = floor;
          this.state = "IDLE";
          this.vy = 0;
        }
        return;
      }
      const currentFloor = this.getFloorLevelAt(this.x);
      if (this.y < currentFloor) {
        this.vy += this.gravity;
        if (this.state !== "JUMP") {
          this.state = "FALL";
        }
      }
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) {
        this.x = 0;
        this.vx = -this.vx * 0.5;
        this.direction = "RIGHT";
      } else if (this.x + this.width > window.innerWidth) {
        this.x = window.innerWidth - this.width;
        this.vx = -this.vx * 0.5;
        this.direction = "LEFT";
      }
      const updatedFloor = this.getFloorLevelAt(this.x);
      if (this.y >= updatedFloor) {
        this.y = updatedFloor;
        this.vy = 0;
        if (this.state === "FALL" || this.state === "JUMP") {
          this.vx = 0;
          this.state = "IDLE";
          this.nextStateTime = Date.now() + 1e3;
        }
      }
    }
    /**
     * Calcula qual é o "chão" atual na coordenada X especificada.
     * O mascote pode caminhar no topo dos boxes (callingCard e historySection) se cair sobre eles.
     */
    getFloorLevelAt(x) {
      const elements = SigssPanelAdapter.getElements();
      const mascotCenterX = x + this.width / 2;
      let defaultFloor = window.innerHeight - this.height;
      if (elements.footerTicker) {
        const footerRect = elements.footerTicker.getBoundingClientRect();
        defaultFloor = footerRect.top - this.height;
      }
      if (elements.historySection) {
        const histRect = elements.historySection.getBoundingClientRect();
        if (mascotCenterX >= histRect.left && mascotCenterX <= histRect.right) {
          if (this.y + this.height <= histRect.top + 15 && this.vy >= 0) {
            return histRect.top - this.height;
          }
        }
      }
      if (elements.callingCard) {
        const cardRect = elements.callingCard.getBoundingClientRect();
        if (mascotCenterX >= cardRect.left && mascotCenterX <= cardRect.right) {
          if (this.y + this.height <= cardRect.top + 15 && this.vy >= 0) {
            return cardRect.top - this.height;
          }
        }
      }
      return defaultFloor;
    }
  };

  // src/mascot/MascotRenderer.ts
  var MascotRenderer = class {
    containerEl = null;
    spriteEl = null;
    balloonEl = null;
    engine;
    currentSkin = "gotinha";
    healthTipInterval = 0;
    lastTipTime = 0;
    // Lista de dicas de saúde curtas para exibir em salas de espera da UBS
    healthTips = [
      "Beba \xE1gua diariamente! \u{1F4A7}",
      "Lave as m\xE3os com frequ\xEAncia! \u{1F9FC}",
      "Mantenha sua vacina\xE7\xE3o em dia! \u{1F489}",
      "Evite automedica\xE7\xE3o. Consulte um m\xE9dico! \u{1FA7A}",
      "Se estiver gripado, use m\xE1scara! \u{1F637}",
      "Pratique atividades f\xEDsicas regularmente! \u{1F3C3}\u200D\u2642\uFE0F",
      "Alimente-se de forma saud\xE1vel! \u{1F34E}",
      "Combata focos de dengue em sua casa! \u{1F99F}"
    ];
    constructor(engine) {
      this.engine = engine;
      this.injectStyles();
      this.createMascotElements();
      this.setSkin("gotinha");
      this.startHealthTipsTimer();
    }
    /**
     * Remove os elementos do mascote da página (cleanup)
     */
    destroy() {
      if (this.containerEl && this.containerEl.parentNode) {
        this.containerEl.parentNode.removeChild(this.containerEl);
      }
      window.clearInterval(this.healthTipInterval);
    }
    /**
     * Define o visual (skin) do mascote
     */
    setSkin(skin) {
      this.currentSkin = skin;
      if (!this.spriteEl) return;
      switch (skin) {
        case "gotinha":
          this.spriteEl.innerHTML = this.getGotinhaSVG();
          break;
        case "robozinho":
          this.spriteEl.innerHTML = this.getRobozinhoSVG();
          break;
        case "gatinho":
          this.spriteEl.innerHTML = this.getGatinhoSVG();
          break;
      }
    }
    /**
     * Desenha/atualiza as coordenadas, escala, opacidade e classes de animação na página
     */
    render() {
      if (!this.containerEl || !this.spriteEl || !this.balloonEl) return;
      const config = this.engine.getConfig();
      this.containerEl.style.left = `${this.engine.x}px`;
      this.containerEl.style.top = `${this.engine.y}px`;
      this.containerEl.style.width = `${this.engine.width}px`;
      this.containerEl.style.height = `${this.engine.height}px`;
      this.containerEl.style.opacity = `${config.opacity}`;
      this.spriteEl.className = `sigss-mascot-sprite sigss-skin-${this.currentSkin} state-${this.engine.state.toLowerCase()} dir-${this.engine.direction.toLowerCase()}`;
      this.updateBalloon(config.callAwareness);
    }
    /**
     * Gerencia os balões de diálogo acima do mascote (Zzz, exclamações e dicas de saúde)
     */
    updateBalloon(callAwareness) {
      if (!this.balloonEl) return;
      const now = Date.now();
      if (this.engine.state === "CELEBRATE" || this.engine.state === "RUN" && callAwareness && this.engine.isCelebrating) {
        this.balloonEl.textContent = "\u{1F514} ATEN\xC7\xC3O!";
        this.balloonEl.classList.add("visible", "important-balloon");
        return;
      }
      if (this.engine.state === "SLEEP") {
        const zees = ["z", "zz", "zzz", "Zzz"];
        const index = Math.floor(now / 800 % zees.length);
        this.balloonEl.textContent = zees[index];
        this.balloonEl.classList.add("visible");
        this.balloonEl.classList.remove("important-balloon");
        return;
      }
      if (this.engine.state === "IDLE" || this.engine.state === "WALK") {
        const timeSinceLastTip = now - this.lastTipTime;
        if (timeSinceLastTip > 2e4) {
          const randomTip = this.healthTips[Math.floor(Math.random() * this.healthTips.length)];
          this.balloonEl.textContent = randomTip;
          this.balloonEl.classList.add("visible");
          this.balloonEl.classList.remove("important-balloon");
          this.lastTipTime = now;
        } else if (timeSinceLastTip > 6e3 && this.balloonEl.classList.contains("visible") && !this.balloonEl.classList.contains("important-balloon")) {
          this.balloonEl.classList.remove("visible");
        }
      } else {
        if (!this.balloonEl.classList.contains("important-balloon")) {
          this.balloonEl.classList.remove("visible");
        }
      }
    }
    startHealthTipsTimer() {
      this.lastTipTime = Date.now() - 1e4;
    }
    /**
     * Cria os elementos HTML necessários no body da página
     */
    createMascotElements() {
      this.containerEl = document.createElement("div");
      this.containerEl.id = "sigss-mascot-container";
      this.containerEl.className = "sigss-mascot-container";
      this.spriteEl = document.createElement("div");
      this.spriteEl.className = "sigss-mascot-sprite";
      this.balloonEl = document.createElement("div");
      this.balloonEl.className = "sigss-mascot-balloon";
      this.containerEl.appendChild(this.balloonEl);
      this.containerEl.appendChild(this.spriteEl);
      document.body.appendChild(this.containerEl);
    }
    /**
     * Injeta o arquivo de estilos CSS para controlar todas as animações e estilos visuais do mascote
     */
    injectStyles() {
      if (document.getElementById("sigss-mascot-styles")) return;
      const style = document.createElement("style");
      style.id = "sigss-mascot-styles";
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

      /* Dire\xE7\xE3o Horizontal */
      .sigss-mascot-sprite.dir-left {
        transform: scaleX(-1);
      }

      /* Bal\xE3o de di\xE1logo premium */
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

      /* Bal\xE3o especial de comemora\xE7\xE3o/alerta */
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
         ANIMA\xC7\xD5ES DOS ESTADOS DO MASCOTE (CSS KEYFRAMES)
         ========================================================================== */
      
      /* 1. IDLE (Respira\xE7\xE3o leve) */
      .state-idle svg {
        animation: mascotBreath 1.6s ease-in-out infinite;
      }

      @keyframes mascotBreath {
        0%, 100% { transform: translateY(0) scaleY(1); }
        50% { transform: translateY(1px) scaleY(0.96) scaleX(1.02); }
      }

      /* 2. WALK (Balan\xE7o horizontal) */
      .state-walk svg {
        animation: mascotWalk 0.6s ease-in-out infinite;
      }

      @keyframes mascotWalk {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-3px) rotate(-4deg); }
        50% { transform: translateY(0) rotate(0deg); }
        75% { transform: translateY(-3px) rotate(4deg); }
      }

      /* 3. RUN (Balan\xE7o horizontal r\xE1pido) */
      .state-run svg {
        animation: mascotRun 0.35s linear infinite;
      }

      @keyframes mascotRun {
        0%, 100% { transform: translateY(0) scaleY(1) rotate(-2deg); }
        50% { transform: translateY(-5px) scaleY(0.9) rotate(5deg); }
      }

      /* 4. SLEEP (Respira\xE7\xE3o muito lenta e deitado) */
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

      /* 7. CLIMB (Balan\xE7o vertical ao subir) */
      .state-climb svg {
        animation: mascotClimb 0.5s linear infinite;
      }

      @keyframes mascotClimb {
        0%, 100% { transform: translateY(0) scaleX(1); }
        50% { transform: translateY(-2px) scaleX(0.92) scaleY(1.08); }
      }

      /* 8. CELEBRATE (Pulo rotativo r\xE1pido / Comemora\xE7\xE3o) */
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
    getGotinhaSVG() {
      return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Pernas/P\xE9s -->
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
    getRobozinhoSVG() {
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
        
        <!-- Simbolo M\xE9dio de Cora\xE7\xE3o/Pulso no peito -->
        <path d="M28 41H31.5L32.5 37L33.5 44L34.5 41H36" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Bracinhos Flutuantes Mec\xE2nicos -->
        <path d="M12 28C7 28 6 34 6 34" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
        <path d="M52 28C57 28 58 34 58 34" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
    }
    /**
     * Gatinho de Pixel Art Minimalista (Cute Cat)
     */
    getGatinhoSVG() {
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
  };

  // src/core/config.ts
  var DEFAULT_SETTINGS = {
    mascotEnabled: true,
    mascotSkin: "gotinha",
    speedMultiplier: 1,
    size: 64,
    opacity: 0.9,
    callAwareness: true
  };
  var MascotConfigManager = class {
    /**
     * Obtém todas as configurações salvas ou retorna os valores padrão
     */
    static async load() {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => {
          resolve({
            ...DEFAULT_SETTINGS,
            ...items
          });
        });
      });
    }
    /**
     * Salva configurações genéricas
     */
    static async save(settings) {
      return new Promise((resolve) => {
        chrome.storage.local.set(settings, () => {
          resolve();
        });
      });
    }
    /**
     * Escuta alterações de configurações em tempo real
     */
    static onChange(callback) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local") {
          callback(changes);
        }
      });
    }
  };

  // src/core/content.ts
  var SIGSSMascotCore = class {
    engine = null;
    renderer = null;
    isRunning = false;
    observer = null;
    async init() {
      if (!SigssPanelAdapter.isPanelPage()) {
        console.log("Painel SIGSS+ Mascote: P\xE1gina atual n\xE3o identificada como painel de chamadas.");
        return;
      }
      console.log("Painel SIGSS+ Mascote: Inicializando na p\xE1gina...");
      this.waitForElementsAndStart();
      this.setupConfigListener();
    }
    /**
     * Monitora e aguarda até que os elementos do painel estejam presentes para iniciar o motor
     */
    waitForElementsAndStart() {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const elements = SigssPanelAdapter.getElements();
        if (elements.callingCard || elements.patientName || attempts > 30) {
          clearInterval(interval);
          console.log(`Painel SIGSS+ Mascote: Elementos detectados (tentativas: ${attempts}). Iniciando motor...`);
          await this.start();
        }
      }, 500);
    }
    /**
     * Inicia o motor de física do mascote, o loop de animação e o observador de chamadas
     */
    async start() {
      if (this.isRunning) return;
      const settings = await MascotConfigManager.load();
      if (!settings.mascotEnabled) {
        console.log("Painel SIGSS+ Mascote: Extens\xE3o desativada nas configura\xE7\xF5es.");
        return;
      }
      this.isRunning = true;
      this.engine = new MascotEngine();
      this.renderer = new MascotRenderer(this.engine);
      this.engine.updateConfig({
        speedMultiplier: settings.speedMultiplier,
        size: settings.size,
        opacity: settings.opacity,
        callAwareness: settings.callAwareness
      });
      this.renderer.setSkin(settings.mascotSkin);
      this.engine.onUpdate(() => {
        if (this.renderer) {
          this.renderer.render();
        }
      });
      this.animationLoop();
      this.setupCallObserver();
    }
    /**
     * Finaliza o motor e remove os elementos visuais da tela
     */
    stop() {
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
      console.log("Painel SIGSS+ Mascote: Motor parado e elementos removidos.");
    }
    /**
     * Loop de animação via requestAnimationFrame
     */
    animationLoop = () => {
      if (!this.isRunning || !this.engine) return;
      this.engine.update();
      requestAnimationFrame(this.animationLoop);
    };
    /**
     * Monitora alterações na div de paciente ativo para simular ou disparar a reação de susto e festa
     */
    setupCallObserver() {
      const elements = SigssPanelAdapter.getElements();
      if (!elements.patientName) {
        console.warn("Painel SIGSS+ Mascote: Elemento de nome de paciente n\xE3o encontrado. Observer n\xE3o ativado.");
        return;
      }
      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const text = (elements.patientName?.textContent || "").trim();
          if (text && text !== "-" && text.length > 2) {
            const local = elements.localName?.textContent || "";
            if (this.engine) {
              this.engine.triggerCallReaction(text, local);
            }
            break;
          }
        }
      });
      this.observer.observe(elements.patientName, {
        childList: true,
        characterData: true,
        subtree: true
      });
      console.log("Painel SIGSS+ Mascote: Monitoramento de chamadas ativado via MutationObserver.");
    }
    /**
     * Atualiza as configurações em execução em tempo real sem recarregar a página
     */
    setupConfigListener() {
      MascotConfigManager.onChange((changes) => {
        if (changes.mascotEnabled) {
          const enabled = changes.mascotEnabled.newValue;
          if (enabled) {
            this.start();
          } else {
            this.stop();
          }
        }
        if (!this.isRunning || !this.engine || !this.renderer) return;
        if (changes.mascotSkin) {
          this.renderer.setSkin(changes.mascotSkin.newValue);
        }
        const updatedConfig = {};
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
  };
  var core = new SIGSSMascotCore();
  core.init().catch((err) => {
    console.error("Painel SIGSS+ Mascote: Falha na inicializa\xE7\xE3o do Core:", err);
  });
})();
//# sourceMappingURL=content.js.map
