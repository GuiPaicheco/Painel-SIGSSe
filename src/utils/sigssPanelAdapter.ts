/**
 * Adaptador do DOM do Painel SIGSS (MV | Unique Panel)
 * 
 * Este arquivo abstrai as consultas ao DOM do painel oficial de chamadas
 * e do painel de simulação local. Ele usa heurísticas avançadas de detecção
 * para encontrar o paciente chamado, local e profissional, tornando a
 * extensão imune a mudanças de seletores do sistema MV.
 */

export interface PanelElements {
  callingCard: HTMLElement | null;      // O card grande de chamada ativa
  patientName: HTMLElement | null;      // Onde fica o nome do paciente chamado
  localName: HTMLElement | null;        // Sala / Guichê
  professionalName: HTMLElement | null; // Nome do médico / enfermeiro
  historySection: HTMLElement | null;    // Container do histórico lateral
  footerTicker: HTMLElement | null;      // O rodapé (geralmente com letreiro)
}

export class SigssPanelAdapter {

  /**
   * Detecta se a página aberta é o painel de chamadas
   */
  static isPanelPage(): boolean {
    const url = window.location.href;
    return (
      url.includes('unique-panel/panel-screen') || 
      url.includes('mock_panel.html') ||
      document.title.toLowerCase().includes('painel') ||
      !!document.querySelector('.called-patient, #current-patient, .panel-container') ||
      this.hasCalledPatientHeuristic()
    );
  }

  /**
   * Verifica por heurística se há indícios de um painel de chamadas ativo
   */
  private static hasCalledPatientHeuristic(): boolean {
    const bodyText = document.body.innerText.toUpperCase();
    return bodyText.includes('CHAMANDO') || bodyText.includes('ÚLTIMAS CHAMADAS') || bodyText.includes('HISTÓRICO');
  }

  /**
   * Retorna os elementos do painel usando seletores diretos e heurísticas estruturais de segurança
   */
  static getElements(): PanelElements {
    // 1. Seleção por seletores diretos (Mock/Simulator e padrões comuns)
    const elements: PanelElements = {
      callingCard: document.querySelector('.calling-card, .chamando-card, .painel-chamando, [class*="chamando-card"]'),
      patientName: document.querySelector('#current-patient, .called-patient, .chamando-paciente, .paciente-chamado, [class*="called-patient"]'),
      localName: document.querySelector('#current-local, .called-local, .chamando-local, .sala-chamada, [class*="called-local"]'),
      professionalName: document.querySelector('#current-professional, .called-professional, .chamando-profissional, [class*="called-professional"]'),
      historySection: document.querySelector('.history-section, .ultimas-chamadas, aside.history, .painel-historico, [class*="history"]'),
      footerTicker: document.querySelector('.panel-footer, footer, .footer-ticker, .marquee-container, marquee')
    };

    // 2. Se falhar, busca por heurísticas de tags e textos na página real
    if (!elements.callingCard) {
      // O card de chamada geralmente é a maior seção ou div visível na metade esquerda da tela
      const divs = Array.from(document.querySelectorAll('div, section'));
      let largestDiv: HTMLElement | null = null;
      let largestArea = 0;
      
      divs.forEach(div => {
        const rect = div.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (rect.width > 200 && rect.height > 200 && rect.left < window.innerWidth * 0.75 && area > largestArea) {
          largestArea = area;
          largestDiv = div as HTMLElement;
        }
      });
      elements.callingCard = largestDiv;
    }

    // 3. Heurística para encontrar o nome do paciente chamado (uppercase, fonte grande, sem números)
    if (!elements.patientName && elements.callingCard) {
      elements.patientName = this.findLargeUppercaseTextIn(elements.callingCard, ['CHAMANDO', 'PACIENTE', '-']);
    } else if (!elements.patientName) {
      // Varre o body inteiro se não achou o card
      elements.patientName = this.findLargeUppercaseTextIn(document.body, ['CHAMANDO', 'PACIENTE', '-']);
    }

    // 4. Heurística para encontrar a Sala / Local
    if (!elements.localName && elements.callingCard) {
      // Procura textos contendo "SALA", "GUICHÊ", "CONSULTÓRIO" ou simplesmente caixa de texto menor que o paciente
      const childElements = Array.from(elements.callingCard.querySelectorAll('span, div, h1, h2, h3, p'));
      for (const el of childElements) {
        const text = (el.textContent || '').trim().toUpperCase();
        if (text.includes('SALA') || text.includes('GUICHE') || text.includes('GUICHÊ') || text.includes('CONSULTORIO') || text.includes('CONSULTÓRIO')) {
          elements.localName = el as HTMLElement;
          break;
        }
      }
    }

    return elements;
  }

  /**
   * Helper que encontra elementos com textos em maiúsculo de grande tamanho
   */
  private static findLargeUppercaseTextIn(root: HTMLElement, excludeWords: string[]): HTMLElement | null {
    const childElements = Array.from(root.querySelectorAll('span, div, h1, h2, h3, p, td'));
    let bestMatch: HTMLElement | null = null;
    let maxFontSize = 0;

    for (const el of childElements) {
      const text = (el.textContent || '').trim();
      
      // Validações:
      // - Deve possuir texto com mais de 3 caracteres
      // - Deve conter apenas letras maiúsculas e espaços (nomes de pessoas)
      // - Deve ter pelo menos um espaço (ex: nome e sobrenome)
      // - Não pode estar nas palavras excluídas
      if (
        text.length > 4 && 
        /^[A-Z\s\u00C0-\u00FF]+$/.test(text) && 
        text.includes(' ') &&
        !excludeWords.some(w => text.includes(w)) &&
        !text.includes('PREFEITURA') &&
        !text.includes('SECRETARIA') &&
        !text.includes('SAUDE') &&
        !text.includes('SAÚDE') &&
        !text.includes('BETIM')
      ) {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize > maxFontSize) {
          maxFontSize = fontSize;
          bestMatch = el as HTMLElement;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Obtém as caixas de colisão física dos blocos
   */
  static getObstacleRects(): DOMRect[] {
    const rects: DOMRect[] = [];
    const elements = this.getElements();

    if (elements.callingCard) {
      rects.push(elements.callingCard.getBoundingClientRect());
    }
    if (elements.historySection) {
      rects.push(elements.historySection.getBoundingClientRect());
    }

    return rects;
  }
}
