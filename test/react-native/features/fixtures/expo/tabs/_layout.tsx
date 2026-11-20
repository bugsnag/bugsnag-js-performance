import React from 'react';
import { Tabs } from 'expo-router';

// This file replaces the tabs layout from the Expo template (see
// generate-expo-fixture.js). It deliberately depends on nothing from the
// template: icon packages come and go between template versions (tabs@57
// dropped @expo/vector-icons in favour of expo-symbols, which older templates
// do not ship), and the tests only need these routes to exist - screens
// navigate between them programmatically with expo-router.
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Tab One' }} />
      <Tabs.Screen name="two" options={{ title: 'Tab Two' }} />
      <Tabs.Screen name="three" options={{ title: 'Tab Three' }} />
      <Tabs.Screen name="four" options={{ title: 'Tab Four' }} />
      <Tabs.Screen name="five" options={{ title: 'Tab Five' }} />
    </Tabs>
  );
}
