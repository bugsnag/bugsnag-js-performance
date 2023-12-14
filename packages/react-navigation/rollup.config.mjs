import createRollupConfig from '../../.rollup/index.mjs'
import noTreeShakingPlugin from '../../.rollup/no-tree-shaking.plugin.mjs'
import jsx from 'acorn-jsx'

const config = createRollupConfig({
  external: [
    '@bugsnag/cuid',
    '@bugsnag/delivery-fetch-performance',
    '@bugsnag/react-native-performance',
    '@bugsnag/request-tracker-performance',
    '@react-native-community/netinfo',
    '@react-navigation/native',
    'react',
  ]
})

config.acornInjectPlugins = [jsx()]
config.plugins = config.plugins.concat([
  noTreeShakingPlugin(['create-navigation-container.tsx', 'navigation-context.tsx']
)])

export default config
