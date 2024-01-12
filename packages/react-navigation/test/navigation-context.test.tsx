import { type Span } from '@bugsnag/core-performance'
import { InMemoryDelivery, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import type BugsnagPerformance from '@bugsnag/react-native-performance'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React, { useContext } from 'react'
import { Button, View } from 'react-native'
import { NavigationContext, NavigationContextProvider } from '../lib/navigation-context'
import reactNativePlatformExtensions from './utils/react-native-platform-extensions'

jest.useFakeTimers()

interface TestSpan extends Span {
  name: string
}

/** Get the latest span from the context stack, with added name for test purposes */
function getCurrentSpan (client: typeof BugsnagPerformance) {
  return client.currentSpanContext as TestSpan
}

const Route = () => {
  const { blockNavigationEnd, unblockNavigationEnd, triggerNavigationEnd } = useContext(NavigationContext)

  return (
    <View>
      <Button title='Trigger Navigation End' onPress={triggerNavigationEnd} />
      <Button title='Block Navigation' onPress={blockNavigationEnd} />
      <Button title='Unblock Navigation' onPress={unblockNavigationEnd} />
    </View>
  )
}

interface AppProps {
  client: typeof BugsnagPerformance
}

const App = ({ client }: AppProps) => {
  const [currentRoute, setCurrentRoute] = React.useState('initial-route')

  return (
    <NavigationContextProvider client={client} currentRoute={currentRoute} >
      <Route />
      <Button title='Change to route 1' onPress={() => { setCurrentRoute('route-1') }} />
      <Button title='Change to route 2' onPress={() => { setCurrentRoute('route-2') }} />
    </NavigationContextProvider>
  )
}

describe('NavigationContextProvider', () => {
  it('Creates a navigation span when the currentRoute changes', async () => {
    const delivery = new InMemoryDelivery()
    const client = createTestClient({
      deliveryFactory: () => delivery,
      platformExtensions: reactNativePlatformExtensions
    })

    render(<App client={client} />)

    client.start({ apiKey: VALID_API_KEY })

    // Initial route should not create a span
    expect(getCurrentSpan(client)).toBeUndefined()

    // Route change should create a navigation span
    fireEvent.press(screen.getByText('Change to route 1'))
    const span = getCurrentSpan(client)
    expect(span.name).toBe('[Navigation]route-1')

    // Await the navigation span to end
    await jest.advanceTimersByTimeAsync(100)
    expect(span.end).toHaveBeenCalled()

    // Await the payload to be delivered
    await jest.runOnlyPendingTimersAsync()
    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[Navigation]route-1' }))
  })

  it('Discards the active navigation span when the route changes', async () => {
    const delivery = new InMemoryDelivery()
    const client = createTestClient({
      deliveryFactory: () => delivery,
      platformExtensions: reactNativePlatformExtensions
    })

    render(<App client={client} />)

    client.start({ apiKey: VALID_API_KEY })

    // Change to a new route and block navigation
    fireEvent.press(screen.getByText('Change to route 1'))
    fireEvent.press(screen.getByText('Block Navigation'))

    // Blocked navigation should not end the span
    const firstRouteSpan = getCurrentSpan(client)
    expect(firstRouteSpan.name).toBe('[Navigation]route-1')
    await jest.advanceTimersByTimeAsync(100)
    expect(firstRouteSpan.end).not.toHaveBeenCalled()

    // Change to a second route while the first navigation span is still open
    fireEvent.press(screen.getByText('Change to route 2'))
    const secondRouteSpan = getCurrentSpan(client)
    expect(secondRouteSpan.name).toBe('[Navigation]route-2')

    // End the navigation
    fireEvent.press(screen.getByText('Unblock Navigation'))
    await jest.advanceTimersByTimeAsync(100)
    expect(secondRouteSpan.end).toHaveBeenCalled()

    // Await the payload to be delivered
    await jest.runOnlyPendingTimersAsync()
    expect(delivery).not.toHaveSentSpan(expect.objectContaining({ name: '[Navigation]route-1' }))
    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[Navigation]route-2' }))
  })

  it('Prevents a navigation span from ending when navigation is blocked', async () => {
    const client = createTestClient({
      platformExtensions: reactNativePlatformExtensions
    })

    render(<App client={client} />)

    client.start({ apiKey: VALID_API_KEY })

    // Start a navigation
    fireEvent.press(screen.getByText('Change to route 1'))
    const navigationSpan = getCurrentSpan(client)

    // Prevent navigation from ending
    fireEvent.press(screen.getByText('Block Navigation'))
    await jest.advanceTimersByTimeAsync(100)
    expect(navigationSpan.end).not.toHaveBeenCalled()

    // Unblock navigation
    fireEvent.press(screen.getByText('Unblock Navigation'))
    expect(navigationSpan.end).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(100)
    expect(navigationSpan.end).toHaveBeenCalled()
  })

  it('Does not end a navigation span while multiple components are blocking', async () => {
    const client = createTestClient({
      platformExtensions: reactNativePlatformExtensions
    })

    render(<App client={client} />)

    client.start({ apiKey: VALID_API_KEY })

    fireEvent.press(screen.getByText('Change to route 1'))
    const navigationSpan = getCurrentSpan(client)

    fireEvent.press(screen.getByText('Block Navigation'))
    fireEvent.press(screen.getByText('Block Navigation'))
    await jest.advanceTimersByTimeAsync(100)
    expect(navigationSpan.end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    await jest.advanceTimersByTimeAsync(100)
    expect(navigationSpan.end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    await jest.advanceTimersByTimeAsync(100)
    expect(navigationSpan.end).toHaveBeenCalled()
  })
})
