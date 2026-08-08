# Plano de Implementação Detalhado — Painel SIGSSe 2.0

> **Status**: Proposta Inicial de Implementação  
> **Responsável Técnico**: Arquiteto Principal & Orquestrador  
> **Objetivo**: Substituição completa da versão antiga por uma nova arquitetura modular, testada, com suporte a conteúdo remoto e multiagentes.

---

## User Review Required

> [!IMPORTANT]
> **Substituição da Versão Legada**: O projeto atual continha uma implementação monolítica com dados de skins e mascotes hardcoded dentro de `MascotRenderer.ts`. A nova proposta substitui completamente essa estrutura por uma arquitetura modular em camadas, mantendo o `sigssPanelAdapter.ts` e a ideia do `mock_panel.html` como referências históricas aperfeiçoadas.
>
> **Estratégia de Deploy e Versionamento**: Todas as entregas para produção serão versionadas no Git com tagging semântico (`v2.0.0`, `v2.1.0`), acompanhadas de plano de rollback e testes automatizados.

---

## Open Questions

> [!NOTE]
> 1. **Repositório de Conteúdo Remoto**: Devemos utilizar uma branch dedicada (`content-release`) dentro do próprio repositório `Painel-SIGSSe` ou criar um repositório separado para os assets de campanhas e mascotes? *(Recomendação: Usar pasta `/content` na branch `main` ou branch `content` no mesmo repositório para simplicidade inicial)*.
> 2. **Formato de Skins**: Suportaremos apenas imagens vitoriais SVG ou também GIFs animados / PNG Spritesheets para skins de mascotes? *(Recomendação: Suportar SVG e PNG Spritesheet)*.

---

## Proposed Changes & Phased Roadmap

---

### Fase 1: Fundação, Estrutura de Documentação e Configuração do Ambiente [COMPLETADO]
- [x] Clonar e investigar a estrutura legada do repositório.
- [x] Criar estrutura de documentação persistente (`AGENTS.md`, `docs/architecture/`, `docs/security/`, `docs/agents/`).
- [x] Auditar dependências (`package.json`, `build.js`, `tsconfig.json`) e validar a compilação do bundle Manifest V3.

---

### Fase 2: Redesenho do Core Engine e Interfaces TypeScript [EM ANDAMENTO]

#### [NEW] [src/types/index.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/types/index.ts)
- Definir interfaces estritas para `MascotConfig`, `SkinManifest`, `CampaignMessage`, `PanelState` e `ContentProvider`.

#### [NEW] [src/core/CoreEngine.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/core/CoreEngine.ts)
- Implementar o novo coordenador modular com desacoplamento de adaptadores e inicialização assíncrona resiliênte.

#### [MODIFY] [src/core/config.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/core/config.ts)
- Atualizar o gerenciador de configurações para suportar versionamento de schema, armazenamento local e flags de sincronização remota.

---

### Fase 3: Sistema de Conteúdo Remoto, Cache e Fallback Offline

#### [NEW] [src/content/RemoteContentManager.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/content/RemoteContentManager.ts)
- Implementar o fluxo *Stale-While-Revalidate* buscando o manifesto remoto via GitHub Raw/CDN com fallback para dados locais empacotados.

#### [NEW] [src/content/LocalCacheProvider.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/content/LocalCacheProvider.ts)
- Gerenciador de cache local persistente em `chrome.storage.local` para manifestos, skins em SVG e campanhas.

#### [NEW] [content/manifest.json](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/content/manifest.json)
- Criar a estrutura inicial de arquivos de conteúdo remoto (mascotes, skins, mensagens e campanhas).

---

### Fase 4: Refatoração do Mascot Engine, Skin System e Balões de Campanha

#### [MODIFY] [src/mascot/MascotEngine.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/mascot/MascotEngine.ts)
- Refatorar a física para trabalhar com máquina de estados de animação flexível e carregamento dinâmico de skins.

#### [MODIFY] [src/mascot/MascotRenderer.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/mascot/MascotRenderer.ts)
- Remover definições visuais hardcoded; integrar o renderizador com o provedor de skins SVG/Spritesheet.

#### [NEW] [src/campaign/CampaignManager.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/campaign/CampaignManager.ts)
- Motor de mensagens contextuais e campanhas de saúde com temporizador e sanitização contra XSS.

---

### Fase 5: Aperfeiçoamento do Adaptador SIGSS e UI do Popup

#### [MODIFY] [src/utils/sigssPanelAdapter.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/utils/sigssPanelAdapter.ts)
- Atualizar a heurística DOM para maior resiliência contra atualizações no layout do painel Unique Panel/MV.

#### [MODIFY] [src/ui/popup/popup.html](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/ui/popup/popup.html)
#### [MODIFY] [src/ui/popup/popup.css](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/ui/popup/popup.css)
#### [MODIFY] [src/ui/popup/popup.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/src/ui/popup/popup.ts)
- Redesenhar a interface do popup da extensão com design moderno (glassmorphism, gradientes suaves, seleção visual de mascote, controle de volume/velocidade e status de sincronização remota).

---

### Fase 6: Automação de Testes Unitários e Testes Visuais E2E

#### [NEW] [vitest.config.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/vitest.config.ts)
- Configuração do Vitest para suíte de testes unitários rápidos.

#### [NEW] [tests/unit/SigssAdapter.test.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/tests/unit/SigssAdapter.test.ts)
- Testes unitários para o adaptador de DOM do SIGSS.

#### [NEW] [tests/visual/MascotVisual.spec.ts](file:///c:/Users/guilh/Documents/Programa%C3%A7%C3%A3o/SIGSS%20+%20Panel/tests/visual/MascotVisual.spec.ts)
- Testes de renderização visual e animação utilizando Playwright Headless no `mock_panel.html`.

---

## Verification Plan

### Automated Tests
1. **Compilação e Tipagem**:
   ```bash
   npm run check
   ```
2. **Build de Produção**:
   ```bash
   npm run build
   ```
3. **Suíte de Testes Unitários**:
   ```bash
   npm run test
   ```

### Manual & Visual Verification
1. Carregar a extensão compilada (`dist/`) no Chrome em `chrome://extensions` (Modo Desenvolvedor).
2. Abrir o painel simulado local `dist/mock_panel.html` no navegador.
3. Verificar a movimentação do Zé Gotinha / Mascote selecionado, reação a chamadas de pacientes e balões de campanha de saúde.
4. Alterar as configurações no Popup e confirmar a atualização dinâmica em tempo real sem recarregar a página.
