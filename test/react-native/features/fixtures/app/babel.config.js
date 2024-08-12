module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['@babel/plugin-transform-export-namespace-from', 'module:react-native-dotenv', ['@babel/plugin-transform-private-methods', { loose: true }]]
}
