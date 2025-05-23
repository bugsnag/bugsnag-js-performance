import createRollupConfig from '../../.rollup/index.mjs'
import noTreeShakingPlugin from '../../.rollup/no-tree-shaking.plugin.mjs'
import jsx from 'acorn-jsx'

const config = createRollupConfig({
  external: [
    '@bugsnag/react-native-performance',
    '@react-navigation/native',
    '@react-navigation/native-stack',
    'react'
  ]
})

config.acornInjectPlugins = [jsx()]
config.plugins = config.plugins.concat([
  noTreeShakingPlugin(['create-navigation-container.tsx', 'complete-navigation.tsx']
)])

export default config
