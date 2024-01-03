export const createTestSpan = () => ({
  id: 'test-id',
  traceId: 'test-trace-id',
  isValid: () => true,
  end: jest.fn()
})
