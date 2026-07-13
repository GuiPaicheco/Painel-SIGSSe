"use strict";
(() => {
  // src/core/config.ts
  var DEFAULT_SETTINGS = {
    mascotEnabled: true,
    mascotSkin: "gotinha",
    speedMultiplier: 1,
    size: 64,
    opacity: 0.9,
    callAwareness: true
  };
  var MascotConfigManager = class {
    /**
     * Obtém todas as configurações salvas ou retorna os valores padrão
     */
    static async load() {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => {
          resolve({
            ...DEFAULT_SETTINGS,
            ...items
          });
        });
      });
    }
    /**
     * Salva configurações genéricas
     */
    static async save(settings) {
      return new Promise((resolve) => {
        chrome.storage.local.set(settings, () => {
          resolve();
        });
      });
    }
    /**
     * Escuta alterações de configurações em tempo real
     */
    static onChange(callback) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local") {
          callback(changes);
        }
      });
    }
  };

  // src/ui/popup/popup.ts
  document.addEventListener("DOMContentLoaded", async () => {
    const settings = await MascotConfigManager.load();
    const toggleMascot = document.getElementById("toggle-mascot");
    const sliderSize = document.getElementById("slider-size");
    const sliderSpeed = document.getElementById("slider-speed");
    const sliderOpacity = document.getElementById("slider-opacity");
    const checkboxCall = document.getElementById("checkbox-call-awareness");
    const valSize = document.getElementById("val-size");
    const valSpeed = document.getElementById("val-speed");
    const valOpacity = document.getElementById("val-opacity");
    const skinCards = document.querySelectorAll(".skin-card");
    toggleMascot.checked = settings.mascotEnabled;
    sliderSize.value = String(settings.size);
    sliderSpeed.value = String(settings.speedMultiplier);
    sliderOpacity.value = String(settings.opacity);
    checkboxCall.checked = settings.callAwareness;
    updateReadouts(settings.size, settings.speedMultiplier, settings.opacity);
    setupActiveSkinCard(settings.mascotSkin);
    toggleControlStates(settings.mascotEnabled);
    toggleMascot.addEventListener("change", async () => {
      const enabled = toggleMascot.checked;
      toggleControlStates(enabled);
      await MascotConfigManager.save({ mascotEnabled: enabled });
    });
    sliderSize.addEventListener("input", async () => {
      const size = parseInt(sliderSize.value);
      valSize.textContent = `${size}px`;
      await MascotConfigManager.save({ size });
    });
    sliderSpeed.addEventListener("input", async () => {
      const speed = parseFloat(sliderSpeed.value);
      valSpeed.textContent = `${speed.toFixed(1)}x`;
      await MascotConfigManager.save({ speedMultiplier: speed });
    });
    sliderOpacity.addEventListener("input", async () => {
      const opacity = parseFloat(sliderOpacity.value);
      valOpacity.textContent = `${Math.round(opacity * 100)}%`;
      await MascotConfigManager.save({ opacity });
    });
    checkboxCall.addEventListener("change", async () => {
      const callAwareness = checkboxCall.checked;
      await MascotConfigManager.save({ callAwareness });
    });
    skinCards.forEach((card) => {
      card.addEventListener("click", async () => {
        if (toggleMascot.checked === false) return;
        skinCards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        const skin = card.getAttribute("data-skin");
        await MascotConfigManager.save({ mascotSkin: skin });
      });
    });
    function updateReadouts(size, speed, opacity) {
      valSize.textContent = `${size}px`;
      valSpeed.textContent = `${speed.toFixed(1)}x`;
      valOpacity.textContent = `${Math.round(opacity * 100)}%`;
    }
    function setupActiveSkinCard(activeSkin) {
      skinCards.forEach((card) => {
        const skin = card.getAttribute("data-skin");
        if (skin === activeSkin) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });
    }
    function toggleControlStates(enabled) {
      const opacityVal = enabled ? "1.0" : "0.4";
      const pointerEvents = enabled ? "auto" : "none";
      [sliderSize, sliderSpeed, sliderOpacity, checkboxCall].forEach((control) => {
        control.disabled = !enabled;
        control.parentElement.style.opacity = opacityVal;
      });
      const selectorPanel = document.querySelector(".skin-selector");
      if (selectorPanel) {
        selectorPanel.style.opacity = opacityVal;
        selectorPanel.style.pointerEvents = pointerEvents;
      }
    }
  });
})();
//# sourceMappingURL=popup.js.map
