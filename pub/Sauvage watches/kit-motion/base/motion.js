/*
 * Kit motion Sauvage Watches — moteur commun.
 *
 * Contrat d'une composition :
 *   - une fonction render(t) qui pose TOUT l'état visuel à l'instant t (secondes),
 *     sans animation CSS ni setTimeout : le rendu image par image doit être déterministe ;
 *   - un appel Motion.start({ duration, render }) en fin de script.
 *
 * Ouverte dans un navigateur, la page joue en boucle (aperçu).
 * Avec ?render dans l'URL, elle attend que outils/render.cjs appelle render(t) image par image.
 * ?format=story (1080 × 1920, défaut) ou ?format=post (1080 × 1350).
 */
(function () {
  const params = new URLSearchParams(location.search);

  /* Formats Instagram. La zone .safe (1080 × 1350) porte le contenu ; en story elle est
     légèrement réduite et remontée pour rester hors de l'en-tête et de la barre de réponse. */
  const FORMATS = {
    story: { w: 1080, h: 1920, scale: 0.98, offY: -30 },
    post: { w: 1080, h: 1350, scale: 1, offY: 0 },
  };
  const FORMAT = FORMATS[params.get('format')] ? params.get('format') : 'story';
  const F = FORMATS[FORMAT];

  /* ---------- outils de timeline ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  /** Progression 0 → 1 de t entre a et b. */
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const eOut = k => 1 - Math.pow(1 - k, 3);
  const eOut5 = k => 1 - Math.pow(1 - k, 5);
  const eIn = k => k * k * k;
  const eInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const eBack = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const css = (el, o) => { for (const k in o) el.style[k] = o[k]; };

  /** Mots qui montent hors de leur masque, en cascade ; ressortent par le haut à tout. */
  function words(scope, t, tin, tout, stagger = .06, dur = .5) {
    $$(scope + ' .word').forEach((w, i) => {
      const kin = eOut5(P(t, tin + i * stagger, tin + i * stagger + dur));
      const kout = eIn(P(t, tout + i * stagger * .5, tout + i * stagger * .5 + .3));
      const y = (1 - kin) * 110 - kout * 110;
      css(w, { transform: `translateY(${y}%)`, opacity: kin * (1 - kout) });
    });
  }

  /** Centre d'un élément dans les coordonnées de sa zone .safe (ignore les transforms). */
  const rects = new Map();
  function rectIn(el) {
    if (rects.has(el)) return rects.get(el);
    let x = 0, y = 0, n = el;
    while (n && !n.classList.contains('safe')) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    const r = { cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
    if (el.offsetWidth) rects.set(el, r);
    return r;
  }

  /** Filigrane SW : lente rotation et léger zoom, sur toute la durée. */
  function background(t, sel = '.bg-icon') {
    $$(sel).forEach(el => css(el, { transform: `translate(-50%,-50%) rotate(${-8 + t * 1.2}deg) scale(${1 + t * .015})` }));
  }

  /** Pose le cadre : taille de la scène et placement des zones .safe. */
  function frame() {
    const stage = document.getElementById('stage');
    stage.style.width = F.w + 'px';
    stage.style.height = F.h + 'px';
    $$('.safe').forEach(el => {
      el.style.transform = `translate(-50%,-50%) translateY(${F.offY}px) scale(${F.scale})`;
    });
  }

  function start({ duration, render }) {
    frame();
    window.render = render;
    window.DURATION = duration;
    window.ready = Promise.all([
      document.fonts.ready,
      ...[...document.images].map(i => i.decode().catch(() => {})),
    ]);
    if (!params.has('render')) {
      window.ready.then(() => {
        const t0 = performance.now();
        const loop = now => { render(((now - t0) / 1000) % (duration + .6)); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      });
    }
  }

  const SVG = {
    heart: (fill = '#0f2a1d', size = 40) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="${fill}" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>`,
    arrow: (stroke = '#0f2a1d', size = 34) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    cross: (stroke = '#f7ede0', size = 50) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    bolt: (fill = '#0f2a1d') => `<svg viewBox="0 0 100 140"><path d="M58 2 L14 78 L46 78 L34 138 L86 52 L54 52 L70 2 Z" fill="${fill}"/></svg>`,
    grain: '<svg class="full grain" width="100%" height="100%"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>',
  };

  window.Motion = { FORMAT, F, start, background, SVG };
  Object.assign(window, { clamp, P, lerp, eOut, eOut5, eIn, eInOut, eBack, $, $$, css, words, rectIn });
})();
