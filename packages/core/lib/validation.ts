import { type Logger } from './config'
import { type PersistedProbability } from './persistence'
import { type SpanContext } from './span-context'

export const isBoolean = (value: unknown): value is boolean =>
  value === true || value === false

export const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value)

export const isString = (value: unknown): value is string =>
  typeof value === 'string'

export const isStringWithLength = (value: unknown): value is string =>
  isString(value) && value.length > 0

export const isLogger = (value: unknown): value is Logger =>
  isObject(value) &&
    typeof value.debug === 'function' &&
    typeof value.info === 'function' &&
    typeof value.warn === 'function' &&
    typeof value.error === 'function'

export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isStringWithLength)

export const isStringOrRegExpArray = (value: unknown): value is Array<string | RegExp> => Array.isArray(value) && value.every(item => isStringWithLength(item) || item instanceof RegExp)

export function isPersistedProbabilty (value: unknown): value is PersistedProbability {
  return isObject(value) &&
    isNumber(value.value) &&
    isNumber(value.time)
}

export const isSpanContext = (value: unknown): value is SpanContext =>
  isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.traceId === 'string' &&
    typeof value.isValid === 'function'
