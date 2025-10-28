import { scaleProbabilityToMatchSamplingRate } from './sampler'
import type { ParentContext } from './span'
import { isSpanContext } from './validation'

const TRACE_PERENT_REGEX = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9]{2}$/

export default class RemoteParentContext implements ParentContext {
  readonly id: string
  readonly traceId: string

  constructor (parentContext: ParentContext) {
    this.id = parentContext.id
    this.traceId = parentContext.traceId
  }

  encodeAsTraceParent () {
    return RemoteParentContext.toTraceParentString(this)
  }

  static parseTraceParent (encodedString: string) {
    const result = TRACE_PERENT_REGEX.exec(encodedString)
    if (!result) {
      return undefined
    }

    const [, traceId, id] = result
    return new RemoteParentContext({ id, traceId })
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
