const testSpan = {
  id: 'test-id',
  traceId: 'test-trace-id',
  isValid: () => true,
  end: jest.fn()
}

const createTestClient = () => ({
  start: jest.fn(),
  startSpan: jest.fn(() => testSpan),
  startNavigationSpan: jest.fn(() => testSpan),
  currentSpanContext: testSpan,
  getPlugin: jest.fn()
})

const client = createTestClient()

export default client
