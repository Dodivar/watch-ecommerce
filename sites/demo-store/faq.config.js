/**
 * FAQ de démonstration — modèle pour les nouvelles instances (`SITE_ID=demo-store`).
 * Remplacez les textes par le contenu définitif du client ou désactivez avec `enabled: false`.
 */
export default {
  enabled: true,
  heading: 'Questions fréquentes',
  subheading: 'Exemple de structure pour la FAQ (textes génériques — à adapter par marque).',
  items: [
    {
      id: 1,
      question: 'Comment fonctionne ce site de démonstration ?',
      answer:
        'Ce déploiement sert à valider le <strong>template multi-site</strong> : même socle applicatif, identité et contenus propres à chaque instance. Les textes et coordonnées sont des <strong>placeholders</strong> ; remplacez-les dans <code class="text-sm bg-gray-100 px-1 rounded">sites/demo-store/</code> avant toute mise en production.',
    },
    {
      id: 2,
      question: 'Où modifier la FAQ pour mon instance ?',
      answer:
        'Éditez le fichier <strong>faq.config.js</strong> dans le dossier de votre site sous <code class="text-sm bg-gray-100 px-1 rounded">sites/&lt;SITE_ID&gt;/</code>, puis rebuild. Les titres des sections utilisent les champs <code class="text-sm bg-gray-100 px-1 rounded">heading</code> et <code class="text-sm bg-gray-100 px-1 rounded">subheading</code>.',
    },
    {
      id: 3,
      question: 'Comment désactiver la FAQ sur une instance ?',
      answer:
        'Dans le même fichier, passez <strong>enabled</strong> à <code class="text-sm bg-gray-100 px-1 rounded">false</code> et laissez <code class="text-sm bg-gray-100 px-1 rounded">items</code> vide : la section et le lien « FAQ » du menu disparaissent automatiquement.',
    },
  ],
}
