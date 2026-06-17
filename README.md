<p align="center">
  <img src="public/icon.png" alt="FID Plus" width="128">
</p>

[![CI][ci badge]] [![Build][build badge]][build link] [![Chrome Web Store][chrome web store badge]][chrome web store link]

[ci badge]: https://flat.badgen.net/circleci/github/marcelotk15/fid-plus/main?label=build
[build badge]: https://flat.badgen.net/circleci/github/marcelotk15/fid-plus/main?label=build
[build link]: https://circleci.com/gh/marcelotk15/fid-plus/tree/main
[chrome web store badge]: https://flat.badgen.net//chrome-web-store/v/hgonnokjmaapkalomekndnmldglhacgd
[chrome web store link]: https://chromewebstore.google.com/detail/fid-plus/hgonnokjmaapkalomekndnmldglhacgd

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

1. Crie um fork e uma branch a partir de `main`.
2. Implemente a alteração e adicione testes quando fizer sentido.
3. Antes do commit, rode:

```bash
bun lint
bun format:fix   # se necessário
bun test:run
```

4. Use commits no padrão [Conventional Commits](https://www.conventionalcommits.org/), por exemplo: `feat:`, `fix:`, `test:`, `docs:`.

O pre-commit executa lint e testes automaticamente; o commit-msg valida o formato da mensagem.

## Releases e publicação

O projeto usa [Release Please](https://github.com/googleapis/release-please) para gerar changelog, bump de versão e GitHub Releases a partir dos commits convencionais em `main`.

### Fluxo

1. Merges em `main` atualizam o Release PR automaticamente.
2. Ao mergear o Release PR, uma tag e um GitHub Release são criados.
3. O workflow de release gera o `.zip`, anexa em **Assets** no GitHub Release e envia para a Chrome Web Store.

### Bootstrap (primeira vez)

Após mergear a configuração do Release Please, crie a tag inicial para evitar que o primeiro Release PR inclua todo o histórico:

```bash
git tag v0.0.1
git push origin v0.0.1
```

### Secrets do GitHub (Actions)

Configure em **Settings → Secrets and variables → Actions**:

| Secret                 | Descrição                          |
| ---------------------- | ---------------------------------- |
| `CHROME_EXTENSION_ID`  | ID da extensão na Chrome Web Store |
| `CHROME_CLIENT_ID`     | OAuth do Google Cloud              |
| `CHROME_CLIENT_SECRET` | OAuth do Google Cloud              |
| `CHROME_REFRESH_TOKEN` | Token de refresh da API            |

Para obter as credenciais localmente:

```bash
bunx wxt submit init
```

Isso gera `.env.submit` (não commitar). Teste antes do primeiro deploy:

```bash
bun run zip
bunx wxt submit --dry-run --chrome-zip .output/*-chrome.zip
```
