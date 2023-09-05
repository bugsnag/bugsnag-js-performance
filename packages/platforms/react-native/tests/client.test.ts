import { platformExtensions } from '../lib/client'
import { createTestClient, VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

describe('BugsnagPerformance', () => {
  it('uses the logger from config', async () => {
    const testClient = createTestClient({ platformExtensions })

    testClient.start({ apiKey: VALID_API_KEY, appName: 'test', logger })
    await jest.advanceTimersByTimeAsync(0)

    testClient.startViewLoadSpan('test')

    expect(logger.debug).toHaveBeenCalledWith('Starting view load span')
  })
})
