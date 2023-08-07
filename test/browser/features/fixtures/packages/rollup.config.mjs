import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const isCdnBuild = process.env.USE_CDN_BUILD === "1" || process.env.USE_CDN_BUILD === "true"
const cdnOutputOptions = {
  // import BugsnagPerformance from the CDN build
  banner: process.env.DEBUG
    ? 'import BugsnagPerformance from "/bugsnag-performance.js"\n'
    : 'import BugsnagPerformance from "/bugsnag-performance.min.js"\n',
  globals: {
    '@bugsnag/browser-performance': 'BugsnagPerformance',
  },
}

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    ...(isCdnBuild ? cdnOutputOptions : {}),
  },
  plugins: [
    nodeResolve({ browser: true, jail: path.resolve(`${__dirname}/..`), extensions: ['.mjs', '.js', '.json', '.node', '.jsx'] }),
    commonjs(),
    babel({ babelHelpers: 'bundled' }),
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    })
  ],
  ...(isCdnBuild ? { external: ['@bugsnag/browser-performance'] } : {}),
  onLog (level, log, defaultHandler) {
    // turn warnings into errors
    if (level === 'warn') {
      level = 'error'
    }

    defaultHandler(level, log)
  },
}
