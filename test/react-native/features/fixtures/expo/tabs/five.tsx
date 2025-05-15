import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CompleteNavigation } from '@bugsnag/plugin-react-navigation-performance'

export default function TabFiveScreen() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
      setTimeout(() => {
          setLoading(false)
      }, 50)
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Five</Text>
      {loading ? <CompleteNavigation on="unmount" /> : null}
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
