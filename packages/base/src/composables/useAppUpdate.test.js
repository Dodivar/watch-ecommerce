/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchDeployedVersionMock = vi.hoisted(() => vi.fn())
const appVersionMock = vi.hoisted(() => ({ value: 'abc123456789' }))

vi.mock('@/services/appVersion.js', () => ({
  get APP_VERSION() {
    return appVersionMock.value
  },
  fetchDeployedVersion: fetchDeployedVersionMock,
}))

const {
  CHECK_THROTTLE_MS,
  checkForUpdate,
  isUpdateAvailable,
  isVersionCheckSupported,
  resetAppUpdateState,
} = await import('./useAppUpdate.js')

beforeEach(() => {
  vi.clearAllMocks()
  appVersionMock.value = 'abc123456789'
  resetAppUpdateState()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkForUpdate', () => {
  it('signale la mise à jour quand la version déployée diffère', async () => {
    fetchDeployedVersionMock.mockResolvedValue('def987654321')

    await checkForUpdate()

    expect(isUpdateAvailable.value).toBe(true)
  })

  it('ne signale rien quand la version déployée est celle du bundle', async () => {
    fetchDeployedVersionMock.mockResolvedValue('abc123456789')

    await checkForUpdate()
    expect(isUpdateAvailable.value).toBe(false)

    // Une version identique ne verrouille pas l'état : la vérification suivante a lieu.
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + CHECK_THROTTLE_MS + 1)
    await checkForUpdate()

    expect(fetchDeployedVersionMock).toHaveBeenCalledTimes(2)
  })

  it('ne conclut rien d’un manifeste illisible', async () => {
    fetchDeployedVersionMock.mockResolvedValue(null)

    await checkForUpdate()
    expect(isUpdateAvailable.value).toBe(false)

    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + CHECK_THROTTLE_MS + 1)
    await checkForUpdate()

    expect(fetchDeployedVersionMock).toHaveBeenCalledTimes(2)
  })

  it('espace les vérifications déclenchées par un événement', async () => {
    fetchDeployedVersionMock.mockResolvedValue('abc123456789')

    await checkForUpdate()
    await checkForUpdate()
    await checkForUpdate()

    expect(fetchDeployedVersionMock).toHaveBeenCalledTimes(1)
  })

  it('`force` passe outre l’intervalle minimum', async () => {
    fetchDeployedVersionMock.mockResolvedValue('abc123456789')

    await checkForUpdate()
    await checkForUpdate({ force: true })

    expect(fetchDeployedVersionMock).toHaveBeenCalledTimes(2)
  })

  it('cesse d’interroger une fois la mise à jour détectée', async () => {
    fetchDeployedVersionMock.mockResolvedValue('def987654321')

    await checkForUpdate()
    await checkForUpdate({ force: true })

    expect(fetchDeployedVersionMock).toHaveBeenCalledTimes(1)
  })

  it('ne s’arme pas sur un bundle sans tampon de version (dev, test)', async () => {
    appVersionMock.value = ''

    expect(isVersionCheckSupported()).toBe(false)
    await checkForUpdate({ force: true })

    expect(fetchDeployedVersionMock).not.toHaveBeenCalled()
    expect(isUpdateAvailable.value).toBe(false)
  })
})
