/**
 * Cartes de la section d’accueil « Nos sélections du moment ».
 *
 * Images — deux options :
 *
 * 1) Public (le plus simple)
 *    Placer les fichiers dans : sites/place-des-montres/public/home-selections/
 *    Utiliser : image: publicPath('home-selections/omega.jpg')
 *
 * 2) Assets + import Vite (optimisé au build)
 *    Placer les fichiers dans : sites/place-des-montres/src/assets/home-selections/
 *    Décommenter les imports ci-dessous et utiliser la variable à la place du chemin public.
 */
import { publicPath } from '../../packages/base/src/utils/publicPath.js'
import { t } from '../../packages/base/src/site/i18nValue.js'

// import omegaImg from '@site/assets/home-selections/omega.jpg'
// import hommeImg from '@site/assets/home-selections/montres-homme.jpg'
// import femmeImg from '@site/assets/home-selections/montres-femme.jpg'

export default [
  {
    label: 'Omega',
    filters: { marque: 'omega' },
    image: publicPath('home-selections/omega.jpg'),
    // image: omegaImg,
    imageAlt: t({
      fr: 'Sélection montres Omega',
      en: 'A selection of Omega watches',
      de: 'Auswahl an Omega-Uhren',
    }),
  },
  {
    label: t({
      fr: 'Montres homme',
      en: "Men's watches",
      de: 'Herrenuhren',
    }),
    filters: { public: 'homme' },
    image: publicPath('home-selections/montres-homme.jpg'),
    // image: hommeImg,
    imageAlt: t({
      fr: 'Montres pour homme',
      en: 'Watches for men',
      de: 'Uhren für Herren',
    }),
  },
  {
    label: t({
      fr: 'Montres femme',
      en: "Women's watches",
      de: 'Damenuhren',
    }),
    filters: { public: 'femme' },
    image: publicPath('home-selections/montres-femme.jpg'),
    // image: femmeImg,
    imageAlt: t({
      fr: 'Montres pour femme',
      en: 'Watches for women',
      de: 'Uhren für Damen',
    }),
  },
]
