import { useEffect, useState } from 'react'
import BugsnagPerformance from '@bugsnag/browser-performance'

function CustomSpans() {
  const [spanCreated, setSpanCreated] = useState(false)

  useEffect(() => {
    const span = BugsnagPerformance.startSpan('Custom Spans Page', { parentContext: null })      //parentContext: null pass this parameter when we want new trace id
    return () => span.end()
  }, [])

  const createSimpleSpan = () => {
    const span = BugsnagPerformance.startSpan('Simple Operation')
    
    // Simulate some work
    setTimeout(() => {
      span.end()
      setSpanCreated(true)
      setTimeout(() => setSpanCreated(false), 2000)
    }, 500)
  }

  const createNestedSpans = () => {
    const parentSpan = BugsnagPerformance.startSpan('Parent Operation')
    setSpanCreated(true)

    // Create child spans
    const child1 = BugsnagPerformance.startSpan('Child Operation 1')
    setTimeout(() => {
      child1.end()
    }, 300)

    const child2 = BugsnagPerformance.startSpan('Child Operation 2')
    setTimeout(() => {
      child2.end()
      parentSpan.end()
      setTimeout(() => setSpanCreated(false), 2000)
    }, 600)
  }

  const createSpanWithContext = () => {
    const span = BugsnagPerformance.startSpan('Complex Operation')
    
    // Add metadata to the span
    span.setAttribute('operation_id', '12345')
    span.setAttribute('user_type', 'premium')
    span.setAttribute('region', 'us-east-1')

    setTimeout(() => {
      span.end()
      setSpanCreated(true)
      setTimeout(() => setSpanCreated(false), 2000)
    }, 800)
  }

  const createLongRunningSpan = () => {
    const span = BugsnagPerformance.startSpan('Long Running Operation', {
      startTime: Date.now()
    })
    setSpanCreated(true)

    setTimeout(() => {
      span.end()
      setTimeout(() => setSpanCreated(false), 2000)
    }, 2000)
  }

  return (
    <div className="page">
      <h1>📊 Custom Spans</h1>

      <div className="section">
        <h2>Create Custom Performance Spans</h2>
        <p>
          Custom spans allow you to track specific operations in your application.
          They measure the time between <code>startSpan()</code> and <code>span.end()</code>.
        </p>
      </div>

      <div className="section">
        <h3>Simple Span</h3>
        <p>
          Create a basic span that tracks an operation for about 500ms.
        </p>
        <div className="button-group">
          <button onClick={createSimpleSpan}>Create Simple Span</button>
        </div>
        <div className="example-code">
{`const span = BugsnagPerformance.startSpan('Simple Operation')
setTimeout(() => {
  span.end()
}, 500)`}
        </div>
        {spanCreated && <div className="success">✓ Span created and sent to Bugsnag!</div>}
      </div>

      <div className="section">
        <h3>Nested Spans</h3>
        <p>
          Create parent and child spans to track hierarchical operations.
          This is useful for tracking operations with sub-tasks.
        </p>
        <div className="button-group">
          <button onClick={createNestedSpans}>Create Nested Spans</button>
        </div>
        <div className="example-code">
{`const parentSpan = BugsnagPerformance.startSpan('Parent Operation')

const child1 = BugsnagPerformance.startSpan('Child Operation 1')
setTimeout(() => child1.end(), 300)

const child2 = BugsnagPerformance.startSpan('Child Operation 2')
setTimeout(() => {
  child2.end()
  parentSpan.end()
}, 600)`}
        </div>
      </div>

      <div className="section">
        <h3>Spans with Context</h3>
        <p>
          Add attributes to spans to provide additional context about the operation.
          This helps with filtering and analyzing performance data.
        </p>
        <div className="button-group">
          <button onClick={createSpanWithContext}>Create Span with Context</button>
        </div>
        <div className="example-code">
{`const span = BugsnagPerformance.startSpan('Complex Operation')
span.setAttribute('operation_id', '12345')
span.setAttribute('user_type', 'premium')
span.setAttribute('region', 'us-east-1')
span.end()`}
        </div>
      </div>

      <div className="section">
        <h3>Long Running Span</h3>
        <p>
          Create a span that runs for 2 seconds to simulate longer operations
          like data processing or heavy computations.
        </p>
        <div className="button-group">
          <button onClick={createLongRunningSpan}>Create 2s Span</button>
        </div>
        <div className="example-code">
{`const span = BugsnagPerformance.startSpan('Long Running Operation')
setTimeout(() => {
  span.end()
}, 2000)`}
        </div>
      </div>

      <div className="section">
        <h3>Best Practices</h3>
        <ul style={{ marginLeft: '20px' }}>
          <li>Always call <code>span.end()</code> to complete the span</li>
          <li>Use meaningful names for your spans that describe the operation</li>
          <li>Add attributes to provide context about the operation</li>
          <li>Use nested spans for hierarchical operations</li>
          <li>Don't create too many spans - focus on critical operations</li>
        </ul>
      </div>
    </div>
  )
}

export default CustomSpans
