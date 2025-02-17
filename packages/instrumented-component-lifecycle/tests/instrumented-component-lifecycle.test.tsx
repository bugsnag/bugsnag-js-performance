import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { withInstrumentedComponentLifecycle } from '../lib/instrumented-component-lifecycle'
import BugsnagPerformance from '@bugsnag/browser-performance'

jest.useFakeTimers()

afterEach(() => {
  jest.clearAllMocks()
})

describe('withInstrumentedComponentLifecycle', () => {
  it('renders the provided component', () => {
    const Component = () => <h1>Testing</h1>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, {
      name: 'TestComponent'
    })

    expect(BugsnagPerformance.appState).toBe('starting')

    render(<WrappedComponent />)

    expect(screen.getByText('Testing')).toBeInTheDocument()
  })

    it('creates componentMountSpan when a appState is not ready and component is mounted', async () => {
    const Component = () => <h1>Testing</h1>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, {
      name: 'TestComponent'
    })

    const spy = jest.spyOn(BugsnagPerformance, 'startSpan')
    expect(spy).toHaveBeenCalledTimes(0)
    expect(BugsnagPerformance.appState).toBe('starting')

    await render(<WrappedComponent />)

    expect(screen.getByText('Testing')).toBeTruthy()

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('creates componentUnmountSpan when a component is unmounted', async () => {
    const Component = () => <h1>Testing</h1>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, { name: 'TestComponent' })

    const spy = jest.spyOn(BugsnagPerformance, 'startSpan')

    expect(spy).toHaveBeenCalledTimes(0)
    let span = await BugsnagPerformance.startSpan('span')
    const { unmount } = render(<WrappedComponent />)
    unmount()

    expect(spy).toHaveBeenCalledTimes(4)
    // expect(span.end()).toHaveBeenCalled()
  })

  it('creates componentUpdateSpan when a component is updated', () => {
    const WrappedComponent = withInstrumentedComponentLifecycle((props: {count: number}) => <div>{props.count}</div>)
    const { rerender } = render (<WrappedComponent count={0} />)

    const spy = jest.spyOn(BugsnagPerformance, 'startSpan')
    expect(spy).toHaveBeenCalledTimes(2)
    // expect(mockEndSpan).toHaveBeenCalledTimes(1)

    rerender(<WrappedComponent count={1} />)
    expect(spy).toHaveBeenCalledTimes(3)
    // expect(mockEndSpan).toHaveBeenCalledTimes(1)
  })

  it('does not create componentUpdateSpan if includeComponentUpdates false', () => {
    const WrappedComponent = withInstrumentedComponentLifecycle(
      (props: { count: number }) => <div>{props.count}</div>,
      {includeComponentUpdates: false}
    )
    const { rerender } = render (<WrappedComponent count={0} />)

    const spy = jest.spyOn(BugsnagPerformance, 'startSpan')
    expect(spy).toHaveBeenCalledTimes(2)
    // expect(mockEndSpan).toHaveBeenCalledTimes(1)

    rerender(<WrappedComponent count={4} />)
    // expect(mockUpdateSpan).not.toHaveBeenCalled()
  })
})
