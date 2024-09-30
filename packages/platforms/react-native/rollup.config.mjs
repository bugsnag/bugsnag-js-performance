import jsx from 'acorn-jsx'
import fs from 'fs'
import createRollupConfig from '../../../.rollup/index.mjs'
import noTreeShakingPlugin from '../../../.rollup/no-tree-shaking.plugin.mjs'

// output the react native turbo module spec file as a prebuilt chunk
function reactNativeSpecPlugin() {
  return {
    name: 'react-native-spec-plugin',
    buildStart() {
      this.emitFile({
        type: 'prebuilt-chunk',
        fileName: 'NativeBugsnagPerformance.ts',
        code: fs.readFileSync('lib/NativeBugsnagPerformance.ts', 'utf8')
      })
    }
  }
}

const config = createRollupConfig({
  external: [
    '@bugsnag/create-navigation-span',
    '@bugsnag/cuid',
    '@bugsnag/delivery-fetch-performance',
    '@bugsnag/request-tracker-performance',
    '@react-native-community/netinfo',
    'react',
    'react-native',
    'react-native-file-access',
  ]
})

config.plugins = config.plugins.concat([noTreeShakingPlugin(['app-start-plugin.tsx']), reactNativeSpecPlugin()])
config.acornInjectPlugins = [jsx()]

export default config
