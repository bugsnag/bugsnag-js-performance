import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace';
import path from 'path'
import url from 'url'

import baseConfig, { isCdnBuild } from '../rollup.config.mjs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const cdnConfig = {
  // mark everything other than 'src/index.jsx' as an external module when
  // using the CDN build
  // this stops rollup trying to resolve these modules as we don't run
  // 'npm install' when using the CDN build to avoid accidentally testing
  // against NPM packages
  external: id => id !== 'src/index.js' && !id.endsWith('packages/named-spans/src/index.js'),
  output: {
    ...baseConfig.output,
    globals: {
      ...baseConfig.output.globals,
      '@bugsnag/plugin-named-spans': 'BugsnagPluginNamedSpans',
    },
  }
}

export default {
  ...baseConfig,
  input: 'src/index.js',
  plugins: [
    nodeResolve({ 
      browser: true, 
      jail: path.resolve(`${__dirname}/../..`), 
      extensions: ['.mjs', '.js', '.json', '.node'] 
    }),
    commonjs(),
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    })
  ],
  ...(isCdnBuild ? cdnConfig : {})
}
