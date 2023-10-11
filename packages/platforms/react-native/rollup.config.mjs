import fs from 'fs'
import createRollupConfig from '../../../.rollup/index.mjs'
import jsx from 'acorn-jsx'

// when functional components are used in JSX tags, rollup doesn't recognise them as actually being used and tree-shakes them away
// this plugin prevents that from happening by explicity telling rollup not to tree-shake the module
function noTreeShakingPlugin () {
  return {
    name: 'no-treeshaking-plugin',
    transform (code, id) {
      if (id.indexOf('app-start-plugin.tsx') >= 0) return { moduleSideEffects: 'no-treeshake' }
    }
  }
}

// output the react native turbo module spec file as a prebuilt chunk
function reactNativeSpecPlugin () {
  return {
    name: 'react-native-spec-plugin',
    buildStart () { 
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
    '@bugsnag/delivery-fetch-performance',
    'react-native',
    'react',
    '@bugsnag/cuid',
    'react-native-file-access',
    '@react-native-async-storage/async-storage', 
    '@bugsnag/request-tracker-performance'
  ]
})

config.plugins = config.plugins.concat([noTreeShakingPlugin(), reactNativeSpecPlugin()])
config.acornInjectPlugins = [jsx()]

export default config
