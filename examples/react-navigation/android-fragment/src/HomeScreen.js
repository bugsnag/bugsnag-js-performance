import { CompleteNavigation } from '@bugsnag/plugin-react-navigation-performance';
import * as React from 'react';
import { Button, Text, View } from "react-native";

function HomeScreen({ navigation }) {
  return (
    <CompleteNavigation on='mount'>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="See more"
          onPress={() => navigation.navigate('Details')}
        />
      </View>
    </CompleteNavigation>
  );
}

export default HomeScreen
