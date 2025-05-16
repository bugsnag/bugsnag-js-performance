import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { CompleteNavigation } from '@bugsnag/plugin-react-navigation-performance'

export default function TabFourScreen() {
  const router = useRouter();

  const [loadingComplete, setLoadingComplete] = useState(false)

  useEffect(() => {
      setTimeout(() => {
          setLoadingComplete(true)
      }, 50)

      setTimeout(() => {
          router.navigate('./five')
      }, 250)
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Four</Text>
      {loadingComplete ? <CompleteNavigation on="mount" /> : null}
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
