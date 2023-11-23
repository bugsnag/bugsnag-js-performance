import BugsnagPerformance from '@bugsnag/react-native-performance'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export const wrapperComponentProvider = () =>  ({ children }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text accessibilityLabel='wrapper-component' testID='wrapper-component'>WrapperComponentProviderScenario</Text>
        {children}
      </View>
    </SafeAreaView>
  )
}

export const config = {
  maximumBatchSize: 6
}

export const App = () => {
  return (
    <BugsnagPerformance.WrapperComponent>
      <Text accessibilityLabel='app-component' testID='app-component'>Wrapped App Component</Text>
    </BugsnagPerformance.WrapperComponent>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scenario: {
    flex: 1
  }
})
