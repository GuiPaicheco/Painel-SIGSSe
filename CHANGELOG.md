# Changelog — Painel SIGSSe

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [2.0.0] - 2026-08-09

### 🚀 Added
- **Content Authoring System Declarativo (`content/`)**:
  - Estruturação modular da autoria de mascotes (`content/mascots/`), mensagens (`content/messages/`) e campanhas agendadas (`content/campaigns/`).
  - Compilador de conteúdo estático `scripts/compile-content.js` com validação de esquema JSON, integridade referencial e sanitização gráfica.
  - Suporte a agendamento por janela de vigência temporal (`startDate` / `endDate`) e prioridade numérica (`priority`).
- **Suporte a Spritesheets PNG e Animações Frame-by-Frame**:
  - Renderização de atlas de quadros PNG em `MascotRenderer.ts` integrados aos estados da FSM (`CELEBRATE`, `RUN`, `IDLE`, etc.).
  - Conversão automatizada de PNGs em Data URIs base64 no manifesto estático.
  - Mecanismo de **fallback resiliente para SVG** em caso de ativo corrompido ou indisponível.
- **Painel Administrativo no Popup (`src/ui/popup/`)**:
  - Dashboard de Métricas: Total de campanhas, ativas, futuras, expiradas e inativas.
  - Pílulas de filtro por estado temporal (`[ Todas ] [ Ativas ] [ Futuras ] [ Expiradas ] [ Inativas ]`).
  - Lista expansível de campanhas com acordeão detalhando frases, durações e categorias.
  - Botão de verificação de atualização remota `↻ Verificar Remoto` consumindo o `RemoteContentManager`.
  - Preview de mascotes registradas com indicativo visual de ativo (`SVG` / `SPRITESHEET`).
- **Suíte E2E Automatizada com Playwright Headless**:
  - 12 cenários de teste E2E executados em Chromium Headless cobrindo Boot, Mascote DOM, Balões de Fala, Dashboard, Acordeão, Interceptação HTTP Remota, Hot-Reload sem F5, Spritesheets, Fallback SVG, Offline Cache, Anti-XSS e Responsividade (`1920x1080`, `1024x768`, `375x667`).

### 🔄 Changed
- Refatoração da arquitetura em camadas (`Core Engine`, `Content Manager`, `Mascot System`, `UI/Browser Layer`).
- Atualização do `RemoteContentManager` para suporte a consumo direto via GitHub Raw (`https://raw.githubusercontent.com/...`) com cache local em `chrome.storage.local`.
- Refatoração de `MascotRenderer.ts` com remoção estrita de ouvintes globais para prevenção de vazamento de memória.

### 🛡️ Security
- Aplicação do sanitizador rígido `SvgSanitizer` que remove `<script>`, atributos `on*` e `javascript:`.
- Garantia de **100% Read-Only em relação ao SIGSS**: O adaptador opera em modo estritamente passivo de observação do DOM, sem mutação ou gravação em banco de dados clínico.
- Sanitização de texto via DOM nativo (`textContent`) no Popup contra ataques XSS.

### 🧪 Testing
- Mantida suíte unitária Vitest com 27 testes em 8 arquivos (100% aprovados).
- Adicionada suíte Playwright E2E com 12 cenários automatizados em Chromium Headless (100% aprovados).

---

## [1.0.0] - Legado

- Versão legada inicial em script único.
