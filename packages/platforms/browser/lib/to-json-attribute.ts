import type { JSONAttribute, SpanAttribute } from '@bugsnag/js-performance-core/lib/attributes'

function toJSONAttribute (key: string, attribute: SpanAttribute): JSONAttribute {
  switch (typeof attribute) {
    case 'number':
      return { key, value: { doubleValue: attribute } }
    case 'boolean':
      return { key, value: { boolValue: attribute } }
    case 'string':
      return { key, value: { stringValue: attribute } }
    default:
      return { key, value: { stringValue: attribute } }
  }
}

export default toJSONAttribute
