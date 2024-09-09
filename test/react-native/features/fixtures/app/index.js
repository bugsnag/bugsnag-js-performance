import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import BugsnagPerformance from '@bugsnag/react-native-performance';
import {NativeScenarioLauncher} from '@bugsnag/react-native-performance-scenarios'

const startupConfig = NativeScenarioLauncher.readStartupConfig()
if (startupConfig) {
  BugsnagPerformance.start(startupConfig)
}

AppRegistry.registerComponent(appName, () => App);