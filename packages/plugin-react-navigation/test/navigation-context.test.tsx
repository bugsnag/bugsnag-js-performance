import type { SpanFactory } from '@bugsnag/core-performance'
import { MockReactNativeSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeConfiguration, ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React, { useContext } from 'react'
import { Button, View } from 'react-native'
import { NavigationContext, NavigationContextProvider } from '../lib/navigation-context'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('NavigationContextProvider', () => {
  it('Creates a navigation span when the currentRoute changes', () => {
    const spanFactory = new MockReactNativeSpanFactory()
    render(<App spanFactory={spanFactory} />)

    // Initial route should not create a span
    expect(spanFactory.startNavigationSpan).not.toHaveBeenCalled()

    // Route change should create a navigation span
    fireEvent.press(screen.getByText('Change to route 1'))
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })

    // Await the navigation span to end
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalledTimes(1)

    // Navigation span has expected attributes
    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[Navigation]route-1')
    expect(span.startTime).toEqual(0)
    expect(span.endTime).toEqual(0)
    expect(span).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(span).toHaveAttribute('bugsnag.span.first_class', true)
    expect(span).toHaveAttribute('bugsnag.navigation.route', 'route-1')
    expect(span).toHaveAttribute('bugsnag.navigation.ended_by', 'immediate')
    expect(span).toHaveAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-navigation-performance')
  })

  it('Discards the active navigation span when the route changes', () => {
    const spanFactory = new MockReactNativeSpanFactory()
    render(<App spanFactory={spanFactory} />)

    // Change to a new route but block the navigation span from ending
    fireEvent.press(screen.getByText('Change to route 1'))
    fireEvent.press(screen.getByText('Block Navigation'))
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })

    // Navigation span should not end after timeout
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    // Change to a second route while the first navigation span is still open
    fireEvent.press(screen.getByText('Change to route 2'))
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledTimes(2)
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-2', { isFirstClass: true, startTime: 100, doNotDelegateToNativeSDK: true })

    // End the navigation
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalled()

    // Only the second route should have been recorded
    expect(spanFactory.createdSpans).toHaveLength(1)
    const secondRouteSpan = spanFactory.createdSpans[0]
    expect(secondRouteSpan.name).toEqual('[Navigation]route-2')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.first_class', true)
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.route', 'route-2')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.previous_route', 'route-1')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.ended_by', 'condition')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-navigation-performance')
  })

  it('Prevents a navigation span from ending when navigation is blocked', () => {
    const spanFactory = new MockReactNativeSpanFactory()
    render(<App spanFactory={spanFactory} />)

    // Start a navigation
    fireEvent.press(screen.getByText('Change to route 1'))
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })

    // Prevent navigation from ending
    fireEvent.press(screen.getByText('Block Navigation'))
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    // Unblock navigation
    fireEvent.press(screen.getByText('Unblock Navigation'))
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalled()

    const secondRouteSpan = spanFactory.createdSpans[0]
    expect(spanFactory.createdSpans).toHaveLength(1)
    expect(secondRouteSpan.name).toEqual('[Navigation]route-1')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.first_class', true)
  })

  it('Does not end a navigation span while multiple components are blocking', () => {
    const spanFactory = new MockReactNativeSpanFactory()
    render(<App spanFactory={spanFactory} />)

    // Start a navigation
    fireEvent.press(screen.getByText('Change to route 1'))
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })

    // Block navigation from completing
    fireEvent.press(screen.getByText('Block Navigation'))
    fireEvent.press(screen.getByText('Block Navigation'))
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    // Only unblock one component
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    // The navigation span should not end until all components have unblocked
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalled()
  })

  it('resets the lastRenderTime when a navigation span ends', () => {
    jest.useFakeTimers()

    const spanFactory = new MockReactNativeSpanFactory()
    render(<App spanFactory={spanFactory} />)

    // start navigation
    fireEvent.press(screen.getByText('Change to route 1'))
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })

    // lastRenderTime should be set to 2

    // block navigation to prevent current span ending
    fireEvent.press(screen.getByText('Block Navigation'))
    jest.advanceTimersByTime(100)

    // unblock navigation to end current span with specific end time and condition
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)

    // check delivered span
    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(spanFactory.createdSpans[0].startTime).toEqual(0)
    expect(spanFactory.createdSpans[0].endTime).toEqual(100)
    expect(spanFactory.createdSpans[0]).toHaveAttribute('bugsnag.navigation.ended_by', 'condition')

    // start second navigation
    fireEvent.press(screen.getByText('Change to route 2'))
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-2', { isFirstClass: true, startTime: 200, doNotDelegateToNativeSDK: true })
    jest.advanceTimersByTime(100)

    // check delivered span
    expect(spanFactory.endSpan).toHaveBeenCalledTimes(2)
    expect(spanFactory.createdSpans[1].startTime).toEqual(200)
    expect(spanFactory.createdSpans[1].endTime).toEqual(200) // Why isn't this 201?
    expect(spanFactory.createdSpans[1]).toHaveAttribute('bugsnag.navigation.ended_by', 'immediate')
  })
})

const Route = () => {
  const { blockNavigationEnd, unblockNavigationEnd, triggerNavigationEnd } = useContext(NavigationContext)

  return (
    <View>
      <Button title='Trigger Navigation End' onPress={triggerNavigationEnd} />
      <Button title='Block Navigation' onPress={blockNavigationEnd} />
      <Button title='Unblock Navigation' onPress={() => { unblockNavigationEnd('condition') }} />
    </View>
  )
}

interface AppProps {
  spanFactory: SpanFactory<ReactNativeConfiguration>
}

const App = ({ spanFactory }: AppProps) => {
  const [currentRoute, setCurrentRoute] = React.useState('initial-route')

  return (
    <NavigationContextProvider spanFactory={spanFactory as unknown as ReactNativeSpanFactory} currentRoute={currentRoute} >
      <Route />
      <Button title='Change to route 1' onPress={() => { setCurrentRoute('route-1') }} />
      <Button title='Change to route 2' onPress={() => { setCurrentRoute('route-2') }} />
    </NavigationContextProvider>
  )
}
