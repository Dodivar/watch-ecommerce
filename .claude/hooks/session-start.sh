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

# Le npm du conteneur (10.x) est plus ancien que celui qui a écrit le lockfile
# (11.x) : il ne connaît pas le champ `libc` des paquets optionnels et le retire
# en passant. Le dépôt se retrouvait donc modifié dès l'ouverture d'une session,
# et commiter cette réécriture ferait perdre à tout le monde des métadonnées de
# plateforme que npm 11 remettrait au prochain `npm install`.
#
# On ne rend le lockfile que si npm n'a fait qu'en retirer des lignes, signature
# de cette perte-là. Une vraie mise à jour de dépendance en ajoute, et elle est
# gardée. `--text` est nécessaire : `.gitattributes` marque le lockfile `-diff`.
if git rev-parse --git-dir >/dev/null 2>&1 && ! git diff --quiet -- package-lock.json; then
  if ! git diff --text -- package-lock.json | grep -q '^+[^+]'; then
    git checkout -- package-lock.json
    echo "package-lock.json rendu tel quel : npm $(npm --version) n'a fait qu'en retirer des champs."
  fi
fi

# Playwright est installé côté conteneur (PLAYWRIGHT_BROWSERS_PATH) : ne jamais
# lancer `playwright install` ici.
