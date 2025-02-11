import { render } from '@testing-library/react'
import * as React from 'react'
import { withInstrumentedComponentLifecycle } from '../lib/instrumented-component-lifecycle'

jest.useFakeTimers()

const mockStartSpan = jest.fn()
const mockEndSpan = jest.fn()

describe('withInstrumentedComponentLifecycle', () => {
  it('creates componentMountSpan when a component is mounted', () => {
    const Component = () => <h1>Testing</h1>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, {
      name: 'TestComponent'
    })

    expect(mockStartSpan).toHaveBeenCalledTimes(0)

    const { getByText } = render(<WrappedComponent />)

    // @ts-expect-error toBeInTheDocument is not being picked up
    expect(getByText('Testing')).toBeInTheDocument()

    expect(mockStartSpan).toHaveBeenCalledTimes(1)
  })

  it('creates componentUnmountSpan when a component is unmounted', () => {
    const Component = () => <h1>Testing</h1>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, { name: 'TestComponent' })

    expect(mockStartSpan).toHaveBeenCalledTimes(0)

    const { unmount } = render(<WrappedComponent />)
    unmount()

    expect(mockStartSpan).toHaveBeenCalledTimes(1)
    expect(mockEndSpan).toHaveBeenCalled()
  })
})
