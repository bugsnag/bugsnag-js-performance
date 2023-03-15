import { type Logger } from './config'

export const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object'

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
