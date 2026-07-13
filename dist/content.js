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
    // Posição e velocidade real
    x = 100;
    y = 100;
    vx = 0;
    vy = 0;
    // Velocidades alvo para inércia / aceleração suave
    targetVx = 0;
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
    jumpForce = -8.5;
    normalSpeed = 1.1;
    runSpeed = 2.6;
    climbSpeed = 0.9;
    inertia = 0.15;
    // Fator de inércia para movimento suave (0.1 = muito suave, 1.0 = instantâneo)
    // Ciclo de comportamento
    nextStateTime = 0;
    actionEndTime = 0;
    celebrationEndTime = 0;
    celebrationTargetX = 0;
    celebrationTargetY = 0;
    isCelebrating = false;
    // Dados de contexto das chamadas
    currentCalledPatient = "";
    lastAnnouncedHour = -1;
    // Callback de desenho
    onUpdateCallback = () => {
    };
    constructor() {
      this.resetToSafety();
    }
    resetToSafety() {
      this.x = window.innerWidth / 2;
      this.y = 50;
      this.vx = 0;
      this.vy = 2;
      this.targetVx = 0;
      this.state = "FALL";
      this.isCelebrating = false;
    }
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      this.width = this.config.size;
      this.height = this.config.size;
      const scale = this.config.size / 64;
      this.gravity = 0.35 * scale;
      this.jumpForce = -8.5 * Math.sqrt(scale);
    }
    getConfig() {
      return this.config;
    }
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
     * Comportamento e tomadas de decisão inteligentes
     */
    applyBehavior() {
      const now = Date.now();
      this.updateContextData();
      if (this.state === "TRIP") {
        if (now > this.actionEndTime) {
          this.state = "IDLE";
          this.nextStateTime = now + 1500;
          this.targetVx = 0;
        }
        return;
      }
      if (this.state === "STRETCH") {
        if (now > this.actionEndTime) {
          this.state = "IDLE";
          this.nextStateTime = now + 1e3;
          this.targetVx = 0;
        }
        return;
      }
      if (this.isCelebrating) {
        if (now > this.celebrationEndTime) {
          this.isCelebrating = false;
          this.state = "IDLE";
          this.nextStateTime = now + 2e3;
          this.targetVx = 0;
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
     * Mantém o mascote atualizado sobre o nome do paciente ativo e horas do relógio
     */
    updateContextData() {
      const elements = SigssPanelAdapter.getElements();
      if (elements.patientName) {
        this.currentCalledPatient = (elements.patientName.textContent || "").trim();
      }
      const now = /* @__PURE__ */ new Date();
      this.lastAnnouncedHour = now.getHours();
    }
    /**
     * Movimento direcionado quando há chamadas na UBS
     */
    executeCelebrationBehavior() {
      const speed = this.runSpeed * this.config.speedMultiplier;
      if (this.state === "JUMP" || this.state === "FALL") {
        return;
      }
      const dx = this.celebrationTargetX - (this.x + this.width / 2);
      if (Math.abs(dx) > 60) {
        this.state = "RUN";
        if (dx > 0) {
          this.targetVx = speed;
          this.direction = "RIGHT";
        } else {
          this.targetVx = -speed;
          this.direction = "LEFT";
        }
        const floor = this.getFloorLevelAt(this.x);
        const nextFloor = this.getFloorLevelAt(this.x + (dx > 0 ? 25 : -25));
        if (nextFloor < floor - 20 && this.y >= floor - 5) {
          this.vy = this.jumpForce * 1.05;
          this.state = "JUMP";
          this.targetVx = (dx > 0 ? speed : -speed) * 1.2;
        }
      } else {
        this.state = "CELEBRATE";
        this.targetVx = 0;
        if (this.y === this.getFloorLevelAt(this.x)) {
          this.vy = this.jumpForce * 1.15;
          this.state = "JUMP";
          this.targetVx = (Math.random() - 0.5) * 2.5;
        }
      }
    }
    /**
     * Decide aleatoriamente qual será a próxima ação
     */
    decideNextState(now) {
      const rand = Math.random();
      const duration = 2500 + Math.random() * 4500;
      this.nextStateTime = now + duration;
      if (this.state === "JUMP" || this.state === "FALL") {
        return;
      }
      const currentFloor = this.getFloorLevelAt(this.x);
      if (this.x <= 15) {
        this.direction = "RIGHT";
        this.state = "WALK";
        this.targetVx = this.normalSpeed * this.config.speedMultiplier;
        return;
      }
      if (this.x + this.width >= window.innerWidth - 15) {
        this.direction = "LEFT";
        this.state = "WALK";
        this.targetVx = -this.normalSpeed * this.config.speedMultiplier;
        return;
      }
      if (rand < 0.35) {
        this.state = "WALK";
        const goRight = Math.random() > 0.5;
        this.direction = goRight ? "RIGHT" : "LEFT";
        this.targetVx = (goRight ? this.normalSpeed : -this.normalSpeed) * this.config.speedMultiplier;
      } else if (rand < 0.4) {
        this.state = "TRIP";
        this.actionEndTime = now + 2e3;
        this.targetVx = (this.direction === "RIGHT" ? this.normalSpeed : -this.normalSpeed) * 0.7;
      } else if (rand < 0.45) {
        this.state = "STRETCH";
        this.actionEndTime = now + 2200;
        this.targetVx = 0;
      } else if (rand < 0.6) {
        this.state = "IDLE";
        this.targetVx = 0;
      } else if (rand < 0.7) {
        this.state = "SLEEP";
        this.targetVx = 0;
      } else if (rand < 0.8) {
        this.state = "JUMP";
        this.vy = this.jumpForce;
        const jumpDir = Math.random() > 0.5 ? 1 : -1;
        this.targetVx = jumpDir * this.normalSpeed * 1.6 * this.config.speedMultiplier;
      } else if (rand < 0.9) {
        this.state = "RUN";
        const goRight = Math.random() > 0.5;
        this.direction = goRight ? "RIGHT" : "LEFT";
        this.targetVx = (goRight ? this.runSpeed : -this.runSpeed) * this.config.speedMultiplier;
      } else {
        const isNearLeftWall = this.x < 120;
        const isNearRightWall = this.x + this.width > window.innerWidth - 120;
        if (isNearLeftWall || isNearRightWall) {
          this.state = "CLIMB";
          this.targetVx = 0;
          this.vx = 0;
          this.vy = -this.climbSpeed * this.config.speedMultiplier;
          this.direction = isNearLeftWall ? "LEFT" : "RIGHT";
        } else {
          this.state = "JUMP";
          this.vy = this.jumpForce * 1.1;
          const centerDir = this.x < window.innerWidth / 2 ? 1 : -1;
          this.targetVx = centerDir * this.normalSpeed * 1.8 * this.config.speedMultiplier;
        }
      }
    }
    /**
     * Dispara a comemoração de chamada de paciente
     */
    triggerCallReaction(patientName, local) {
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
      this.state = "RUN";
      this.celebrationEndTime = Date.now() + 1e4;
      const floor = this.getFloorLevelAt(this.x);
      if (this.y >= floor - 5) {
        this.vy = this.jumpForce * 0.9;
        this.state = "JUMP";
        this.targetVx = (this.celebrationTargetX > this.x ? this.runSpeed : -this.runSpeed) * 0.5;
      }
    }
    /**
     * Aplica física com aceleração e desaceleração linear para movimentos orgânicos
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
      if (this.state === "TRIP") {
        this.vx += (0 - this.vx) * 0.08;
      } else {
        this.vx += (this.targetVx - this.vx) * this.inertia;
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
        this.vx = -this.vx * 0.4;
        this.targetVx = -this.targetVx;
        this.direction = "RIGHT";
      } else if (this.x + this.width > window.innerWidth) {
        this.x = window.innerWidth - this.width;
        this.vx = -this.vx * 0.4;
        this.targetVx = -this.targetVx;
        this.direction = "LEFT";
      }
      const updatedFloor = this.getFloorLevelAt(this.x);
      if (this.y >= updatedFloor) {
        const isLanding = this.state === "FALL" || this.state === "JUMP";
        this.y = updatedFloor;
        this.vy = 0;
        if (isLanding) {
          this.targetVx = 0;
          this.vx = this.vx * 0.3;
          this.state = "IDLE";
          this.nextStateTime = Date.now() + 800;
        }
      }
    }
    /**
     * Retorna a coordenada Y do "chão" na posição X.
     * O mascote pode pousar e andar no topo do card principal e da barra lateral de histórico.
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
          if (this.y + this.height <= histRect.top + 18 && this.vy >= 0) {
            return histRect.top - this.height;
          }
        }
      }
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
  };

  // src/mascot/MascotRenderer.ts
  var MascotRenderer = class {
    containerEl = null;
    spriteEl = null;
    balloonEl = null;
    engine;
    currentSkin = "gotinha";
    lastTipTime = 0;
    activeBubbleContent = "";
    // Dicas e falas normais (humanizadas e simpáticas)
    normalSpeeches = [
      "T\xF4 de olho nessa fila... \u{1F9D0}",
      "J\xE1 bebeu \xE1gua hoje? Tem bebedouro ali! \u{1F4A7}",
      "Estica as pernas um pouquinho! \u{1F6B6}\u200D\u2642\uFE0F",
      "Sabia que o SUS \xE9 o maior sistema p\xFAblico de sa\xFAde gratuito do mundo? \u{1F1E7}\u{1F1F7}",
      "Por favor, n\xE3o esque\xE7a seus documentos quando for chamado! \u{1FAAA}",
      "Que dia produtivo aqui na UBS! \u{1FA7A}",
      "Quem trouxe o cart\xE3o do SUS levantando a m\xE3o! \u{1F4B3}",
      "Lavar as m\xE3os salva vidas, viu? \u{1F9FC}",
      "Mantenha a postura sentada nessa cadeira! \u{1F9D8}\u200D\u2642\uFE0F",
      "Alimenta\xE7\xE3o saud\xE1vel \xE9 o melhor rem\xE9dio. Coma frutas! \u{1F34E}",
      "Se tossir ou espirrar, use o bra\xE7o para cobrir! \u{1F927}",
      "A vacina protege voc\xEA e quem voc\xEA ama. Vacine-se! \u{1F489}"
    ];
    // Falas de tropeço (divertidas)
    tripSpeeches = [
      "Ops! Quem deixou esse degrau virtual aqui? \u{1F915}",
      "A\xED! Que escorregada... \u{1F605}",
      "Cuidado com o ch\xE3o liso! \u{1F9FC}",
      "Minha f\xEDsica deu tilt! \u{1F916}",
      "Tropecei no rodap\xE9 do painel! \u{1FAE3}",
      "Estou bem! Ningu\xE9m viu, n\xE9? \u{1F440}"
    ];
    // Falas de alongamento
    stretchSpeeches = [
      "Alongando... Estica bem as costas! \u{1F9D8}\u200D\u2642\uFE0F",
      "Uh! Que pregui\xE7a boa...",
      "Esticando os circuitos! \u2699\uFE0F",
      "Bora dar aquela esticada nas patinhas! \u{1F43E}"
    ];
    constructor(engine) {
      this.engine = engine;
      this.injectStyles();
      this.createMascotElements();
      this.setSkin("gotinha");
      this.lastTipTime = Date.now() - 1e4;
    }
    destroy() {
      if (this.containerEl && this.containerEl.parentNode) {
        this.containerEl.parentNode.removeChild(this.containerEl);
      }
    }
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
     * Atualiza coordenadas físicas, estados e balões de diálogo
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
     * Lógica avançada de geração de falas de acordo com a posição e ações do mascote
     */
    updateBalloon(callAwareness) {
      if (!this.balloonEl) return;
      const now = Date.now();
      if (this.engine.state === "CELEBRATE" || this.engine.state === "RUN" && this.engine.isCelebrating && callAwareness) {
        let patientGreet = "\u{1F4E2} Nova chamada!";
        if (this.engine.currentCalledPatient && this.engine.currentCalledPatient !== "-") {
          const nameParts = this.engine.currentCalledPatient.split(" ");
          const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : nameParts[0];
          patientGreet = `\u2728 Boa consulta, ${shortName}! \u{1F340}`;
        }
        this.setBalloonText(patientGreet, true);
        return;
      }
      if (this.engine.state === "SLEEP") {
        const sleepWords = ["Zzz...", "*Sonhando com vacinas...*", "Mais 5 minutinhos... \u{1F4A4}", "Recarregando as baterias... \u{1F50B}"];
        const index = Math.floor(now / 3500 % sleepWords.length);
        this.setBalloonText(sleepWords[index], false);
        return;
      }
      if (this.engine.state === "TRIP") {
        if (!this.balloonEl.classList.contains("visible") || this.activeBubbleContent === "") {
          const randTrip = this.tripSpeeches[Math.floor(Math.random() * this.tripSpeeches.length)];
          this.setBalloonText(randTrip, false);
        }
        return;
      }
      if (this.engine.state === "STRETCH") {
        if (!this.balloonEl.classList.contains("visible") || this.activeBubbleContent === "") {
          const randStretch = this.stretchSpeeches[Math.floor(Math.random() * this.stretchSpeeches.length)];
          this.setBalloonText(randStretch, false);
        }
        return;
      }
      if (this.engine.state === "IDLE" || this.engine.state === "WALK") {
        const timeSinceLastTip = now - this.lastTipTime;
        if (timeSinceLastTip > 18e3) {
          let chosenSpeech = "";
          if (this.engine.y < 120 && this.engine.lastAnnouncedHour >= 0) {
            const hr = this.engine.lastAnnouncedHour;
            if (hr >= 7 && hr < 12) {
              chosenSpeech = "Bom dia! Que o seu dia seja saud\xE1vel e produtivo. \u2600\uFE0F";
            } else if (hr >= 12 && hr < 13) {
              chosenSpeech = "Quase hora do almo\xE7o... Bateu aquela fominha! \u{1F60B}";
            } else if (hr >= 13 && hr < 18) {
              chosenSpeech = "Boa tarde! Lembra de beber \xE1gua nesta tarde. \u{1F964}";
            } else {
              chosenSpeech = "Fim de tarde... J\xE1 se cuidou hoje? \u{1F319}";
            }
          } else {
            chosenSpeech = this.normalSpeeches[Math.floor(Math.random() * this.normalSpeeches.length)];
          }
          this.setBalloonText(chosenSpeech, false);
          this.lastTipTime = now;
        } else if (timeSinceLastTip > 6500 && this.balloonEl.classList.contains("visible") && !this.balloonEl.classList.contains("important-balloon")) {
          this.balloonEl.classList.remove("visible");
          this.activeBubbleContent = "";
        }
      } else {
        if (!this.balloonEl.classList.contains("important-balloon")) {
          this.balloonEl.classList.remove("visible");
          this.activeBubbleContent = "";
        }
      }
    }
    setBalloonText(text, isImportant) {
      if (!this.balloonEl) return;
      if (this.activeBubbleContent === text) return;
      this.activeBubbleContent = text;
      this.balloonEl.textContent = text;
      this.balloonEl.classList.add("visible");
      if (isImportant) {
        this.balloonEl.classList.add("important-balloon");
      } else {
        this.balloonEl.classList.remove("important-balloon");
      }
    }
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
        transition: transform 0.1s ease;
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
         ANIMA\xC7\xD5ES DOS ESTADOS DO MASCOTE (CSS KEYFRAMES)
         ========================================================================== */
      
      /* 1. IDLE (Respira\xE7\xE3o com balan\xE7o sutil) */
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

      /* 3. RUN (Passadas r\xE1pidas e pulos curtos) */
      .state-run svg {
        animation: mascotRun 0.3s linear infinite;
      }

      @keyframes mascotRun {
        0%, 100% { transform: translateY(0) scaleY(1) rotate(-3deg); }
        50% { transform: translateY(-6px) scaleY(0.88) rotate(6deg); }
      }

      /* 4. SLEEP (Pregui\xE7a, rotacionado deitado) */
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

      /* 7. CLIMB (Balan\xE7o vertical ao subir escadas/laterais) */
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

      /* 9. TRIP (Trope\xE7o: Deita de cara no ch\xE3o e treme levemente) */
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
    getGotinhaSVG() {
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
    getRobozinhoSVG() {
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
    getGatinhoSVG() {
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
