# `@bugsnag/plugin-named-spans`

BugSnag Performance plugin providing access to open spans by name

## Usage

```typescript
import BugsnagPerformance from "@bugsnag/react-native-performance"
import { NamedSpanQuery, BugsnagNamedSpansPlugin } from '@bugsnag/plugin-named-spans'

BugsnagPerformance.start({
    apiKey: "my-api-key",
    plugins: [new BugsnagNamedSpansPlugin()]
})

const spanControls = BugsnagPerformance.getSpanControls(new NamedSpanQuery("my span"))

spanControls?.setAttribute('custom_attribute', true)
spanControls?.end()
```
