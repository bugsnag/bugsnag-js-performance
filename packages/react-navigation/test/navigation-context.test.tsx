import { NavigationContextProvider, NavigationContext } from '../lib/navigation-context'
import React, { useContext } from 'react'
import { View, Button } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

function Example () {
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
  const testSpan = {
    id: 'test-id',
    traceId: 'test-trace-id',
    isValid: () => true,
    end: jest.fn()
  }

  const client = {
    start: jest.fn(),
    startSpan: jest.fn(),
    startNavigationSpan: jest.fn(() => testSpan),
    currentSpanContext: testSpan,
    getPlugin: jest.fn()
  }

  it('Automatically creates a navigation span when currentRoute is provided', () => {
    render(
        <NavigationContextProvider client={client} currentRoute="test-route" >
            <Example />
        </NavigationContextProvider>
    )

    fireEvent.press(screen.getByText('Trigger Navigation End'))
    jest.advanceTimersByTime(100)
    expect(testSpan.end).toHaveBeenCalled()
  })

  it('Prevents a navigation span from ending when navigation is blocked', () => {
    render(
        <NavigationContextProvider client={client} currentRoute="test-route" >
            <Example />
        </NavigationContextProvider>
    )

    fireEvent.press(screen.getByText('Trigger Navigation End'))
    jest.advanceTimersByTime(90) // not enough time to end the span
    fireEvent.press(screen.getByText('Block Navigation'))
    jest.advanceTimersByTime(100)
    expect(testSpan.end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    expect(testSpan.end).not.toHaveBeenCalled()
    jest.advanceTimersByTime(100)
    expect(testSpan.end).toHaveBeenCalled()
  })
})
