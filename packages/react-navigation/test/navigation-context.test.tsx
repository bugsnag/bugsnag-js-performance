import { type Span } from '@bugsnag/core-performance'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React, { useContext } from 'react'
import { Button, View } from 'react-native'
import { NavigationContext, NavigationContextProvider } from '../lib/navigation-context'

/** Get the latest span from the context stack */
function getCurrentSpan () {
  return BugsnagPerformance.currentSpanContext as Span
}

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

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

const App = () => {
  const [currentRoute, setCurrentRoute] = React.useState('initial-route')

  return (
    <NavigationContextProvider client={BugsnagPerformance} currentRoute={currentRoute} >
      <Route />
      <Button title='Change to route 1' onPress={() => { setCurrentRoute('route-1') }} />
      <Button title='Change to route 2' onPress={() => { setCurrentRoute('route-2') }} />
    </NavigationContextProvider>
  )
}

describe('NavigationContextProvider', () => {
  it('Creates a navigation span when the currentRoute changes', () => {
    render(<App />)

    expect(getCurrentSpan()).toBeUndefined()
    fireEvent.press(screen.getByText('Change to route 1'))
    const span = getCurrentSpan() as any
    expect(span.name).toBe('route-1')
    jest.advanceTimersByTime(100)
    expect(span.end).toHaveBeenCalled()
  })

  it('Discards the active navigation span when the route changes', () => {
    render(<App />)

    // Change to a new route and block navigation
    fireEvent.press(screen.getByText('Change to route 1'))
    fireEvent.press(screen.getByText('Block Navigation'))

    const firstRouteSpan = getCurrentSpan()
    expect((firstRouteSpan as any).name).toBe('route-1')
    jest.advanceTimersByTime(100)
    expect(firstRouteSpan.end).not.toHaveBeenCalled()

    // Change to a second route while the first navigation span is still open
    fireEvent.press(screen.getByText('Change to route 2'))

    const secondRouteSpan = getCurrentSpan()
    expect((secondRouteSpan as any).name).toBe('route-2')
    expect(firstRouteSpan.end).toHaveBeenCalledWith(-1) // Is there a better assertion to make here?
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)
    expect(secondRouteSpan.end).toHaveBeenCalled()
  })

  it('Prevents a navigation span from ending when navigation is blocked', () => {
    render(<App />)

    fireEvent.press(screen.getByText('Change to route 1'))
    jest.advanceTimersByTime(90)
    fireEvent.press(screen.getByText('Block Navigation'))
    jest.advanceTimersByTime(100)
    expect(getCurrentSpan().end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    expect(getCurrentSpan().end).not.toHaveBeenCalled()
    jest.advanceTimersByTime(100)
    expect(getCurrentSpan().end).toHaveBeenCalled()
  })

  it('Does not end a navigation span while multiple components are blocking', () => {
    render(<App />)

    fireEvent.press(screen.getByText('Change to route 1'))
    fireEvent.press(screen.getByText('Block Navigation'))
    fireEvent.press(screen.getByText('Block Navigation'))
    jest.advanceTimersByTime(100)
    expect(getCurrentSpan().end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)
    expect(getCurrentSpan().end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)
    expect(getCurrentSpan().end).toHaveBeenCalled()
  })
})
