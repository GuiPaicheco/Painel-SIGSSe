import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MascotEngine } from '../../src/mascot/MascotEngine';
import { MascotRenderer } from '../../src/mascot/MascotRenderer';

describe('MascotRenderer Memory Leak Cleanup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('deve remover todos os event listeners ao chamar destroy()', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const engine = new MascotEngine();
    const renderer = new MascotRenderer(engine);

    const container = document.querySelector('.sigsse-mascot-container');
    expect(container).not.toBeNull();

    // Executar destruição
    renderer.destroy();

    // Verificar se a remoção de listeners do window foi acionada para mousemove e mouseup
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(document.querySelector('.sigsse-mascot-container')).toBeNull();

    removeEventListenerSpy.mockRestore();
  });
});
