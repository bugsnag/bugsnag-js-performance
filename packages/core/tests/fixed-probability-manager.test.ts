import FixedProbabilityManager from '../lib/fixed-probability-manager'
import Sampler from '../lib/sampler'

jest.useFakeTimers()

describe('FixedProbabilityManager', () => {
  it('configures the sampler with the supplied sampling probability', async () => {
    const sampler = new Sampler(0.75)
    await FixedProbabilityManager.create(
      sampler,
      0.95
    )

    expect(sampler.probability).toBe(0.95)
  })

  it('ignores new probability values', async () => {
    const sampler = new Sampler(0.75)
    const manager = await FixedProbabilityManager.create(
      sampler,
      0.95
    )

    await manager.setProbability(0.25)

    expect(sampler.probability).toBe(0.95)
  })

  describe('ensureFreshProbability', () => {
    it('does nothing', async () => {
      const sampler = new Sampler(0.75)

      const manager = await FixedProbabilityManager.create(
        sampler,
        0.95
      )

      await manager.setProbability(0.25)
      await manager.ensureFreshProbability()

      expect(sampler.probability).toBe(0.95)
    })
  })
})
