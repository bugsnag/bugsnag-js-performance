# `@bugsnag/plugin-react-navigation-performance`

A react navigation integration for BugSnag performance

## Usage

```typescript
import BugsnagPerformance from "@bugsnag/react-native-performance"
import BugsnagPluginReactNavigationNativePerformance from "@bugsnag/plugin-react-navigation-performance/native"
import { NavigationContainer } from "@react-navigation/native"

const pluginReactNavigation = new BugsnagPluginReactNavigationNativePerformance(NavigationContainer)

BugsnagPerformance.start({
  apiKey: "my-api-key",
  plugins: [pluginReactNavigation]
})

const BugsnagNavigationContainer = pluginReactNavigation.createNavigationContainer()

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
