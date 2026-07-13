import { MascotEngine, MascotState, MascotDirection } from './MascotEngine';

export type MascotSkinType = 
  | 'gotinha' 
  | 'robozinho_azul' 
  | 'robozinho_rosa' 
  | 'robozinho_verde' 
  | 'gatinho_laranja' 
  | 'gatinho_cinza' 
  | 'gatinho_preto' 
  | 'mixed';

export class MascotRenderer {
  private containerEl: HTMLDivElement | null = null;
  private spriteEl: HTMLDivElement | null = null;
  private balloonEl: HTMLDivElement | null = null;
  private engine: MascotEngine;
  private currentSkin: MascotSkinType = 'gotinha';
  private lastTipTime = 0;
  private activeBubbleContent = '';

  // Biblioteca ampliada de falas humanizadas, calmas e referências ao criador
  private normalSpeeches = [
    // Acolhimento
    "Olá! 😊 Enquanto aguarda, fique à vontade. Logo será sua vez!",
    "Obrigado pela paciência! Cada atendimento é realizado com atenção e cuidado. 💙",
    "Seu atendimento é importante para nós. Obrigado por aguardar! 🩺",
    "Respire fundo... Você está em um lugar preparado para cuidar da sua saúde. 🌿",
    "A equipe está trabalhando para atender todos da melhor forma possível! 👩‍⚕️👨‍⚕️",
    "Um pouquinho de paciência faz toda a diferença. Obrigado por esperar! 🙏",
    "Enquanto aguarda, aproveite para descansar um pouco. 😌",
    "Cada paciente merece atenção. Por isso alguns atendimentos podem levar um pouco mais de tempo. 💙",
    "Seu bem-estar é nossa prioridade! 🏥",
    "Logo seu nome aparecerá na tela. Fique atento! 👀",

    // Dicas de Saúde
    "Já bebeu água hoje? Seu corpo agradece! 💧",
    "Se estiver sentado há muito tempo, movimente um pouco as pernas. 🚶",
    "Lembre-se de manter sua vacinação em dia! 💉",
    "Lavar bem as mãos continua sendo uma das melhores formas de prevenir doenças. 🧼",
    "Dormir bem ajuda seu organismo a funcionar melhor. 😴",
    "Frutas, verduras e legumes fazem bem para sua saúde. 🥗",
    "Evite o excesso de açúcar e alimentos ultraprocessados. 🍎",
    "Se tossir ou espirrar, cubra o nariz e a boca com o cotovelo. 🤧",
    "Praticar atividades físicas regularmente faz muito bem ao coração. ❤️",
    "Não se esqueça de tomar seus medicamentos conforme orientação médica. 💊",

    // Curiosidades
    "Você sabia? O SUS é o maior sistema público de saúde gratuito do mundo! 🇧🇷",
    "O coração bate cerca de 100 mil vezes por dia. ❤️",
    "Beber água ajuda até na concentração! 💧",
    "Seu corpo possui mais de 600 músculos! 💪",
    "Sorrir pode melhorar o humor. 😄",
    "O cérebro continua trabalhando até enquanto você dorme. 🧠",
    "Pequenos hábitos saudáveis fazem grande diferença ao longo dos anos. 🌱",

    // Sobre o Mascote
    "Enquanto vocês aguardam, eu fico passeando por aqui! 🐾",
    "Prometo avisar quando encontrar um rato de computador! 🐭",
    "Será que alguém está olhando para mim agora? 👀",
    "Ainda bem que não preciso tomar vacina... 😅",
    "Estou de plantão junto com a equipe! 🚑",
    "Meu trabalho é deixar a espera um pouquinho mais divertida. 😸",
    "Vocês esperam atendimento... eu espero um carinho virtual. 🥹",
    "Ainda estou aprendendo a miar em código binário. 🤖",
    "Não contem para ninguém, mas adoro aparecer na tela. ✨",
    "Às vezes finjo que estou trabalhando... mas estou só caminhando mesmo. 🚶‍♂️",

    // Easter Eggs
    "Sabia que fui programado pelo Guilherme Paicheco Ferreira? 💻",
    "O Guilherme passou algumas horas me ensinando a conversar com vocês. 😄",
    "Miau! O Guilherme me deu vida para passear por este painel. 🐾",
    "Se gostou de mim, agradeça ao Guilherme! 🤖",
    "Processando... Desenvolvedor identificado: Guilherme Paicheco Ferreira. ✔️"
  ];

  // Piadas e brincadeiras com os nomes de pessoas que já passaram (Humor de sala de espera)
  private pastPatientJokes = [
    "Será que o(a) {name} já saiu da consulta ou ficou batendo papo? 🤔",
    "Espero que o(a) {name} não tenha chorado na hora de tomar a vacina! 💉",
    "Quem aí conhece o(a) {name}? Passou por aqui correndo! 🏃‍♂️",
    "Lá se foi o(a) {name}... Tomara que tenha ganhado pirulito no final! 🍭",
    "Ih, será que o(a) {name} esqueceu a receita? Ah não, tá na mão! 📄",
    "O(A) {name} entrou no consultório e a fila finalmente andou! 📈",
    "Se o(a) {name} correr bem rápido, o remédio no posto ainda tá aberto! 🏁",
    "Desejo uma boa recuperação para o(a) {name}, de coração! 💙"
  ];

  private tripSpeeches = [
    "Ops! Acho que tropecei num pixel! 😵",
    "Quem colocou esse degrau aqui? 🤕",
    "Aí! Essa doeu nos meus circuitos! 🤖",
    "Escorreguei... mas foi de propósito! 😅",
    "Prometo que sei andar melhor que isso. 🐾",
    "Ainda bem que ninguém filmou! 📹",
    "Tropecei no rodapé da tela. 😂",
    "Meu equilíbrio precisa de atualização. 🔄",
    "Quase caí... ufa! 😮‍💨",
    "Tudo certo! Continuando a patrulha. 🫡"
  ];

  private stretchSpeeches = [
    "Hora de alongar as patinhas! 🐾",
    "Ui... ficar andando o dia inteiro cansa! 😴",
    "Esticando os circuitos... ⚙️",
    "Alongamento concluído! Pronto para continuar. 😄",
    "Nada melhor que uma boa espreguiçada! 🧘",
    "Até mascote precisa descansar um pouquinho. 😊",
    "Pronto! Energia renovada. ⚡",
    "Ahhh... agora sim! 😌",
    "Bora continuar o expediente! 💙",
    "Se eu alongo, você também pode alongar! 🚶"
  ];

  constructor(engine: MascotEngine) {
    this.engine = engine;
    this.injectStyles();
    this.createMascotElements();
    this.setSkin('gotinha');
    this.lastTipTime = Date.now() - 25000;
  }

  public destroy() {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
    }
  }

  public setSkin(skin: MascotSkinType) {
    this.currentSkin = skin;
    this.updateSVG();
  }

  /**
   * Renderiza dinamicamente o SVG apropriado para a Skin e o Estado físico atual
   */
  private updateSVG() {
    if (!this.spriteEl) return;

    const state = this.engine.state;
    if (this.currentSkin === 'gotinha') {
      this.spriteEl.innerHTML = this.getGotinhaSVG(state);
    } 
    else if (this.currentSkin.startsWith('robozinho_')) {
      const color = this.currentSkin.split('_')[1]; // azul, rosa, verde
      this.spriteEl.innerHTML = this.getRobozinhoSVG(state, color);
    } 
    else if (this.currentSkin.startsWith('gatinho_')) {
      const color = this.currentSkin.split('_')[1]; // laranja, cinza, preto
      this.spriteEl.innerHTML = this.getGatinhoSVG(state, color);
    }
  }

  public render() {
    if (!this.containerEl || !this.spriteEl || !this.balloonEl) return;

    const config = this.engine.getConfig();

    this.containerEl.style.left = `${this.engine.x}px`;
    this.containerEl.style.top = `${this.engine.y}px`;
    this.containerEl.style.width = `${this.engine.width}px`;
    this.containerEl.style.height = `${this.engine.height}px`;
    this.containerEl.style.opacity = `${config.opacity}`;

    // Atualizar face no SVG de acordo com estado físico (sono, comemoração, batida)
    this.updateSVG();

    this.spriteEl.className = `sigss-mascot-sprite sigss-skin-${this.currentSkin} state-${this.engine.state.toLowerCase()} dir-${this.engine.direction.toLowerCase()}`;

    this.updateBalloon(config.callAwareness);
  }

  /**
   * Controla a exibição de balões, integrando brincadeiras com pacientes passados
   */
  private updateBalloon(callAwareness: boolean) {
    if (!this.balloonEl) return;

    const now = Date.now();

    // 1. Reação a chamada
    if (this.engine.state === 'CELEBRATE' || (this.engine.state === 'RUN' && this.engine.isCelebrating && callAwareness)) {
      let patientGreet = "📢 Nova chamada!";
      if (this.engine.currentCalledPatient && this.engine.currentCalledPatient !== '-') {
        // Encurtar nome completo
        const nameParts = this.engine.currentCalledPatient.split(/\s+/);
        const format = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        const shortName = nameParts.length > 1 ? `${format(nameParts[0])} ${format(nameParts[nameParts.length - 1])}` : format(nameParts[0]);
        patientGreet = `✨ Boa consulta, ${shortName}! 🍀`;
      }
      this.setBalloonText(patientGreet, true);
      return;
    }

    // 2. Dormindo
    if (this.engine.state === 'SLEEP') {
      const sleepWords = ["Zzz...", "*Sonhando com vacinas...*", "Mais 5 minutinhos... 💤", "Recarregando as baterias... 🔋"];
      const index = Math.floor((now / 4000) % sleepWords.length);
      this.setBalloonText(sleepWords[index], false);
      return;
    }

    // 3. Tropeçou
    if (this.engine.state === 'TRIP') {
      if (!this.balloonEl.classList.contains('visible') || this.activeBubbleContent === '') {
        const randTrip = this.tripSpeeches[Math.floor(Math.random() * this.tripSpeeches.length)];
        this.setBalloonText(randTrip, false);
      }
      return;
    }

    // 4. Alongando
    if (this.engine.state === 'STRETCH') {
      if (!this.balloonEl.classList.contains('visible') || this.activeBubbleContent === '') {
        const randStretch = this.stretchSpeeches[Math.floor(Math.random() * this.stretchSpeeches.length)];
        this.setBalloonText(randStretch, false);
      }
      return;
    }

    // 5. Falas normais e piadas com pacientes do histórico (A cada 45 segundos)
    if (this.engine.state === 'IDLE' || this.engine.state === 'WALK') {
      const timeSinceLastTip = now - this.lastTipTime;
      
      if (timeSinceLastTip > 45000) {
        let chosenSpeech = '';

        // Se houver histórico de pacientes passados, temos 40% de chance de brincar com um deles
        if (this.engine.pastPatients.length > 0 && Math.random() < 0.40) {
          const pastName = this.engine.pastPatients[Math.floor(Math.random() * this.engine.pastPatients.length)];
          const jokeTemplate = this.pastPatientJokes[Math.floor(Math.random() * this.pastPatientJokes.length)];
          chosenSpeech = jokeTemplate.replace('{name}', pastName);
        } else {
          // Relógio do cabeçalho
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
            chosenSpeech = this.normalSpeeches[Math.floor(Math.random() * this.normalSpeeches.length)];
          }
        }

        this.setBalloonText(chosenSpeech, false);
        this.lastTipTime = now;
      } 
      else if (timeSinceLastTip > 7500 && this.balloonEl.classList.contains('visible') && !this.balloonEl.classList.contains('important-balloon')) {
        this.balloonEl.classList.remove('visible');
        this.activeBubbleContent = '';
      }
    } else {
      if (!this.balloonEl.classList.contains('important-balloon')) {
        this.balloonEl.classList.remove('visible');
        this.activeBubbleContent = '';
      }
    }
  }

  private setBalloonText(text: string, isImportant: boolean) {
    if (!this.balloonEl) return;
    if (this.activeBubbleContent === text) return;
    
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

      /* ANIMAÇÕES */
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

  private getGotinhaSVG(state: MascotState): string {
    let eyes = '';
    let mouth = '';

    if (state === 'SLEEP') {
      eyes = `
        <path d="M21 34 Q24 37 27 34" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M37 34 Q40 37 43 34" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
      mouth = `<path d="M30 39h4" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>`;
    } 
    else if (state === 'TRIP') {
      eyes = `
        <path d="M22 31l5 5M27 31l-5 5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M37 31l5 5M42 31l-5 5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
      `;
      mouth = `<path d="M29 39.5c1-1.5 2-1.5 3 0s2 1.5 3 0" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    }
    else if (state === 'CELEBRATE') {
      eyes = `
        <path d="M21 34l3-3.5l3 3.5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M37 34l3-3.5l3 3.5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
      mouth = `
        <path d="M28 37.5c1 4 7 4 8 0Z" fill="#ef4444" stroke="#1e293b" stroke-width="1.5"/>
        <path d="M29 38h6" stroke="#ffffff" stroke-width="1"/>
      `;
    }
    else if (state === 'STRETCH') {
      eyes = `
        <path d="M21 31l5 3l-5 3" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M43 31l-5 3l5 3" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
      mouth = `<circle cx="32" cy="38" r="2" fill="#1e293b"/>`;
    }
    else {
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

  private getRobozinhoSVG(state: MascotState, color: string): string {
    let ledEyes = '';
    
    // Configurações de cores da carcaça do robô
    let baseColor = "#e2e8f0"; // Azul default
    let strokeColor = "#64748b";
    let pulseColor = "#ef4444";
    let ledColor = "#38bdf8";

    if (color === 'rosa') {
      baseColor = "#fce7f3";
      strokeColor = "#db2777";
      pulseColor = "#db2777";
      ledColor = "#f43f5e";
    } else if (color === 'verde') {
      baseColor = "#d1fae5";
      strokeColor = "#059669";
      pulseColor = "#ef4444";
      ledColor = "#10b981";
    }

    if (state === 'SLEEP') {
      ledEyes = `
        <line x1="23" y1="25" x2="28" y2="25" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round"/>
        <line x1="36" y1="25" x2="41" y2="25" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round"/>
      `;
    } 
    else if (state === 'TRIP') {
      ledEyes = `
        <path d="M23 22l4 4M27 22l-4 4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
        <path d="M37 22l4 4M41 22l-4 4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      `;
    }
    else if (state === 'CELEBRATE') {
      ledEyes = `
        <path d="M22 23.5c.3-1 .8-1 1 0l1 1.5l1-1.5c.2-1 .7-1 1 0v.5l-2.5 3.5l-2.5-3.5v-.5Z" fill="#ef4444"/>
        <path d="M36 23.5c.3-1 .8-1 1 0l1 1.5l1-1.5c.2-1 .7-1 1 0v.5l-2.5 3.5l-2.5-3.5v-.5Z" fill="#ef4444"/>
      `;
    }
    else if (state === 'STRETCH') {
      ledEyes = `
        <path d="M23 26l2.5-3.5l2.5 3.5" stroke="${ledColor}" stroke-width="2" fill="none"/>
        <path d="M36 26l2.5-3.5l2.5 3.5" stroke="${ledColor}" stroke-width="2" fill="none"/>
      `;
    }
    else {
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

  private getGatinhoSVG(state: MascotState, color: string): string {
    let eyes = '';
    let mouth = '';

    // Configuração de cores do gatinho
    let baseColor = "#f59e0b"; // Laranja
    let detailColor = "#d97706";
    let chestColor = "#fbbf24";
    let innerEarColor = "#fca5a5";

    if (color === 'cinza') {
      baseColor = "#94a3b8";
      detailColor = "#475569";
      chestColor = "#cbd5e1";
    } else if (color === 'preto') {
      baseColor = "#1e293b";
      detailColor = "#0f172a";
      chestColor = "#ffffff"; // Mancha branca no peito
    }

    if (state === 'SLEEP') {
      eyes = `
        <path d="M19 35 Q21 38 23 35" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M31 35 Q33 38 35 35" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
      `;
      mouth = `<path d="M26 38 Q27 38.5 28 38" stroke="#1e293b" stroke-width="1.2" stroke-linecap="round"/>`;
    } 
    else if (state === 'TRIP') {
      eyes = `
        <path d="M19 32l3 3m0-3l-3 3" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <path d="M31 32l3 3m0-3l-3 3" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
      `;
      mouth = `<path d="M25 38.5c1-1 3-1 4 0" stroke="#1e293b" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    }
    else if (state === 'CELEBRATE') {
      eyes = `
        <circle cx="21" cy="34" r="3.8" fill="#1e293b"/>
        <circle cx="33" cy="34" r="3.8" fill="#1e293b"/>
        <circle cx="22.5" cy="32.5" r="1.5" fill="#ffffff"/>
        <circle cx="34.5" cy="32.5" r="1.5" fill="#ffffff"/>
        <circle cx="19.5" cy="35.5" r="0.8" fill="#ffffff"/>
        <circle cx="31.5" cy="35.5" r="0.8" fill="#ffffff"/>
      `;
      mouth = `<path d="M24 38c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5" fill="#ef4444" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    else if (state === 'STRETCH') {
      eyes = `
        <path d="M19 32l4 2.5l-4 2.5" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M35 32l-4 2.5l4 2.5" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      `;
      mouth = `<circle cx="27" cy="38" r="1.5" fill="#1e293b"/>`;
    }
    else {
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
}
