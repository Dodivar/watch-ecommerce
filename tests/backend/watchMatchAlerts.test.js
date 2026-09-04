/**
 * Alertes « coup de foudre » : opt-in, désinscription, et surtout l'anti-doublon.
 *
 * Sur le modèle de `newsletterOptIn.test.js` (module direct) et `newsletterSend.test.js`
 * (helpers purs), plus un troisième registre que la newsletter n'avait pas besoin d'ouvrir :
 * les routes publiques sont exercées à travers le routeur Express, avec un `req`/`res` de
 * papier. Le pot de miel et la règle « le GET ne désinscrit pas » vivent dans le routage, pas
 * dans un helper — les tester ailleurs qu'ici reviendrait à tester autre chose.
 *
 * `getSupabaseClient` est remplacé dans le cache CommonJS **avant** le chargement de la route,
 * qui le déstructure à l'import.
 */
import { createRequire } from 'node:module'
import { beforeEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

const siteClients = require('../../backend/utils/siteClients.js')

/** @type {any} Client rendu à la route pour la requête en cours. */
let currentSupabase = null
siteClients.getSupabaseClient = () => {
  if (!currentSupabase) {
    throw new siteClients.MissingSecretsError('Supabase', 'demo', ['SUPABASE_URL'])
  }
  return currentSupabase
}

// Chargé APRÈS le remplacement ci-dessus.
const { buildWatchMatchAlertsRouter } = require('../../backend/routes/watchMatchAlerts.js')
const { recordMatchAlertOptIn } = require('../../backend/watchMatchAlerts/optIn.js')
const {
  runMatchAlerts,
  isMatchAlertsEnabled,
  ALERT_WINDOW_HOURS,
} = require('../../backend/watchMatchAlerts/scheduler.js')
const { loadMatchCore } = require('../../backend/watchMatchAlerts/core.js')
const {
  createWatchMatchAlertEmail,
  formatWatchPrice,
} = require('../../backend/templates/watchMatchAlertEmail.js')

/* ------------------------------------------------------------------ Doublures */

/**
 * Supabase en mémoire, réduit à ce que ces routes appellent : `select/eq/in/maybeSingle`,
 * `insert`, `update`, `upsert(ignoreDuplicates)`, `delete`. Le builder est « thenable », comme
 * celui de `@supabase/supabase-js`, pour qu'un `await` sur la chaîne suffise.
 */
function makeSupabase(seed = {}) {
  const db = {
    watch_match_alerts: (seed.watch_match_alerts || []).map((r) => ({ ...r })),
    watch_match_alert_notifications: (seed.watch_match_alert_notifications || []).map((r) => ({
      ...r,
    })),
  }
  /** Colonnes filtrées par chaque écriture, dans l'ordre : `[{ op, table, cols }]`. */
  const writes = []

  function builder(table) {
    const filters = []
    const filterCols = []
    let op = null
    let payload = null
    let ignoreDuplicates = false
    let conflictKeys = []

    function matching() {
      return (db[table] || []).filter((row) => filters.every((f) => f(row)))
    }

    function run() {
      if (op && op !== 'select') writes.push({ op, table, cols: [...filterCols] })
      if (op === 'insert') {
        const rows = (Array.isArray(payload) ? payload : [payload]).map((r) => ({
          id: `row-${db[table].length + 1}`,
          ...r,
        }))
        db[table].push(...rows)
        return rows
      }
      if (op === 'upsert') {
        const rows = Array.isArray(payload) ? payload : [payload]
        const inserted = []
        for (const row of rows) {
          const clash = db[table].some((existing) =>
            conflictKeys.every((k) => existing[k] === row[k]),
          )
          if (clash && ignoreDuplicates) continue
          const created = { id: `row-${db[table].length + 1}`, ...row }
          db[table].push(created)
          inserted.push(created)
        }
        return inserted
      }
      if (op === 'update') {
        const rows = matching()
        for (const row of rows) Object.assign(row, payload)
        return rows
      }
      if (op === 'delete') {
        const rows = matching()
        db[table] = db[table].filter((row) => !rows.includes(row))
        return rows
      }
      return matching()
    }

    const b = {
      select: () => b,
      eq(col, val) {
        filters.push((row) => row[col] === val)
        filterCols.push(col)
        return b
      },
      in(col, vals) {
        filters.push((row) => vals.includes(row[col]))
        filterCols.push(col)
        return b
      },
      gte(col, val) {
        filters.push((row) => row[col] >= val)
        return b
      },
      order: () => b,
      insert(rows) {
        op = 'insert'
        payload = rows
        return b
      },
      update(values) {
        op = 'update'
        payload = values
        return b
      },
      upsert(rows, options = {}) {
        op = 'upsert'
        payload = rows
        ignoreDuplicates = options.ignoreDuplicates === true
        conflictKeys = String(options.onConflict || '')
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
        return b
      },
      delete() {
        op = 'delete'
        return b
      },
      maybeSingle: () => Promise.resolve({ data: run()[0] || null, error: null }),
      then: (resolve, reject) =>
        Promise.resolve()
          .then(() => ({ data: run(), error: null }))
          .then(resolve, reject),
    }
    return b
  }

  return { db, writes, from: (table) => builder(table) }
}

/** Site du registre, réduit à ce que lisent la route et la boucle. */
function makeSite(overrides = {}) {
  return {
    id: 'demo',
    config: {
      raw: { features: { watchMatchmaking: true, watchMatchAlerts: true, ...overrides.features } },
      urls: { production: 'https://demo.fr' },
      backend: {
        publicApiUrl: 'https://api.demo.fr',
        email: { fromAddress: 'contact@demo.fr', fromName: 'Demo' },
      },
      checkout: { currency: 'EUR' },
    },
    secrets: { emailFrom: 'contact@demo.fr' },
  }
}

/** Requête Express minimale. */
function makeReq({ method = 'POST', url = '/subscribe', body = {}, query = {}, site, ip } = {}) {
  return {
    method,
    url,
    body,
    query,
    site,
    ip: ip || '10.0.0.1',
    socket: { remoteAddress: '10.0.0.1' },
    protocol: 'https',
    headers: {},
    get: () => 'api.demo.fr',
  }
}

/** Réponse Express minimale : retient le dernier statut et le corps. */
function makeRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      this.settle()
      return this
    },
    send(payload) {
      this.body = payload
      this.settle()
      return this
    },
  }
  res.done = new Promise((resolve) => {
    res.settle = () => resolve(res)
  })
  return res
}

/** Joue une requête à travers le routeur et rend la réponse. */
function call(router, req) {
  const res = makeRes()
  router.handle(req, res, (err) => {
    if (err) throw err
    res.statusCode = 404
    res.send('not found')
  })
  return res.done
}

/** Montre au format `findRecentWatches`. */
function makeWatch(overrides = {}) {
  const { details, ...rest } = overrides
  return {
    id: 'watch-1',
    slug: 'rolex-submariner',
    name: 'Submariner',
    brand: 'Rolex',
    reference: '126610LN',
    price: 12000,
    promotionPrice: null,
    createdAt: '2026-09-02T10:00:00.000Z',
    url: 'https://demo.fr/montre/rolex-submariner',
    imageUrl: null,
    details: {
      movement: '',
      caseMaterial: '',
      braceletMaterials: [],
      braceletColors: [],
      dialColor: '',
      ...details,
    },
    ...rest,
  }
}

/** Alerte active. */
function makeAlert(overrides = {}) {
  return {
    id: 'alert-1',
    email: 'client@example.fr',
    criteria: { brand: ['rolex'] },
    locale: 'fr',
    status: 'active',
    unsubscribe_token: 'tok-1',
    created_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

/* ------------------------------------------------------------------ Opt-in */

describe('recordMatchAlertOptIn', () => {
  it('refuse une adresse invalide sans toucher à la base', async () => {
    const supabase = makeSupabase()
    const result = await recordMatchAlertOptIn(supabase, 'demo', { email: 'pas-une-adresse' })
    expect(result.ok).toBe(false)
    expect(supabase.db.watch_match_alerts).toHaveLength(0)
  })

  it('enregistre le consentement horodaté et normalise l’adresse', async () => {
    const supabase = makeSupabase()
    const result = await recordMatchAlertOptIn(supabase, 'demo', {
      email: 'Client@Example.FR',
      criteria: { brand: ['rolex'] },
      locale: 'en',
    })
    expect(result.ok).toBe(true)
    const [row] = supabase.db.watch_match_alerts
    expect(row.email).toBe('client@example.fr')
    expect(row.status).toBe('active')
    expect(row.source).toBe('matchmaking')
    expect(row.locale).toBe('en')
    expect(row.consent_at).toBeTruthy()
  })

  it("n'écrit jamais l'historique de swipe, même s'il est dans le corps de la requête", async () => {
    const supabase = makeSupabase()
    await recordMatchAlertOptIn(supabase, 'demo', {
      email: 'client@example.fr',
      criteria: {
        brand: ['rolex'],
        seen: ['w1', 'w2', 'w3'],
        liked: ['w1'],
        passed: ['w2', 'w3'],
      },
    })
    const [row] = supabase.db.watch_match_alerts
    expect(Object.keys(row.criteria).sort()).toEqual([
      'bracelet',
      'brand',
      'budget',
      'caseMaterial',
      'color',
      'movement',
    ])
    expect(JSON.stringify(row)).not.toContain('liked')
    expect(JSON.stringify(row)).not.toContain('passed')
  })

  it('ramène une langue inconnue dans les trois admises (la contrainte CHECK sinon casse)', async () => {
    const supabase = makeSupabase()
    await recordMatchAlertOptIn(supabase, 'demo', { email: 'x@example.fr', locale: 'es-ES' })
    expect(supabase.db.watch_match_alerts[0].locale).toBe('fr')
  })

  it('réinscrit sans dupliquer, remplace les critères et garde le PREMIER consentement', async () => {
    const supabase = makeSupabase({
      watch_match_alerts: [
        {
          id: 'a1',
          site_id: 'demo',
          email: 'client@example.fr',
          consent_at: '2026-01-01T00:00:00.000Z',
          status: 'unsubscribed',
          criteria: { brand: ['omega'] },
        },
      ],
    })
    const result = await recordMatchAlertOptIn(supabase, 'demo', {
      email: 'client@example.fr',
      criteria: { brand: ['rolex'] },
    })
    expect(result.reactivated).toBe(true)
    expect(supabase.db.watch_match_alerts).toHaveLength(1)
    const [row] = supabase.db.watch_match_alerts
    expect(row.status).toBe('active')
    expect(row.unsubscribed_at).toBeNull()
    expect(row.criteria.brand).toEqual(['rolex'])
    // Le premier oui fait foi : c'est lui qui prouve le consentement en cas de contestation.
    expect(row.consent_at).toBe('2026-01-01T00:00:00.000Z')
  })
})

/* ------------------------------------------------------------------ Routes */

describe('POST /subscribe', () => {
  let router
  let site

  beforeEach(() => {
    router = buildWatchMatchAlertsRouter({ list: () => [] })
    site = makeSite()
    currentSupabase = makeSupabase()
  })

  it('enregistre une inscription complète', async () => {
    const res = await call(
      router,
      makeReq({
        site,
        body: { email: 'client@example.fr', consent: true, criteria: { brand: ['rolex'] } },
      }),
    )
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(currentSupabase.db.watch_match_alerts).toHaveLength(1)
  })

  it('avale le pot de miel : succès apparent, aucune écriture', async () => {
    const res = await call(
      router,
      makeReq({
        site,
        body: { email: 'bot@example.fr', consent: true, website: 'http://spam.example' },
      }),
    )
    // Répondre en erreur renseignerait le robot sur sa détection.
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(currentSupabase.db.watch_match_alerts).toHaveLength(0)
  })

  it('refuse une inscription sans consentement explicite', async () => {
    const res = await call(router, makeReq({ site, body: { email: 'client@example.fr' } }))
    expect(res.statusCode).toBe(400)
    expect(currentSupabase.db.watch_match_alerts).toHaveLength(0)
  })

  it('refuse une adresse invalide', async () => {
    const res = await call(
      router,
      makeReq({ site, body: { email: 'pas-une-adresse', consent: true } }),
    )
    expect(res.statusCode).toBe(400)
    expect(currentSupabase.db.watch_match_alerts).toHaveLength(0)
  })

  it('répond 404 quand la fonctionnalité est éteinte pour le site', async () => {
    const off = makeSite({ features: { watchMatchAlerts: false } })
    const res = await call(
      router,
      makeReq({ site: off, body: { email: 'client@example.fr', consent: true } }),
    )
    expect(res.statusCode).toBe(404)
    expect(currentSupabase.db.watch_match_alerts).toHaveLength(0)
  })

  it('limite le débit par IP après 5 tentatives', async () => {
    const body = { email: 'client@example.fr', consent: true }
    for (let i = 0; i < 5; i++) {
      const ok = await call(router, makeReq({ site, body, ip: '10.0.0.9' }))
      expect(ok.statusCode).toBe(200)
    }
    const blocked = await call(router, makeReq({ site, body, ip: '10.0.0.9' }))
    expect(blocked.statusCode).toBe(429)
  })

  it('répond 503 (et non 500) quand le site n’a pas de secrets Supabase', async () => {
    currentSupabase = null
    const res = await call(
      router,
      makeReq({ site, body: { email: 'client@example.fr', consent: true } }),
    )
    expect(res.statusCode).toBe(503)
    currentSupabase = makeSupabase()
  })
})

describe('désinscription par jeton', () => {
  let router
  let site

  beforeEach(() => {
    router = buildWatchMatchAlertsRouter({ list: () => [] })
    site = makeSite()
    currentSupabase = makeSupabase({
      watch_match_alerts: [
        {
          id: 'a1',
          site_id: 'demo',
          email: 'client@example.fr',
          status: 'active',
          locale: 'fr',
          criteria: { brand: ['rolex'] },
          unsubscribe_token: 'tok-1',
        },
      ],
    })
  })

  it("le GET n'a AUCUN effet de bord : il ne fait qu'afficher la confirmation", async () => {
    // Les scanners de liens des messageries suivent les GET. Si celui-ci désinscrivait,
    // un abonné serait retiré sans avoir rien cliqué.
    const res = await call(
      router,
      makeReq({ method: 'GET', url: '/unsubscribe', query: { token: 'tok-1' }, site }),
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('<form method="post"')
    expect(currentSupabase.db.watch_match_alerts[0].status).toBe('active')
  })

  it('le POST désinscrit et efface les préférences devenues sans objet', async () => {
    const res = await call(
      router,
      makeReq({ method: 'POST', url: '/unsubscribe', query: { token: 'tok-1' }, site }),
    )
    expect(res.statusCode).toBe(200)
    const [row] = currentSupabase.db.watch_match_alerts
    expect(row.status).toBe('unsubscribed')
    expect(row.unsubscribed_at).toBeTruthy()
    expect(row.criteria).toEqual({})
  })

  it('rejoué (one-click RFC 8058), le POST ne casse pas', async () => {
    const query = { token: 'tok-1' }
    await call(router, makeReq({ method: 'POST', url: '/unsubscribe', query, site }))
    const again = await call(router, makeReq({ method: 'POST', url: '/unsubscribe', query, site }))
    expect(again.statusCode).toBe(200)
  })

  it('désinscrit par réclamation conditionnelle, pas par écrasement', async () => {
    // Entre la lecture de l'alerte et son écriture, la personne peut avoir refait le parcours
    // et s'être réinscrite. Un update non filtré effacerait des préférences toutes fraîches.
    // Une doublure mono-thread ne peut pas provoquer cette course : on vérifie donc que
    // l'écriture porte bien le garde qui la rend impossible.
    await call(
      router,
      makeReq({ method: 'POST', url: '/unsubscribe', query: { token: 'tok-1' }, site }),
    )
    const update = currentSupabase.writes.find(
      (w) => w.op === 'update' && w.table === 'watch_match_alerts',
    )
    expect(update).toBeDefined()
    expect(update.cols).toContain('status')
    expect(currentSupabase.db.watch_match_alerts[0].status).toBe('unsubscribed')
  })

  it('répond 404 sur un jeton inconnu, 400 sans jeton', async () => {
    const unknown = await call(
      router,
      makeReq({ method: 'GET', url: '/unsubscribe', query: { token: 'nope' }, site }),
    )
    expect(unknown.statusCode).toBe(404)
    const missing = await call(
      router,
      makeReq({ method: 'GET', url: '/unsubscribe', query: {}, site }),
    )
    expect(missing.statusCode).toBe(400)
  })

  it('sert la page dans la langue enregistrée sur l’alerte', async () => {
    currentSupabase.db.watch_match_alerts[0].locale = 'de'
    const res = await call(
      router,
      makeReq({ method: 'GET', url: '/unsubscribe', query: { token: 'tok-1' }, site }),
    )
    expect(res.body).toContain('lang="de"')
    expect(res.body).toContain('Abmeldung best')
  })
})

/* ------------------------------------------------------------------ Envoi */

describe('runMatchAlerts', () => {
  const site = makeSite()

  /** Envoi factice : retient les appels, réussit par défaut. */
  function makeSender(result = { sent: true }) {
    const calls = []
    return {
      calls,
      fn: async (params) => {
        calls.push(params)
        return typeof result === 'function' ? result(params) : result
      },
    }
  }

  function run(supabase, sender, overrides = {}) {
    return runMatchAlerts({
      site,
      supabase,
      mailjet: {},
      alerts: [makeAlert()],
      watches: [makeWatch()],
      apiBase: 'https://api.demo.fr',
      storefrontBase: 'https://demo.fr',
      sendFn: sender.fn,
      ...overrides,
    })
  }

  it('annonce une nouveauté correspondante et journalise l’envoi', async () => {
    const supabase = makeSupabase()
    const sender = makeSender()
    expect(await run(supabase, sender)).toBe(1)
    expect(sender.calls).toHaveLength(1)
    expect(sender.calls[0].alert.email).toBe('client@example.fr')
    expect(sender.calls[0].unsubscribeUrl).toBe(
      'https://api.demo.fr/api/watch-match-alerts/unsubscribe?token=tok-1',
    )
    const [journal] = supabase.db.watch_match_alert_notifications
    expect(journal).toMatchObject({ alert_id: 'alert-1', watch_id: 'watch-1', status: 'sent' })
    expect(supabase.db.watch_match_alerts).toHaveLength(0) // rien à créer ici
  })

  it('NE REPARLE JAMAIS de la même montre à la même personne (non-régression)', async () => {
    const supabase = makeSupabase()
    const first = makeSender()
    expect(await run(supabase, first)).toBe(1)

    // Deuxième passage : la montre est toujours dans la fenêtre de 48 h, l'alerte toujours
    // active. Seul le journal empêche le doublon — `last_notified_at` ne saurait pas dire
    // *de quelle montre* on a déjà parlé.
    const second = makeSender()
    expect(await run(supabase, second)).toBe(0)
    expect(second.calls).toHaveLength(0)
    expect(supabase.db.watch_match_alert_notifications).toHaveLength(1)
  })

  it("n'annonce que les montres nouvelles depuis l'inscription (garde-fou du premier balayage)", async () => {
    const supabase = makeSupabase()
    const sender = makeSender()
    const sent = await run(supabase, sender, {
      // Le catalogue existait avant que la personne ne s'inscrive : rien à annoncer.
      watches: [makeWatch({ id: 'old', createdAt: '2026-08-01T00:00:00.000Z' })],
    })
    expect(sent).toBe(0)
    expect(sender.calls).toHaveLength(0)
    expect(supabase.db.watch_match_alert_notifications).toHaveLength(0)
  })

  it('annonce une montre plus chère que tout le stock du jour de l’inscription', async () => {
    // Non-régression : le curseur de budget poussé à fond enregistre `max: null`, et non le
    // prix de la montre la plus chère du moment. L'alerte est relue des mois plus tard, face à
    // un catalogue que ce plafond ne décrirait plus — c'est tout l'intérêt de la borne ouverte.
    const supabase = makeSupabase()
    const sender = makeSender()
    const sent = await run(supabase, sender, {
      alerts: [makeAlert({ criteria: { brand: ['rolex'], budget: { min: 8000, max: null } } })],
      watches: [makeWatch({ id: 'grande-complication', price: 250000 })],
    })
    expect(sent).toBe(1)
    expect(sender.calls[0].watches).toHaveLength(1)
  })

  it('respecte encore un plafond que le visiteur a réellement fixé', async () => {
    const supabase = makeSupabase()
    const sender = makeSender()
    const sent = await run(supabase, sender, {
      alerts: [makeAlert({ criteria: { brand: ['rolex'], budget: { min: 1000, max: 5000 } } })],
      watches: [makeWatch({ price: 12000 })],
    })
    expect(sent).toBe(0)
    expect(supabase.db.watch_match_alert_notifications).toHaveLength(0)
  })

  it('ignore une nouveauté qui ne correspond pas aux critères', async () => {
    const supabase = makeSupabase()
    const sender = makeSender()
    const sent = await run(supabase, sender, {
      watches: [makeWatch({ id: 'omega', brand: 'Omega' })],
    })
    expect(sent).toBe(0)
    expect(supabase.db.watch_match_alert_notifications).toHaveLength(0)
  })

  it('regroupe plusieurs nouveautés en un seul e-mail', async () => {
    const supabase = makeSupabase()
    const sender = makeSender()
    const sent = await run(supabase, sender, {
      watches: [makeWatch({ id: 'w1' }), makeWatch({ id: 'w2' }), makeWatch({ id: 'w3' })],
    })
    expect(sent).toBe(1)
    expect(sender.calls).toHaveLength(1)
    expect(sender.calls[0].watches).toHaveLength(3)
    expect(supabase.db.watch_match_alert_notifications).toHaveLength(3)
  })

  it("journalise TOUTES les correspondances, même au-delà de ce que l'e-mail affiche", async () => {
    // Un import en masse produit plus de correspondances que l'e-mail ne montre de cartes.
    // Tronquer avant de réclamer laisserait le surplus hors du journal : au tick suivant, la
    // réclamation reviendrait vide (les premières sont déjà là) et le reste disparaîtrait.
    const supabase = makeSupabase()
    const sender = makeSender()
    const many = Array.from({ length: 30 }, (_, i) =>
      makeWatch({ id: `w${i}`, slug: `montre-${i}` }),
    )
    expect(await run(supabase, sender, { watches: many })).toBe(1)
    expect(sender.calls).toHaveLength(1)
    expect(supabase.db.watch_match_alert_notifications).toHaveLength(30)
    expect(sender.calls[0].matchedCount).toBe(30)

    // Et le tick suivant n'a plus rien à dire : tout a été annoncé d'un coup.
    const next = makeSender()
    expect(await run(supabase, next, { watches: many })).toBe(0)
    expect(next.calls).toHaveLength(0)
  })

  it('relâche la réservation sur un échec transitoire, pour retenter au tick suivant', async () => {
    const supabase = makeSupabase()
    const failing = makeSender({ sent: false, retryable: true, error: 'Mailjet injoignable' })
    expect(await run(supabase, failing)).toBe(0)
    expect(supabase.db.watch_match_alert_notifications).toHaveLength(0)

    const retry = makeSender()
    expect(await run(supabase, retry)).toBe(1)
    expect(retry.calls).toHaveLength(1)
  })

  it('garde la trace d’un refus définitif, et n’y revient pas', async () => {
    const supabase = makeSupabase()
    const rejected = makeSender({ sent: false, retryable: false, error: 'destinataire invalide' })
    expect(await run(supabase, rejected)).toBe(0)
    expect(supabase.db.watch_match_alert_notifications[0]).toMatchObject({
      status: 'failed',
      error: 'destinataire invalide',
    })

    const retry = makeSender()
    expect(await run(supabase, retry)).toBe(0)
    expect(retry.calls).toHaveLength(0)
  })

  it('un échec sur une alerte n’empêche pas les autres de partir', async () => {
    const supabase = makeSupabase()
    const sender = makeSender((params) =>
      params.alert.id === 'alert-1' ? Promise.reject(new Error('boom')) : { sent: true },
    )
    const sent = await run(supabase, sender, {
      alerts: [
        makeAlert(),
        makeAlert({ id: 'alert-2', email: 'b@example.fr', unsubscribe_token: 'tok-2' }),
      ],
    })
    expect(sent).toBe(1)
  })
})

describe("e-mail d'alerte", () => {
  const site = makeSite()

  /**
   * Les textes viennent du catalogue du socle, chargé par `import()` depuis ce module CJS.
   * Ce bloc est donc aussi la preuve que le pont ESM tient dans le vrai chemin d'exécution :
   * si le noyau redevenait dépendant d'un alias `@/`, l'import échouerait ici.
   */
  async function copyFor(locale, params) {
    const { buildMatchAlertEmailCopy } = await loadMatchCore()
    return buildMatchAlertEmailCopy(locale, params)
  }

  it('porte un lien de désinscription dans chaque envoi (RGPD)', async () => {
    const copy = await copyFor('fr', { count: 1, brandName: 'Demo' })
    const html = createWatchMatchAlertEmail(site, {
      watches: [makeWatch()],
      copy,
      unsubscribeUrl: 'https://api.demo.fr/api/watch-match-alerts/unsubscribe?token=tok-1',
      browseUrl: 'https://demo.fr/collection',
    })
    expect(html).toContain('unsubscribe?token=tok-1')
    expect(html).toContain('Ne plus recevoir ces alertes')
    expect(html).toContain('https://demo.fr/montre/rolex-submariner')
  })

  it('part dans la langue enregistrée sur l’alerte, pas celle du site', async () => {
    const copy = await copyFor('de', { count: 1, brandName: 'Demo' })
    const html = createWatchMatchAlertEmail(site, {
      watches: [makeWatch()],
      copy,
      unsubscribeUrl: 'https://api.demo.fr/u',
    })
    expect(copy.subject).toBe('Eine Uhr für Sie bei Demo')
    expect(html).toContain('lang="de"')
  })

  it('accorde le pluriel et annonce le reste quand il y a plus de montres que de cartes', async () => {
    const copy = await copyFor('fr', { count: 7, hiddenCount: 3, brandName: 'Demo' })
    expect(copy.subject).toBe('7 montres pour vous chez Demo')
    expect(copy.more).toBe('Et 3 autres montres correspondent aussi à vos critères.')
  })

  it('affiche le prix promotionnel quand il existe', () => {
    expect(formatWatchPrice({ price: 12000, promotionPrice: 9500 }, 'fr')).toContain('9')
    expect(formatWatchPrice({ price: null }, 'fr')).toBe('')
  })
})

describe('isMatchAlertsEnabled', () => {
  it('exige les deux drapeaux : une alerte sans parcours est une faute de configuration', () => {
    expect(isMatchAlertsEnabled(makeSite())).toBe(true)
    expect(isMatchAlertsEnabled(makeSite({ features: { watchMatchAlerts: false } }))).toBe(false)
    expect(isMatchAlertsEnabled(makeSite({ features: { watchMatchmaking: false } }))).toBe(false)
    expect(isMatchAlertsEnabled({ config: {} })).toBe(false)
  })

  it('garde une fenêtre de balayage courte devant la durée de vie du catalogue', () => {
    expect(ALERT_WINDOW_HOURS).toBeLessThanOrEqual(72)
  })
})
