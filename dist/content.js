"use strict";
(() => {
  // src/utils/sigssPanelAdapter.ts
  var SigssPanelAdapter = class {
    /**
     * Detecta se a página aberta é o painel de chamadas
     */
    static isPanelPage() {
      const url = window.location.href;
      return url.includes("unique-panel/panel-screen") || url.includes("mock_panel.html") || document.title.toLowerCase().includes("painel") || !!document.querySelector(".called-patient, #current-patient, .panel-container") || this.hasCalledPatientHeuristic();
    }
    /**
     * Verifica por heurística se há indícios de um painel de chamadas ativo
     */
    static hasCalledPatientHeuristic() {
      const bodyText = document.body.innerText.toUpperCase();
      return bodyText.includes("CHAMANDO") || bodyText.includes("\xDALTIMAS CHAMADAS") || bodyText.includes("HIST\xD3RICO");
    }
    /**
     * Retorna os elementos do painel usando seletores diretos e heurísticas estruturais de segurança
     */
    static getElements() {
      const elements = {
        callingCard: document.querySelector('.calling-card, .chamando-card, .painel-chamando, [class*="chamando-card"]'),
        patientName: document.querySelector('#current-patient, .called-patient, .chamando-paciente, .paciente-chamado, [class*="called-patient"]'),
        localName: document.querySelector('#current-local, .called-local, .chamando-local, .sala-chamada, [class*="called-local"]'),
        professionalName: document.querySelector('#current-professional, .called-professional, .chamando-profissional, [class*="called-professional"]'),
        historySection: document.querySelector('.history-section, .ultimas-chamadas, aside.history, .painel-historico, [class*="history"]'),
        footerTicker: document.querySelector(".panel-footer, footer, .footer-ticker, .marquee-container, marquee")
      };
      if (!elements.callingCard) {
        const divs = Array.from(document.querySelectorAll("div, section"));
        let largestDiv = null;
        let largestArea = 0;
        divs.forEach((div) => {
          const rect = div.getBoundingClientRect();
          const area = rect.width * rect.height;
          if (rect.width > 200 && rect.height > 200 && rect.left < window.innerWidth * 0.75 && area > largestArea) {
            largestArea = area;
            largestDiv = div;
          }
        });
        elements.callingCard = largestDiv;
      }
      if (!elements.patientName && elements.callingCard) {
        elements.patientName = this.findLargeUppercaseTextIn(elements.callingCard, ["CHAMANDO", "PACIENTE", "-"]);
      } else if (!elements.patientName) {
        elements.patientName = this.findLargeUppercaseTextIn(document.body, ["CHAMANDO", "PACIENTE", "-"]);
      }
      if (!elements.localName && elements.callingCard) {
        const childElements = Array.from(elements.callingCard.querySelectorAll("span, div, h1, h2, h3, p"));
        for (const el of childElements) {
          const text = (el.textContent || "").trim().toUpperCase();
          if (text.includes("SALA") || text.includes("GUICHE") || text.includes("GUICH\xCA") || text.includes("CONSULTORIO") || text.includes("CONSULT\xD3RIO")) {
            elements.localName = el;
            break;
          }
        }
      }
      return elements;
    }
    /**
     * Helper que encontra elementos com textos em maiúsculo de grande tamanho
     */
    static findLargeUppercaseTextIn(root, excludeWords) {
      const childElements = Array.from(root.querySelectorAll("span, div, h1, h2, h3, p, td"));
      let bestMatch = null;
      let maxFontSize = 0;
      for (const el of childElements) {
        const text = (el.textContent || "").trim();
        if (text.length > 4 && /^[A-Z\s\u00C0-\u00FF]+$/.test(text) && text.includes(" ") && !excludeWords.some((w) => text.includes(w)) && !text.includes("PREFEITURA") && !text.includes("SECRETARIA") && !text.includes("SAUDE") && !text.includes("SA\xDADE") && !text.includes("BETIM")) {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize > maxFontSize) {
            maxFontSize = fontSize;
            bestMatch = el;
          }
        }
      }
      return bestMatch;
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
    // Fator de inércia para movimento suave
    // Ciclo de comportamento
    nextStateTime = 0;
    actionEndTime = 0;
    celebrationEndTime = 0;
    celebrationTargetX = 0;
    celebrationTargetY = 0;
    isCelebrating = false;
    // Dados de contexto das chamadas e histórico
    currentCalledPatient = "";
    lastAnnouncedHour = -1;
    pastPatients = [];
    // Nomes curtos das últimas pessoas chamadas
    // Callback de desenho
    onUpdateCallback = () => {
    };
    constructor() {
      this.resetToSafety();
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
      const elements = SigssPanelAdapter.getElements();
      if (elements.patientName) {
        const text = (elements.patientName.textContent || "").trim();
        if (text && text !== "-" && text !== this.currentCalledPatient && text.length > 2) {
          this.currentCalledPatient = text;
        }
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
     * Dispara a comemoração de chamada de paciente de forma imediata.
     * Adiciona o paciente ao histórico de chamadas recentes.
     */
    triggerCallReaction(patientName, local) {
      if (!this.config.callAwareness) return;
      this.currentCalledPatient = patientName;
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
      this.celebrationEndTime = Date.now() + 1e4;
      this.actionEndTime = 0;
      this.vy = this.jumpForce * 1.1;
      this.state = "JUMP";
      const dx = this.celebrationTargetX - (this.x + this.width / 2);
      this.direction = dx > 0 ? "RIGHT" : "LEFT";
      this.targetVx = (dx > 0 ? this.runSpeed : -this.runSpeed) * this.config.speedMultiplier;
      this.vx = this.targetVx * 0.8;
    }
    /**
     * Helper para formatar o nome completo em Nome + Sobrenome
     */
    getShortName(fullName) {
      if (!fullName) return "";
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length > 1) {
        const format = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        return `${format(nameParts[0])} ${format(nameParts[nameParts.length - 1])}`;
      }
      return fullName;
    }
    /**
     * Aplica física com aceleração e desaceleração linear
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
    // Biblioteca ampliada de falas humanizadas, calmas e referências ao criador
    normalSpeeches = [
      // Acolhimento
      "Ol\xE1! \u{1F60A} Enquanto aguarda, fique \xE0 vontade. Logo ser\xE1 sua vez!",
      "Obrigado pela paci\xEAncia! Cada atendimento \xE9 realizado com aten\xE7\xE3o e cuidado. \u{1F499}",
      "Seu atendimento \xE9 importante para n\xF3s. Obrigado por aguardar! \u{1FA7A}",
      "Respire fundo... Voc\xEA est\xE1 em um lugar preparado para cuidar da sua sa\xFAde. \u{1F33F}",
      "A equipe est\xE1 trabalhando para atender todos da melhor forma poss\xEDvel! \u{1F469}\u200D\u2695\uFE0F\u{1F468}\u200D\u2695\uFE0F",
      "Um pouquinho de paci\xEAncia faz toda a diferen\xE7a. Obrigado por esperar! \u{1F64F}",
      "Enquanto aguarda, aproveite para descansar um pouco. \u{1F60C}",
      "Cada paciente merece aten\xE7\xE3o. Por isso alguns atendimentos podem levar um pouco mais de tempo. \u{1F499}",
      "Seu bem-estar \xE9 nossa prioridade! \u{1F3E5}",
      "Logo seu nome aparecer\xE1 na tela. Fique atento! \u{1F440}",
      // Dicas de Saúde
      "J\xE1 bebeu \xE1gua hoje? Seu corpo agradece! \u{1F4A7}",
      "Se estiver sentado h\xE1 muito tempo, movimente um pouco as pernas. \u{1F6B6}",
      "Lembre-se de manter sua vacina\xE7\xE3o em dia! \u{1F489}",
      "Lavar bem as m\xE3os continua sendo uma das melhores formas de prevenir doen\xE7as. \u{1F9FC}",
      "Dormir bem ajuda seu organismo a funcionar melhor. \u{1F634}",
      "Frutas, verduras e legumes fazem bem para sua sa\xFAde. \u{1F957}",
      "Evite o excesso de a\xE7\xFAcar e alimentos ultraprocessados. \u{1F34E}",
      "Se tossir ou espirrar, cubra o nariz e a boca com o cotovelo. \u{1F927}",
      "Praticar atividades f\xEDsicas regularmente faz muito bem ao cora\xE7\xE3o. \u2764\uFE0F",
      "N\xE3o se esque\xE7a de tomar seus medicamentos conforme orienta\xE7\xE3o m\xE9dica. \u{1F48A}",
      // Curiosidades
      "Voc\xEA sabia? O SUS \xE9 o maior sistema p\xFAblico de sa\xFAde gratuito do mundo! \u{1F1E7}\u{1F1F7}",
      "O cora\xE7\xE3o bate cerca de 100 mil vezes por dia. \u2764\uFE0F",
      "Beber \xE1gua ajuda at\xE9 na concentra\xE7\xE3o! \u{1F4A7}",
      "Seu corpo possui mais de 600 m\xFAsculos! \u{1F4AA}",
      "Sorrir pode melhorar o humor. \u{1F604}",
      "O c\xE9rebro continua trabalhando at\xE9 enquanto voc\xEA dorme. \u{1F9E0}",
      "Pequenos h\xE1bitos saud\xE1veis fazem grande diferen\xE7a ao longo dos anos. \u{1F331}",
      // Sobre o Mascote
      "Enquanto voc\xEAs aguardam, eu fico passeando por aqui! \u{1F43E}",
      "Prometo avisar quando encontrar um rato de computador! \u{1F42D}",
      "Ser\xE1 que algu\xE9m est\xE1 olhando para mim agora? \u{1F440}",
      "Ainda bem que n\xE3o preciso tomar vacina... \u{1F605}",
      "Estou de plant\xE3o junto com a equipe! \u{1F691}",
      "Meu trabalho \xE9 deixar a espera um pouquinho mais divertida. \u{1F638}",
      "Voc\xEAs esperam atendimento... eu espero um carinho virtual. \u{1F979}",
      "Ainda estou aprendendo a miar em c\xF3digo bin\xE1rio. \u{1F916}",
      "N\xE3o contem para ningu\xE9m, mas adoro aparecer na tela. \u2728",
      "\xC0s vezes finjo que estou trabalhando... mas estou s\xF3 caminhando mesmo. \u{1F6B6}\u200D\u2642\uFE0F",
      // Easter Eggs
      "Sabia que fui programado pelo Guilherme Paicheco Ferreira? \u{1F4BB}",
      "O Guilherme passou algumas horas me ensinando a conversar com voc\xEAs. \u{1F604}",
      "Miau! O Guilherme me deu vida para passear por este painel. \u{1F43E}",
      "Se gostou de mim, agrade\xE7a ao Guilherme! \u{1F916}",
      "Processando... Desenvolvedor identificado: Guilherme Paicheco Ferreira. \u2714\uFE0F"
    ];
    // Piadas e brincadeiras com os nomes de pessoas que já passaram (Humor de sala de espera)
    pastPatientJokes = [
      "Ser\xE1 que o(a) {name} j\xE1 saiu da consulta ou ficou batendo papo? \u{1F914}",
      "Espero que o(a) {name} n\xE3o tenha chorado na hora de tomar a vacina! \u{1F489}",
      "Quem a\xED conhece o(a) {name}? Passou por aqui correndo! \u{1F3C3}\u200D\u2642\uFE0F",
      "L\xE1 se foi o(a) {name}... Tomara que tenha ganhado pirulito no final! \u{1F36D}",
      "Ih, ser\xE1 que o(a) {name} esqueceu a receita? Ah n\xE3o, t\xE1 na m\xE3o! \u{1F4C4}",
      "O(A) {name} entrou no consult\xF3rio e a fila finalmente andou! \u{1F4C8}",
      "Se o(a) {name} correr bem r\xE1pido, o rem\xE9dio no posto ainda t\xE1 aberto! \u{1F3C1}",
      "Desejo uma boa recupera\xE7\xE3o para o(a) {name}, de cora\xE7\xE3o! \u{1F499}"
    ];
    tripSpeeches = [
      "Ops! Acho que tropecei num pixel! \u{1F635}",
      "Quem colocou esse degrau aqui? \u{1F915}",
      "A\xED! Essa doeu nos meus circuitos! \u{1F916}",
      "Escorreguei... mas foi de prop\xF3sito! \u{1F605}",
      "Prometo que sei andar melhor que isso. \u{1F43E}",
      "Ainda bem que ningu\xE9m filmou! \u{1F4F9}",
      "Tropecei no rodap\xE9 da tela. \u{1F602}",
      "Meu equil\xEDbrio precisa de atualiza\xE7\xE3o. \u{1F504}",
      "Quase ca\xED... ufa! \u{1F62E}\u200D\u{1F4A8}",
      "Tudo certo! Continuando a patrulha. \u{1FAE1}"
    ];
    stretchSpeeches = [
      "Hora de alongar as patinhas! \u{1F43E}",
      "Ui... ficar andando o dia inteiro cansa! \u{1F634}",
      "Esticando os circuitos... \u2699\uFE0F",
      "Alongamento conclu\xEDdo! Pronto para continuar. \u{1F604}",
      "Nada melhor que uma boa espregui\xE7ada! \u{1F9D8}",
      "At\xE9 mascote precisa descansar um pouquinho. \u{1F60A}",
      "Pronto! Energia renovada. \u26A1",
      "Ahhh... agora sim! \u{1F60C}",
      "Bora continuar o expediente! \u{1F499}",
      "Se eu alongo, voc\xEA tamb\xE9m pode alongar! \u{1F6B6}"
    ];
    constructor(engine) {
      this.engine = engine;
      this.injectStyles();
      this.createMascotElements();
      this.setSkin("gotinha");
      this.lastTipTime = Date.now() - 25e3;
    }
    destroy() {
      if (this.containerEl && this.containerEl.parentNode) {
        this.containerEl.parentNode.removeChild(this.containerEl);
      }
    }
    setSkin(skin) {
      this.currentSkin = skin;
      this.updateSVG();
    }
    /**
     * Renderiza dinamicamente o SVG apropriado para a Skin e o Estado físico atual
     */
    updateSVG() {
      if (!this.spriteEl) return;
      const state = this.engine.state;
      if (this.currentSkin === "gotinha") {
        this.spriteEl.innerHTML = this.getGotinhaSVG(state);
      } else if (this.currentSkin.startsWith("robozinho_")) {
        const color = this.currentSkin.split("_")[1];
        this.spriteEl.innerHTML = this.getRobozinhoSVG(state, color);
      } else if (this.currentSkin.startsWith("gatinho_")) {
        const color = this.currentSkin.split("_")[1];
        this.spriteEl.innerHTML = this.getGatinhoSVG(state, color);
      }
    }
    render() {
      if (!this.containerEl || !this.spriteEl || !this.balloonEl) return;
      const config = this.engine.getConfig();
      this.containerEl.style.left = `${this.engine.x}px`;
      this.containerEl.style.top = `${this.engine.y}px`;
      this.containerEl.style.width = `${this.engine.width}px`;
      this.containerEl.style.height = `${this.engine.height}px`;
      this.containerEl.style.opacity = `${config.opacity}`;
      this.updateSVG();
      this.spriteEl.className = `sigss-mascot-sprite sigss-skin-${this.currentSkin} state-${this.engine.state.toLowerCase()} dir-${this.engine.direction.toLowerCase()}`;
      this.updateBalloon(config.callAwareness);
    }
    /**
     * Controla a exibição de balões, integrando brincadeiras com pacientes passados
     */
    updateBalloon(callAwareness) {
      if (!this.balloonEl) return;
      const now = Date.now();
      if (this.engine.state === "CELEBRATE" || this.engine.state === "RUN" && this.engine.isCelebrating && callAwareness) {
        let patientGreet = "\u{1F4E2} Nova chamada!";
        if (this.engine.currentCalledPatient && this.engine.currentCalledPatient !== "-") {
          const nameParts = this.engine.currentCalledPatient.split(/\s+/);
          const format = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
          const shortName = nameParts.length > 1 ? `${format(nameParts[0])} ${format(nameParts[nameParts.length - 1])}` : format(nameParts[0]);
          patientGreet = `\u2728 Boa consulta, ${shortName}! \u{1F340}`;
        }
        this.setBalloonText(patientGreet, true);
        return;
      }
      if (this.engine.state === "SLEEP") {
        const sleepWords = ["Zzz...", "*Sonhando com vacinas...*", "Mais 5 minutinhos... \u{1F4A4}", "Recarregando as baterias... \u{1F50B}"];
        const index = Math.floor(now / 4e3 % sleepWords.length);
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
        if (timeSinceLastTip > 45e3) {
          let chosenSpeech = "";
          if (this.engine.pastPatients.length > 0 && Math.random() < 0.4) {
            const pastName = this.engine.pastPatients[Math.floor(Math.random() * this.engine.pastPatients.length)];
            const jokeTemplate = this.pastPatientJokes[Math.floor(Math.random() * this.pastPatientJokes.length)];
            chosenSpeech = jokeTemplate.replace("{name}", pastName);
          } else {
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
          }
          this.setBalloonText(chosenSpeech, false);
          this.lastTipTime = now;
        } else if (timeSinceLastTip > 7500 && this.balloonEl.classList.contains("visible") && !this.balloonEl.classList.contains("important-balloon")) {
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

      .sigss-mascot-sprite.dir-left {
        transform: scaleX(-1);
      }

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

      /* ANIMA\xC7\xD5ES */
      .state-idle svg {
        animation: mascotBreath 1.8s ease-in-out infinite;
      }

      @keyframes mascotBreath {
        0%, 100% { transform: translateY(0) scaleY(1); }
        50% { transform: translateY(1.5px) scaleY(0.95) scaleX(1.03); }
      }

      .state-walk svg {
        animation: mascotWalk 0.55s ease-in-out infinite;
      }

      @keyframes mascotWalk {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-4px) rotate(-5deg); }
        50% { transform: translateY(0) rotate(0deg); }
        75% { transform: translateY(-4px) rotate(5deg); }
      }

      .state-run svg {
        animation: mascotRun 0.3s linear infinite;
      }

      @keyframes mascotRun {
        0%, 100% { transform: translateY(0) scaleY(1) rotate(-3deg); }
        50% { transform: translateY(-6px) scaleY(0.88) rotate(6deg); }
      }

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

      .state-jump svg {
        transform: scaleY(1.18) scaleX(0.85);
      }

      .state-fall svg {
        transform: scaleY(0.85) scaleX(1.15);
      }

      .state-climb svg {
        animation: mascotClimb 0.45s linear infinite;
      }

      @keyframes mascotClimb {
        0%, 100% { transform: translateY(0) scaleX(1) scaleY(1); }
        50% { transform: translateY(-3px) scaleX(0.9) scaleY(1.1); }
      }

      .state-celebrate svg {
        animation: mascotCelebrate 0.45s ease-in-out infinite;
      }

      @keyframes mascotCelebrate {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-16px) rotate(180deg) scale(1.1); }
        100% { transform: translateY(0) rotate(360deg); }
      }

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
    // VETORES SVG DINÂMICOS
    // ==========================================================================
    getGotinhaSVG(state) {
      let eyes = "";
      let mouth = "";
      if (state === "SLEEP") {
        eyes = `
        <path d="M21 34 Q24 37 27 34" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M37 34 Q40 37 43 34" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
        mouth = `<path d="M30 39h4" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>`;
      } else if (state === "TRIP") {
        eyes = `
        <path d="M22 31l5 5M27 31l-5 5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M37 31l5 5M42 31l-5 5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
      `;
        mouth = `<path d="M29 39.5c1-1.5 2-1.5 3 0s2 1.5 3 0" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>`;
      } else if (state === "CELEBRATE") {
        eyes = `
        <path d="M21 34l3-3.5l3 3.5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M37 34l3-3.5l3 3.5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
        mouth = `
        <path d="M28 37.5c1 4 7 4 8 0Z" fill="#ef4444" stroke="#1e293b" stroke-width="1.5"/>
        <path d="M29 38h6" stroke="#ffffff" stroke-width="1"/>
      `;
      } else if (state === "STRETCH") {
        eyes = `
        <path d="M21 31l5 3l-5 3" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M43 31l-5 3l5 3" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
        mouth = `<circle cx="32" cy="38" r="2" fill="#1e293b"/>`;
      } else {
        eyes = `
        <circle cx="25" cy="33" r="3.5" fill="#1e293b"/>
        <circle cx="39" cy="33" r="3.5" fill="#1e293b"/>
        <circle cx="26.5" cy="31.5" r="1.2" fill="#ffffff"/>
        <circle cx="40.5" cy="31.5" r="1.2" fill="#ffffff"/>
      `;
        mouth = `<path d="M29 37.5C29.5 39 34.5 39 35 37.5" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>`;
      }
      return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="22" cy="58" rx="7" ry="4" fill="#3b82f6"/>
        <ellipse cx="42" cy="58" rx="7" ry="4" fill="#3b82f6"/>
        <path d="M22 52V58M42 52V58" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
        <path d="M32 4C32 4 12 30 12 42C12 52.5 21 57 32 57C43 57 52 52.5 52 42C52 30 32 4 32 4Z" fill="#ffffff" stroke="#3b82f6" stroke-width="3"/>
        <path d="M16 43.5C21 47 43 47 48 43.5C48 43.5 45 54 32 54C19 54 16 43.5 16 43.5Z" fill="#60a5fa" opacity="0.85"/>
        <rect x="30" y="47" width="4" height="6" fill="#2563eb" rx="1"/>
        <rect x="29" y="49" width="6" height="2" fill="#2563eb" rx="1"/>
        ${eyes}
        <ellipse cx="20" cy="36.5" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.6"/>
        <ellipse cx="44" cy="36.5" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.6"/>
        ${mouth}
        <path d="M13 38C8 36 6 32 6 32" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        <path d="M51 38C56 36 58 32 58 32" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
    }
    getRobozinhoSVG(state, color) {
      let ledEyes = "";
      let baseColor = "#e2e8f0";
      let strokeColor = "#64748b";
      let pulseColor = "#ef4444";
      let ledColor = "#38bdf8";
      if (color === "rosa") {
        baseColor = "#fce7f3";
        strokeColor = "#db2777";
        pulseColor = "#db2777";
        ledColor = "#f43f5e";
      } else if (color === "verde") {
        baseColor = "#d1fae5";
        strokeColor = "#059669";
        pulseColor = "#ef4444";
        ledColor = "#10b981";
      }
      if (state === "SLEEP") {
        ledEyes = `
        <line x1="23" y1="25" x2="28" y2="25" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round"/>
        <line x1="36" y1="25" x2="41" y2="25" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round"/>
      `;
      } else if (state === "TRIP") {
        ledEyes = `
        <path d="M23 22l4 4M27 22l-4 4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
        <path d="M37 22l4 4M41 22l-4 4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      `;
      } else if (state === "CELEBRATE") {
        ledEyes = `
        <path d="M22 23.5c.3-1 .8-1 1 0l1 1.5l1-1.5c.2-1 .7-1 1 0v.5l-2.5 3.5l-2.5-3.5v-.5Z" fill="#ef4444"/>
        <path d="M36 23.5c.3-1 .8-1 1 0l1 1.5l1-1.5c.2-1 .7-1 1 0v.5l-2.5 3.5l-2.5-3.5v-.5Z" fill="#ef4444"/>
      `;
      } else if (state === "STRETCH") {
        ledEyes = `
        <path d="M23 26l2.5-3.5l2.5 3.5" stroke="${ledColor}" stroke-width="2" fill="none"/>
        <path d="M36 26l2.5-3.5l2.5 3.5" stroke="${ledColor}" stroke-width="2" fill="none"/>
      `;
      } else {
        ledEyes = `
        <rect x="24" y="23" width="4" height="5" rx="1.5" fill="${ledColor}"/>
        <rect x="36" y="23" width="4" height="5" rx="1.5" fill="${ledColor}"/>
      `;
      }
      return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 58C32 58 27 50 32 46C37 50 32 58 32 58Z" fill="#ff7e00" opacity="0.8"/>
        <path d="M32 56C32 56 29 51 32 48C35 51 32 56 32 56Z" fill="#ffb800"/>
        <line x1="32" y1="12" x2="32" y2="4" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="4" r="3" fill="#3b82f6" stroke="#93c5fd" stroke-width="1"/>
        <rect x="14" y="12" width="36" height="34" rx="18" fill="${baseColor}" stroke="${strokeColor}" stroke-width="3"/>
        <rect x="20" y="18" width="24" height="15" rx="5" fill="#0f172a"/>
        ${ledEyes}
        <path d="M28 41H31.5L32.5 37L33.5 44L34.5 41H36" stroke="${pulseColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 28C7 28 6 34 6 34" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round"/>
        <path d="M52 28C57 28 58 34 58 34" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
    }
    getGatinhoSVG(state, color) {
      let eyes = "";
      let mouth = "";
      let baseColor = "#f59e0b";
      let detailColor = "#d97706";
      let chestColor = "#fbbf24";
      let innerEarColor = "#fca5a5";
      if (color === "cinza") {
        baseColor = "#94a3b8";
        detailColor = "#475569";
        chestColor = "#cbd5e1";
      } else if (color === "preto") {
        baseColor = "#1e293b";
        detailColor = "#0f172a";
        chestColor = "#ffffff";
      }
      if (state === "SLEEP") {
        eyes = `
        <path d="M19 35 Q21 38 23 35" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M31 35 Q33 38 35 35" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
      `;
        mouth = `<path d="M26 38 Q27 38.5 28 38" stroke="#1e293b" stroke-width="1.2" stroke-linecap="round"/>`;
      } else if (state === "TRIP") {
        eyes = `
        <path d="M19 32l3 3m0-3l-3 3" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <path d="M31 32l3 3m0-3l-3 3" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
      `;
        mouth = `<path d="M25 38.5c1-1 3-1 4 0" stroke="#1e293b" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
      } else if (state === "CELEBRATE") {
        eyes = `
        <circle cx="21" cy="34" r="3.8" fill="#1e293b"/>
        <circle cx="33" cy="34" r="3.8" fill="#1e293b"/>
        <circle cx="22.5" cy="32.5" r="1.5" fill="#ffffff"/>
        <circle cx="34.5" cy="32.5" r="1.5" fill="#ffffff"/>
        <circle cx="19.5" cy="35.5" r="0.8" fill="#ffffff"/>
        <circle cx="31.5" cy="35.5" r="0.8" fill="#ffffff"/>
      `;
        mouth = `<path d="M24 38c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5" fill="#ef4444" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>`;
      } else if (state === "STRETCH") {
        eyes = `
        <path d="M19 32l4 2.5l-4 2.5" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M35 32l-4 2.5l4 2.5" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      `;
        mouth = `<circle cx="27" cy="38" r="1.5" fill="#1e293b"/>`;
      } else {
        eyes = `
        <circle cx="21" cy="34" r="3.2" fill="#1e293b"/>
        <circle cx="33" cy="34" r="3.2" fill="#1e293b"/>
        <circle cx="22" cy="32.8" r="1" fill="#ffffff"/>
        <circle cx="34" cy="32.8" r="1" fill="#ffffff"/>
      `;
        mouth = `<path d="M25 39C25.5 39.8 27 39.8 27 39M27 39C27 39.8 28.5 39.8 29 39" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>`;
      }
      return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M48 48C52 48 56 44 56 38C56 32 53 30 50 30" stroke="${detailColor}" stroke-width="4.5" stroke-linecap="round"/>
        <rect x="18" y="52" width="6" height="8" rx="2" fill="${detailColor}"/>
        <rect x="27" y="52" width="6" height="8" rx="2" fill="${detailColor}"/>
        <rect x="36" y="52" width="6" height="8" rx="2" fill="${detailColor}"/>
        <rect x="12" y="24" width="34" height="30" rx="12" fill="${baseColor}" stroke="${detailColor}" stroke-width="2.5"/>
        <rect x="16" y="28" width="26" height="22" rx="8" fill="${chestColor}"/>
        <path d="M16 25L10 12L22 23Z" fill="${detailColor}"/>
        <path d="M38 25L44 12L32 23Z" fill="${detailColor}"/>
        <path d="M16 23L13 16L20 22Z" fill="${innerEarColor}"/>
        <path d="M38 23L41 16L34 22Z" fill="${innerEarColor}"/>
        ${eyes}
        <path d="M26 37.5L27 36L28 37.5" stroke="${detailColor}" stroke-width="1.5" stroke-linecap="round"/>
        ${mouth}
        <line x1="8" y1="36" x2="16" y2="37" stroke="${detailColor}" stroke-width="1.5"/>
        <line x1="8" y1="39" x2="16" y2="39" stroke="${detailColor}" stroke-width="1.5"/>
        <line x1="46" y1="36" x2="38" y2="37" stroke="${detailColor}" stroke-width="1.5"/>
        <line x1="46" y1="39" x2="38" y2="39" stroke="${detailColor}" stroke-width="1.5"/>
      </svg>
    `;
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
    mascots = [];
    isRunning = false;
    observer = null;
    lastCalledPatient = "";
    async init() {
      if (!SigssPanelAdapter.isPanelPage()) {
        console.log("Painel SIGSS+ Mascote: P\xE1gina atual n\xE3o identificada como painel de chamadas.");
        return;
      }
      console.log("Painel SIGSS+ Mascote: Inicializando na p\xE1gina...");
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
          console.log(`Painel SIGSS+ Mascote: Elementos detectados. Iniciando motor...`);
          await this.start();
        }
      }, 500);
    }
    /**
     * Inicia a quantidade configurada de mascotes na tela
     */
    async start() {
      if (this.isRunning) return;
      const settings = await MascotConfigManager.load();
      if (!settings.mascotEnabled) {
        console.log("Painel SIGSS+ Mascote: Extens\xE3o desativada nas configura\xE7\xF5es.");
        return;
      }
      this.isRunning = true;
      this.mascots = [];
      const count = settings.mascotCount || 1;
      console.log(`Painel SIGSS+ Mascote: Spawnando ${count} mascote(s)...`);
      const skinsList = [
        "gotinha",
        "gatinho_laranja",
        "gatinho_cinza",
        "gatinho_preto",
        "robozinho_azul",
        "robozinho_rosa",
        "robozinho_verde"
      ];
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
        let activeSkin = "gotinha";
        if (settings.mascotSkin === "mixed") {
          activeSkin = skinsList[i % skinsList.length];
        } else {
          activeSkin = settings.mascotSkin;
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
    /**
     * Finaliza todos os motores e limpa os elementos visuais
     */
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
      console.log("Painel SIGSS+ Mascote: Motores parados e todos os mascotes removidos.");
    }
    /**
     * Game Loop unificado para todos os mascotes
     */
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
          console.log(`Painel SIGSS+ Mascote: Nova chamada detectada via MutationObserver: ${currentText}`);
          this.lastCalledPatient = currentText;
          const local = elements.localName?.textContent || "";
          this.mascots.forEach((m) => {
            m.engine.triggerCallReaction(currentText, local);
          });
        }
      });
      this.observer.observe(document.body, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }
    /**
     * Reinicia ou atualiza configurações em tempo real
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
          return;
        }
        if (!this.isRunning) return;
        const hasStructureChanges = changes.mascotCount || changes.mascotSkin;
        if (hasStructureChanges) {
          console.log("Painel SIGSS+ Mascote: Altera\xE7\xF5es estruturais salvas. Reiniciando mascotes...");
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
    console.error("Painel SIGSS+ Mascote: Falha na inicializa\xE7\xE3o do Core:", err);
  });
})();
//# sourceMappingURL=content.js.map
