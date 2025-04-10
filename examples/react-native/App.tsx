/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import BugsnagPerformance from '@bugsnag/react-native-performance';
import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Colors, Header } from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
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

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  /*
   * To keep the template simple and small we're adding padding to prevent view
   * from rendering under the System UI.
   * For bigger apps the reccomendation is to use `react-native-safe-area-context`:
   * https://github.com/AppAndFlow/react-native-safe-area-context
   *
   * You can read more about it here:
   * https://github.com/react-native-community/discussions-and-proposals/discussions/827
   */
  const safePadding = '5%';

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        style={{
          backgroundColor: backgroundStyle.backgroundColor,
          height: '100%'
        }}>
        <Image
          source={require('./icon.png')}
          style={{height: 96, width: 96, marginTop: 24, alignSelf: 'center'}}
        />
          <Section title="BugSnag Performance Monitoring for React Native">
            <Text style={styles.sectionDescription}>
            Set your API key in index.js and use the buttons below to send spans to your dashboard. App
          starts are instrumented automatically.
            </Text>
          </Section>
        <View
          style={{
            backgroundColor: backgroundStyle.backgroundColor,
            paddingHorizontal: safePadding,
            paddingBottom: safePadding,
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
