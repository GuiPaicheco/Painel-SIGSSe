import { MascotEngine } from './MascotEngine';
import { RemoteContentManager } from '../content/RemoteContentManager';
import { CampaignManager } from '../campaign/CampaignManager';

export class MascotRenderer {
  private engine: MascotEngine;
  private container: HTMLElement;
  private mascotEl: HTMLElement;
  private skinId: string = 'gotinha';

  // Handlers salvos para remoção limpa no destroy (Memory Leak Prevention)
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: (() => void) | null = null;
  private clickHandler: (() => void) | null = null;
  private mouseDownHandler: ((e: MouseEvent) => void) | null = null;

  constructor(engine: MascotEngine) {
    this.engine = engine;

    this.container = document.createElement('div');
    this.container.className = 'sigsse-mascot-container';
    Object.assign(this.container.style, {
      position: 'fixed',
      zIndex: '999999',
      top: '0px',
      left: '0px',
      pointerEvents: 'auto',
      userSelect: 'none',
      cursor: 'grab',
      willChange: 'transform'
    });

    this.mascotEl = document.createElement('div');
    this.mascotEl.className = 'sigsse-mascot-sprite';
    this.container.appendChild(this.mascotEl);

    document.body.appendChild(this.container);

    this.setupInteractions();
  }

  public setSkin(skinId: string): void {
    this.skinId = skinId;
    this.updateSkinVisual();
  }

  public updateSkinVisual(): void {
    const remoteManager = RemoteContentManager.getInstance();
    const mascotDef = remoteManager.getMascotById(this.skinId);

    let svgContent = '';
    if (mascotDef && mascotDef.skins && mascotDef.skins.default && mascotDef.skins.default.src) {
      svgContent = mascotDef.skins.default.src;
    } else {
      const defaultMascot = remoteManager.getMascotById('gotinha');
      svgContent = defaultMascot?.skins?.default?.src || `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#0288D1"/></svg>`;
    }

    this.mascotEl.innerHTML = svgContent;
    
    const svg = this.mascotEl.querySelector('svg');
    if (svg) {
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';
    }
  }

  public render(): void {
    const { x, y, facingRight } = this.engine;
    const config = this.engine.getConfig();

    const scaleX = facingRight ? 1 : -1;
    this.container.style.transform = `translate3d(${x}px, ${y}px, 0px) scaleX(${scaleX})`;
    this.container.style.opacity = `${config.opacity}`;
    this.container.style.width = `${config.size}px`;
    this.container.style.height = `${config.size}px`;

    if (this.engine.state === 'SPEAKING') {
      this.triggerCampaignSpeech();
    }
  }

  private triggerCampaignSpeech(): void {
    const campaignManager = CampaignManager.getInstance();
    const msg = campaignManager.getNextMessage();
    if (msg) {
      campaignManager.showSpeechBubble(this.container, msg.text, msg.displayDurationSeconds);
    }
  }

  private setupInteractions(): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    this.mouseDownHandler = (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX - this.engine.x;
      startY = e.clientY - this.engine.y;
      this.container.style.cursor = 'grabbing';
      this.engine.setState('DRAGGED');
    };

    this.mouseMoveHandler = (e: MouseEvent) => {
      if (!isDragging) return;
      this.engine.x = e.clientX - startX;
      this.engine.y = e.clientY - startY;
    };

    this.mouseUpHandler = () => {
      if (isDragging) {
        isDragging = false;
        this.container.style.cursor = 'grab';
        this.engine.setState('FALL');
      }
    };

    this.clickHandler = () => {
      this.triggerCampaignSpeech();
    };

    this.container.addEventListener('mousedown', this.mouseDownHandler);
    this.container.addEventListener('click', this.clickHandler);
    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
  }

  public destroy(): void {
    // Remoção estrita de todos os event listeners globais e locais
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.mouseUpHandler) {
      window.removeEventListener('mouseup', this.mouseUpHandler);
      this.mouseUpHandler = null;
    }
    if (this.mouseDownHandler) {
      this.container.removeEventListener('mousedown', this.mouseDownHandler);
      this.mouseDownHandler = null;
    }
    if (this.clickHandler) {
      this.container.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
