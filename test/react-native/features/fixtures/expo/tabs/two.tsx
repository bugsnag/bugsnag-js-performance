import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

export default function TabTwoScreen() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.navigate('./three')
    }, 250);
    
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Two</Text>
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
