import { describe, it, expect, beforeEach } from 'vitest';
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

  it('deve rejeitar manifestos com schema inválido ou campos ausentes', () => {
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

  it('deve disparar evento ao receber atualização de conteúdo', () => {
    let notified = false;
    const unsubscribe = manager.onUpdate(() => {
      notified = true;
    });

    // Simular notificação
    (manager as any).notifyUpdate();

    expect(notified).toBe(true);
    unsubscribe();
  });
});
