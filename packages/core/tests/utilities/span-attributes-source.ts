import type { Attribute } from '../../lib/span'

export function spanAttributesSource (): Record<string, Attribute> {
  return {
    'browser.page.url': '',
    'browser.page.route': '',
    'bugsnag.span.category': '',
    'http.url': '',
    'http.method': '',
    'http.status_code': '',
    // 'http.flavor': 1.0,
    'http.request_content_length': '',
    'http.request_content_length_uncompressed': '',
    'http.response_content_length': '',
    'http.response_content_length_uncompressed': '',
    'http.retry_count': ''
  }
}

export default spanAttributesSource
