import { DefaultRoutingProvider, isRoutingProvider } from '../lib/routing-provider'

describe('DefaultRoutingProvider', () => {
  it('Ends a provided page load span', () => {
    const routingProvier = new DefaultRoutingProvider()
    const pageLoadSpan = { end: jest.fn() }
    routingProvier.initialize({ pageLoadSpan })

    expect(pageLoadSpan.end).toHaveBeenCalled()
  })

  it('Uses a provided route resolver function', () => {
    const routeResolverFn = jest.fn((url: string) => 'resolved-route')
    const routingProvier = new DefaultRoutingProvider(routeResolverFn)
    const resolvedRoute = routingProvier.resolveRoute('test-route')

    expect(resolvedRoute).toBe('resolved-route')
    expect(routeResolverFn).toHaveBeenCalled()
  })
})

describe('isRoutingProvider', () => {
  it('Returns true for a valid routing provider', () => {
    const routingProvider = new DefaultRoutingProvider()
    expect(isRoutingProvider(routingProvider)).toBe(true)
  })

  it('Returns false for an invalid routing provider', () => {
    const notRoutingProvider = { method: () => 'test' }
    expect(isRoutingProvider(notRoutingProvider)).toBe(false)
  })
})
