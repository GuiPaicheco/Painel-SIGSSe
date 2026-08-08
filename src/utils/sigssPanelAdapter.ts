/**
 * Adaptador do DOM do Painel SIGSS (MV | Unique Panel)
 * 
 * Este arquivo abstrai as consultas ao DOM do painel oficial de chamadas
 * e do painel de simulação local. Ele usa heurísticas avançadas de detecção
 * baseadas em rótulos e colunas para evitar a fusão entre o chamado ativo
 * e o histórico de últimas chamadas.
 */

export interface PanelElements {
  callingCard: HTMLElement | null;      // O card/coluna de chamada ativa
  patientName: HTMLElement | null;      // Onde fica o nome do paciente chamado
  localName: HTMLElement | null;        // Sala / Guichê
  professionalName: HTMLElement | null; // Nome do médico / enfermeiro
  historySection: HTMLElement | null;    // Container do histórico lateral
  footerTicker: HTMLElement | null;      // O rodapé
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
      !!document.querySelector('.called-patient, #current-patient, .panel-container, .calling-card') ||
      this.hasCalledPatientHeuristic()
    );
  }

  private static hasCalledPatientHeuristic(): boolean {
    const bodyText = (document.body ? document.body.innerText || '' : '').toUpperCase();
    return bodyText.includes('CHAMANDO') || bodyText.includes('ÚLTIMAS CHAMADAS') || bodyText.includes('HISTÓRICO');
  }

  /**
   * Retorna os elementos do painel usando seletores diretos e heurísticas estruturais de segurança
   */
  static getElements(): PanelElements {
    // 1. Tentar identificar a seção de histórico primeiro para podermos excluí-la de buscas ativas
    const historySection = document.querySelector(
      '.history-section, .ultimas-chamadas, aside.history, .painel-historico, [class*="history"], [class*="sidebar"]'
    ) as HTMLElement | null;

    // 2. Identificar a coluna/card de chamada ativa ("CHAMANDO")
    let callingCard = document.querySelector(
      '.calling-card, .chamando-card, .painel-chamando, [class*="chamando-card"]'
    ) as HTMLElement | null;

    if (!callingCard) {
      // Procurar o cabeçalho/rótulo "CHAMANDO"
      const allDivs = Array.from(document.querySelectorAll('div, section, td, th, h1, h2, h3, p, span'));
      let chamandoHeader: HTMLElement | null = null;
      for (const el of allDivs) {
        const text = (el.textContent || '').trim().toUpperCase();
        if (text === 'CHAMANDO' || text === 'CHAMANDO ATIVA' || text === 'PACIENTE CHAMADO') {
          chamandoHeader = el as HTMLElement;
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

    // 3. Buscar os campos de chamada ativa usando seletores diretos
    let patientName = document.querySelector('#current-patient, .called-patient, .chamando-paciente, .paciente-chamado') as HTMLElement | null;
    let localName = document.querySelector('#current-local, .called-local, .chamando-local, .sala-chamada') as HTMLElement | null;
    let professionalName = document.querySelector('#current-professional, .called-professional, .chamando-profissional') as HTMLElement | null;

    // 4. Se falhar nos seletores diretos, aplica heurística de rótulos
    if (!patientName) {
      patientName = this.findValueByLabelHeuristic(searchRoot, ['PACIENTE'], historySection);
    }
    if (!localName) {
      localName = this.findValueByLabelHeuristic(searchRoot, ['LOCAL', 'SALA', 'GUICHÊ', 'GUICHE'], historySection);
    }
    if (!professionalName) {
      professionalName = this.findValueByLabelHeuristic(searchRoot, ['PROFISSIONAL', 'MÉDICO', 'MEDICO', 'ENFERMEIRO'], historySection);
    }

    return {
      callingCard,
      patientName,
      localName,
      professionalName,
      historySection,
      footerTicker: document.querySelector('.panel-footer, footer, .footer-ticker, marquee')
    };
  }

  /**
   * Encontra um elemento de valor que está posicionado após/abaixo de um rótulo explicativo
   */
  private static findValueByLabelHeuristic(
    root: HTMLElement, 
    labelKeywords: string[], 
    excludeContainer: HTMLElement | null
  ): HTMLElement | null {
    const all = Array.from(root.querySelectorAll('span, div, h1, h2, h3, p, td, th, b, strong, label'));
    
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement;
      
      if (excludeContainer && excludeContainer.contains(el)) {
        continue;
      }

      const text = (el.textContent || '').trim().toUpperCase();
      
      const matchesLabel = labelKeywords.some(keyword => 
        text === keyword || 
        text === keyword + ':' ||
        text.startsWith(keyword + ':')
      );

      if (matchesLabel) {
        for (let j = i + 1; j < all.length; j++) {
          const valEl = all[j] as HTMLElement;
          
          if (excludeContainer && excludeContainer.contains(valEl)) {
            continue;
          }

          const valText = (valEl.textContent || '').trim();
          const valUpper = valText.toUpperCase();

          const isExactHeaderLabel = labelKeywords.some(k => valUpper === k || valUpper === k + ':') ||
                                    valUpper === 'PACIENTE' || valUpper === 'LOCAL' || valUpper === 'PROFISSIONAL';

          if (
            valText && 
            valText !== '-' && 
            valEl.children.length === 0 &&
            !isExactHeaderLabel
          ) {
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
