/**
 * Cartes de la section d’accueil « Nos sélections du moment ».
 *
 * Images — deux options :
 *
 * 1) Public (le plus simple)
 *    Placer les fichiers dans : sites/place-des-montres/public/home-selections/
 *    Utiliser : image: '/home-selections/omega.jpg'
 *
 * 2) Assets + import Vite (optimisé au build)
 *    Placer les fichiers dans : sites/place-des-montres/src/assets/home-selections/
 *    Décommenter les imports ci-dessous et utiliser la variable à la place du chemin public.
 */
// import omegaImg from '@site/assets/home-selections/omega.jpg'
// import hommeImg from '@site/assets/home-selections/montres-homme.jpg'
// import femmeImg from '@site/assets/home-selections/montres-femme.jpg'

export default [
  {
    label: 'Omega',
    filters: { marque: 'omega' },
    image: '/home-selections/omega.jpg',
    // image: omegaImg,
    imageAlt: 'Sélection montres Omega',
  },
  {
    label: 'Montres homme',
    filters: { public: 'homme' },
    image: '/home-selections/montres-homme.jpg',
    // image: hommeImg,
    imageAlt: 'Montres pour homme',
  },
  {
    label: 'Montres femme',
    filters: { public: 'femme' },
    image: '/home-selections/montres-femme.jpg',
    // image: femmeImg,
    imageAlt: 'Montres pour femme',
  },
]
