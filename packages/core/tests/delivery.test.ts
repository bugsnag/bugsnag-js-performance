import { TracePayloadEncoder } from '../lib/delivery'
import {
  createConfiguration,
  createEndedSpan,
  createSamplingProbability,
  IncrementingClock,
  resourceAttributesSource
} from '@bugsnag/js-performance-test-utilities'

describe('TracePayloadEncoder', () => {
  it('encodes spans into a TracePayload', async () => {
    const encoder = new TracePayloadEncoder(
      new IncrementingClock('1970-01-01T00:00:00Z'),
      createConfiguration({ apiKey: 'an api key' }),
      resourceAttributesSource
    )

    const spans = [
      createEndedSpan({
        id: '5b306f21daa04ddd',
        name: 'span #1',
        kind: 1,
        traceId: '36d2995627e423c69b09bb8dd63157b0',
        startTime: 1,
        endTime: 2,
        samplingProbability: createSamplingProbability(0.5)
      }),
      createEndedSpan({
        id: '389cbf7a934bf299',
        name: 'span #2',
        kind: 1,
        traceId: '6aa28c93e95d309b7b5d9888dd2d688d',
        startTime: 3,
        endTime: 4,
        samplingProbability: createSamplingProbability(0.5)
      }),
      createEndedSpan({
        id: 'e1bafc75f74e62ee',
        name: 'span #3',
        kind: 1,
        traceId: '91024bae685205009ce9003f1d11aadd',
        startTime: 5,
        endTime: 6,
        samplingProbability: createSamplingProbability(0.25)
      })
    ]

    const actual = await encoder.encode(spans)

    expect(actual).toStrictEqual({
      body: {
        resourceSpans: [
          {
            resource: {
              attributes: [
                { key: 'deployment.environment', value: { stringValue: 'test' } },
                { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.core' } },
                { key: 'telemetry.sdk.version', value: { stringValue: '1.2.3' } },
                { key: 'service.name', value: { stringValue: 'unknown_service' } },
                { key: 'service.version', value: { stringValue: '3.4.5' } }
              ]
            },
            scopeSpans: [
              {
                spans: [
                  {
                    attributes: [],
                    endTimeUnixNano: '2000000',
                    events: [],
                    kind: 1,
                    name: 'span #1',
                    parentSpanId: undefined,
                    spanId: '5b306f21daa04ddd',
                    startTimeUnixNano: '1000000',
                    traceId: '36d2995627e423c69b09bb8dd63157b0'
                  },
                  {
                    attributes: [],
                    endTimeUnixNano: '4000000',
                    events: [],
                    kind: 1,
                    name: 'span #2',
                    parentSpanId: undefined,
                    spanId: '389cbf7a934bf299',
                    startTimeUnixNano: '3000000',
                    traceId: '6aa28c93e95d309b7b5d9888dd2d688d'
                  },
                  {
                    attributes: [],
                    endTimeUnixNano: '6000000',
                    events: [],
                    kind: 1,
                    name: 'span #3',
                    parentSpanId: undefined,
                    spanId: 'e1bafc75f74e62ee',
                    startTimeUnixNano: '5000000',
                    traceId: '91024bae685205009ce9003f1d11aadd'
                  }
                ]
              }
            ]
          }
        ]
      },
      headers: {
        'Bugsnag-Api-Key': 'an api key',
        'Content-Type': 'application/json',
        'Bugsnag-Span-Sampling': '0.5:2;0.25:1'
      }
    })
  })

  describe('Bugsnag-Span-Sampling header', () => {
    it.each([
      { spanProbabilities: [], expected: '1:0' },
      { spanProbabilities: [1.0], expected: '1:1' },
      { spanProbabilities: [0], expected: '0:1' },
      { spanProbabilities: [1.0, 1, 1], expected: '1:3' },
      { spanProbabilities: [0.1, 0.2, 0.3], expected: '0.1:1;0.2:1;0.3:1' },
      { spanProbabilities: [0.75, 1, 1.0, 0.5, 0.5, 0.5], expected: '1:2;0.75:1;0.5:3' },
      {
        spanProbabilities: Array(25).fill(0.4).concat(Array(50).fill(0.8)).concat(Array(10).fill(1)),
        expected: '1:10;0.4:25;0.8:50'
      }
    ])('generates "$expected" with span probabilities of "$spanProbabilities"', async ({ spanProbabilities, expected }) => {
      const encoder = new TracePayloadEncoder(
        new IncrementingClock(),
        createConfiguration(),
        resourceAttributesSource
      )

      const spans = spanProbabilities.map(
        probability => createEndedSpan({
          samplingProbability: createSamplingProbability(probability)
        })
      )

      const payload = await encoder.encode(spans)

      expect(payload.headers['Bugsnag-Span-Sampling']).toBe(expected)
    })

    it('omits the header if the configuration has a samplingProbability defined', async () => {
      const encoder = new TracePayloadEncoder(
        new IncrementingClock(),
        createConfiguration({ samplingProbability: 0.5 }),
        resourceAttributesSource
      )

      const spans = [createEndedSpan({
        samplingProbability: createSamplingProbability(0.5)
      })]

      const payload = await encoder.encode(spans)

      expect(payload.headers['Bugsnag-Span-Sampling']).toBeUndefined()
    })
  })
})
