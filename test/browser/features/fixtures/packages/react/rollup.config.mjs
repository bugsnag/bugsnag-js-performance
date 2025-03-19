import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default {
  input: 'src/index.jsx',
  output: {
    file: 'dist/bundle.js',
    format: 'iife'
  },
  plugins: [
    nodeResolve({
      extensions: ['.js', 'jsx'],
      browser: true,
      jail: path.resolve(`${__dirname}/../..`),
    }),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-react'],
      extensions: ['.js', '.jsx']
    }),
    commonjs(),
    replace({
      preventAssignment: false,
      'process.env.NODE_ENV': '"development"'
    })
  ],
  onLog (level, log, defaultHandler) {
    // turn warnings into errors
    if (level === 'warn') {
      level = 'error'
    }

    defaultHandler(level, log)
  }
}
