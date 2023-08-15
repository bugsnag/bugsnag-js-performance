import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, View, Text} from 'react-native';
import { Scenario } from '@bugsnag/react-native-performance-scenarios';

function App(): JSX.Element {
  const [config, setConfig] = useState({});

  return (
    <SafeAreaView style={styles.container}>
      <Scenario />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default App;
