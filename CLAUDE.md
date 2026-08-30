# Instructions projet — watch-ecommerce

## Pull requests : les branches de travail vont sur `staging`

`main` est protégée par un check requis `staging-only`
(`.github/workflows/guard-main-source.yml`) : une PR vers `main` n'est
mergeable que si sa branche source est **exactement** `staging`, dans le dépôt
d'origine — GitHub ne sachant pas restreindre nativement la source d'une PR.

Deux cas, à ne pas confondre :

| Depuis | Vers | Verdict |
|---|---|---|
| une branche de travail (`claude/…`, `feat/…`) | `staging` | ✅ le flux normal |
| une branche de travail | `main` | ❌ bloqué par `staging-only` |
| `staging` | `main` | ✅ la PR de promotion, la seule admise sur `main` |

Donc, pour une branche de travail :

```bash
gh pr create --base staging
```

Si une PR a été ouverte par erreur sur `main`, la recibler plutôt que d'en
créer une seconde — le check est rejoué au changement de base :

```bash
gh pr edit <numéro> --base staging
```

La PR de promotion `staging` → `main` reste légitime et se crée sans changer de
branche :

```bash
gh pr create --head staging --base main
```

Les branches de travail sont créées depuis `main`, qui peut être en retard de
quelques commits sur `staging` : sans effet sur la PR, GitHub calcule le diff
depuis la base commune.

## Fichiers Markdown et `.gitignore`

`*.md` est gitignoré (`.gitignore:48`, dépôt public) : un fichier `.md` créé
n'est pas suivi par défaut. Les documents qui doivent l'être sont forcés à la
main (`git add -f`), comme `sites/CLAUDE.md`. À vérifier avant de supposer
qu'une note écrite dans le dépôt sera partagée.
