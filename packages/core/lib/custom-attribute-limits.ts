import type { SpanAttributesLimits } from './attributes'

export const ATTRIBUTE_STRING_VALUE_LIMIT_DEFAULT = 1024
export const ATTRIBUTE_STRING_VALUE_LIMIT_MAX = 10_000

export const ATTRIBUTE_ARRAY_LENGTH_LIMIT_DEFAULT = 1000
export const ATTRIBUTE_ARRAY_LENGTH_LIMIT_MAX = 10_000

export const ATTRIBUTE_COUNT_LIMIT_DEFAULT = 128
export const ATTRIBUTE_COUNT_LIMIT_MAX = 1000

export const defaultSpanAttributeLimits: SpanAttributesLimits = {
  attributeStringValueLimit: ATTRIBUTE_STRING_VALUE_LIMIT_DEFAULT,
  attributeArrayLengthLimit: ATTRIBUTE_ARRAY_LENGTH_LIMIT_DEFAULT,
  attributeCountLimit: ATTRIBUTE_COUNT_LIMIT_DEFAULT
}

export const defaultResourceAttributeLimits: SpanAttributesLimits = {
  attributeStringValueLimit: Infinity,
  attributeArrayLengthLimit: Infinity,
  attributeCountLimit: Infinity
}
