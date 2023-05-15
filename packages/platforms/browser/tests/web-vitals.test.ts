import { type SpanInternal } from '@bugsnag/js-performance-core'
import { WebVitals } from '../lib/web-vitals'

describe('WebVitals', () => {
  describe('attachTo', () => {
    it('attaches a time to first byte event', () => {
      const entry = {
        duration: 1234,
        entryType: 'navigation',
        name: 'test',
        responseStart: 5678,
        startTime: 0,
        toJSON: jest.fn()
      }

      const performance = {
        getEntriesByType: (type: string) => [entry],
        timing: {
          responseStart: 1,
          navigationStart: 0
        }
      }

      const webVitals = new WebVitals(performance)

      const span = {
        addEvent: jest.fn()
      } as unknown as SpanInternal

      webVitals.attachTo(span)

      expect(span.addEvent).toHaveBeenCalledWith('ttfb', 5678)
    })
  })
})
