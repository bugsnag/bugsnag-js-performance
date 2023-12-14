import createRollupConfig from '../../.rollup/index.mjs'
import noTreeShakingPlugin from '../../.rollup/no-tree-shaking.plugin.mjs'
import jsx from 'acorn-jsx'

const config = createRollupConfig({
  external: [
    '@bugsnag/cuid',
    '@bugsnag/react-native-performance',
    '@react-navigation/native',
    '@react-native-community/netinfo',
    'react',
  ]
})

config.acornInjectPlugins = [jsx()]
config.plugins = config.plugins.concat([
  noTreeShakingPlugin(['create-navigation-container.tsx', 'navigation-context.tsx']
)])

export default config
