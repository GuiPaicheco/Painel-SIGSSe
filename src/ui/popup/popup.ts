import { MascotConfigManager } from '../../core/config';
import { MascotSettings, CampaignDefinition, CampaignMessage } from '../../types';
import { RemoteContentManager } from '../../content/RemoteContentManager';

export type TemporalStatus = 'ATIVA' | 'FUTURA' | 'EXPIRADA' | 'INATIVA';

export interface CampaignCalculatedStatus {
  status: TemporalStatus;
  badgeClass: string;
}

export class CampaignAdminHelper {
  public static calculateStatus(campaign: CampaignDefinition, referenceDate: Date = new Date()): CampaignCalculatedStatus {
    if (campaign.active === false) {
      return { status: 'INATIVA', badgeClass: 'inativa' };
    }

    if (campaign.startDate) {
      const start = new Date(campaign.startDate);
      if (!isNaN(start.getTime()) && referenceDate < start) {
        return { status: 'FUTURA', badgeClass: 'futura' };
      }
    }

    if (campaign.endDate) {
      const end = new Date(campaign.endDate);
      if (!isNaN(end.getTime()) && referenceDate > end) {
        return { status: 'EXPIRADA', badgeClass: 'expirada' };
      }
    }

    return { status: 'ATIVA', badgeClass: 'ativa' };
  }

  public static sortCampaigns(campaigns: CampaignDefinition[], referenceDate: Date = new Date()): CampaignDefinition[] {
    const getStatusWeight = (c: CampaignDefinition): number => {
      const { status } = CampaignAdminHelper.calculateStatus(c, referenceDate);
      switch (status) {
        case 'ATIVA': return 1000 + (c.priority || 0);
        case 'FUTURA': return 500 + (c.priority || 0);
        case 'EXPIRADA': return 100 + (c.priority || 0);
        case 'INATIVA': return 0 + (c.priority || 0);
      }
    };

    return [...campaigns].sort((a, b) => getStatusWeight(b) - getStatusWeight(a));
  }

  public static sanitizeText(text: string): string {
    if (!text) return '';
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
  }
}

class PopupController {
  // Elementos do Tab 1 (Ajustes)
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

  // Elementos de Navegação por Abas
  private tabBtnSettings = document.getElementById('tabBtnSettings') as HTMLButtonElement;
  private tabBtnCampaigns = document.getElementById('tabBtnCampaigns') as HTMLButtonElement;
  private tabSettings = document.getElementById('tabSettings') as HTMLElement;
  private tabCampaigns = document.getElementById('tabCampaigns') as HTMLElement;

  // Elementos do Tab 2 (Admin Dashboard)
  private metricTotal = document.getElementById('metricTotal') as HTMLElement;
  private metricActive = document.getElementById('metricActive') as HTMLElement;
  private metricFuture = document.getElementById('metricFuture') as HTMLElement;
  private metricExpired = document.getElementById('metricExpired') as HTMLElement;
  private metricInactive = document.getElementById('metricInactive') as HTMLElement;
  private netIndicator = document.getElementById('netIndicator') as HTMLElement;
  private adminStatusText = document.getElementById('adminStatusText') as HTMLElement;
  private btnRefreshRemote = document.getElementById('btnRefreshRemote') as HTMLButtonElement;
  private refreshFeedback = document.getElementById('refreshFeedback') as HTMLElement;
  private campaignListContainer = document.getElementById('campaignListContainer') as HTMLElement;
  private mascotPreviewGrid = document.getElementById('mascotPreviewGrid') as HTMLElement;
  private filterPills = document.querySelectorAll('.pill-btn');

  private currentFilter: string = 'all';
  private currentSettings: MascotSettings | null = null;

  public async init() {
    this.currentSettings = await MascotConfigManager.load();
    this.populateUI(this.currentSettings);
    this.bindEvents();

    const remoteManager = RemoteContentManager.getInstance();
    await remoteManager.init();
    
    remoteManager.onUpdate(() => {
      this.refreshCampaignDashboard();
      this.renderMascotPreviews();
    });

    this.refreshCampaignDashboard();
    this.renderMascotPreviews();
  }

  private populateUI(settings: MascotSettings) {
    if (this.mascotEnabled) this.mascotEnabled.checked = settings.mascotEnabled;
    if (this.mascotSkin) this.mascotSkin.value = settings.mascotSkin;
    
    if (this.size) {
      this.size.value = settings.size.toString();
      if (this.sizeVal) this.sizeVal.textContent = `${settings.size}px`;
    }

    if (this.speedMultiplier) {
      this.speedMultiplier.value = settings.speedMultiplier.toString();
      if (this.speedVal) this.speedVal.textContent = `${settings.speedMultiplier.toFixed(1)}x`;
    }

    if (this.opacity) {
      this.opacity.value = settings.opacity.toString();
      if (this.opacityVal) this.opacityVal.textContent = `${Math.round(settings.opacity * 100)}%`;
    }

    if (this.callAwareness) this.callAwareness.checked = settings.callAwareness;
    if (this.campaignsEnabled) this.campaignsEnabled.checked = settings.campaignsEnabled;

    this.updateCountButtons(settings.mascotCount);
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
    // Alternância de Abas
    if (this.tabBtnSettings && this.tabBtnCampaigns) {
      this.tabBtnSettings.addEventListener('click', () => this.switchTab('settings'));
      this.tabBtnCampaigns.addEventListener('click', () => this.switchTab('campaigns'));
    }

    // Filtros de Pílulas
    this.filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentFilter = pill.getAttribute('data-filter') || 'all';
        this.refreshCampaignDashboard();
      });
    });

    // Verificação Remota Manual
    if (this.btnRefreshRemote) {
      this.btnRefreshRemote.addEventListener('click', () => this.handleRemoteCheck());
    }

    // Sliders e Toggles de Configuração
    if (this.mascotEnabled) {
      this.mascotEnabled.addEventListener('change', () => {
        MascotConfigManager.save({ mascotEnabled: this.mascotEnabled.checked });
      });
    }

    if (this.mascotSkin) {
      this.mascotSkin.addEventListener('change', () => {
        MascotConfigManager.save({ mascotSkin: this.mascotSkin.value });
      });
    }

    this.countButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const count = parseInt(btn.getAttribute('data-count') || '1', 10);
        this.updateCountButtons(count);
        MascotConfigManager.save({ mascotCount: count });
      });
    });

    if (this.size) {
      this.size.addEventListener('input', () => {
        const val = parseInt(this.size.value, 10);
        if (this.sizeVal) this.sizeVal.textContent = `${val}px`;
        MascotConfigManager.save({ size: val });
      });
    }

    if (this.speedMultiplier) {
      this.speedMultiplier.addEventListener('input', () => {
        const val = parseFloat(this.speedMultiplier.value);
        if (this.speedVal) this.speedVal.textContent = `${val.toFixed(1)}x`;
        MascotConfigManager.save({ speedMultiplier: val });
      });
    }

    if (this.opacity) {
      this.opacity.addEventListener('input', () => {
        const val = parseFloat(this.opacity.value);
        if (this.opacityVal) this.opacityVal.textContent = `${Math.round(val * 100)}%`;
        MascotConfigManager.save({ opacity: val });
      });
    }

    if (this.callAwareness) {
      this.callAwareness.addEventListener('change', () => {
        MascotConfigManager.save({ callAwareness: this.callAwareness.checked });
      });
    }

    if (this.campaignsEnabled) {
      this.campaignsEnabled.addEventListener('change', () => {
        MascotConfigManager.save({ campaignsEnabled: this.campaignsEnabled.checked });
      });
    }
  }

  private switchTab(tab: 'settings' | 'campaigns') {
    if (tab === 'settings') {
      this.tabBtnSettings.classList.add('active');
      this.tabBtnCampaigns.classList.remove('active');
      this.tabSettings.classList.add('active');
      this.tabCampaigns.classList.remove('active');
    } else {
      this.tabBtnSettings.classList.remove('active');
      this.tabBtnCampaigns.classList.add('active');
      this.tabSettings.classList.remove('active');
      this.tabCampaigns.classList.add('active');
      this.refreshCampaignDashboard();
      this.renderMascotPreviews();
    }
  }

  private async handleRemoteCheck() {
    if (!this.refreshFeedback || !this.btnRefreshRemote) return;

    this.btnRefreshRemote.disabled = true;
    this.refreshFeedback.style.color = '#38bdf8';
    this.refreshFeedback.textContent = 'Verificando atualizações no GitHub...';

    try {
      const remoteManager = RemoteContentManager.getInstance();
      const updated = await remoteManager.checkRemoteUpdateInBackground();
      
      const manifest = remoteManager.getManifest();
      if (updated) {
        this.refreshFeedback.style.color = '#00E676';
        this.refreshFeedback.textContent = `Conteúdo atualizado para a versão ${manifest.contentVersion}!`;
      } else {
        this.refreshFeedback.style.color = '#94a3b8';
        this.refreshFeedback.textContent = `Conteúdo já está na versão mais recente (${manifest.contentVersion}).`;
      }

      this.refreshCampaignDashboard();
      this.renderMascotPreviews();
    } catch (err) {
      this.refreshFeedback.style.color = '#FF9800';
      this.refreshFeedback.textContent = 'Falha na conexão remota — utilizando dados do cache local.';
    } finally {
      this.btnRefreshRemote.disabled = false;
    }
  }

  private refreshCampaignDashboard() {
    const remoteManager = RemoteContentManager.getInstance();
    const manifest = remoteManager.getManifest();
    const campaigns = remoteManager.getCampaigns() || [];
    const now = new Date();

    let countActive = 0;
    let countFuture = 0;
    let countExpired = 0;
    let countInactive = 0;

    campaigns.forEach(c => {
      const { status } = CampaignAdminHelper.calculateStatus(c, now);
      switch (status) {
        case 'ATIVA': countActive++; break;
        case 'FUTURA': countFuture++; break;
        case 'EXPIRADA': countExpired++; break;
        case 'INATIVA': countInactive++; break;
      }
    });

    if (this.metricTotal) this.metricTotal.textContent = campaigns.length.toString();
    if (this.metricActive) this.metricActive.textContent = countActive.toString();
    if (this.metricFuture) this.metricFuture.textContent = countFuture.toString();
    if (this.metricExpired) this.metricExpired.textContent = countExpired.toString();
    if (this.metricInactive) this.metricInactive.textContent = countInactive.toString();

    if (this.adminStatusText) {
      this.adminStatusText.textContent = `Content Version: ${manifest.contentVersion}`;
    }

    if (this.syncStatus) {
      this.syncStatus.textContent = `Conteúdo Remoto: Versão ${manifest.contentVersion}`;
    }

    if (this.netIndicator) {
      this.netIndicator.className = 'status-indicator online';
    }

    // Filtrar e Ordenar Campanhas
    const filtered = campaigns.filter(c => {
      const { status } = CampaignAdminHelper.calculateStatus(c, now);
      if (this.currentFilter === 'active') return status === 'ATIVA';
      if (this.currentFilter === 'future') return status === 'FUTURA';
      if (this.currentFilter === 'expired') return status === 'EXPIRADA';
      if (this.currentFilter === 'inactive') return status === 'INATIVA';
      return true;
    });

    const sorted = CampaignAdminHelper.sortCampaigns(filtered, now);
    this.renderCampaignList(sorted, now);
  }

  private renderCampaignList(campaigns: CampaignDefinition[], referenceDate: Date) {
    if (!this.campaignListContainer) return;

    if (campaigns.length === 0) {
      this.campaignListContainer.innerHTML = '<div class="empty-state">Nenhuma campanha encontrada para este filtro.</div>';
      return;
    }

    this.campaignListContainer.innerHTML = '';

    campaigns.forEach(c => {
      const { status, badgeClass } = CampaignAdminHelper.calculateStatus(c, referenceDate);
      const card = document.createElement('div');
      card.className = 'campaign-card';

      const titleSafe = CampaignAdminHelper.sanitizeText(c.title || c.id);
      const msgCount = c.messages ? c.messages.length : 0;
      const startText = c.startDate ? new Date(c.startDate).toLocaleDateString('pt-BR') : 'Sem limite';
      const endText = c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : 'Sem limite';

      card.innerHTML = `
        <div class="campaign-header-row">
          <span class="campaign-title">${titleSafe}</span>
          <span class="status-badge ${badgeClass}">${status}</span>
        </div>
        <div class="campaign-meta">
          <span>📅 Vigência: ${startText} a ${endText}</span>
          <span>⭐ Prioridade: ${c.priority || 0}</span>
        </div>
        <button type="button" class="messages-toggle-btn">
          💬 ${msgCount} mensagem(ns) vinculada(s) ▼
        </button>
        <div class="messages-container" style="display: none;"></div>
      `;

      const toggleBtn = card.querySelector('.messages-toggle-btn') as HTMLButtonElement;
      const messagesBox = card.querySelector('.messages-container') as HTMLElement;

      toggleBtn.addEventListener('click', () => {
        const isHidden = messagesBox.style.display === 'none';
        messagesBox.style.display = isHidden ? 'flex' : 'none';
        toggleBtn.textContent = `💬 ${msgCount} mensagem(ns) vinculada(s) ${isHidden ? '▲' : '▼'}`;
        
        if (isHidden && messagesBox.children.length === 0 && c.messages) {
          c.messages.forEach(m => {
            const msgEl = document.createElement('div');
            msgEl.className = 'message-item';
            const textSafe = CampaignAdminHelper.sanitizeText(m.text);
            msgEl.innerHTML = `
              <div class="message-text">“${textSafe}”</div>
              <div class="message-meta">
                <span class="category-tag">#${m.category || 'geral'}</span>
                <span>⏱️ ${m.displayDurationSeconds}s</span>
              </div>
            `;
            messagesBox.appendChild(msgEl);
          });
        }
      });

      this.campaignListContainer.appendChild(card);
    });
  }

  private renderMascotPreviews() {
    if (!this.mascotPreviewGrid) return;
    const remoteManager = RemoteContentManager.getInstance();
    const mascots = remoteManager.getMascots() || [];

    this.mascotPreviewGrid.innerHTML = '';

    mascots.forEach(mascot => {
      const tile = document.createElement('div');
      tile.className = 'mascot-tile';

      let assetType = 'SVG';
      let isSpritesheet = false;

      if (mascot.animations && Object.keys(mascot.animations).length > 0) {
        assetType = 'SPRITESHEET';
        isSpritesheet = true;
      }

      let iconHtml = '💧';
      if (mascot.id.includes('gatinho')) iconHtml = '🐱';
      if (mascot.id.includes('robo')) iconHtml = '🤖';

      const mascotNameSafe = CampaignAdminHelper.sanitizeText(mascot.name);

      tile.innerHTML = `
        <div class="mascot-tile-icon">${iconHtml}</div>
        <div class="mascot-tile-info">
          <div class="mascot-tile-name">${mascotNameSafe}</div>
          <span class="asset-badge ${isSpritesheet ? 'spritesheet' : ''}">${assetType}</span>
        </div>
      `;

      this.mascotPreviewGrid.appendChild(tile);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupController();
  popup.init().catch(err => {
    console.error('Erro ao inicializar Popup Controller:', err);
  });
});
