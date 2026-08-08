import { describe, it, expect, beforeEach } from 'vitest';
import { SigssPanelAdapter } from '../../src/utils/sigssPanelAdapter';

describe('SigssPanelAdapter DOM Parser', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('deve identificar corretamente a página de painel mockada', () => {
    document.body.innerHTML = `<div class="calling-card"><div id="current-patient">MARIA DA SILVA</div></div>`;
    expect(SigssPanelAdapter.isPanelPage()).toBe(true);
  });

  it('deve extrair paciente, sala e profissional através de seletores diretos', () => {
    document.body.innerHTML = `
      <div class="calling-card">
        <span id="current-patient">JOAO DA SILVA</span>
        <span id="current-local">CONSULTORIO 04</span>
        <span id="current-professional">DRA. ANA PAULA</span>
      </div>
    `;

    const elements = SigssPanelAdapter.getElements();
    expect(elements.patientName?.textContent).toBe('JOAO DA SILVA');
    expect(elements.localName?.textContent).toBe('CONSULTORIO 04');
    expect(elements.professionalName?.textContent).toBe('DRA. ANA PAULA');
  });

  it('deve extrair elementos via heurística de rótulos caso os seletores ID falhem', () => {
    document.body.innerHTML = `
      <div class="calling-card">
        <div>PACIENTE</div>
        <div>CARLOS ALBERTO</div>
        <div>LOCAL</div>
        <div>GUICHE 02</div>
      </div>
    `;

    const elements = SigssPanelAdapter.getElements();
    expect(elements.patientName?.textContent).toBe('CARLOS ALBERTO');
    expect(elements.localName?.textContent).toBe('GUICHE 02');
  });
});
