/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import BugsnagPerformance from "@bugsnag/react-native-performance";

BugsnagPerformance.start('YOUR_API_KEY');

AppRegistry.registerComponent(appName, () => App);
