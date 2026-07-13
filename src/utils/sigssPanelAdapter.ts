/**
 * Adaptador do DOM do Painel SIGSS (MV | Unique Panel)
 * 
 * Este arquivo abstrai as consultas ao DOM do painel oficial de chamadas
 * e do painel de simulação local, permitindo que a extensão funcione
 * independentemente das mudanças de layout da MV.
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
   * Detecta se a página aberta é de fato o painel de chamadas
   */
  static isPanelPage(): boolean {
    const url = window.location.href;
    return (
      url.includes('unique-panel/panel-screen') || 
      url.includes('mock_panel.html') ||
      document.title.toLowerCase().includes('painel') ||
      !!document.querySelector('.called-patient, #current-patient, .panel-container')
    );
  }

  /**
   * Retorna os elementos do painel ativo
   */
  static getElements(): PanelElements {
    // 1. Tentar os IDs e classes do nosso simulador/mock e padrões comuns
    const elements: PanelElements = {
      callingCard: document.querySelector('.calling-card, .chamando-card, .painel-chamando, main > section:first-child'),
      patientName: document.querySelector('#current-patient, .called-patient, .chamando-paciente, .paciente-chamado'),
      localName: document.querySelector('#current-local, .called-local, .chamando-local, .sala-chamada'),
      professionalName: document.querySelector('#current-professional, .called-professional, .chamando-profissional'),
      historySection: document.querySelector('.history-section, .ultimas-chamadas, aside.history, .painel-historico'),
      footerTicker: document.querySelector('.panel-footer, footer, .footer-ticker, .marquee-container')
    };

    // 2. Se falhar em encontrar o card principal, realizar buscas estruturais de segurança
    if (!elements.callingCard) {
      // Procura a div de maior tamanho no painel
      const divs = Array.from(document.querySelectorAll('div, section'));
      let largestDiv: HTMLElement | null = null;
      let largestArea = 0;
      
      divs.forEach(div => {
        const rect = div.getBoundingClientRect();
        const area = rect.width * rect.height;
        // Pega divs visíveis e grandes na metade esquerda da tela
        if (rect.width > 200 && rect.height > 200 && rect.left < window.innerWidth / 2 && area > largestArea) {
          largestArea = area;
          largestDiv = div as HTMLElement;
        }
      });
      elements.callingCard = largestDiv;
    }

    // 3. Se falhar em encontrar os campos de texto do chamado por seletores, busca por heurísticas de texto
    if (elements.callingCard && !elements.patientName) {
      // O nome do paciente chamado geralmente é o maior texto dentro do card de chamadas
      const childElements = Array.from(elements.callingCard.querySelectorAll('span, div, h1, h2, td'));
      let largestFontEl: HTMLElement | null = null;
      let maxFontSize = 0;

      childElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const text = (el.textContent || '').trim();
        // Nomes de pacientes geralmente são textos longos em maiúsculo sem números
        if (fontSize > maxFontSize && text.length > 3 && !/^\d+$/.test(text) && text !== 'CHAMANDO' && text !== '-') {
          maxFontSize = fontSize;
          largestFontEl = el as HTMLElement;
        }
      });
      elements.patientName = largestFontEl;
    }

    return elements;
  }

  /**
   * Obtém a caixa delimitadora (Bounding Rect) de um elemento para colisões físicas
   */
  static getObstacleRects(): DOMRect[] {
    const rects: DOMRect[] = [];
    const elements = this.getElements();

    // Adiciona o card de chamada e a área de histórico como obstáculos se existirem
    if (elements.callingCard) {
      rects.push(elements.callingCard.getBoundingClientRect());
    }
    if (elements.historySection) {
      rects.push(elements.historySection.getBoundingClientRect());
    }

    return rects;
  }
}
