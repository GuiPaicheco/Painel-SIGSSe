# Estrutura de Conteúdo Remoto e Versionamento — Painel SIGSSe 2.0

> **Status**: Especificação Técnica Validada  
> **Objetivo**: Permitir atualização contínua de mascotes, skins, mensagens e campanhas sem necessidade de recompilar a extensão.

---

## 1. Versionamento Separado (Código vs Conteúdo)

Para garantir autonomia na criação de campanhas de saúde sem gerar novas compilações da extensão Chrome:

- **Versão do Código (Extensão)**: `2.x.x` (definida em `package.json` e `manifest.json`).
- **Versão do Conteúdo**: `YYYY.MM.DD.NNN` (exemplo: `2026.08.08.001`).
- **Versão do Schema**: `Major.minor` (exemplo: `1.0`).

```json
{
  "contentVersion": "2026.08.08.001",
  "schemaVersion": "1.0",
  "minExtensionVersion": "2.0.0",
  "updatedAt": "2026-08-08T19:30:00Z",
  "mascots": [...],
  "campaigns": [...]
}
```

---

## 2. Pipeline de Atualização Dinâmica (Hot-Reload)

```mermaid
sequenceDiagram
    participant GH as GitHub CDN Raw
    participant RCM as RemoteContentManager
    participant SAN as SvgSanitizer
    participant CACHE as Local Storage Cache
    participant REND as MascotRenderer (DOM)

    RCM->>GH: fetch("manifest.json")
    alt Conexão OK & HTTP 200
        GH-->>RCM: Retorna JSON Remoto (v2026.08.08.002)
        RCM->>RCM: validateManifestSchema(remoteData)
        alt Schema Válido
            RCM->>SAN: sanitize(svgContent)
            SAN-->>RCM: SVG Seguro
            RCM->>CACHE: saveToLocalCache(v2026.08.08.002)
            RCM->>REND: notifyUpdate() [Event: remote_update]
            REND->>REND: updateSkinVisual() (Troca dinâmica na tela)
        else Schema Inválido
            RCM->>RCM: Rejeita e mantém cache anterior
        end
    else Erro de Conexão / Timeout / Offline
        RCM->>CACHE: Mantém versão em cache / fallback nativo
    end
```

---

## 3. Resiliência de Falha de Rede e Fallback
1. **Primeira Execução (Sem Cache)**: Se o GitHub estiver inacessível, o sistema utiliza o `FALLBACK_MANIFEST` embutido (`src/content/fallbackManifest.ts`).
2. **Execuções Posteriores**: Utiliza o cache local imediatamente (0 ms) e checa atualizações em background.
3. **Payload Corrompido ou Malicioso**: O validador de schema rejeita o payload e o `SvgSanitizer` remove quaisquer scripts, mantendo a estabilidade e a segurança do painel.
