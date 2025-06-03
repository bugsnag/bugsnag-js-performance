import jsx from 'acorn-jsx'
import fs from 'fs'
import createRollupConfig from '../../.rollup/index.mjs'

// output the react native turbo module spec file as a prebuilt chunk
function reactNativeSpecPlugin() {
  return {
    name: 'react-native-spec-plugin',
    buildStart() {
      this.emitFile({
        type: 'prebuilt-chunk',
        fileName: 'NativeBugsnagRemoteSpans.ts',
        code: fs.readFileSync('lib/NativeBugsnagRemoteSpans.ts', 'utf8')
      })
    }
  }
}

const config = createRollupConfig({
  external: [
    '@bugsnag/react-native-performance',
    'react-native',
    'react'
  ]
})

config.plugins = config.plugins.concat([reactNativeSpecPlugin()])
config.acornInjectPlugins = [jsx()]

export default config
