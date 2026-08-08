import { MascotSettings } from '../types';

export const DEFAULT_SETTINGS: MascotSettings = {
  mascotEnabled: true,
  mascotSkin: 'gotinha',
  mascotCount: 1,
  speedMultiplier: 1.0,
  size: 64,
  opacity: 0.9,
  callAwareness: true,
  campaignsEnabled: true,
  remoteContentAutoUpdate: true,
  lastUpdatedTimestamp: Date.now()
};

export class MascotConfigManager {
  /**
   * Obtém todas as configurações salvas ou retorna os valores padrão
   */
  static async load(): Promise<MascotSettings> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(null, (items) => {
          resolve({
            ...DEFAULT_SETTINGS,
            ...items
          } as MascotSettings);
        });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  }

  /**
   * Salva configurações parciais ou completas
   */
  static async save(settings: Partial<MascotSettings>): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ ...settings, lastUpdatedTimestamp: Date.now() }, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Escuta alterações de configurações em tempo real
   */
  static onChange(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          callback(changes);
        }
      });
    }
  }
}
