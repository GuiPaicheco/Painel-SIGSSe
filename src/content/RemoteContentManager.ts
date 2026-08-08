import { RemoteContentManifest, MascotDefinition, CampaignDefinition, CampaignMessage } from '../types';
import { FALLBACK_MANIFEST } from './fallbackManifest';
import { SvgSanitizer } from '../utils/svgSanitizer';

export type ContentUpdateListener = (manifest: RemoteContentManifest) => void;

export class RemoteContentManager {
  private static instance: RemoteContentManager | null = null;
  private currentManifest: RemoteContentManifest = FALLBACK_MANIFEST;
  private isFetching = false;
  private listeners: Set<ContentUpdateListener> = new Set();

  private remoteUrl = 'https://raw.githubusercontent.com/GuiPaicheco/Painel-SIGSSe/main/content/manifest.json';

  private constructor() {
    this.sanitizeManifestSkins(this.currentManifest);
  }

  public static getInstance(): RemoteContentManager {
    if (!RemoteContentManager.instance) {
      RemoteContentManager.instance = new RemoteContentManager();
    }
    return RemoteContentManager.instance;
  }

  public setRemoteUrl(url: string): void {
    this.remoteUrl = url;
  }

  public onUpdate(listener: ContentUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyUpdate(): void {
    this.listeners.forEach(fn => {
      try {
        fn(this.currentManifest);
      } catch (e) {
        console.error('SIGSSe ContentManager: Erro ao notificar ouvinte de atualização:', e);
      }
    });
  }

  /**
   * Inicializa o gerenciador com Stale-While-Revalidate:
   * 1. Carrega do cache local/fallback imediatamente.
   * 2. Tenta atualização remota em background.
   */
  public async init(): Promise<RemoteContentManifest> {
    const cached = await this.loadFromLocalCache();
    if (cached && this.validateManifestSchema(cached)) {
      this.sanitizeManifestSkins(cached);
      this.currentManifest = cached;
    } else {
      this.sanitizeManifestSkins(FALLBACK_MANIFEST);
      this.currentManifest = FALLBACK_MANIFEST;
      await this.saveToLocalCache(FALLBACK_MANIFEST);
    }

    this.checkRemoteUpdateInBackground().catch(err => {
      console.warn('SIGSSe ContentManager: Falha na verificação de atualização remota:', err);
    });

    return this.currentManifest;
  }

  public getManifest(): RemoteContentManifest {
    return this.currentManifest;
  }

  public getMascots(): MascotDefinition[] {
    return this.currentManifest.mascots || FALLBACK_MANIFEST.mascots;
  }

  public getMascotById(id: string): MascotDefinition | undefined {
    return this.getMascots().find(m => m && m.id === id) || FALLBACK_MANIFEST.mascots.find(m => m.id === id);
  }

  public getCampaigns(): CampaignDefinition[] {
    return this.currentManifest.campaigns || FALLBACK_MANIFEST.campaigns;
  }

  public getRandomCampaignMessage(): CampaignMessage | null {
    const campaigns = this.getCampaigns();
    if (!campaigns || campaigns.length === 0) return null;

    const allMessages: CampaignMessage[] = [];
    campaigns.forEach(c => {
      if (c && Array.isArray(c.messages) && c.messages.length > 0) {
        allMessages.push(...c.messages);
      }
    });

    if (allMessages.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * allMessages.length);
    return allMessages[randomIndex];
  }

  /**
   * Validação rígida do Schema de Conteúdo Remoto
   */
  public validateManifestSchema(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!data.contentVersion || typeof data.contentVersion !== 'string') return false;
    if (!data.schemaVersion || typeof data.schemaVersion !== 'string') return false;
    if (!Array.isArray(data.mascots) || data.mascots.length === 0) return false;

    for (const mascot of data.mascots) {
      if (!mascot || typeof mascot !== 'object' || !mascot.id || typeof mascot.id !== 'string') {
        return false;
      }
      if (!mascot.skins || typeof mascot.skins !== 'object') {
        return false;
      }
      if (!mascot.skins.default || typeof mascot.skins.default !== 'object' || !mascot.skins.default.src) {
        return false;
      }
    }

    return true;
  }

  /**
   * Simulação e aplicação de atualização remota para testes determinísticos E2E
   */
  public async simulateRemoteUpdate(remoteData: any): Promise<boolean> {
    if (!this.validateManifestSchema(remoteData)) {
      console.warn('SIGSSe ContentManager: Simulação de atualização rejeitada por schema inválido.');
      return false;
    }

    if (remoteData.contentVersion === this.currentManifest.contentVersion) {
      console.log('SIGSSe ContentManager: Simulação de atualização ignorada (mesma versão).');
      return false;
    }

    console.log(`SIGSSe ContentManager: Aplicando atualização remota simulada (${remoteData.contentVersion})...`);
    this.sanitizeManifestSkins(remoteData);
    this.currentManifest = remoteData;
    await this.saveToLocalCache(remoteData);
    this.notifyUpdate();
    return true;
  }

  /**
   * Sanitiza todas as strings SVG contidas nos mascotes
   */
  private sanitizeManifestSkins(manifest: RemoteContentManifest): void {
    if (!manifest || !manifest.mascots) return;
    manifest.mascots.forEach(mascot => {
      if (mascot && mascot.skins) {
        Object.keys(mascot.skins).forEach(skinKey => {
          const skin = mascot.skins[skinKey];
          if (skin && skin.type === 'svg' && skin.src) {
            skin.src = SvgSanitizer.sanitize(skin.src);
          }
        });
      }
    });
  }

  private async loadFromLocalCache(): Promise<RemoteContentManifest | null> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['remote_content_manifest'], (result) => {
          if (result && result.remote_content_manifest) {
            resolve(result.remote_content_manifest as RemoteContentManifest);
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  }

  private async saveToLocalCache(manifest: RemoteContentManifest): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ remote_content_manifest: manifest }, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public async checkRemoteUpdateInBackground(): Promise<boolean> {
    if (this.isFetching) return false;
    this.isFetching = true;

    try {
      const response = await fetch(this.remoteUrl, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const remoteData: any = await response.json();
      
      if (this.validateManifestSchema(remoteData)) {
        if (remoteData.contentVersion !== this.currentManifest.contentVersion) {
          console.log(`SIGSSe ContentManager: Nova versão de conteúdo remota recebida (${remoteData.contentVersion}). Atualizando cache e notificando...`);
          this.sanitizeManifestSkins(remoteData);
          this.currentManifest = remoteData;
          await this.saveToLocalCache(remoteData);
          this.notifyUpdate();
          return true;
        }
      } else {
        console.warn('SIGSSe ContentManager: Conteúdo remoto recebido possui schema inválido. Mantendo fallback/cache anterior.');
      }
    } catch (e) {
      console.warn('SIGSSe ContentManager: Conexão remota indisponível ou falhou. Mantendo estado offline seguro.');
    } finally {
      this.isFetching = false;
    }
    return false;
  }
}
