import { createSpan, createTestClient } from '@bugsnag/js-performance-test-utilities'

const client = createTestClient({
  platformExtensions: (spanFactory, spanContextStorage) => ({
    startNavigationSpan: jest.fn((name) => {
      const span = createSpan(name)
      spanContextStorage.push(span)
      return span
    })
  })
})

export default client
