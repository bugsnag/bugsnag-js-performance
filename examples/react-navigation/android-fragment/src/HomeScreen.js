import * as React from 'react';
import { Button, Text, View } from "react-native";

function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button
        title="See more"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

export default HomeScreen
