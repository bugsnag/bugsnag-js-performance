import { coreSpanOptionSchema, type SpanOptionSchema, type SpanOptions } from './span'
import { type SpanContext } from './span-context'
import { type Time } from './time'
import { isStringWithLength } from './validation'

export interface NetworkSpanOptions extends Omit<SpanOptions, 'makeCurrentContext'> {
  method: string
  url: string
}

export interface NetworkSpanEndOptions {
  status: number
  endTime?: Time
}

export interface NetworkSpan extends SpanContext {
  end: (endOptions: NetworkSpanEndOptions) => void
}

// Clone core schema and remove makeCurrentContext
// which should always be false for network spans
const baseSchema = { ...coreSpanOptionSchema }
delete baseSchema.makeCurrentContext

export const networkSpanOptionsSchema: SpanOptionSchema = {
  ...baseSchema,
  method: {
    message: 'should be a string',
    getDefaultValue: () => undefined,
    validate: isStringWithLength
  },
  url: {
    message: 'should be a string',
    getDefaultValue: () => undefined,
    validate: isStringWithLength
  }
}
