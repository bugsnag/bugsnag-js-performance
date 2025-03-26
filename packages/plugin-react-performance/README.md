# `@bugsnag/plugin-react-performance`

A [React](https://react.dev/) integration for BugSnag Performance.

### Capturing react component lifecycle metrics
BugSnag provides a higher order component for capturing rendering metrics when using React components. This method wraps your existing components and captures lifecycle metrics for each instance of the component while the application is loading, for example during the initial page load, BugSnag can report how long a given component took to load, and how frequently it updated. These metrics are sent to BugSnag as `ViewLoadPhase` spans.

```typescript
import BugsnagPerformance from "@bugsnag/browser-performance"
import { withInstrumentedComponent } from "@bugsnag/plugin-react-performance"

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
