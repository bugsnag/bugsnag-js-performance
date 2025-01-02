import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, FlatList } from 'react-native'
import { NativeScenarioLauncher } from '../lib/native'
import BugsnagPerformance from '@bugsnag/react-native-performance'

export const doNotStartBugsnagPerformance = true

const listData = Array.from({ length: 1000 }, (_, index) => {  return { name: `Item ${index + 1}` } })

export const initialise = async (config) => {
  const nativeConfig = {
    apiKey: config.apiKey,
    endpoint: config.endpoint
  }

  await NativeScenarioLauncher.startNativePerformance(nativeConfig)

  BugsnagPerformance.attach({ maximumBatchSize: 1, autoInstrumentAppStarts: false, autoInstrumentNetworkRequests: false })
}

const Item = ({title}) => {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setShouldRender(true)
    }, 250)
  }, [])

  if (!shouldRender) {
    return null
  }

  return (
    <View style={styles.item}>
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

export const App = () => {
  let nativeSpan = BugsnagPerformance.startSpan('RenderingMetricsScenario', { isFirstClass: true })

  const renderItem = (item, index) => {
    if (nativeSpan && index === listData.length - 1) {
      nativeSpan.end()
      nativeSpan = null
    }

    return <Item title={item.name} />
  }

  return (
    <View style={styles.scenario}>
      <Text>Rendering Metrics Scenario</Text>
      <FlatList
        ref={(ref) => { this.flatListRef = ref }} 
        onContentSizeChange={()=> this.flatListRef.scrollToEnd()} 
        data={listData} 
        renderItem={({ item, index }) => renderItem(item, index)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scenario: {
    flex: 1
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32
  }
})
