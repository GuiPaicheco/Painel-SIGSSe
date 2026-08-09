import { describe, it, expect } from 'vitest';
import { CampaignAdminHelper } from '../../src/ui/popup/popup';
import { CampaignDefinition } from '../../src/types';

describe('TASK-202 — Painel Administrativo de Campanhas e Agendamento por Data', () => {
  const refDate = new Date('2026-08-09T12:00:00Z');

  it('deve identificar status ATIVA para campanhas vigentes no período atual', () => {
    const campaign: CampaignDefinition = {
      id: 'campanha_ativa',
      title: 'Campanha Ativa Teste',
      priority: 10,
      active: true,
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
      messages: []
    };

    const statusObj = CampaignAdminHelper.calculateStatus(campaign, refDate);
    expect(statusObj.status).toBe('ATIVA');
    expect(statusObj.badgeClass).toBe('ativa');
  });

  it('deve identificar status FUTURA para campanhas com startDate posterior à data de referência', () => {
    const campaign: CampaignDefinition = {
      id: 'campanha_futura',
      title: 'Campanha Futura Teste',
      priority: 5,
      active: true,
      startDate: '2027-01-01T00:00:00Z',
      endDate: '2027-12-31T23:59:59Z',
      messages: []
    };

    const statusObj = CampaignAdminHelper.calculateStatus(campaign, refDate);
    expect(statusObj.status).toBe('FUTURA');
    expect(statusObj.badgeClass).toBe('futura');
  });

  it('deve identificar status EXPIRADA para campanhas com endDate anterior à data de referência', () => {
    const campaign: CampaignDefinition = {
      id: 'campanha_expirada',
      title: 'Campanha Expirada Teste',
      priority: 5,
      active: true,
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      messages: []
    };

    const statusObj = CampaignAdminHelper.calculateStatus(campaign, refDate);
    expect(statusObj.status).toBe('EXPIRADA');
    expect(statusObj.badgeClass).toBe('expirada');
  });

  it('deve priorizar status INATIVA quando active for false, independente das datas', () => {
    const campaign: CampaignDefinition = {
      id: 'campanha_inativa',
      title: 'Campanha Inativa Teste',
      priority: 99,
      active: false,
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
      messages: []
    };

    const statusObj = CampaignAdminHelper.calculateStatus(campaign, refDate);
    expect(statusObj.status).toBe('INATIVA');
    expect(statusObj.badgeClass).toBe('inativa');
  });

  it('deve ordenar campanhas por relevância (Ativa > Prioridade > Futura > Expirada > Inativa)', () => {
    const campaigns: CampaignDefinition[] = [
      { id: 'c_expirada', title: 'Expirada', priority: 50, active: true, endDate: '2025-01-01Z', messages: [] },
      { id: 'c_ativa_pior', title: 'Ativa Pior', priority: 1, active: true, startDate: '2026-01-01Z', endDate: '2026-12-31Z', messages: [] },
      { id: 'c_ativa_top', title: 'Ativa Top', priority: 100, active: true, startDate: '2026-01-01Z', endDate: '2026-12-31Z', messages: [] },
      { id: 'c_futura', title: 'Futura', priority: 20, active: true, startDate: '2027-01-01Z', messages: [] }
    ];

    const sorted = CampaignAdminHelper.sortCampaigns(campaigns, refDate);
    expect(sorted[0].id).toBe('c_ativa_top');
    expect(sorted[1].id).toBe('c_ativa_pior');
    expect(sorted[2].id).toBe('c_futura');
    expect(sorted[3].id).toBe('c_expirada');
  });

  it('deve sanitizar adequadamente qualquer tentativa de XSS em títulos ou textos de mensagens', () => {
    const malicioText = '<script>alert("XSS")</script><b>Vacinação</b>';
    const sanitized = CampaignAdminHelper.sanitizeText(malicioText);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;script&gt;');
  });
});
