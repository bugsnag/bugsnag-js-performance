import { type Span } from '@bugsnag/core-performance'

export const createTestClient = (testSpan: Span) => ({
  start: jest.fn(),
  startSpan: jest.fn(),
  startNavigationSpan: jest.fn(() => testSpan),
  currentSpanContext: testSpan,
  getPlugin: jest.fn()
})
