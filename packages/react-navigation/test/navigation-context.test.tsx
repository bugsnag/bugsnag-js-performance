import { fireEvent, render, screen } from '@testing-library/react-native'
import React, { useContext } from 'react'
import { Button, View } from 'react-native'
import { NavigationContext, NavigationContextProvider } from '../lib/navigation-context'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { type Span } from '@bugsnag/core-performance'

// Get the latest span from the context stack
function getCurrentSpan () {
  return BugsnagPerformance.currentSpanContext as Span
}

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

const TestApp = () => {
  const { blockNavigationEnd, unblockNavigationEnd, triggerNavigationEnd } = useContext(NavigationContext)

  return (
    <View>
      <Button title="Trigger Navigation End" onPress={triggerNavigationEnd} />
      <Button title="Block Navigation" onPress={blockNavigationEnd} />
      <Button title="Unblock Navigation" onPress={unblockNavigationEnd} />
    </View>
  )
}

describe('NavigationContextProvider', () => {
  it('Prevents a navigation span from ending when navigation is blocked', () => {
    render(
      <NavigationContextProvider client={BugsnagPerformance} currentRoute="test-route" >
        <TestApp />
      </NavigationContextProvider>
    )

    fireEvent.press(screen.getByText('Trigger Navigation End'))
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
    render(
      <NavigationContextProvider client={BugsnagPerformance} currentRoute="test-route" >
        <TestApp />
      </NavigationContextProvider>
    )

    fireEvent.press(screen.getByText('Trigger Navigation End'))
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
