# Política de Segurança e Gestão de Credenciais — Painel SIGSSe 2.0

> **Status**: Especificação de Segurança de Produção  
> **Objetivo**: Garantir segurança estrita em extensões Manifest V3, prevenir vazamento de segredos, sanitizar conteúdos remotos e proteger a integridade do SIGSS.

---

## 1. Princípios de Segurança em Extensões Chrome Manifest V3

### 1.1 Modelo de Privilégio Mínimo (Principle of Least Privilege)
- **Content Scripts**: Executam no contexto do DOM da página do SIGSS em um mundo de execução isolado (Isolated World). Não possuem acesso às variáveis globais da página nem a tokens do SIGSS.
- **Background Service Worker**: Possui acesso às APIs do Chrome (`chrome.storage`, `chrome.runtime`), mas não acessa o DOM diretamente.
- **Host Permissions**: Limitadas às URLs autorizadas em `manifest.json`:
  - `http://sigss.betim.mg.gov.br/unique-panel/*` (DOM do painel)
  - `https://raw.githubusercontent.com/*` (Download de conteúdo remoto via CDN público)

### 1.2 Zero Hardcoded Secrets (Proibição Absoluta de Segredos em Código)
- **Extensões de navegador são cliente público**: Qualquer código, token, chave de API ou credencial empacotada em uma extensão Chrome ou enviada para repositório público pode ser extraída.
- **NENHUMA SENHA OU TOKEN PRIVADO DEVE SER INCLUÍDO NO REPOSITÓRIO, CÓDIGO, DOCUMENTAÇÃO OU COMMITS.**

---

## 2. Proteção e Sanitização de Conteúdo Remoto

### 2.1 Sanitização Rígida de SVG Remoto (`SvgSanitizer`)
Todo SVG recebido remotamente do GitHub Raw passa pelo módulo `SvgSanitizer` antes da injeção no DOM:
- **Remoção de Tags Perigosas**: Bloqueio de `<script>`, `<iframe>`, `<embed>`, `<object>`, `<foreignObject>`, `<base>`, `<form>`.
- **Remoção de Handlers Inline**: Bloqueio de qualquer atributo `on*` (`onload`, `onclick`, `onmouseover`, etc.).
- **Remoção de Esquemas de URI Inseguros**: Bloqueio de `javascript:`, `data:text/html` em atributos `href` ou `src`.

### 2.2 Prevenção de Injeção de Texto (XSS)
- Mensagens de balão de fala passam pela função `sanitizeText` em `CampaignManager`, convertendo marcadores HTML em entidades seguras.

---

## 3. Diretrizes de Atuação em Testes no SIGSS Real

- **Apenas Leitura (Read-Only)**: Em testes de integração no painel real da UBS, o agente ou extensão atua estritamente na leitura de elementos de exibição do DOM.
- **Proibição de Mutação**: É categoricamente proibido cadastrar, editar, excluir ou modificar dados de pacientes, consultas ou configurações no SIGSS real.
- **Proteção de Dados Pessoais (LGPD/HIPAA)**: Nenhuma informação pessoal ou clínica de pacientes reais pode ser incluída em screenshots, logs, commits ou documentação.
