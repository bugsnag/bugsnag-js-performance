import { CompleteNavigation } from "@bugsnag/plugin-react-navigation-performance";
import * as React from 'react';
import { Text, View } from "react-native";

function DetailsScreen() {
  return (
    <CompleteNavigation on="mount">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Details Screen</Text>
      </View>
    </CompleteNavigation>
  );
}

export default DetailsScreen
