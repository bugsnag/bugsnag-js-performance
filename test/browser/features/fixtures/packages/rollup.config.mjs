import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const isCdnBuild = process.env.BUILD_MODE.toUpperCase() === "CDN"

const cdnOutputOptions = {
  // import BugsnagPerformance from the CDN build
  banner: process.env.DEBUG
    ? 'import BugsnagPerformance from "/docs/bugsnag-performance.js"\n'
    : 'import BugsnagPerformance from "/docs/bugsnag-performance.min.js"\n',
  globals: {
    '@bugsnag/browser-performance': 'BugsnagPerformance'
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
    nodeResolve({ browser: true, jail: path.resolve(`${__dirname}/..`) }),
    commonjs()
  ],
  ...(isCdnBuild ? { external: ['@bugsnag/browser-performance', '@bugsnag/react-router-performance'] } : {}),
  onLog (level, log, defaultHandler) {
    // turn warnings into errors
    if (level === 'warn') {
      level = 'error'
    }

    defaultHandler(level, log)
  },
}
