# Arquitetura do Sistema — Painel SIGSSe 2.0

> **Status**: Proposta Arquitetural Principal  
> **Autor**: Arquiteto Principal & Orquestrador Técnico  
> **Alvo**: Produção (Substituição Integral do Sistema Legado)

---

## 1. Visão Geral da Arquitetura

O **Painel SIGSSe 2.0** é uma plataforma de mascotes interativos e exibição contextual de campanhas de saúde para o painel de chamadas do sistema SIGSS (Unique Panel / MV).

A nova arquitetura adota o padrão **Clean Architecture + Component-Based Engine**, com desacoplamento rigoroso entre a camada de extensão do navegador, o motor de física/animação, a camada de integração DOM com o SIGSS e o gerenciador de conteúdo remoto com fallback offline resiliênte.

```mermaid
graph TD
    subgraph Browser / Extension Layer [Extensão Manifest V3]
        CS[Content Script: core.ts]
        BG[Background Service Worker]
        POP[Popup UI Config]
    end

    subgraph Core Engine Module
        CE[Core Engine Coordinator]
        SIG[SIGSS DOM Adapter]
        MS[Mascot System]
        AS[Animation System]
        MSG[Message & Campaign System]
    end

    subgraph Content & Configuration Layer
        CM[Content Manager]
        RC[Remote Config Manager]
        GHP[GitHub Content Provider]
        CACHE[Cache Manager: IndexedDB/Storage]
        FB[Fallback Content Provider: Local Bundle]
    end

    subgraph Security & Audit Layer
        SEC[Sanitizer & Validator]
        LOG[Logger & Telemetry]
    end

    POP -->|Mensagens Chrome| BG
    BG -->|StorageSync/Local| CS
    CS --> CE
    CE --> SIG
    CE --> MS
    MS --> AS
    CE --> MSG
    
    CM --> RC
    RC --> GHP
    GHP -->|Fetch JSON/Assets| CACHE
    CACHE -->|Miss / Timeout| FB
    CM --> SEC
    CE --> LOG
```

---

## 2. Detalhamento dos Componentes Principais

### 2.1 Core Engine (`src/core/CoreEngine.ts`)
- **Responsabilidade**: Orquestra o ciclo de vida do sistema, escuta mutações do DOM e eventos da extensão, coordena o loop de animação (`requestAnimationFrame`) e distribui estados para os mascotes ativos.
- **Isolamento**: Não manipula diretamente o DOM do SIGSS nem faz fetches remotos. Comunica-se via interfaces (`ISigssAdapter`, `IContentProvider`, `IMascotController`).

### 2.2 Content Manager & Remote Configuration (`src/content/`)
- **Responsabilidade**: Gerencia o ciclo de atualização de conteúdos (mensagens, campanhas, mascotes, skins e animações).
- **Provedores**:
  1. **GitHub Content Provider**: Consulta o repositório remoto ou CDN Raw (`raw.githubusercontent.com` ou Cloudflare Pages / GitHub Pages) buscando a versão `latest.json`.
  2. **Cache Manager**: Armazena em `chrome.storage.local` / `IndexedDB` a última versão válida do conteúdo e os assets binários (PNG, SVG, áudio).
  3. **Fallback Provider**: Se o servidor remoto falhar ou o cliente estiver offline, carrega instantaneamente os assets locais empacotados no bundle da extensão (`assets/fallback/`).

### 2.3 Mascot & Animation System (`src/mascot/`)
- **Responsabilidade**: Gerencia instâncias físicas de mascotes, gravidade, movimentação no topo das janelas/elementos do SIGSS e troca dinâmica de skins.
- **Skin System**: Suporta skins vetoriais (SVG), spritesheets (PNG) e customizações de cores/acessórios.
- **Animation System**: Máquina de estados finitos (FSM) que controla animações como: `IDLE`, `WALK`, `RUN`, `CELEBRATE` (quando paciente é chamado), `TALK` (exibindo balão de campanha) e `SLEEP`.

### 2.4 SIGSS Integration Adapter (`src/adapter/`)
- **Responsabilidade**: Abstrai as consultas ao DOM do painel oficial e do mock local.
- **Recursos**:
  - Seletores diretos e heurísticas resilientes baseadas na hierarquia estrutural da página.
  - Observador de chamadas via `MutationObserver` no container do paciente ativo.
  - Cálculo de caixas de colisão físicas (rects de guichê, cabeçalho e histórico) para evitar que o mascote sobreponha dados médicos críticos.

### 2.5 Message & Campaign System (`src/campaign/`)
- **Responsabilidade**: Seleciona e exibe mensagens dinâmicas de conscientização em saúde (ex: Zé Gotinha, Novembro Azul, Outubro Rosa, Dicas de Nutrição).
- **Recursos**:
  - Filtragem por data, prioridade e categoria.
  - Validação de segurança (sanitização contra XSS em balões de texto).

---

## 3. Fluxo de Atualização Automática de Conteúdo Remoto

```mermaid
sequenceDiagram
    participant CS as Content Script
    participant CM as Content Manager
    participant CACHE as Local Cache
    participant GH as Remote CDN / GitHub Raw
    participant FB as Local Fallback

    CS->>CM: init()
    CM->>CACHE: loadCachedManifest()
    alt Cache Válido
        CACHE-->>CM: Retorna Manifesto Local
    else Cache Ausente
        CM->>FB: loadBundledManifest()
        FB-->>CM: Retorna Manifesto Nativo
    end

    CM->>CS: Renderiza Mascote Imediatamente (Zero Lag)

    rect rgb(240, 240, 240)
        Note over CM,GH: Checagem em Background (Assíncrona)
        CM->>GH: fetch("manifest.json")
        alt HTTP 200 & Assinatura/Versão OK
            GH-->>CM: Novo Manifesto Remote (v2.1)
            CM->>CACHE: updateCache(v2.1)
            CM->>CS: applyLiveContentUpdate()
        else Erro de Conexão ou Hash Inválido
            GH-->>CM: Timeout / Error
            CM->>CM: Mantém Versão Atual sem Interrupção
        end
    end
```

---

## 4. Requisitos Tecnológicos e Ferramentas

- **Linguagem**: TypeScript 5.4+ (Strict Mode)
- **Bundler**: esbuild / Vite
- **Testes Unitários**: Vitest
- **Testes Visuais & E2E**: Playwright (executando em ambiente Chrome headless com `mock_panel.html`)
- **Linting & Formatação**: ESLint + Prettier
- **Browser Target**: Chrome Manifest V3 (Chrome 100+)
