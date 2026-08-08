# Backlog Operacional Multiagente — Painel SIGSSe 2.0

> **Status**: Ativo — Gerenciado pelo Agente **Orchestrator**  
> **Fonte de Verdade**: `IMPLEMENTATION_PLAN.md`, `AGENTS.md` e `ARCHITECTURE.md`

---

## 📋 Quadro de Tarefas Granulares

| ID | Descrição da Tarefa | Prioridade | Dependências | Agente Responsável | Critérios de Aceitação | Testes Necessários | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TASK-101** | Investigação do legado e setup da estrutura de documentação persistente | Alta | Nenhum | 👑 Orchestrator / 🏛️ Architect | Documentos `AGENTS.md`, `ARCHITECTURE.md`, `SECURITY.md` criados. | Compilação inicial | 🟢 **Concluído** |
| **TASK-102** | Definição da tipagem TypeScript estrita e contratos de interface v2.0 | Alta | TASK-101 | 🏛️ Architect | Arquivo `src/types/index.ts` com interfaces completas de mascotes, skins e campanhas. | `npm run check` | 🟢 **Concluído** |
| **TASK-103** | Demonstrativo E2E de Atualização Remota com Hot-Reload Visual sem Page Reload | Alta | TASK-102 | 🌐 Remote Content / 💻 Developer | Alteração dinâmica da skin (Zé Gotinha Dourado v2026.08.08.002) e frase no DOM sem reload. | Teste visual E2E & Vitest | 🟢 **Validado E2E** |
| **TASK-104** | Implementação do Sanitizador Rígido de SVG (`SvgSanitizer`) | Alta | TASK-103 | 🔒 Security | Bloqueio de `<script>`, `onload`, `javascript:` em SVGs remotos baixados. | Teste de SVG malicioso | 🟢 **Concluído** |
| **TASK-105** | Refatoração de `MascotRenderer.ts` e correção de vazamento de memória | Alta | TASK-102 | 💻 Developer | Remoção de ouvintes de `window` durante a execução do método `destroy()`. | Teste unitário de cleanup | 🟢 **Concluído** |
| **TASK-106** | Implementação do Motor de Campanhas de Saúde e Balões de Fala | Média | TASK-102 | ✍️ Content / 💻 Developer | Balões de fala com sanitização HTML nativa contra XSS e amostragem de frases. | Testes de XSS e amostragem | 🟢 **Concluído** |
| **TASK-107** | Redesenho da Interface Popup com estilo Glassmorphism | Média | TASK-102 | 🎨 Frontend/UI | Popup em HTML/CSS/TS com seletores de skin, sliders de tamanho/velocidade e status de sync. | Validação visual no browser | 🟢 **Concluído** |
| **TASK-108** | Atualização das permissões do Manifest V3 (`host_permissions` e versão) | Alta | TASK-103 | 🔒 Security | Inclusão de `https://raw.githubusercontent.com/*` e versão `"2.0.0"` em `src/manifest.json`. | Check de manifest | 🟢 **Concluído** |
| **TASK-109** | Validação no Painel Simulado Local (`mock/mock_panel.html`) | Alta | TASK-105, 107 | 👁️ Visual QA | Funcionamento sem erros no console no mock com mutação de chamadas. | Teste visual Chromium | 🟢 **Concluído** |
| **TASK-110** | Integração e Validação Read-Only no Painel SIGSS Real da UBS | Alta | TASK-109 | 🏥 SIGSS Integration / 👁️ Visual QA | Leitura passiva do DOM do painel real sem alteração ou mutação de dados. | Teste no SIGSS real | 🟢 **Concluído** |
| **TASK-205** | Plataforma de Autoria e Distribuição Declarativa de Conteúdo (`Content Authoring System`) | Alta | TASK-103 | 🏛️ Architect / ✍️ Content / 🌐 Remote Content | Estrutura modular `content/` (mascots, messages, campaigns), script `compile-content.js`, schemas e filtragem por data (`startDate`/`endDate`). | Vitest 18/18 & E2E Visual | 🟢 **Concluído** |
| **TASK-201** | Suporte a Spritesheets PNG e Animações Frame-by-Frame para Skins Complexas | Média | TASK-205 | 🌐 Remote Content / 💻 Developer | Suporte no `MascotRenderer` a atlas de frames PNG além do formato SVG. | Testes de animação PNG | 🟡 **Aguardando Início** |
| **TASK-202** | Painel Administrativo de Visualização de Campanhas e Agendamento por Data | Média | TASK-205 | 🎨 Frontend/UI / ✍️ Content | Filtro de mensagens ativas por período (`startDate` / `endDate`) e categoria de saúde. | Testes de data/hora | 🟡 **Aguardando Início** |
| **TASK-203** | Implementação da Suíte E2E Automatizada com Playwright Headless | Alta | TASK-205 | 🧪 QA / 👁️ Visual QA | Script automatizado de regressão visual integrado ao fluxo de build. | `npm run test:e2e` | 🟡 **Aguardando Início** |
| **TASK-204** | Preparação do Pacote de Release v2.0.0 (Tag Semântica + Changelog) | Restrita | TASK-203 | 🚀 Git/Release | Tag Git `v2.0.0` e arquivo `CHANGELOG.md` prontos para revisão do usuário. | Audit de release | 🔴 **Exige Aprovação Humana** |

---

## 🔀 Matriz de Paralelismo e Dependências

```mermaid
graph TD
    subgraph Fase 1 & 2 Concluídas - Pipeline Remoto & Content Authoring System
        T101[TASK-101: Docs & Audit] --> T102[TASK-102: TypeScript Types]
        T102 --> T103[TASK-103: Remote Content Live Reload]
        T102 --> T105[TASK-105: Mascot Memory Leak Fix]
        T102 --> T106[TASK-106: Campaign Manager]
        T102 --> T107[TASK-107: Glassmorphism Popup]
        T103 --> T104[TASK-104: SvgSanitizer]
        T104 --> T108[TASK-108: Manifest V3 Permissions]
        T105 & T107 --> T109[TASK-109: Mock Visual QA]
        T108 & T109 --> T110[TASK-110: SIGSS Real Read-Only QA]
        T110 --> T205[TASK-205: Content Authoring System]
    end

    subgraph Próxima Fase (Desenvolvimento Paralelo)
        T205 --> T201[TASK-201: PNG Spritesheet Support]
        T205 --> T202[TASK-202: Campaign Date Scheduler]
        T205 --> T203[TASK-203: Playwright E2E Suite]
        
        T201 & T202 & T203 --> T204[TASK-204: Release v2.0.0 Package]
    end
```
