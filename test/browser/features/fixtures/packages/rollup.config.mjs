import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife'
  },
  plugins: [
    nodeResolve({ browser: true, jail: path.resolve(`${__dirname}/..`) }),
    commonjs()
  ],
  onLog (level, log, defaultHandler) {
    // turn warnings into errors
    if (level === 'warn') {
      level = 'error'
    }

    defaultHandler(level, log)
  },
}
