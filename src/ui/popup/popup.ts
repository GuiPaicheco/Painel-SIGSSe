import { MascotConfigManager, MascotSettings } from '../../core/config';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Carregar Configurações Atuais
  const settings = await MascotConfigManager.load();

  // 2. Obter Elementos do DOM
  const toggleMascot = document.getElementById('toggle-mascot') as HTMLInputElement;
  const sliderCount = document.getElementById('slider-count') as HTMLInputElement;
  const sliderSize = document.getElementById('slider-size') as HTMLInputElement;
  const sliderSpeed = document.getElementById('slider-speed') as HTMLInputElement;
  const sliderOpacity = document.getElementById('slider-opacity') as HTMLInputElement;
  const checkboxCall = document.getElementById('checkbox-call-awareness') as HTMLInputElement;
  const btnAccess = document.getElementById('btn-access-panel') as HTMLButtonElement;
  
  const valCount = document.getElementById('val-count') as HTMLElement;
  const valSize = document.getElementById('val-size') as HTMLElement;
  const valSpeed = document.getElementById('val-speed') as HTMLElement;
  const valOpacity = document.getElementById('val-opacity') as HTMLElement;
  const skinCards = document.querySelectorAll('.skin-card');

  // 3. Preencher Valores Iniciais nos Controles
  toggleMascot.checked = settings.mascotEnabled;
  sliderCount.value = String(settings.mascotCount || 1);
  sliderSize.value = String(settings.size);
  sliderSpeed.value = String(settings.speedMultiplier);
  sliderOpacity.value = String(settings.opacity);
  checkboxCall.checked = settings.callAwareness;

  updateReadouts(settings.mascotCount || 1, settings.size, settings.speedMultiplier, settings.opacity);
  setupActiveSkinCard(settings.mascotSkin);

  // Desativar controles visuais se o mascote estiver desabilitado globalmente
  toggleControlStates(settings.mascotEnabled);

  // 4. Registrar Listeners de Eventos

  // Toggle Geral
  toggleMascot.addEventListener('change', async () => {
    const enabled = toggleMascot.checked;
    toggleControlStates(enabled);
    await MascotConfigManager.save({ mascotEnabled: enabled });
  });

  // Slider Quantidade de Mascotes
  sliderCount.addEventListener('input', async () => {
    const mascotCount = parseInt(sliderCount.value);
    valCount.textContent = String(mascotCount);
    await MascotConfigManager.save({ mascotCount });
  });

  // Slider Tamanho
  sliderSize.addEventListener('input', async () => {
    const size = parseInt(sliderSize.value);
    valSize.textContent = `${size}px`;
    await MascotConfigManager.save({ size });
  });

  // Slider Velocidade
  sliderSpeed.addEventListener('input', async () => {
    const speed = parseFloat(sliderSpeed.value);
    valSpeed.textContent = `${speed.toFixed(1)}x`;
    await MascotConfigManager.save({ speedMultiplier: speed });
  });

  // Slider Opacidade
  sliderOpacity.addEventListener('input', async () => {
    const opacity = parseFloat(sliderOpacity.value);
    valOpacity.textContent = `${Math.round(opacity * 100)}%`;
    await MascotConfigManager.save({ opacity });
  });

  // Checkbox Chamada
  checkboxCall.addEventListener('change', async () => {
    const callAwareness = checkboxCall.checked;
    await MascotConfigManager.save({ callAwareness });
  });

  // Botão Acessar Painel Oficial
  btnAccess.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'http://sigss.betim.mg.gov.br/unique-panel/panel-screen/94afeb1a-5112-4d61-bce8-dbf8f5b0a03d'
    });
  });

  // Cards de Seleção de Mascote
  skinCards.forEach(card => {
    card.addEventListener('click', async () => {
      if (toggleMascot.checked === false) return; // Ignora se desativado

      skinCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      const skin = card.getAttribute('data-skin') as any;
      await MascotConfigManager.save({ mascotSkin: skin });
    });
  });

  // --- Funções Auxiliares ---

  function updateReadouts(count: number, size: number, speed: number, opacity: number) {
    valCount.textContent = String(count);
    valSize.textContent = `${size}px`;
    valSpeed.textContent = `${speed.toFixed(1)}x`;
    valOpacity.textContent = `${Math.round(opacity * 100)}%`;
  }

  function setupActiveSkinCard(activeSkin: string) {
    skinCards.forEach(card => {
      const skin = card.getAttribute('data-skin');
      if (skin === activeSkin) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  function toggleControlStates(enabled: boolean) {
    const opacityVal = enabled ? '1.0' : '0.4';
    const pointerEvents = enabled ? 'auto' : 'none';

    // Desativa sliders, checkbox e cards de skin visualmente
    [sliderCount, sliderSize, sliderSpeed, sliderOpacity, checkboxCall].forEach(control => {
      control.disabled = !enabled;
      (control.parentElement as HTMLElement).style.opacity = opacityVal;
    });

    const selectorPanel = document.querySelector('.skin-selector') as HTMLElement;
    if (selectorPanel) {
      selectorPanel.style.opacity = opacityVal;
      selectorPanel.style.pointerEvents = pointerEvents;
    }
  }
});
