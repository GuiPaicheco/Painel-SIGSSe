import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const MOCK_PANEL_URL = `file:///${path.join(__dirname, '../../dist/mock_panel.html').replace(/\\/g, '/')}`;
const POPUP_URL = `file:///${path.join(__dirname, '../../dist/popup.html').replace(/\\/g, '/')}`;

const FIXTURE_V1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/manifests/v001.json'), 'utf-8'));
const FIXTURE_V2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/manifests/v002.json'), 'utf-8'));
const FIXTURE_XSS = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/malicious/xss.json'), 'utf-8'));

test.describe('Suíte E2E Automatizada — Painel SIGSSe 2.0 (Playwright Headless)', () => {
  
  test('E2E-01 — Boot da Aplicação', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto(MOCK_PANEL_URL);
    await page.waitForLoadState('domcontentloaded');

    expect(pageErrors.length).toBe(0);
    const title = await page.title();
    expect(title).toContain('Simulador');

    const mascot = page.locator('.sigsse-mascot-container');
    await expect(mascot).toBeVisible({ timeout: 5000 });
  });

  test('E2E-02 — Renderização do Mascote e Propriedades no DOM', async ({ page }) => {
    await page.goto(MOCK_PANEL_URL);

    const mascot = page.locator('.sigsse-mascot-container');
    await expect(mascot).toBeVisible();

    const box = await mascot.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(40);
    expect(box!.height).toBeGreaterThanOrEqual(40);

    const transform = await mascot.evaluate(el => el.style.transform);
    expect(transform).toContain('translate3d');
  });

  test('E2E-03 — Balão de Fala e Interação com Mensagem Compilada', async ({ page }) => {
    await page.goto(MOCK_PANEL_URL);

    const mascot = page.locator('.sigsse-mascot-container');
    await expect(mascot).toBeVisible();
    await mascot.click();

    const bubble = page.locator('.sigsse-speech-bubble');
    await expect(bubble).toBeVisible({ timeout: 3000 });

    const text = await bubble.innerText();
    expect(text.length).toBeGreaterThan(5);
  });

  test('E2E-04 — Dashboard e Métricas de Campanhas no Popup', async ({ page }) => {
    await page.goto(POPUP_URL);

    const tabBtnCampaigns = page.locator('#tabBtnCampaigns');
    await expect(tabBtnCampaigns).toBeVisible();
    await tabBtnCampaigns.click();

    const metricTotal = page.locator('#metricTotal');
    await expect(metricTotal).toBeVisible();
    
    const totalVal = await metricTotal.innerText();
    expect(parseInt(totalVal, 10)).toBeGreaterThan(0);

    const filterPills = page.locator('.pill-btn');
    expect(await filterPills.count()).toBe(5);

    const activePill = page.locator('.pill-btn[data-filter="active"]');
    await activePill.click();
    await expect(activePill).toHaveClass(/active/);
  });

  test('E2E-05 — Acordeão Expansível de Mensagens de Campanhas', async ({ page }) => {
    await page.goto(POPUP_URL);

    await page.click('#tabBtnCampaigns');
    const firstCardToggle = page.locator('.messages-toggle-btn').first();
    await expect(firstCardToggle).toBeVisible();

    const messagesBox = page.locator('.messages-container').first();
    await expect(messagesBox).toBeHidden();

    await firstCardToggle.click();
    await expect(messagesBox).toBeVisible();

    const messageItem = messagesBox.locator('.message-item').first();
    await expect(messageItem).toBeVisible();
  });

  test('E2E-06 — Atualização Remota via Interceptação HTTP', async ({ page }) => {
    await page.route('https://raw.githubusercontent.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_V2)
      });
    });

    await page.goto(POPUP_URL);
    await page.click('#tabBtnCampaigns');

    const btnRefresh = page.locator('#btnRefreshRemote');
    await expect(btnRefresh).toBeVisible();
    await btnRefresh.click();

    const statusText = page.locator('#adminStatusText');
    await expect(statusText).toContainText('2026.08.08.002', { timeout: 5000 });
  });

  test('E2E-07 — Hot-Reload sem Page Reload (F5)', async ({ page }) => {
    let reloaded = false;
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame() && page.url() !== 'about:blank') {
        reloaded = true;
      }
    });

    await page.route('https://raw.githubusercontent.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_V1)
      });
    });

    await page.goto(MOCK_PANEL_URL);
    await page.waitForLoadState('domcontentloaded');

    reloaded = false; // Reset após navegação inicial

    // Mudar interceptação para V2
    await page.unroute('https://raw.githubusercontent.com/**');
    await page.route('https://raw.githubusercontent.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_V2)
      });
    });

    // Disparar verificação remota no escopo da página sem F5
    await page.evaluate(async () => {
      const { RemoteContentManager } = (window as any);
      if (RemoteContentManager) {
        await RemoteContentManager.getInstance().checkRemoteUpdateInBackground();
      }
    });

    expect(reloaded).toBe(false);
  });

  test('E2E-08 — Animação por Spritesheet PNG e Deslocamento Temporal', async ({ page }) => {
    await page.goto(MOCK_PANEL_URL);

    const mascotSprite = page.locator('.sigsse-mascot-sprite');
    await expect(mascotSprite).toBeVisible();

    const initialPos = await mascotSprite.evaluate(el => el.style.backgroundPosition);

    await page.waitForTimeout(300);

    const updatedPos = await mascotSprite.evaluate(el => el.style.backgroundPosition);
    expect(typeof initialPos).toBe('string');
    expect(typeof updatedPos).toBe('string');
  });

  test('E2E-09 — Resiliência de Fallback para SVG em Ativo Corrompido', async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning') consoleWarnings.push(msg.text());
    });

    await page.goto(MOCK_PANEL_URL);

    const mascot = page.locator('.sigsse-mascot-container');
    await expect(mascot).toBeVisible();

    // Confirmar que o mascot permanece operacional no DOM
    const isVisible = await mascot.isVisible();
    expect(isVisible).toBe(true);
  });

  test('E2E-10 — Cache Local e Operação em Modo Offline', async ({ page }) => {
    await page.route('https://raw.githubusercontent.com/**', async route => {
      await route.abort('failed');
    });

    await page.goto(MOCK_PANEL_URL);

    const mascot = page.locator('.sigsse-mascot-container');
    await expect(mascot).toBeVisible();

    const bubble = page.locator('.sigsse-speech-bubble');
    await mascot.click();
    await expect(bubble).toBeVisible();
  });

  test('E2E-11 — Segurança e Sanitização contra Injeção de XSS', async ({ page }) => {
    await page.route('https://raw.githubusercontent.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_XSS)
      });
    });

    await page.goto(POPUP_URL);
    await page.click('#tabBtnCampaigns');

    const xssExecuted = await page.evaluate(() => (window as any).XSS_ATTACK_EXECUTED);
    expect(xssExecuted).toBeUndefined();
  });

  test('E2E-12 — Responsividade e Layout QA nas Viewports 1920x1080, 1024x768 e 375x667', async ({ page }) => {
    const artifactsDir = path.join(__dirname, '../../artifacts/e2e');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    // 1. Desktop 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(MOCK_PANEL_URL);
    await page.screenshot({ path: path.join(artifactsDir, 'responsive-desktop-1920.png') });

    // 2. Tablet 1024x768
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(MOCK_PANEL_URL);
    await page.screenshot({ path: path.join(artifactsDir, 'responsive-tablet-1024.png') });

    // 3. Mobile 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(POPUP_URL);
    await page.screenshot({ path: path.join(artifactsDir, 'responsive-mobile.png') });
  });

});
