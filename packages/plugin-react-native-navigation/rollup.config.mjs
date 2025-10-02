import createRollupConfig from '../../.rollup/index.mjs'
import noTreeShakingPlugin from '../../.rollup/no-tree-shaking.plugin.mjs'

const config = createRollupConfig({
  external: [
    '@bugsnag/react-native-performance',
    'react-native-navigation',
    'react-native',
    'react'
  ]
})

config.plugins = config.plugins.concat([
  noTreeShakingPlugin(['CompleteNavigation.tsx'])
])

export default config
