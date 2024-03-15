# `@bugsnag/react-native-navigation-performance`

A react-native-navigation integration for BugSnag performance

## Usage

```typescript
import BugsnagPerformance from "@bugsnag/react-native-performance"
import { ReactNativeNavigationPlugin } from '@bugsnag/react-native-navigation-performance'
import { Navigation } from 'react-native-navigation'

const reactNativeNavigationPlugin = new ReactNativeNavigationPlugin(Navigation)

BugsnagPerformance.start({
    apiKey: "my-api-key",
    plugins: [reactNativeNavigationPlugin]
})

export function registerScreens() {
    Navigation.registerComponent('Screen 1', () => Screen1);
    Navigation.registerComponent('Screen 2', () => Screen2);

    Navigation.setRoot({
        root: {
            stack: {
                children: [
                    {
                        component: {
                            name: 'Screen 1'
                        }
                    }
                ]
            }
        }
    })
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
