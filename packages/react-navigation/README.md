# `@bugsnag/react-navigation-performance`

A react navigation integration for BugSnag performance

## Usage

```typescript
import BugsnagPerformance from "@bugsnag/react-native-performance"
import ReactNavigationNativePlugin from "@bugsnag/react-navigation-performance/native"
import { NavigationContainer } from "@react-navigation/native"

const reactNavigationPlugin = new ReactNavigationNativePlugin(NavigationContainer)

BugsnagPerformance.start({
  apiKey: "my-api-key",
  plugins: [reactNavigationPlugin]
})

const BugsnagNavigationContainer = reactNavigationPlugin.createNavigationContainer()

function App () {
  return (
    <BugsnagNavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </BugsnagNavigationContainer>
  )
}
```
