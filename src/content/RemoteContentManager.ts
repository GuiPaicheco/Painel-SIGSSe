import { RemoteContentManifest, MascotDefinition, CampaignDefinition, CampaignMessage } from '../types';
import { FALLBACK_MANIFEST } from './fallbackManifest';

export class RemoteContentManager {
  private static instance: RemoteContentManager | null = null;
  private currentManifest: RemoteContentManifest = FALLBACK_MANIFEST;
  private isFetching = false;

  // URL base para consulta remota no repositório GitHub
  private remoteUrl = 'https://raw.githubusercontent.com/GuiPaicheco/Painel-SIGSSe/main/content/manifest.json';

  private constructor() {}

  public static getInstance(): RemoteContentManager {
    if (!RemoteContentManager.instance) {
      RemoteContentManager.instance = new RemoteContentManager();
    }
    return RemoteContentManager.instance;
  }

  /**
   * Inicializa o gerenciador de conteúdo com carregamento instantâneo via cache local / fallback
   * e dispara verificação remota em background.
   */
  public async init(): Promise<RemoteContentManifest> {
    const cached = await this.loadFromLocalCache();
    if (cached) {
      this.currentManifest = cached;
    } else {
      this.currentManifest = FALLBACK_MANIFEST;
      await this.saveToLocalCache(FALLBACK_MANIFEST);
    }

    // Trigger de sincronização remota assíncrona (não bloqueia o boot)
    this.checkRemoteUpdateInBackground().catch(err => {
      console.warn('SIGSSe ContentManager: Falha ao verificar atualizações remotas:', err);
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
    return this.getMascots().find(m => m.id === id) || FALLBACK_MANIFEST.mascots.find(m => m.id === id);
  }

  public getCampaigns(): CampaignDefinition[] {
    return this.currentManifest.campaigns || FALLBACK_MANIFEST.campaigns;
  }

  public getRandomCampaignMessage(): CampaignMessage | null {
    const campaigns = this.getCampaigns();
    if (!campaigns || campaigns.length === 0) return null;

    const allMessages: CampaignMessage[] = [];
    campaigns.forEach(c => {
      if (c.messages && c.messages.length > 0) {
        allMessages.push(...c.messages);
      }
    });

    if (allMessages.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * allMessages.length);
    return allMessages[randomIndex];
  }

  /**
   * Carrega o manifesto salvo em chrome.storage.local
   */
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

  /**
   * Salva o manifesto no cache local
   */
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

  /**
   * Busca a versão remota no GitHub CDN e aplica atualização se a versão for mais recente.
   */
  private async checkRemoteUpdateInBackground(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const response = await fetch(this.remoteUrl, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const remoteData: RemoteContentManifest = await response.json();
      
      // Validação básica do schema remoto
      if (remoteData && remoteData.version && Array.isArray(remoteData.mascots)) {
        if (remoteData.version !== this.currentManifest.version) {
          console.log(`SIGSSe ContentManager: Nova versão remota encontrada (${remoteData.version}). Atualizando cache...`);
          this.currentManifest = remoteData;
          await this.saveToLocalCache(remoteData);
        }
      }
    } catch (e) {
      // Falha graciosa mantendo o cache / fallback local
    } finally {
      this.isFetching = false;
    }
  }
}
