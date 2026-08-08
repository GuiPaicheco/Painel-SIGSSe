import { describe, it, expect } from 'vitest';
import { compileContent } from '../../scripts/compile-content';
import { RemoteContentManager } from '../../src/content/RemoteContentManager';

describe('TASK-205 — Content Authoring System & Compilação Declarativa', () => {
  it('deve compilar a pasta modular content/ em um manifest.json estruturado e válido', () => {
    const compiled = compileContent();
    
    expect(compiled).toBeDefined();
    expect(compiled.contentVersion).toMatch(/^\d{4}\.\d{2}\.\d{2}\.\d{3}$/);
    expect(compiled.mascots.length).toBeGreaterThan(0);
    expect(compiled.campaigns.length).toBeGreaterThan(0);

    const zeGotinha = compiled.mascots.find(m => m.id === 'gotinha');
    expect(zeGotinha).toBeDefined();
    expect(zeGotinha?.skins.default.src).toContain('<svg');
  });

  it('deve filtrar campanhas vigentes com base na data de vigência (startDate / endDate)', () => {
    const manager = RemoteContentManager.getInstance();

    const mockManifest = {
      contentVersion: '2026.08.08.001',
      schemaVersion: '1.0',
      minExtensionVersion: '2.0.0',
      updatedAt: new Date().toISOString(),
      mascots: [
        {
          id: 'test_mascot',
          name: 'Test Mascot',
          version: '1.0.0',
          defaultSkin: 'default',
          skins: { default: { id: 'default', name: 'Default', type: 'svg' as const, src: '<svg></svg>', width: 64, height: 64 } }
        }
      ],
      campaigns: [
        {
          id: 'campanha_passada',
          title: 'Campanha Expirada 2020',
          startDate: '2020-01-01T00:00:00Z',
          endDate: '2020-12-31T23:59:59Z',
          priority: 1,
          active: true,
          messages: [{ id: 'm1', text: 'Mensagem antiga', category: 'general' as const, displayDurationSeconds: 5 }]
        },
        {
          id: 'campanha_vigente',
          title: 'Campanha Vigente 2026',
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-12-31T23:59:59Z',
          priority: 10,
          active: true,
          messages: [{ id: 'm2', text: 'Mensagem atual', category: 'vaccination' as const, displayDurationSeconds: 10 }]
        },
        {
          id: 'campanha_desativada',
          title: 'Campanha Inativa',
          priority: 5,
          active: false,
          messages: [{ id: 'm3', text: 'Mensagem desativada', category: 'general' as const, displayDurationSeconds: 5 }]
        }
      ]
    };

    (manager as any).currentManifest = mockManifest;

    // Testar com a data atual (Agosto de 2026)
    const testDate = new Date('2026-08-08T12:00:00Z');
    const activeCampaigns = manager.getActiveCampaigns(testDate);

    expect(activeCampaigns.length).toBe(1);
    expect(activeCampaigns[0].id).toBe('campanha_vigente');

    const activeMessages = manager.getActiveCampaignMessages(testDate);
    expect(activeMessages.length).toBe(1);
    expect(activeMessages[0].text).toBe('Mensagem atual');
  });

  it('deve ignorar mensagens inativas individualmente mesmo em campanhas ativas', () => {
    const manager = RemoteContentManager.getInstance();

    const mockManifest = {
      contentVersion: '2026.08.08.001',
      schemaVersion: '1.0',
      minExtensionVersion: '2.0.0',
      updatedAt: new Date().toISOString(),
      mascots: [
        {
          id: 'test_mascot',
          name: 'Test Mascot',
          version: '1.0.0',
          defaultSkin: 'default',
          skins: { default: { id: 'default', name: 'Default', type: 'svg' as const, src: '<svg></svg>', width: 64, height: 64 } }
        }
      ],
      campaigns: [
        {
          id: 'campanha_mista',
          title: 'Campanha Mista',
          priority: 5,
          active: true,
          messages: [
            { id: 'm_ativa', text: 'Mensagem Ativa', category: 'general' as const, displayDurationSeconds: 5, active: true },
            { id: 'm_inativa', text: 'Mensagem Inativa', category: 'general' as const, displayDurationSeconds: 5, active: false }
          ]
        }
      ]
    };

    (manager as any).currentManifest = mockManifest;

    const messages = manager.getActiveCampaignMessages(new Date());
    expect(messages.length).toBe(1);
    expect(messages[0].id).toBe('m_ativa');
  });
});
