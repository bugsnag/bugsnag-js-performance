import { type SpanAttribute } from '@bugsnag/core-performance'

function spanAttributesSource (): Map<string, SpanAttribute> {
  const spanAttributes = new Map()

  spanAttributes.set('browser.page.url', '/unit-test/span-attributes-source')
  spanAttributes.set('browser.page.route', '/unit-test/[case]')
  spanAttributes.set('bugsnag.span.category', 'unit test')
  spanAttributes.set('http.url', 'https://example.com')
  spanAttributes.set('http.method', 'GET')
  spanAttributes.set('http.status_code', 200)
  spanAttributes.set('http.flavor', 2.0)
  spanAttributes.set('http.request_content_length', 12_345)
  spanAttributes.set('http.request_content_length_uncompressed', 20_000)
  spanAttributes.set('http.response_content_length', 28_461)
  spanAttributes.set('http.response_content_length_uncompressed', 40_000)
  spanAttributes.set('http.retry_count', 2)

  return spanAttributes
}

export default spanAttributesSource
