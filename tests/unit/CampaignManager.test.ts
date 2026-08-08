import { describe, it, expect } from 'vitest';
import { CampaignManager } from '../../src/campaign/CampaignManager';

describe('CampaignManager & Security', () => {
  const manager = CampaignManager.getInstance();

  it('deve sanitizar marcadores XSS em textos de campanha', () => {
    const maliciousInput = '<script>alert("XSS")</script> <b>Vacina!</b>';
    const sanitized = manager.sanitizeText(maliciousInput);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;script&gt;');
  });

  it('deve retornar mensagem válida do provedor de campanha', () => {
    const msg = manager.getNextMessage();
    expect(msg).not.toBeNull();
    expect(msg?.text).toBeDefined();
  });
});
