# ADR-001: Adoção do Sistema Multiagente Autônomo com Governança Rígida

> **Status**: Aceito  
> **Data**: 2026-08-08  
> **Autor**: Orquestrador Técnico & Arquiteto Principal  
> **Impacto**: Todo o fluxo de desenvolvimento, revisão, testes e publicação do Painel SIGSSe 2.0

---

## 1. Contexto

A plataforma **Painel SIGSSe 2.0** evoluiu de um protótipo monolítico para uma arquitetura modular em camadas (Core Engine, Remote Content Provider, Local Storage Cache, SvgSanitizer, Campaign Manager, SIGSS Adapter, Popup UI). Para garantir desenvolvimento contínuo de alta velocidade, prevenção de regressões visuais e segurança no ambiente real do SIGSS, o projeto exige um fluxo de trabalho especializado e estruturado.

---

## 2. Decisão

Decidimos transformar o projeto em uma **Plataforma de Desenvolvimento Multiagente Autônoma**, coordenada pelo agente **Orchestrator** e operada por 12 papéis especialistas.

### 2.1 Papéis Configurados:
1. 👑 **Orchestrator**: Gestão do backlog, ordenação de dependências, distribuição de tarefas e validação final.
2. 🏛️ **Architect**: Definição de contratos TypeScript, esquema JSON e evolução estrutural.
3. 💻 **Developer**: Implementação do Core Engine, física do mascote e lógica de negócio.
4. 🎨 **Frontend/UI**: Interface Popup, estilização CSS, componentes visuais e experiência do usuário.
5. 🌐 **Remote Content**: Provedor de conteúdo remoto, manifesto, versionamento `YYYY.MM.DD.NNN` e cache.
6. 🏥 **SIGSS Integration**: Adaptador DOM de integração passiva (read-only) com o painel real e mock.
7. ✍️ **Content**: Qualidade textual, tom de voz de campanhas de saúde e sanitização de dados.
8. 🧪 **QA**: Testes unitários (Vitest), integração, cobertura e regressão estática.
9. 👁️ **Visual QA**: Validação visual automatizada em navegador (Chrome Headless / Playwright).
10. 🔒 **Security**: Auditoria de permissões do Manifest V3, CSP, sanitização SVG e política de zero segredos.
11. 🔍 **Code Reviewer**: Auditoria independente de código, linting e conformidade com AGENTS.md.
12. 🚀 **Git/Release**: Versionamento semântico, notas de versão, tags e empacotamento.

---

## 3. Consequências e Regras de Governança

- **Isolamento Concorrente**: Tarefas paralelas não-conflitantes utilizam **Git Worktrees** (`../sigss-worktree-ui`, `../sigss-worktree-content`).
- **Nivelamento de Autonomia**:
  - *Automático*: Leitura, testes, typecheck, build, código em branch de feature, testes no mock.
  - *Revisão Obrigatória*: Alteração de arquitetura, dependências NPM, `host_permissions` e schemas.
  - *Autorização Explícita*: Push para GitHub, merge para `main`, tags de release, deploy de produção e ações no SIGSS real.
- **Sem mutação no SIGSS Real**: Testes no painel real da UBS atuam exclusivamente em modo **Read-Only**. Nenhuma alteração de dados clínicos ou cadastrais é permitida.
