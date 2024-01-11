import { createTestClient } from '@bugsnag/js-performance-test-utilities'

const client = createTestClient({
  platformExtensions: (spanFactory, spanContextStorage) => ({
    startNavigationSpan: jest.fn((name) => {
      const span = { name, id: 'span-id', traceId: 'trace-id', isValid: () => true, end: jest.fn() }
      spanContextStorage.push(span)
      return span
    })
  })
})

export default client
