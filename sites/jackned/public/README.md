# Public

Fichiers servis tels quels par Vite (copiés à la racine du build). Utilisé pour
les assets qui doivent conserver leur chemin absolu :

- Favicons et icônes PWA (`favicon-*.ico`, `android-chrome-*.png`).
- `site.webmanifest` et `robots.txt`.
- `webfonts/` : polices FontAwesome utilisées dans certains composants.

## Ajout d’un nouvel asset

1. Ajouter le fichier ici.
2. Référencer l’URL absolue (`/mon-fichier.ext`) dans le composant ou via
   `index.html`.
3. S’assurer que les assets sensibles (ex. PDF privés) ne sont pas placés ici,
   car tout est public par défaut.

