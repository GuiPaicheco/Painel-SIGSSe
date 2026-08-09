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

  // src/content/fallbackManifest.ts
  var FALLBACK_MANIFEST = {
    contentVersion: "2026.08.08.001",
    schemaVersion: "1.0",
    minExtensionVersion: "2.0.0",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    mascots: [
      {
        id: "gotinha",
        name: "Z\xE9 Gotinha",
        version: "2.0.0",
        defaultSkin: "default",
        skins: {
          default: {
            id: "default",
            name: "Z\xE9 Gotinha Cl\xE1ssico",
            type: "svg",
            src: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 4 C32 4 12 28 12 42 A20 20 0 0 0 52 42 C52 28 32 4 32 4 Z" fill="#FFFFFF" stroke="#0288D1" stroke-width="3"/>
            <circle cx="25" cy="38" r="3" fill="#0288D1"/>
            <circle cx="39" cy="38" r="3" fill="#0288D1"/>
            <path d="M26 46 Q32 52 38 46" fill="none" stroke="#E53935" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M22 28 C26 24 38 24 42 28" fill="none" stroke="#0288D1" stroke-width="2" stroke-linecap="round"/>
          </svg>`,
            width: 64,
            height: 64
          }
        }
      },
      {
        id: "gatinho_laranja",
        name: "Gatinho Laranja",
        version: "2.0.0",
        defaultSkin: "default",
        skins: {
          default: {
            id: "default",
            name: "Gatinho Laranja",
            type: "svg",
            src: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 22 L24 8 L32 20 L40 8 L48 22 Z" fill="#FB8C00"/>
            <circle cx="32" cy="36" r="20" fill="#FB8C00"/>
            <circle cx="24" cy="32" r="3.5" fill="#212121"/>
            <circle cx="40" cy="32" r="3.5" fill="#212121"/>
            <polygon points="32,38 29,42 35,42" fill="#E91E63"/>
            <path d="M12 36 L22 36 M12 40 L22 39 M52 36 L42 36 M52 40 L42 39" stroke="#424242" stroke-width="2"/>
          </svg>`,
            width: 64,
            height: 64
          }
        }
      },
      {
        id: "robozinho_azul",
        name: "Robozinho Sa\xFAde",
        version: "2.0.0",
        defaultSkin: "default",
        skins: {
          default: {
            id: "default",
            name: "Robozinho Azul",
            type: "svg",
            src: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="16" width="32" height="28" rx="6" fill="#0288D1" stroke="#01579B" stroke-width="2"/>
            <rect x="22" y="22" width="20" height="12" rx="3" fill="#E0F7FA"/>
            <circle cx="27" cy="28" r="2.5" fill="#00C853"/>
            <circle cx="37" cy="28" r="2.5" fill="#00C853"/>
            <line x1="32" y1="6" x2="32" y2="16" stroke="#01579B" stroke-width="3"/>
            <circle cx="32" cy="6" r="4" fill="#FFD600"/>
            <rect x="20" y="48" width="8" height="10" fill="#0288D1"/>
            <rect x="36" y="48" width="8" height="10" fill="#0288D1"/>
          </svg>`,
            width: 64,
            height: 64
          }
        }
      }
    ],
    campaigns: [
      {
        id: "saude_preventiva",
        title: "Sa\xFAde Preventiva UBS Betim",
        priority: 1,
        messages: [
          {
            id: "msg_01",
            text: "Mantenha sua caderneta de vacina\xE7\xE3o sempre atualizada!",
            category: "vaccination",
            displayDurationSeconds: 7
          },
          {
            id: "msg_02",
            text: "Beba bastante \xE1gua diariamente para cuidar da sua sa\xFAde.",
            category: "health_tip",
            displayDurationSeconds: 6
          },
          {
            id: "msg_03",
            text: "Consulte seu m\xE9dico da UBS regularmente para exames preventivos.",
            category: "prevention",
            displayDurationSeconds: 8
          }
        ]
      }
    ]
  };

  // src/utils/svgSanitizer.ts
  var SvgSanitizer = class {
    static DANGEROUS_TAGS = ["script", "iframe", "embed", "object", "foreignobject", "base", "form", "input", "meta", "link"];
    static sanitize(svgContent) {
      if (!svgContent || typeof svgContent !== "string") {
        return "";
      }
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        if (doc.querySelector("parsererror")) {
          return this.regexFallbackSanitize(svgContent);
        }
        const svgNode = doc.querySelector("svg");
        if (!svgNode) {
          return "";
        }
        this.DANGEROUS_TAGS.forEach((tag) => {
          const elements = doc.querySelectorAll(tag);
          elements.forEach((el) => el.parentNode?.removeChild(el));
        });
        const allElements = doc.querySelectorAll("*");
        allElements.forEach((el) => {
          const attrs = Array.from(el.attributes);
          attrs.forEach((attr) => {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value.toLowerCase();
            if (attrName.startsWith("on")) {
              el.removeAttribute(attr.name);
            }
            if ((attrName === "href" || attrName === "xlink:href" || attrName === "src") && (attrValue.includes("javascript:") || attrValue.includes("data:text/html"))) {
              el.removeAttribute(attr.name);
            }
          });
        });
        return svgNode.outerHTML;
      } catch (e) {
        return this.regexFallbackSanitize(svgContent);
      }
    }
    static regexFallbackSanitize(raw) {
      return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/on\w+\s*=\s*(['"]).*?\1/gi, "").replace(/on\w+\s*=\s*[^>\s]+/gi, "").replace(/href\s*=\s*['"]javascript:.*?['"]/gi, "");
    }
  };

  // src/content/RemoteContentManager.ts
  var RemoteContentManager = class _RemoteContentManager {
    static instance = null;
    currentManifest = FALLBACK_MANIFEST;
    isFetching = false;
    listeners = /* @__PURE__ */ new Set();
    static QA_REMOTE_URL = "https://raw.githubusercontent.com/GuiPaicheco/Painel-SIGSSe/72d094acd648e4cbf3bd5327a8284ef9e238799f/content/manifest.json";
    static PROD_REMOTE_URL = "https://raw.githubusercontent.com/GuiPaicheco/Painel-SIGSSe/main/content/manifest.json";
    remoteUrl = _RemoteContentManager.QA_REMOTE_URL;
    constructor() {
      this.sanitizeManifestSkins(this.currentManifest);
    }
    static getInstance() {
      if (!_RemoteContentManager.instance) {
        _RemoteContentManager.instance = new _RemoteContentManager();
      }
      return _RemoteContentManager.instance;
    }
    setRemoteUrl(url) {
      this.remoteUrl = url;
    }
    getRemoteUrl() {
      return this.remoteUrl;
    }
    onUpdate(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    notifyUpdate() {
      this.listeners.forEach((fn) => {
        try {
          fn(this.currentManifest);
        } catch (e) {
          console.error("SIGSSe ContentManager: Erro ao notificar ouvinte de atualiza\xE7\xE3o:", e);
        }
      });
    }
    async init() {
      const cached = await this.loadFromLocalCache();
      if (cached && this.validateManifestSchema(cached)) {
        this.sanitizeManifestSkins(cached);
        this.currentManifest = cached;
      } else {
        this.sanitizeManifestSkins(FALLBACK_MANIFEST);
        this.currentManifest = FALLBACK_MANIFEST;
        await this.saveToLocalCache(FALLBACK_MANIFEST);
      }
      this.checkRemoteUpdateInBackground().catch((err) => {
        console.warn("SIGSSe ContentManager: Falha na verifica\xE7\xE3o de atualiza\xE7\xE3o remota:", err);
      });
      return this.currentManifest;
    }
    getManifest() {
      return this.currentManifest;
    }
    getMascots() {
      return this.currentManifest.mascots || FALLBACK_MANIFEST.mascots;
    }
    getMascotById(id) {
      return this.getMascots().find((m) => m && m.id === id) || FALLBACK_MANIFEST.mascots.find((m) => m.id === id);
    }
    getCampaigns() {
      return this.currentManifest.campaigns || FALLBACK_MANIFEST.campaigns;
    }
    getActiveCampaigns(referenceDate = /* @__PURE__ */ new Date()) {
      const campaigns = this.getCampaigns();
      if (!campaigns || campaigns.length === 0) return [];
      return campaigns.filter((c) => {
        if (!c) return false;
        if (c.active === false) return false;
        if (c.startDate) {
          const start = new Date(c.startDate);
          if (!isNaN(start.getTime()) && referenceDate < start) return false;
        }
        if (c.endDate) {
          const end = new Date(c.endDate);
          if (!isNaN(end.getTime()) && referenceDate > end) return false;
        }
        return true;
      });
    }
    getActiveCampaignMessages(referenceDate = /* @__PURE__ */ new Date()) {
      const activeCampaigns = this.getActiveCampaigns(referenceDate);
      const validMessages = [];
      activeCampaigns.forEach((c) => {
        if (!c.messages || !Array.isArray(c.messages)) return;
        c.messages.forEach((m) => {
          if (!m) return;
          if (m.active === false) return;
          if (m.startDate) {
            const start = new Date(m.startDate);
            if (!isNaN(start.getTime()) && referenceDate < start) return;
          }
          if (m.endDate) {
            const end = new Date(m.endDate);
            if (!isNaN(end.getTime()) && referenceDate > end) return;
          }
          validMessages.push(m);
        });
      });
      return validMessages;
    }
    getRandomCampaignMessage(referenceDate = /* @__PURE__ */ new Date()) {
      const messages = this.getActiveCampaignMessages(referenceDate);
      if (!messages || messages.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * messages.length);
      return messages[randomIndex];
    }
    validateManifestSchema(data) {
      if (!data || typeof data !== "object") return false;
      if (!data.contentVersion || typeof data.contentVersion !== "string") return false;
      if (!data.schemaVersion || typeof data.schemaVersion !== "string") return false;
      if (!Array.isArray(data.mascots) || data.mascots.length === 0) return false;
      for (const mascot of data.mascots) {
        if (!mascot || typeof mascot !== "object" || !mascot.id || typeof mascot.id !== "string") {
          return false;
        }
        if (!mascot.skins || typeof mascot.skins !== "object") {
          return false;
        }
        if (!mascot.skins.default || typeof mascot.skins.default !== "object" || !mascot.skins.default.src) {
          return false;
        }
      }
      return true;
    }
    async simulateRemoteUpdate(remoteData) {
      if (!this.validateManifestSchema(remoteData)) {
        console.warn("SIGSSe ContentManager: Simula\xE7\xE3o de atualiza\xE7\xE3o rejeitada por schema inv\xE1lido.");
        return false;
      }
      if (remoteData.contentVersion === this.currentManifest.contentVersion) {
        console.log("SIGSSe ContentManager: Simula\xE7\xE3o de atualiza\xE7\xE3o ignorada (mesma vers\xE3o).");
        return false;
      }
      console.log(`SIGSSe ContentManager: Aplicando atualiza\xE7\xE3o remota simulada (${remoteData.contentVersion})...`);
      this.sanitizeManifestSkins(remoteData);
      this.currentManifest = remoteData;
      await this.saveToLocalCache(remoteData);
      this.notifyUpdate();
      return true;
    }
    sanitizeManifestSkins(manifest) {
      if (!manifest || !manifest.mascots) return;
      manifest.mascots.forEach((mascot) => {
        if (mascot && mascot.skins) {
          Object.keys(mascot.skins).forEach((skinKey) => {
            const skin = mascot.skins[skinKey];
            if (skin && skin.type === "svg" && skin.src) {
              skin.src = SvgSanitizer.sanitize(skin.src);
            }
          });
        }
      });
    }
    async loadFromLocalCache() {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(["remote_content_manifest"], (result) => {
            if (result && result.remote_content_manifest) {
              resolve(result.remote_content_manifest);
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      });
    }
    async saveToLocalCache(manifest) {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ remote_content_manifest: manifest }, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
    async checkRemoteUpdateInBackground() {
      if (this.isFetching) return false;
      this.isFetching = true;
      try {
        console.log(`SIGSSe ContentManager: Verificando manifesto remoto real no GitHub Raw: ${this.remoteUrl}`);
        const response = await fetch(this.remoteUrl, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
        }
        const remoteData = await response.json();
        if (this.validateManifestSchema(remoteData)) {
          if (remoteData.contentVersion !== this.currentManifest.contentVersion) {
            console.log(`SIGSSe ContentManager: Nova vers\xE3o de conte\xFAdo remota recebida do GitHub (${remoteData.contentVersion}). Atualizando cache e notificando...`);
            this.sanitizeManifestSkins(remoteData);
            this.currentManifest = remoteData;
            await this.saveToLocalCache(remoteData);
            this.notifyUpdate();
            return true;
          } else {
            console.log(`SIGSSe ContentManager: Conte\xFAdo remoto em dia (${remoteData.contentVersion}). Nenhum update necess\xE1rio.`);
          }
        } else {
          console.warn("SIGSSe ContentManager: Conte\xFAdo remoto recebido possui schema inv\xE1lido. Mantendo fallback/cache anterior.");
        }
      } catch (e) {
        console.warn("SIGSSe ContentManager: Conex\xE3o remota indispon\xEDvel ou falhou. Mantendo estado offline seguro.");
      } finally {
        this.isFetching = false;
      }
      return false;
    }
  };

  // src/ui/popup/popup.ts
  var CampaignAdminHelper = class _CampaignAdminHelper {
    static calculateStatus(campaign, referenceDate = /* @__PURE__ */ new Date()) {
      if (campaign.active === false) {
        return { status: "INATIVA", badgeClass: "inativa" };
      }
      if (campaign.startDate) {
        const start = new Date(campaign.startDate);
        if (!isNaN(start.getTime()) && referenceDate < start) {
          return { status: "FUTURA", badgeClass: "futura" };
        }
      }
      if (campaign.endDate) {
        const end = new Date(campaign.endDate);
        if (!isNaN(end.getTime()) && referenceDate > end) {
          return { status: "EXPIRADA", badgeClass: "expirada" };
        }
      }
      return { status: "ATIVA", badgeClass: "ativa" };
    }
    static sortCampaigns(campaigns, referenceDate = /* @__PURE__ */ new Date()) {
      const getStatusWeight = (c) => {
        const { status } = _CampaignAdminHelper.calculateStatus(c, referenceDate);
        switch (status) {
          case "ATIVA":
            return 1e3 + (c.priority || 0);
          case "FUTURA":
            return 500 + (c.priority || 0);
          case "EXPIRADA":
            return 100 + (c.priority || 0);
          case "INATIVA":
            return 0 + (c.priority || 0);
        }
      };
      return [...campaigns].sort((a, b) => getStatusWeight(b) - getStatusWeight(a));
    }
    static sanitizeText(text) {
      if (!text) return "";
      const temp = document.createElement("div");
      temp.textContent = text;
      return temp.innerHTML;
    }
  };
  var PopupController = class {
    // Elementos do Tab 1 (Ajustes)
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
    // Elementos de Navegação por Abas
    tabBtnSettings = document.getElementById("tabBtnSettings");
    tabBtnCampaigns = document.getElementById("tabBtnCampaigns");
    tabSettings = document.getElementById("tabSettings");
    tabCampaigns = document.getElementById("tabCampaigns");
    // Elementos do Tab 2 (Admin Dashboard)
    metricTotal = document.getElementById("metricTotal");
    metricActive = document.getElementById("metricActive");
    metricFuture = document.getElementById("metricFuture");
    metricExpired = document.getElementById("metricExpired");
    metricInactive = document.getElementById("metricInactive");
    netIndicator = document.getElementById("netIndicator");
    adminStatusText = document.getElementById("adminStatusText");
    btnRefreshRemote = document.getElementById("btnRefreshRemote");
    refreshFeedback = document.getElementById("refreshFeedback");
    campaignListContainer = document.getElementById("campaignListContainer");
    mascotPreviewGrid = document.getElementById("mascotPreviewGrid");
    filterPills = document.querySelectorAll(".pill-btn");
    currentFilter = "all";
    currentSettings = null;
    async init() {
      this.currentSettings = await MascotConfigManager.load();
      this.populateUI(this.currentSettings);
      this.bindEvents();
      const remoteManager = RemoteContentManager.getInstance();
      await remoteManager.init();
      remoteManager.onUpdate(() => {
        this.refreshCampaignDashboard();
        this.renderMascotPreviews();
      });
      this.refreshCampaignDashboard();
      this.renderMascotPreviews();
    }
    populateUI(settings) {
      if (this.mascotEnabled) this.mascotEnabled.checked = settings.mascotEnabled;
      if (this.mascotSkin) this.mascotSkin.value = settings.mascotSkin;
      if (this.size) {
        this.size.value = settings.size.toString();
        if (this.sizeVal) this.sizeVal.textContent = `${settings.size}px`;
      }
      if (this.speedMultiplier) {
        this.speedMultiplier.value = settings.speedMultiplier.toString();
        if (this.speedVal) this.speedVal.textContent = `${settings.speedMultiplier.toFixed(1)}x`;
      }
      if (this.opacity) {
        this.opacity.value = settings.opacity.toString();
        if (this.opacityVal) this.opacityVal.textContent = `${Math.round(settings.opacity * 100)}%`;
      }
      if (this.callAwareness) this.callAwareness.checked = settings.callAwareness;
      if (this.campaignsEnabled) this.campaignsEnabled.checked = settings.campaignsEnabled;
      this.updateCountButtons(settings.mascotCount);
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
      if (this.tabBtnSettings && this.tabBtnCampaigns) {
        this.tabBtnSettings.addEventListener("click", () => this.switchTab("settings"));
        this.tabBtnCampaigns.addEventListener("click", () => this.switchTab("campaigns"));
      }
      this.filterPills.forEach((pill) => {
        pill.addEventListener("click", () => {
          this.filterPills.forEach((p) => p.classList.remove("active"));
          pill.classList.add("active");
          this.currentFilter = pill.getAttribute("data-filter") || "all";
          this.refreshCampaignDashboard();
        });
      });
      if (this.btnRefreshRemote) {
        this.btnRefreshRemote.addEventListener("click", () => this.handleRemoteCheck());
      }
      if (this.mascotEnabled) {
        this.mascotEnabled.addEventListener("change", () => {
          MascotConfigManager.save({ mascotEnabled: this.mascotEnabled.checked });
        });
      }
      if (this.mascotSkin) {
        this.mascotSkin.addEventListener("change", () => {
          MascotConfigManager.save({ mascotSkin: this.mascotSkin.value });
        });
      }
      this.countButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const count = parseInt(btn.getAttribute("data-count") || "1", 10);
          this.updateCountButtons(count);
          MascotConfigManager.save({ mascotCount: count });
        });
      });
      if (this.size) {
        this.size.addEventListener("input", () => {
          const val = parseInt(this.size.value, 10);
          if (this.sizeVal) this.sizeVal.textContent = `${val}px`;
          MascotConfigManager.save({ size: val });
        });
      }
      if (this.speedMultiplier) {
        this.speedMultiplier.addEventListener("input", () => {
          const val = parseFloat(this.speedMultiplier.value);
          if (this.speedVal) this.speedVal.textContent = `${val.toFixed(1)}x`;
          MascotConfigManager.save({ speedMultiplier: val });
        });
      }
      if (this.opacity) {
        this.opacity.addEventListener("input", () => {
          const val = parseFloat(this.opacity.value);
          if (this.opacityVal) this.opacityVal.textContent = `${Math.round(val * 100)}%`;
          MascotConfigManager.save({ opacity: val });
        });
      }
      if (this.callAwareness) {
        this.callAwareness.addEventListener("change", () => {
          MascotConfigManager.save({ callAwareness: this.callAwareness.checked });
        });
      }
      if (this.campaignsEnabled) {
        this.campaignsEnabled.addEventListener("change", () => {
          MascotConfigManager.save({ campaignsEnabled: this.campaignsEnabled.checked });
        });
      }
    }
    switchTab(tab) {
      if (tab === "settings") {
        this.tabBtnSettings.classList.add("active");
        this.tabBtnCampaigns.classList.remove("active");
        this.tabSettings.classList.add("active");
        this.tabCampaigns.classList.remove("active");
      } else {
        this.tabBtnSettings.classList.remove("active");
        this.tabBtnCampaigns.classList.add("active");
        this.tabSettings.classList.remove("active");
        this.tabCampaigns.classList.add("active");
        this.refreshCampaignDashboard();
        this.renderMascotPreviews();
      }
    }
    async handleRemoteCheck() {
      if (!this.refreshFeedback || !this.btnRefreshRemote) return;
      this.btnRefreshRemote.disabled = true;
      this.refreshFeedback.style.color = "#38bdf8";
      this.refreshFeedback.textContent = "Verificando atualiza\xE7\xF5es no GitHub...";
      try {
        const remoteManager = RemoteContentManager.getInstance();
        const updated = await remoteManager.checkRemoteUpdateInBackground();
        const manifest = remoteManager.getManifest();
        if (updated) {
          this.refreshFeedback.style.color = "#00E676";
          this.refreshFeedback.textContent = `Conte\xFAdo atualizado para a vers\xE3o ${manifest.contentVersion}!`;
        } else {
          this.refreshFeedback.style.color = "#94a3b8";
          this.refreshFeedback.textContent = `Conte\xFAdo j\xE1 est\xE1 na vers\xE3o mais recente (${manifest.contentVersion}).`;
        }
        this.refreshCampaignDashboard();
        this.renderMascotPreviews();
      } catch (err) {
        this.refreshFeedback.style.color = "#FF9800";
        this.refreshFeedback.textContent = "Falha na conex\xE3o remota \u2014 utilizando dados do cache local.";
      } finally {
        this.btnRefreshRemote.disabled = false;
      }
    }
    refreshCampaignDashboard() {
      const remoteManager = RemoteContentManager.getInstance();
      const manifest = remoteManager.getManifest();
      const campaigns = remoteManager.getCampaigns() || [];
      const now = /* @__PURE__ */ new Date();
      let countActive = 0;
      let countFuture = 0;
      let countExpired = 0;
      let countInactive = 0;
      campaigns.forEach((c) => {
        const { status } = CampaignAdminHelper.calculateStatus(c, now);
        switch (status) {
          case "ATIVA":
            countActive++;
            break;
          case "FUTURA":
            countFuture++;
            break;
          case "EXPIRADA":
            countExpired++;
            break;
          case "INATIVA":
            countInactive++;
            break;
        }
      });
      if (this.metricTotal) this.metricTotal.textContent = campaigns.length.toString();
      if (this.metricActive) this.metricActive.textContent = countActive.toString();
      if (this.metricFuture) this.metricFuture.textContent = countFuture.toString();
      if (this.metricExpired) this.metricExpired.textContent = countExpired.toString();
      if (this.metricInactive) this.metricInactive.textContent = countInactive.toString();
      if (this.adminStatusText) {
        this.adminStatusText.textContent = `Content Version: ${manifest.contentVersion}`;
      }
      if (this.syncStatus) {
        this.syncStatus.textContent = `Conte\xFAdo Remoto: Vers\xE3o ${manifest.contentVersion}`;
      }
      if (this.netIndicator) {
        this.netIndicator.className = "status-indicator online";
      }
      const filtered = campaigns.filter((c) => {
        const { status } = CampaignAdminHelper.calculateStatus(c, now);
        if (this.currentFilter === "active") return status === "ATIVA";
        if (this.currentFilter === "future") return status === "FUTURA";
        if (this.currentFilter === "expired") return status === "EXPIRADA";
        if (this.currentFilter === "inactive") return status === "INATIVA";
        return true;
      });
      const sorted = CampaignAdminHelper.sortCampaigns(filtered, now);
      this.renderCampaignList(sorted, now);
    }
    renderCampaignList(campaigns, referenceDate) {
      if (!this.campaignListContainer) return;
      if (campaigns.length === 0) {
        this.campaignListContainer.innerHTML = '<div class="empty-state">Nenhuma campanha encontrada para este filtro.</div>';
        return;
      }
      this.campaignListContainer.innerHTML = "";
      campaigns.forEach((c) => {
        const { status, badgeClass } = CampaignAdminHelper.calculateStatus(c, referenceDate);
        const card = document.createElement("div");
        card.className = "campaign-card";
        const titleSafe = CampaignAdminHelper.sanitizeText(c.title || c.id);
        const msgCount = c.messages ? c.messages.length : 0;
        const startText = c.startDate ? new Date(c.startDate).toLocaleDateString("pt-BR") : "Sem limite";
        const endText = c.endDate ? new Date(c.endDate).toLocaleDateString("pt-BR") : "Sem limite";
        card.innerHTML = `
        <div class="campaign-header-row">
          <span class="campaign-title">${titleSafe}</span>
          <span class="status-badge ${badgeClass}">${status}</span>
        </div>
        <div class="campaign-meta">
          <span>\u{1F4C5} Vig\xEAncia: ${startText} a ${endText}</span>
          <span>\u2B50 Prioridade: ${c.priority || 0}</span>
        </div>
        <button type="button" class="messages-toggle-btn">
          \u{1F4AC} ${msgCount} mensagem(ns) vinculada(s) \u25BC
        </button>
        <div class="messages-container" style="display: none;"></div>
      `;
        const toggleBtn = card.querySelector(".messages-toggle-btn");
        const messagesBox = card.querySelector(".messages-container");
        toggleBtn.addEventListener("click", () => {
          const isHidden = messagesBox.style.display === "none";
          messagesBox.style.display = isHidden ? "flex" : "none";
          toggleBtn.textContent = `\u{1F4AC} ${msgCount} mensagem(ns) vinculada(s) ${isHidden ? "\u25B2" : "\u25BC"}`;
          if (isHidden && messagesBox.children.length === 0 && c.messages) {
            c.messages.forEach((m) => {
              const msgEl = document.createElement("div");
              msgEl.className = "message-item";
              const textSafe = CampaignAdminHelper.sanitizeText(m.text);
              msgEl.innerHTML = `
              <div class="message-text">\u201C${textSafe}\u201D</div>
              <div class="message-meta">
                <span class="category-tag">#${m.category || "geral"}</span>
                <span>\u23F1\uFE0F ${m.displayDurationSeconds}s</span>
              </div>
            `;
              messagesBox.appendChild(msgEl);
            });
          }
        });
        this.campaignListContainer.appendChild(card);
      });
    }
    renderMascotPreviews() {
      if (!this.mascotPreviewGrid) return;
      const remoteManager = RemoteContentManager.getInstance();
      const mascots = remoteManager.getMascots() || [];
      this.mascotPreviewGrid.innerHTML = "";
      mascots.forEach((mascot) => {
        const tile = document.createElement("div");
        tile.className = "mascot-tile";
        let assetType = "SVG";
        let isSpritesheet = false;
        if (mascot.animations && Object.keys(mascot.animations).length > 0) {
          assetType = "SPRITESHEET";
          isSpritesheet = true;
        }
        let iconHtml = "\u{1F4A7}";
        if (mascot.id.includes("gatinho")) iconHtml = "\u{1F431}";
        if (mascot.id.includes("robo")) iconHtml = "\u{1F916}";
        const mascotNameSafe = CampaignAdminHelper.sanitizeText(mascot.name);
        tile.innerHTML = `
        <div class="mascot-tile-icon">${iconHtml}</div>
        <div class="mascot-tile-info">
          <div class="mascot-tile-name">${mascotNameSafe}</div>
          <span class="asset-badge ${isSpritesheet ? "spritesheet" : ""}">${assetType}</span>
        </div>
      `;
        this.mascotPreviewGrid.appendChild(tile);
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
