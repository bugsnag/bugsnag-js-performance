/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import BugsnagPerformance from '@bugsnag/react-native-performance';
import { type PropsWithChildren } from 'react';
import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { version } from './package.json';

const YOUR_API_KEY = '';

BugsnagPerformance.start({
  appVersion: version,
  apiKey: YOUR_API_KEY
});

type SectionProps = PropsWithChildren<{
  title: string;
}>;


function Section({children, title}: SectionProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Image
          source={require('./icon.png')}
          style={{height: 96, width: 96, marginTop: 24, alignSelf: 'center'}}
        />
        <Text style={{padding: 24}}>
          Press the buttons below to test examples of BugSnag functionality. App
          start spans will be automatically started. Please make sure you have
          set your API key in App.tsx.
        </Text>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Custom span">
            <Button
              title="Send"
              onPress={() => {
                const span = BugsnagPerformance.startSpan('Custom span')
                setTimeout(() => {
                  span.end();
                }, 250)
              }}
            />
          </Section>
          <Section title="Network span">
            <Button
              title="Send"
              onPress={() => {
                fetch('https://picsum.photos/200').catch(err => {
                  // failed requests on android throw an error, so we catch it here
                });
              }}
            />
          </Section>
          <Section title="Navigation span">
              <Button
                title="Send"
                onPress={() => {
                  const span = BugsnagPerformance.startNavigationSpan('HomeScreen')
                  setTimeout(() => {
                    span.end()
                  }, 150)
                }}
              />
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
