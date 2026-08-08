"use strict";
(() => {
  // src/utils/sigssPanelAdapter.ts
  var SigssPanelAdapter = class {
    /**
     * Detecta se a página aberta é o painel de chamadas
     */
    static isPanelPage() {
      const url = window.location.href;
      return url.includes("unique-panel/panel-screen") || url.includes("mock_panel.html") || document.title.toLowerCase().includes("painel") || !!document.querySelector(".called-patient, #current-patient, .panel-container, .calling-card") || this.hasCalledPatientHeuristic();
    }
    static hasCalledPatientHeuristic() {
      const bodyText = (document.body ? document.body.innerText || "" : "").toUpperCase();
      return bodyText.includes("CHAMANDO") || bodyText.includes("\xDALTIMAS CHAMADAS") || bodyText.includes("HIST\xD3RICO");
    }
    /**
     * Retorna os elementos do painel usando seletores diretos e heurísticas estruturais de segurança
     */
    static getElements() {
      const historySection = document.querySelector(
        '.history-section, .ultimas-chamadas, aside.history, .painel-historico, [class*="history"], [class*="sidebar"]'
      );
      let callingCard = document.querySelector(
        '.calling-card, .chamando-card, .painel-chamando, [class*="chamando-card"]'
      );
      if (!callingCard) {
        const allDivs = Array.from(document.querySelectorAll("div, section, td, th, h1, h2, h3, p, span"));
        let chamandoHeader = null;
        for (const el of allDivs) {
          const text = (el.textContent || "").trim().toUpperCase();
          if (text === "CHAMANDO" || text === "CHAMANDO ATIVA" || text === "PACIENTE CHAMADO") {
            chamandoHeader = el;
            break;
          }
        }
        if (chamandoHeader) {
          let parent = chamandoHeader.parentElement;
          while (parent && parent !== document.body) {
            const rect = parent.getBoundingClientRect();
            if (rect.width > 200 && rect.width < window.innerWidth * 0.8) {
              callingCard = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
      const searchRoot = callingCard || document.body;
      let patientName = document.querySelector("#current-patient, .called-patient, .chamando-paciente, .paciente-chamado");
      let localName = document.querySelector("#current-local, .called-local, .chamando-local, .sala-chamada");
      let professionalName = document.querySelector("#current-professional, .called-professional, .chamando-profissional");
      if (!patientName) {
        patientName = this.findValueByLabelHeuristic(searchRoot, ["PACIENTE"], historySection);
      }
      if (!localName) {
        localName = this.findValueByLabelHeuristic(searchRoot, ["LOCAL", "SALA", "GUICH\xCA", "GUICHE"], historySection);
      }
      if (!professionalName) {
        professionalName = this.findValueByLabelHeuristic(searchRoot, ["PROFISSIONAL", "M\xC9DICO", "MEDICO", "ENFERMEIRO"], historySection);
      }
      return {
        callingCard,
        patientName,
        localName,
        professionalName,
        historySection,
        footerTicker: document.querySelector(".panel-footer, footer, .footer-ticker, marquee")
      };
    }
    /**
     * Encontra um elemento de valor que está posicionado após/abaixo de um rótulo explicativo
     */
    static findValueByLabelHeuristic(root, labelKeywords, excludeContainer) {
      const all = Array.from(root.querySelectorAll("span, div, h1, h2, h3, p, td, th, b, strong, label"));
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        if (excludeContainer && excludeContainer.contains(el)) {
          continue;
        }
        const text = (el.textContent || "").trim().toUpperCase();
        const matchesLabel = labelKeywords.some(
          (keyword) => text === keyword || text === keyword + ":" || text.startsWith(keyword + ":")
        );
        if (matchesLabel) {
          for (let j = i + 1; j < all.length; j++) {
            const valEl = all[j];
            if (excludeContainer && excludeContainer.contains(valEl)) {
              continue;
            }
            const valText = (valEl.textContent || "").trim();
            const valUpper = valText.toUpperCase();
            const isExactHeaderLabel = labelKeywords.some((k) => valUpper === k || valUpper === k + ":") || valUpper === "PACIENTE" || valUpper === "LOCAL" || valUpper === "PROFISSIONAL";
            if (valText && valText !== "-" && valEl.children.length === 0 && !isExactHeaderLabel) {
              return valEl;
            }
          }
        }
      }
      return null;
    }
    /**
     * Obtém as caixas de colisão física dos blocos
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
    // Configurações públicas para o renderer
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
    // Ciclo de comportamento
    nextStateTime = 0;
    actionEndTime = 0;
    celebrationEndTime = 0;
    celebrationTargetX = 0;
    celebrationTargetY = 0;
    isCelebrating = false;
    // Dados de contexto das chamadas e histórico
    currentCalledPatient = "";
    currentLocal = "";
    currentProfessional = "";
    patientCallCount = 1;
    activeCallMessage = "";
    lastAnnouncedHour = -1;
    pastPatients = [];
    // Callback de desenho
    onUpdateCallback = () => {
    };
    constructor() {
      this.resetToSafety();
    }
    get facingRight() {
      return this.direction === "RIGHT";
    }
    setState(newState) {
      this.state = newState;
      if (newState === "DRAGGED") {
        this.vx = 0;
        this.vy = 0;
      }
    }
    resetToSafety() {
      this.x = Math.random() * (window.innerWidth - 100) + 50;
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
    update() {
      if (this.state === "DRAGGED") {
        this.onUpdateCallback();
        return;
      }
      this.applyBehavior();
      this.applyPhysics();
      this.onUpdateCallback();
    }
    applyBehavior() {
      const now = Date.now();
      this.updateContextData();
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
      if (now > this.nextStateTime) {
        this.decideNextState(now);
      }
    }
    updateContextData() {
      const now = /* @__PURE__ */ new Date();
      this.lastAnnouncedHour = now.getHours();
    }
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
        this.vx = 0;
      }
    }
    decideNextState(now) {
      const rand = Math.random();
      const duration = 2500 + Math.random() * 4500;
      this.nextStateTime = now + duration;
      if (this.state === "JUMP" || this.state === "FALL") {
        return;
      }
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
    triggerCallReaction(patientName, local, professional) {
      if (!this.config.callAwareness) return;
      if (patientName === this.currentCalledPatient) {
        this.patientCallCount++;
      } else {
        this.currentCalledPatient = patientName;
        this.patientCallCount = 1;
      }
      this.currentLocal = local;
      this.currentProfessional = professional;
      this.activeCallMessage = this.generatePersonalizedCallMessage(patientName, local, professional);
      const elements = SigssPanelAdapter.getElements();
      const shortName = this.getShortName(patientName);
      if (shortName && !this.pastPatients.includes(shortName)) {
        this.pastPatients.unshift(shortName);
        if (this.pastPatients.length > 5) {
          this.pastPatients.pop();
        }
      }
      if (elements.callingCard) {
        const rect = elements.callingCard.getBoundingClientRect();
        this.celebrationTargetX = rect.left + rect.width / 2;
        this.celebrationTargetY = rect.top + rect.height / 2;
      } else {
        this.celebrationTargetX = window.innerWidth / 2;
        this.celebrationTargetY = window.innerHeight / 2;
      }
      this.isCelebrating = true;
      this.celebrationEndTime = Date.now() + 18e3;
      this.actionEndTime = 0;
      this.vy = this.jumpForce * 1.1;
      this.state = "JUMP";
      const dx = this.celebrationTargetX - (this.x + this.width / 2);
      this.direction = dx > 0 ? "RIGHT" : "LEFT";
      this.targetVx = (dx > 0 ? this.runSpeed : -this.runSpeed) * this.config.speedMultiplier;
      this.vx = this.targetVx * 0.8;
    }
    generatePersonalizedCallMessage(patientName, local, professional) {
      const name = this.getShortName(patientName);
      const count = this.patientCallCount;
      if (count === 2) {
        return `\u{1F514} Segunda chamada para ${name}! Favor ir para o(a) ${local}.`;
      }
      if (count >= 3) {
        return `\u26A0\uFE0F ATEN\xC7\xC3O: \xDAltima chamada para ${name}! Por favor, v\xE1 para o(a) ${local} urgente! \u{1F6AA}`;
      }
      const localUpper = local.toUpperCase();
      if (localUpper.includes("VACINA")) {
        return `\u{1F489} Hora da gotinha ou vacina! ${name}, v\xE1 para a ${local}. Sem choro! \u{1F609}`;
      }
      if (localUpper.includes("ODONTO") || localUpper.includes("DENTISTA")) {
        return `\u{1FAA5} Cuidando do sorriso! ${name}, o consult\xF3rio de dentista \xE9 o(a) ${local}.`;
      }
      if (localUpper.includes("PEDIATRIA") || localUpper.includes("PEDIATRA")) {
        return `\u{1F476} Aten\xE7\xE3o ao pequeno: ${name}, favor se dirigir ao(\xE0) ${local}.`;
      }
      if (localUpper.includes("CURATIVO")) {
        return `\u{1FA79} Cuidado com o machucado! ${name}, dirija-se ao(\xE0) ${local}.`;
      }
      if (localUpper.includes("TRIAGEM")) {
        return `\u{1FA7A} Medindo press\xE3o e peso! ${name}, v\xE1 ao(\xE0) ${local}.`;
      }
      if (professional && professional !== "-" && professional.length > 3) {
        const profShort = professional.split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        const rand = Math.random();
        if (rand < 0.45) {
          return `\u{1F6AA} ${name}, o(a) ${profShort} j\xE1 te espera na ${local}!`;
        } else if (rand < 0.9) {
          return `\u{1F469}\u200D\u2695\uFE0F Consulta com ${profShort}! V\xE1 para o(a) ${local}, ${name}.`;
        }
      }
      const templates = [
        `\u2728 ${name}, sua vez! Dirija-se ao(\xE0) ${local}. Boa sorte! \u{1F340}`,
        `\u{1F6AA} O(A) ${local} est\xE1 te chamando, ${name}! Foco na sa\xFAde. \u{1FA7A}`,
        `\u{1F3C3}\u200D\u2642\uFE0F Fila andou, ${name}! Corre l\xE1 no(a) ${local}.`,
        `\u{1F31F} ${name}, sa\xFAde em primeiro lugar! V\xE1 para o(a) ${local}.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
    getShortName(fullName) {
      if (!fullName) return "";
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length > 1) {
        const format = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        return `${format(nameParts[0])} ${format(nameParts[nameParts.length - 1])}`;
      }
      return fullName;
    }
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

  // src/content/fallbackManifest.ts
  var FALLBACK_MANIFEST = {
    contentVersion: "2026.08.08.001",
    schemaVersion: "1.0",
    minExtensionVersion: "2.0.0",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    mascots: [
      {
        id: "gotinha",
        name: "Z\xE9 Gotinha",
        version: "2.0.0",
        defaultSkin: "default",
        skins: {
          default: {
            id: "default",
            name: "Z\xE9 Gotinha Cl\xE1ssico",
            type: "svg",
            src: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 4 C32 4 12 28 12 42 A20 20 0 0 0 52 42 C52 28 32 4 32 4 Z" fill="#FFFFFF" stroke="#0288D1" stroke-width="3"/>
            <circle cx="25" cy="38" r="3" fill="#0288D1"/>
            <circle cx="39" cy="38" r="3" fill="#0288D1"/>
            <path d="M26 46 Q32 52 38 46" fill="none" stroke="#E53935" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M22 28 C26 24 38 24 42 28" fill="none" stroke="#0288D1" stroke-width="2" stroke-linecap="round"/>
          </svg>`,
            width: 64,
            height: 64
          }
        }
      },
      {
        id: "gatinho_laranja",
        name: "Gatinho Laranja",
        version: "2.0.0",
        defaultSkin: "default",
        skins: {
          default: {
            id: "default",
            name: "Gatinho Laranja",
            type: "svg",
            src: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 22 L24 8 L32 20 L40 8 L48 22 Z" fill="#FB8C00"/>
            <circle cx="32" cy="36" r="20" fill="#FB8C00"/>
            <circle cx="24" cy="32" r="3.5" fill="#212121"/>
            <circle cx="40" cy="32" r="3.5" fill="#212121"/>
            <polygon points="32,38 29,42 35,42" fill="#E91E63"/>
            <path d="M12 36 L22 36 M12 40 L22 39 M52 36 L42 36 M52 40 L42 39" stroke="#424242" stroke-width="2"/>
          </svg>`,
            width: 64,
            height: 64
          }
        }
      },
      {
        id: "robozinho_azul",
        name: "Robozinho Sa\xFAde",
        version: "2.0.0",
        defaultSkin: "default",
        skins: {
          default: {
            id: "default",
            name: "Robozinho Azul",
            type: "svg",
            src: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="16" width="32" height="28" rx="6" fill="#0288D1" stroke="#01579B" stroke-width="2"/>
            <rect x="22" y="22" width="20" height="12" rx="3" fill="#E0F7FA"/>
            <circle cx="27" cy="28" r="2.5" fill="#00C853"/>
            <circle cx="37" cy="28" r="2.5" fill="#00C853"/>
            <line x1="32" y1="6" x2="32" y2="16" stroke="#01579B" stroke-width="3"/>
            <circle cx="32" cy="6" r="4" fill="#FFD600"/>
            <rect x="20" y="48" width="8" height="10" fill="#0288D1"/>
            <rect x="36" y="48" width="8" height="10" fill="#0288D1"/>
          </svg>`,
            width: 64,
            height: 64
          }
        }
      }
    ],
    campaigns: [
      {
        id: "saude_preventiva",
        title: "Sa\xFAde Preventiva UBS Betim",
        priority: 1,
        messages: [
          {
            id: "msg_01",
            text: "Mantenha sua caderneta de vacina\xE7\xE3o sempre atualizada!",
            category: "vaccination",
            displayDurationSeconds: 7
          },
          {
            id: "msg_02",
            text: "Beba bastante \xE1gua diariamente para cuidar da sua sa\xFAde.",
            category: "health_tip",
            displayDurationSeconds: 6
          },
          {
            id: "msg_03",
            text: "Consulte seu m\xE9dico da UBS regularmente para exames preventivos.",
            category: "prevention",
            displayDurationSeconds: 8
          }
        ]
      }
    ]
  };

  // src/utils/svgSanitizer.ts
  var SvgSanitizer = class {
    static DANGEROUS_TAGS = ["script", "iframe", "embed", "object", "foreignobject", "base", "form", "input", "meta", "link"];
    static sanitize(svgContent) {
      if (!svgContent || typeof svgContent !== "string") {
        return "";
      }
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        if (doc.querySelector("parsererror")) {
          return this.regexFallbackSanitize(svgContent);
        }
        const svgNode = doc.querySelector("svg");
        if (!svgNode) {
          return "";
        }
        this.DANGEROUS_TAGS.forEach((tag) => {
          const elements = doc.querySelectorAll(tag);
          elements.forEach((el) => el.parentNode?.removeChild(el));
        });
        const allElements = doc.querySelectorAll("*");
        allElements.forEach((el) => {
          const attrs = Array.from(el.attributes);
          attrs.forEach((attr) => {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value.toLowerCase();
            if (attrName.startsWith("on")) {
              el.removeAttribute(attr.name);
            }
            if ((attrName === "href" || attrName === "xlink:href" || attrName === "src") && (attrValue.includes("javascript:") || attrValue.includes("data:text/html"))) {
              el.removeAttribute(attr.name);
            }
          });
        });
        return svgNode.outerHTML;
      } catch (e) {
        return this.regexFallbackSanitize(svgContent);
      }
    }
    static regexFallbackSanitize(raw) {
      return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/on\w+\s*=\s*(['"]).*?\1/gi, "").replace(/on\w+\s*=\s*[^>\s]+/gi, "").replace(/href\s*=\s*['"]javascript:.*?['"]/gi, "");
    }
  };

  // src/content/RemoteContentManager.ts
  var RemoteContentManager = class _RemoteContentManager {
    static instance = null;
    currentManifest = FALLBACK_MANIFEST;
    isFetching = false;
    listeners = /* @__PURE__ */ new Set();
    // URL Padrão de QA / Desenvolvimento (Branch de Feature)
    static QA_REMOTE_URL = "https://raw.githubusercontent.com/GuiPaicheco/Painel-SIGSSe/feature/architecture-v2/content/manifest.json";
    // URL Padrão de Produção (Branch Main)
    static PROD_REMOTE_URL = "https://raw.githubusercontent.com/GuiPaicheco/Painel-SIGSSe/main/content/manifest.json";
    remoteUrl = _RemoteContentManager.QA_REMOTE_URL;
    constructor() {
      this.sanitizeManifestSkins(this.currentManifest);
    }
    static getInstance() {
      if (!_RemoteContentManager.instance) {
        _RemoteContentManager.instance = new _RemoteContentManager();
      }
      return _RemoteContentManager.instance;
    }
    setRemoteUrl(url) {
      this.remoteUrl = url;
    }
    getRemoteUrl() {
      return this.remoteUrl;
    }
    onUpdate(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    notifyUpdate() {
      this.listeners.forEach((fn) => {
        try {
          fn(this.currentManifest);
        } catch (e) {
          console.error("SIGSSe ContentManager: Erro ao notificar ouvinte de atualiza\xE7\xE3o:", e);
        }
      });
    }
    /**
     * Inicializa o gerenciador com Stale-While-Revalidate:
     * 1. Carrega do cache local/fallback imediatamente.
     * 2. Tenta atualização remota real em background via fetch HTTP.
     */
    async init() {
      const cached = await this.loadFromLocalCache();
      if (cached && this.validateManifestSchema(cached)) {
        this.sanitizeManifestSkins(cached);
        this.currentManifest = cached;
      } else {
        this.sanitizeManifestSkins(FALLBACK_MANIFEST);
        this.currentManifest = FALLBACK_MANIFEST;
        await this.saveToLocalCache(FALLBACK_MANIFEST);
      }
      this.checkRemoteUpdateInBackground().catch((err) => {
        console.warn("SIGSSe ContentManager: Falha na verifica\xE7\xE3o de atualiza\xE7\xE3o remota:", err);
      });
      return this.currentManifest;
    }
    getManifest() {
      return this.currentManifest;
    }
    getMascots() {
      return this.currentManifest.mascots || FALLBACK_MANIFEST.mascots;
    }
    getMascotById(id) {
      return this.getMascots().find((m) => m && m.id === id) || FALLBACK_MANIFEST.mascots.find((m) => m.id === id);
    }
    getCampaigns() {
      return this.currentManifest.campaigns || FALLBACK_MANIFEST.campaigns;
    }
    getRandomCampaignMessage() {
      const campaigns = this.getCampaigns();
      if (!campaigns || campaigns.length === 0) return null;
      const allMessages = [];
      campaigns.forEach((c) => {
        if (c && Array.isArray(c.messages) && c.messages.length > 0) {
          allMessages.push(...c.messages);
        }
      });
      if (allMessages.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * allMessages.length);
      return allMessages[randomIndex];
    }
    /**
     * Validação rígida do Schema de Conteúdo Remoto
     */
    validateManifestSchema(data) {
      if (!data || typeof data !== "object") return false;
      if (!data.contentVersion || typeof data.contentVersion !== "string") return false;
      if (!data.schemaVersion || typeof data.schemaVersion !== "string") return false;
      if (!Array.isArray(data.mascots) || data.mascots.length === 0) return false;
      for (const mascot of data.mascots) {
        if (!mascot || typeof mascot !== "object" || !mascot.id || typeof mascot.id !== "string") {
          return false;
        }
        if (!mascot.skins || typeof mascot.skins !== "object") {
          return false;
        }
        if (!mascot.skins.default || typeof mascot.skins.default !== "object" || !mascot.skins.default.src) {
          return false;
        }
      }
      return true;
    }
    /**
     * Simulação local exclusivamente para testes de desenvolvimento offline
     */
    async simulateRemoteUpdate(remoteData) {
      if (!this.validateManifestSchema(remoteData)) {
        console.warn("SIGSSe ContentManager: Simula\xE7\xE3o de atualiza\xE7\xE3o rejeitada por schema inv\xE1lido.");
        return false;
      }
      if (remoteData.contentVersion === this.currentManifest.contentVersion) {
        console.log("SIGSSe ContentManager: Simula\xE7\xE3o de atualiza\xE7\xE3o ignorada (mesma vers\xE3o).");
        return false;
      }
      console.log(`SIGSSe ContentManager: Aplicando atualiza\xE7\xE3o remota simulada (${remoteData.contentVersion})...`);
      this.sanitizeManifestSkins(remoteData);
      this.currentManifest = remoteData;
      await this.saveToLocalCache(remoteData);
      this.notifyUpdate();
      return true;
    }
    sanitizeManifestSkins(manifest) {
      if (!manifest || !manifest.mascots) return;
      manifest.mascots.forEach((mascot) => {
        if (mascot && mascot.skins) {
          Object.keys(mascot.skins).forEach((skinKey) => {
            const skin = mascot.skins[skinKey];
            if (skin && skin.type === "svg" && skin.src) {
              skin.src = SvgSanitizer.sanitize(skin.src);
            }
          });
        }
      });
    }
    async loadFromLocalCache() {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(["remote_content_manifest"], (result) => {
            if (result && result.remote_content_manifest) {
              resolve(result.remote_content_manifest);
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      });
    }
    async saveToLocalCache(manifest) {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ remote_content_manifest: manifest }, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
    /**
     * Caminho Principal de Produção/QA: Realiza o Fetch HTTP Real no GitHub Raw
     */
    async checkRemoteUpdateInBackground() {
      if (this.isFetching) return false;
      this.isFetching = true;
      try {
        console.log(`SIGSSe ContentManager: Verificando manifesto remoto real em: ${this.remoteUrl}`);
        const response = await fetch(this.remoteUrl, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
        }
        const remoteData = await response.json();
        if (this.validateManifestSchema(remoteData)) {
          if (remoteData.contentVersion !== this.currentManifest.contentVersion) {
            console.log(`SIGSSe ContentManager: Nova vers\xE3o de conte\xFAdo remota recebida do GitHub (${remoteData.contentVersion}). Atualizando cache e notificando...`);
            this.sanitizeManifestSkins(remoteData);
            this.currentManifest = remoteData;
            await this.saveToLocalCache(remoteData);
            this.notifyUpdate();
            return true;
          } else {
            console.log(`SIGSSe ContentManager: Conte\xFAdo remoto em dia (${remoteData.contentVersion}). Nenhum update necess\xE1rio.`);
          }
        } else {
          console.warn("SIGSSe ContentManager: Conte\xFAdo remoto recebido possui schema inv\xE1lido. Mantendo fallback/cache anterior.");
        }
      } catch (e) {
        console.warn("SIGSSe ContentManager: Conex\xE3o remota indispon\xEDvel ou falhou. Mantendo estado offline seguro.");
      } finally {
        this.isFetching = false;
      }
      return false;
    }
  };

  // src/campaign/CampaignManager.ts
  var CampaignManager = class _CampaignManager {
    static instance = null;
    activeBubbleElement = null;
    bubbleTimeout = null;
    constructor() {
    }
    static getInstance() {
      if (!_CampaignManager.instance) {
        _CampaignManager.instance = new _CampaignManager();
      }
      return _CampaignManager.instance;
    }
    /**
     * Sanitiza a string de texto para prevenir XSS antes da inserção na página.
     */
    sanitizeText(input) {
      const temp = document.createElement("div");
      temp.textContent = input;
      return temp.innerHTML;
    }
    /**
     * Obtém uma mensagem de campanha ativa
     */
    getNextMessage() {
      return RemoteContentManager.getInstance().getRandomCampaignMessage();
    }
    /**
     * Cria um balão de fala dinâmico posicionado sobre um elemento mascote
     */
    showSpeechBubble(mascotElement, text, durationSeconds = 6) {
      this.removeActiveBubble();
      const bubble = document.createElement("div");
      bubble.className = "sigsse-speech-bubble";
      const sanitized = this.sanitizeText(text);
      bubble.innerHTML = `
      <div class="sigsse-speech-content">
        <span class="sigsse-speech-icon">\u{1F4A1}</span>
        <span class="sigsse-speech-text">${sanitized}</span>
      </div>
      <div class="sigsse-speech-arrow"></div>
    `;
      Object.assign(bubble.style, {
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%) translateY(-10px)",
        backgroundColor: "#FFFFFF",
        color: "#1A237E",
        padding: "10px 14px",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        fontSize: "13px",
        fontWeight: "600",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "220px",
        width: "max-content",
        zIndex: "999999",
        pointerEvents: "none",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        opacity: "0"
      });
      mascotElement.appendChild(bubble);
      this.activeBubbleElement = bubble;
      requestAnimationFrame(() => {
        bubble.style.opacity = "1";
        bubble.style.transform = "translateX(-50%) translateY(-16px)";
      });
      this.bubbleTimeout = setTimeout(() => {
        this.removeActiveBubble();
      }, durationSeconds * 1e3);
      return bubble;
    }
    removeActiveBubble() {
      if (this.bubbleTimeout) {
        clearTimeout(this.bubbleTimeout);
        this.bubbleTimeout = null;
      }
      if (this.activeBubbleElement && this.activeBubbleElement.parentNode) {
        const el = this.activeBubbleElement;
        el.style.opacity = "0";
        setTimeout(() => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 300);
        this.activeBubbleElement = null;
      }
    }
  };

  // src/mascot/MascotRenderer.ts
  var MascotRenderer = class {
    engine;
    container;
    mascotEl;
    skinId = "gotinha";
    // Handlers salvos para remoção limpa no destroy (Memory Leak Prevention)
    mouseMoveHandler = null;
    mouseUpHandler = null;
    clickHandler = null;
    mouseDownHandler = null;
    constructor(engine) {
      this.engine = engine;
      this.container = document.createElement("div");
      this.container.className = "sigsse-mascot-container";
      Object.assign(this.container.style, {
        position: "fixed",
        zIndex: "999999",
        top: "0px",
        left: "0px",
        pointerEvents: "auto",
        userSelect: "none",
        cursor: "grab",
        willChange: "transform"
      });
      this.mascotEl = document.createElement("div");
      this.mascotEl.className = "sigsse-mascot-sprite";
      this.container.appendChild(this.mascotEl);
      document.body.appendChild(this.container);
      this.setupInteractions();
    }
    setSkin(skinId) {
      this.skinId = skinId;
      this.updateSkinVisual();
    }
    updateSkinVisual() {
      const remoteManager = RemoteContentManager.getInstance();
      const mascotDef = remoteManager.getMascotById(this.skinId);
      let svgContent = "";
      if (mascotDef && mascotDef.skins && mascotDef.skins.default) {
        svgContent = mascotDef.skins.default.src;
      } else {
        const defaultMascot = remoteManager.getMascotById("gotinha");
        svgContent = defaultMascot?.skins.default.src || `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#0288D1"/></svg>`;
      }
      this.mascotEl.innerHTML = svgContent;
      const svg = this.mascotEl.querySelector("svg");
      if (svg) {
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.display = "block";
      }
    }
    render() {
      const { x, y, facingRight } = this.engine;
      const config = this.engine.getConfig();
      const scaleX = facingRight ? 1 : -1;
      this.container.style.transform = `translate3d(${x}px, ${y}px, 0px) scaleX(${scaleX})`;
      this.container.style.opacity = `${config.opacity}`;
      this.container.style.width = `${config.size}px`;
      this.container.style.height = `${config.size}px`;
      if (this.engine.state === "SPEAKING") {
        this.triggerCampaignSpeech();
      }
    }
    triggerCampaignSpeech() {
      const campaignManager = CampaignManager.getInstance();
      const msg = campaignManager.getNextMessage();
      if (msg) {
        campaignManager.showSpeechBubble(this.container, msg.text, msg.displayDurationSeconds);
      }
    }
    setupInteractions() {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      this.mouseDownHandler = (e) => {
        isDragging = true;
        startX = e.clientX - this.engine.x;
        startY = e.clientY - this.engine.y;
        this.container.style.cursor = "grabbing";
        this.engine.setState("DRAGGED");
      };
      this.mouseMoveHandler = (e) => {
        if (!isDragging) return;
        this.engine.x = e.clientX - startX;
        this.engine.y = e.clientY - startY;
      };
      this.mouseUpHandler = () => {
        if (isDragging) {
          isDragging = false;
          this.container.style.cursor = "grab";
          this.engine.setState("FALL");
        }
      };
      this.clickHandler = () => {
        this.triggerCampaignSpeech();
      };
      this.container.addEventListener("mousedown", this.mouseDownHandler);
      this.container.addEventListener("click", this.clickHandler);
      window.addEventListener("mousemove", this.mouseMoveHandler);
      window.addEventListener("mouseup", this.mouseUpHandler);
    }
    destroy() {
      if (this.mouseMoveHandler) {
        window.removeEventListener("mousemove", this.mouseMoveHandler);
        this.mouseMoveHandler = null;
      }
      if (this.mouseUpHandler) {
        window.removeEventListener("mouseup", this.mouseUpHandler);
        this.mouseUpHandler = null;
      }
      if (this.mouseDownHandler) {
        this.container.removeEventListener("mousedown", this.mouseDownHandler);
        this.mouseDownHandler = null;
      }
      if (this.clickHandler) {
        this.container.removeEventListener("click", this.clickHandler);
        this.clickHandler = null;
      }
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
    }
  };

  // src/core/config.ts
  var DEFAULT_SETTINGS = {
    mascotEnabled: true,
    mascotSkin: "gotinha",
    mascotCount: 1,
    speedMultiplier: 1,
    size: 64,
    opacity: 0.9,
    callAwareness: true,
    campaignsEnabled: true,
    remoteContentAutoUpdate: true,
    lastUpdatedTimestamp: Date.now()
  };
  var MascotConfigManager = class {
    /**
     * Obtém todas as configurações salvas ou retorna os valores padrão
     */
    static async load() {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(null, (items) => {
            resolve({
              ...DEFAULT_SETTINGS,
              ...items
            });
          });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      });
    }
    /**
     * Salva configurações parciais ou completas
     */
    static async save(settings) {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ ...settings, lastUpdatedTimestamp: Date.now() }, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
    /**
     * Escuta alterações de configurações em tempo real
     */
    static onChange(callback) {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === "local") {
            callback(changes);
          }
        });
      }
    }
  };

  // src/core/content.ts
  var SIGSSMascotCore = class {
    mascots = [];
    isRunning = false;
    observer = null;
    lastCalledPatient = "";
    remoteUpdateUnsubscribe = null;
    async init() {
      if (!SigssPanelAdapter.isPanelPage()) {
        console.log("Painel SIGSS+ Mascote v2.0: P\xE1gina atual n\xE3o identificada como painel de chamadas.");
        return;
      }
      console.log("Painel SIGSS+ Mascote v2.0: Inicializando plataforma modular...");
      window.addEventListener("sigsse_simulate_update", (e) => {
        if (e && e.detail) {
          RemoteContentManager.getInstance().simulateRemoteUpdate(e.detail);
        }
      });
      await RemoteContentManager.getInstance().init();
      this.remoteUpdateUnsubscribe = RemoteContentManager.getInstance().onUpdate(() => {
        console.log("Painel SIGSS+ Mascote v2.0: Atualiza\xE7\xE3o remota recebida. Aplicando hot-reload visual...");
        this.refreshVisualSkins();
      });
      this.waitForElementsAndStart();
      this.setupConfigListener();
    }
    waitForElementsAndStart() {
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
    async start() {
      if (this.isRunning) return;
      const settings = await MascotConfigManager.load();
      if (!settings.mascotEnabled) {
        console.log("Painel SIGSS+ Mascote v2.0: Extens\xE3o desativada nas configura\xE7\xF5es.");
        return;
      }
      this.isRunning = true;
      this.mascots = [];
      const count = settings.mascotCount || 1;
      console.log(`Painel SIGSS+ Mascote v2.0: Spawnando ${count} mascote(s)...`);
      const availableMascots = RemoteContentManager.getInstance().getMascots();
      const skinIds = availableMascots.map((m) => m.id);
      for (let i = 0; i < count; i++) {
        const engine = new MascotEngine();
        engine.x = window.innerWidth / (count + 1) * (i + 1) - settings.size / 2;
        engine.y = 80;
        engine.updateConfig({
          speedMultiplier: settings.speedMultiplier,
          size: settings.size,
          opacity: settings.opacity,
          callAwareness: settings.callAwareness
        });
        const renderer = new MascotRenderer(engine);
        let activeSkin = settings.mascotSkin || "gotinha";
        if (activeSkin === "mixed" && skinIds.length > 0) {
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
    refreshVisualSkins() {
      this.mascots.forEach((m) => {
        m.renderer.updateSkinVisual();
      });
    }
    stop() {
      this.isRunning = false;
      this.mascots.forEach((m) => {
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
      console.log("Painel SIGSS+ Mascote v2.0: Motores parados e limpos.");
    }
    animationLoop = () => {
      if (!this.isRunning) return;
      this.mascots.forEach((m) => {
        m.engine.update();
      });
      requestAnimationFrame(this.animationLoop);
    };
    setupCallObserver() {
      this.lastCalledPatient = "";
      const initialElements = SigssPanelAdapter.getElements();
      if (initialElements.patientName) {
        this.lastCalledPatient = (initialElements.patientName.textContent || "").trim();
      }
      this.observer = new MutationObserver(() => {
        const elements = SigssPanelAdapter.getElements();
        if (!elements.patientName) return;
        const currentText = (elements.patientName.textContent || "").trim();
        if (currentText && currentText !== "-" && currentText.length > 2 && currentText !== this.lastCalledPatient) {
          console.log(`Painel SIGSS+ Mascote v2.0: Nova chamada detectada: ${currentText}`);
          this.lastCalledPatient = currentText;
          const local = (elements.localName?.textContent || "").trim();
          const professional = (elements.professionalName?.textContent || "").trim();
          this.mascots.forEach((m) => {
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
    setupConfigListener() {
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
          console.log("Painel SIGSS+ Mascote v2.0: Altera\xE7\xF5es estruturais. Reiniciando mascotes...");
          this.stop();
          this.start();
          return;
        }
        this.mascots.forEach((m) => {
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
            m.engine.updateConfig(updatedConfig);
          }
        });
      });
    }
  };
  var core = new SIGSSMascotCore();
  core.init().catch((err) => {
    console.error("Painel SIGSS+ Mascote v2.0: Erro na inicializa\xE7\xE3o:", err);
  });
})();
//# sourceMappingURL=content.js.map
