# `@bugsnag/instrumented-component-lifecycle`

A higher order component (HOC) for instrumenting BugSnag Performance spans.

## Usage

```typescript
import BugsnagPerformance from "@bugsnag/browser-performance"
import withInstrumentedComponentLifecycle from "@bugsnag/instrumented-component-lifecycle"

BugsnagPerformance.start({ apiKey: "my-api-key" });

class App extends React.Component {
  render() {
    return (
      <SomeComponent>
        <AnotherComponent />
      </SomeComponent>
    )
  }
}
export default withInstrumentedComponentLifecycle(App, { name: 'ComponentName' })
```
