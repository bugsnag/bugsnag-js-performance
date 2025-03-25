import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import path from 'path'
import url from 'url'

import baseConfig, { isCdnBuild } from '../rollup.config.mjs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default {
  ...baseConfig,
  input: 'src/index.jsx',
  plugins: [
    nodeResolve({ browser: true, jail: path.resolve(`${__dirname}/../..`), extensions: ['.mjs', '.js', '.json', '.node', '.jsx'] }),
    babel({ 
      babelHelpers: 'bundled',
      presets: ['@babel/preset-react'],
      extensions: ['.js', '.jsx']
    }),
    commonjs(),
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    })
  ]
}
