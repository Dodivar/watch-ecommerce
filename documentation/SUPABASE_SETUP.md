# Configuration Supabase pour Sauvage Watches

Ce document explique comment configurer Supabase pour stocker et récupérer les montres en stock.

## Prérequis

1. Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))
2. Un projet Supabase créé

## 1. Création du projet Supabase

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **Project URL** et votre **anon/public key** (disponibles dans Settings > API)

## 2. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
VITE_SUPABASE_URL=votre_project_url
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

**Important** : Ne commitez jamais le fichier `.env` dans Git. Le fichier `.env.example` est déjà présent pour référence.

## 3. Création des tables dans Supabase

Exécutez le script SQL suivant dans l'éditeur SQL de Supabase (SQL Editor > New Query) :

```sql
-- Table principale des montres
CREATE TABLE watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_code TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  reference TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  year INTEGER,
  condition TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des détails techniques
CREATE TABLE watch_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
  content TEXT,
  movement TEXT,
  case_material TEXT,
  bracelet_material TEXT,
  case_size TEXT,
  thickness TEXT,
  dial_color TEXT,
  crystal TEXT,
  water_resistance TEXT,
  functions TEXT,
  power_reserve TEXT,
  frequency TEXT,
  case_condition TEXT,
  dial_condition TEXT,
  bracelet_condition TEXT,
  guarantee TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(watch_id)
);

-- Table des accessoires
CREATE TABLE watch_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  included BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des images
CREATE TABLE watch_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
  image_url TEXT,
  image_path TEXT,
  image_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_watch_details_watch_id ON watch_details(watch_id);
CREATE INDEX idx_watch_accessories_watch_id ON watch_accessories(watch_id);
CREATE INDEX idx_watch_images_watch_id ON watch_images(watch_id);
CREATE INDEX idx_watch_images_order ON watch_images(watch_id, image_order);
```

## 4. Configuration des politiques RLS (Row Level Security)

Pour permettre la lecture publique des montres, activez RLS et créez les politiques suivantes :

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_images ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture publique des montres
CREATE POLICY "Public watches are viewable by everyone"
  ON watches FOR SELECT
  USING (true);

-- Politique pour permettre la lecture publique des détails
CREATE POLICY "Public watch_details are viewable by everyone"
  ON watch_details FOR SELECT
  USING (true);

-- Politique pour permettre la lecture publique des accessoires
CREATE POLICY "Public watch_accessories are viewable by everyone"
  ON watch_accessories FOR SELECT
  USING (true);

-- Politique pour permettre la lecture publique des images
CREATE POLICY "Public watch_images are viewable by everyone"
  ON watch_images FOR SELECT
  USING (true);
```

## 5. Configuration de Supabase Storage

### Créer le bucket

1. Allez dans **Storage** dans le menu de gauche
2. Cliquez sur **New bucket**
3. Nommez-le `watch-images`
4. Cochez **Public bucket** pour permettre l'accès public aux images
5. Cliquez sur **Create bucket**

### Configurer les politiques de Storage

1. Allez dans **Storage** > **Policies** pour le bucket `watch-images`
2. Créez une politique pour permettre la lecture publique :

```sql
-- Politique pour permettre la lecture publique des images
CREATE POLICY "Public watch images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'watch-images');
```

## 6. Structure des chemins d'images

Les images doivent être organisées dans le bucket `watch-images` avec la structure suivante :

```
watch-images/
  └── watches/
      └── {watch_id}/
          ├── image-1.jpg
          ├── image-2.jpg
          └── image-3.jpg
```

## 7. Exemple de données de test

Voici un exemple de requête SQL pour insérer une montre de test :

```sql
-- Insérer une montre
INSERT INTO watches (ad_code, name, brand, model, reference, price, year, condition, description)
VALUES (
  'RLX001',
  'Rolex Submariner Date',
  'Rolex',
  'Submariner Date',
  '116610LN',
  12500.00,
  2019,
  'Excellent',
  'Rolex Submariner Date iconique en excellent état, parfaite pour la plongée et l''usage quotidien.'
)
RETURNING id;

-- Notez l'ID retourné et utilisez-le pour les requêtes suivantes
-- Remplacez {WATCH_ID} par l'ID retourné

-- Insérer les détails techniques
INSERT INTO watch_details (
  watch_id, content, movement, case_material, bracelet_material,
  case_size, thickness, dial_color, crystal, water_resistance,
  functions, power_reserve, frequency, case_condition, dial_condition,
  bracelet_condition, guarantee
)
VALUES (
  '{WATCH_ID}',
  'Full set',
  'Remontage automatique',
  'Acier inoxydable',
  'Acier inoxydable',
  '40 mm',
  '12.5 mm',
  'Noir',
  'Saphir',
  '300 m',
  'Heures, minutes, secondes, date',
  '48 heures',
  '28800 alt/h',
  'Excellent état',
  'Excellent état',
  'Excellent état',
  '1 an de garantie'
);

-- Insérer les accessoires
INSERT INTO watch_accessories (watch_id, name, included)
VALUES
  ('{WATCH_ID}', 'Boîte d''origine', true),
  ('{WATCH_ID}', 'Papiers d''origine', true),
  ('{WATCH_ID}', 'Certificat d''authenticité', true),
  ('{WATCH_ID}', 'Manuel d''utilisation', false),
  ('{WATCH_ID}', 'Étiquettes', false);

-- Insérer les images (remplacez les URLs par vos propres URLs d'images)
INSERT INTO watch_images (watch_id, image_url, image_order)
VALUES
  ('{WATCH_ID}', 'https://example.com/image1.jpg', 1),
  ('{WATCH_ID}', 'https://example.com/image2.jpg', 2),
  ('{WATCH_ID}', 'https://example.com/image3.jpg', 3);
```

## 8. Upload d'images via Supabase Storage

Pour uploader des images via l'interface Supabase :

1. Allez dans **Storage** > **watch-images**
2. Créez un dossier pour chaque montre : `watches/{watch_id}/`
3. Uploadez les images dans ce dossier
4. Après l'upload, mettez à jour la table `watch_images` avec les chemins :

```sql
-- Mettre à jour les images avec les chemins depuis Storage
UPDATE watch_images
SET image_path = 'watches/{watch_id}/image-1.jpg'
WHERE watch_id = '{WATCH_ID}' AND image_order = 1;
```

## 9. Vérification

Pour vérifier que tout fonctionne :

1. Vérifiez que les variables d'environnement sont correctement configurées
2. Démarrez l'application : `npm run dev`
3. Visitez la page `/collection` pour voir les montres
4. Cliquez sur une montre pour voir les détails

## 10. Configuration de l'interface d'administration

### Créer la table admin_users et les politiques RLS

1. Ouvrez le fichier `supabase_admin_setup.sql` à la racine du projet
2. Exécutez le script SQL complet dans l'éditeur SQL de Supabase (SQL Editor > New Query)
3. Ce script crée :
   - La table `admin_users` pour stocker les emails autorisés
   - Les politiques RLS pour permettre aux admins de modifier les données
   - Les politiques Storage pour permettre l'upload d'images

### Ajouter un administrateur

1. Créez d'abord un compte utilisateur dans Supabase Auth :
   - Allez dans **Authentication** > **Users** dans le dashboard Supabase
   - Cliquez sur **Add user** > **Create new user**
   - Entrez l'email et un mot de passe temporaire
   - L'utilisateur devra changer son mot de passe lors de la première connexion

2. Ajoutez l'email dans la table `admin_users` :
   ```sql
   INSERT INTO admin_users (email) VALUES ('votre-email@example.com');
   ```

3. Répétez pour chaque administrateur autorisé

### Accéder à l'interface admin

1. Visitez `/admin/login` dans l'application
2. Connectez-vous avec l'email et le mot de passe créés dans Supabase Auth
3. Vous serez redirigé vers `/admin` si l'email est dans la liste des admins autorisés

## 11. Notes importantes

- Les politiques RLS permettent la lecture publique mais pas l'écriture. Pour ajouter/modifier des montres, utilisez l'interface admin ou créez des politiques d'écriture sécurisées.
- Les images peuvent être stockées soit via des URLs externes (dans `image_url`), soit via Supabase Storage (dans `image_path`).
- Le service `watchService.js` gère automatiquement la génération des URLs publiques depuis Supabase Storage si `image_path` est défini.
- L'interface admin nécessite que l'utilisateur soit authentifié via Supabase Auth ET que son email soit présent dans la table `admin_users`.

## Support

Pour plus d'informations, consultez la [documentation Supabase](https://supabase.com/docs).

