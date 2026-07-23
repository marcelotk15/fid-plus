<p align="center">
  <img src="public/icon.png" alt="FID Plus" width="128">
</p>

<p align="center">
  <a href="https://github.com/marcelotk15/fid-plus/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/marcelotk15/fid-plus/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/marcelotk15/fid-plus/releases/latest"><img alt="Build" src="https://img.shields.io/github/v/release/marcelotk15/fid-plus?include_prereleases"></a>
  <a href="https://chromewebstore.google.com/detail/fid-plus/hgonnokjmaapkalomekndnmldglhacgd"><img alt="Chrome Web Store" src="https://img.shields.io/chrome-web-store/v/hgonnokjmaapkalomekndnmldglhacgd"></a>
</p>

# FID Plus

Extensão de navegador que melhora a experiência no [Football Identity](https://footballidentity.org) com funcionalidades e helpers extras. Evoluindo continuamente com novas ideias.

Entre os recursos atuais: resolução automática dos quizzes diários (Qual é a camisa, Quem é quem, Squad Wordle, Estádios, Artilheiros, Wordle da Liga, Conexões da Liga e Quem joga no clube).

## Pré-requisitos

- [Bun](https://bun.sh/) instalado
- Navegador Chromium (Chrome) ou Edge para carregar a extensão em modo dev

## Como executar

```bash
bun install
```

| Comando                        | Uso                                           |
| ------------------------------ | --------------------------------------------- |
| `bun dev`                      | Dev no Chrome (WXT abre/recarrega a extensão) |
| `bun dev:edge`                 | Dev no Edge                                   |
| `bun build` / `bun build:edge` | Build de produção                             |
| `bun zip` / `bun zip:edge`     | Gerar `.zip` para publicação                  |

Após `bun dev` ou `bun dev:edge`, carregue a pasta `.output/*-mv3-dev` no navegador se o WXT não abrir automaticamente.

## Como testar

| Comando             | Uso                                  |
| ------------------- | ------------------------------------ |
| `bun test`          | Vitest em modo watch                 |
| `bun test:run`      | Rodar a suite uma vez                |
| `bun test:coverage` | Cobertura com v8                     |
| `bun lint`          | Oxlint                               |
| `bun format`        | Verificar formatação (oxfmt)         |
| `bun compile`       | Checagem TypeScript (`tsc --noEmit`) |

Os testes ficam em `src/**/*.spec.ts` com ambiente `happy-dom`.

## Como contribuir

1. Crie um fork e uma branch a partir de `develop` (`feature/*` ou `fix/*`).
2. Abra um Pull Request para `develop` com título no padrão [Conventional Commits](https://www.conventionalcommits.org/) (por exemplo: `feat:`, `fix:`, `test:`, `docs:`). Squash merge é permitido neste PR.
3. Para correções urgentes em produção, crie uma branch `hotfix/*` a partir de `main` e abra PR diretamente para `main` usando **merge commit**. Após o merge, sincronize a correção de volta para `develop`.
4. Implemente a alteração e adicione testes quando fizer sentido.
5. Antes do commit, rode:

```bash
bun lint
bun format:fix   # se necessário
bun test:run
```

6. Use commits no padrão Conventional Commits.

O pre-commit executa lint e testes automaticamente; o commit-msg valida o formato da mensagem. O CI também valida o título do PR no GitHub. Pull Requests com destino a `main` recebem automaticamente um comentário com o resumo dos commits que serão promovidos.

## Releases e publicação

O projeto usa [Release Please](https://github.com/googleapis/release-please) para gerar changelog, bump de versão e GitHub Releases a partir dos commits convencionais em `main`.

### Fluxo de branches

```text
feature/* | fix/*
        ↓
     develop          ← CI + build de integração (artifact)
        ↓
PR develop → main    ← merge commit (nunca squash)
        ↓
Release Please       ← atualiza Release PR
        ↓
Merge Release PR     ← tag + GitHub Release
        ↓
Deploy Produção      ← zip + Chrome Web Store

hotfix/*
        ↓
PR hotfix → main     ← merge commit
        ↓
sync → develop
```

1. Branches `feature/*` e `fix/*` integram em `develop` via Pull Request (squash merge permitido).
2. Push em `develop` dispara CI e gera um `.zip` de integração como artifact (sem versão oficial, tags ou releases).
3. Quando `develop` estiver pronta, abra PR para `main` usando **merge commit** (nunca squash).
4. Branches `hotfix/*` abrem PR diretamente para `main` com **merge commit**; após o merge, sincronize a correção de volta para `develop`.
5. Merges em `main` atualizam o Release PR automaticamente.
6. Ao mergear o Release PR, Release Please cria tag e GitHub Release (merge normal).
7. A publicação da release dispara o deploy de produção: gera o `.zip`, anexa em **Assets** no GitHub Release e envia para a Chrome Web Store.

### Branch protection recomendada

Configure em **Settings → Branches**:

- `develop`: exigir Pull Request e status checks do CI
- `main`: exigir Pull Request, status checks e merge commit para promoções vindas de `develop`

### Bootstrap (primeira vez)

Após mergear a configuração do Release Please, crie a tag inicial para evitar que o primeiro Release PR inclua todo o histórico:

```bash
git tag v0.0.1
git push origin v0.0.1
```

### Secrets do GitHub (Actions)

Configure em **Settings → Secrets and variables → Actions**:

| Secret                 | Descrição                                     |
| ---------------------- | --------------------------------------------- |
| `CHROME_EXTENSION_ID`  | ID da extensão na Chrome Web Store            |
| `CHROME_CLIENT_ID`     | OAuth do Google Cloud                         |
| `CHROME_CLIENT_SECRET` | OAuth do Google Cloud                         |
| `CHROME_REFRESH_TOKEN` | Token de refresh da API                       |
| `RELEASE_PLEASE_TOKEN` | PAT para Release Please e triggers de release |

Para obter as credenciais localmente:

```bash
bunx wxt submit init
```

Isso gera `.env.submit` (não commitar). Teste antes do primeiro deploy:

```bash
bun run zip
bunx wxt submit --dry-run --chrome-zip .output/*-chrome.zip
```
