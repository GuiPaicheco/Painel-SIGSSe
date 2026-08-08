import { CampaignMessage } from '../types';
import { RemoteContentManager } from '../content/RemoteContentManager';

export class CampaignManager {
  private static instance: CampaignManager | null = null;
  private activeBubbleElement: HTMLElement | null = null;
  private bubbleTimeout: any = null;

  private constructor() {}

  public static getInstance(): CampaignManager {
    if (!CampaignManager.instance) {
      CampaignManager.instance = new CampaignManager();
    }
    return CampaignManager.instance;
  }

  /**
   * Sanitiza a string de texto para prevenir XSS antes da inserção na página.
   */
  public sanitizeText(input: string): string {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
  }

  /**
   * Obtém uma mensagem de campanha ativa
   */
  public getNextMessage(): CampaignMessage | null {
    return RemoteContentManager.getInstance().getRandomCampaignMessage();
  }

  /**
   * Cria um balão de fala dinâmico posicionado sobre um elemento mascote
   */
  public showSpeechBubble(mascotElement: HTMLElement, text: string, durationSeconds = 6): HTMLElement {
    this.removeActiveBubble();

    const bubble = document.createElement('div');
    bubble.className = 'sigsse-speech-bubble';
    
    const sanitized = this.sanitizeText(text);

    bubble.innerHTML = `
      <div class="sigsse-speech-content">
        <span class="sigsse-speech-icon">💡</span>
        <span class="sigsse-speech-text">${sanitized}</span>
      </div>
      <div class="sigsse-speech-arrow"></div>
    `;

    // Estilização injetada isolada
    Object.assign(bubble.style, {
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-10px)',
      backgroundColor: '#FFFFFF',
      color: '#1A237E',
      padding: '10px 14px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      fontSize: '13px',
      fontWeight: '600',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '220px',
      width: 'max-content',
      zIndex: '999999',
      pointerEvents: 'none',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      opacity: '0'
    });

    mascotElement.appendChild(bubble);
    this.activeBubbleElement = bubble;

    // Fade-in
    requestAnimationFrame(() => {
      bubble.style.opacity = '1';
      bubble.style.transform = 'translateX(-50%) translateY(-16px)';
    });

    // Auto-destruição após o tempo especificado
    this.bubbleTimeout = setTimeout(() => {
      this.removeActiveBubble();
    }, durationSeconds * 1000);

    return bubble;
  }

  public removeActiveBubble(): void {
    if (this.bubbleTimeout) {
      clearTimeout(this.bubbleTimeout);
      this.bubbleTimeout = null;
    }
    if (this.activeBubbleElement && this.activeBubbleElement.parentNode) {
      const el = this.activeBubbleElement;
      el.style.opacity = '0';
      setTimeout(() => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 300);
      this.activeBubbleElement = null;
    }
  }
}
