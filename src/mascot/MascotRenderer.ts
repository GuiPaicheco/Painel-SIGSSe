import { MascotEngine } from './MascotEngine';
import { RemoteContentManager } from '../content/RemoteContentManager';
import { CampaignManager } from '../campaign/CampaignManager';
import { MascotAnimationDefinition } from '../types';

export class MascotRenderer {
  private engine: MascotEngine;
  private container: HTMLElement;
  private mascotEl: HTMLElement;
  private skinId: string = 'gotinha';
  private currentRenderMode: 'svg' | 'spritesheet' = 'svg';
  private currentAnimationId: string = '';

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
    Object.assign(this.mascotEl.style, {
      width: '100%',
      height: '100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '0px 0px'
    });

    this.container.appendChild(this.mascotEl);
    document.body.appendChild(this.container);

    this.setupInteractions();
  }

  public setSkin(skinId: string): void {
    this.skinId = skinId;
    this.updateSkinVisual();
  }

  public updateSkinVisual(): void {
    this.currentRenderMode = 'svg';
    this.currentAnimationId = '';
    this.renderSvgVisual();
  }

  private renderSvgVisual(): void {
    const remoteManager = RemoteContentManager.getInstance();
    const mascotDef = remoteManager.getMascotById(this.skinId);

    let svgContent = '';
    if (mascotDef && mascotDef.skins && mascotDef.skins.default && mascotDef.skins.default.src) {
      svgContent = mascotDef.skins.default.src;
    } else {
      const defaultMascot = remoteManager.getMascotById('gotinha');
      svgContent = defaultMascot?.skins?.default?.src || `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#0288D1"/></svg>`;
    }

    this.mascotEl.style.backgroundImage = 'none';
    this.mascotEl.innerHTML = svgContent;
    
    const svg = this.mascotEl.querySelector('svg');
    if (svg) {
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';
    }
  }

  public render(): void {
    const { x, y, facingRight, state } = this.engine;
    const config = this.engine.getConfig();

    const scaleX = facingRight ? 1 : -1;
    this.container.style.transform = `translate3d(${x}px, ${y}px, 0px) scaleX(${scaleX})`;
    this.container.style.opacity = `${config.opacity}`;
    this.container.style.width = `${config.size}px`;
    this.container.style.height = `${config.size}px`;

    // Verificar se existe uma animação por Spritesheet declarativa associada ao estado atual da FSM
    const remoteManager = RemoteContentManager.getInstance();
    const mascotDef = remoteManager.getMascotById(this.skinId);
    
    let activeAnim: MascotAnimationDefinition | null = null;
    if (mascotDef && mascotDef.animations) {
      const anims = Object.values(mascotDef.animations) as MascotAnimationDefinition[];
      anims.forEach(anim => {
        if (anim && anim.state === state && anim.src) {
          activeAnim = anim;
        }
      });
    }

    if (activeAnim && (activeAnim as MascotAnimationDefinition).src) {
      this.renderSpritesheetFrame(activeAnim as MascotAnimationDefinition);
    } else {
      if (this.currentRenderMode === 'spritesheet') {
        this.currentRenderMode = 'svg';
        this.renderSvgVisual();
      }
    }

    if (state === 'SPEAKING') {
      this.triggerCampaignSpeech();
    }
  }

  private renderSpritesheetFrame(anim: MascotAnimationDefinition): void {
    try {
      this.currentRenderMode = 'spritesheet';
      
      const now = Date.now();
      const frameCount = anim.frameCount || 1;
      const fps = anim.fps || 10;
      const frameIndex = Math.floor((now * fps) / 1000) % frameCount;

      const cols = anim.columns || frameCount;
      const col = frameIndex % cols;
      const row = Math.floor(frameIndex / cols);

      const offsetX = -(col * anim.frameWidth);
      const offsetY = -(row * anim.frameHeight);

      if (this.currentAnimationId !== anim.id) {
        this.currentAnimationId = anim.id;
        this.mascotEl.innerHTML = '';
        this.mascotEl.style.backgroundImage = `url("${anim.src}")`;
        this.mascotEl.style.backgroundSize = `${cols * 100}% auto`;
      }

      this.mascotEl.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    } catch (e) {
      // Fallback gracioso para SVG em caso de falha no renderizador de spritesheet
      console.warn('MascotRenderer: Falha ao renderizar quadro de spritesheet. Aplicando fallback SVG.', e);
      this.currentRenderMode = 'svg';
      this.renderSvgVisual();
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
