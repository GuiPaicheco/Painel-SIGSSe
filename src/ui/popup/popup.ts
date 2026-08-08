import { MascotConfigManager } from '../../core/config';
import { MascotSettings } from '../../types';

class PopupController {
  private mascotEnabled = document.getElementById('mascotEnabled') as HTMLInputElement;
  private mascotSkin = document.getElementById('mascotSkin') as HTMLSelectElement;
  private size = document.getElementById('size') as HTMLInputElement;
  private sizeVal = document.getElementById('sizeVal') as HTMLElement;
  private speedMultiplier = document.getElementById('speedMultiplier') as HTMLInputElement;
  private speedVal = document.getElementById('speedVal') as HTMLElement;
  private opacity = document.getElementById('opacity') as HTMLInputElement;
  private opacityVal = document.getElementById('opacityVal') as HTMLElement;
  private callAwareness = document.getElementById('callAwareness') as HTMLInputElement;
  private campaignsEnabled = document.getElementById('campaignsEnabled') as HTMLInputElement;
  private countButtons = document.querySelectorAll('.btn-count');
  private syncStatus = document.getElementById('syncStatus') as HTMLElement;

  private currentSettings: MascotSettings | null = null;

  public async init() {
    this.currentSettings = await MascotConfigManager.load();
    this.populateUI(this.currentSettings);
    this.bindEvents();
  }

  private populateUI(settings: MascotSettings) {
    this.mascotEnabled.checked = settings.mascotEnabled;
    this.mascotSkin.value = settings.mascotSkin;
    
    this.size.value = settings.size.toString();
    this.sizeVal.textContent = `${settings.size}px`;

    this.speedMultiplier.value = settings.speedMultiplier.toString();
    this.speedVal.textContent = `${settings.speedMultiplier.toFixed(1)}x`;

    this.opacity.value = settings.opacity.toString();
    this.opacityVal.textContent = `${Math.round(settings.opacity * 100)}%`;

    this.callAwareness.checked = settings.callAwareness;
    this.campaignsEnabled.checked = settings.campaignsEnabled;

    this.updateCountButtons(settings.mascotCount);
    
    if (this.syncStatus) {
      this.syncStatus.textContent = 'Conteúdo Remoto: Sincronizado (v2.0.0)';
    }
  }

  private updateCountButtons(activeCount: number) {
    this.countButtons.forEach(btn => {
      const count = parseInt(btn.getAttribute('data-count') || '1', 10);
      if (count === activeCount) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private bindEvents() {
    this.mascotEnabled.addEventListener('change', () => {
      MascotConfigManager.save({ mascotEnabled: this.mascotEnabled.checked });
    });

    this.mascotSkin.addEventListener('change', () => {
      MascotConfigManager.save({ mascotSkin: this.mascotSkin.value });
    });

    this.countButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const count = parseInt(btn.getAttribute('data-count') || '1', 10);
        this.updateCountButtons(count);
        MascotConfigManager.save({ mascotCount: count });
      });
    });

    this.size.addEventListener('input', () => {
      const val = parseInt(this.size.value, 10);
      this.sizeVal.textContent = `${val}px`;
      MascotConfigManager.save({ size: val });
    });

    this.speedMultiplier.addEventListener('input', () => {
      const val = parseFloat(this.speedMultiplier.value);
      this.speedVal.textContent = `${val.toFixed(1)}x`;
      MascotConfigManager.save({ speedMultiplier: val });
    });

    this.opacity.addEventListener('input', () => {
      const val = parseFloat(this.opacity.value);
      this.opacityVal.textContent = `${Math.round(val * 100)}%`;
      MascotConfigManager.save({ opacity: val });
    });

    this.callAwareness.addEventListener('change', () => {
      MascotConfigManager.save({ callAwareness: this.callAwareness.checked });
    });

    this.campaignsEnabled.addEventListener('change', () => {
      MascotConfigManager.save({ campaignsEnabled: this.campaignsEnabled.checked });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupController();
  popup.init().catch(err => {
    console.error('Erro ao inicializar Popup Controller:', err);
  });
});
