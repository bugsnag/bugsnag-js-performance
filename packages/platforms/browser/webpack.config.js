const path = require('path')
const pkg = require('./package.json')
const { DefinePlugin } = require('webpack')

module.exports = {
  entry: './lib/index.ts',
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bugsnag-performance.min.js',
    library: {
      name: 'BugsnagPerformance',
      type: 'umd',
      export: 'default'
    }
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        loader: 'ts-loader'
      }
    ]
  },
  plugins: [new DefinePlugin({
    __VERSION__: JSON.stringify(pkg.version)
  })]
}
