#!/bin/bash
# Prépare une session Claude Code sur le web : sans node_modules, ni `npm test`
# ni `npm run lint` ne peuvent tourner (node_modules n'est pas versionné).
set -euo pipefail

# En local, l'environnement de l'utilisateur est déjà installé : ne rien faire.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# `npm install` (et non `npm ci`) : l'état du conteneur est mis en cache après le
# hook, une installation incrémentale en profite. Idempotent.
npm install --no-audit --no-fund

# Playwright est installé côté conteneur (PLAYWRIGHT_BROWSERS_PATH) : ne jamais
# lancer `playwright install` ici.
