import PluginReactNavigationPerformance from '@bugsnag/plugin-react-navigation-performance';
import BugsnagPerformance from '@bugsnag/react-native-performance';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailsScreen from './DetailsScreen';
import HomeScreen from './HomeScreen';

const navigationPlugin = new PluginReactNavigationPerformance()
BugsnagPerformance.start({ apiKey: 'YOUR_API_KEY', plugins: [navigationPlugin] })

const Stack = createNativeStackNavigator()
const NavigationContainer = navigationPlugin.createNavigationContainer()

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App
