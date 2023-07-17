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
  return isObject(obj) && Object.values(obj).every(value => typeof value === 'boolean') && Object.keys(obj).every(key => Object.keys(defaultSendPageAttributes).includes(key))
}
