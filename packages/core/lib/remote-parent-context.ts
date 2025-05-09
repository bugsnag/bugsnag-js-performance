import { scaleProbabilityToMatchSamplingRate } from './sampler'
import type { ParentContext } from './span'
import { isSpanContext } from './validation'

const TRACE_PERENT_REGEX = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9]{2}$/

class RemoteParentContext implements ParentContext {
  readonly id: string
  readonly traceId: string

  constructor (maybeParentContext: ParentContext | string, traceId?: string) {
    if (typeof maybeParentContext === 'string') {
      this.id = maybeParentContext
      this.traceId = traceId || ''
    } else {
      this.id = maybeParentContext.id
      this.traceId = maybeParentContext.traceId
    }
  }

  encodeAsTraceParent () {
    return RemoteParentContext.toTraceParentString(this)
  }

  static parseTraceParent (encodedString: string) {
    if (!TRACE_PERENT_REGEX.test(encodedString)) {
      return undefined
    }

    const [, traceId, spanId] = encodedString.split('-')
    return new RemoteParentContext(spanId, traceId)
  }

  static toTraceParentString (context: ParentContext) {
    let sampled = true
    if (isSpanContext(context)) {
      const scaledProbability = scaleProbabilityToMatchSamplingRate(context.samplingProbability)
      sampled = context.samplingRate <= scaledProbability
    }

    return `00-${context.traceId}-${context.id}-${sampled ? '01' : '00'}`
  }
}

export default RemoteParentContext
