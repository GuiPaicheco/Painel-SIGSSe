import { describe, it, expect } from 'vitest';
import { compileContent } from '../../scripts/compile-content';
import { RemoteContentManager } from '../../src/content/RemoteContentManager';

describe('TASK-201 — Spritesheets PNG e Animações Frame-by-Frame', () => {
  it('deve compilar animações por spritesheet PNG e codificar em Data URI base64 no manifesto', () => {
    const compiled = compileContent();
    expect(compiled).toBeDefined();

    const zeGotinha = compiled.mascots.find(m => m.id === 'gotinha');
    expect(zeGotinha).toBeDefined();
    expect(zeGotinha?.animations).toBeDefined();
    expect(zeGotinha?.animations?.celebrate).toBeDefined();

    const celebrateAnim = zeGotinha?.animations?.celebrate;
    expect(celebrateAnim?.type).toBe('spritesheet');
    expect(celebrateAnim?.src).toMatch(/^data:image\/png;base64,/);
    expect(celebrateAnim?.frameWidth).toBe(64);
    expect(celebrateAnim?.frameCount).toBe(4);
    expect(celebrateAnim?.fps).toBe(8);
    expect(celebrateAnim?.state).toBe('CELEBRATE');
  });

  it('deve compilar a segunda animação declarativa do Robozinho sem alterar código TypeScript', () => {
    const compiled = compileContent();
    const robozinho = compiled.mascots.find(m => m.id === 'robozinho_azul');
    
    expect(robozinho).toBeDefined();
    expect(robozinho?.animations?.dance).toBeDefined();

    const danceAnim = robozinho?.animations?.dance;
    expect(danceAnim?.type).toBe('spritesheet');
    expect(danceAnim?.src).toMatch(/^data:image\/png;base64,/);
    expect(danceAnim?.fps).toBe(12);
    expect(danceAnim?.state).toBe('RUN');
  });

  it('deve manter resiliência de fallback para SVG quando o ativo por spritesheet estiver indisponível', () => {
    const manager = RemoteContentManager.getInstance();
    
    const mockManifest = {
      contentVersion: '2026.08.09.001',
      schemaVersion: '1.0',
      minExtensionVersion: '2.0.0',
      updatedAt: new Date().toISOString(),
      mascots: [
        {
          id: 'mascote_fallback',
          name: 'Mascote Fallback Test',
          version: '1.0.0',
          defaultSkin: 'default',
          skins: {
            default: {
              id: 'default',
              name: 'SVG Default Skin',
              type: 'svg' as const,
              src: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#0288D1"/></svg>',
              width: 64,
              height: 64
            }
          },
          animations: {
            bad_anim: {
              id: 'bad_anim',
              name: 'Animação sem imagem',
              type: 'spritesheet' as const,
              src: '', // Imagem quebrada ou ausente
              frameWidth: 64,
              frameHeight: 64,
              frameCount: 4,
              fps: 10,
              loop: true,
              state: 'CELEBRATE' as const
            }
          }
        }
      ],
      campaigns: []
    };

    (manager as any).currentManifest = mockManifest;
    const mascot = manager.getMascotById('mascote_fallback');

    expect(mascot).toBeDefined();
    expect(mascot?.skins.default.src).toContain('<svg');
  });
});
