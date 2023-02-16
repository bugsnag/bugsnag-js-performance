import type { SpanAttribute } from '../../lib/span'

function spanAttributesSource (): Record<string, SpanAttribute> {
  return {
    'browser.page.url': '/unit-test/span-attributes-source',
    'browser.page.route': '/unit-test/[case]',
    'bugsnag.span.category': 'unit test',
    'http.url': 'https://example.com',
    'http.method': 'GET',
    'http.status_code': 200,
    'http.flavor': 2.0,
    'http.request_content_length': 12_345,
    'http.request_content_length_uncompressed': 20_000,
    'http.response_content_length': 28_461,
    'http.response_content_length_uncompressed': 40_000,
    'http.retry_count': 2
  }
}

export default spanAttributesSource
