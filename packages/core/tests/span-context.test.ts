import { type SpanContext, DefaultSpanContextStorage } from '../lib'

describe('DefaultSpanContextStorage', () => {
  describe('SpanContextStorage.push()', () => {
    it('pushes valid contexts onto the stack', () => {
      const contextStorage = new DefaultSpanContextStorage()

      const spanContext1 = { id: '0123456789abcdef', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
      const spanContext2 = { id: 'abcdef9876543210', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }

      contextStorage.push(spanContext1)
      expect(contextStorage.current).toBe(spanContext1)

      contextStorage.push(spanContext2)
      expect(contextStorage.current).toBe(spanContext2)
    })

    it('does not push invalid contexts onto the stack', () => {
      const contextStorage = new DefaultSpanContextStorage()

      const validSpanContext: SpanContext = { id: '0123456789abcdef', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
      const invalidSpanContext: SpanContext = { id: 'abcdef9876543210', traceId: '0123456789abcdeffedcba9876543210', isValid: () => false }

      contextStorage.push(validSpanContext)
      contextStorage.push(invalidSpanContext)
      expect(contextStorage.current).toBe(validSpanContext)
    })
  })

  describe('SpanContextStorage.pop()', () => {
    it('only pops the supplied context if it is the current context', () => {
      const contextStorage = new DefaultSpanContextStorage()

      const spanContext1 = { id: '0123456789abcdef', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
      const spanContext2 = { id: 'abcdef9876543210', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }

      contextStorage.push(spanContext1)
      contextStorage.push(spanContext2)
      expect(contextStorage.current).toBe(spanContext2)

      // spanContext1 is not the current context so should not be popped
      contextStorage.pop(spanContext1)
      expect(contextStorage.current).toBe(spanContext2)

      // spanContext2 is the current context so should be popped
      contextStorage.pop(spanContext2)
      expect(contextStorage.current).toBe(spanContext1)

      contextStorage.pop(spanContext2)
      expect(contextStorage.current).toBe(spanContext1)

      contextStorage.pop(spanContext1)
      expect(contextStorage.current).toBeUndefined()
    })

    it('removes invalid contexts from the stack when popped', () => {
      const contextStorage = new DefaultSpanContextStorage()

      const spanContext1 = { id: '0123456789abcdef', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
      const spanContext2 = { id: 'abcdef9876543210', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
      const spanContext3 = { id: 'abcdef0123456789', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
      const spanContext4 = { id: 'fedcba0123456789', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }

      contextStorage.push(spanContext1)
      contextStorage.push(spanContext2)
      contextStorage.push(spanContext3)
      contextStorage.push(spanContext4)

      // middle 2 contexts are no longer valid
      spanContext2.isValid = () => false
      spanContext3.isValid = () => false

      // current context is still spanContext4 as this is still valid
      expect(contextStorage.current).toBe(spanContext4)

      // popping current context should pop all the way down to next valid context
      contextStorage.pop(spanContext4)
      expect(contextStorage.current).toBe(spanContext1)
    })
  })

  describe('SpanContextStorage.current', () => {
    it('removes invalid contexts from the stack when current is called', () => {
      const contextStorage = new DefaultSpanContextStorage()

      const spanContext1 = { id: '0123456789abcdef', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
      const spanContext2 = { id: 'abcdef9876543210', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
      const spanContext3 = { id: 'abcdef0123456789', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }

      contextStorage.push(spanContext1)
      contextStorage.push(spanContext2)
      contextStorage.push(spanContext3)

      expect(contextStorage.current).toBe(spanContext3)

      spanContext3.isValid = () => false
      expect(contextStorage.current).toBe(spanContext2)

      spanContext2.isValid = () => false
      expect(contextStorage.current).toBe(spanContext1)

      spanContext1.isValid = () => false
      expect(contextStorage.current).toBeUndefined()
    })
  })

  describe('Iterable<SpanContext>', () => {
    it('allows the stack to be iterated', () => {
      const contextStorage = new DefaultSpanContextStorage()
      const spanContexts = []

      // push some contexts onto the stack
      for (let i = 0; i < 10; i++) {
        const spanContext = { id: `${i}123456789abcdef`, traceId: '0123456789abcdeffedcba9876543210', isValid: () => true }
        spanContexts.push(spanContext)
        contextStorage.push(spanContext)
      }

      // iterate over the context stack and check each item
      let position = spanContexts.length - 1
      for (const context of contextStorage) {
        expect(context).toBe(spanContexts[position])
        position--
      }

      // make sure we got to the end of the collection and the stack is in tact
      expect(position).toEqual(-1)
      expect(contextStorage.current).toBe(spanContexts.pop())
    })
  })
})
