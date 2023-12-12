const moduleNameMapper = require('./module-name-mapper')
const paths = require('./paths')

module.exports = {
  rootDir: '../../',
  preset: 'react-native',
  displayName: 'react-native',
  testMatch: ['<rootDir>/packages/platforms/react-native/tests/**/*.test.ts'],
  moduleNameMapper,
  transform: {
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        presets: ['module:metro-react-native-babel-preset']
      }
    ],
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: { paths },
        babelConfig: {
          presets: ['module:metro-react-native-babel-preset']
        }
      }
    ]
  }
}
