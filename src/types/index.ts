/**
 * Tipos e Interfaces Fundamentais — Painel SIGSSe 2.0
 */

export type MascotState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'FALL' | 'CLIMB' | 'SLEEP' | 'CELEBRATE' | 'TRIP' | 'STRETCH' | 'SPEAKING' | 'DRAGGED';

export type MascotSkinType = 'gotinha' | 'robozinho_azul' | 'robozinho_rosa' | 'robozinho_verde' | 'gatinho_laranja' | 'gatinho_cinza' | 'gatinho_preto' | string;

export interface MascotSettings {
  mascotEnabled: boolean;
  mascotSkin: MascotSkinType;
  mascotCount: number; // 1 a 4 mascotes simultâneos
  speedMultiplier: number;
  size: number;
  opacity: number;
  callAwareness: boolean;
  campaignsEnabled: boolean;
  remoteContentAutoUpdate: boolean;
  lastUpdatedTimestamp?: number;
}

export interface MascotSkinDefinition {
  id: string;
  name: string;
  type: 'svg' | 'spritesheet' | 'image';
  src?: string; // SVG sanitizado ou DataURI/URL do PNG
  asset?: string; // Caminho relativo para o arquivo vetorial ou imagem estática
  width: number;
  height: number;
  // Propriedades para Spritesheet PNG
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
  columns?: number;
  rows?: number;
  fps?: number;
  loop?: boolean;
}

export interface MascotAnimationDefinition {
  id: string;
  name: string;
  type: 'spritesheet' | 'css_keyframe';
  src?: string;
  asset?: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  columns?: number;
  rows?: number;
  fps: number;
  loop: boolean;
  state?: MascotState;
}

export interface MascotDefinition {
  id: string;
  name: string;
  version: string;
  defaultSkin: string;
  skins: Record<string, MascotSkinDefinition>;
  animations?: Record<string, MascotAnimationDefinition>;
}

export interface CampaignMessage {
  id: string;
  text: string;
  category: 'prevention' | 'health_tip' | 'general' | 'vaccination';
  displayDurationSeconds: number;
  startDate?: string;
  endDate?: string;
  priority?: number;
  active?: boolean;
}

export interface CampaignDefinition {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  priority: number;
  active?: boolean;
  messages: CampaignMessage[];
}

export interface RemoteContentManifest {
  contentVersion: string;   // Formato YYYY.MM.DD.NNN (ex: 2026.08.08.001)
  schemaVersion: string;    // Major.minor do schema JSON (ex: 1.0)
  minExtensionVersion: string; // Versão mínima da extensão requerida (ex: 2.0.0)
  updatedAt: string;
  signature?: string;
  mascots: MascotDefinition[];
  campaigns: CampaignDefinition[];
}

export interface PanelElements {
  callingCard: HTMLElement | null;
  patientName: HTMLElement | null;
  localName: HTMLElement | null;
  professionalName: HTMLElement | null;
  historySection: HTMLElement | null;
  footerTicker: HTMLElement | null;
}

export interface CallReactionData {
  patient: string;
  local: string;
  professional: string;
}
