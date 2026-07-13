export interface MascotSettings {
  mascotEnabled: boolean;
  mascotSkin: 'gotinha' | 'robozinho_azul' | 'robozinho_rosa' | 'robozinho_verde' | 'gatinho_laranja' | 'gatinho_cinza' | 'gatinho_preto' | 'mixed';
  mascotCount: number; // Quantidade de mascotes (1 a 4)
  speedMultiplier: number;
  size: number;
  opacity: number;
  callAwareness: boolean;
}

export const DEFAULT_SETTINGS: MascotSettings = {
  mascotEnabled: true,
  mascotSkin: 'gotinha',
  mascotCount: 1,
  speedMultiplier: 1.0,
  size: 64,
  opacity: 0.9,
  callAwareness: true
};

export class MascotConfigManager {
  
  /**
   * Obtém todas as configurações salvas ou retorna os valores padrão
   */
  static async load(): Promise<MascSettingsSchema> {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        resolve({
          ...DEFAULT_SETTINGS,
          ...items
        } as MascotSettings);
      });
    });
  }

  /**
   * Salva configurações genéricas
   */
  static async save(settings: Partial<MascSettingsSchema>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(settings, () => {
        resolve();
      });
    });
  }

  /**
   * Escuta alterações de configurações em tempo real
   */
  static onChange(callback: (changes: chrome.storage.StorageChange) => void) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        callback(changes);
      }
    });
  }
}

type MascSettingsSchema = MascotSettings;
