import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

export default function TabThreeScreen() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.navigate('./four')
    }, 250);
    
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Three</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
})
