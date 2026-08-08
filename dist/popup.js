"use strict";
(() => {
  // src/core/config.ts
  var DEFAULT_SETTINGS = {
    mascotEnabled: true,
    mascotSkin: "gotinha",
    mascotCount: 1,
    speedMultiplier: 1,
    size: 64,
    opacity: 0.9,
    callAwareness: true,
    campaignsEnabled: true,
    remoteContentAutoUpdate: true,
    lastUpdatedTimestamp: Date.now()
  };
  var MascotConfigManager = class {
    /**
     * Obtém todas as configurações salvas ou retorna os valores padrão
     */
    static async load() {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(null, (items) => {
            resolve({
              ...DEFAULT_SETTINGS,
              ...items
            });
          });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      });
    }
    /**
     * Salva configurações parciais ou completas
     */
    static async save(settings) {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ ...settings, lastUpdatedTimestamp: Date.now() }, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
    /**
     * Escuta alterações de configurações em tempo real
     */
    static onChange(callback) {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === "local") {
            callback(changes);
          }
        });
      }
    }
  };

  // src/ui/popup/popup.ts
  var PopupController = class {
    mascotEnabled = document.getElementById("mascotEnabled");
    mascotSkin = document.getElementById("mascotSkin");
    size = document.getElementById("size");
    sizeVal = document.getElementById("sizeVal");
    speedMultiplier = document.getElementById("speedMultiplier");
    speedVal = document.getElementById("speedVal");
    opacity = document.getElementById("opacity");
    opacityVal = document.getElementById("opacityVal");
    callAwareness = document.getElementById("callAwareness");
    campaignsEnabled = document.getElementById("campaignsEnabled");
    countButtons = document.querySelectorAll(".btn-count");
    syncStatus = document.getElementById("syncStatus");
    currentSettings = null;
    async init() {
      this.currentSettings = await MascotConfigManager.load();
      this.populateUI(this.currentSettings);
      this.bindEvents();
    }
    populateUI(settings) {
      this.mascotEnabled.checked = settings.mascotEnabled;
      this.mascotSkin.value = settings.mascotSkin;
      this.size.value = settings.size.toString();
      this.sizeVal.textContent = `${settings.size}px`;
      this.speedMultiplier.value = settings.speedMultiplier.toString();
      this.speedVal.textContent = `${settings.speedMultiplier.toFixed(1)}x`;
      this.opacity.value = settings.opacity.toString();
      this.opacityVal.textContent = `${Math.round(settings.opacity * 100)}%`;
      this.callAwareness.checked = settings.callAwareness;
      this.campaignsEnabled.checked = settings.campaignsEnabled;
      this.updateCountButtons(settings.mascotCount);
      if (this.syncStatus) {
        this.syncStatus.textContent = "Conte\xFAdo Remoto: Sincronizado (v2.0.0)";
      }
    }
    updateCountButtons(activeCount) {
      this.countButtons.forEach((btn) => {
        const count = parseInt(btn.getAttribute("data-count") || "1", 10);
        if (count === activeCount) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }
    bindEvents() {
      this.mascotEnabled.addEventListener("change", () => {
        MascotConfigManager.save({ mascotEnabled: this.mascotEnabled.checked });
      });
      this.mascotSkin.addEventListener("change", () => {
        MascotConfigManager.save({ mascotSkin: this.mascotSkin.value });
      });
      this.countButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const count = parseInt(btn.getAttribute("data-count") || "1", 10);
          this.updateCountButtons(count);
          MascotConfigManager.save({ mascotCount: count });
        });
      });
      this.size.addEventListener("input", () => {
        const val = parseInt(this.size.value, 10);
        this.sizeVal.textContent = `${val}px`;
        MascotConfigManager.save({ size: val });
      });
      this.speedMultiplier.addEventListener("input", () => {
        const val = parseFloat(this.speedMultiplier.value);
        this.speedVal.textContent = `${val.toFixed(1)}x`;
        MascotConfigManager.save({ speedMultiplier: val });
      });
      this.opacity.addEventListener("input", () => {
        const val = parseFloat(this.opacity.value);
        this.opacityVal.textContent = `${Math.round(val * 100)}%`;
        MascotConfigManager.save({ opacity: val });
      });
      this.callAwareness.addEventListener("change", () => {
        MascotConfigManager.save({ callAwareness: this.callAwareness.checked });
      });
      this.campaignsEnabled.addEventListener("change", () => {
        MascotConfigManager.save({ campaignsEnabled: this.campaignsEnabled.checked });
      });
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    const popup = new PopupController();
    popup.init().catch((err) => {
      console.error("Erro ao inicializar Popup Controller:", err);
    });
  });
})();
//# sourceMappingURL=popup.js.map
