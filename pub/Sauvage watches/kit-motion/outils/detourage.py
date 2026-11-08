#!/usr/bin/env python3
"""
Détourage d'une photo de montre sur fond uni (photos fabricant ou studio), pour le kit motion.

    python3 outils/detourage.py <photo.jpg> <assets/montres/marque-modele-surnom-reference.png> [--fondu 0.13]

Méthode :
  1. le fond est échantillonné dans les coins, puis rempli depuis les bords (tolérance --tolerance) ;
     les trous intérieurs sont rebouchés, le bord est adouci d'environ 1 px ;
  2. si rembg est installé (pip install "rembg[cpu]" scipy), un second masque IA sert de contrôle :
     un recouvrement < 97 % signale un détourage à vérifier à l'œil ;
  3. --fondu estompe le haut et le bas de l'image (part de la hauteur) : les photos fabricant
     coupent le bracelet net, le fondu le fait disparaître dans la carte. 0 pour désactiver.
Sortie : PNG RGBA recadré au plus juste, 900 px de haut au maximum.
Pour une photo sur fond texturé ou en situation, utiliser rembg seul (--ia) et vérifier le résultat.
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage as nd


def mask_from_flat_background(a, tol):
    corners = np.concatenate([a[:8, :8].reshape(-1, 3), a[:8, -8:].reshape(-1, 3),
                              a[-8:, :8].reshape(-1, 3), a[-8:, -8:].reshape(-1, 3)])
    bgc = np.median(corners, axis=0)
    cand = np.abs(a - bgc).max(-1) <= tol
    lab, _ = nd.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = ~np.isin(lab, list(border))
    return nd.binary_fill_holes(fg), bgc


def ai_mask(im):
    from rembg import new_session, remove
    m = remove(im, session=new_session('isnet-general-use'), only_mask=True)
    return np.asarray(m).astype(float) / 255


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--tolerance', type=int, default=5, help="écart max au fond (0-255), défaut 5")
    ap.add_argument('--fondu', type=float, default=0.13, help="fondu haut/bas, part de la hauteur")
    ap.add_argument('--ia', action='store_true', help="utiliser uniquement le masque IA (fond non uni)")
    ap.add_argument('--max', type=int, default=900, help="taille max du plus grand côté")
    args = ap.parse_args()

    im = Image.open(args.src).convert('RGB')
    a = np.asarray(im).astype(int)

    if args.ia:
        alpha = ai_mask(im)
    else:
        fg, bgc = mask_from_flat_background(a, args.tolerance)
        print('fond détecté', bgc.astype(int).tolist())
        try:
            m = ai_mask(im) > .5
            iou = (m & fg).sum() / max(1, (m | fg).sum())
            print(f'contrôle IA : recouvrement {iou:.1%}' + ('  ← À VÉRIFIER' if iou < .97 else ''))
        except Exception as e:  # rembg absent ou modèle non téléchargeable
            print('contrôle IA indisponible :', e.__class__.__name__)
        alpha = nd.gaussian_filter(fg.astype(float), 0.8)
        alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)

    rgba = Image.fromarray(np.dstack([a, (alpha * 255).astype(int)]).astype(np.uint8), 'RGBA')
    rgba = rgba.crop(rgba.getchannel('A').getbbox())

    if args.fondu > 0:
        arr = np.asarray(rgba).astype(float)
        h = arr.shape[0]
        y = np.arange(h)
        ramp = np.clip(np.minimum(y, h - 1 - y) / max(1, int(h * args.fondu)), 0, 1)
        arr[..., 3] *= (ramp * ramp * (3 - 2 * ramp))[:, None]
        rgba = Image.fromarray(arr.astype(np.uint8), 'RGBA')

    rgba.thumbnail((args.max, args.max), Image.LANCZOS)
    rgba.save(args.out)
    print(args.out, rgba.size)


if __name__ == '__main__':
    main()
