# AGENTS.md — Diretrizes para Agentes de IA e Desenvolvedores Humanos

> **Projeto**: Painel SIGSSe — Plataforma de Mascotes Interativos e Conteúdo Dinâmico  
> **Versão**: 2.0.0-arch  
> **Status**: Produção / Nova Arquitetura Modular

---

## 1. Princípios Fundamentais

1. **Produção Exige Commit e Documentação**:
   - Nenhum código é promovido para produção sem commit versionado, testes validados, verificação visual e registro de decisão na pasta `docs/decisions/`.
2. **Arquitetura Modular em Camadas (Layered Isolation)**:
   - Respeite estritamente a separação entre *Core Engine*, *Content Manager*, *Remote Provider*, *Cache/Fallback*, *Mascot System*, *SIGSS Integration* e *UI/Browser Layer*.
3. **Não Destrutivo por Padrão & Zero Data Mutation no SIGSS Real**:
   - Modificações em código existente devem ser justificadas no log ou na documentação.
   - **Em testes no ambiente SIGSS real**: O agente tem permissão APENAS de LEITURA e OBSERVAÇÃO DOM. É estritamente PROIBIDO criar, editar ou excluir pacientes, prontuários, consultas ou configurações administrativas.
4. **Sem Credenciais em Código (Zero Hardcoded Secrets)**:
   - Chaves, tokens, senhas ou segredos **NUNCA** devem ser gravados em código, documentação, logs, screenshots ou commits versionados.

---

## 2. Travas de Segurança e Governança de Código

1. **Proibição de Bypass de Tipagem**:
   - O uso de `@ts-ignore`, `@ts-nocheck`, `eslint-disable` ou conversões de tipo inseguras (`any` arbitrários) para burlar erros é **ESTRITAMENTE PROIBIDO** sem aprovação prévia e justificativa do agente **Architect**.
2. **Inclusão de Dependências NPM**:
   - Adicionar ou atualizar dependências no `package.json` exige aprovação explícita do agente **Orchestrator**.
3. **Alteração de Permissões no `manifest.json`**:
   - Qualquer modificação em `permissions` ou `host_permissions` exige revisão prévia do agente **Security**.
4. **Push e Deployment**:
   - **NENHUM PUSH** para o GitHub ou merge para a branch `main` pode ser realizado de forma autônoma sem autorização explícita do usuário.

---

## 3. Papeis da Equipe de Agentes Especializados

| Agente | Função Principal | Escopo de Arquivos Permitidos | Exige Aprovação |
| :--- | :--- | :--- | :--- |
| 👑 **Orchestrator** | Gestão de backlog, fluxo de execução e dependências NPM | `docs/`, `AGENTS.md`, `package.json` | Ações destrutivas / Release / Push |
| 🏛️ **Architect** | Definição de interfaces, contratos e esquemas JSON | `src/core/`, `docs/architecture/`, `src/types/` | Bypass de tipos / Mudança de API |
| 💻 **Developer** | Implementação de lógica de negócio e motores | `src/core/`, `src/mascot/`, `src/campaign/` | Mudança de arquitetura |
| 🎨 **Frontend/UI** | Interface do usuário (Popup, Mock Panel, CSS, Skins) | `src/ui/`, `mock/`, `assets/` | Mudança visual radical |
| 🌐 **Remote Content** | Gerenciamento de schema, GitHub Provider, Fetcher & Cache | `src/remote/`, `schemas/`, `content/` | Alteração do contrato de cache |
| 🏥 **SIGSS Integration** | Adaptador DOM, observadores de chamada e resiliência | `src/adapter/`, `src/utils/` | Alteração da heurística do DOM |
| ✍️ **Content** | Criação e curadoria de mensagens, skins e campanhas | `content/`, `assets/mascots/` | Deploy de novas campanhas |
| 🧪 **QA (Tester)** | Criação e execução de testes unitários e de integração | `tests/`, `*.test.ts`, `vitest.config.ts` | Remoção de testes existentes |
| 👁️ **Visual QA** | Automação e validação visual de renderização (Playwright/Chrome) | `tests/visual/`, `mock/` | Aprovação de UI em breaking change |
| 🔒 **Security** | Auditoria de segurança, permissões do Manifest V3 e sanitização | `src/manifest.json`, `docs/security/` | Alteração de permissões no manifest |
| 🔍 **Code Reviewer** | Auditoria de PRs, linting, tipagem e conformidade de código | Todo o repositório (Read-only + Sugestões) | Impede merge se reprovado |
| 🚀 **Git/Release** | Versionamento semântico, changelog, tags e empacotamento | `dist/`, `.github/`, `CHANGELOG.md` | Lançamento em Produção |

---

## 4. Regras de Execução para Agentes

### 4.1 Antes de Modificar Arquivos
- Consulte a documentação em `docs/architecture/` para entender o contrato atual.
- Verifique se a mudança afeta outros módulos.

### 4.2 Durante a Implementação
- Mantenha funções puras e isoladas.
- Utilize TypeScript com tipagem estrita (`strict: true`).

### 4.3 Após a Implementação
- Execute `npm run check` (Typecheck estrito sem ignorar erros).
- Execute `npm run test` (Testes unitários).
- Execute `npm run build` (Build do bundle).
- Registre cada alteração em commits Git separados e descritivos.

---

## 5. Matriz de Autonomia e Aprovações

| Ação | Nível de Autonomia | Requisito de Liberação |
| :--- | :--- | :--- |
| Criar/Modificar código de módulo isolado | **Alta** | Passar em `npm run test` e `npm run check` |
| Criar testes ou documentação | **Alta** | Formatação adequada e sem quebras |
| Modificar contrato de API entre módulos | **Média** | Revisão do **Architect** |
| Alterar permissões no `manifest.json` | **Restrita** | Revisão do **Security** |
| Excluir/Sobrescrever arquivos do legado | **Restrita** | Justificativa documentada em `docs/decisions/` |
| Push para GitHub ou Release em Produção | **Restrita** | Autorização explícita do Usuário |
