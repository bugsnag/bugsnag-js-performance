/**
 * @jest-environment jsdom
 */

window.fetch = jest.fn(() => Promise.resolve({ status: 200 } as unknown as Response))

// eslint-disable-next-line import/first
import BugsnagPerformance from '../lib/browser'

jest.useFakeTimers({ doNotFake: ['performance'] })

beforeEach(() => {
  console.warn = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('BugsnagPerformance Browser Client', () => {
  it('exposes a start method', () => {
    expect(BugsnagPerformance).toMatchObject({
      start: expect.any(Function)
    })
  })

  it('exposes a startSpan method', () => {
    expect(BugsnagPerformance).toMatchObject({
      startSpan: expect.any(Function)
    })
  })

  describe('Span start/end', () => {
    const testStartNanoseconds = Date.now() * 1_000_000
    const testDurationMs = 20_000

    const startDate = new Date()
    const startTimeMs = performance.now()
    const endTimeMs = startTimeMs + testDurationMs
    const endDate = new Date(startDate.getTime() + testDurationMs)

    it.each([
      { startLabel: 'a date', startValue: startDate, endLabel: 'a date', endValue: endDate },
      { startLabel: 'a date', startValue: startDate, endLabel: 'a number', endValue: endTimeMs },
      { startLabel: 'a date', startValue: startDate, endLabel: 'nothing', endValue: undefined },
      { startLabel: 'a number', startValue: startTimeMs, endLabel: 'a date', endValue: endDate },
      { startLabel: 'a number', startValue: startTimeMs, endLabel: 'a number', endValue: endTimeMs },
      { startLabel: 'a number', startValue: startTimeMs, endLabel: 'nothing', endValue: undefined },
      { startLabel: 'nothing', startValue: undefined, endLabel: 'a date', endValue: endDate },
      { startLabel: 'nothing', startValue: undefined, endLabel: 'a number', endValue: endTimeMs },
      { startLabel: 'nothing', startValue: undefined, endLabel: 'nothing', endValue: undefined }
    ])('handles starting with $startLabel and ending with $endLabel', ({ startValue, endValue }) => {
      BugsnagPerformance.start({ apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', endpoint: 'test' })

      // Start
      const span = BugsnagPerformance.startSpan('Custom/Start', startValue)

      // End
      jest.advanceTimersByTime(testDurationMs)
      span.end(endValue)
      jest.runAllTimers()

      expect(fetch).toHaveBeenCalledTimes(1)

      // @ts-expect-error mock does not exist on fetch
      const requestBody = JSON.parse(window.fetch.mock.calls[0][1].body)
      const { startTimeUnixNano, endTimeUnixNano } = requestBody.resourceSpans[0].scopeSpans[0].spans[0]

      expect(Number(startTimeUnixNano)).toBeGreaterThanOrEqual(testStartNanoseconds)
      expect(Number(endTimeUnixNano)).toBeGreaterThanOrEqual(Number(startTimeUnixNano) + testDurationMs)
    })
  })
})
