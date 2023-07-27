import { isObject } from '@bugsnag/core-performance'

export interface SendPageAttributes {
  referrer?: boolean
  title?: boolean
  url?: boolean
}

export const defaultSendPageAttributes = {
  referrer: true,
  title: true,
  url: true
}

export function getPermittedAttributes (sendPageAttributes: SendPageAttributes) {
  return {
    ...defaultSendPageAttributes,
    ...sendPageAttributes
  }
}

export function isSendPageAttributes (obj: unknown): obj is SendPageAttributes {
  const allowedTypes = ['undefined', 'boolean']
  const keys = Object.keys(defaultSendPageAttributes)

  return isObject(obj) && keys.every(key => allowedTypes.includes(typeof obj[key]))
}
