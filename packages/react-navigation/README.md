# `@bugsnag/react-navigation-performance`

A react navigation integration for BugSnag performance

## Usage

```typescript
import BugsnagPerformance from "@bugsnag/react-native-performance"
import { ReactNavigationNativePlugin } from '@bugsnag/react-navigation-performance'
import { NavigationContainer } from "@react-navigation/native"

const reactNavigationPlugin = new ReactNavigationNativePlugin(NavigationContainer)

BugsnagPerformance.start({
  apiKey: "my-api-key",
  plugins: [reactNavigationPlugin]
})

const App = () => {
  const BugsnagNavigationContainer = reactNavigationPlugin.createNavigationContainer()

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

### Ending Navigation Spans

React Navigation doesn’t provide a way for us to detect when a navigation has ended. To mark the end of the navigation span, we therefore provide a **CompleteNavigation** component.

The **CompleteNavigation** component is used to wrap individual screens or components and ends the navigation span depending on the value of the on prop, which can be "mount", "unmount" or a boolean expression.

```typescript
import { SafeAreaView, Text, Image } from 'react-native'
import { CompleteNavigation } from '@bugsnag/react-navigation-performance'
import { useProfileData } from 'some-data-management-library'

const ProfileScreen = () => {
  const { data, loadingComplete } = useProfileData()

  return (
    <SafeAreaView>
      <CompleteNavigation on={loadingComplete} >
      <Text>ProfileScreen</Text>
      {data ? (
        <Text>{data.username}</Text>
        <Image source={data.imageUrl} />
      ) : null}
    </SafeAreaView>
  )
}
```
