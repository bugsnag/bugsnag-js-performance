# `@bugsnag/plugin-react-navigation-performance`

A [React Navigation](https://reactnavigation.org/) integration for BugSnag Performance.

## Usage

```typescript
import BugsnagPerformance from "@bugsnag/react-native-performance"
import BugsnagPluginReactNavigationNativePerformance from "@bugsnag/plugin-react-navigation-performance"
import { NavigationContainer } from "@react-navigation/native"

const navigationPlugin = new BugsnagPluginReactNavigationNativePerformance()

BugsnagPerformance.start({
  apiKey: "my-api-key",
  plugins: [navigationPlugin]
})

const BugsnagNavigationContainer = navigationPlugin.createNavigationContainer(NavigationContainer)

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
