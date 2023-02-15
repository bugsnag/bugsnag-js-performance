import type { Attribute } from '@bugsnag/js-performance-core/lib/span'

export function spanAttributesSource (): Record<string, Attribute> {
  return {
    'browser.page.url': window.location.href
    // 'browser.page.route': '' // TODO Implement with React, etc.
    // 'bugsnag.span.category': '', // TODO Category attributes TBD

    // TODO
    // network spans
    // should these populate at Span.end()
    // -------------
    // 'http.url': '',
    // 'http.method': '',
    // 'http.status_code': '',
    // 'http.flavor': 1.0, // (1.0 | 1.1 | 2.0 | 3.0 | SPDY | QUIC)
    // 'http.request_content_length': '',
    // 'http.request_content_length_uncompressed': '',
    // 'http.response_content_length': '',
    // 'http.response_content_length_uncompressed': '',
    // 'http.retry_count': ''
  }
}

export default spanAttributesSource
