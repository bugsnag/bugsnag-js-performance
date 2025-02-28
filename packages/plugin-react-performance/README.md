# `@bugsnag/plugin-react-performance`

A higher order component (HOC) for instrumenting BugSnag Performance spans.

## Usage

```typescript
import BugsnagPerformance from "@bugsnag/browser-performance"
import withInstrumentedComponent from "@bugsnag/plugin-react-performance"

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
export default withInstrumentedComponent(App, { name: 'ComponentName' })
```
