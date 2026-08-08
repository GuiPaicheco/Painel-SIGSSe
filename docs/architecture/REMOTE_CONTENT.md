# Estrutura de Conteúdo Remoto e Versionamento — Painel SIGSSe 2.0

> **Status**: Especificação Técnica de Conteúdo Remoto  
> **Objetivo**: Permitir atualização contínua de mascotes, skins, mensagens e campanhas sem necessidade de nova publicação na Chrome Web Store.

---

## 1. Estrutura do Repositório/CDN de Conteúdo Remoto

O conteúdo remoto será hospedado na branch `content-release` (ou repositório dedicado de assets/CDN) no GitHub, servido via GitHub Raw / Cloudflare Pages.

```text
content/
├── manifest.json                  # Manifesto global de conteúdo remoto
├── configs/
│   ├── default_config.json        # Configurações globais de comportamento
│   └── feature_flags.json         # Flags ativas por ambiente
├── mascots/
│   ├── gotinha/
│   │   ├── mascot.json            # Configuração e física do Gotinha
│   │   └── skins/
│   │       ├── default.svg
│   │       ├── enfermeiro.svg
│   │       └── super_heroi.svg
│   └── gatinho/
│       ├── mascot.json
│       └── skins/
│           ├── laranja.svg
│           ├── cinza.svg
│           └── preto.svg
├── campaigns/
│   ├── campanha_outubro_rosa.json
│   ├── campanha_novembro_azul.json
│   └── dicas_saude_geral.json
└── messages/
    └── healthcare_phrases.json
```

---

## 2. Esquemas JSON (Schemas)

### 2.1 Manifesto Global (`manifest.json`)
```json
{
  "version": "2.1.0",
  "minExtensionVersion": "2.0.0",
  "updatedAt": "2026-08-08T19:00:00Z",
  "signature": "sha256-hash-do-conteudo",
  "resources": {
    "mascots": [
      {
        "id": "gotinha",
        "name": "Zé Gotinha",
        "version": "1.2.0",
        "path": "mascots/gotinha/mascot.json"
      },
      {
        "id": "gatinho",
        "name": "Gatinho da Saúde",
        "version": "1.0.0",
        "path": "mascots/gatinho/mascot.json"
      }
    ],
    "campaigns": [
      {
        "id": "dicas_gerais",
        "version": "1.0.0",
        "path": "campaigns/dicas_saude_geral.json"
      }
    ]
  }
}
```

### 2.2 Especificação de Mascote e Skin (`mascot.json`)
```json
{
  "id": "gotinha",
  "name": "Zé Gotinha",
  "defaultSkin": "default",
  "skins": {
    "default": {
      "name": "Zé Gotinha Clássico",
      "type": "svg",
      "src": "skins/default.svg",
      "width": 64,
      "height": 64
    },
    "enfermeiro": {
      "name": "Zé Gotinha Enfermeiro",
      "type": "svg",
      "src": "skins/enfermeiro.svg",
      "width": 64,
      "height": 64
    }
  },
  "animations": {
    "idle": { "frames": [0, 1], "fps": 2, "loop": true },
    "walk": { "frames": [2, 3, 4, 5], "fps": 8, "loop": true },
    "celebrate": { "frames": [6, 7, 8], "fps": 10, "loop": false }
  }
}
```

### 2.3 Especificação de Campanhas (`campaigns/*.json`)
```json
{
  "id": "outubro_rosa",
  "title": "Campanha Outubro Rosa",
  "startDate": "2026-10-01T00:00:00Z",
  "endDate": "2026-10-31T23:59:59Z",
  "priority": 10,
  "messages": [
    {
      "id": "outubro_rosa_01",
      "text": "A prevenção é o melhor caminho! Faça o autoexame e consulte seu médico regularmente.",
      "category": "prevention",
      "displayDurationSeconds": 8
    }
  ]
}
```

---

## 3. Mecanismo de Atualização e Cache

1. **Checagem Inteligente de Versão**:
   - A extensão armazena o `version` e a `signature` do último manifesto baixado.
   - Realiza requisições HTTP `HEAD` ou usa `ETag` / `If-None-Match` no repositório remoto para economizar banda e processamento.

2. **Validação de Integridade e Sanitização**:
   - Todo JSON recebido remotamente passa por validação de esquema runtime (usando Zod / TypeBox ou parser com validação estrita).
   - Textos de mensagens passam por sanitização HTML (prevenindo inserção de marcas de script ou tags perigosas).

3. **Estratégia Stale-While-Revalidate**:
   - O aplicativo sempre inicializa imediatamente com os dados locais ou de cache para garantir inicialização sem lag (0 ms).
   - Em background, atualiza o cache e aplica suavemente os novos assets no próximo ciclo de animação ou atualização da interface.
