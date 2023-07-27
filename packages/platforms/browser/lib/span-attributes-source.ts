import type { InternalConfiguration, SpanAttributesSource, SpanInternal } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from './config'

export const createSpanAttributesSource = (document: Document): SpanAttributesSource<BrowserConfiguration> => {
  const defaultAttributes = {
    url: {
      name: 'bugsnag.browser.page.url',
      getValue: () => document.location.href,
      permitted: false
    },
    title: {
      name: 'bugsnag.browser.page.title',
      getValue: () => document.title,
      permitted: false
    }
  }

  return {
    configure (configuration: InternalConfiguration<BrowserConfiguration>) {
      defaultAttributes.title.permitted = configuration.sendPageAttributes.title || false
      defaultAttributes.url.permitted = configuration.sendPageAttributes.url || false
    },
    requestAttributes (span: SpanInternal) {
      for (const attribute of Object.values(defaultAttributes)) {
        if (attribute.permitted) {
          span.setAttribute(attribute.name, attribute.getValue())
        }
      }
    }
  }
}

export default createSpanAttributesSource
