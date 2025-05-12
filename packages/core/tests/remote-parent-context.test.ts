import traceIdToSamplingRate from '../lib/trace-id-to-sampling-rate'
import RemoteParentContext from '../lib/remote-parent-context'
import type { ParentContext } from '../lib/span'
import type { SpanContext } from '../lib/span-context'

describe('RemoteParentContext', () => {
  describe('constructor', () => {
    it('should create instance from ParentContext object', () => {
      const parentContext: ParentContext = {
        id: '1234567890123456',
        traceId: 'abcdef1234567890abcdef1234567890'
      }
      const context = new RemoteParentContext(parentContext)
      expect(context.id).toBe('1234567890123456')
      expect(context.traceId).toBe('abcdef1234567890abcdef1234567890')
    })
  })

  describe('parseTraceParent', () => {
    it('should parse valid trace parent string', () => {
      const traceParent = '00-abcdef1234567890abcdef1234567890-1234567890123456-01'
      const context = RemoteParentContext.parseTraceParent(traceParent)
      expect(context).toBeDefined()
      expect(context?.id).toBe('1234567890123456')
      expect(context?.traceId).toBe('abcdef1234567890abcdef1234567890')
    })

    it('should return undefined for invalid trace parent string', () => {
      const invalidTraceParents = [
        'invalid-string',
        '01-abcdef1234567890abcdef1234567890-1234567890123456-01', // invalid version
        '00-invalidtraceid-1234567890123456-01', // invalid trace id
        '00-abcdef1234567890abcdef1234567890-invalidspanid-01', // invalid span id
        '00-abcdef1234567890abcdef1234567890-1234567890123456-abc' // invalid trace flags
      ]

      for (const traceParent of invalidTraceParents) {
        expect(RemoteParentContext.parseTraceParent(traceParent)).toBeUndefined()
      }
    })
  })

  describe('encodeAsTraceParent', () => {
    it('should encode context as trace parent string', () => {
      const context = new RemoteParentContext({ id: '1234567890123456', traceId: 'abcdef1234567890abcdef1234567890' })
      expect(context.encodeAsTraceParent()).toBe('00-abcdef1234567890abcdef1234567890-1234567890123456-01')
    })
  })

  describe('toTraceParentString', () => {
    it('should create trace parent string from a parent context', () => {
      const context = {
        id: '1234567890123456',
        traceId: 'abcdef1234567890abcdef1234567890'
      }
      expect(RemoteParentContext.toTraceParentString(context))
        .toBe('00-abcdef1234567890abcdef1234567890-1234567890123456-01')
    })

    it('should calculate the sampled flag from a span context', () => {
      const notSampled: SpanContext = {
        id: '1234567890123456',
        traceId: '22e7e982ad6ddf2a7cd0fc895dc09d9a',
        samplingRate: traceIdToSamplingRate('22e7e982ad6ddf2a7cd0fc895dc09d9a'),
        samplingProbability: 0.5,
        isValid: () => true
      }

      expect(RemoteParentContext.toTraceParentString(notSampled))
        .toBe('00-22e7e982ad6ddf2a7cd0fc895dc09d9a-1234567890123456-00')

      const sampled: SpanContext = {
        id: '1234567890123456',
        traceId: '22e7e982ad6ddf2a7cd0fc895dc09d9a',
        samplingRate: traceIdToSamplingRate('22e7e982ad6ddf2a7cd0fc895dc09d9a'),
        samplingProbability: 0.9,
        isValid: () => true
      }

      expect(RemoteParentContext.toTraceParentString(sampled))
        .toBe('00-22e7e982ad6ddf2a7cd0fc895dc09d9a-1234567890123456-01')
    })
  })
})
