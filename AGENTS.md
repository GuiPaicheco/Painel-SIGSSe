# AGENTS.md — Diretrizes para Agentes de IA e Desenvolvedores Humanos

> **Projeto**: Painel SIGSSe — Plataforma de Mascotes Interativos e Conteúdo Dinâmico  
> **Versão**: 2.0.0-arch  
> **Status**: Produção / Nova Arquitetura Modular

---

## 1. Princípios Fundamentais

1. **Produção Exige Commit e Documentação**:
   - Nenhum código é promovido para produção sem commit versionado, testes validados, verificação visual (quando aplicável) e registro de decisão na pasta `docs/decisions/`.
2. **Arquitetura Modular em Camadas (Layered Isolation)**:
   - Respeite estritamente a separação entre *Core Engine*, *Content Manager*, *Remote Provider*, *Cache/Fallback*, *Mascot System*, *SIGSS Integration* e *UI/Browser Layer*.
3. **Não Destrutivo por Padrão**:
   - Modificações em código existente devem ser justificadas no log ou na documentação. Refatorações extensas devem ser aprovadas pelo agente **Architect** ou pelo usuário responsável.
4. **Sem Credenciais em Código (Zero Hardcoded Secrets)**:
   - Chaves, tokens ou segredos **NUNCA** devem ser commitados no repositório. Utilize variáveis de ambiente ou o modelo de conteúdo público assinado via CDN/GitHub Raw.

---

## 2. Papeis da Equipe de Agentes Especializados

| Agente | Função Principal | Escopo de Arquivos Permitidos | Exige Aprovação |
| :--- | :--- | :--- | :--- |
| 👑 **Orchestrator** | Gestão de backlog, fluxo de execução e prioridades | `docs/`, `AGENTS.md`, `package.json` | Ações destrutivas / Release |
| 🏛️ **Architect** | Definição de interfaces, contratos e esquemas JSON | `src/core/`, `docs/architecture/`, `src/types/` | Alteração de APIs públicas |
| 💻 **Developer** | Implementação de lógica de negócio e motores | `src/core/`, `src/mascot/`, `src/content/` | Mudança de arquitetura |
| 🎨 **Frontend/UI** | Interface do usuário (Popup, Mock Panel, CSS, Skins) | `src/ui/`, `mock/`, `assets/` | Mudança visual radical |
| 🌐 **Remote Content** | Gerenciamento de schema, GitHub Provider, Fetcher & Cache | `src/remote/`, `schemas/`, `content/` | Alteração do contrato de cache |
| 🏥 **SIGSS Integration** | Adaptador DOM, observadores de chamada e resiliência | `src/adapter/`, `src/utils/` | Alteração da heurística do DOM |
| ✍️ **Content** | Criação e curadoria de mensagens, skins e campanhas | `content/`, `assets/mascots/` | Deploy de novas campanhas |
| 🧪 **QA (Tester)** | Criação e execução de testes unitários e de integração | `tests/`, `*.test.ts`, `vitest.config.ts` | Remoção de testes existentes |
| 👁️ **Visual QA** | Automação e validação visual de renderização (Playwright/Chrome) | `tests/visual/`, `mock/` | Aprovação de UI em breaking change |
| 🔒 **Security** | Auditoria de segurança, permissões do Manifest V3 e sanitização | `src/manifest.json`, `docs/security/` | Alteração de permissões do browser |
| 🔍 **Code Reviewer** | Auditoria de PRs, linting, tipagem e conformidade de código | Todo o repositório (Read-only + Sugestões) | Impede merge se reprovado |
| 🚀 **Git/Release** | Versionamento semântico, changelog, tags e empacotamento | `dist/`, `.github/`, `CHANGELOG.md` | Lançamento em Produção |

---

## 3. Regras de Execução para Agentes

### 3.1 Antes de Modificar Arquivos
- Consulte a documentação em `docs/architecture/` para entender o contrato atual.
- Verifique se a mudança afeta outros módulos. Caso afete, notifique ou invoque o agente **Architect**.

### 3.2 Durante a Implementação
- Mantenha funções puras e isoladas sempre que possível.
- Utilize TypeScript com tipagem estrita (`strict: true`).
- Adicione logs estruturados usando o módulo `Logger` centralizado.

### 3.3 Após a Implementação
- Execute `npm run check` (Typecheck + Lint).
- Execute `npm run test` (Testes unitários/integração).
- Execute `npm run build` para garantir que o bundle final compila sem erros.
- Registre a conclusão e prepare a proposta de commit/PR com padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`).

---

## 4. Estratégia de Isolamento com Git Worktrees
Para evitar conflitos entre agentes atuando concorrentemente:
- Cada agente de feature deve operar em um branch isolado (ex: `feature/remote-cache`, `fix/dom-adapter`).
- Utilize **Git Worktrees** para agentes executando tarefas paralelas complexas:
  ```bash
  git worktree add ../worktree-remote-cache feature/remote-cache
  ```

---

## 5. Matriz de Autonomia e Aprovações

| Ação | Nível de Autonomia | Requisito de Liberação |
| :--- | :--- | :--- |
| Criar/Modificar código de módulo isolado | **Alta** | Passar em `npm run test` e `npm run check` |
| Criar testes ou documentação | **Alta** | Formatação adequada e sem quebras |
| Modificar contrato de API entre módulos | **Média** | Revisão do **Architect** |
| Alterar permissões no `manifest.json` | **Restrita** | Revisão do **Security** e aprovação formal |
| Excluir/Sobrescrever arquivos do legado | **Restrita** | Justificativa documentada em `docs/decisions/` |
| Criar Tag de Release e Deploy de Produção | **Restrita** | Aprovação do usuário / **Git Release Agent** |
