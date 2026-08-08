import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoteContentManager } from '../../src/content/RemoteContentManager';
import { FALLBACK_MANIFEST } from '../../src/content/fallbackManifest';

describe('RemoteContentManager & Schema Validation', () => {
  const manager = RemoteContentManager.getInstance();

  beforeEach(() => {
    // Reset state
  });

  it('deve validar um manifesto com schema correto', () => {
    const validData = {
      contentVersion: '2026.08.08.001',
      schemaVersion: '1.0',
      minExtensionVersion: '2.0.0',
      mascots: [
        {
          id: 'test_mascot',
          name: 'Mascote Teste',
          version: '1.0.0',
          defaultSkin: 'default',
          skins: {
            default: {
              id: 'default',
              name: 'Default Skin',
              type: 'svg',
              src: '<svg></svg>',
              width: 64,
              height: 64
            }
          }
        }
      ]
    };

    expect(manager.validateManifestSchema(validData)).toBe(true);
  });

  it('deve rejeitar manifestos com schema inválido ou campos ausentes (Rollback / Preservação)', () => {
    expect(manager.validateManifestSchema(null)).toBe(false);
    expect(manager.validateManifestSchema({})).toBe(false);
    expect(manager.validateManifestSchema({ contentVersion: '1.0' })).toBe(false);
    
    // Mascote sem skin default
    const invalidMascotData = {
      contentVersion: '2026.08.08.001',
      schemaVersion: '1.0',
      mascots: [{ id: 'bad_mascot' }]
    };
    expect(manager.validateManifestSchema(invalidMascotData)).toBe(false);
  });

  it('deve inicializar com o manifesto de fallback em caso de ausência de cache', async () => {
    const manifest = await manager.init();
    expect(manifest.contentVersion).toBeDefined();
    expect(manifest.mascots.length).toBeGreaterThan(0);
  });

  it('deve disparar evento ao receber atualização de conteúdo válida', async () => {
    let notified = false;
    const unsubscribe = manager.onUpdate(() => {
      notified = true;
    });

    const validNewManifest = {
      contentVersion: '2026.08.08.999',
      schemaVersion: '1.0',
      minExtensionVersion: '2.0.0',
      updatedAt: new Date().toISOString(),
      mascots: [
        {
          id: 'gotinha',
          name: 'Zé Gotinha',
          version: '2.0.0',
          defaultSkin: 'default',
          skins: {
            default: {
              id: 'default',
              name: 'Skin Teste',
              type: 'svg',
              src: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20"/></svg>',
              width: 64,
              height: 64
            }
          }
        }
      ],
      campaigns: []
    };

    const updated = await manager.simulateRemoteUpdate(validNewManifest);
    expect(updated).toBe(true);
    expect(notified).toBe(true);
    expect(manager.getManifest().contentVersion).toBe('2026.08.08.999');

    unsubscribe();
  });

  it('deve lidar com falha de rede e manter o manifesto anterior em cache (Offline Resilience)', async () => {
    // Apontar para URL inexistente para forçar HTTP 404 / Network Error
    manager.setRemoteUrl('https://raw.githubusercontent.com/invalid/endpoint/404.json');

    const previousVersion = manager.getManifest().contentVersion;
    const updated = await manager.checkRemoteUpdateInBackground();

    expect(updated).toBe(false);
    expect(manager.getManifest().contentVersion).toBe(previousVersion);
  });
});
