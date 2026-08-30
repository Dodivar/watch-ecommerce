# Configuration du Sitemap - Guide de diagnostic

## Problème : Le sitemap n'est pas accessible

Si vous ne pouvez pas accéder à `https://www.sauvage-watches.fr/sitemap.xml`, suivez ces étapes :

## 1. Vérifier les variables d'environnement sur Vercel

**IMPORTANT** : Les variables d'environnement avec le préfixe `VITE_` ne sont **PAS** disponibles dans les fonctions serverless Vercel.

### Configuration requise dans Vercel :

1. Allez sur [https://vercel.com](https://vercel.com) → votre projet → **Settings** → **Environment Variables**
2. Ajoutez ces variables (sans le préfixe VITE_) :
  - `SUPABASE_URL` = votre URL Supabase (ex: `https://xxxxx.supabase.co`)
  - `SUPABASE_ANON_KEY` = votre clé anonyme Supabase
3. **Important** : Assurez-vous que ces variables sont disponibles pour :
  - ✅ Production
  - ✅ Preview
  - ✅ Development
4. Après avoir ajouté les variables, **redéployez** votre projet

## 2. Vérifier que le déploiement inclut l'API

1. Allez dans **Deployments** sur Vercel
2. Vérifiez les logs du dernier déploiement
3. Cherchez des erreurs liées à `api/sitemap.js`

## 3. Tester l'endpoint API directement

Essayez d'accéder directement à l'endpoint API :

- `https://www.sauvage-watches.fr/api/sitemap`

Si cela fonctionne mais pas `/sitemap.xml`, le problème vient de la configuration du rewrite dans `vercel.json`.

## 4. Vérifier les logs Vercel

1. Allez dans **Functions** → **Logs** sur Vercel
2. Essayez d'accéder à `/sitemap.xml`
3. Vérifiez les erreurs dans les logs

## 5. Solutions alternatives

### Solution A : Vérifier que le fichier est bien déployé

Vérifiez que `api/sitemap.js` est bien présent dans votre dépôt et déployé.

### Solution B : Tester en local avec Vercel CLI

```bash
npm i -g vercel
vercel dev
```

Puis accédez à `http://localhost:3000/sitemap.xml`

### Solution C : Vérifier la configuration vercel.json

Assurez-vous que `vercel.json` contient bien :

- Le build pour `api/sitemap.js`
- Le rewrite de `/sitemap.xml` vers `/api/sitemap`

## 6. Diagnostic rapide

Si vous voyez une erreur JSON au lieu du XML, cela signifie que :

- L'API fonctionne mais il y a une erreur
- Vérifiez les logs pour voir le message d'erreur

Si vous voyez une 404 :

- L'API n'est pas déployée ou la route n'est pas configurée
- Vérifiez que `api/sitemap.js` existe et est commité

Si vous voyez une page blanche :

- Vérifiez les variables d'environnement
- Vérifiez les logs Vercel

## 7. Commandes utiles

```bash
# Vérifier que le fichier existe
ls -la api/sitemap.js

# Tester en local (si vous avez Vercel CLI)
vercel dev

# Vérifier la configuration
cat vercel.json
```

## Contact

Si le problème persiste après avoir suivi ces étapes, vérifiez :

1. Les logs Vercel pour les erreurs spécifiques
2. Que les variables d'environnement sont bien configurées
3. Que le projet a été redéployé après les changements

